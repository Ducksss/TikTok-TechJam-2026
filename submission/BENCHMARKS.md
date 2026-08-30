# SynthFlag benchmark table

All numbers below are copied or rounded to four decimals from the public,
checksum-bound evidence in [`evidence/`](evidence/). A dash (`-`) means the
value was not produced by that study; it is not a zero. SynthFlag is the public
product name, while FeatDistill is the credited underlying detector/package.

## Evidence boundary

| Version | Population | Evaluation design | Fit/selection boundary | Evidence status |
|---|---:|---|---|---|
| V1 calibration | 2,004 | Calibration and frozen configuration selection | May select thresholds/configurations | Development only |
| V1 final | 7,998 (3,999 real + 3,999 fake) | One protected final evaluation | No final rows used for selection | Complete protected-final evidence |
| V2 | 2,004 (SID_Set 667, CIFAKE 667, WildFake 670) | Nested duplicate-grouped cross-validation, plus deterministic corruptions | V1 calibration rows only; V1 final rows used: 0 | Complete retrospective development evidence |
| V3 | COCO val2017: 5,000 audited real; DALL-E Advanced: 8,843 required fake | Fixed-threshold paired clean/augmented A/B | No fitting or threshold selection permitted | **BLOCKED: exact organizer DALL-E Advanced source absent** |

## V1 protected final results

The calibrated threshold is `0.2874746155139839`. The supplied external
reference could not be reproduced in the evaluated checkout, so improvement
claims compare against the locally remeasured, checksum-bound released mean.

| Configuration | ROC-AUC | Balanced accuracy | F1 | Fake recall | Precision | Specificity |
|---|---:|---:|---:|---:|---:|---:|
| Supplied external reference | 0.8767 | 0.7962 | 0.7555 | 0.6297 | 0.9442 | 0.9628 |
| Local released mean, threshold 0.5 | 0.8505 | 0.7763 | 0.7259 | 0.5924 | 0.9371 | 0.9602 |
| **Local released mean, calibrated threshold** | **0.8505** | **0.8061** | **0.7861** | **0.7127** | 0.8764 | 0.8995 |
| External fusion, balanced profile | 0.8384 | 0.8040 | 0.7745 | 0.6734 | 0.9113 | 0.9345 |
| External fusion, high-precision profile | 0.8404 | 0.7988 | 0.7629 | 0.6472 | **0.9289** | **0.9505** |
| External fusion, high-recall profile | 0.8383 | 0.7387 | 0.7598 | **0.8265** | 0.7030 | 0.6509 |

The two released-mean rows have identical ROC-AUC because they use identical
scores. Lowering the threshold trades precision and specificity for recall;
it does not improve ranking.

## V2 ranking and calibration

V2 is retrospective development evidence, not a second protected test. The
disagreement-aware stack improved pooled cross-fitted ranking but failed all
three leave-one-dataset-out guardrails and was not promoted.

| Method | ROC-AUC | PR-AUC | AUC change | PR change | Brier | Production guardrail |
|---|---:|---:|---:|---:|---:|---|
| Isotonic | 0.8612 | 0.8909 | -0.0048 | -0.0076 | 0.1363 | No |
| Logistic disagreement | 0.8752 | 0.9037 | +0.0091 | +0.0052 | 0.1341 | No |
| Logistic disagreement + CO-SPY | 0.8975 | 0.9141 | +0.0315 | +0.0157 | 0.1279 | No |
| Logistic experts | 0.8525 | 0.8895 | -0.0135 | -0.0090 | 0.1606 | No |
| Platt | 0.8659 | 0.8983 | -0.0002 | -0.0002 | 0.1597 | Yes |
| Rank mean | 0.8539 | 0.8884 | -0.0122 | -0.0101 | 0.1587 | Yes |
| Released mean | 0.8661 | 0.8985 | +0.0000 | +0.0000 | 0.1721 | Baseline |
| Simplex log-loss | 0.8645 | 0.8968 | -0.0016 | -0.0017 | 0.1674 | Yes |
| Temperature | 0.8660 | 0.8985 | -0.0000 | +0.0000 | 0.1707 | Yes |

PR-AUC is stepwise average precision with ties grouped.

### Leave-one-dataset-out guardrail

