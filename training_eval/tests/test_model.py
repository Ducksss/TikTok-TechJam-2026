from __future__ import annotations

import torch

from model import ResidualHead, load_head_checkpoint


def test_zero_initialisation_is_teacher_identity() -> None:
    model = ResidualHead(input_width=8, hidden_width=4, dropout=0.0)
    features = torch.randn(6, 8)
    teacher_logits = torch.randn(6, 2)
    expected = teacher_logits[:, 1] - teacher_logits[:, 0]
    assert torch.equal(model(features, teacher_logits), expected)


def test_checkpoint_state_dict_is_strictly_compatible(tmp_path) -> None:
    model = ResidualHead(input_width=8, hidden_width=4, dropout=0.0)
    payload = {
        "model_class": "DomainResidualHead",
        "architecture": {"input_width": 8, "hidden_width": 4, "training_dropout": 0.2},
        "state_dict": model.state_dict(),
        "selected_alpha": 1.25,
    }
    path = tmp_path / "head.pt"
    torch.save(payload, path)
    loaded = load_head_checkpoint(path)
    assert loaded.selected_alpha == 1.25
    assert loaded.model.input_width == 8
    assert set(loaded.model.state_dict()) == set(model.state_dict())
