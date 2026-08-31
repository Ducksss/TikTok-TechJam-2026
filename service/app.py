"""Stateless HTTP access to SynthFlag's FeatDistill-compatible runtime."""

from __future__ import annotations

import asyncio
import io
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from infer import __version__
from infer.model import Model, checkpoint_identity_digest


MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 50_000_000
ACCEPTED_TYPES = {"image/jpeg", "image/png", "image/webp"}
DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://synthflag.chaipinzheng353496.chatgpt.site",
)

_model: Model | None = None
_model_lock = asyncio.Lock()
_inference_lock = asyncio.Lock()
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
        "device": _device(),
        "model": "FeatDistill four-expert ensemble",
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
    model = await _get_model()
    started = time.perf_counter()
    async with _inference_lock:
        score_tensor = await asyncio.to_thread(model.predict_pil, [decoded])
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    score = float(score_tensor.detach().cpu()[0])

    return {
        "checkpoint": _checkpoint_digest,
        "model": "FeatDistill four-expert ensemble",
        "processing_ms": elapsed_ms,
        "score": score,
        "threshold": 0.5,
        "version": __version__,
    }
