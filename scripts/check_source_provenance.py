#!/usr/bin/env python3
"""Reject byte-identical audited upstream source from the SynthFlag tree."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT_MANIFEST = ROOT / "scripts/upstream-source-audit.json"


def candidate_files() -> list[Path]:
    result = subprocess.run(
        [
            "git",
            "ls-files",
            "--cached",
            "--others",
            "--exclude-standard",
            "-z",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [
        ROOT / raw.decode("utf-8")
        for raw in result.stdout.split(b"\0")
        if raw and (ROOT / raw.decode("utf-8")).is_file()
    ]


def find_identical_upstream_files() -> list[tuple[str, list[str]]]:
    manifest = json.loads(AUDIT_MANIFEST.read_text(encoding="utf-8"))
    source_files = manifest["files"]
    allowed_paths = set(manifest["allowed_identical_paths"])
    upstream_by_digest: dict[str, list[str]] = defaultdict(list)
    for source_path, digest in source_files.items():
        upstream_by_digest[digest].append(source_path)

    matches = []
    for current_file in candidate_files():
        digest = hashlib.sha256(current_file.read_bytes()).hexdigest()
        current_path = current_file.relative_to(ROOT).as_posix()
        prohibited_matches = [
            upstream_path
            for upstream_path in upstream_by_digest.get(digest, [])
            if not (
                upstream_path in allowed_paths and current_path == upstream_path
            )
        ]
        if prohibited_matches:
            matches.append(
                (
                    current_path,
                    prohibited_matches,
                )
            )
    return matches


def main() -> int:
    matches = find_identical_upstream_files()
    if matches:
        print("Source provenance check failed:", file=sys.stderr)
        for current_path, upstream_paths in matches:
            print(
                f"- {current_path} is byte-identical to upstream "
                + ", ".join(upstream_paths),
                file=sys.stderr,
            )
        return 1

    manifest = json.loads(AUDIT_MANIFEST.read_text(encoding="utf-8"))
    print("Source provenance check passed.")
    print(
        "- upstream owner: {}/{}".format(
            manifest["source_host"], manifest["source_owner"]
        )
    )
    print(f"- audited commit: {manifest['source_commit']}")
    print(f"- current files scanned: {len(candidate_files())}")
    print("- canonical Apache-2.0 LICENSE is the only allowed identical file")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
