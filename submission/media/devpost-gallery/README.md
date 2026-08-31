# SynthFlag Devpost gallery

This directory keeps the judge-facing gallery media versioned beside the
evidence package. Files `01` through `05` are captured product surfaces. Files
`06` through `09` are deterministic architecture graphics generated from
[`scripts/build_devpost_architecture_assets.py`](../../../scripts/build_devpost_architecture_assets.py).
The SVG files are editable masters; every PNG export is exactly 1536 by 1024
pixels (3:2) and remains below Devpost's 5 MB limit.

## Architecture asset set

| Family | Dark Devpost export | Light companion | Editable sources |
|---|---|---|---|
| Overall system architecture | `06-system-architecture-dark.png` | `06-system-architecture-light.png` | `06-system-architecture-dark.svg`, `06-system-architecture-light.svg` |
| Four-expert ensemble anatomy | `07-ensemble-anatomy-dark.png` | `07-ensemble-anatomy-light.png` | `07-ensemble-anatomy-dark.svg`, `07-ensemble-anatomy-light.svg` |
| Model decision register | `08-decision-register-dark.png` | `08-decision-register-light.png` | `08-decision-register-dark.svg`, `08-decision-register-light.svg` |
| Threshold tradeoff | `09-threshold-tradeoff-dark.png` | `09-threshold-tradeoff-light.png` | `09-threshold-tradeoff-dark.svg`, `09-threshold-tradeoff-light.svg` |

The dark variants are the Devpost defaults. The light variants are available
for README pages, reports, and presentations. The earlier
`05-architecture.jpg` screenshot is retained as a captured product surface and
is not an evidence-source diagram; it is not part of the final Devpost gallery.

## Devpost captions

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
   accuracy and fake recall while lowering precision; ROC-AUC stays 0.8505.”

## Evidence boundaries

- The architecture labels and exact addition order come from
  `infer/architecture.py`; checkpoint identity, preprocessing, and artifact
  behavior come from their executed modules under `infer/`.
- Threshold metrics are protected-final V1 evidence rounded to four decimals.
  The threshold was selected on calibration data, then frozen.
- Learned disagreement fusion is retrospective V2 development evidence. It
  failed all three leave-one-dataset-out guardrails and did not ship.
- V3 remains blocked because the exact organizer-provided 8,843-image DALL-E
  Advanced source is absent. No V3 performance metric appears in these assets.

SynthFlag is the product and repository-authored inference implementation.
FeatDistill remains the credited detector architecture and checkpoint lineage.
