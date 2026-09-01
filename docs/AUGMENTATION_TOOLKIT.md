# SynthFlag augmentation toolkit

`synthflag_augment` is an optional, repository-authored Python package for
creating reproducible image variants during development and robustness studies.
It does not restore the historical upstream `distortion/` source, participate
in live inference, or reproduce the paper-described training policy.

## Design contract

- Every recipe uses a local random stream derived from its seed, sample key,
  step position, and transform name. It never reads or writes Python's global
  random state.
- A run returns a new RGB image with the original dimensions. The source image
  is not mutated.
- Strength is normalized to `[0, 1]`; zero strength is an exact pixel identity.
- Each result includes a JSON-serializable trace of applied and skipped steps,
  resolved strengths, operation parameters, and a stable pipeline identifier.
- The API transforms in-memory images only. Dataset discovery, storage,
  manifests, and split policy remain the caller's responsibility.

## Transform inventory

| Identifier | Effect | Recorded parameters |
|---|---|---|
| `compression_blocks` | JPEG loss plus block-preserving resampling | Quality, scale, blend, and intermediate size |
| `exposure_shift` | Sampled photographic exposure offset | Exposure value and gain |
| `gamma_curve` | Sampled luminance gamma curve | Exponent |
| `impulse_noise` | Seeded salt-and-pepper sensor faults | Rate and operation seed |
| `jpeg_cycle` | Deterministic JPEG encode/decode cycle | Quality and chroma subsampling |
| `motion_smear` | Directional replicated-edge motion blur | Direction, radius, and sample count |
| `patch_dropout` | Mean-color rectangular occlusion | Position, dimensions, and fill |
| `posterize` | Reduced channel bit depth | Bits per channel |
| `repost_chain` | Shifted crop, rescale, and repeated JPEG cycles | Crop, resampler, and cycle qualities |
| `resize_echo` | Downscale and restore to the original size | Scale, intermediate size, and resampler |
| `screen_capture` | Scanlines, moire, and bounded channel displacement | Periods, angle, and channel shift |
| `sensor_noise` | Seeded additive Gaussian sensor noise | Sigma and operation seed |
| `shot_noise` | Seeded signal-dependent photon noise | Peak photon count and operation seed |
| `soften` | Gaussian softening | Radius |
| `speckle_noise` | Seeded multiplicative sensor noise | Sigma and operation seed |
| `tone_curve` | Sampled brightness, contrast, and saturation | Three enhancement factors |
| `white_balance` | Sampled temperature and tint cast | Per-channel gains |

All transforms use Pillow and PyTorch dependencies already required by the
SynthFlag source distribution. The toolkit adds no external service, model,
checkpoint, or dataset dependency.

## Custom recipe

```python
from PIL import Image

from synthflag_augment import AugmentationPipeline, TransformSpec

pipeline = AugmentationPipeline(
    (
        TransformSpec("jpeg_cycle", strength=(0.2, 0.8), probability=0.7),
        TransformSpec("sensor_noise", strength=(0.1, 0.4), probability=0.4),
        TransformSpec("tone_curve", strength=0.3, probability=0.5),
    ),
    seed="experiment-2026-09",
)

result = pipeline.apply(
    Image.open("example.png"),
    sample_key="dataset/example.png",
)
result.image.save("example-variant.png")
print(result.manifest)
```

`sample_key` should be a stable dataset-relative identifier rather than a local
absolute path. Under the repository's pinned dependency versions, reusing the
same seed, recipe, and key reproduces the same variant. Changing a key produces
an independent deterministic random stream.

`robustness_recipe(seed=...)` provides a moderate preset spanning repost,
compression, blur, screen-capture, tone, exposure, sensor-noise, quantization,
and occlusion families. Independent per-step probabilities keep it from
applying every effect to every sample. It is a starting configuration, not a
validated training policy or a performance claim.

## Evidence and provenance boundary

Use this toolkit only on development data whose rights and split role permit
augmentation. Never tune a recipe, model, checkpoint, calibration, or threshold
using protected final-evaluation rows. An augmentation trace proves which local
operations were requested; it does not prove dataset provenance, model
robustness, or performance.

The package has a new namespace, public API, implementation structure, and
reproducibility model. Attribution to Tu et al. remains required for
the detector architecture and external checkpoints, but these augmentation
utilities are not presented as upstream source or as a reconstruction of the
paper-described training library. The repository source-hygiene check covers
this package alongside the rest of the release tree.
