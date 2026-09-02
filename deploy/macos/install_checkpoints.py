#!/usr/bin/env python3
"""Install the four hash-pinned TEST1 checkpoint files outside Git."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path


HEAD_FILES = (
    "cifake_router_head.pt",
    "general_epoch05_head.pt",
    "general_epoch08_head.pt",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def require_identity(path: Path, *, size: int, digest: str) -> None:
    if not path.is_file():
        raise FileNotFoundError(path)
    if path.stat().st_size != size:
        raise ValueError(
            f"size mismatch for {path.name}: expected {size}, observed {path.stat().st_size}"
        )
    observed = sha256(path)
    if observed != digest:
        raise ValueError(
            f"SHA-256 mismatch for {path.name}: expected {digest}, observed {observed}"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--weights-dir", required=True, type=Path)
    parser.add_argument("--expert4-file", required=True, type=Path)
    parser.add_argument("--head-bundle-file", required=True, type=Path)
    args = parser.parse_args()

    manifest_path = args.repo / "infer" / "checkpoint_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    distribution = manifest["distribution"]
    files = manifest["files"]
    require_identity(
        args.expert4_file,
        size=files["Expert_4_siglip.pth"]["size_bytes"],
        digest=files["Expert_4_siglip.pth"]["sha256"],
    )
    require_identity(
        args.head_bundle_file,
        size=distribution["head_bundle_size_bytes"],
        digest=distribution["head_bundle_sha256"],
    )

    weights_dir = args.weights_dir.resolve()
    weights_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    with tempfile.TemporaryDirectory(
        prefix="checkpoint-install-", dir=weights_dir.parent
    ) as temporary:
        staging = Path(temporary)
        shutil.copy2(args.expert4_file, staging / "Expert_4_siglip.pth")
        with zipfile.ZipFile(args.head_bundle_file) as archive:
            members = {
                Path(info.filename).name: info
                for info in archive.infolist()
                if not info.is_dir()
            }
            for filename in HEAD_FILES:
                info = members.get(filename)
                if info is None:
                    raise ValueError(f"head bundle is missing {filename}")
                with archive.open(info) as source, (staging / filename).open("wb") as target:
                    shutil.copyfileobj(source, target)
        shutil.copy2(manifest_path, staging / "manifest.json")

        for filename, record in files.items():
            require_identity(
                staging / filename,
                size=record["size_bytes"],
                digest=record["sha256"],
            )

        for filename in (*files, "manifest.json"):
            destination = weights_dir / filename
            source = staging / filename
            if destination.exists():
                if destination.is_file() and sha256(destination) == sha256(source):
                    continue
                raise FileExistsError(
                    f"refusing to replace a different existing file: {destination}"
                )
            source.replace(destination)
            destination.chmod(0o600)

    print(f"Installed and verified {len(files)} checkpoint files in {weights_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
