"""Repository-authored pixel transforms used by :mod:`synthflag_augment`."""

from __future__ import annotations

import math
from io import BytesIO
from random import Random
from typing import Callable, TypeAlias

import torch
import torch.nn.functional as torch_functional
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat
from torchvision.transforms.functional import pil_to_tensor, to_pil_image


ParameterValue: TypeAlias = bool | int | float | str
TransformOutput: TypeAlias = tuple[Image.Image, dict[str, ParameterValue]]
TransformFunction: TypeAlias = Callable[[Image.Image, float, Random], TransformOutput]


def _jpeg_roundtrip(image: Image.Image, *, quality: int) -> Image.Image:
    buffer = BytesIO()
    image.save(
        buffer,
        format="JPEG",
        quality=quality,
        subsampling=2,
        optimize=False,
        progressive=False,
    )
    buffer.seek(0)
    with Image.open(buffer) as decoded:
        return decoded.convert("RGB").copy()


def _local_generator(random_source: Random) -> tuple[torch.Generator, int]:
    seed = random_source.getrandbits(63)
    generator = torch.Generator(device="cpu")
    generator.manual_seed(seed)
    return generator, seed


def _to_rgb_image(tensor: torch.Tensor) -> Image.Image:
    pixels = tensor.round().clamp(0, 255).to(torch.uint8)
    return to_pil_image(pixels).convert("RGB")


def _soften(image: Image.Image, strength: float, _: Random) -> TransformOutput:
    radius = round(0.25 + 3.75 * strength, 6)
    return image.filter(ImageFilter.GaussianBlur(radius)), {"radius": radius}


def _jpeg_cycle(image: Image.Image, strength: float, _: Random) -> TransformOutput:
    quality = max(25, round(95 - 70 * strength))
    return _jpeg_roundtrip(image, quality=quality), {
        "quality": quality,
        "subsampling": "4:2:0",
    }


