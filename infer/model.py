"""Public SynthFlag model API over the independently organized runtime."""

from __future__ import annotations

from collections.abc import Sequence
from contextlib import nullcontext
from pathlib import Path

import torch
from PIL import Image
from torchvision.transforms import functional as visionf

from .architecture import FeatDistillEnsemble, SynthFlagEnsemble
from .checkpoints import checkpoint_identity_digest, verify_checkpoint_files
from .preprocessing import CLIP_RECIPE, SIGLIP_RECIPE, prepare_batch


def resolve_device(device: str | torch.device) -> torch.device:
    """Resolve `auto` using the historical CUDA-then-CPU batch CLI policy."""

    if str(device).lower() == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    resolved = torch.device(device)
    if resolved.type == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but is not available")
    if resolved.type == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS was requested but is not available")
    return resolved


def _validate_tensor_batch(images: torch.Tensor) -> None:
    if (
        not isinstance(images, torch.Tensor)
        or images.ndim != 4
        or images.shape[1] != 3
    ):
        raise ValueError("images must be a torch tensor with shape [B,3,H,W]")
    if images.is_floating_point():
        if not bool(torch.isfinite(images).all()):
            raise ValueError("images contain NaN or infinity")
        if images.numel() and (
            float(images.min()) < 0.0 or float(images.max()) > 1.0
        ):
            raise ValueError("floating-point images must be in [0,1]")
    elif images.dtype != torch.uint8:
        raise ValueError("integer images must use torch.uint8")


def _validate_score_batch(scores: torch.Tensor, expected_size: int) -> None:
    if scores.ndim != 1 or scores.shape[0] != expected_size:
        raise RuntimeError("model produced an invalid score batch shape")
    if not bool(torch.isfinite(scores).all()):
        raise RuntimeError("model produced a non-finite score")
    if bool(((scores < 0.0) | (scores > 1.0)).any()):
        raise RuntimeError("model produced a score outside [0,1]")


class Model:
    """Checkpoint-backed image scorer used by the CLI and HTTP service."""

    def __init__(
        self,
        device: str | torch.device = "auto",
        model_data_dir: str | Path = "weights",
        *,
        verify_hashes: bool = True,
        use_amp: bool = True,
    ) -> None:
        self.device = resolve_device(device)
        self.use_amp = bool(use_amp and self.device.type == "cuda")
        self.model = SynthFlagEnsemble(
            model_data_dir,
            self.device,
            verify_hashes=verify_hashes,
        ).eval()

    @torch.inference_mode()
    def predict(self, images: torch.Tensor) -> torch.Tensor:
        """Score a `[B,3,H,W]` uint8 batch or a float batch in `[0,1]`."""

        _validate_tensor_batch(images)
        if images.shape[0] == 0:
            return torch.empty(0, dtype=torch.float32, device=self.device)
        pil_images = [visionf.to_pil_image(image.cpu()) for image in images]
        return self.predict_pil(pil_images)

    @torch.inference_mode()
    def predict_pil(self, images: Sequence[Image.Image]) -> torch.Tensor:
        """Score PIL inputs after independent CLIP and SigLIP preprocessing."""

        image_list = list(images)
        if not image_list:
            return torch.empty(0, dtype=torch.float32, device=self.device)
        if any(not isinstance(image, Image.Image) for image in image_list):
            raise TypeError("predict_pil expects a sequence of PIL images")

        siglip_batch = prepare_batch(image_list, SIGLIP_RECIPE, self.device)
        clip_batch = prepare_batch(image_list, CLIP_RECIPE, self.device)
        precision_context = (
            torch.amp.autocast("cuda", enabled=True)
            if self.use_amp
            else nullcontext()
        )
        with precision_context:
            scores = self.model(siglip_batch, clip_batch)

        _validate_score_batch(scores, len(image_list))
        return scores


__all__ = [
    "FeatDistillEnsemble",
    "Model",
    "SynthFlagEnsemble",
    "checkpoint_identity_digest",
    "resolve_device",
    "verify_checkpoint_files",
]
