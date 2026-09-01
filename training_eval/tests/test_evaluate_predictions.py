from __future__ import annotations

import pytest

from evaluate_predictions import binary_metrics, evaluate_rows


def test_binary_metrics_include_threshold_and_ranking_metrics() -> None:
    metrics = binary_metrics([0, 0, 1, 1], [0.8, 0.2, 0.4, 0.9], threshold=0.5)
    assert metrics["tp"] == metrics["tn"] == metrics["fp"] == metrics["fn"] == 1
    assert metrics["accuracy"] == pytest.approx(0.5)
    assert metrics["precision"] == pytest.approx(0.5)
    assert metrics["recall"] == pytest.approx(0.5)
    assert metrics["specificity"] == pytest.approx(0.5)
    assert metrics["f1"] == pytest.approx(0.5)
    assert metrics["mcc"] == pytest.approx(0.0)
    assert metrics["auc"] == pytest.approx(0.75)


def test_evaluate_rows_groups_by_dataset_and_condition() -> None:
    rows = [
        {"dataset": "A", "condition": "clean", "label": "0", "score": "0.1"},
        {"dataset": "A", "condition": "clean", "label": "1", "score": "0.9"},
        {"dataset": "B", "condition": "blur", "label": "0", "score": "0.2"},
        {"dataset": "B", "condition": "blur", "label": "1", "score": "0.8"},
    ]
    report = evaluate_rows(rows)
    assert report["overall"]["auc"] == pytest.approx(1.0)
    assert len(report["groups"]) == 2
    assert all(group["auc"] == pytest.approx(1.0) for group in report["groups"])
