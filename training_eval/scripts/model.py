"""Small residual classifier head for a frozen 1,152-dimensional encoder.

The checkpoint tensor names intentionally match the heads used in TEST1:
``norm.*``, ``hidden.*`` and ``residual.*``.  Loading is restricted to
``weights_only=True`` so verification never executes arbitrary pickle code.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import torch
from torch import nn


class ResidualHead(nn.Module):
    """Learn a bounded correction to an existing two-class teacher margin.

    Zero-initialising the final layer makes a new head exactly equal to the
    frozen teacher at step zero.  This is useful when adaptation must improve a
    target domain without needlessly destroying the teacher's ranking elsewhere.
    """

    def __init__(
        self,
        input_width: int = 1152,
        hidden_width: int = 256,
        dropout: float = 0.20,
        *,
        zero_initialize_output: bool = True,
    ) -> None:
        super().__init__()
        if input_width <= 0 or hidden_width <= 0:
            raise ValueError("input_width and hidden_width must be positive")
        if not 0.0 <= dropout < 1.0:
            raise ValueError("dropout must be in [0, 1)")
        self.input_width = int(input_width)
        self.hidden_width = int(hidden_width)
        self.dropout_probability = float(dropout)
        self.norm = nn.LayerNorm(self.input_width)
        self.hidden = nn.Linear(self.input_width, self.hidden_width)
        self.activation = nn.GELU()
        self.dropout = nn.Dropout(self.dropout_probability)
        self.residual = nn.Linear(self.hidden_width, 1)
        if zero_initialize_output:
            nn.init.zeros_(self.residual.weight)
            nn.init.zeros_(self.residual.bias)

    @staticmethod
    def teacher_margin(teacher_logits: torch.Tensor) -> torch.Tensor:
        """Return ``logit(fake) - logit(real)`` from one- or two-column input."""

        if teacher_logits.ndim == 1:
            return teacher_logits.float()
        if teacher_logits.ndim == 2 and teacher_logits.shape[1] == 2:
            return (teacher_logits[:, 1] - teacher_logits[:, 0]).float()
        raise ValueError("teacher_logits must have shape [batch] or [batch, 2]")

    def correction(self, features: torch.Tensor) -> torch.Tensor:
        if features.ndim != 2 or features.shape[1] != self.input_width:
            raise ValueError(f"features must have shape [batch, {self.input_width}]")
        hidden = self.dropout(self.activation(self.hidden(self.norm(features.float()))))
        return self.residual(hidden).squeeze(1)

    def forward(
        self,
        features: torch.Tensor,
        teacher_logits: torch.Tensor,
        *,
        alpha: float = 1.0,
    ) -> torch.Tensor:
        teacher = self.teacher_margin(teacher_logits).detach()
        return teacher + float(alpha) * self.correction(features)

    @property
    def parameter_count(self) -> int:
        return sum(parameter.numel() for parameter in self.parameters())


@dataclass(frozen=True)
class LoadedHead:
    model: ResidualHead
    selected_alpha: float
    payload: dict[str, Any]


def load_head_checkpoint(
    path: str | Path,
    *,
    device: str | torch.device = "cpu",
) -> LoadedHead:
    """Load a TEST1-compatible residual head without executable deserialisation."""

    payload = torch.load(Path(path), map_location="cpu", weights_only=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("state_dict"), dict):
        raise ValueError("checkpoint must be a mapping containing state_dict")
    architecture = payload.get("architecture") or {}
    state = payload["state_dict"]
    input_width = int(architecture.get("input_width", state["norm.weight"].numel()))
    hidden_width = int(architecture.get("hidden_width", state["hidden.bias"].numel()))
    model = ResidualHead(
        input_width=input_width,
        hidden_width=hidden_width,
        dropout=0.0,
        zero_initialize_output=False,
    )
    model.load_state_dict(state, strict=True)
    model.to(device).eval()
    return LoadedHead(
        model=model,
        selected_alpha=float(payload.get("selected_alpha", 1.0)),
        payload=payload,
    )


def checkpoint_tensor_shapes(path: str | Path) -> dict[str, tuple[int, ...]]:
    """Return tensor shapes after a strict, safe checkpoint load."""

    loaded = load_head_checkpoint(path)
    return {name: tuple(tensor.shape) for name, tensor in loaded.model.state_dict().items()}
