# SynthFlag inference-only experiment report

**Evaluation date:** 2026-08-29  
**Status:** Interim report. V1 and V2 results are complete; the preregistered
V3 held-out threshold A/B test is ready but cannot be completed until the exact
organizer-provided 8,843-image DALL·E Advanced set is available.

## Executive summary

The strongest defensible production result is not a retrained detector. It is
the released four-expert probability mean with its decision
threshold lowered from `0.5` to `0.2874746155`, where that threshold was fitted
on calibration data only.

On the protected 7,998-image V1 final partition, this change increased balanced
accuracy from **0.7763 to 0.8061**, F1 from **0.7259 to 0.7861**, and fake recall
from **0.5924 to 0.7127**. The cost was lower precision (**0.9371 to 0.8764**)
and specificity (**0.9602 to 0.8995**). ROC-AUC remained **0.8505** because the
underlying scores and ranking did not change.

V2 found a more complex disagreement-aware stack with a retrospective pooled
ROC-AUC of **0.8752**, versus **0.8661** for the released mean on development
data. That stack failed every leave-one-dataset-out test, so it is not a
defensible replacement for the released mean. The current recommendation is:

- use threshold `0.2874746155` when balanced fake detection is the priority;
- retain threshold `0.5` when minimizing false alarms is more important;
- treat learned fusion and CO-SPY results as experimental until prospectively
  validated on genuinely unseen domains.

## What changed relative to the default repository

The default detector averages the four released experts' fake probabilities
and classifies an image as fake when that mean is at least `0.5`. The winning
balanced configuration preserves the same checkpoints, preprocessing, expert
outputs, and probability averaging. Only the operating threshold changes.

| Component | Default repository | Balanced configuration |
|---|---|---|
| Checkpoints | Four released experts | Unchanged |
| Model parameters | Released values | Unchanged |
| Clean-image preprocessing | Released pipeline | Unchanged |
| Ensemble score | Mean of four fake probabilities | Unchanged |
| Decision rule | Fake if score >= `0.5` | Fake if score >= `0.2874746155` |
| Training/fine-tuning | None | None |

The public `forward()` behavior remains in the released probability order.
Experiment support was added around it to expose per-expert logits, run on
Apple MPS, cache checksum-bound scores, evaluate deterministic transformations,
and independently verify results. These additions support measurement; they do
not modify checkpoint parameters.

## Why balanced accuracy, F1, and recall rose while precision and specificity fell

Lowering the threshold relabels every image with a fake score in the interval
`[0.2874746155, 0.5)` from real to fake. That has two simultaneous effects:

1. Previously missed fake images become true positives, increasing recall.
2. Some real images become false positives, decreasing specificity and
   precision.

The protected-final movement is therefore the expected operating-point
tradeoff, not a contradiction:

| Metric | Threshold 0.5 | Threshold 0.2874746155 | Absolute change |
|---|---:|---:|---:|
| ROC-AUC | 0.8505 | 0.8505 | 0.0000 |
| Balanced accuracy | 0.7763 | 0.8061 | +0.0298 |
| F1 | 0.7259 | 0.7861 | +0.0602 |
| Fake recall | 0.5924 | 0.7127 | +0.1203 |
| Precision | 0.9371 | 0.8764 | -0.0607 |
| Specificity | 0.9602 | 0.8995 | -0.0607 |

Balanced accuracy rose because the 12.03-percentage-point recall gain was
larger than the 6.07-point specificity loss. F1 rose because the recall gain
outweighed the precision loss in the harmonic mean. ROC-AUC did not move
because it evaluates the ordering of scores across all thresholds, while this
experiment changed only one decision cutoff.

The improvement was not inferred from the final labels: the threshold was
selected on the calibration partition and then frozen. Relative to the local
threshold-0.5 control, the protected-final balanced-accuracy gain was +0.02976
with a paired 95% bootstrap interval of +0.02336 to +0.03576.

## V1 protected benchmark results

