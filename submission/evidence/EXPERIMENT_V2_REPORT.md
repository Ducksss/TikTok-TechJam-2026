# SynthFlag experiment V2 report

## Verdict

V2 found a statistically positive **retrospective pooled** ranking result,
but did not establish a prospectively valid production improvement. The
regularized `logistic_disagreement` stack raised nested out-of-fold ROC-AUC
from 0.8661 to
0.8752
(delta +0.0091, duplicate-grouped paired 95% CI
+0.0030 to
+0.0152) and PR-AUC from
0.8985 to
0.9037
(delta +0.0052, 95% CI
+0.0009 to
+0.0096).

That stack failed the leave-one-dataset-out guardrail on every held-out domain.
Accordingly, the frozen production recommendation remains the released
four-expert probability mean. `logistic_disagreement` is retained only as an
experimental pooled profile. The CO-SPY stack reached the highest pooled
ROC-AUC (0.8975) but was
rejected because its gains were strongly domain-dependent.

The pooled stack did not improve within every dataset: its per-dataset AUC
deltas were -0.0061 CIFAKE,
-0.0123 SID_Set, and
+0.0026 WildFake. The
positive pooled result therefore partly reflects better ordering across dataset
score distributions, not a uniform within-domain detector improvement.
The paired intervals are valid for each predeclared method's outer-fold
predictions but are not adjusted for selecting a winner across nine method
families; this multiplicity is another reason no prospective production gain is
claimed.

## Study boundary

All three local manifests were exhausted by V1: 10,002
rows, 10,001 unique
content hashes, and zero unused hashes. V2 therefore used nested,
duplicate-grouped cross-validation on the 2,004
V1 calibration rows only. The previously unblinded 7,998-row V1 final partition
contributed zero rows to fitting, selection, thresholds, V2 metrics, robustness,
or domain-generalization evaluation. These are retrospective development
results, not a new protected-final claim.

The V1 external-fusion profiles are historical context only. Their unblinded
final scores and metrics were not candidates, features, selection inputs, or
evaluation rows in V2.

## Fixed released-mean baselines

| Threshold | ROC-AUC | Balanced accuracy | F1 | Recall | Precision | Specificity |
|---:|---:|---:|---:|---:|---:|---:|
| 0.5 | 0.8661 | 0.7909 | 0.7440 | 0.6078 | 0.9591 | 0.9741 |
| 0.2874746155 (historical) | 0.8661 | 0.8179 | 0.7998 | 0.7275 | 0.8879 | 0.9082 |

The two fixed thresholds have identical ROC-AUC and PR-AUC because they use the
same released-mean ranking. Their different balanced accuracy, recall,
precision, and specificity are threshold tradeoffs, not detector-ranking gains.

## Ranking and calibration

Each expert's cached binary logit margin (`fake_logit - real_logit`) was
independently converted back to its fake probability and checked against the
stored softmax probability. A common two-logit offset is unidentifiable but
irrelevant to binary softmax probabilities and every evaluated fusion.

| Method | ROC-AUC | PR-AUC | AUC delta | PR delta | Brier | Production guardrail |
|---|---:|---:|---:|---:|---:|---|
| isotonic | 0.8612 | 0.8909 | -0.0048 | -0.0076 | 0.1363 | no |
| logistic_disagreement | 0.8752 | 0.9037 | +0.0091 | +0.0052 | 0.1341 | no |
| logistic_disagreement_cospy | 0.8975 | 0.9141 | +0.0315 | +0.0157 | 0.1279 | no |
| logistic_experts | 0.8525 | 0.8895 | -0.0135 | -0.0090 | 0.1606 | no |
| platt | 0.8659 | 0.8983 | -0.0002 | -0.0002 | 0.1597 | yes |
| rank_mean | 0.8539 | 0.8884 | -0.0122 | -0.0101 | 0.1587 | yes |
| released_mean | 0.8661 | 0.8985 | +0.0000 | +0.0000 | 0.1721 | baseline |
| simplex_logloss | 0.8645 | 0.8968 | -0.0016 | -0.0017 | 0.1674 | yes |
| temperature | 0.8660 | 0.8985 | -0.0000 | +0.0000 | 0.1707 | yes |

PR-AUC is reported as stepwise average precision with score ties grouped.

Temperature, Platt, and isotonic calibration can improve probability quality,
but monotonic calibration is not a source of ranking improvement. Isotonic
introduced ties and reduced AUC. Continuous simplex probability weighting,
rank averaging, and expert-only logistic stacking did not beat the released
mean. Every outer-fold stacking coefficient, standardization statistic,
selected regularization value, and threshold is serialized in `v2_metrics.json`;
the all-development experimental fit is in `v2_frozen_config.json`.
For every logistic fit, feature mean and population standard deviation were
estimated on that training partition, the intercept was left unregularized,
and L2 strength was chosen by minimum inner-fold log loss from
`[0.001, 0.01, 0.1, 1, 10]` with ROC-AUC as the tie-break. Serialized feature
names define the coefficient order.
The simplex experiment is not a rerun of V1's settled coarse logit grid: V2
fits continuous non-negative probability weights to training-fold log loss and
evaluates them only on the corresponding held-out fold.

Calibration improved substantially for the experimental stack: Brier score
0.1721 to
0.1341, log loss
1.0148 to
0.4151, and ECE
0.1708 to
0.0231. This remains
cross-fitted retrospective evidence.

