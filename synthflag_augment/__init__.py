"""Deterministic, auditable image augmentation utilities for SynthFlag."""

from .pipeline import (
    AugmentationPipeline,
    AugmentationResult,
    TraceEntry,
    TransformSpec,
    robustness_recipe,
)
from .transforms import available_transforms

__all__ = [
    "AugmentationPipeline",
    "AugmentationResult",
    "TraceEntry",
    "TransformSpec",
    "available_transforms",
    "robustness_recipe",
]
