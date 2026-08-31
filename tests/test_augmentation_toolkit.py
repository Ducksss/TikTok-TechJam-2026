from __future__ import annotations

import json
import random
import unittest

import torch
from PIL import Image

from synthflag_augment import (
    AugmentationPipeline,
    TransformSpec,
    available_transforms,
    robustness_recipe,
)


def _pattern_image(width: int = 31, height: int = 23) -> Image.Image:
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            pixels[x, y] = (
                (x * 19 + y * 7) % 256,
                (x * 3 + y * 23) % 256,
                (x * 11 + y * 5) % 256,
            )
    return image


class AugmentationToolkitTest(unittest.TestCase):
    def test_public_transform_inventory_is_explicit(self) -> None:
        self.assertEqual(
            available_transforms(),
            (
                "compression_blocks",
                "exposure_shift",
                "gamma_curve",
                "impulse_noise",
                "jpeg_cycle",
                "motion_smear",
                "patch_dropout",
                "posterize",
                "repost_chain",
                "resize_echo",
                "screen_capture",
                "sensor_noise",
                "shot_noise",
                "soften",
                "speckle_noise",
                "tone_curve",
                "white_balance",
            ),
        )

    def test_zero_strength_is_identity_for_every_transform(self) -> None:
        source = _pattern_image()
        pipeline = AugmentationPipeline(
            [TransformSpec(name=name, strength=0.0) for name in available_transforms()],
            seed="identity-check",
        )

        result = pipeline.apply(source, sample_key="sample.png")

        self.assertEqual(result.image.mode, "RGB")
        self.assertEqual(result.image.size, source.size)
        self.assertEqual(result.image.tobytes(), source.tobytes())
        self.assertEqual(len(result.trace), len(available_transforms()))
        self.assertTrue(all(entry.applied for entry in result.trace))

    def test_pipeline_is_sample_keyed_and_does_not_mutate_input(self) -> None:
        source = _pattern_image()
        original_bytes = source.tobytes()
        pipeline = AugmentationPipeline(
            (
                TransformSpec("tone_curve", strength=(0.35, 0.8)),
                TransformSpec("sensor_noise", strength=(0.2, 0.5)),
                TransformSpec("patch_dropout", strength=(0.15, 0.4)),
            ),
            seed="benchmark-v1",
        )

        random.seed(1)
        global_random_state = random.getstate()
        first = pipeline.apply(source, sample_key="dataset/example.png")
        self.assertEqual(random.getstate(), global_random_state)
        random.seed(999_999)
        second = pipeline.apply(source, sample_key="dataset/example.png")
        other = pipeline.apply(source, sample_key="dataset/other.png")

        self.assertEqual(source.tobytes(), original_bytes)
        self.assertEqual(first.image.tobytes(), second.image.tobytes())
        self.assertEqual(first.trace, second.trace)
        self.assertNotEqual(first.image.tobytes(), other.image.tobytes())
        self.assertEqual(first.image.size, source.size)
        self.assertEqual(first.image.mode, "RGB")

    def test_noise_transforms_do_not_mutate_torch_global_random_state(self) -> None:
        pipeline = AugmentationPipeline(
            (
                TransformSpec("sensor_noise", strength=0.8),
                TransformSpec("shot_noise", strength=0.8),
                TransformSpec("impulse_noise", strength=0.8),
                TransformSpec("speckle_noise", strength=0.8),
            ),
            seed="local-generators",
        )
        torch.manual_seed(2026)
        state_before = torch.random.get_rng_state().clone()

        pipeline.apply(_pattern_image(), sample_key="noise.png")

        self.assertTrue(torch.equal(torch.random.get_rng_state(), state_before))

    def test_high_value_families_change_pixels_and_record_parameters(self) -> None:
        expected_parameter_keys = {
            "compression_blocks": {"quality", "scale", "blend"},
            "exposure_shift": {"ev", "gain"},
            "impulse_noise": {"rate", "noise_seed_hex"},
            "motion_smear": {"direction", "radius", "samples"},
            "repost_chain": {"crop_fraction", "crop_box", "qualities"},
            "screen_capture": {"scanline_period", "moire_period", "channel_shift"},
            "shot_noise": {"peak_photons", "noise_seed_hex"},
            "speckle_noise": {"sigma", "noise_seed_hex"},
            "white_balance": {"red_gain", "green_gain", "blue_gain"},
        }
        source = _pattern_image(width=64, height=48)

        for name, keys in expected_parameter_keys.items():
            with self.subTest(name=name):
                result = AugmentationPipeline(
                    [TransformSpec(name, strength=0.85)],
                    seed="family-contract",
                ).apply(source, sample_key=f"{name}.png")
                repeated = AugmentationPipeline(
                    [TransformSpec(name, strength=0.85)],
                    seed="family-contract",
                ).apply(source, sample_key=f"{name}.png")
                self.assertNotEqual(result.image.tobytes(), source.tobytes())
                self.assertEqual(result.image.tobytes(), repeated.image.tobytes())
                self.assertEqual(result.trace, repeated.trace)
                self.assertTrue(keys.issubset(result.trace[0].parameters))
                json.dumps(result.manifest)

    def test_skipped_transform_is_recorded_without_pixel_changes(self) -> None:
        source = _pattern_image()
        pipeline = AugmentationPipeline(
            [TransformSpec("jpeg_cycle", strength=1.0, probability=0.0)],
            seed=7,
        )

        result = pipeline.apply(source, sample_key="skip")

        self.assertEqual(result.image.tobytes(), source.tobytes())
        self.assertEqual(len(result.trace), 1)
        self.assertFalse(result.trace[0].applied)
        self.assertEqual(result.trace[0].parameters, {})

    def test_every_transform_accepts_tiny_non_rgb_inputs(self) -> None:
        sources = (
            Image.new("L", (1, 1), 80),
            Image.new("RGBA", (2, 3), (10, 20, 30, 40)),
        )

        for source in sources:
            for name in available_transforms():
                with self.subTest(mode=source.mode, size=source.size, name=name):
                    result = AugmentationPipeline(
                        [TransformSpec(name, strength=1.0)],
                        seed="tiny-input",
                    ).apply(source, sample_key=f"{source.mode}-{name}")
                    self.assertEqual(result.image.mode, "RGB")
                    self.assertEqual(result.image.size, source.size)

    def test_pipeline_identity_changes_with_recipe_or_seed(self) -> None:
        baseline = AugmentationPipeline(
            [TransformSpec("soften", strength=0.5)],
            seed="one",
        )
        same = AugmentationPipeline(
            [TransformSpec("soften", strength=0.5)],
            seed="one",
        )
        other_seed = AugmentationPipeline(
            [TransformSpec("soften", strength=0.5)],
            seed="two",
        )
        other_recipe = AugmentationPipeline(
            [TransformSpec("soften", strength=0.6)],
            seed="one",
        )

        self.assertEqual(baseline.pipeline_id, same.pipeline_id)
        self.assertNotEqual(baseline.pipeline_id, other_seed.pipeline_id)
        self.assertNotEqual(baseline.pipeline_id, other_recipe.pipeline_id)

    def test_manifest_is_json_serializable_and_records_parameters(self) -> None:
        pipeline = AugmentationPipeline(
            [TransformSpec("posterize", strength=1.0)],
            seed="manifest",
        )

        result = pipeline.apply(_pattern_image(), sample_key="row-42")
        payload = result.manifest

        self.assertEqual(payload["schema_version"], 1)
        self.assertEqual(payload["sample_key"], "row-42")
        self.assertEqual(payload["transforms"][0]["name"], "posterize")
        self.assertEqual(payload["transforms"][0]["parameters"], {"bits": 2})
        json.dumps(payload)

    def test_invalid_specs_fail_at_pipeline_construction(self) -> None:
        invalid_specs = (
            TransformSpec("missing", strength=0.5),
            TransformSpec("soften", strength=-0.1),
            TransformSpec("soften", strength=1.1),
            TransformSpec("soften", strength=(0.8, 0.2)),
            TransformSpec("soften", probability=-0.1),
            TransformSpec("soften", probability=1.1),
        )

        for spec in invalid_specs:
            with self.subTest(spec=spec):
                with self.assertRaises(ValueError):
                    AugmentationPipeline([spec])

    def test_invalid_apply_inputs_fail_before_transformation(self) -> None:
        pipeline = AugmentationPipeline([TransformSpec("soften")])

        with self.assertRaises(TypeError):
            pipeline.apply("not-an-image", sample_key="row")  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            pipeline.apply(_pattern_image(), sample_key="")

    def test_robustness_recipe_uses_only_public_transforms(self) -> None:
        pipeline = robustness_recipe(seed="release")

        self.assertGreaterEqual(len(pipeline.steps), 12)
        self.assertTrue(
            all(step.name in available_transforms() for step in pipeline.steps)
        )
        self.assertTrue(
            {
                "compression_blocks",
                "motion_smear",
                "repost_chain",
                "screen_capture",
                "shot_noise",
                "white_balance",
            }.issubset(step.name for step in pipeline.steps)
        )


if __name__ == "__main__":
    unittest.main()
