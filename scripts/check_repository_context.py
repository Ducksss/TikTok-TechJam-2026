#!/usr/bin/env python3
"""Check the maintained SynthFlag agent/context contract for obvious drift."""

import hashlib
import re
import sys
from pathlib import Path

from check_source_provenance import candidate_files, find_identical_upstream_files


ROOT = Path(__file__).resolve().parents[1]

CONTEXT_FILES = (
    "AGENTS.md",
    "docs/AI_CONTEXT.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "STATUS.md",
)

PROVENANCE_FILES = (
    "scripts/upstream-source-audit.json",
    "submission/THIRD_PARTY_NOTICES.md",
    "scripts/check_source_provenance.py",
)

TEST1_EVIDENCE_FILES = (
    "submission/evidence/test1/README.md",
    "submission/evidence/test1/metrics_full.csv",
    "submission/evidence/test1/robustness_deltas.csv",
    "submission/evidence/test1/source.json",
    "submission/evidence/test1/source-integrity.json",
)

TEST1_CONTEXT_FILES = (
    "AGENTS.md",
    "README.md",
    "STATUS.md",
    "docs/AI_CONTEXT.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "submission/BENCHMARKS.md",
    "submission/MODEL_CARD.md",
    "submission/README.md",
)

INTERVIEW_ARTIFACT_HASHES = {
    "landing-page/public/interviews/prof-ng-teck-khim-day3.png": (
        "07531442b62fa08877f1a49bcca4843561cbdcde4987828a641cdb5e4f4d63f7"
    ),
    "landing-page/public/interviews/prof-ng-teck-khim-day3-transcript.txt": (
        "f9ee9774fcf773fa13f81a3d71fab32be94db1504c8438d4a94bcb7a7fe879e5"
    ),
}

INTERVIEW_CONTEXT_FILES = (
    "AGENTS.md",
    "README.md",
    "STATUS.md",
    "docs/AI_CONTEXT.md",
    "docs/INTERVIEW_PROF_NG.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "submission/README.md",
)

AUGMENTATION_CONTEXT_FILES = (
    "AGENTS.md",
    "README.md",
    "STATUS.md",
    "docs/AI_CONTEXT.md",
    "docs/AUGMENTATION_TOOLKIT.md",
)

SITE_ROUTES = {
    "/": "landing-page/app/page.tsx",
    "/try": "landing-page/app/try/page.tsx",
    "/journey": "landing-page/app/journey/page.tsx",
    "/documentation": "landing-page/app/documentation/page.tsx",
    "/documentation/architecture": (
        "landing-page/app/documentation/architecture/page.tsx"
    ),
    "/api/analyze": "landing-page/app/api/analyze/route.ts",
    "/api/analyze-video": "landing-page/app/api/analyze-video/route.ts",
}

