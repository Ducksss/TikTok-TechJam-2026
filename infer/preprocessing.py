"""Backbone-specific, deterministic image preprocessing."""

from __future__ import annotations

from dataclasses import dataclass

import torch
from PIL import Image
from torchvision.transforms import InterpolationMode
from torchvision.transforms import functional as visionf


@dataclass(frozen=True)
class ImageRecipe:
    short_edge: int
    mean: tuple[float, float, float]
    standard_deviation: tuple[float, float, float]


CLIP_RECIPE = ImageRecipe(
    short_edge=224,
    mean=(0.48145466, 0.4578275, 0.40821073),
    standard_deviation=(0.26862954, 0.26130258, 0.27577711),
)
SIGLIP_RECIPE = ImageRecipe(
    short_edge=384,
    mean=(0.5, 0.5, 0.5),
    standard_deviation=(0.5, 0.5, 0.5),
)


def prepare_image(image: Image.Image, recipe: ImageRecipe) -> torch.Tensor:
    """Convert one PIL image using bicubic short-edge resize and center crop."""

    rgb = image.convert("RGB")
    resized = visionf.resize(
        rgb,
        recipe.short_edge,
        interpolation=InterpolationMode.BICUBIC,
        antialias=True,
    )
    cropped = visionf.center_crop(resized, [recipe.short_edge, recipe.short_edge])
    unit_tensor = visionf.to_tensor(cropped)
    return visionf.normalize(
        unit_tensor,
        mean=recipe.mean,
        std=recipe.standard_deviation,
    )


def prepare_batch(
    images: list[Image.Image],
    recipe: ImageRecipe,
    device: torch.device,
) -> torch.Tensor:
    return torch.stack([prepare_image(image, recipe) for image in images]).to(device)
