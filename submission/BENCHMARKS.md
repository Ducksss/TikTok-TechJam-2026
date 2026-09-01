# SynthFlag benchmark evidence

The selected runtime is the TEST1 routed residual detector: frozen Tu et al.
Expert 4 plus three project-trained heads. TEST1 is a completed public
development diagnostic, not TikTok's hidden test or an organizer score.

## Evidence boundary

| Evidence | Population | Model | Status |
|---|---:|---|---|
| TEST1 | 15,000 unique sources; 30,000 clean/composite rows | Selected Expert 4 plus three-head graph | Primary selected-graph evidence |
| V1 protected final | 7,998 rows | Retired four-expert probability mean | Historical only |
| V2 retrospective study | 2,004 development rows plus corruptions | Retired four-expert probability mean and experimental fusions | Historical only |
| V3 | COCO real source audited; exact DALL-E Advanced fake source absent | Not run | **Blocked; no result** |

A dash (`-`) means unavailable, never zero.

## TEST1 primary results

Every dataset contributes 2,500 real and 2,500 AI-positive sources. Each source
is scored once clean and once after one deterministic, score-blind composite of
1–5 transformations. Threshold metrics use the fixed reported score boundary
`0.5`; the reporting pass performs no fitting or threshold selection.

| Dataset | View | ROC-AUC | AP | Accuracy | Precision | Recall | Specificity | F1 | MCC | FP | FN |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| CIFAKE official test | Clean | 0.9816 | 0.9823 | 0.9198 | 0.8923 | 0.9548 | 0.8848 | 0.9225 | 0.8417 | 288 | 113 |
| CIFAKE official test | Composite | 0.9095 | 0.9148 | 0.8226 | 0.8089 | 0.8448 | 0.8004 | 0.8265 | 0.6458 | 499 | 388 |
| SID-Set public validation | Clean | 0.8691 | 0.9018 | 0.7876 | 0.9878 | 0.5824 | 0.9928 | 0.7328 | 0.6308 | 18 | 1,044 |
| SID-Set public validation | Composite | 0.8439 | 0.8845 | 0.7808 | 0.9618 | 0.5848 | 0.9768 | 0.7274 | 0.6105 | 58 | 1,038 |
| WildFake official-test sample | Clean | 0.9467 | 0.9472 | 0.8824 | 0.8758 | 0.8912 | 0.8736 | 0.8834 | 0.7649 | 316 | 272 |
| WildFake official-test sample | Composite | 0.8785 | 0.8760 | 0.7764 | 0.7226 | 0.8972 | 0.6556 | 0.8005 | 0.5697 | 861 | 257 |

Descriptive macro ROC-AUC is `0.9324` clean and `0.8773` composite. These
macro means are not pooled cross-domain estimates.

## Strict operating points

| Dataset | View | TPR at 1% FPR | TPR at 5% FPR | EER | Brier | ECE-15 |
|---|---|---:|---:|---:|---:|---:|
| CIFAKE | Clean | 0.7564 | 0.8972 | 0.0700 | 0.0570 | 0.0408 |
| CIFAKE | Composite | 0.4040 | 0.6220 | 0.1768 | 0.1231 | 0.0316 |
| SID-Set | Clean | 0.5924 | 0.6564 | 0.2196 | 0.2053 | 0.2058 |
| SID-Set | Composite | 0.5608 | 0.6204 | 0.2460 | 0.2092 | 0.2061 |
| WildFake | Clean | 0.4376 | 0.7940 | 0.1168 | 0.0928 | 0.0672 |
| WildFake | Composite | 0.2036 | 0.4928 | 0.2020 | 0.1731 | 0.1481 |

Brier/ECE reflect an artificial 50/50 benchmark prevalence and are not
deployment calibration estimates.

## Robustness deltas

| Dataset | Clean AUC | Composite AUC | Delta, 95% paired CI | Decision flips | Score correlation |
|---|---:|---:|---:|---:|---:|
| CIFAKE | 0.9816 | 0.9095 | -0.0721 [-0.0796, -0.0647] | 16.7% | 0.7761 |
| SID-Set | 0.8691 | 0.8439 | -0.0252 [-0.0297, -0.0207] | 2.5% | 0.9696 |
| WildFake | 0.9467 | 0.8785 | -0.0682 [-0.0765, -0.0607] | 18.2% | 0.7505 |

The intervals use 2,000 stratified source-level paired bootstrap resamples.

## Material limitations

- Public suites were inspected during earlier development, so TEST1 is not a
  pristine blind holdout.
- Native longest side `<=64` activates the CIFAKE specialist. This sends all
  TEST1 CIFAKE images and no SID/WildFake images to that head, encoding
  benchmark/domain knowledge.
- The replay used integrity-verified cached Expert 4 features/logits; it is not
  a fresh end-to-end latency or VRAM benchmark.
- SID local tampering is frequently missed. WildFake composite specificity is
  weak and produces 861 false positives at the reported boundary.
- Residual-head rights are collaborator-attested and project-owner accepted,
  not independently license-audited in this repository. Expert 4
  redistribution and organizer eligibility remain separate questions.
- Use of an existing published detector may require explicit organizer
  clearance under the relayed Track 5 eligibility rule.

Aggregate source evidence is stored in [`evidence/test1/`](evidence/test1/).
Older V1/V2 files remain under `evidence/` so prior work is auditable, but they
must not be used as selected-graph results.
