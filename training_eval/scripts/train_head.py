"""Train a residual head from a sealed, frozen-feature NPZ cache.

Expected arrays are ``features`` [N,1152], ``teacher_logits`` [N,2] (or
``teacher_margin`` [N]), binary ``labels``, ``split`` (train/dev), ``group_id``
and optional ``view``.  Public test/reference rows are rejected.  Upstream
encoders are never updated by this program.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterator

import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import roc_auc_score

try:
    from .model import ResidualHead
except ImportError:  # direct script execution
    from model import ResidualHead


FORBIDDEN_SPLITS = {"test", "reference", "locked_test", "validation", "calibration"}
DEV_SPLITS = {"dev", "development"}


@dataclass(frozen=True)
class TrainConfig:
    input_width: int = 1152
    hidden_width: int = 256
    dropout: float = 0.20
    epochs: int = 12
    patience: int = 4
    batch_size: int = 128
    learning_rate: float = 1.0e-4
    weight_decay: float = 1.0e-4
    teacher_weight: float = 0.05
    ranking_weight: float = 0.10
    residual_weight: float = 0.01
    consistency_weight: float = 0.05
    replay_weight: float = 0.10
    ranking_minimum_gap: float = 0.02
    ranking_maximum_gap: float = 0.50
    seed: int = 2026


@dataclass(frozen=True)
class FeatureTable:
    features: np.ndarray
    teacher_logits: np.ndarray
    labels: np.ndarray
    split: np.ndarray
    group_id: np.ndarray
    view: np.ndarray


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def load_feature_table(path: str | Path, *, require_labels: bool = True) -> FeatureTable:
    path = Path(path)
    with np.load(path, allow_pickle=False) as archive:
        required = {"features"}
        if require_labels:
            required |= {"labels", "split", "group_id"}
        missing = required - set(archive.files)
        if missing:
            raise ValueError(f"feature cache is missing arrays: {sorted(missing)}")
        features = np.asarray(archive["features"], dtype=np.float32)
        if "teacher_logits" in archive.files:
            teacher = np.asarray(archive["teacher_logits"], dtype=np.float32)
        elif "teacher_margin" in archive.files:
            teacher = np.asarray(archive["teacher_margin"], dtype=np.float32)
        else:
            raise ValueError("feature cache requires teacher_logits or teacher_margin")
        rows = features.shape[0]
        labels = np.asarray(archive["labels"], dtype=np.int64) if require_labels else np.zeros(rows, dtype=np.int64)
        split = np.asarray(archive["split"]).astype(str) if require_labels else np.full(rows, "replay")
        group_id = np.asarray(archive["group_id"]).astype(str) if require_labels else np.arange(rows).astype(str)
        view = np.asarray(archive["view"]).astype(str) if "view" in archive.files else np.full(rows, "all")
    if features.ndim != 2 or features.shape[1] <= 0:
        raise ValueError("features must have shape [N, width]")
    if teacher.shape not in {(rows,), (rows, 2)}:
        raise ValueError("teacher logits must have shape [N] or [N,2]")
    arrays = (labels, split, group_id, view)
    if any(array.shape != (rows,) for array in arrays):
        raise ValueError("labels, split, group_id and view must have one entry per feature row")
    if require_labels and set(np.unique(labels)) - {0, 1}:
        raise ValueError("labels must contain only 0 and 1")
    if not np.isfinite(features).all() or not np.isfinite(teacher).all():
        raise ValueError("features and teacher logits must be finite")
    return FeatureTable(features, teacher, labels, split, group_id, view)


def validate_training_contract(table: FeatureTable, expected_width: int) -> tuple[np.ndarray, np.ndarray]:
    if table.features.shape[1] != expected_width:
        raise ValueError(f"feature width {table.features.shape[1]} != expected {expected_width}")
    splits = np.char.lower(table.split.astype(str))
    forbidden = set(np.unique(splits)) & FORBIDDEN_SPLITS
    if forbidden:
        raise ValueError(f"public/held-out splits are forbidden during training: {sorted(forbidden)}")
    train = np.flatnonzero(splits == "train")
    dev = np.flatnonzero(np.isin(splits, list(DEV_SPLITS)))
    if not len(train) or not len(dev):
        raise ValueError("cache must contain non-empty train and dev splits")
    train_groups = set(table.group_id[train])
    dev_groups = set(table.group_id[dev])
    overlap = train_groups & dev_groups
    if overlap:
        raise ValueError(f"group leakage between train/dev: {len(overlap)} groups")
    for name, indices in (("train", train), ("dev", dev)):
        if np.unique(table.labels[indices]).size != 2:
            raise ValueError(f"{name} split must contain both labels")
    return train, dev


def balanced_batches(
    indices: np.ndarray,
    labels: np.ndarray,
    batch_size: int,
    rng: np.random.Generator,
) -> Iterator[np.ndarray]:
    if batch_size < 2 or batch_size % 2:
        raise ValueError("batch_size must be a positive even integer")
    by_class = {label: indices[labels[indices] == label] for label in (0, 1)}
    if not len(by_class[0]) or not len(by_class[1]):
        raise ValueError("balanced batching requires both classes")
    half = batch_size // 2
    batches = math.ceil(max(len(by_class[0]), len(by_class[1])) / half)
    for _ in range(batches):
        selected = np.concatenate(
            [rng.choice(by_class[label], size=half, replace=len(by_class[label]) < half) for label in (0, 1)]
        )
        rng.shuffle(selected)
        yield selected


def ranking_preservation_loss(
    student: torch.Tensor,
    teacher: torch.Tensor,
    *,
    minimum_gap: float = 0.02,
    maximum_gap: float = 0.50,
) -> torch.Tensor:
    """Penalise inversions of teacher pairs with a meaningful score gap."""

    student = student.reshape(-1)
    teacher = teacher.detach().reshape(-1)
    if student.shape != teacher.shape:
        raise ValueError("student and teacher margins must have the same shape")
    if student.numel() < 2:
        return student.sum() * 0.0
    permutation = torch.randperm(student.numel(), device=student.device)
    teacher_gap = teacher - teacher[permutation]
    student_gap = student - student[permutation]
    mask = teacher_gap.abs() >= float(minimum_gap)
    if not bool(mask.any()):
        return student.sum() * 0.0
    required = teacher_gap[mask].abs().clamp(max=float(maximum_gap))
    signed_student = teacher_gap[mask].sign() * student_gap[mask]
    return F.relu(required - signed_student).square().mean()


def group_consistency_loss(correction: torch.Tensor, group_ids: np.ndarray) -> torch.Tensor:
    """Keep clean/augmented corrections for the same source near one another."""

    terms: list[torch.Tensor] = []
    for group in np.unique(group_ids):
        positions = np.flatnonzero(group_ids == group)
        if len(positions) > 1:
            values = correction[torch.as_tensor(positions, device=correction.device)]
            terms.append((values - values.mean()).square().mean())
    return torch.stack(terms).mean() if terms else correction.sum() * 0.0


@torch.inference_mode()
def _dev_selection(
    model: ResidualHead,
    table: FeatureTable,
    dev_indices: np.ndarray,
    device: torch.device,
    alphas: tuple[float, ...],
) -> dict[str, Any]:
    model.eval()
    features = torch.from_numpy(table.features[dev_indices]).to(device)
    teacher_logits = torch.from_numpy(table.teacher_logits[dev_indices]).to(device)
    teacher = model.teacher_margin(teacher_logits).cpu().numpy().astype(np.float64)
    correction = model.correction(features).cpu().numpy().astype(np.float64)
    labels = table.labels[dev_indices]
    views = table.view[dev_indices]
    candidates: list[dict[str, Any]] = []
    for alpha in alphas:
        scores = teacher + float(alpha) * correction
        per_view: dict[str, float] = {}
        for view in sorted(np.unique(views)):
            selected = views == view
            if np.unique(labels[selected]).size == 2:
                per_view[str(view)] = float(roc_auc_score(labels[selected], scores[selected]))
        if not per_view:
            raise ValueError("no dev view contains both classes")
        candidates.append(
            {
                "alpha": float(alpha),
                "per_view_auc": per_view,
                "worst_view_auc": min(per_view.values()),
                "mean_view_auc": float(np.mean(list(per_view.values()))),
            }
        )
    selected = max(
        candidates,
        key=lambda item: (item["worst_view_auc"], item["mean_view_auc"], -abs(item["alpha"])),
    )
    return {"selected": selected, "candidates": candidates}


def train(
    cache_path: str | Path,
    output_path: str | Path,
    *,
    config: TrainConfig = TrainConfig(),
    replay_path: str | Path | None = None,
    alphas: tuple[float, ...] = (0.0, 0.05, 0.10, 0.20, 0.35, 0.50, 0.75, 1.0, 1.25),
    device: str = "auto",
) -> dict[str, Any]:
    cache_path, output_path = Path(cache_path), Path(output_path)
    table = load_feature_table(cache_path)
    train_indices, dev_indices = validate_training_contract(table, config.input_width)
    replay = load_feature_table(replay_path, require_labels=False) if replay_path else None
    if replay is not None and replay.features.shape[1] != config.input_width:
        raise ValueError("replay feature width differs from training cache")
    set_seed(config.seed)
    selected_device = torch.device(
        "cuda" if device == "auto" and torch.cuda.is_available() else "cpu" if device == "auto" else device
    )
    model = ResidualHead(
        config.input_width,
        config.hidden_width,
        config.dropout,
        zero_initialize_output=True,
    ).to(selected_device)
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay
    )
    rng = np.random.default_rng(config.seed)
    best: dict[str, Any] | None = None
    best_state: dict[str, torch.Tensor] | None = None
    epochs_without_improvement = 0
    history: list[dict[str, Any]] = []
    for epoch in range(1, config.epochs + 1):
        model.train()
        components: dict[str, list[float]] = {
            name: [] for name in ("classification", "teacher", "ranking", "residual", "consistency", "replay", "total")
        }
        for batch in balanced_batches(train_indices, table.labels, config.batch_size, rng):
            features = torch.from_numpy(table.features[batch]).to(selected_device)
            teacher_logits = torch.from_numpy(table.teacher_logits[batch]).to(selected_device)
            labels = torch.from_numpy(table.labels[batch].astype(np.float32)).to(selected_device)
            teacher = model.teacher_margin(teacher_logits).detach()
            correction = model.correction(features)
            student = teacher + correction
            classification = F.binary_cross_entropy_with_logits(student, labels)
            teacher_loss = F.smooth_l1_loss(student, teacher)
            ranking = ranking_preservation_loss(
                student,
                teacher,
                minimum_gap=config.ranking_minimum_gap,
                maximum_gap=config.ranking_maximum_gap,
            )
            residual = correction.square().mean()
            consistency = group_consistency_loss(correction, table.group_id[batch])
            replay_loss = student.sum() * 0.0
            if replay is not None and config.replay_weight > 0:
                selected = rng.integers(0, replay.features.shape[0], size=len(batch), endpoint=False)
                replay_features = torch.from_numpy(replay.features[selected]).to(selected_device)
                replay_logits = torch.from_numpy(replay.teacher_logits[selected]).to(selected_device)
                replay_teacher = model.teacher_margin(replay_logits).detach()
                replay_correction = model.correction(replay_features)
                replay_student = replay_teacher + replay_correction
                replay_loss = replay_correction.square().mean() + 0.25 * ranking_preservation_loss(
                    replay_student,
                    replay_teacher,
                    minimum_gap=config.ranking_minimum_gap,
                    maximum_gap=config.ranking_maximum_gap,
                )
            total = (
                classification
                + config.teacher_weight * teacher_loss
                + config.ranking_weight * ranking
                + config.residual_weight * residual
                + config.consistency_weight * consistency
                + config.replay_weight * replay_loss
            )
            optimizer.zero_grad(set_to_none=True)
            total.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            for name, value in {
                "classification": classification,
                "teacher": teacher_loss,
                "ranking": ranking,
                "residual": residual,
                "consistency": consistency,
                "replay": replay_loss,
                "total": total,
            }.items():
                components[name].append(float(value.detach().cpu()))
        selection = _dev_selection(model, table, dev_indices, selected_device, alphas)
        epoch_record = {
            "epoch": epoch,
            "loss": {name: float(np.mean(values)) for name, values in components.items()},
            "selection": selection["selected"],
        }
        history.append(epoch_record)
        score = (
            selection["selected"]["worst_view_auc"],
            selection["selected"]["mean_view_auc"],
        )
        if best is None or score > (best["worst_view_auc"], best["mean_view_auc"]):
            best = {**selection["selected"], "epoch": epoch}
            best_state = copy.deepcopy(model.state_dict())
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= config.patience:
                break
    if best is None or best_state is None:
        raise RuntimeError("training produced no candidate")
    payload = {
        "schema_version": 1,
        "model_class": "ResidualHead",
        "architecture": {
            "input_width": config.input_width,
            "hidden_width": config.hidden_width,
            "training_dropout": config.dropout,
        },
        "state_dict": best_state,
        "selected_alpha": best["alpha"],
        "selected_epoch": best["epoch"],
        "selection": best,
        "training_config": asdict(config),
        "training_cache": {"filename": cache_path.name, "sha256": sha256_file(cache_path)},
        "preservation_replay": (
            {"filename": Path(replay_path).name, "sha256": sha256_file(Path(replay_path))}
            if replay_path
            else None
        ),
        "encoder_frozen": True,
        "upstream_encoder_trained_by_this_script": False,
        "public_test_rows_used_for_gradients": False,
        "history": history,
        "head_parameter_count": sum(tensor.numel() for tensor in best_state.values()),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, output_path)
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--patience", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--learning-rate", type=float, default=1.0e-4)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--device", default="auto")
    args = parser.parse_args()
    config = TrainConfig(
        epochs=args.epochs,
        patience=args.patience,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        seed=args.seed,
    )
    payload = train(
        args.cache,
        args.output,
        config=config,
        replay_path=args.replay,
        device=args.device,
    )
    print(json.dumps(payload["selection"], sort_keys=True))


if __name__ == "__main__":
    main()
