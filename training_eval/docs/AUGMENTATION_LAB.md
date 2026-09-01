# Augmentation and robustness laboratory

**Purpose:** make forensic performance survive ordinary platform damage without teaching `codec`, `resolution`, or `watermark` as class labels.
**Evidence vocabulary:** **IMPLEMENTED**, **MEASURED**, **REJECTED**, **SELECTED**, and **PROPOSED**.

## 1. Two different uses of augmentation

SynthFlag used augmentation in two separate experiments:

1. **IMPLEMENTED / REJECTED TRAINING EXPERIMENT:** deterministic, class-symmetric views trained a constrained residual head over frozen Expert 4 features; and
2. **IMPLEMENTED / VERIFIED TEST1 EVALUATION:** a frozen, source-paired corruption schedule measured the selected corrected-v2 detector.

The stronger augmentation-trained v3 head was rejected. TEST1 therefore evaluates corrected-v2; it does not justify the claim that corrected-v2 was trained on the six TEST1 transform families.

## 2. Threat model

| Family | TEST1 endpoints | Platform analogue |
|---|---|---|
| JPEG | quality 90, 70, 50, 30 | upload/repost compression |
| Gaussian blur | sigma 0.5, 1.0, 2.0 | soft focus, filtering, resampling |
| Resize round trip | scale 0.5 or 0.25, bicubic restore | thumbnails, screenshots, transcodes |
| Gaussian noise | sigma 0.02, 0.05, 0.10 | sensor/editing noise |
| Colour jitter | brightness, contrast or saturation ×0.8/×1.2 | filters and display capture |
| Centre-crop round trip | retain central 80%, bicubic restore | reframing and aspect-ratio edits |

This is a bounded proxy. Neural compression, invisible-watermark insertion/removal, adversarial attacks and the complete NTIRE-style 36-transform space were not evaluated.

## 3. Research idea: corruption as a counterfactual, not a label

If the transform scheduler depends on class, the model can learn the scheduler instead of image provenance. SynthFlag's core invariant was:

```text
P(transform recipe | real) = P(transform recipe | AI)
```

Operationally, the recipe generator was label-blind, deterministic and applied the same family/severity logic to both classes. Overlay and watermark operations in the training experiment were deliberately symmetric. A watermark was never permitted to mean “AI”.

This also changes how a pair is interpreted. Clean image `x` and damaged image `T(x)` share identity and label; their score difference is a within-source robustness response, not a comparison of two independently sampled datasets.

## 4. Five-view head-adaptation experiment

**IMPLEMENTED.** The v3 experiment used 8,000 balanced source identities (4,000 real, 4,000 generated), split into 6,400 train and 1,600 development sources. Each source produced five deterministic views:

| View | Function | Classification loss |
|---|---|---:|
| `clean_png` | clean anchor | 0 |
| `jpeg_q90` | codec-matched supervised view | on |
| `hard_jpeg_q80` | 3–5 sampled operations plus terminal JPEG Q80 | on |
| `lowres64_jpeg_q80` | low-resolution consistency anchor | 0 |
| `lowres32_jpeg_q80` | extreme low-resolution consistency anchor | 0 |

The two low-resolution views had zero BCE by design. Their job was to constrain score drift, not reward the model for learning that “small means fake”.

### Terminal-codec matching

Original real images were frequently JPEG while generated images were frequently PNG. Saving both as PNG does not erase prior compression traces. To suppress the shortcut `native codec → class`, supervised BCE was allowed only after both classes were passed through the same terminal JPEG codec.

The hard view sampled blur, resize, noise, colour, crop and overlay/watermark operations, then always ended at JPEG Q80. Including that terminal encoding, hard examples contained four to six operations. In the 6,400-source train split, operation-depth counts were nearly class-symmetric:

| Total operations | Real | AI |
|---:|---:|---:|
| 4 | 1,067 | 1,054 |
| 5 | 1,078 | 1,102 |
| 6 | 1,055 | 1,044 |

### Constrained residual objective

The trainable head was:

```text
LayerNorm(1152) → Linear(256) → GELU → Dropout(0.2) → Linear(1)
```

The scalar output corrects the upstream two-class margin. The head has 297,729 parameters and residual scale `0.075`. Expert 4 remained frozen. The supervised stream used:

```text
0.25 × classification BCE
+ 0.10 × clean-target consistency
+ 2.00 × teacher-logit preservation
+ 0.50 × pairwise-rank preservation
+ 0.25 × residual-magnitude control
```

The low-resolution stream set classification to zero and raised consistency. A separate balanced 10,936-source preservation replay stream disabled labels entirely and strengthened teacher/rank preservation.

