from __future__ import annotations

import unittest

import torch
from torch import nn

from infer.architecture import (
    SynthFlagEnsemble,
    clip_vision_config,
    siglip_vision_config,
)
from infer.model import _validate_score_batch, _validate_tensor_batch


class _FixedLogits(nn.Module):
    def __init__(self, real: float, fake: float) -> None:
        super().__init__()
        self.register_buffer("logits", torch.tensor([real, fake], dtype=torch.float32))

    def forward(self, pixels: torch.Tensor) -> torch.Tensor:
        return self.logits.expand(pixels.shape[0], -1)


class ModelContractTest(unittest.TestCase):
    def test_backbone_shapes_match_external_checkpoint_contract(self) -> None:
        clip = clip_vision_config()
        siglip = siglip_vision_config()
        self.assertEqual(
            (clip.image_size, clip.patch_size, clip.projection_dim),
            (224, 14, 768),
        )
        self.assertEqual((clip.hidden_size, clip.num_hidden_layers), (1024, 24))
        self.assertEqual(
            (siglip.image_size, siglip.patch_size, siglip.hidden_size),
            (384, 14, 1152),
        )
        self.assertEqual(siglip.num_hidden_layers, 27)

    def test_ensemble_uses_class_one_and_exact_four_probability_mean(self) -> None:
        ensemble = SynthFlagEnsemble.__new__(SynthFlagEnsemble)
        nn.Module.__init__(ensemble)
        ensemble.expert1_clip = _FixedLogits(0.0, 1.0)
        ensemble.expert2_clip = _FixedLogits(2.0, -1.0)
        ensemble.expert3_siglip = _FixedLogits(-2.0, 2.0)
        ensemble.expert4_siglip = _FixedLogits(0.5, 0.25)

        scores = ensemble(torch.empty(3, 3, 384, 384), torch.empty(3, 3, 224, 224))
        logits = [
            torch.tensor([[0.0, 1.0]]),
            torch.tensor([[2.0, -1.0]]),
            torch.tensor([[-2.0, 2.0]]),
            torch.tensor([[0.5, 0.25]]),
        ]
        expected = sum(torch.softmax(value, dim=1)[:, 1] for value in logits) / 4
        torch.testing.assert_close(scores, expected.expand(3))

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
