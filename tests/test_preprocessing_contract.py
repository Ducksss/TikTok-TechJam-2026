from __future__ import annotations

import hashlib
import unittest

from PIL import Image

from infer.preprocessing import CLIP_RECIPE, SIGLIP_RECIPE, prepare_image


def _characterization_image() -> Image.Image:
    image = Image.new("RGB", (509, 307))
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            pixels[x, y] = (
                (x * 17 + y * 3) % 256,
                (x * 5 + y * 11) % 256,
                (x + y * 19) % 256,
            )
    return image


class PreprocessingContractTest(unittest.TestCase):
    def test_clip_preprocessing_characterization(self) -> None:
        tensor = prepare_image(_characterization_image(), CLIP_RECIPE)
        self.assertEqual(tuple(tensor.shape), (3, 224, 224))
        self.assertEqual(
            hashlib.sha256(tensor.numpy().tobytes()).hexdigest(),
            "2049103babf20d81c6ba48c667a4a6dc7b69ad87aef4b0a9809ea0980f2ffd20",
        )

    def test_siglip_preprocessing_characterization(self) -> None:
        tensor = prepare_image(_characterization_image(), SIGLIP_RECIPE)
        self.assertEqual(tuple(tensor.shape), (3, 384, 384))
        self.assertEqual(
            hashlib.sha256(tensor.numpy().tobytes()).hexdigest(),
            "3bada0a8006313871f6266d35f3716ed15e3bbfc9c028f9c5c6ddb6a458cab41",
        )


if __name__ == "__main__":
    unittest.main()
