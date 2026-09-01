"""Deterministic, label-symmetric robustness views.

Every operation receives only pixels, a recipe name and a seed.  No class label,
generator name or dataset name can influence its parameters.  Applying exactly
the same sampling policy to real and generated images prevents the model from
learning that an augmentation artefact itself means "AI".
"""

from __future__ import annotations

import hashlib
import io
from collections.abc import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


DEFAULT_VIEWS = ("clean", "jpeg", "blur", "resize", "noise", "color", "crop", "overlay")


def stable_seed(sample_id: str, recipe: str, base_seed: int = 2026) -> int:
    payload = f"{base_seed}\0{sample_id}\0{recipe}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(payload).digest()[:8], "big", signed=False)


def _jpeg(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    quality = int(rng.integers(28 if hard else 55, 62 if hard else 93))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality, optimize=False, progressive=False)
    buffer.seek(0)
    with Image.open(buffer) as decoded:
        return decoded.convert("RGB").copy()


def _blur(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    radius = float(rng.uniform(1.2, 2.8) if hard else rng.uniform(0.35, 1.35))
    return image.filter(ImageFilter.GaussianBlur(radius=radius))


def _resize(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    width, height = image.size
    scale = float(rng.uniform(0.20, 0.45) if hard else rng.uniform(0.48, 0.82))
    reduced = image.resize(
        (max(8, round(width * scale)), max(8, round(height * scale))),
        Image.Resampling.BILINEAR,
    )
    return reduced.resize((width, height), Image.Resampling.LANCZOS)


def _noise(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    pixels = np.asarray(image, dtype=np.float32)
    sigma = float(rng.uniform(10.0, 22.0) if hard else rng.uniform(2.5, 9.0))
    noisy = np.clip(pixels + rng.normal(0.0, sigma, pixels.shape), 0.0, 255.0)
    return Image.fromarray(noisy.astype(np.uint8), mode="RGB")


def _color(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    width = 0.42 if hard else 0.20
    factors = rng.uniform(1.0 - width, 1.0 + width, size=3)
    image = ImageEnhance.Brightness(image).enhance(float(factors[0]))
    image = ImageEnhance.Contrast(image).enhance(float(factors[1]))
    return ImageEnhance.Color(image).enhance(float(factors[2]))


def _crop(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    width, height = image.size
    retained = float(rng.uniform(0.58, 0.76) if hard else rng.uniform(0.76, 0.94))
    crop_width, crop_height = max(2, round(width * retained)), max(2, round(height * retained))
    left = int(rng.integers(0, max(1, width - crop_width + 1)))
    top = int(rng.integers(0, max(1, height - crop_height + 1)))
    cropped = image.crop((left, top, left + crop_width, top + crop_height))
    return cropped.resize((width, height), Image.Resampling.LANCZOS)


def _overlay(image: Image.Image, rng: np.random.Generator, hard: bool = False) -> Image.Image:
    """Add neutral platform-like geometry, never a class-specific watermark."""

    base = image.convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    width, height = base.size
    opacity = int(rng.integers(45, 95) if hard else rng.integers(25, 65))
    colour = tuple(int(value) for value in rng.integers(20, 236, size=3)) + (opacity,)
    bar_height = max(2, round(height * float(rng.uniform(0.035, 0.09))))
    y = int(rng.integers(0, max(1, height - bar_height + 1)))
    draw.rounded_rectangle((0, y, width, y + bar_height), radius=max(1, bar_height // 3), fill=colour)
    radius = max(3, round(min(width, height) * float(rng.uniform(0.025, 0.07))))
    x = int(rng.integers(radius, max(radius + 1, width - radius + 1)))
    cy = int(rng.integers(radius, max(radius + 1, height - radius + 1)))
    draw.ellipse((x - radius, cy - radius, x + radius, cy + radius), outline=colour, width=max(1, radius // 4))
    return Image.alpha_composite(base, layer).convert("RGB")


def apply_recipe(image: Image.Image, recipe: str, seed: int) -> Image.Image:
    """Apply one deterministic robustness recipe while preserving output size."""

    original_size = image.size
    image = image.convert("RGB")
    rng = np.random.default_rng(int(seed))
    if recipe == "clean":
        result = image.copy()
    elif recipe == "jpeg":
        result = _jpeg(image, rng)
    elif recipe == "blur":
        result = _blur(image, rng)
    elif recipe == "resize":
        result = _resize(image, rng)
    elif recipe == "noise":
        result = _noise(image, rng)
    elif recipe == "color":
        result = _color(image, rng)
    elif recipe == "crop":
        result = _crop(image, rng)
    elif recipe == "overlay":
        result = _overlay(image, rng)
    elif recipe == "medium":
        result = _resize(image, rng)
        result = _color(result, rng)
        result = _jpeg(result, rng)
    elif recipe == "hard":
        result = _crop(image, rng, hard=True)
        result = _blur(result, rng, hard=True)
        result = _noise(result, rng, hard=True)
        result = _overlay(result, rng, hard=True)
        result = _jpeg(result, rng, hard=True)
    else:
        raise ValueError(f"unknown augmentation recipe: {recipe!r}")
    if result.size != original_size:
        result = result.resize(original_size, Image.Resampling.LANCZOS)
    return result.convert("RGB")


def make_views(
    image: Image.Image,
    sample_id: str,
    *,
    recipes: Iterable[str] = DEFAULT_VIEWS,
    base_seed: int = 2026,
) -> dict[str, Image.Image]:
    return {
        recipe: apply_recipe(image, recipe, stable_seed(sample_id, recipe, base_seed))
        for recipe in recipes
    }
