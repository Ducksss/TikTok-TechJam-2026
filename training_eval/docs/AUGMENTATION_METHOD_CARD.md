# SynthFlag augmentation and robustness method card

Status date: 1 September 2026
Scope: TikTok TechJam 2026 Track 5 research prototype
Claim labels used below: **IMPLEMENTED**, **MEASURED**, **REJECTED**, **SELECTED**, and **PROPOSED**.

## Executive summary

SynthFlag used augmentation in two deliberately separate roles:

1. **IMPLEMENTED / REJECTED LEARNING EXPERIMENT:** a five-view, class-symmetric adaptation pipeline for a lightweight residual head over frozen Expert 4 features; and
2. **IMPLEMENTED / VERIFIED TEST1 EVALUATION:** a frozen, deterministic, source-paired clean-versus-composite robustness harness for the selected corrected-v2 detector.

The stronger augmentation-trained v3 head did not ship. It improved held-out worst-view ROC-AUC from `0.658889` to `0.671894`, but violated transfer gates on CIFAKE and SID. TEST1 therefore measures the selected corrected-v2 stack, not the rejected v3 head.

This distinction prevents a false claim that the six TEST1 transformations trained the selected detector.

## 1. Threat model

Track 5 concerns forensic cues that may be weakened by ordinary platform operations. The implemented TEST1 protocol covered:

| Family | Settings |
|---|---|
| JPEG compression | quality 90, 70, 50, or 30 |
| Gaussian blur | sigma 0.5, 1.0, or 2.0 |
| resize round trip | scale 0.5 or 0.25, then bicubic restore |
| Gaussian noise | sigma 0.02, 0.05, or 0.10 |
| colour jitter | brightness, contrast, or saturation multiplied by 0.8 or 1.2 |
| centre-crop round trip | retain central 80%, then bicubic restore |

These transformations represent recompression, soft focus, thumbnail/screenshot cycles, sensor or editing noise, colour edits, and reframing. They are a bounded proxy for in-platform damage, not a complete model of every upload pipeline.

TEST1 did **not** cover neural compression, invisible watermark insertion/removal, watermark-erasing attacks, adversarial post-processing, or a full 36-transform NTIRE corruption suite.

## 2. Five-view adaptation pipeline

### Data topology

**IMPLEMENTED.** The v3 adaptation pool contained 8,000 source identities, balanced 4,000 real and 4,000 generated. Its train/dev split was 6,400/1,600 sources. Each source produced five deterministic, class-symmetric views, yielding 40,000 feature rows:

| View | Role | BCE weight |
|---|---|---:|
| `clean_png` | clean anchor | 0 |
| `jpeg_q90` | matched-codec supervised view | positive |
| `hard_jpeg_q80` | multi-operation supervised view | positive |
| `lowres64_jpeg_q80` | low-resolution consistency anchor | 0 |
| `lowres32_jpeg_q80` | low-resolution consistency anchor | 0 |

The hard view sampled three to five operations from blur, resize, noise, colour, crop, and overlay/watermark families, then always terminal-encoded the result at JPEG quality 80. Counting that final JPEG, a hard view contained four to six operations.

### Class symmetry audit

**MEASURED.** Hard-view operation depth in the 6,400-source training split was nearly identical across labels:

| Total operations | Real | AI-generated |
|---:|---:|---:|
| 4 | 1,067 | 1,054 |
| 5 | 1,078 | 1,102 |
| 6 | 1,055 | 1,044 |

Blur, crop, colour, noise, and overlay occurred about 4,200 times each; resize occurred about 4,300 times; terminal JPEG Q80 occurred for every hard view.

### Why supervised loss was restricted

Original real sources were often JPEG while generated sources were often PNG. Re-encoding both to PNG does not erase every prior codec artifact. A naïve classifier could therefore learn `source codec = class`.

**IMPLEMENTED.** BCE was allowed only on terminal-JPEG `jpeg_q90` and `hard_jpeg_q80` views. `clean_png`, `lowres64_jpeg_q80`, and `lowres32_jpeg_q80` were anchors for consistency and teacher preservation, with zero classification weight.