| Held-out dataset | Released mean AUC | Logistic-disagreement AUC | Change | CO-SPY stack AUC |
|---|---:|---:|---:|---:|
| CIFAKE | 0.9240 | 0.8626 | -0.0614 | 0.6353 |
| SID_Set | 0.8972 | 0.6775 | -0.2198 | 0.7262 |
| WildFake | 0.8761 | 0.7919 | -0.0842 | 0.7785 |

## V2 released-mean robustness by dataset

Clean-fitted, fold-local thresholds were applied unchanged to every
corruption. No corruption score or label was used for refitting. Per-dataset
AUC confidence intervals and per-dataset Brier/ECE were not serialized, so
they are shown as `-`.

| Dataset | Condition | AUC | AUC 95% CI | AP | Balanced accuracy | Fake recall | Real recall | F1 | Brier | ECE |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SID_Set | Clean | 0.8972 | - | 0.9234 | 0.7889 | 0.5838 | 0.9940 | 0.7345 | - | - |
| SID_Set | JPEG Q95 | 0.8966 | - | 0.9232 | 0.7889 | 0.5808 | 0.9970 | 0.7335 | - | - |
| SID_Set | JPEG Q80 | 0.8969 | - | 0.9231 | 0.7874 | 0.5808 | 0.9940 | 0.7321 | - | - |
| SID_Set | JPEG Q60 | 0.8993 | - | 0.9245 | 0.7874 | 0.5778 | 0.9970 | 0.7311 | - | - |
| SID_Set | JPEG Q40 | 0.8933 | - | 0.9204 | 0.7844 | 0.5719 | 0.9970 | 0.7262 | - | - |
| SID_Set | Downscale 0.5x | 0.8928 | - | 0.9196 | 0.7874 | 0.5808 | 0.9940 | 0.7321 | - | - |
| SID_Set | Screenshot-like | 0.8627 | - | 0.8987 | 0.7814 | 0.5629 | 1.0000 | 0.7203 | - | - |
| SID_Set | Gaussian blur | 0.8988 | - | 0.9244 | 0.7889 | 0.5838 | 0.9940 | 0.7345 | - | - |
| SID_Set | Additive noise | 0.8934 | - | 0.9205 | 0.7859 | 0.5808 | 0.9910 | 0.7307 | - | - |
| CIFAKE | Clean | 0.9240 | - | 0.9313 | 0.8501 | 0.8799 | 0.8204 | 0.8542 | - | - |
| CIFAKE | JPEG Q95 | 0.9224 | - | 0.9299 | 0.8456 | 0.8709 | 0.8204 | 0.8492 | - | - |
| CIFAKE | JPEG Q80 | 0.9222 | - | 0.9289 | 0.8426 | 0.8769 | 0.8084 | 0.8476 | - | - |
| CIFAKE | JPEG Q60 | 0.9031 | - | 0.9109 | 0.8246 | 0.8198 | 0.8293 | 0.8235 | - | - |
| CIFAKE | JPEG Q40 | 0.8545 | - | 0.8722 | 0.7482 | 0.8228 | 0.6737 | 0.7654 | - | - |
| CIFAKE | Downscale 0.5x | 0.8932 | - | 0.9027 | 0.8231 | 0.8168 | 0.8293 | 0.8218 | - | - |
| CIFAKE | Screenshot-like | 0.8881 | - | 0.9022 | 0.7899 | 0.6847 | 0.8952 | 0.7651 | - | - |
| CIFAKE | Gaussian blur | 0.9174 | - | 0.9276 | 0.8366 | 0.8258 | 0.8473 | 0.8346 | - | - |
| CIFAKE | Additive noise | 0.9283 | - | 0.9354 | 0.8531 | 0.8559 | 0.8503 | 0.8533 | - | - |
| WildFake | Clean | 0.8761 | - | 0.8948 | 0.8015 | 0.7373 | 0.8657 | 0.7879 | - | - |
| WildFake | JPEG Q95 | 0.8567 | - | 0.8760 | 0.7985 | 0.7552 | 0.8418 | 0.7894 | - | - |
| WildFake | JPEG Q80 | 0.8753 | - | 0.8891 | 0.8164 | 0.7910 | 0.8418 | 0.8116 | - | - |
| WildFake | JPEG Q60 | 0.8784 | - | 0.8979 | 0.8134 | 0.7194 | 0.9075 | 0.7941 | - | - |
| WildFake | JPEG Q40 | 0.8523 | - | 0.8797 | 0.7716 | 0.6627 | 0.8806 | 0.7437 | - | - |
| WildFake | Downscale 0.5x | 0.8354 | - | 0.8604 | 0.7746 | 0.6866 | 0.8627 | 0.7529 | - | - |
| WildFake | Screenshot-like | 0.9168 | - | 0.9237 | 0.8328 | 0.8896 | 0.7761 | 0.8418 | - | - |
| WildFake | Gaussian blur | 0.8492 | - | 0.8745 | 0.7806 | 0.6955 | 0.8657 | 0.7602 | - | - |
| WildFake | Additive noise | 0.8544 | - | 0.8777 | 0.7761 | 0.7194 | 0.8328 | 0.7627 | - | - |

