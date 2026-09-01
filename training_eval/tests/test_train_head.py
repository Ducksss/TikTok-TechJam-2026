from __future__ import annotations

import numpy as np
import pytest

from model import load_head_checkpoint
from train_head import TrainConfig, load_feature_table, train, validate_training_contract


def _feature_cache(path, *, leak: bool = False) -> None:
    rng = np.random.default_rng(7)
    groups, features, logits, labels, splits, views = [], [], [], [], [], []
    for group in range(24):
        label = group % 2
        split = "train" if group < 16 else "dev"
        group_name = "shared" if leak and group in {0, 16} else f"group-{group}"
        for view_index, view in enumerate(("clean", "hard")):
            vector = rng.normal(0.0, 0.4, 1152).astype(np.float32)
            vector[0] += (2 * label - 1) * 1.5
            vector[1] += view_index * 0.05
            groups.append(group_name)
            features.append(vector)
            logits.append([0.0, (2 * label - 1) * 0.10])
            labels.append(label)
            splits.append(split)
            views.append(view)
    np.savez_compressed(
        path,
        features=np.asarray(features, dtype=np.float32),
        teacher_logits=np.asarray(logits, dtype=np.float32),
        labels=np.asarray(labels, dtype=np.int64),
        split=np.asarray(splits),
        group_id=np.asarray(groups),
        view=np.asarray(views),
    )


def test_training_writes_safe_compatible_checkpoint(tmp_path) -> None:
    cache = tmp_path / "features.npz"
    output = tmp_path / "head.pt"
    _feature_cache(cache)
    payload = train(
        cache,
        output,
        config=TrainConfig(epochs=2, patience=2, batch_size=8, hidden_width=16),
        device="cpu",
    )
    loaded = load_head_checkpoint(output)
    assert payload["encoder_frozen"] is True
    assert payload["upstream_encoder_trained_by_this_script"] is False
    assert payload["public_test_rows_used_for_gradients"] is False
    assert loaded.model.input_width == 1152


def test_group_leakage_is_rejected(tmp_path) -> None:
    cache = tmp_path / "leaky.npz"
    _feature_cache(cache, leak=True)
    table = load_feature_table(cache)
    with pytest.raises(ValueError, match="group leakage"):
        validate_training_contract(table, 1152)