The protected final partition contained 7,998 images, balanced between 3,999
real and 3,999 fake images. Duplicate hashes were kept within one protected
role, and uncertainty intervals used dataset/label-stratified bootstrap
resampling with duplicates grouped.

| Configuration | ROC-AUC | Balanced accuracy | F1 | Recall | Precision | Specificity |
|---|---:|---:|---:|---:|---:|---:|
| Supplied external reference | 0.8767 | 0.7962 | 0.7555 | 0.6297 | 0.9442 | 0.9628 |
| Local released mean, threshold 0.5 | 0.8505 | 0.7763 | 0.7259 | 0.5924 | 0.9371 | 0.9602 |
| **Local released mean, calibrated threshold** | **0.8505** | **0.8061** | **0.7861** | **0.7127** | 0.8764 | 0.8995 |
| External fusion, balanced profile | 0.8384 | 0.8040 | 0.7745 | 0.6734 | 0.9113 | 0.9345 |
| External fusion, high-precision profile | 0.8404 | 0.7988 | 0.7629 | 0.6472 | **0.9289** | **0.9505** |
| External fusion, high-recall profile | 0.8383 | 0.7387 | 0.7598 | **0.8265** | 0.7030 | 0.6509 |

The supplied external reference could not be exactly reproduced in this
checkout. Across all 10,002 local images, the untouched released mean produced
ROC-AUC 0.8536 and balanced accuracy 0.7792. Its real-class confusion counts
were nearly identical to the supplied reference, but it found 171 fewer fake
true positives. For that reason, all improvement claims above compare against
the locally remeasured, checksum-bound control rather than claiming to have
beaten an unreproduced reference.

## V2 inference-only experiments

V2 used only the 2,004 V1 calibration rows with nested, duplicate-grouped
cross-validation. The already unblinded 7,998-image V1 final set was excluded
from fitting, selection, thresholds, V2 metrics, robustness testing, and
domain-generalization analysis.

### Ranking and calibration

| Method | ROC-AUC | PR-AUC | AUC change vs released mean | Decision |
|---|---:|---:|---:|---|
| Released probability mean | 0.8661 | 0.8985 | 0.0000 | Production baseline |
| Platt calibration | 0.8659 | 0.8983 | -0.0002 | Eligible, no ranking gain |
| Temperature calibration | 0.8660 | 0.8985 | approximately 0 | Eligible, no ranking gain |
| Continuous simplex fusion | 0.8645 | 0.8968 | -0.0016 | Rejected |
| Rank mean | 0.8539 | 0.8884 | -0.0122 | Rejected |
| Expert-only logistic stack | 0.8525 | 0.8895 | -0.0135 | Rejected |
| Disagreement-aware logistic stack | 0.8752 | 0.9037 | +0.0091 | Experimental only |
| Disagreement + CO-SPY stack | 0.8975 | 0.9141 | +0.0315 | Rejected for domain dependence |

The disagreement-aware stack also improved retrospective calibration: Brier
score fell from 0.1721 to 0.1341, log loss from 1.0148 to 0.4151, and expected
calibration error from 0.1708 to 0.0231. These are cross-fitted development
results, not a new protected-final claim.

### Generalization guardrail

| Held-out dataset | Released mean AUC | Disagreement stack AUC | Change |
|---|---:|---:|---:|
| CIFAKE | 0.9240 | 0.8626 | -0.0614 |
| SID_Set | 0.8972 | 0.6775 | -0.2198 |
| WildFake | 0.8761 | 0.7919 | -0.0842 |

The stack's pooled gain was therefore not stable when an entire source domain
was absent during fitting. This is the decisive reason it was not promoted to
the production default.

### Robustness and selective review

The released mean's clean development AUC was 0.8661. The largest tested
ranking losses occurred under JPEG quality 40 (AUC 0.8355, change -0.0306),
half-resolution downscale/upscale (0.8421, -0.0239), and a screenshot-like
transformation (0.8462, -0.0198). JPEG quality 80 was much less damaging
(0.8648, -0.0012).

