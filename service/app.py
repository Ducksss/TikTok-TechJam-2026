"""Stateless HTTP access to SynthFlag's checkpoint-compatible runtime."""

from __future__ import annotations

import asyncio
import io
import json
import math
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from infer import __version__
from infer.model import Model, checkpoint_identity_digest


MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_FRAME_BYTES = 2 * 1024 * 1024
MAX_FRAME_PAYLOAD_BYTES = 16 * 1024 * 1024
MAX_VIDEO_DURATION_MS = 10_000
MIN_VIDEO_DURATION_MS = 1_000
MAX_VIDEO_FRAMES = 8
FRAME_MICROBATCH_SIZE = 2
MAX_INFERENCE_SLOTS = 2
INFERENCE_ADMISSION_TIMEOUT_SECONDS = 0.05
MAX_IMAGE_PIXELS = 50_000_000
ACCEPTED_TYPES = {"image/jpeg", "image/png", "image/webp"}
SERVICE_THRESHOLD = 0.5
DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://synthflag.chaipinzheng353496.chatgpt.site",
)

_model: Model | None = None
_model_lock = asyncio.Lock()
_inference_lock = asyncio.Lock()
_inference_slots = asyncio.Semaphore(MAX_INFERENCE_SLOTS)
_checkpoint_digest: str | None = None


def _weights_dir() -> Path:
    return (
        Path(os.environ.get("SYNTHFLAG_WEIGHTS_DIR", "weights"))
        .expanduser()
        .resolve()
    )


def _device() -> str:
    requested = os.environ.get("SYNTHFLAG_DEVICE")
    if requested:
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


async def _get_model() -> Model:
    global _checkpoint_digest, _model
    if _model is not None:
        return _model
    async with _model_lock:
        if _model is None:
            root = _weights_dir()
            _model = await asyncio.to_thread(
                Model,
                device=_device(),
                model_data_dir=root,
                verify_hashes=os.environ.get("SYNTHFLAG_SKIP_HASH_CHECK") != "1",
                use_amp=True,
            )
            _checkpoint_digest = checkpoint_identity_digest(root)[:12]
    return _model


@asynccontextmanager
async def _inference_admission():
    try:
        await asyncio.wait_for(
            _inference_slots.acquire(),
            timeout=INFERENCE_ADMISSION_TIMEOUT_SECONDS,
        )
    except TimeoutError as exc:
        raise HTTPException(
            status_code=429,
            detail="The detector is busy. Wait briefly and try again.",
            headers={"Retry-After": "5"},
        ) from exc
    try:
        yield
    finally:
        _inference_slots.release()


def _decode_image(contents: bytes) -> Image.Image:
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    try:
        with Image.open(io.BytesIO(contents)) as source:
            width, height = source.size
            if width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=413, detail="Image dimensions are too large."
                )
            source.verify()
        with Image.open(io.BytesIO(contents)) as source:
            width, height = source.size
            if width < 32 or height < 32:
                raise HTTPException(
                    status_code=422,
                    detail="Image dimensions must be at least 32 px.",
                )
            return source.convert("RGB")
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=413, detail="Image dimensions are too large."
        ) from exc
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is not a decodable image.",
        ) from exc


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.environ.get("SYNTHFLAG_EAGER_LOAD") == "1":
        await _get_model()
    yield


app = FastAPI(
    description="Checkpoint-backed image analysis for the SynthFlag demo.",
    lifespan=lifespan,
    title="SynthFlag inference",
    version=__version__,
)

allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "SYNTHFLAG_ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    allow_origins=allowed_origins,
)


@app.get("/health")
async def health() -> dict:
    return {
        "capabilities": {
            "image": {
                "accepted_mime_types": sorted(ACCEPTED_TYPES),
                "endpoint": "/v1/analyze",
                "max_bytes": MAX_FILE_BYTES,
            },
            "sampled_video_frames": {
                "accepted_mime_types": sorted(ACCEPTED_TYPES),
                "aggregation": "arithmetic_mean",
                "endpoint": "/v1/analyze-frames",
                "max_duration_ms": MAX_VIDEO_DURATION_MS,
                "max_frame_bytes": MAX_FRAME_BYTES,
                "max_frames": MAX_VIDEO_FRAMES,
                "max_payload_bytes": MAX_FRAME_PAYLOAD_BYTES,
                "min_duration_ms": MIN_VIDEO_DURATION_MS,
                "visual_only": True,
            },
        },
        "device": _device(),
        "model": "SynthFlag four-expert ensemble",
        "ready": _model is not None,
        "service": "SynthFlag inference",
        "version": __version__,
    }


@app.post("/v1/analyze")
async def analyze(image: UploadFile = File(...)) -> dict:
    if image.content_type not in ACCEPTED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    contents = await image.read(MAX_FILE_BYTES + 1)
    await image.close()
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413, detail="The image must be 10 MB or smaller."
        )

    decoded = await asyncio.to_thread(_decode_image, contents)
    async with _inference_admission():
        model = await _get_model()
        started = time.perf_counter()
        async with _inference_lock:
            score_tensor = await asyncio.to_thread(model.predict_pil, [decoded])
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    score = float(score_tensor.detach().cpu()[0])

    return {
        "checkpoint": _checkpoint_digest,
        "model": "SynthFlag four-expert ensemble",
        "processing_ms": elapsed_ms,
        "score": score,
        "threshold": SERVICE_THRESHOLD,
        "version": __version__,
    }