The experiment therefore asked the head to learn a small corruption correction while making catastrophic re-ranking expensive.

### Worst-view selection

Candidates were ranked by the minimum development ROC-AUC across all five views. Mean AUC could not hide one broken condition:

```text
selection score = min(AUC_clean, AUC_jpeg, AUC_hard, AUC_64px, AUC_32px)
```

**MEASURED / REJECTED.** Among 97 audited candidates, the strongest v3 head increased held-out worst-view AUC from `0.658889` to `0.671894`, but CIFAKE AUC fell by approximately `0.001973` clean and `0.002207` augmented; SID clean also declined. It was not promoted.

An earlier unconstrained head raised WildFake augmented AUC into `0.8481–0.8740` while collapsing CIFAKE augmented AUC to `0.5066–0.5621`. This was recorded as shortcut learning, not success.

## 5. TEST1 paired composite protocol

**IMPLEMENTED / VERIFIED.** Each of the 15,000 TEST1 source images produced exactly two predictions: clean and one deterministic composite containing 1–5 distinct families.

For each dataset, exactly 1,000 images received every depth from one through five. The scheduler contained 2,500 paired recipes and 1,652 unique ordered recipes. Depth followed `pair_id % 5 + 1`; a SHA-256-derived stream chose family order and endpoints. Noise used an identity-plus-endpoint seed, so replay was exact.

Across the 2,500 pair recipes, family inclusion counts were deliberately close:

| Blur | Crop | Colour | JPEG | Noise | Resize |
|---:|---:|---:|---:|---:|---:|
| 1,228 | 1,237 | 1,251 | 1,264 | 1,271 | 1,249 |

WildFake added a generator/depth anti-confounding constraint: allocation across depths differed by at most one sample inside each generator/architecture stratum, while every global depth contained 500 real and 500 AI images.

## 6. Paired robustness result

The AUC-delta intervals used 2,000 stratified source-level paired bootstrap resamples.

| Dataset | Clean AUC | Augmented AUC | Paired delta, 95% CI | Chance-normalized retention | Decision flips |
|---|---:|---:|---:|---:|---:|
| CIFAKE | 0.9816 | 0.9095 | -0.0721 [-0.0796, -0.0647] | 85.0% | 16.7% |
| SID-Set | 0.8691 | 0.8439 | -0.0252 [-0.0297, -0.0207] | 93.2% | 2.5% |
| WildFake | 0.9467 | 0.8785 | -0.0682 [-0.0765, -0.0607] | 84.7% | 18.2% |

Depth analysis showed compounding damage on CIFAKE and WildFake. SID ranking was more stable, but its fixed-threshold recall remained weak because many positives were locally tampered. WildFake retained 0.8972 AI recall after corruption while specificity fell to 0.6556, producing 861 false positives.

That last result matters for TikTok-like product policy: symmetric augmentation can preserve fake recall yet still push real creators across the action threshold. Robustness must be reported for both classes, not as one pooled accuracy number.

## 7. Shortcut firewall

| Risk | Implemented control |
|---|---|
| source codec predicts class | classification only on matched terminal-codec views |
| low resolution predicts class | zero BCE on 32px/64px anchors |
| watermark predicts fake | watermark/overlay sampled symmetrically across labels |
| one easy view hides collapse | worst-view candidate selection |
| adaptation overwrites teacher ranking | teacher-logit, rank and residual penalties |
| transform depth tracks generator | per-generator depth balancing on WildFake |
| randomness prevents replay | hash-derived schedule and deterministic noise seeds |
| benchmark labels leak into fitting | TEST1 reporting pass performed no training or threshold sweep |

## 8. Next augmentation experiments

The following are **PROPOSED, not measured**:

1. isolate each family at mild/medium/hard severity before composing it, so family effects become causal rather than overlapping slices;
2. swap operation order—especially compression before/after blur, resize and noise—to model upload pipelines;
3. promote only the weakest family/severity into deeper curriculum stages while retaining worst-view gates;
4. add matched watermark insertion and removal to both labels, never as class evidence;
5. add neural codecs and adversarial watermark-erasing attacks to a locked external suite; and
6. use a local patch branch for partial edits, with an untouched audit that vetoes any new real-image false positives.

Full public evidence: [`AUGMENTATION_METHOD_CARD.md`](AUGMENTATION_METHOD_CARD.md), [`robustness_deltas.csv`](../benchmarks/test1/robustness_deltas.csv), and [`integrity.json`](../benchmarks/test1/integrity.json).
