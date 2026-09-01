# TEST1 public development benchmark

Date: **2026-09-01** (Asia/Singapore)

Status: **Complete aggregate report; development evidence**

## Evidence and model boundary

TEST1 evaluates a frozen, benchmark-only **corrected-v2** detector built from
the hash-pinned `Expert_4_siglip.pth` representation plus stored heads, a
native-resolution router, and a fixed margin boundary. That topology is not the
released `infer/` contract, which remains the unweighted arithmetic mean of two
CLIP and two SigLIP expert probabilities. TEST1 values therefore must not be
presented as measurements of the live four-expert website service or the public
batch CLI.

The source suites were inspected during development. TEST1 is a reproducible
public development benchmark, not a pristine blind holdout, an organizer
leaderboard result, or the TikTok TechJam hidden evaluation set.

## Evaluation design

TEST1 contains **15,000 exact-byte-unique public source images**:

| Dataset | Public split and sampling | Real | AI or AI-tampered | Unique images |
|---|---|---:|---:|---:|
| CIFAKE | Deterministic subset of the official test split | 2,500 | 2,500 | 5,000 |
| SID-Set | Deterministic subset of the public validation split | 2,500 | 2,500 | 5,000 |
| WildFake | Score-blind sample from official test metadata | 2,500 | 2,500 | 5,000 |
| **Total** | Three balanced public suites | **7,500** | **7,500** | **15,000** |

Each source image was scored twice: once clean and once with one deterministic
composite of one to five score-blind transformations. The augmentation families
were JPEG compression, Gaussian blur, resize round trip, Gaussian noise, color
jitter, and center-crop round trip. This produced **30,000 predictions from
15,000 source identities**; the augmented rows are paired views, not additional
independent images.

The decision threshold was fixed at `0.5` before reporting. No TEST1 label was
used to tune a threshold, checkpoint, router, or head during the reporting
pass.

## Primary results

Confidence intervals below are source-reported 95% bootstrap intervals. The
received package did not contain the referenced paired-bootstrap JSON, so the
interval endpoints were not independently regenerated in this repository.

| Dataset | View | ROC-AUC (95% CI) | AP | Accuracy | Precision | AI recall | Specificity | F1 | MCC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CIFAKE official test subset | Clean | **0.9816** [0.9786, 0.9843] | 0.9823 | 0.9198 | 0.8923 | 0.9548 | 0.8848 | 0.9225 | 0.8417 |
| CIFAKE official test subset | Augmented | **0.9095** [0.9014, 0.9177] | 0.9148 | 0.8226 | 0.8089 | 0.8448 | 0.8004 | 0.8265 | 0.6458 |
| SID-Set public validation subset | Clean | **0.8691** [0.8589, 0.8791] | 0.9018 | 0.7876 | 0.9878 | 0.5824 | 0.9928 | 0.7328 | 0.6308 |
| SID-Set public validation subset | Augmented | **0.8439** [0.8327, 0.8549] | 0.8845 | 0.7808 | 0.9618 | 0.5848 | 0.9768 | 0.7274 | 0.6105 |
| WildFake official test sample | Clean | **0.9467** [0.9404, 0.9529] | 0.9472 | 0.8824 | 0.8758 | 0.8912 | 0.8736 | 0.8834 | 0.7649 |
| WildFake official test sample | Augmented | **0.8785** [0.8687, 0.8876] | 0.8760 | 0.7764 | 0.7226 | 0.8972 | 0.6556 | 0.8005 | 0.5697 |

The descriptive, equally weighted macro means across the three datasets are:

| View | Macro ROC-AUC | Macro AP |
|---|---:|---:|
| Clean | **0.9324** | **0.9438** |
| Augmented | **0.8773** | **0.8918** |
| Augmented minus clean | **-0.0552** | **-0.0520** |

Per-dataset results are primary. A pooled cross-dataset AUC is intentionally not
reported because score calibration and source/generator distributions differ.

## Low-false-positive-first operating policy

For TikTok-like creator operations, false positives are the first error cost to
constrain. Wrongly questioning authentic work can interrupt distribution or
monetization, damage creator trust, and create avoidable appeals. Consequential
actions should therefore target a validated low false-positive rate first, then
reduce false negatives as far as that constraint permits.

TEST1 reports strict ranking diagnostics for that policy:

| Dataset | View | TPR at 1% FPR | TPR at 5% FPR | FPR at fixed 0.5 |
|---|---|---:|---:|---:|
| CIFAKE | Clean | 0.7564 | 0.8972 | 0.1152 |
| CIFAKE | Augmented | 0.4040 | 0.6220 | 0.1996 |
| SID-Set | Clean | 0.5924 | 0.6564 | 0.0072 |
| SID-Set | Augmented | 0.5608 | 0.6204 | 0.0232 |
| WildFake | Clean | 0.4376 | 0.7940 | 0.1264 |
| WildFake | Augmented | 0.2036 | 0.4928 | 0.3444 |

The fixed `0.5` benchmark point is a diagnostic, not a universal low-FPR
moderation threshold. It satisfies neither one common FPR cap nor one common
error profile across all six cells. A deployment must choose and freeze its
threshold on separate representative calibration data, monitor it by domain and
post-processing slice, preserve human review, and provide an appeal path.

## Robustness changes

| Dataset | Clean AUC | Augmented AUC | Paired delta (95% CI) | Decision flips | Score correlation |
|---|---:|---:|---:|---:|---:|
| CIFAKE | 0.9816 | 0.9095 | -0.0721 [-0.0796, -0.0647] | 16.72% | 0.7761 |
| SID-Set | 0.8691 | 0.8439 | -0.0252 [-0.0297, -0.0207] | 2.48% | 0.9696 |
| WildFake | 0.9467 | 0.8785 | -0.0682 [-0.0765, -0.0607] | 18.16% | 0.7505 |

The augmented view is one fixed composite recipe per source, not a complete
corruption suite. TEST1 does not cover neural compression, watermark insertion
or removal, adversarial attacks, or the complete NTIRE 36-transformation
pipeline.

## Dataset-specific interpretation

- **CIFAKE:** all native 32 x 32 images activate the corrected-v2
  low-resolution route, so this result is benchmark-aware and is not pure
  unknown-domain generalization.
- **SID-Set:** the `0.5` point is conservative for real images and misses many
  AI/tampered examples. Ranking remains useful, but the score distribution is
  not calibrated for this domain.
- **WildFake:** clean ranking is strong; under composite corruption, AI recall
  remains high while real-image specificity falls sharply.

## Integrity and verification performed for this release

The received files were treated as evidence inputs, not instructions. Their
recorded SHA-256 values and the verification performed against the received
row-level file are in [`source-integrity.json`](source-integrity.json).

Fresh repository-side checks established that:

- the received `predictions.csv` has 30,000 rows in six balanced 5,000-row
  cells;
- all rows form exactly 15,000 clean/augmented source pairs with matching label,
  dimensions, and route;
- all six confusion matrices match `metrics_full.csv`; and
- independently calculated rank-based ROC-AUC and grouped-tie average precision
  match all six serialized values exactly.

The repository publishes aggregate tables and source hashes, but not the
5 MiB row-level predictions, source identities, dataset pixels, local protocol
paths, cached features/logits, checkpoints, or benchmark harness. The received
package also referenced `paired_bootstrap_auc.json`, `summary.json`, and
`raw_eval/`, which were not present in the supplied directory. Consequently,
this public record supports aggregate inspection and integrity tracing, not a
fresh pixel-to-encoder replay or independent regeneration of the confidence
intervals.
