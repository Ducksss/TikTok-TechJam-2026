"""Compute auditable binary-detection metrics from a prediction CSV."""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.metrics import average_precision_score, roc_auc_score


METRIC_COLUMNS = (
    "n",
    "prevalence",
    "auc",
    "average_precision",
    "accuracy",
    "precision",
    "recall",
    "specificity",
    "f1",
    "mcc",
    "tp",
    "tn",
    "fp",
    "fn",
)


def _safe_divide(numerator: float, denominator: float) -> float:
    return float(numerator / denominator) if denominator else 0.0


def binary_metrics(labels: np.ndarray, scores: np.ndarray, threshold: float = 0.5) -> dict[str, Any]:
    labels = np.asarray(labels, dtype=np.int64).reshape(-1)
    scores = np.asarray(scores, dtype=np.float64).reshape(-1)
    if labels.shape != scores.shape or labels.size == 0:
        raise ValueError("labels and scores must be equal, non-empty vectors")
    if set(np.unique(labels)) - {0, 1}:
        raise ValueError("labels must contain only 0 and 1")
    if not np.isfinite(scores).all():
        raise ValueError("scores must be finite")
    predictions = (scores >= float(threshold)).astype(np.int64)
    tp = int(np.sum((labels == 1) & (predictions == 1)))
    tn = int(np.sum((labels == 0) & (predictions == 0)))
    fp = int(np.sum((labels == 0) & (predictions == 1)))
    fn = int(np.sum((labels == 1) & (predictions == 0)))
    precision = _safe_divide(tp, tp + fp)
    recall = _safe_divide(tp, tp + fn)
    specificity = _safe_divide(tn, tn + fp)
    f1 = _safe_divide(2.0 * precision * recall, precision + recall)
    mcc_denominator = math.sqrt(float((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)))
    mcc = _safe_divide(tp * tn - fp * fn, mcc_denominator)
    both_classes = np.unique(labels).size == 2
    return {
        "n": int(labels.size),
        "prevalence": float(labels.mean()),
        "threshold": float(threshold),
        "auc": float(roc_auc_score(labels, scores)) if both_classes else None,
        "average_precision": float(average_precision_score(labels, scores)) if both_classes else None,
        "accuracy": _safe_divide(tp + tn, labels.size),
        "precision": precision,
        "recall": recall,
        "specificity": specificity,
        "f1": f1,
        "mcc": mcc,
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
    }


def evaluate_rows(
    rows: list[dict[str, str]],
    *,
    label_column: str = "label",
    score_column: str = "score",
    group_columns: tuple[str, ...] = ("dataset", "condition"),
    threshold: float = 0.5,
) -> dict[str, Any]:
    if not rows:
        raise ValueError("prediction table is empty")
    labels = np.asarray([int(row[label_column]) for row in rows], dtype=np.int64)
    scores = np.asarray([float(row[score_column]) for row in rows], dtype=np.float64)
    present_groups = tuple(column for column in group_columns if column in rows[0])
    grouped: dict[tuple[str, ...], list[int]] = defaultdict(list)
    for index, row in enumerate(rows):
        grouped[tuple(row.get(column, "") for column in present_groups)].append(index)
    groups = []
    for key in sorted(grouped):
        indices = np.asarray(grouped[key], dtype=np.int64)
        groups.append(
            {
                **dict(zip(present_groups, key, strict=True)),
                **binary_metrics(labels[indices], scores[indices], threshold),
            }
        )
    return {
        "schema_version": 1,
        "score_semantics": "higher means more likely AI-generated",
        "threshold": float(threshold),
        "overall": binary_metrics(labels, scores, threshold),
        "group_columns": list(present_groups),
        "groups": groups,
    }


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _write_group_csv(path: Path, report: dict[str, Any]) -> None:
    group_columns = list(report["group_columns"])
    fields = group_columns + list(METRIC_COLUMNS)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in report["groups"]:
            writer.writerow({field: row.get(field) for field in fields})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("predictions", type=Path)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-csv", type=Path)
    parser.add_argument("--label-column", default="label")
    parser.add_argument("--score-column", default="score")
    parser.add_argument("--group-columns", nargs="*", default=["dataset", "condition"])
    parser.add_argument("--threshold", type=float, default=0.5)
    args = parser.parse_args()
    report = evaluate_rows(
        _read_csv(args.predictions),
        label_column=args.label_column,
        score_column=args.score_column,
        group_columns=tuple(args.group_columns),
        threshold=args.threshold,
    )
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if args.output_csv:
        _write_group_csv(args.output_csv, report)
    print(json.dumps(report["overall"], sort_keys=True))


if __name__ == "__main__":
    main()