def _resize_echo(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    scale = 1.0 - 0.75 * strength
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    samplers = (
        ("bilinear", Image.Resampling.BILINEAR),
        ("bicubic", Image.Resampling.BICUBIC),
        ("lanczos", Image.Resampling.LANCZOS),
    )
    sampler_name, sampler = samplers[random_source.randrange(len(samplers))]
    reduced = image.resize((width, height), resample=sampler)
    restored = reduced.resize(image.size, resample=sampler)
    return restored, {
        "scale": round(scale, 6),
        "intermediate_width": width,
        "intermediate_height": height,
        "resample": sampler_name,
    }


def _tone_curve(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    brightness = 1.0 + random_source.uniform(-0.45, 0.45) * strength
    contrast = 1.0 + random_source.uniform(-0.55, 0.55) * strength
    saturation = 1.0 + random_source.uniform(-0.55, 0.55) * strength
    result = ImageEnhance.Brightness(image).enhance(brightness)
    result = ImageEnhance.Contrast(result).enhance(contrast)
    result = ImageEnhance.Color(result).enhance(saturation)
    return result, {
        "brightness": round(brightness, 6),
        "contrast": round(contrast, 6),
        "saturation": round(saturation, 6),
    }


def _sensor_noise(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    sigma = 32.0 * strength
    generator, noise_seed = _local_generator(random_source)
    source = pil_to_tensor(image).to(dtype=torch.float32)
    noise = torch.randn(source.shape, generator=generator, dtype=source.dtype)
    return _to_rgb_image(source + noise * sigma), {
        "sigma": round(sigma, 6),
        "noise_seed_hex": f"{noise_seed:016x}",
    }


def _gamma_curve(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    exponent = math.exp(random_source.uniform(-0.9, 0.9) * strength)
    lookup = [
        round(255.0 * math.pow(value / 255.0, exponent))
        for value in range(256)
    ]
    return image.point(lookup * 3), {"exponent": round(exponent, 6)}


def _posterize(image: Image.Image, strength: float, _: Random) -> TransformOutput:
    bits = max(2, 8 - math.ceil(6 * strength))
    return ImageOps.posterize(image, bits), {"bits": bits}


def _patch_dropout(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    area_fraction = 0.02 + 0.28 * strength
    aspect_ratio = math.exp(random_source.uniform(math.log(0.5), math.log(2.0)))
    target_area = image.width * image.height * area_fraction
    patch_width = min(
        image.width,
        max(1, round(math.sqrt(target_area * aspect_ratio))),
    )
    patch_height = min(
        image.height,
        max(1, round(math.sqrt(target_area / aspect_ratio))),
    )
    left = random_source.randrange(image.width - patch_width + 1)
    top = random_source.randrange(image.height - patch_height + 1)
    fill = tuple(round(value) for value in ImageStat.Stat(image).mean[:3])
    result = image.copy()
    result.paste(
        fill,
        (left, top, left + patch_width, top + patch_height),
    )
    return result, {
        "left": left,
        "top": top,
        "width": patch_width,
        "height": patch_height,
        "fill": ",".join(str(value) for value in fill),
    }


def _compression_blocks(
    image: Image.Image,
    strength: float,
    _: Random,
) -> TransformOutput:
    quality = max(18, round(82 - 58 * strength))
    scale = 1.0 - 0.55 * strength
    width = max(1, round(image.width * scale))
    height = max(1, round(image.height * scale))
    blend = 0.12 + 0.38 * strength

    compressed = _jpeg_roundtrip(image, quality=quality)
    reduced = compressed.resize((width, height), Image.Resampling.BOX)
    blocked = reduced.resize(image.size, Image.Resampling.NEAREST)
    result = Image.blend(compressed, blocked, blend)
    return result, {
        "quality": quality,
        "scale": round(scale, 6),
        "blend": round(blend, 6),
        "intermediate_width": width,
        "intermediate_height": height,
    }


def _exposure_shift(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    direction = -1.0 if random_source.randrange(2) == 0 else 1.0
    ev = direction * strength * random_source.uniform(0.25, 2.0)
    gain = math.pow(2.0, ev)
    source = pil_to_tensor(image).to(dtype=torch.float32)
    return _to_rgb_image(source * gain), {
        "ev": round(ev, 6),
        "gain": round(gain, 6),
    }


def _impulse_noise(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    rate = 0.002 + 0.118 * strength
    generator, noise_seed = _local_generator(random_source)
    source = pil_to_tensor(image).to(dtype=torch.float32)
    decisions = torch.rand(
        (image.height, image.width),
        generator=generator,
        dtype=source.dtype,
    )
    salt = decisions < rate / 2.0
    pepper = (decisions >= rate / 2.0) & (decisions < rate)
    result = source.clone()
    result[:, salt] = 255.0
    result[:, pepper] = 0.0
    return _to_rgb_image(result), {
        "rate": round(rate, 6),
        "noise_seed_hex": f"{noise_seed:016x}",
    }


def _motion_smear(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    directions = (
        ("horizontal", 1, 0),
        ("vertical", 0, 1),
        ("diagonal_down", 1, 1),
        ("diagonal_up", 1, -1),
    )
    direction, step_x, step_y = directions[random_source.randrange(len(directions))]
    radius = max(1, round(1 + 7 * strength))
    source = pil_to_tensor(image).to(dtype=torch.float32).unsqueeze(0)
    padded = torch_functional.pad(
        source,
        (radius, radius, radius, radius),
        mode="replicate",
    )
    samples = []
    for offset in range(-radius, radius + 1):
        left = radius + step_x * offset
        top = radius + step_y * offset
        samples.append(
            padded[
                :,
                :,
                top : top + image.height,
                left : left + image.width,
            ]
        )
    result = torch.stack(samples).mean(dim=0).squeeze(0)
    return _to_rgb_image(result), {
        "direction": direction,
        "radius": radius,
        "samples": len(samples),
    }


def _repost_chain(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    crop_fraction = 0.02 + 0.20 * strength
    crop_width = max(1, round(image.width * (1.0 - crop_fraction)))
    crop_height = max(1, round(image.height * (1.0 - crop_fraction)))
    left = random_source.randrange(image.width - crop_width + 1)
    top = random_source.randrange(image.height - crop_height + 1)
    right = left + crop_width
    bottom = top + crop_height

    samplers = (
        ("bilinear", Image.Resampling.BILINEAR),
        ("bicubic", Image.Resampling.BICUBIC),
        ("lanczos", Image.Resampling.LANCZOS),
    )
    sampler_name, sampler = samplers[random_source.randrange(len(samplers))]
    result = image.crop((left, top, right, bottom)).resize(image.size, sampler)

    cycle_count = 1 + min(2, math.floor(3 * strength))
    qualities: list[int] = []
    for _ in range(cycle_count):
        quality = max(22, round(94 - 54 * strength - random_source.uniform(0, 8)))
        qualities.append(quality)
        result = _jpeg_roundtrip(result, quality=quality)

    return result, {
        "crop_fraction": round(crop_fraction, 6),
        "crop_box": f"{left},{top},{right},{bottom}",
        "resample": sampler_name,
        "qualities": ",".join(str(value) for value in qualities),
    }


def _edge_shift(plane: torch.Tensor, *, pixels: int) -> torch.Tensor:
    if pixels == 0 or plane.shape[1] <= 1:
        return plane
    limited = max(-(plane.shape[1] - 1), min(plane.shape[1] - 1, pixels))
    padding = abs(limited)
    padded = torch_functional.pad(
        plane.unsqueeze(0).unsqueeze(0),
        (padding, padding, 0, 0),
        mode="replicate",
    ).squeeze(0).squeeze(0)
    start = padding - limited
    return padded[:, start : start + plane.shape[1]]


def _screen_capture(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    source = pil_to_tensor(image).to(dtype=torch.float32)
    scanline_period = random_source.randint(2, 6)
    scanline_phase = random_source.randrange(scanline_period)
    moire_period = random_source.uniform(6.0, 18.0)
    moire_angle = random_source.uniform(-math.pi / 3.0, math.pi / 3.0)
    moire_phase = random_source.uniform(0.0, 2.0 * math.pi)

    y_coordinates = torch.arange(image.height, dtype=source.dtype)
    x_coordinates = torch.arange(image.width, dtype=source.dtype)
    y_grid, x_grid = torch.meshgrid(y_coordinates, x_coordinates, indexing="ij")
    scanlines = ((y_grid + scanline_phase) % scanline_period == 0).to(source.dtype)
    scanline_gain = 1.0 - scanlines * (0.04 + 0.16 * strength)
    projection = x_grid * math.cos(moire_angle) + y_grid * math.sin(moire_angle)
    moire = torch.sin(projection * (2.0 * math.pi / moire_period) + moire_phase)
    result = source * scanline_gain.unsqueeze(0)
    result = result + moire.unsqueeze(0) * (3.0 + 15.0 * strength)

    requested_shift = max(1, round(1 + 2 * strength))
    channel_shift = min(requested_shift, max(0, image.width - 1))
    if channel_shift:
        result[0] = _edge_shift(result[0], pixels=channel_shift)
        result[2] = _edge_shift(result[2], pixels=-channel_shift)
    return _to_rgb_image(result), {
        "scanline_period": scanline_period,
        "moire_period": round(moire_period, 6),
        "moire_angle_degrees": round(math.degrees(moire_angle), 6),
        "channel_shift": channel_shift,
    }


def _shot_noise(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    peak_photons = max(8, round(8 + 248 * math.pow(1.0 - strength, 2.0)))
    generator, noise_seed = _local_generator(random_source)
    source = pil_to_tensor(image).to(dtype=torch.float32) / 255.0
    result = torch.poisson(source * peak_photons, generator=generator)
    result = result * (255.0 / peak_photons)
    return _to_rgb_image(result), {
        "peak_photons": peak_photons,
        "noise_seed_hex": f"{noise_seed:016x}",
    }


def _speckle_noise(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    sigma = 0.015 + 0.235 * strength
    generator, noise_seed = _local_generator(random_source)
    source = pil_to_tensor(image).to(dtype=torch.float32)
    noise = torch.randn(source.shape, generator=generator, dtype=source.dtype)
    return _to_rgb_image(source + source * noise * sigma), {
        "sigma": round(sigma, 6),
        "noise_seed_hex": f"{noise_seed:016x}",
    }


def _white_balance(
    image: Image.Image,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    temperature = random_source.uniform(-1.0, 1.0) * strength
    tint = random_source.uniform(-1.0, 1.0) * strength
    gains = torch.tensor(
        (
            1.0 + 0.32 * temperature + 0.06 * tint,
            1.0 + 0.14 * tint - 0.08 * abs(temperature),
            1.0 - 0.32 * temperature + 0.06 * tint,
        ),
        dtype=torch.float32,
    )
    source = pil_to_tensor(image).to(dtype=torch.float32)
    result = source * gains[:, None, None]
    return _to_rgb_image(result), {
        "red_gain": round(float(gains[0]), 6),
        "green_gain": round(float(gains[1]), 6),
        "blue_gain": round(float(gains[2]), 6),
    }


_TRANSFORMS: dict[str, TransformFunction] = {
    "compression_blocks": _compression_blocks,
    "exposure_shift": _exposure_shift,
    "gamma_curve": _gamma_curve,
    "impulse_noise": _impulse_noise,
    "jpeg_cycle": _jpeg_cycle,
    "motion_smear": _motion_smear,
    "patch_dropout": _patch_dropout,
    "posterize": _posterize,
    "repost_chain": _repost_chain,
    "resize_echo": _resize_echo,
    "screen_capture": _screen_capture,
    "sensor_noise": _sensor_noise,
    "shot_noise": _shot_noise,
    "soften": _soften,
    "speckle_noise": _speckle_noise,
    "tone_curve": _tone_curve,
    "white_balance": _white_balance,
}


def available_transforms() -> tuple[str, ...]:
    """Return the stable public transform identifiers."""

    return tuple(sorted(_TRANSFORMS))


def apply_transform(
    image: Image.Image,
    *,
    name: str,
    strength: float,
    random_source: Random,
) -> TransformOutput:
    """Apply one validated transform and preserve RGB size invariants."""

    if name not in _TRANSFORMS:
        raise ValueError(f"unknown transform: {name!r}")
    if not math.isfinite(strength) or not 0.0 <= strength <= 1.0:
        raise ValueError("strength must be finite and within [0, 1]")

    source = image.convert("RGB")
    if strength == 0.0:
        return source.copy(), {}

    result, parameters = _TRANSFORMS[name](source, strength, random_source)
    if result.mode != "RGB" or result.size != source.size:
        raise RuntimeError(f"transform {name!r} violated RGB size invariants")
    return result, parameters
