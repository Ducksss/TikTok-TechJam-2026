#!/usr/bin/env python3
"""Check the maintained SynthFlag agent/context contract for obvious drift."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

CONTEXT_FILES = (
    "AGENTS.md",
    "docs/AI_CONTEXT.md",
    "docs/PROMPTING_GUIDE.md",
    "docs/README.md",
    "STATUS.md",
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

    missing_context = [
        path for path in CONTEXT_FILES if not (ROOT / path).is_file()
    ]
    if missing_context:
        errors.append("missing maintained context files: " + ", ".join(missing_context))

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
        for name in ("SynthFlag", "FeatDistill"):
            if name not in content:
                errors.append(
                    "{} omits naming contract term {}".format(relative_path, name)
                )

    diagrams = sorted((ROOT / "landing-page/public/diagrams").glob("*.svg"))
    if len(diagrams) != 17:
        errors.append(
            "diagram inventory changed from 17; refresh context before release "
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

    if errors:
        print("Repository context check failed:", file=sys.stderr)
        for error in errors:
            print("- " + error, file=sys.stderr)
        return 1

    print("Repository context check passed.")
    print("- one root AGENTS.md")
    print("- {} maintained context files".format(len(CONTEXT_FILES)))
    print("- {} public route sources".format(len(SITE_ROUTES)))
    print("- {} SVG diagrams".format(len(diagrams)))
    print("- Track 5 CSV/JSON/metadata output contract documented")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