## Matched operating points and abstention

On the descriptive nested-OOF score curves at at least 75% recall, the released
mean achieved
75.35%
recall and 87.62%
specificity; the experimental stack achieved
75.15%
recall and 89.42%
specificity. At at least 95% specificity the released mean achieved
66.57%
recall and the experimental stack achieved
64.97%.
The stack's specificity delta at matched 75% recall was
+0.0180
(95% CI -0.0080
to +0.0299);
its recall delta at matched 95% specificity was
-0.0160
(95% CI -0.0439
to +0.0070).
Both matched-constraint intervals include zero, so V2 does not establish a
decision improvement under the preregistered matched-comparison criterion.
These curve points use OOF labels descriptively; deployable thresholds and their
fold-transfer metrics are serialized separately and were fitted inside training
partitions only.

Selective prediction was useful. Near 50% retained coverage, released-mean
error was 11.25% at
50.10% coverage; the experimental stack's
error was 9.82% at
49.80% coverage. Abstention results are
operational tradeoffs, not evidence that abstained images were solved.

## Leave-one-dataset-out generalization

| Held-out dataset | Released mean AUC | Experimental stack AUC | Stack delta | CO-SPY stack AUC |
|---|---:|---:|---:|---:|
| cifake | 0.9240 | 0.8626 | -0.0614 | 0.6353 |
| sid_set | 0.8972 | 0.6775 | -0.2198 | 0.7262 |
| wildfake | 0.8761 | 0.7919 | -0.0842 | 0.7785 |

The experimental stack learned correlations that transfer poorly when an
entire dataset is absent from development. This is the decisive reason it is
not the production default despite its positive random-fold confidence
intervals. The protocol preregistered rejection of severe dataset degradation
qualitatively but did not assign a numeric cutoff; the evaluator transparently
used a -0.02 ROC-AUC tolerance. The smallest observed leave-one-dataset-out loss
for the pooled winner exceeded 0.06, so the rejection is not sensitive to a
reasonable cutoff within that range.

## Deterministic corruption robustness

Clean-fitted models and thresholds were applied to corrupted outer-fold images;
no corruption labels or scores were used for refitting.

| Transform | Mean AUC | Mean delta | Stack AUC | Stack delta | Mean balanced acc. | Stack balanced acc. |
|---|---:|---:|---:|---:|---:|---:|
| additive_noise | 0.8594 | -0.0066 | 0.8674 | -0.0077 | 0.8049 | 0.8159 |
| clean | 0.8661 | +0.0000 | 0.8752 | +0.0000 | 0.8134 | 0.8219 |
| downscale_half | 0.8421 | -0.0239 | 0.8436 | -0.0316 | 0.7949 | 0.7939 |
| gaussian_blur | 0.8566 | -0.0095 | 0.8643 | -0.0109 | 0.8019 | 0.8064 |
| jpeg_q40 | 0.8355 | -0.0306 | 0.8281 | -0.0471 | 0.7680 | 0.7720 |
| jpeg_q60 | 0.8612 | -0.0049 | 0.8643 | -0.0109 | 0.8084 | 0.8069 |
| jpeg_q80 | 0.8648 | -0.0012 | 0.8758 | +0.0006 | 0.8154 | 0.8199 |
| jpeg_q95 | 0.8596 | -0.0065 | 0.8663 | -0.0088 | 0.8109 | 0.8134 |
| screenshot_like | 0.8462 | -0.0198 | 0.8431 | -0.0321 | 0.8014 | 0.7909 |

Fresh clean MPS inference reproduced the V1 cache with maximum absolute margin
difference 0.00001909.
The nine-condition run took 6.89 hours. Fresh clean
inference took 46.16 minutes; peak MPS current
allocation was 5.49
GiB, peak MPS driver allocation was
7.70 GiB, and the
private cache is 4.53 MiB.

## Aggregate error taxonomy

Largest released-mean false-negative subgroup aggregates:

- `tampered`: 139 false negatives in 167 rows
- `adm`: 43 false negatives in 56 rows
- `train`: 29 false negatives in 556 rows
- `vqdm`: 29 false negatives in 55 rows
- `ddpm`: 15 false negatives in 56 rows

Largest released-mean false-positive subgroup aggregates:

- `train`: 50 false positives in 556 rows
- `afhq`: 11 false positives in 56 rows
- `test`: 10 false positives in 111 rows
- `ffhq`: 9 false positives in 56 rows
- `celebahq`: 8 false positives in 56 rows

No image identifiers, paths, fold membership, or individual scores are present
in public artifacts.

## Recommended profiles

- **Production default:** released four-expert probability mean. Preserve the
  V1 threshold choice appropriate to the precision/recall cost; V2 did not
  prospectively replace it.
- **Experimental pooled profile:** cross-fitted
  `logistic_disagreement`, using four expert margins plus variance, mean entropy,
  ensemble margin, mean absolute margin, and six pairwise probability
  disagreements. It must be validated on a genuinely new domain before use.
- **Selective review:** use a two-threshold uncertain region when human review
  capacity exists; choose coverage from the serialized risk/coverage table.

## Reproduction and verification

Exact commands are in `experiments/README.md`. The independent verifier rebuilds
the released mean, experimental stack, pairwise ROC-AUC, average precision,
fold-specific decisions, corruption metrics, private/public hash bindings, and
all four checkpoint hashes without importing the V2 evaluation implementation.
