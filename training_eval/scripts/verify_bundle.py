"""Verify SHA-256, byte size and residual-head structure for a weight bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

try:
    from .model import checkpoint_tensor_shapes
except ImportError:  # direct script execution
    from model import checkpoint_tensor_shapes


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def _entries(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("files", "artifacts"):
        if isinstance(manifest.get(key), list):
            return list(manifest[key])
    if isinstance(manifest.get("heads"), dict):
        return [dict(value, name=name) for name, value in manifest["heads"].items()]
    raise ValueError("manifest requires a files/artifacts list or heads mapping")


def _safe_path(base: Path, relative: str) -> Path:
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ValueError(f"unsafe manifest path: {relative!r}")
    resolved = (base / candidate).resolve()
    if resolved != base and base not in resolved.parents:
        raise ValueError(f"manifest path escapes bundle: {relative!r}")
    return resolved


def verify_manifest(manifest_path: str | Path) -> dict[str, Any]:
    manifest_path = Path(manifest_path).resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    base = manifest_path.parent
    results: list[dict[str, Any]] = []
    for entry in _entries(manifest):
        relative = str(entry.get("path") or entry.get("filename") or "")
        if not relative:
            raise ValueError("manifest entry has no path/filename")
        path = _safe_path(base, relative)
        if not path.is_file():
            raise FileNotFoundError(path)
        expected_hash = str(entry.get("sha256") or "").lower()
        actual_hash = sha256_file(path)
        if len(expected_hash) != 64 or actual_hash != expected_hash:
            raise ValueError(f"SHA-256 mismatch for {relative}")
        expected_size = entry.get("size_bytes")
        if expected_size is not None and path.stat().st_size != int(expected_size):
            raise ValueError(f"byte-size mismatch for {relative}")
        role = str(entry.get("role") or entry.get("type") or "").lower()
        tensor_shapes = None
        if entry.get("verify_checkpoint") is True or "head" in role:
            tensor_shapes = checkpoint_tensor_shapes(path)
        results.append(
            {
                "path": relative,
                "size_bytes": path.stat().st_size,
                "sha256": actual_hash,
                "checkpoint_tensor_shapes": tensor_shapes,
            }
        )
    return {"valid": True, "manifest": manifest_path.name, "files": results}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()
    print(json.dumps(verify_manifest(args.manifest), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
