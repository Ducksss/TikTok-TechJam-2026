#!/usr/bin/env python3
"""Verify vendored research report provenance, files, and SHA-256 manifests."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REFERENCE_ROOT = ROOT / "docs" / "references"
SNAPSHOTS = ("featdistill-report", "ntire-2026-report")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def load_sums(path: Path) -> dict[str, str]:
    entries: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        digest, relative = line.split(maxsplit=1)
        normalized = relative.removeprefix("*").removeprefix("./")
        if normalized in entries:
            raise ValueError(f"duplicate checksum path: {path}: {normalized}")
        entries[normalized] = digest
    return entries


def verify_snapshot(name: str) -> int:
    directory = REFERENCE_ROOT / name
    metadata = json.loads((directory / "source.json").read_text(encoding="utf-8"))
    arxiv_id = metadata["arxiv_id"]
    version = metadata["version"]
    if metadata["license"]["spdx"] != "CC-BY-4.0":
        raise ValueError(f"unexpected license in {name}")

    html_text = (directory / "report.html").read_text(encoding="utf-8")
    if f"arXiv:{arxiv_id}{version}" not in html_text or "CC BY 4.0" not in html_text:
        raise ValueError(f"paper identity or license missing from {name}/report.html")

    declared_files = metadata["files"]
    for relative, identity in declared_files.items():
        path = directory / relative
        if path.stat().st_size != identity["bytes"]:
            raise ValueError(f"byte-size mismatch: {path}")
        if sha256(path) != identity["sha256"]:
            raise ValueError(f"metadata SHA-256 mismatch: {path}")

    for relative in metadata["figure_files"]:
        path = directory / relative
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"missing or empty figure: {path}")

    expected_paths = {
        path.relative_to(directory).as_posix()
        for path in directory.rglob("*")
        if path.is_file() and path.name not in {"README.md", "SHA256SUMS"}
    }
    checksums = load_sums(directory / "SHA256SUMS")
    if set(checksums) != expected_paths:
        missing = sorted(expected_paths - set(checksums))
        extra = sorted(set(checksums) - expected_paths)
        raise ValueError(f"checksum manifest mismatch in {name}: missing={missing}, extra={extra}")
    for relative, expected in checksums.items():
        if sha256(directory / relative) != expected:
            raise ValueError(f"SHA256SUMS mismatch: {directory / relative}")
    return len(expected_paths)


def main() -> None:
    total = sum(verify_snapshot(name) for name in SNAPSHOTS)
    print(f"Verified {len(SNAPSHOTS)} report snapshots and {total} source artifacts.")


if __name__ == "__main__":
    main()