Real recall equals specificity. Higher is better except Brier and ECE.

### Pooled calibration and ranking by condition

| Condition | Pooled AUC | AUC change | Brier | ECE | Interpretation |
|---|---:|---:|---:|---:|---|
| Clean | 0.8661 | +0.0000 | 0.1721 | 0.1708 | Reference condition |
| JPEG Q95 | 0.8596 | -0.0065 | 0.1740 | 0.1655 | Small pooled ranking loss |
| JPEG Q80 | 0.8648 | -0.0012 | 0.1699 | 0.1607 | Near-clean pooled ranking |
| JPEG Q60 | 0.8612 | -0.0049 | 0.1857 | 0.1902 | Mild pooled ranking loss |
| JPEG Q40 | 0.8355 | -0.0306 | 0.1966 | 0.1816 | Largest pooled AUC loss |
| Downscale 0.5x | 0.8421 | -0.0239 | 0.1956 | 0.1929 | Second-largest pooled AUC loss |
| Screenshot-like | 0.8462 | -0.0198 | 0.1795 | 0.1649 | Strong source-dependent behavior |
| Gaussian blur | 0.8566 | -0.0095 | 0.1841 | 0.1852 | Moderate pooled degradation |
| Additive noise | 0.8594 | -0.0066 | 0.1774 | 0.1765 | Small pooled ranking loss |

## V3 paired clean/augmented A/B

The planned comparison keeps the released score bit-identical and compares
two frozen thresholds (`0.5` and `0.2874746155139839`) on clean images and six
deterministic augmented views. The official COCO val2017 audit found 5,000
unique decodable real images. The exact organizer-provided 8,843-image DALL-E
Advanced source has not been obtained, so no V3 performance statistic exists.

| Metric | Threshold 0.5 | Threshold 0.2874746155139839 | Paired change |
|---|---:|---:|---:|
| Clean ROC-AUC | - | - | - |
| Clean balanced accuracy | - | - | - |
| Clean F1 | - | - | - |
| Clean fake recall | - | - | - |
| Clean precision | - | - | - |
| Clean specificity | - | - | - |
| Augmented ROC-AUC | - | - | - |
| Augmented balanced accuracy | - | - | - |
| Augmented F1 | - | - | - |
| McNemar test | - | - | - |

**V3 status: BLOCKED.** A similarly named dataset must not be substituted for
the organizer source, and thresholds must not be retuned on V3 labels.

## Evidence files and source identity

The copied files below were byte-identical in both verified source checkouts
used for this package.

| Evidence file | SHA-256 | Purpose |
|---|---|---|
| `evidence/INTERIM_EXPERIMENT_REPORT.md` | `6d491b271d87359686364fce6dc8cfa1ae40b2e16a59b3ed5e0298b0f9a91ae2` | Consolidated V1/V2/V3 narrative and boundary |
| `evidence/EXPERIMENT_V2_REPORT.md` | `048de15241316d7fc9747c7cb090d93ccd14f905a8bb3df152c3f75a341cbeeb` | Detailed V2 metrics and limitations |
| `evidence/final_report.json` | `8429dce7dccb794a18437d6d77bd856b5b9e0b15381e8da75aa95e90e5b3b703` | Machine-readable V1 protected-final metrics |
| `evidence/v2_protocol.json` | `16344e0f8637b5347389cfff15491eb3ace1cdb1316cb762073e8c1263543f94` | Frozen retrospective study contract |
| `evidence/v3_coco_audit.json` | `661cba788d4946d6a83858c75322cdebe25162e6c013a3d9adc53fd83a2e591d` | Machine-readable COCO audit |

No dataset files, manifests containing dataset paths, private split rows,
per-image scores, fold assignments, or checkpoints are included in this
submission directory.
