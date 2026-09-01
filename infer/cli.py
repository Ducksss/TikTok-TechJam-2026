"""SynthFlag batch inference command."""

from __future__ import annotations

import argparse
from importlib.metadata import version as installed_version
from pathlib import Path

import torch
from PIL import Image
from tqdm.auto import tqdm

from . import __version__
from .checkpoints import checkpoint_identity_digest, verify_checkpoint_files
from .model import Model, resolve_device
from .outputs import (
    CSV_FIELDS,
    append_prediction_rows,
    discover_images,
    output_directory_lock,
    prepare_artifacts,
    write_json_atomically,
    write_submission_json,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="synthflag-infer",
        description=(
            "Score an image directory with SynthFlag's checkpoint-compatible "
            "four-expert detector."
        ),
    )
    parser.add_argument("--images-dir", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--weights-dir", required=True, type=Path)
    parser.add_argument("--batch-size", default=1, type=int)
    parser.add_argument("--save-every", default=100, type=int)
    parser.add_argument(
        "--device",
        default="auto",
        help="auto, cpu, mps, cuda, cuda:0, ...",
    )
    parser.add_argument("--no-amp", action="store_true", help="disable CUDA autocast")
    parser.add_argument(
        "--skip-hash-check",
        action="store_true",
        help="skip checkpoint SHA-256 checks for a trusted local copy",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="replace prior artifacts instead of resuming them",
    )
    return parser


def _load_rgb_image(image_path: Path) -> Image.Image:
    try:
        with Image.open(image_path) as source:
            return source.convert("RGB")
    except Exception as exc:
        raise RuntimeError(f"failed to decode image: {image_path}") from exc


def _run_metadata(
    *,
    images_dir: Path,
    weights_dir: Path,
    device: torch.device,
    use_amp: bool,
    hashes_verified: bool,
    batch_size: int,
) -> dict[str, object]:
    return {
        "format_version": 2,
        "inference_protocol": "two-clip-two-siglip-probability-mean-v1",
        "package_version": __version__,
        "images_dir": str(images_dir),
        "checkpoint_identity_sha256": checkpoint_identity_digest(
            weights_dir,
            use_manifest=hashes_verified,
        ),
        "checkpoint_hashes_verified": hashes_verified,
        "device": str(device),
        "cuda_autocast": use_amp,
        "batch_size": batch_size,
        "runtime": {
            "torch": torch.__version__,
            "torchvision": installed_version("torchvision"),
            "transformers": installed_version("transformers"),
            "pillow": installed_version("pillow"),
        },
        "preprocessing": "bicubic-short-edge-resize-center-crop-v1",
        "score": "arithmetic mean of four P(fake), class index 1",
    }


def run(args: argparse.Namespace) -> None:
    images_dir = args.images_dir.expanduser().resolve()
    weights_dir = args.weights_dir.expanduser().resolve()
    out_dir = args.out_dir.expanduser().resolve()
    device = resolve_device(args.device)
    use_amp = bool(not args.no_amp and device.type == "cuda")
    image_paths = discover_images(images_dir)

    verify_hashes = not args.skip_hash_check
    verify_checkpoint_files(weights_dir, verify_hashes=verify_hashes)
    metadata = _run_metadata(
        images_dir=images_dir,
        weights_dir=weights_dir,
        device=device,
        use_amp=use_amp,
        hashes_verified=verify_hashes,
        batch_size=args.batch_size,
    )

    with output_directory_lock(out_dir):
        artifacts, completed = prepare_artifacts(
            out_dir,
            overwrite=args.overwrite,
            metadata=metadata,
        )
        remaining = [
            image_path
            for image_path in image_paths
            if image_path.relative_to(images_dir).as_posix() not in completed
        ]
        if not remaining:
            write_submission_json(artifacts.csv, artifacts.submission_json)
            print(f"All {len(image_paths)} images are already present in {artifacts.csv}")
            print(f"Submission JSON: {artifacts.submission_json}")
            return

        artifacts.submission_json.unlink(missing_ok=True)
        print(f"Images: {len(image_paths)} total, {len(completed)} already processed")
        model = Model(
            device=device,
            model_data_dir=weights_dir,
            # The preflight above already performed the optional 5.86 GB hash pass.
            verify_hashes=False,
            use_amp=use_amp,
        )
        if not artifacts.metadata_json.exists():
            write_json_atomically(artifacts.metadata_json, metadata)
        print(f"Device: {model.device}; CUDA autocast: {model.use_amp}")

        pending_rows: list[tuple[str, float]] = []
        with tqdm(
            total=len(remaining),
            desc="Inference",
            unit="img",
            dynamic_ncols=True,
        ) as progress:
            for batch_start in range(0, len(remaining), args.batch_size):
                batch_paths = remaining[batch_start : batch_start + args.batch_size]
                batch_images = [_load_rgb_image(image_path) for image_path in batch_paths]
                scores = model.predict_pil(batch_images).detach().cpu()
                if scores.shape != (len(batch_paths),) or not bool(
                    torch.isfinite(scores).all()
                ):
                    raise RuntimeError("inference returned an invalid score batch")
                pending_rows.extend(
                    (
                        image_path.relative_to(images_dir).as_posix(),
                        float(score),
                    )
                    for image_path, score in zip(batch_paths, scores, strict=True)
                )
                progress.update(len(batch_paths))
                if len(pending_rows) >= args.save_every:
                    append_prediction_rows(artifacts.csv, pending_rows)
                    pending_rows.clear()

        append_prediction_rows(artifacts.csv, pending_rows)
        write_submission_json(artifacts.csv, artifacts.submission_json)
        print(f"Finished: {artifacts.csv}")
        print(f"Submission JSON: {artifacts.submission_json}")


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.batch_size <= 0:
        parser.error("--batch-size must be positive")
    if args.save_every <= 0:
        parser.error("--save-every must be positive")
    run(args)


__all__ = ["CSV_FIELDS", "build_parser", "main", "run", "write_submission_json"]
