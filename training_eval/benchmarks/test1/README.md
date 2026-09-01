# TEST1 — Frozen detector benchmark

**Date:** 1 September 2026 (Singapore)
**Status:** COMPLETE
**Scope:** 15,000 unique labeled sources, 30,000 clean/augmented evaluations
**Decision rule:** fixed AI probability threshold `0.5`; no threshold tuning on these benchmarks

## Executive result

The frozen corrected-v2 detector is strongest on CIFAKE and WildFake clean imagery. It remains useful under the
composite stress pipeline, but robustness is dataset-dependent. The main weaknesses are SID AI-image recall at the
fixed threshold and WildFake real-image specificity after augmentation. ROC-AUC remains substantially above chance in
all six cells.

- Descriptive macro clean ROC-AUC: **0.9324**
- Descriptive macro augmented ROC-AUC: **0.8773**
- Macro augmentation delta: **-0.0552**
- Macro clean / augmented AP: **0.9438 / 0.8918**

## Primary benchmark table

| Dataset | View | ROC-AUC (95% CI) | AP | Accuracy | Precision | Recall | Specificity | F1 | MCC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CIFAKE official test | Clean | **0.9816** [0.9786, 0.9843] | 0.9823 | 0.9198 | 0.8923 | 0.9548 | 0.8848 | 0.9225 | 0.8417 |
| CIFAKE official test | Augmented | **0.9095** [0.9014, 0.9177] | 0.9148 | 0.8226 | 0.8089 | 0.8448 | 0.8004 | 0.8265 | 0.6458 |
| SID-Set public validation | Clean | **0.8691** [0.8589, 0.8791] | 0.9018 | 0.7876 | 0.9878 | 0.5824 | 0.9928 | 0.7328 | 0.6308 |
| SID-Set public validation | Augmented | **0.8439** [0.8327, 0.8549] | 0.8845 | 0.7808 | 0.9618 | 0.5848 | 0.9768 | 0.7274 | 0.6105 |
| WildFake official test sample | Clean | **0.9467** [0.9404, 0.9529] | 0.9472 | 0.8824 | 0.8758 | 0.8912 | 0.8736 | 0.8834 | 0.7649 |
| WildFake official test sample | Augmented | **0.8785** [0.8687, 0.8876] | 0.8760 | 0.7764 | 0.7226 | 0.8972 | 0.6556 | 0.8005 | 0.5697 |

![ROC-AUC and AP by dataset](figures/auc_ap_by_dataset.png)

## Strict operating points and calibration

| Dataset | View | TPR@1% FPR | TPR@5% FPR | FPR@95% TPR | EER | Brier | ECE-15 | TN / FP / FN / TP |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| CIFAKE official test | Clean | 0.7564 | 0.8972 | 0.1020 | 0.0700 | 0.0570 | 0.0408 | 2,212 / 288 / 113 / 2,387 |
| CIFAKE official test | Augmented | 0.4040 | 0.6220 | 0.4288 | 0.1768 | 0.1231 | 0.0316 | 2,001 / 499 / 388 / 2,112 |
| SID-Set public validation | Clean | 0.5924 | 0.6564 | 0.7152 | 0.2196 | 0.2053 | 0.2058 | 2,482 / 18 / 1,044 / 1,456 |
| SID-Set public validation | Augmented | 0.5608 | 0.6204 | 0.7564 | 0.2460 | 0.2092 | 0.2061 | 2,442 / 58 / 1,038 / 1,462 |
| WildFake official test sample | Clean | 0.4376 | 0.7940 | 0.2804 | 0.1168 | 0.0928 | 0.0672 | 2,184 / 316 / 272 / 2,228 |
| WildFake official test sample | Augmented | 0.2036 | 0.4928 | 0.5188 | 0.2020 | 0.1731 | 0.1481 | 1,639 / 861 / 257 / 2,243 |

`TPR@1% FPR` answers the high-precision deployment question more harshly than overall AUC. EER is lower-is-better.
Brier, log loss and ECE are conditional on the deliberately balanced 50/50 benchmark prevalence and should not be
treated as deployment-prevalence calibration estimates.

## Clean-to-augmentation robustness

| Dataset | Clean AUC | Aug. AUC | Delta (95% CI) | Chance-normalized retention | Decision flips | Score correlation |
|---|---:|---:|---:|---:|---:|---:|
| CIFAKE official test | 0.9816 | 0.9095 | -0.0721 [-0.0796, -0.0647] | 85.0% | 16.7% | 0.7761 |
| SID-Set public validation | 0.8691 | 0.8439 | -0.0252 [-0.0297, -0.0207] | 93.2% | 2.5% | 0.9696 |
| WildFake official test sample | 0.9467 | 0.8785 | -0.0682 [-0.0765, -0.0607] | 84.7% | 18.2% | 0.7505 |

