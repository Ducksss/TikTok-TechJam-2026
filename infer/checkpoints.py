"""Checkpoint identity, validation, and deserialization boundaries."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from pathlib import Path

import torch


CHECKPOINT_FILENAMES = (
    "Expert_4_siglip.pth",
    "cifake_router_head.pt",
    "general_epoch05_head.pt",
    "general_epoch08_head.pt",
)
CHECKPOINT_MANIFEST = "manifest.json"
_HASH_BUFFER_BYTES = 8 * 1024 * 1024


def file_sha256(file_path: str | Path) -> str:
    """Return the SHA-256 digest of a file without loading it all into memory."""

    digest = hashlib.sha256()
    with Path(file_path).open("rb") as source:
        for block in iter(lambda: source.read(_HASH_BUFFER_BYTES), b""):
            digest.update(block)
    return digest.hexdigest()


def _read_manifest(directory: Path) -> dict[str, object]:
    manifest_path = directory / CHECKPOINT_MANIFEST
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"checkpoint manifest not found: {manifest_path}") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"checkpoint manifest is not valid JSON: {manifest_path}") from exc
    if manifest.get("schema_version") != 2 or not isinstance(manifest.get("files"), dict):
        raise ValueError(f"unsupported checkpoint manifest schema: {manifest_path}")
    return manifest


def _checkpoint_paths(directory: Path) -> dict[str, Path]:
    paths = {filename: directory / filename for filename in CHECKPOINT_FILENAMES}
    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "required checkpoint files are missing:\n  " + "\n  ".join(missing)
        )
    return paths


def _manifest_identity(entries: dict[str, object], filename: str) -> tuple[int, str]:
    record = entries.get(filename)
    if not isinstance(record, dict):
        raise ValueError(f"checkpoint manifest has no record for {filename}")
    expected_bytes = record.get("size_bytes")
    expected_digest = record.get("sha256")
    if not isinstance(expected_bytes, int) or expected_bytes <= 0:
        raise ValueError(f"checkpoint manifest has an invalid size for {filename}")
    if not isinstance(expected_digest, str):
        raise ValueError(f"checkpoint manifest has an invalid SHA-256 for {filename}")
    expected_digest = expected_digest.lower()
    if len(expected_digest) != 64 or set(expected_digest) - set("0123456789abcdef"):
        raise ValueError(f"checkpoint manifest has an invalid SHA-256 for {filename}")
    return expected_bytes, expected_digest


def verify_checkpoint_files(
    weights_dir: str | Path,
    *,
    verify_hashes: bool = True,
) -> dict[str, Path]:
    """Resolve Expert 4 and all three residual heads and verify their identities."""

    directory = Path(weights_dir).expanduser().resolve()
    if not directory.is_dir():
        raise FileNotFoundError(f"weights directory not found: {directory}")
    checkpoints = _checkpoint_paths(directory)
    if not verify_hashes:
        return checkpoints
    manifest = _read_manifest(directory)
    entries = manifest["files"]
    assert isinstance(entries, dict)
    for filename, file_path in checkpoints.items():
        expected_bytes, expected_digest = _manifest_identity(entries, filename)
        observed_bytes = file_path.stat().st_size
        if observed_bytes != expected_bytes:
            raise ValueError(
                f"checkpoint size mismatch for {filename}: expected {expected_bytes}, "
                f"observed {observed_bytes}"
            )
        observed_digest = file_sha256(file_path)
        if observed_digest != expected_digest:
            raise ValueError(
                f"checkpoint SHA-256 mismatch for {filename}: expected "
                f"{expected_digest}, observed {observed_digest}"
            )
    return checkpoints


def checkpoint_identity_digest(
    weights_dir: str | Path,
    *,
    use_manifest: bool = True,
) -> str:
    """Identify the selected graph without incorporating mutable download URLs."""

    directory = Path(weights_dir).expanduser().resolve()
    if use_manifest:
        manifest = _read_manifest(directory)
        entries = manifest["files"]
        assert isinstance(entries, dict)
        identity = {}
        for filename in CHECKPOINT_FILENAMES:
            size_bytes, digest = _manifest_identity(entries, filename)
            identity[filename] = {"sha256": digest, "size_bytes": size_bytes}
    else:
        checkpoints = _checkpoint_paths(directory)
        identity = {
            filename: {
                "modified_time_ns": path.stat().st_mtime_ns,
                "size_bytes": path.stat().st_size,
            }
            for filename, path in checkpoints.items()
        }
    canonical = json.dumps(
        identity,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def load_expert_state(checkpoint_path: Path) -> Mapping[str, torch.Tensor]:
    """Load the tensor-only Expert 4 state dictionary using PyTorch safe mode."""

    payload = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    if isinstance(payload, Mapping) and "model_state_dict" in payload:
        payload = payload["model_state_dict"]
    if not isinstance(payload, Mapping) or not payload:
        raise ValueError(f"checkpoint does not contain a state dictionary: {checkpoint_path}")
    if any(
        not isinstance(name, str) or not isinstance(tensor, torch.Tensor)
        for name, tensor in payload.items()
    ):
        raise ValueError(
            f"checkpoint state dictionary must contain tensors only: {checkpoint_path}"
        )
    return payload