Abstention was useful as an operational option. Near 50% retained coverage,
the released mean had 11.25% error, while the experimental stack had 9.82%
error. This reduces error among accepted cases but does not solve the deferred
cases; it requires a human-review or fallback workflow.

## V3 prospective threshold A/B evaluation

V3 is designed to answer the central threshold question on new, untouched
data: compare the released score at threshold `0.5` against the same exact
score at the frozen threshold `0.2874746155`. It performs no model fitting or
candidate selection on the new labels.

The planned evaluation contains 23,845 source images and seven deterministic
conditions per image:

- clean;
- JPEG quality 80;
- half-resolution downscale and upscale;
- Gaussian blur with radius 0.5;
- seeded white noise with variance 0.001;
- saturation factor 0.8;
- contrast reduction of 0.15.

### Current data readiness

| Source | Required | Audited status |
|---|---:|---|
| Existing CIFAKE, SID_Set, WildFake | 10,002 | Complete: 5,001 real, 5,001 fake, 10,001 unique hashes |
| Official COCO `val2017` | 5,000 | Complete: all 5,000 unique and decodable; retain two above the organizer's 4,998 expectation |
| Organizer DALL·E Advanced | 8,843 | **Unavailable; exact source required** |

The existing-data audit found zero unreadable rows, zero declared identity
mismatches, zero contradictory-label hashes, and zero cross-dataset hash
overlaps. It found the one documented same-label CIFAKE duplicate. The COCO
archive has MD5 `442b8da7639aecaf257c1dceb8ba8c80` and SHA-256
`4f7e2ccb2866ec5041993c9cf2a952bbed69647b115d0f74da7ce8f4bef82f05`.

No substitute DALL·E collection should be used: changing the source would
change the target distribution and invalidate the preregistered comparison.
Consequently, this report does not invent or extrapolate V3 metrics.

## Recommended next experiments

1. **Complete the frozen V3 threshold A/B test.** This is the highest-priority
   experiment because it prospectively tests whether the balanced threshold
   transfers to unseen COCO real and organizer DALL·E fake images.
2. **Report threshold sensitivity without retuning.** Evaluate a small
   preregistered grid around both frozen thresholds and show the complete
   precision-recall-specificity frontier. Keep `0.2874746155` and `0.5` as the
   primary confirmatory comparisons.
3. **Test augmentation consistency as a review signal.** Measure whether score
   variance across the six degradations predicts mistakes. Use it for
   abstention or review prioritization only after a calibration-only rule is
   frozen.
4. **Prospectively test the disagreement stack.** Apply the already frozen V2
   stack to a genuinely new dataset without refitting. Promote it only if its
   ranking gain survives per-domain and leave-source-out guardrails.
5. **Measure generator- and corruption-specific operating costs.** Publish
   per-source false-negative rates and per-corruption false-positive rates so a
   deployment can select a threshold from explicit error costs rather than one
   aggregate metric.
6. **Add independently sourced external benchmarks.** Prefer datasets with
   generator, post-processing, and provenance metadata, while keeping all
   selection data separate from a final untouched test partition.

## Reproducibility and verification

All neural inference used or is configured to use Apple MPS. Score caches,
manifests, checkpoints, and public reports are checksum-bound; private image
identifiers, paths, fold assignments, and individual scores are excluded from
public artifacts. The V3 verifier independently reconstructs released scores,
confusion matrices, ROC-AUC, metric changes, McNemar tests, cluster-bootstrap
intervals, required counts, checkpoint hashes, runtime provenance, and privacy
rules without importing the V3 metric implementation.

Current local verification on 2026-08-29:

- 39 of 39 unit tests passed;
- dependency validation reported `No broken requirements found`;
- the existing 10,002-image audit completed successfully;
- the official 5,000-image COCO audit completed successfully;
- final V3 analysis remains blocked only by the missing exact 8,843-image
  organizer DALL·E Advanced source.

Exact V1 evidence is in `REPORT.md`; V2 methods and results are in
`EXPERIMENT_V2_REPORT.md`; V3 commands and protocol details are in
`../README.md`.