This loss routing was designed to reduce the incentive for native resolution to become a direct label proxy.

## 3. Constrained residual learning

The trainable head was `LayerNorm(1152) -> Linear(1152, 256) -> GELU -> Dropout(0.2) -> Linear(256, 1)`, with 297,729 parameters and residual scale 0.075. The Expert 4 encoder remained frozen.

### Supervised terminal-JPEG stream

**IMPLEMENTED.** Relative loss weights:

```text
0.25 * classification BCE
+ 0.10 * clean-target consistency
+ 2.00 * teacher-logit preservation
+ 0.50 * pairwise-rank preservation
+ 0.25 * residual-magnitude control
```

### Low-resolution stream

**IMPLEMENTED.** Relative loss weights:

```text
0.00 * classification BCE
+ 0.25 * clean-target consistency
+ 2.00 * teacher-logit preservation
+ 0.50 * pairwise-rank preservation
+ 0.25 * residual-magnitude control
```

### Preservation replay

**IMPLEMENTED.** A separate 10,936-source balanced replay pool contributed clean and hard views. Classification labels were forbidden. Relative weights were:

```text
0.00 * classification BCE
+ 4.00 * teacher-logit preservation
+ 2.00 * pairwise-rank preservation
+ 0.50 * residual-magnitude control
```

This design treated augmentation as constrained counterfactual adaptation: learn a small correction while making calibration drift, rank destruction, and catastrophic forgetting expensive.

## 4. Candidate selection and rejection

**IMPLEMENTED.** Candidate selection used the minimum development ROC-AUC across `clean_png`, `jpeg_q90`, `hard_jpeg_q80`, `lowres64_jpeg_q80`, and `lowres32_jpeg_q80`. Average performance could not hide one weak view.

**MEASURED.** Ninety-seven candidates were audited. The strongest v3 candidate improved worst-view development ROC-AUC:

```text
0.658889 -> 0.671894
```

**REJECTED.** That candidate reduced CIFAKE ROC-AUC by approximately `0.001973` clean and `0.002207` augmented, and SID clean also declined. The only candidate that passed every transfer gate was practically identity. The stronger head was not promoted.

An earlier unconstrained head had lifted WildFake augmented ROC-AUC into the `0.8481–0.8740` range while collapsing CIFAKE augmented ROC-AUC to `0.5066–0.5621`. This was treated as shortcut evidence, not a successful result.

## 5. Shortcut firewall

| Shortcut risk | Implemented control |
|---|---|
| source codec predicts class | supervise only terminal-codec-matched views |
| low resolution predicts class | zero BCE on 32px and 64px views |
| watermark/overlay predicts fake | sample overlay/watermark operations symmetrically across labels |
| one easy view hides failure | select by worst-view AUC |
| adaptation rewrites detector | teacher-logit, rank, and residual preservation |
| benchmark labels leak into optimization | replay labels disabled; benchmark manifests excluded from classification streams |

## 6. TEST1 paired robustness protocol

**IMPLEMENTED / VERIFIED.** TEST1 contained 15,000 unique public source images: 5,000 each from CIFAKE, SID-Set, and WildFake. Each source produced exactly two aligned predictions:

- `clean`: source image; and
- `composite_standard`: one deterministic recipe using one to five distinct transformation families.

For every dataset, exactly 1,000 source images received each transform depth from one through five. Recipes were:

- deterministic;
- generated without model scores;
- generated without class labels;
- applied symmetrically to real and AI images; and
- executed in memory.

The scheduler contained 2,500 paired recipes and 1,652 unique ordered recipes. It selected different families without replacement; depth followed `pair_id % 5 + 1`, while a SHA-256-derived deterministic random stream chose endpoints. The same frozen recipe schedule was reused across CIFAKE, SID-Set, and WildFake. Across the 2,500 pair recipes, family inclusion counts were blur 1,228; crop 1,237; colour 1,251; JPEG 1,264; noise 1,271; and resize 1,249.

Real and AI members of a pair received the same ordered family endpoints. Noise samples remained deterministic through an image-identity-plus-endpoint seed. WildFake added a generator/depth anti-confounding constraint: within every generator or architecture stratum, allocation across depths differed by at most one sample, while every global depth contained exactly 500 real and 500 AI images.

