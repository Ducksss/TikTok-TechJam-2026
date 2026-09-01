from __future__ import annotations

import numpy as np
import pytest
from PIL import Image

from augmentations import apply_recipe, make_views, stable_seed


@pytest.fixture
def image() -> Image.Image:
    y, x = np.mgrid[:96, :128]
    pixels = np.stack((x % 256, y % 256, (x + y) % 256), axis=-1).astype(np.uint8)
    return Image.fromarray(pixels, mode="RGB")


@pytest.mark.parametrize(
    "recipe",
    ["clean", "jpeg", "blur", "resize", "noise", "color", "crop", "overlay", "medium", "hard"],
)
def test_recipes_are_deterministic_and_size_preserving(image: Image.Image, recipe: str) -> None:
    first = np.asarray(apply_recipe(image, recipe, 42))
    second = np.asarray(apply_recipe(image, recipe, 42))
    assert first.shape == (96, 128, 3)
    assert np.array_equal(first, second)


def test_view_generation_has_no_label_input(image: Image.Image) -> None:
    first = make_views(image, "sample-7", recipes=("jpeg", "overlay"))
    second = make_views(image, "sample-7", recipes=("jpeg", "overlay"))
    assert np.array_equal(np.asarray(first["jpeg"]), np.asarray(second["jpeg"]))
    assert stable_seed("sample-7", "jpeg") != stable_seed("sample-7", "overlay")
