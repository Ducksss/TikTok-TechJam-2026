"""Resumable prediction artifacts and output-directory coordination."""

from __future__ import annotations

import csv
import json
import math
import os
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


CSV_FIELDS = ["image_name", "score"]
SUPPORTED_IMAGE_SUFFIXES = frozenset(
    {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
)


@dataclass(frozen=True)
class PredictionArtifacts:
    csv: Path
    submission_json: Path
    metadata_json: Path


def discover_images(root: Path) -> list[Path]:
    if not root.is_dir():
        raise FileNotFoundError(f"image directory not found: {root}")
    matches = sorted(
        candidate
        for candidate in root.rglob("*")
        if candidate.is_file() and candidate.suffix.lower() in SUPPORTED_IMAGE_SUFFIXES
    )
    if not matches:
        raise FileNotFoundError(f"no supported images found under: {root}")
    return matches


def read_prediction_rows(csv_path: Path) -> list[tuple[str, float]]:
    if not csv_path.exists():
        return []

    parsed: list[tuple[str, float]] = []
    seen_names: set[str] = set()
    with csv_path.open("r", encoding="utf-8", newline="") as source:
        rows = csv.DictReader(source)
        if rows.fieldnames != CSV_FIELDS:
            raise ValueError(f"unexpected CSV header in {csv_path}: {rows.fieldnames}")
        for record in rows:
            if None in record:
                raise ValueError(f"unexpected extra CSV columns in {csv_path}: {record!r}")
            image_name = record.get("image_name") or ""
            if not image_name or image_name in seen_names:
                raise ValueError(
                    f"empty or duplicate image_name in {csv_path}: {image_name!r}"
                )
            try:
                score = float(record.get("score", ""))
            except (TypeError, ValueError) as exc:
                raise ValueError(f"invalid score for {image_name!r} in {csv_path}") from exc
            if not math.isfinite(score) or not 0.0 <= score <= 1.0:
                raise ValueError(
                    f"score outside [0,1] for {image_name!r} in {csv_path}: {score!r}"
                )
            parsed.append((image_name, score))
            seen_names.add(image_name)
    return parsed


def append_prediction_rows(csv_path: Path, rows: list[tuple[str, float]]) -> None:
    if not rows:
        return
    needs_header = not csv_path.exists() or csv_path.stat().st_size == 0
    with csv_path.open("a", encoding="utf-8", newline="") as destination:
        writer = csv.writer(destination)
        if needs_header:
            writer.writerow(CSV_FIELDS)
        writer.writerows(rows)
        destination.flush()
        os.fsync(destination.fileno())


def write_json_atomically(path: Path, payload: object) -> None:
    partial = path.with_name(f".{path.name}.{os.getpid()}.partial")
    try:
        with partial.open("w", encoding="utf-8", newline="\n") as destination:
            json.dump(payload, destination, ensure_ascii=False, indent=2, sort_keys=True)
            destination.write("\n")
            destination.flush()
            os.fsync(destination.fileno())
        os.replace(partial, path)
    finally:
        partial.unlink(missing_ok=True)


def write_submission_json(csv_path: Path, json_path: Path) -> None:
    records = [
        {"image_path": image_name, "pred": score}
        for image_name, score in read_prediction_rows(csv_path)
    ]
    write_json_atomically(json_path, records)


@contextmanager
def output_directory_lock(out_dir: Path) -> Iterator[None]:
    out_dir.mkdir(parents=True, exist_ok=True)
    lock_path = out_dir / ".inference.lock"
    try:
        descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as exc:
        raise RuntimeError(
            f"output directory is already locked: {lock_path}; confirm the prior "
            "process stopped before removing a stale lock"
        ) from exc

    try:
        os.write(descriptor, f"pid={os.getpid()}\n".encode("ascii"))
        yield
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)


def prepare_artifacts(
    out_dir: Path,
    *,
    overwrite: bool,
    metadata: dict[str, object],
) -> tuple[PredictionArtifacts, set[str]]:
    artifacts = PredictionArtifacts(
        csv=out_dir / "predictions.csv",
        submission_json=out_dir / "predictions.json",
        metadata_json=out_dir / "predictions.meta.json",
    )
    if overwrite:
        for target in (
            artifacts.csv,
            artifacts.submission_json,
            artifacts.metadata_json,
        ):
            target.unlink(missing_ok=True)

    if artifacts.metadata_json.exists():
        try:
            previous_metadata = json.loads(
                artifacts.metadata_json.read_text(encoding="utf-8")
            )
        except (OSError, json.JSONDecodeError) as exc:
            raise ValueError(
                f"invalid output metadata: {artifacts.metadata_json}"
            ) from exc
        if previous_metadata != metadata:
            raise ValueError(
                f"output metadata does not match this run: {artifacts.metadata_json}; "
                "choose another --out-dir or pass --overwrite"
            )
    elif artifacts.csv.exists():
        raise ValueError(
            f"found {artifacts.csv} without matching metadata; pass --overwrite"
        )

    completed = {name for name, _ in read_prediction_rows(artifacts.csv)}
    return artifacts, completed