The AUC-delta intervals use 2,000 stratified, source-level paired bootstrap resamples. Every
resample preserves 2,500 real and 2,500 AI draws and keeps each source's clean and augmented predictions paired.
The augmented view is a deterministic **composite** of 1–5 score-blind transformations, not a single mild transform.

## Error interpretation

- **CIFAKE:** highest ranking performance in TEST1. Its native 32×32 inputs activate the accepted low-resolution
  CIFAKE head; augmentation reduces both AI recall and real specificity.
- **SID-Set:** the model is extremely conservative at threshold 0.5: very high real specificity but substantially
  lower AI recall. Its AUC/AP show useful ranking ability, so part of this is cross-domain calibration—not solely a
  representation failure. This report does not retune the threshold on SID.
- **WildFake:** clean ranking and threshold metrics are strong. Under composite corruption AI recall remains high, but
  many real images move above 0.5, causing the specificity and MCC decline.

## Curves and confusion matrices

![ROC curves](figures/roc_curves.png)

![Precision-recall curves](figures/pr_curves.png)

![Confusion matrices](figures/confusion_matrices.png)

![Calibration curves](figures/calibration_curves.png)

## Model and protocol

- Backbone representation and teacher logits: hash-pinned `Expert_4_siglip.pth`
  (`a7d2297e…130ff4`), 1,152-dimensional frozen feature.
- Loaded system size: **429,414,469 parameters** (428,521,282-parameter Expert-4 backbone plus three stored
  297,729-parameter heads), safely below 2B.
- Native longest side ≤64: accepted CIFAKE router head, residual scale/alpha `1.25`.
- Native longest side >64: frozen `0.65 × epoch-05 + 0.35 × epoch-08` finetuned-head stack; fixed margin boundary
  `-1.557959395647049`.
- CIFAKE: official test subset, 2,500 real + 2,500 AI.
- SID-Set: public labeled **validation** subset, 2,500 real + 2,500 AI/tampered. It is not described as a hidden test.
- WildFake: score-blind 5,000-image sample from official test metadata, 2,500 real + 2,500 AI.
- Per-dataset results are primary. Macro means are descriptive. A pooled cross-dataset AUC is intentionally omitted
  because score calibration and source/generator distributions differ by dataset.

## Reproducibility and files

The fresh TEST1 replay exactly reproduced the selected detector's earlier prediction and metric SHA-256 hashes.
The evaluator verified pinned manifests, cached Expert-4 features/logits, frozen checkpoint receipts, source-image
integrity, routing and fixed threshold semantics before reading labels for reporting.

This replay reran the frozen heads over integrity-verified cached Expert-4 features and logits. It did **not** rerun the
pixel-to-encoder forward pass and is not an end-to-end throughput, latency or VRAM benchmark.

- `metrics_full.csv`: complete metric fields for all six cells.
- `robustness_deltas.csv`: paired clean/augmentation changes and decision flips.
- `paired_bootstrap_auc.json`: AUC confidence intervals and paired deltas.
- `raw_eval/`: immutable raw predictions, six-row evaluator metrics and provenance report.
- `integrity.json`: hashes for all TEST1 outputs.

This is **TEST1**, not the locked TikTok competition test score. Dataset-external evaluation does not prove generator-
family or backbone-pretraining non-exposure.

## Limitations and eligibility warning

- These public suites were inspected during earlier development, so TEST1 is a development diagnostic rather than a
  pristine blind holdout. The reporting pass itself performs no fitting or threshold selection.
- The ≤64-pixel route sends all CIFAKE images to the specialized low-resolution head and no SID/WildFake images there;
  the resolution rule therefore carries benchmark/domain knowledge. CIFAKE performance must not be presented as pure
  unknown-domain generalization.
- Each augmented result uses one fixed composite recipe per source. Bootstrap intervals quantify source-sampling
  uncertainty while holding recipe seeds and generator clusters fixed.
- AP, precision, Brier, ECE and log loss reflect the artificial 50% class prevalence. The displayed TPR@FPR values are
  diagnostic points measured from the test ROC, not deployable score thresholds.
- Under the relayed Track-5 rule prohibiting an existing AIGC detector, the frozen Expert 4 dependency may require organizer clearance
  unless the organizers explicitly clear it. TEST1 establishes technical behavior, not competition eligibility.
