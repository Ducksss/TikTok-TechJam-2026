# Day 3 research interview: Professor Ng Teck Khim

Interview role: **research input and future-work direction**

Sprint timing: **Day 3 — 31 August 2026**

Final-model status: **not used for the selected runtime or final benchmark claims**

![SynthFlag team video call with Professor Ng Teck Khim](../landing-page/public/interviews/prof-ng-teck-khim-day3.png)

The SynthFlag team interviewed Professor Ng Teck Khim on Day 3 of the
hackathon sprint. The conversation introduced a complementary, camera-forensics
way to think about synthetic-image detection: inspect the local statistics
created by physical color sensing and demosaicing rather than rely only on deep
semantic representations.

[Download the interview transcript](../landing-page/public/interviews/prof-ng-teck-khim-day3-transcript.txt).
The supplied transcript was generated automatically and contains recognition
errors. The public copy preserves the 09:00–09:24 interview through Professor
Ng's final goodbye and excludes later internal team chatter because it is not
part of the researcher interview.

## What we learned

### 1. Real cameras create structured local statistics

A camera sensor first measures intensity through a color-filter mosaic such as
a Bayer pattern. Each sensor location directly measures one color component;
the missing red, green, or blue values are estimated by demosaicing. Those
interpolated values can be locally smoother than directly sensed values. Local
variance and cross-channel relationships can therefore provide a forensic clue
about physical camera acquisition.

### 2. Manipulation can break acquisition consistency

Cut-and-paste edits may disrupt the spatial alignment or consistency of a
camera's mosaic-derived statistics. This suggests a future manipulation probe
that examines small blocks for inconsistent local variance, channel
correlation, and phase rather than trying to reverse the original demosaicing
process.

### 3. The clue is fragile under post-processing

Gaussian blur and related transformations smooth both directly sensed and
interpolated values, weakening the distinction. Resize, compression, crop,
display capture, and other platform operations should therefore be explicit
stress slices in any future evaluation.

### 4. Detection and generation are a moving target

An informed generator or post-processor could deliberately inject
camera-like/Bayer-like statistics after synthesis. The interview framed this as
an ongoing attacker–detector cycle: a forensic clue is useful evidence, not a
permanent guarantee.

### 5. Comparisons need the same data and metric

Professor Ng emphasized that methods cannot be compared fairly across different
datasets. ROC-AUC is often chosen because it supports comparison with prior
papers, but one metric does not capture every operational concern. For
SynthFlag's TikTok-like creator workflow, low-FPR operating points and the
consequences of an incorrect flag remain essential alongside ranking metrics.

## What we explored during the sprint

The interview arrived on Day 3, leaving only a short window for a local-camera-
statistics prototype. We explored small-block variance and cross-channel
correlation as possible complementary signals, with Bayer sampling and
demosaicing as the motivating mechanism.

The early prototype was not strong or stable enough to support a final model
claim. The team did not have enough time to establish a source-disjoint
protocol, robust baselines, corruption behavior, confidence intervals, or a
reliable low-FPR operating point. We therefore did **not** use this line in the
selected Expert 4 plus three-head inference path, TEST1 headline results, or
final model selection. No performance number is claimed here.

That negative result is part of the evidence trail: an interesting mechanism
and a researcher interview can motivate a study, but they do not substitute for
a completed benchmark.

## Future research plan

1. **Implement an auditable camera-statistics baseline.** Measure block-level
   variance, cross-channel correlations, mosaic phase consistency, and
   residuals after simple demosaicing hypotheses.
2. **Use source-disjoint data and identical comparisons.** Evaluate deep,
   statistical, and hybrid methods on the same images, splits, distortions, and
   metrics.
3. **Stress the physical clue.** Test blur, resize, JPEG, screenshots, crop,
   denoising, color processing, and deliberate Bayer-statistic injection.
4. **Treat it as a complementary expert.** Explore whether a small forensic
   signal improves abstention or human-review prioritization without learning
   dataset identity.
5. **Optimize for creator-platform costs.** Select a consequential threshold to
   meet a validated low-FPR cap first, then reduce false negatives within that
   constraint; keep human review and appeals.
6. **Report failure as carefully as success.** Publish confidence intervals,
   per-source results, decision flips, and cases where the camera clue is absent
   or adversarially imitated.

## Evidence boundary

- The photo and transcript document that the interview occurred; they are not
  model-performance evidence.
- Technical points above are a concise team-authored interpretation of the
  supplied automated transcript, not a verbatim research paper or endorsement
  by Professor Ng.
- The local-statistics direction remains future work. It is not implemented in
  `infer/`, `service/`, or the website scoring path.
- The interview photo was supplied by the team for this repository. Publication
  permission from every depicted participant was not independently verified by
  this technical audit; maintainers should confirm it before broader reuse.

## Source identity

| Artifact | SHA-256 |
|---|---|
| Team-supplied call image | `07531442b62fa08877f1a49bcca4843561cbdcde4987828a641cdb5e4f4d63f7` |
| Public interview-only transcript | `f9ee9774fcf773fa13f81a3d71fab32be94db1504c8438d4a94bcb7a7fe879e5` |
| Original supplied transcript | `f9e008fb62e92a41e680d82a71b996339fff1d45fb0b9eb940ab7813b99def70` |
