"""SynthFlag's selected TEST1 routed residual inference graph."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import torch
from torch import nn
from transformers import SiglipVisionConfig, SiglipVisionModel

from .checkpoints import load_expert_state, verify_checkpoint_files


FEATURE_WIDTH = 1152
HIDDEN_WIDTH = 256
LOW_RESOLUTION_MAX_SIDE = 64
LOW_RESOLUTION_ALPHA = 1.25
LARGE_EPOCH05_WEIGHT = 0.65
LARGE_EPOCH08_WEIGHT = 0.35
LARGE_IMAGE_MARGIN_BOUNDARY = -1.557959395647049


def siglip_vision_config() -> SiglipVisionConfig:
    """Describe the frozen Tu et al. Expert 4 SigLIP encoder."""

    return SiglipVisionConfig(
        hidden_size=FEATURE_WIDTH,
        intermediate_size=4304,
        num_hidden_layers=27,
        num_attention_heads=16,
        num_channels=3,
        image_size=384,
        patch_size=14,
        hidden_act="gelu_pytorch_tanh",
        layer_norm_eps=1e-6,
        attention_dropout=0.0,
    )


def _binary_teacher_head() -> nn.Sequential:
    # Numeric Sequential keys are part of the upstream Expert 4 checkpoint.
    return nn.Sequential(
        nn.Linear(FEATURE_WIDTH, HIDDEN_WIDTH),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(HIDDEN_WIDTH, 2),
    )


class SiglipTeacher(nn.Module):
    """Frozen Expert 4 encoder exposing pooled features and teacher logits."""

    def __init__(self) -> None:
        super().__init__()
        self.vision_encoder = SiglipVisionModel(siglip_vision_config())
        self.classifier = _binary_teacher_head()

    def forward(self, pixel_values: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        pooled = self.vision_encoder(pixel_values=pixel_values).pooler_output
        return pooled, self.classifier(pooled)


class ResidualHead(nn.Module):
    """Project-trained scalar correction over a frozen teacher margin."""

    def __init__(
        self,
        input_width: int = FEATURE_WIDTH,
        hidden_width: int = HIDDEN_WIDTH,
        dropout: float = 0.0,
        *,
        zero_initialize_output: bool = False,
    ) -> None:
        super().__init__()
        if input_width <= 0 or hidden_width <= 0:
            raise ValueError("input_width and hidden_width must be positive")
        if not 0.0 <= dropout < 1.0:
            raise ValueError("dropout must be in [0, 1)")
        self.input_width = int(input_width)
        self.hidden_width = int(hidden_width)
        self.norm = nn.LayerNorm(self.input_width)
        self.hidden = nn.Linear(self.input_width, self.hidden_width)
        self.activation = nn.GELU()
        self.dropout = nn.Dropout(float(dropout))
        self.residual = nn.Linear(self.hidden_width, 1)
        if zero_initialize_output:
            nn.init.zeros_(self.residual.weight)
            nn.init.zeros_(self.residual.bias)

    @staticmethod
    def teacher_margin(teacher_logits: torch.Tensor) -> torch.Tensor:
        """Return ``logit(AI) - logit(real)`` from one- or two-column input."""

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
    payload: dict[str, object]


def load_head_checkpoint(
    path: str | Path,
    *,
    device: str | torch.device = "cpu",
) -> LoadedHead:
    """Safely and strictly load one selected TEST1 residual head."""

    checkpoint_path = Path(path)
    payload = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("state_dict"), dict):
        raise ValueError(f"head checkpoint must contain state_dict: {checkpoint_path}")
    architecture = payload.get("architecture") or {}
    if not isinstance(architecture, dict):
        raise ValueError(f"head checkpoint has invalid architecture: {checkpoint_path}")
    state = payload["state_dict"]
    input_width = int(architecture.get("input_width", state["norm.weight"].numel()))
    hidden_width = int(architecture.get("hidden_width", state["hidden.bias"].numel()))
    if input_width != FEATURE_WIDTH or hidden_width != HIDDEN_WIDTH:
        raise ValueError(
            f"head checkpoint has unsupported dimensions {input_width}x{hidden_width}: "
            f"{checkpoint_path}"
        )
    model = ResidualHead(
        input_width=input_width,
        hidden_width=hidden_width,
        dropout=0.0,
        zero_initialize_output=False,
    )
    try:
        model.load_state_dict(state, strict=True)
    except RuntimeError as exc:
        raise RuntimeError(
            f"head checkpoint does not match the selected architecture: {checkpoint_path}"
        ) from exc
    model.to(device).eval()
    return LoadedHead(
        model=model,
        selected_alpha=float(payload.get("selected_alpha", 1.0)),
        payload=payload,
    )


def score_corrected_margins(
    low_resolution_margin: torch.Tensor,
    epoch05_margin: torch.Tensor,
    epoch08_margin: torch.Tensor,
    native_longest_sides: torch.Tensor,
) -> torch.Tensor:
    """Apply the frozen TEST1 route, stack, boundary, and sigmoid conversion."""

    expected_shape = low_resolution_margin.shape
    if (
        low_resolution_margin.ndim != 1
        or epoch05_margin.shape != expected_shape
        or epoch08_margin.shape != expected_shape
        or native_longest_sides.shape != expected_shape
    ):
        raise ValueError("margins and native_longest_sides must be equal 1-D batches")
    if bool((native_longest_sides <= 0).any()):
        raise ValueError("native_longest_sides must be positive")

    large_margin = (
        LARGE_EPOCH05_WEIGHT * epoch05_margin
        + LARGE_EPOCH08_WEIGHT * epoch08_margin
    )
    low_probability = torch.sigmoid(low_resolution_margin.float())
    large_probability = torch.sigmoid(
        large_margin.float() - LARGE_IMAGE_MARGIN_BOUNDARY
    )
    return torch.where(
        native_longest_sides <= LOW_RESOLUTION_MAX_SIDE,
        low_probability,
        large_probability,
    )


def _materialize_teacher(checkpoint_path: Path, device: torch.device) -> SiglipTeacher:
    teacher = SiglipTeacher()
    state = load_expert_state(checkpoint_path)
    try:
        teacher.load_state_dict(state, strict=True, assign=True)
    except RuntimeError as exc:
        raise RuntimeError(
            f"checkpoint does not match the published Expert 4: {checkpoint_path}"
        ) from exc
    del state
    return teacher.to(device).eval()


class SynthFlagDetector(nn.Module):
    """Frozen Expert 4 plus the three routed project-trained TEST1 heads."""

    def __init__(
        self,
        weights_dir: str | Path,
        device: str | torch.device,
        *,
        verify_hashes: bool = True,
    ) -> None:
        super().__init__()
        target_device = torch.device(device)
        files = verify_checkpoint_files(weights_dir, verify_hashes=verify_hashes)
        self.teacher = _materialize_teacher(files["Expert_4_siglip.pth"], target_device)
        low = load_head_checkpoint(files["cifake_router_head.pt"], device=target_device)
        epoch05 = load_head_checkpoint(
            files["general_epoch05_head.pt"], device=target_device
        )
        epoch08 = load_head_checkpoint(
            files["general_epoch08_head.pt"], device=target_device
        )
        if low.selected_alpha != LOW_RESOLUTION_ALPHA:
            raise ValueError("low-resolution head alpha does not match the selected graph")
        if epoch05.selected_alpha != 1.0 or epoch08.selected_alpha != 1.0:
            raise ValueError("large-image head alpha does not match the selected graph")
        self.low_resolution_head = low.model
        self.general_epoch05_head = epoch05.model
        self.general_epoch08_head = epoch08.model

    def forward(
        self,
        siglip_pixels: torch.Tensor,
        native_longest_sides: torch.Tensor,
    ) -> torch.Tensor:
        features, teacher_logits = self.teacher(siglip_pixels)
        low_margin = self.low_resolution_head(
            features,
            teacher_logits,
            alpha=LOW_RESOLUTION_ALPHA,
        )
        epoch05_margin = self.general_epoch05_head(features, teacher_logits)
        epoch08_margin = self.general_epoch08_head(features, teacher_logits)
        return score_corrected_margins(
            low_margin,
            epoch05_margin,
            epoch08_margin,
            native_longest_sides,
        )


# Compatibility aliases for callers of the earlier package surface. These now
# resolve to the selected TEST1 detector, not the retired four-expert mean.
SynthFlagEnsemble = SynthFlagDetector


__all__ = [
    "LoadedHead",
    "ResidualHead",
    "SiglipTeacher",
    "SynthFlagDetector",
    "SynthFlagEnsemble",
    "load_head_checkpoint",
    "score_corrected_margins",
    "siglip_vision_config",
]
