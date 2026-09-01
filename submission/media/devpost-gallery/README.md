# SynthFlag Devpost gallery

This directory keeps the judge-facing gallery media versioned beside the
evidence package. Files `01` through `05` are captured product surfaces. Files
`06` through `13` are deterministic technical graphics generated from
[`scripts/build_devpost_architecture_assets.py`](../../../scripts/build_devpost_architecture_assets.py).
The SVG files are editable masters; every PNG export is exactly 1536 by 1024
pixels (3:2) and remains below Devpost's 5 MB limit.

> **Historical media notice:** files `01` through `09` were captured or
> generated for the retired four-expert release and must not be presented as
> the selected TEST1 runtime. The current authoritative graph is
> [`submission/ARCHITECTURE.svg`](../../ARCHITECTURE.svg): one frozen Expert 4
> SigLIP teacher, three residual heads, and native-size routing. Files `10`
> through `13` remain valid only for the model-independent concepts stated
> below.

## Historical architecture asset set

| Family | Dark Devpost export | Light companion | Editable sources |
|---|---|---|---|
| Overall system architecture | `06-system-architecture-dark.png` | `06-system-architecture-light.png` | `06-system-architecture-dark.svg`, `06-system-architecture-light.svg` |
| Four-expert ensemble anatomy | `07-ensemble-anatomy-dark.png` | `07-ensemble-anatomy-light.png` | `07-ensemble-anatomy-dark.svg`, `07-ensemble-anatomy-light.svg` |
| Model decision register | `08-decision-register-dark.png` | `08-decision-register-light.png` | `08-decision-register-dark.svg`, `08-decision-register-light.svg` |
| Threshold tradeoff | `09-threshold-tradeoff-dark.png` | `09-threshold-tradeoff-light.png` | `09-threshold-tradeoff-dark.svg`, `09-threshold-tradeoff-light.svg` |

## Backup asset set

These files are intentionally not part of the staged nine-image Devpost
gallery. They provide evidence-safe alternatives if a judge-facing page,
report, or presentation needs a different emphasis.

| Family | Dark backup export | Light companion | Editable sources |
|---|---|---|---|
| Evidence boundary map | `10-evidence-boundary-map-dark.png` | `10-evidence-boundary-map-light.png` | `10-evidence-boundary-map-dark.svg`, `10-evidence-boundary-map-light.svg` |
| Reproducible output contract | `11-output-contract-dark.png` | `11-output-contract-light.png` | `11-output-contract-dark.svg`, `11-output-contract-light.svg` |
| Responsible-use flow | `12-responsible-use-flow-dark.png` | `12-responsible-use-flow-light.png` | `12-responsible-use-flow-dark.svg`, `12-responsible-use-flow-light.svg` |
| Short-video pipeline | `13-video-pipeline-dark.png` | `13-video-pipeline-light.png` | `13-video-pipeline-dark.svg`, `13-video-pipeline-light.svg` |

The dark variants are the Devpost defaults. The light variants are available
for README pages, reports, and presentations. The earlier
`05-architecture.jpg` screenshot is retained as a captured product surface and
is not an evidence-source diagram; it is not part of the final Devpost gallery.

## Historical captions (do not use for TEST1)

1. **Overall system architecture:** “From one RGB image to four expert
   probabilities: deterministic CLIP/SigLIP paths, exact mean fusion, and
   provenance-bound outputs.”
2. **Four-expert ensemble anatomy:** “Two CLIP experts at 224 px and two SigLIP
   experts at 384 px produce four AI-class probabilities, then SynthFlag
   averages them equally.”
3. **Model decision register:** “We kept the equal mean, separated score from
   threshold, rejected fusion that failed domain transfer, and left blocked
   evidence unavailable.”
4. **Threshold tradeoff:** “The 0.28747 operating point improves balanced
   accuracy and fake recall while lowering precision; ROC-AUC stays 0.8505.
   This is historical V1 evidence, not a low-FPR moderation recommendation.”

## Backup captions

1. **Evidence boundary map:** “SynthFlag keeps paper facts, executed behavior,
   protected results, retrospective studies, and blocked evidence visibly
   separate.”
2. **Reproducible output contract:** “One score becomes reproducible CSV,
   evaluator JSON, and metadata—bound to checkpoint identity and resumable-run
   safeguards.”
3. **Responsible-use flow:** “SynthFlag is a review signal, not proof: choose
   policy deliberately, inspect context, and retain human judgment for
   consequential use.”
4. **Short-video pipeline:** “For short videos, eight midpoint crops are made in
   the browser, scored in two-frame batches, and returned as a timeline plus
   summary.”

## Evidence boundaries

- The architecture labels and exact addition order come from
  `infer/architecture.py`; checkpoint identity, preprocessing, and artifact
  behavior come from their executed modules under `infer/`.
- Threshold metrics are protected-final V1 evidence rounded to four decimals.
  The threshold was selected on calibration data, then frozen.
- TEST1 is newer public-development evidence: 15,000 unique public images and
  30,000 clean/augmented predictions from the selected Expert 4 plus three-head
  topology. It is not encoded into these historical V1/V2 gallery graphics;
  those graphics must not be presented as the current runtime.
- For TikTok-like creator operations, constrain false-positive rate first and
  reduce false negatives within that cap. The fixed `0.5` service/TEST1 point is
  not a universal consequential-action threshold.
- Learned disagreement fusion is retrospective V2 development evidence. It
  failed all three leave-one-dataset-out guardrails and did not ship.
- V3 remains blocked because the exact organizer-provided 8,843-image DALL-E
  Advanced source is absent. No V3 performance metric appears in these assets.
- The video diagram describes the current source contract: eight 384-pixel
  midpoint crops are created in the browser and scored in two-frame
  microbatches. Its aggregate is descriptive, not a calibrated video-level
  probability.

SynthFlag is the product and repository-authored inference implementation.
The detector architecture and checkpoint lineage remain credited in the
[third-party notice](../../THIRD_PARTY_NOTICES.md).