OUTPUT_DOCS = (
    "AGENTS.md",
    "README.md",
    "docs/AI_CONTEXT.md",
    "submission/ARCHITECTURE.md",
    "submission/REPRODUCE.md",
)


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def main() -> int:
    errors = []

    retired_patterns = (
        re.compile(("feat" + "distill").encode("utf-8"), re.IGNORECASE),
        re.compile(
            rb"(?<![a-z0-9])"
            + ("u" + "estc").encode("utf-8")
            + rb"(?![a-z0-9])",
            re.IGNORECASE,
        ),
        re.compile(("ba" + "idu").encode("utf-8"), re.IGNORECASE),
        re.compile(("net" + "disk").encode("utf-8"), re.IGNORECASE),
        re.compile(rb"(?<![a-z0-9])net[\s_-]*drive(?![a-z0-9])", re.IGNORECASE),
    )
    retired_mentions = []
    for path in candidate_files():
        relative_path = path.relative_to(ROOT).as_posix()
        searchable = relative_path.encode("utf-8") + b"\n" + path.read_bytes()
        if any(pattern.search(searchable) for pattern in retired_patterns):
            retired_mentions.append(relative_path)
    if retired_mentions:
        errors.append(
            "retired attribution or download-provider wording remains in "
            "release candidates: "
            + ", ".join(retired_mentions)
        )

    missing_context = [
        path for path in CONTEXT_FILES if not (ROOT / path).is_file()
    ]
    if missing_context:
        errors.append("missing maintained context files: " + ", ".join(missing_context))

    missing_provenance = [
        path for path in PROVENANCE_FILES if not (ROOT / path).is_file()
    ]
    if missing_provenance:
        errors.append(
            "missing source-provenance files: " + ", ".join(missing_provenance)
        )

    missing_test1_evidence = [
        path for path in TEST1_EVIDENCE_FILES if not (ROOT / path).is_file()
    ]
    if missing_test1_evidence:
        errors.append(
            "missing TEST1 evidence files: " + ", ".join(missing_test1_evidence)
        )

    for relative_path in TEST1_CONTEXT_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing TEST1 context file: " + relative_path)
            continue
        if "TEST1" not in read(relative_path):
            errors.append("{} omits TEST1 boundary".format(relative_path))

    for relative_path, expected_hash in INTERVIEW_ARTIFACT_HASHES.items():
        path = ROOT / relative_path
        if not path.is_file():
            errors.append("missing interview artifact: " + relative_path)
            continue
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual_hash != expected_hash:
            errors.append(
                "{} interview artifact hash changed: {}".format(
                    relative_path, actual_hash
                )
            )

    for relative_path in INTERVIEW_CONTEXT_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing interview context file: " + relative_path)
            continue
        if "Professor Ng" not in read(relative_path):
            errors.append("{} omits interview boundary".format(relative_path))

    agent_files = sorted(
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.name.lower() == "agents.md"
        and not {".git", ".next", "dist", "node_modules"}.intersection(
            path.parts
        )
    )
    if agent_files != ["AGENTS.md"]:
        errors.append(
            "AGENTS.md inventory changed; update the context contract: "
            + repr(agent_files)
        )

    for route, relative_path in SITE_ROUTES.items():
        if not (ROOT / relative_path).is_file():
            errors.append("missing source for route {}: {}".format(route, relative_path))

    route_docs = ("AGENTS.md", "docs/AI_CONTEXT.md", "STATUS.md")
    for relative_path in route_docs:
        if not (ROOT / relative_path).is_file():
            continue
        content = read(relative_path)
        for route in SITE_ROUTES:
            if route == "/":
                continue
            if route not in content:
                errors.append(
                    "{} omits public route {}".format(relative_path, route)
                )

    for relative_path in OUTPUT_DOCS:
        if not (ROOT / relative_path).is_file():
            continue
        content = read(relative_path)
        for token in ("predictions.csv", "predictions.json", "predictions.meta.json"):
            if token not in content:
                errors.append(
                    "{} omits batch artifact {}".format(relative_path, token)
                )
        for field in ("image_path", "pred"):
            if field not in content:
                errors.append(
                    "{} omits Track 5 JSON field {}".format(relative_path, field)
                )

    for relative_path in ("AGENTS.md", "docs/AI_CONTEXT.md", "STATUS.md"):
        if not (ROOT / relative_path).is_file():
            continue
        content = read(relative_path)
        for name in ("SynthFlag",):
            if name not in content:
                errors.append(
                    "{} omits naming contract term {}".format(relative_path, name)
                )

    if (ROOT / "synthflag_augment").is_dir():
        for relative_path in AUGMENTATION_CONTEXT_FILES:
            if not (ROOT / relative_path).is_file():
                errors.append(
                    "missing augmentation context file: {}".format(relative_path)
                )
                continue
            if "synthflag_augment" not in read(relative_path):
                errors.append(
                    "{} omits synthflag_augment boundary".format(relative_path)
                )

    diagrams = sorted((ROOT / "landing-page/public/diagrams").glob("*.svg"))
    if len(diagrams) != 18:
        errors.append(
            "diagram inventory changed from 18; refresh context before release "
            "(found {})".format(len(diagrams))
        )

    status = read("STATUS.md") if (ROOT / "STATUS.md").is_file() else ""
    for stale_phrase in (
        "Sole integration lane",
        "## Active automations",
        "codex/synthflag-submission",
    ):
        if stale_phrase in status:
            errors.append("STATUS.md contains retired coordination text: " + stale_phrase)

    for current_path, upstream_paths in find_identical_upstream_files():
        errors.append(
            "{} is byte-identical to prohibited upstream source: {}".format(
                current_path, ", ".join(upstream_paths)
            )
        )

    if errors:
        print("Repository context check failed:", file=sys.stderr)
        for error in errors:
            print("- " + error, file=sys.stderr)
        return 1

    print("Repository context check passed.")
    print("- one root AGENTS.md")
    print("- {} maintained context files".format(len(CONTEXT_FILES)))
    print("- {} maintained source-provenance files".format(len(PROVENANCE_FILES)))
    print("- {} TEST1 aggregate evidence files".format(len(TEST1_EVIDENCE_FILES)))
    print(
        "- {} checksum-bound interview artifacts".format(
            len(INTERVIEW_ARTIFACT_HASHES)
        )
    )
    print("- {} public route sources".format(len(SITE_ROUTES)))
    print("- {} SVG diagrams".format(len(diagrams)))
    print("- Track 5 CSV/JSON/metadata output contract documented")
    if (ROOT / "synthflag_augment").is_dir():
        print("- optional augmentation boundary documented")
    print("- no prohibited byte-identical upstream source")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
