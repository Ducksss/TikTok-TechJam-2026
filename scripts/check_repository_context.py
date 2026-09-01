#!/usr/bin/env python3
"""Check the maintained SynthFlag agent/context contract for obvious drift."""

import hashlib
import re
import sys
from pathlib import Path

from check_source_provenance import candidate_files, find_identical_upstream_files


ROOT = Path(__file__).resolve().parents[1]
DEMO_VIDEO_URL = "https://youtu.be/X5-J4NmNHl0"

CONTEXT_FILES = (
    "AGENTS.md",
    "README.md",
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

COLLABORATOR_TECHNICAL_FILES = (
    "training_eval/README.md",
    "training_eval/scripts/model.py",
    "training_eval/scripts/train_head.py",
    "training_eval/scripts/augmentations.py",
    "training_eval/scripts/evaluate_predictions.py",
    "training_eval/scripts/verify_bundle.py",
    "training_eval/configs/selected_test1.yaml",
    "training_eval/weights/head_bundle_manifest.json",
    "training_eval/weights/SynthFlag_TEST1_head_bundle_v1.zip",
    "training_eval/benchmarks/test1/predictions.csv",
    "training_eval/benchmarks/test1/paired_bootstrap_auc.json",
    "training_eval/benchmarks/test1/TEST1_BENCHMARK_PACKAGE.zip",
)

PROJECT_ARTIFACT_HASHES = {
    "weights/cifake_router_head.pt": (
        "da8cdd81a14d112a7531837762fe3aad97ebfe07c8cdaa69da6d3c7dfe08b48e"
    ),
    "weights/general_epoch05_head.pt": (
        "98e03c194fc902560d965d1b28d4b1e245e3580d792ff2c086d5ab515588479c"
    ),
    "weights/general_epoch08_head.pt": (
        "b6a8d13d71ab05d0bb43477a4721a74e60d54d289ef483129e857b525dd08526"
    ),
    "training_eval/weights/cifake_router_head.pt": (
        "da8cdd81a14d112a7531837762fe3aad97ebfe07c8cdaa69da6d3c7dfe08b48e"
    ),
    "training_eval/weights/general_epoch05_head.pt": (
        "98e03c194fc902560d965d1b28d4b1e245e3580d792ff2c086d5ab515588479c"
    ),
    "training_eval/weights/general_epoch08_head.pt": (
        "b6a8d13d71ab05d0bb43477a4721a74e60d54d289ef483129e857b525dd08526"
    ),
    "training_eval/benchmarks/test1/predictions.csv": (
        "112b7b948aef9250534306486833aee74e85f4058f6d8c105b9de7b12e879016"
    ),
    "training_eval/benchmarks/test1/TEST1_BENCHMARK_PACKAGE.zip": (
        "d9d5f79eb65b723fb322940cc62ec6dcaccd5f7ef6c6e7f9ed4e3bc174a79c6b"
    ),
    "training_eval/weights/SynthFlag_TEST1_head_bundle_v1.zip": (
        "7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54"
    ),
}

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

DEMO_CONTEXT_FILES = (
    "AGENTS.md",
    "README.md",
    "STATUS.md",
    "docs/AI_CONTEXT.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "submission/README.md",
    "landing-page/app/page.tsx",
    "landing-page/app/documentation/page.tsx",
)

CANONICAL_STORY_FILES = (
    "AGENTS.md",
    "README.md",
    "STATUS.md",
    "docs/AI_CONTEXT.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "submission/README.md",
    "submission/MODEL_CARD.md",
)

HISTORICAL_EVIDENCE_FILES = (
    "submission/evidence/INTERIM_EXPERIMENT_REPORT.md",
    "submission/evidence/EXPERIMENT_V2_REPORT.md",
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
        # Checksum-bound collaborator artifacts must remain byte-exact. Their
        # embedded checkpoint metadata is not public release prose and cannot
        # be rewritten without invalidating the authoritative artifacts.
        if relative_path in PROJECT_ARTIFACT_HASHES:
            continue
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

    missing_technical = [
        path for path in COLLABORATOR_TECHNICAL_FILES if not (ROOT / path).is_file()
    ]
    if missing_technical:
        errors.append(
            "missing collaborator-authoritative technical files: "
            + ", ".join(missing_technical)
        )

    for relative_path, expected_hash in PROJECT_ARTIFACT_HASHES.items():
        path = ROOT / relative_path
        if not path.is_file():
            errors.append("missing project artifact: " + relative_path)
            continue
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual_hash != expected_hash:
            errors.append(
                "{} project artifact hash changed: {}".format(
                    relative_path, actual_hash
                )
            )

    architecture = read("infer/architecture.py")
    if "from training_eval.scripts.model import" not in architecture:
        errors.append(
            "infer/architecture.py no longer imports the authoritative "
            "training_eval residual-head implementation"
        )

    training_model_card = read("training_eval/docs/MODEL_CARD.md")
    if "Required next step for an eligible submission" in training_model_card:
        errors.append("training model card still presents retraining as required")
    for token in (
        "Optional eligibility-hardening path",
        "No replacement retraining is required",
        PROJECT_ARTIFACT_HASHES["weights/cifake_router_head.pt"],
        PROJECT_ARTIFACT_HASHES["weights/general_epoch05_head.pt"],
        PROJECT_ARTIFACT_HASHES["weights/general_epoch08_head.pt"],
    ):
        if token not in training_model_card:
            errors.append(
                "training model card omits artifact/rights token: " + token
            )

    for relative_path in TEST1_CONTEXT_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing TEST1 context file: " + relative_path)
            continue
        if "TEST1" not in read(relative_path):
            errors.append("{} omits TEST1 boundary".format(relative_path))

    for relative_path in DEMO_CONTEXT_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing demo context file: " + relative_path)
            continue
        if DEMO_VIDEO_URL not in read(relative_path):
            errors.append("{} omits canonical demo video".format(relative_path))

    for relative_path in CANONICAL_STORY_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing canonical story file: " + relative_path)
            continue
        content = read(relative_path)
        for token in ("Expert 4", "three", "training_eval"):
            if token not in content:
                errors.append(
                    "{} omits selected-story token {}".format(
                        relative_path, token
                    )
                )

    for relative_path in HISTORICAL_EVIDENCE_FILES:
        if not (ROOT / relative_path).is_file():
            errors.append("missing historical evidence file: " + relative_path)
            continue
        if "Historical" not in read(relative_path)[:600]:
            errors.append(
                "{} lacks a leading historical-runtime notice".format(
                    relative_path
                )
            )

    public_architecture = ROOT / "landing-page/public/selected-test1-architecture.svg"
    submission_architecture = ROOT / "submission/ARCHITECTURE.svg"
    if not public_architecture.is_file():
        errors.append("missing selected public architecture mirror")
    elif not submission_architecture.is_file():
        errors.append("missing submission/ARCHITECTURE.svg")
    elif public_architecture.read_bytes() != submission_architecture.read_bytes():
        errors.append(
            "public selected architecture no longer matches submission/ARCHITECTURE.svg"
        )

    homepage = read("landing-page/app/page.tsx")
    if "['Source', '4 experts']" in homepage:
        errors.append("homepage still presents the retired four-expert source")

    journey = read("landing-page/app/journey/page.tsx")
    if "<ModelJourney" in journey or "architecture/model-journey" in journey:
        errors.append("journey still embeds the retired four-expert walkthrough")
    if 'id="selected-model"' not in journey:
        errors.append("journey omits the selected-model walkthrough anchor")

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
    for diagram in diagrams:
        if "HISTORICAL BASELINE · NOT SELECTED TEST1" not in diagram.read_text(
            encoding="utf-8"
        ):
            errors.append(
                "historical atlas diagram lacks visible status stamp: "
                + diagram.relative_to(ROOT).as_posix()
            )

    for number in ("06", "07", "08", "09"):
        for theme in ("dark", "light"):
            relative_path = (
                "submission/media/devpost-gallery/"
                + number
                + "-"
                + {
                    "06": "system-architecture",
                    "07": "ensemble-anatomy",
                    "08": "decision-register",
                    "09": "threshold-tradeoff",
                }[number]
                + "-"
                + theme
                + ".svg"
            )
            if "HISTORICAL V1/V2 BASELINE" not in read(relative_path):
                errors.append(
                    "legacy Devpost graphic lacks visible status stamp: "
                    + relative_path
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
        "- {} collaborator-authoritative technical files".format(
            len(COLLABORATOR_TECHNICAL_FILES)
        )
    )
    print("- {} checksum-bound project artifacts".format(len(PROJECT_ARTIFACT_HASHES)))
    print(
        "- {} checksum-bound interview artifacts".format(
            len(INTERVIEW_ARTIFACT_HASHES)
        )
    )
    print("- {} public route sources".format(len(SITE_ROUTES)))
    print("- {} SVG diagrams".format(len(diagrams)))
    print("- canonical demo URL documented across public context")
    print("- selected architecture mirror and historical-asset labels verified")
    print("- Track 5 CSV/JSON/metadata output contract documented")
    if (ROOT / "synthflag_augment").is_dir():
        print("- optional augmentation boundary documented")
    print("- no prohibited byte-identical upstream source")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
