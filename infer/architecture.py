"""SynthFlag's checkpoint-compatible four-expert inference graph."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as nnf
from transformers import (
    CLIPVisionConfig,
    CLIPVisionModelWithProjection,
    SiglipVisionConfig,
    SiglipVisionModel,
)

from .checkpoints import load_expert_state, verify_checkpoint_files


def clip_vision_config() -> CLIPVisionConfig:
    """Describe the CLIP ViT-L/14 vision encoder stored in experts 1 and 2."""

    return CLIPVisionConfig(
        hidden_size=1024,
        intermediate_size=4096,
        projection_dim=768,
        num_hidden_layers=24,
        num_attention_heads=16,
        num_channels=3,
        image_size=224,
        patch_size=14,
        hidden_act="quick_gelu",
        layer_norm_eps=1e-5,
        attention_dropout=0.0,
        initializer_range=0.02,
        initializer_factor=1.0,
    )


def siglip_vision_config() -> SiglipVisionConfig:
    """Describe the SigLIP So400M Patch14-384 encoder in experts 3 and 4."""

    return SiglipVisionConfig(
        hidden_size=1152,
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


def _binary_head(feature_width: int) -> nn.Sequential:
    # The numeric Sequential keys are part of the released checkpoint format.
    return nn.Sequential(
        nn.Linear(feature_width, 256),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(256, 2),
    )


class ClipCheckpointExpert(nn.Module):
    """CLIP vision encoder and binary head with checkpoint-compatible keys."""

    def __init__(self) -> None:
        super().__init__()
        self.vision_encoder = CLIPVisionModelWithProjection(clip_vision_config())
        self.classifier = _binary_head(768)

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        embedding = self.vision_encoder(pixel_values=pixel_values).image_embeds
        return self.classifier(embedding)


class SiglipCheckpointExpert(nn.Module):
    """SigLIP vision encoder and binary head with checkpoint-compatible keys."""

    def __init__(self) -> None:
        super().__init__()
        self.vision_encoder = SiglipVisionModel(siglip_vision_config())
        self.classifier = _binary_head(1152)

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        pooled = self.vision_encoder(pixel_values=pixel_values).pooler_output
        return self.classifier(pooled)


def _materialize_expert(
    factory: Callable[[], nn.Module],
    checkpoint_path: Path,
    device: torch.device,
) -> nn.Module:
    expert = factory()
    state = load_expert_state(checkpoint_path)
    try:
        expert.load_state_dict(state, strict=True, assign=True)
    except RuntimeError as exc:
        raise RuntimeError(
            f"checkpoint does not match the declared expert architecture: {checkpoint_path}"
        ) from exc
    del state
    return expert.to(device).eval()


class SynthFlagEnsemble(nn.Module):
    """Two CLIP and two SigLIP experts combined per the FeatDistill method."""

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
        self.expert1_clip = _materialize_expert(
            ClipCheckpointExpert, files["Expert_1_clip.pth"], target_device
        )
        self.expert2_clip = _materialize_expert(
            ClipCheckpointExpert, files["Expert_2_clip.pth"], target_device
        )
        self.expert3_siglip = _materialize_expert(
            SiglipCheckpointExpert, files["Expert_3_siglip.pth"], target_device
        )
        self.expert4_siglip = _materialize_expert(
            SiglipCheckpointExpert, files["Expert_4_siglip.pth"], target_device
        )

    @staticmethod
    def _fake_probability(logits: torch.Tensor) -> torch.Tensor:
        return nnf.softmax(logits.float(), dim=1)[:, 1]

    def forward(
        self,
        siglip_pixels: torch.Tensor,
        clip_pixels: torch.Tensor,
    ) -> torch.Tensor:
        clip_1 = self._fake_probability(self.expert1_clip(clip_pixels))
        clip_2 = self._fake_probability(self.expert2_clip(clip_pixels))
        siglip_3 = self._fake_probability(self.expert3_siglip(siglip_pixels))
        siglip_4 = self._fake_probability(self.expert4_siglip(siglip_pixels))
        # Keep the released detector's arithmetic order for numerical parity.
        return (siglip_3 + siglip_4 + clip_1 + clip_2) / 4.0


# Compatibility for Python callers that imported the research-method class name.
FeatDistillEnsemble = SynthFlagEnsemble
