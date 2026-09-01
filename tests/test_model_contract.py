from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import torch

from infer.architecture import (
    FEATURE_WIDTH,
    HIDDEN_WIDTH,
    LARGE_IMAGE_MARGIN_BOUNDARY,
    LOW_RESOLUTION_ALPHA,
    ResidualHead,
    load_head_checkpoint,
    score_corrected_margins,
    siglip_vision_config,
)
from infer.model import _validate_score_batch, _validate_tensor_batch


class ModelContractTest(unittest.TestCase):
    def test_backbone_shape_matches_upstream_expert4_contract(self) -> None:
        siglip = siglip_vision_config()
        self.assertEqual(
            (siglip.image_size, siglip.patch_size, siglip.hidden_size),
            (384, 14, FEATURE_WIDTH),
        )
        self.assertEqual(siglip.num_hidden_layers, 27)

    def test_zero_residual_is_exact_teacher_identity(self) -> None:
        model = ResidualHead(zero_initialize_output=True)
        features = torch.randn(3, FEATURE_WIDTH)
        teacher_logits = torch.tensor([[1.0, 2.0], [2.0, -1.0], [0.5, 0.5]])
        expected = teacher_logits[:, 1] - teacher_logits[:, 0]
        torch.testing.assert_close(model(features, teacher_logits), expected)

    def test_selected_native_size_route_and_large_stack_formula(self) -> None:
        low = torch.tensor([0.0, 2.0, -2.0])
        epoch05 = torch.tensor([10.0, 1.0, -1.0])
        epoch08 = torch.tensor([10.0, 3.0, 1.0])
        native_sides = torch.tensor([64, 65, 1024])

        scores = score_corrected_margins(low, epoch05, epoch08, native_sides)

        expected = torch.tensor(
            [
                torch.sigmoid(torch.tensor(0.0)),
                torch.sigmoid(
                    torch.tensor(0.65 * 1.0 + 0.35 * 3.0 - LARGE_IMAGE_MARGIN_BOUNDARY)
                ),
                torch.sigmoid(
                    torch.tensor(0.65 * -1.0 + 0.35 * 1.0 - LARGE_IMAGE_MARGIN_BOUNDARY)
                ),
            ]
        )
        torch.testing.assert_close(scores, expected)

    def test_strictly_loads_selected_head_payload(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = ResidualHead(zero_initialize_output=True)
            checkpoint = Path(temporary_directory) / "head.pt"
            torch.save(
                {
                    "schema_version": 1,
                    "architecture": {
                        "input_width": FEATURE_WIDTH,
                        "hidden_width": HIDDEN_WIDTH,
                        "training_dropout": 0.1,
                    },
                    "state_dict": source.state_dict(),
                    "selected_alpha": LOW_RESOLUTION_ALPHA,
                },
                checkpoint,
            )
            loaded = load_head_checkpoint(checkpoint)
            self.assertEqual(loaded.selected_alpha, LOW_RESOLUTION_ALPHA)
            self.assertEqual(loaded.model.parameter_count, 297_729)
            self.assertFalse(loaded.model.training)

    def test_tensor_input_contract(self) -> None:
        _validate_tensor_batch(torch.zeros(2, 3, 10, 12, dtype=torch.uint8))
        _validate_tensor_batch(torch.ones(2, 3, 10, 12, dtype=torch.float32))
        with self.assertRaisesRegex(ValueError, "shape"):
            _validate_tensor_batch(torch.zeros(3, 10, 12))
        with self.assertRaisesRegex(ValueError, "\\[0,1\\]"):
            _validate_tensor_batch(torch.full((1, 3, 2, 2), 1.1))
        with self.assertRaisesRegex(ValueError, "uint8"):
            _validate_tensor_batch(torch.ones(1, 3, 2, 2, dtype=torch.int16))

    def test_score_output_contract(self) -> None:
        _validate_score_batch(torch.tensor([0.0, 0.5, 1.0]), 3)
        with self.assertRaisesRegex(RuntimeError, "shape"):
            _validate_score_batch(torch.zeros(2, 1), 2)
        with self.assertRaisesRegex(RuntimeError, "non-finite"):
            _validate_score_batch(torch.tensor([float("nan")]), 1)
        with self.assertRaisesRegex(RuntimeError, "outside"):
            _validate_score_batch(torch.tensor([1.001]), 1)


if __name__ == "__main__":
    unittest.main()
