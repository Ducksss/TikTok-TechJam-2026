"""Sample-keyed augmentation recipes with machine-readable traces."""

from __future__ import annotations

import hashlib
import json
import math
import random
from dataclasses import dataclass
from typing import TypeAlias

from PIL import Image

from .transforms import ParameterValue, apply_transform, available_transforms


StrengthRange: TypeAlias = float | tuple[float, float]


@dataclass(frozen=True)
class TransformSpec:
    """One probabilistic transform in an augmentation recipe.

    Strength values are normalized to ``[0, 1]``. A two-item tuple samples a
    strength uniformly from the inclusive range for each sample key.
    """

    name: str
    strength: StrengthRange = 0.5
    probability: float = 1.0


@dataclass(frozen=True)
class TraceEntry:
    """The resolved decision and parameters for one recipe step."""

    name: str
    applied: bool
    probability: float
    strength: float | None
    parameters: dict[str, ParameterValue]

    def to_dict(self) -> dict[str, object]:
        return {
            "name": self.name,
            "applied": self.applied,
            "probability": self.probability,
            "strength": self.strength,
            "parameters": dict(self.parameters),
        }


@dataclass(frozen=True)
class AugmentationResult:
    """An augmented RGB image and the decisions that produced it."""

    image: Image.Image
    sample_key: str
    pipeline_id: str
    trace: tuple[TraceEntry, ...]

    @property
    def manifest(self) -> dict[str, object]:
        """Return a JSON-serializable record for experiment manifests."""

        return {
            "schema_version": 1,
            "sample_key": self.sample_key,
            "pipeline_id": self.pipeline_id,
            "transforms": [entry.to_dict() for entry in self.trace],
        }


class AugmentationPipeline:
    """Apply an immutable recipe without using process-global randomness."""

    def __init__(
        self,
        steps: list[TransformSpec] | tuple[TransformSpec, ...],
        *,
        seed: str | int = 0,
    ) -> None:
        self.steps = tuple(steps)
        self.seed = seed
        self._strength_ranges = tuple(
            _validate_spec(step) for step in self.steps
        )
        self.pipeline_id = _pipeline_id(self.steps, seed)

    def apply(self, image: Image.Image, *, sample_key: str) -> AugmentationResult:
        """Return a deterministic augmentation for ``sample_key``.

        The input image is never mutated. Every step derives a separate random
        stream from the pipeline seed, sample key, step position, and transform
        name, so the result is independent of Python's global random state.
        """

        if not isinstance(image, Image.Image):
            raise TypeError("image must be a PIL.Image.Image")
        if not isinstance(sample_key, str) or not sample_key:
            raise ValueError("sample_key must be a non-empty string")

        current = image.convert("RGB").copy()
        trace: list[TraceEntry] = []

        for index, (step, strength_range) in enumerate(
            zip(self.steps, self._strength_ranges, strict=True)
        ):
            step_random = random.Random(
                _step_seed(self.seed, sample_key, index, step.name)
            )
            if step_random.random() >= step.probability:
                trace.append(
                    TraceEntry(
                        name=step.name,
                        applied=False,
                        probability=step.probability,
                        strength=None,
                        parameters={},
                    )
                )
                continue

            lower, upper = strength_range
            strength = lower + (upper - lower) * step_random.random()
            current, parameters = apply_transform(
                current,
                name=step.name,
                strength=strength,
                random_source=step_random,
            )
            trace.append(
                TraceEntry(
                    name=step.name,
                    applied=True,
                    probability=step.probability,
                    strength=strength,
                    parameters=parameters,
                )
            )

        return AugmentationResult(
            image=current,
            sample_key=sample_key,
            pipeline_id=self.pipeline_id,
            trace=tuple(trace),
        )


def robustness_recipe(*, seed: str | int = 0) -> AugmentationPipeline:
    """Build a moderate, reproducible corruption recipe for development data.

    The preset is an experiment utility, not a reconstruction of FeatDistill's
    paper-described training policy. Protected final-evaluation rows must not be
    used to tune this recipe or any model trained with it.
    """

    return AugmentationPipeline(
        (
            TransformSpec("repost_chain", (0.10, 0.55), 0.45),
            TransformSpec("compression_blocks", (0.10, 0.50), 0.25),
            TransformSpec("motion_smear", (0.08, 0.35), 0.18),
            TransformSpec("soften", (0.08, 0.40), 0.22),
            TransformSpec("screen_capture", (0.08, 0.35), 0.12),
            TransformSpec("tone_curve", (0.08, 0.40), 0.30),
            TransformSpec("white_balance", (0.08, 0.35), 0.20),
            TransformSpec("exposure_shift", (0.06, 0.30), 0.15),
            TransformSpec("sensor_noise", (0.05, 0.30), 0.16),
            TransformSpec("shot_noise", (0.05, 0.28), 0.10),
            TransformSpec("speckle_noise", (0.05, 0.28), 0.10),
            TransformSpec("impulse_noise", (0.03, 0.18), 0.05),
            TransformSpec("gamma_curve", (0.08, 0.30), 0.18),
            TransformSpec("posterize", (0.05, 0.25), 0.08),
            TransformSpec("patch_dropout", (0.03, 0.12), 0.05),
        ),
        seed=seed,
    )


def _validate_spec(step: TransformSpec) -> tuple[float, float]:
    if not isinstance(step, TransformSpec):
        raise TypeError("steps must contain TransformSpec values")
    if step.name not in available_transforms():
        raise ValueError(f"unknown transform: {step.name!r}")

    probability = _finite_number(step.probability, "probability")
    if not 0.0 <= probability <= 1.0:
        raise ValueError("probability must be within [0, 1]")

    if isinstance(step.strength, tuple):
        if len(step.strength) != 2:
            raise ValueError("strength ranges must contain exactly two values")
        lower = _finite_number(step.strength[0], "strength lower bound")
        upper = _finite_number(step.strength[1], "strength upper bound")
    else:
        lower = upper = _finite_number(step.strength, "strength")

    if not 0.0 <= lower <= upper <= 1.0:
        raise ValueError("strength must satisfy 0 <= lower <= upper <= 1")
    return lower, upper


def _finite_number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be a finite number")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"{label} must be a finite number")
    return result


def _step_seed(
    seed: str | int,
    sample_key: str,
    index: int,
    name: str,
) -> int:
    payload = json.dumps(
        [str(seed), sample_key, index, name],
        ensure_ascii=True,
        separators=(",", ":"),
    ).encode("utf-8")
    digest = hashlib.blake2b(
        payload,
        digest_size=16,
        person=b"SynthFlagAugV1",
    ).digest()
    return int.from_bytes(digest, "big")


def _pipeline_id(
    steps: tuple[TransformSpec, ...],
    seed: str | int,
) -> str:
    payload = {
        "schema_version": 1,
        "seed": str(seed),
        "steps": [
            {
                "name": step.name,
                "strength": step.strength,
                "probability": step.probability,
            }
            for step in steps
        ],
    }
    serialized = json.dumps(
        payload,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()
