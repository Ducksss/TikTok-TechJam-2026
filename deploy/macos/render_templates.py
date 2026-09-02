#!/usr/bin/env python3
"""Render the fixed macOS service templates without a shell-eval boundary."""

from __future__ import annotations

import argparse
import plistlib
from pathlib import Path


TOKENS = {
    "__CREDENTIALS__": "credentials",
    "__DOMAIN__": "domain",
    "__LOG_DIR__": "log_dir",
    "__NGROK__": "ngrok",
    "__NGROK_CONFIG__": "ngrok_config",
    "__POLICY__": "policy",
    "__PYTHON__": "python",
    "__RUNTIME_DIR__": "runtime_dir",
    "__WEIGHTS_DIR__": "weights_dir",
}


def render(source: Path, destination: Path, values: dict[str, str]) -> None:
    text = source.read_text(encoding="utf-8")
    for token, argument in TOKENS.items():
        if token in text:
            text = text.replace(token, values[argument])
    unresolved = [token for token in TOKENS if token in text]
    if unresolved:
        raise ValueError(f"unresolved template tokens in {source}: {unresolved}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--templates", required=True, type=Path)
    parser.add_argument("--launch-agents", required=True, type=Path)
    parser.add_argument("--state-dir", required=True, type=Path)
    parser.add_argument("--runtime-dir", required=True, type=Path)
    parser.add_argument("--domain")
    args = parser.parse_args()

    state = args.state_dir.resolve()
    runtime = args.runtime_dir.resolve()
    launch_agents = args.launch_agents.resolve()
    values = {
        "credentials": str(state / "ngrok-credentials.yml"),
        "domain": args.domain or "",
        "log_dir": str(state / "logs"),
        "ngrok": str(state / "bin" / "ngrok"),
        "ngrok_config": str(state / "ngrok.yml"),
        "policy": str(state / "traffic-policy.yml"),
        "python": str(state / "venv" / "bin" / "python"),
        "runtime_dir": str(runtime),
        "weights_dir": str(state / "weights"),
    }

    render(args.templates / "ngrok.yml", state / "ngrok.yml", values)
    render(
        args.templates / "traffic-policy.yml",
        state / "traffic-policy.yml",
        values,
    )
    names = ["com.synthflag.inference.plist"]
    if args.domain:
        names.append("com.synthflag.ngrok.plist")
    for name in names:
        destination = launch_agents / name
        render(args.templates / name, destination, values)
        with destination.open("rb") as source:
            plistlib.load(source)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