Because each clean/augmented pair shares identity, label, and content, its score difference is a within-source robustness response rather than a comparison between independently sampled datasets.

## 7. Measured paired robustness

The AUC delta confidence intervals used 2,000 stratified source-level paired bootstrap resamples. Every resample preserved 2,500 real and 2,500 AI draws and retained clean/augmented source pairing.

| Dataset | Clean AUC | Augmented AUC | Paired delta, 95% CI | Chance-normalized retention | Decision flips | Score correlation |
|---|---:|---:|---:|---:|---:|---:|
| CIFAKE | 0.9816 | 0.9095 | -0.0721 [-0.0796, -0.0647] | 85.0% | 16.7% | 0.7761 |
| SID-Set | 0.8691 | 0.8439 | -0.0252 [-0.0297, -0.0207] | 93.2% | 2.5% | 0.9696 |
| WildFake | 0.9467 | 0.8785 | -0.0682 [-0.0765, -0.0607] | 84.7% | 18.2% | 0.7505 |

### Additional post-report corruption-depth slice

**MEASURED.** The following diagnostic was derived after the main report by joining immutable TEST1 predictions to the frozen dataset manifests. It is not a new model run.

| Composite depth | CIFAKE augmented AUC | Paired delta | SID augmented AUC | Paired delta | WildFake augmented AUC | Paired delta |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0.964632 | -0.017340 | 0.864256 | -0.015904 | 0.908040 | -0.039168 |
| 2 | 0.933852 | -0.047964 | 0.850256 | -0.018920 | 0.912980 | -0.043924 |
| 3 | 0.906268 | -0.077116 | 0.848472 | -0.025980 | 0.875604 | -0.071816 |
| 4 | 0.883936 | -0.096500 | 0.831276 | -0.035460 | 0.855616 | -0.091704 |
| 5 | 0.847172 | -0.133384 | 0.827872 | -0.027708 | 0.836460 | -0.099640 |

CIFAKE and WildFake show clear compounding damage. SID depth 5 is slightly less harmful than depth 4, so strict monotonic degradation is not claimed. Family slices overlap inside composite recipes; depth is descriptive rather than a causal estimate for any single family.

Interpretation:

- SID ranking was unusually stable under corruption, but fixed-threshold recall remained weak because many positives were locally tampered rather than globally synthetic.
- WildFake augmented AI recall remained 0.8972, but real specificity fell from 0.8736 to 0.6556, producing 861 false positives.
- CIFAKE's native 32×32 inputs make crop, blur, and resize operations unusually severe.

Robustness is therefore dataset- and operating-point-dependent. One pooled accuracy number does not describe the failure geometry.

## 8. Proposed next experiments — not measured

The following are **PROPOSED**, not completed results:

1. Build isolated, class-symmetric family views for JPEG Q35, blur sigma 1, resize 0.25, noise sigma 0.03, moderate colour jitter, and crop 80%, all with matched terminal JPEG.
2. Measure operation-order sensitivity by swapping compression before and after blur, resize, and noise.
3. Use a risk-weighted curriculum that promotes only the weakest family/severity into deeper composites while retaining worst-view selection and replay preservation.
4. Expand modern generator and real-domain breadth before adding more random mixed views.
5. Add neural compression, invisible watermark insertion/removal, watermark-erasing attacks, and adversarial post-processing to a locked external stress suite.

## 9. Claim boundary

TEST1 supports paired composite-robustness claims. It does not isolate the causal contribution of every transformation because each source receives one fixed composite recipe. It does not prove robustness to untested corruptions, use TikTok's hidden test, or establish that the public suites were pristine blind holdouts throughout development.

Primary public evidence files in this site:

- [`SOURCE_TEST1.md`](../benchmarks/test1/SOURCE_TEST1.md)
- [`TEST1_BENCHMARK_REPORT.md`](../benchmarks/test1/TEST1_BENCHMARK_REPORT.md)
- [`robustness_deltas.csv`](../benchmarks/test1/robustness_deltas.csv)
- [`integrity.json`](../benchmarks/test1/integrity.json)