def _parse_frame_timestamps(
    serialized: str,
    *,
    duration_ms: int,
    frame_count: int,
) -> list[int]:
    try:
        timestamps = json.loads(serialized)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=422,
            detail="timestamps_ms must be a JSON array of integer milliseconds.",
        ) from exc
    if not isinstance(timestamps, list) or len(timestamps) != frame_count:
        raise HTTPException(
            status_code=422,
            detail="timestamps_ms must contain one timestamp for every frame.",
        )
    if any(not isinstance(value, int) or isinstance(value, bool) for value in timestamps):
        raise HTTPException(
            status_code=422,
            detail="Every frame timestamp must be an integer number of milliseconds.",
        )
    if any(value < 0 or value > duration_ms for value in timestamps):
        raise HTTPException(
            status_code=422,
            detail="Frame timestamps must fall within the video duration.",
        )
    if any(current >= following for current, following in zip(timestamps, timestamps[1:])):
        raise HTTPException(
            status_code=422,
            detail="Frame timestamps must be strictly increasing.",
        )
    return timestamps


async def _read_frame_uploads(frames: list[UploadFile]) -> list[Image.Image]:
    decoded: list[Image.Image] = []
    total_bytes = 0
    try:
        for frame in frames:
            if frame.content_type not in ACCEPTED_TYPES:
                raise HTTPException(
                    status_code=415,
                    detail="Video frames must be JPEG, PNG, or WebP images.",
                )
            contents = await frame.read(MAX_FRAME_BYTES + 1)
            if len(contents) > MAX_FRAME_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="Each sampled frame must be 2 MB or smaller.",
                )
            total_bytes += len(contents)
            if total_bytes > MAX_FRAME_PAYLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="The sampled-frame payload must be 16 MB or smaller.",
                )
            decoded.append(await asyncio.to_thread(_decode_image, contents))
    finally:
        for frame in frames:
            await frame.close()
    return decoded


@app.post("/v1/analyze-frames")
async def analyze_frames(
    frames: Annotated[list[UploadFile], File(...)],
    timestamps_ms: Annotated[str, Form(...)],
    duration_ms: Annotated[int, Form(...)],
) -> dict:
    frame_count = len(frames)
    if frame_count < 1 or frame_count > MAX_VIDEO_FRAMES:
        for frame in frames:
            await frame.close()
        raise HTTPException(
            status_code=422,
            detail="Choose between 1 and 8 sampled frames.",
        )
    if duration_ms < MIN_VIDEO_DURATION_MS or duration_ms > MAX_VIDEO_DURATION_MS:
        for frame in frames:
            await frame.close()
        raise HTTPException(
            status_code=422,
            detail="Video duration must be between 1 and 10 seconds.",
        )
    try:
        timestamps = _parse_frame_timestamps(
            timestamps_ms,
            duration_ms=duration_ms,
            frame_count=frame_count,
        )
    except HTTPException:
        for frame in frames:
            await frame.close()
        raise
    decoded = await _read_frame_uploads(frames)
    async with _inference_admission():
        model = await _get_model()
        started = time.perf_counter()
        scores: list[float] = []
        async with _inference_lock:
            for start in range(0, frame_count, FRAME_MICROBATCH_SIZE):
                batch = decoded[start : start + FRAME_MICROBATCH_SIZE]
                score_tensor = await asyncio.to_thread(model.predict_pil, batch)
                scores.extend(
                    float(value) for value in score_tensor.detach().cpu().tolist()
                )
    elapsed_ms = round((time.perf_counter() - started) * 1000)

    if len(scores) != frame_count or any(
        not math.isfinite(score) or score < 0.0 or score > 1.0 for score in scores
    ):
        raise HTTPException(
            status_code=500,
            detail="The detector returned invalid sampled-frame scores.",
        )

    peak_frame_index = max(range(frame_count), key=scores.__getitem__)
    mean_score = sum(scores) / frame_count
    frame_scores = [
        {
            "index": index,
            "score": score,
            "timestamp_ms": timestamps[index],
        }
        for index, score in enumerate(scores)
    ]

    return {
        "aggregation": "arithmetic_mean",
        "analysis_type": "sampled_video_frames",
        "checkpoint": _checkpoint_digest,
        "duration_ms": duration_ms,
        "frame_scores": frame_scores,
        "model": "SynthFlag four-expert ensemble",
        "processing_ms": elapsed_ms,
        "sample_count": frame_count,
        "summary": {
            "above_threshold_count": sum(
                score >= SERVICE_THRESHOLD for score in scores
            ),
            "mean_score": mean_score,
            "peak_frame_index": peak_frame_index,
            "peak_score": scores[peak_frame_index],
            "peak_timestamp_ms": timestamps[peak_frame_index],
        },
        "threshold": SERVICE_THRESHOLD,
        "version": __version__,
    }
