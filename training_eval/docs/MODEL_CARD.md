# SynthFlag corrected-v2 — model card

**Status:** frozen TEST1 research baseline
**Date:** 1 September 2026
**Task:** binary ranking of real/non-AIGC (`0`) versus AI-generated or AI-tampered (`1`) images
**Competition test:** not accessed
**Commercial/competition eligibility:** not established

## 1. What this model is

The canonical TEST1 detector is a **single frozen upstream image encoder plus three project-trained lightweight heads and a deterministic two-route policy**. It is not the upstream four-expert ensemble, and the team did not train the upstream Expert 4 checkpoint.

```text
RGB image
   │
   ├── record native longest side
   │
   └── frozen upstream Expert 4 / SigLIP feature encoder
          └── 1,152-D pooled feature + teacher margin
                  │
                  ├── longest side <= 64 px
                  │      └── CIFAKE-specialist residual head, alpha 1.25
                  │
                  └── longest side > 64 px
                         └── 0.65 × epoch-05 head margin
                           + 0.35 × epoch-08 head margin
                                  └── fixed margin boundary -1.557959395647049
```

The three stored heads share the family:

```text
LayerNorm(1152) → Linear(1152, 256) → GELU → Dropout → Linear(256, 1)
```

The final scalar is a correction to the frozen teacher's two-class margin; it is not a new two-logit classifier. Each head has 297,729 parameters. The general heads used dropout `0.2`; the selected CIFAKE specialist profile used dropout `0.1`.

## 2. Exact artifacts

| Component | Role | SHA-256 |
|---|---|---|
| `Expert_4_siglip.pth` | Frozen upstream feature encoder and teacher logits | `a7d2297e7fecace8ae95d8bbdca023b697cc395d7fde0d1bd90b23d0cf130ff4` |
| CIFAKE router head | Native longest side `<=64`, residual alpha `1.25` | `2f52d2de29c6db966712f5d2ed0c7b321b680b3d3c583d41164380d71cce0f4e` |
| Epoch-05 general head | 65% of the large-image margin | `fa30e2f93bec233dbcc459e342b9f1970e32789c8d5d796ba3df20ff15e63029` |
| Epoch-08 general head | 35% of the large-image margin | `e4fbaab083f3c7f12b88848d7870817ecc5c603a95d1deab8e8aafee9aea7c1e` |

Loaded parameter count:

- frozen Expert 4: `428,521,282`;
- three stored heads: `893,187`; and
- total: **`429,414,469`**, below the 2B technical ceiling.

Being below 2B does not resolve the separate rule against using an existing AIGC detector.

## 3. Provenance and ownership

### Upstream research work

The externally attributed Expert 4 architecture/checkpoint supplies the frozen
representation. That encoder and its original detector training are dependency
work; the project contribution is the trained residual heads and full
development/evaluation stack below.

### SynthFlag work represented by these artifacts

- acquisition and provenance manifests for a balanced 25,000-source adaptation pool;
- deterministic clean/mild/medium/hard view construction;
- frozen-feature caching and teacher-logit caching;
- training, replay and audit of the small residual heads;
- a native-resolution router and fixed two-head margin stack;
- regression gates, rejected-candidate records and patch-branch audit;
- TEST1's paired robustness harness, integrity receipts, metrics and report; and
- the judge-facing product and documentation.

The head checkpoints are project-trained adaptations over upstream Expert 4 features. They do not convert Expert 4 into a clean-room model.

## 4. Head training and selection

### General branch

The general-head trajectory was replayed deterministically over the internal `prepared_v1` feature cache:

| Internal split | Source identities |
|---|---:|
| Train | 18,925 |
| Development | 3,012 |
| Calibration | 1,017 |

The source pool was balanced before splitting at 12,500 real and 12,500 generated images. Each source had deterministic clean and corruption views. Epoch-05 was the development-best pure epoch; epoch-08 was the combined-internal-best pure epoch. Their final `0.65 / 0.35` margin stack and fixed boundary were frozen before the corrected reporting pass.

No TEST1 labels were used for gradients in this replay. The public suites had been inspected in earlier development, so TEST1 is a reproducible development diagnostic, not a pristine blind holdout.

### Low-resolution branch

The CIFAKE specialist was trained on the official CIFAKE **train** split with source-disjoint internal development selection. Its selected profile used hidden width `256`, dropout `0.1`, learning rate `0.001`, and epoch `11`. It is activated by native longest side `<=64`.

This rule sends all TEST1 CIFAKE images and none of the SID/WildFake images to the low-resolution branch. It therefore encodes benchmark/domain knowledge and must not be presented as unknown-domain routing proof.

### Rejected components

- A stronger augmentation-trained v3 residual head improved internal worst-view AUC but was rejected after CIFAKE and SID regression gates moved backward.
- Patch-MIL v2 improved its localized internal slice but created new false positives on its untouched audit. It is frozen as a no-op and is absent from the selected graph.

## 5. Canonical TEST1 results

TEST1 used 15,000 unique public images and 30,000 aligned clean/augmented predictions. Threshold metrics used a fixed reported probability threshold of `0.5`.

| Dataset | View | ROC-AUC | AP | Recall | Specificity | F1 | MCC | FN | FP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CIFAKE | Clean | 0.9816 | 0.9823 | 0.9548 | 0.8848 | 0.9225 | 0.8417 | 113 | 288 |
| CIFAKE | Augmented | 0.9095 | 0.9148 | 0.8448 | 0.8004 | 0.8265 | 0.6458 | 388 | 499 |
| SID-Set | Clean | 0.8691 | 0.9018 | 0.5824 | 0.9928 | 0.7328 | 0.6308 | 1,044 | 18 |
| SID-Set | Augmented | 0.8439 | 0.8845 | 0.5848 | 0.9768 | 0.7274 | 0.6105 | 1,038 | 58 |
| WildFake | Clean | 0.9467 | 0.9472 | 0.8912 | 0.8736 | 0.8834 | 0.7649 | 272 | 316 |
| WildFake | Augmented | 0.8785 | 0.8760 | 0.8972 | 0.6556 | 0.8005 | 0.5697 | 257 | 861 |

Descriptive macro ROC-AUC was `0.9324` clean and `0.8773` augmented. Full evidence is in [`TEST1_BENCHMARK_REPORT.md`](../benchmarks/test1/TEST1_BENCHMARK_REPORT.md).

## 6. Intended use and FP/FN policy

SynthFlag outputs a score for **triage**, not proof of authorship and not an automatic accusation.

For TikTok-like creator ecosystems, a false positive can incorrectly question authentic work, interrupt distribution or monetization, and create costly appeals. The recommended product policy is therefore action-tiered:

1. a strict low-FPR threshold may trigger provenance checks or human review, not automatic punishment;
2. a lower, higher-recall threshold may populate a soft-risk queue with no user-facing allegation; and
3. final action should combine the detector with provenance, watermark/credential signals and review context.

This policy does **not** claim the model globally minimizes false positives. TEST1 exposes both sides of the trade-off:

- SID clean is conservative: 18 FP, but 1,044 FN;
- WildFake augmented retains high AI recall but produces 861 FP; and
- lowering the SID threshold rescues local-tamper positives while quickly increasing false accusations.

The appropriate threshold must be calibrated on deployment-prevalence data with explicit error costs. The fixed TEST1 threshold is a benchmark convention, not a production setting.

## 7. Known limitations

- Existing-detector dependency may make the system ineligible under the relayed Track 5 rule.
- The current adaptation pool is not fully commercial-cleared; see [`DATA_RIGHTS.md`](DATA_RIGHTS.md).
- CIFAKE routing is benchmark-aware and nearly identified by native resolution.
- SID locally tampered images are often missed because a global pooled feature can dilute a small edited region.
- Composite corruption reduces CIFAKE and WildFake AUC, and augmented WildFake specificity is weak.
- TEST1 used public suites inspected during development and did not access TikTok's hidden test.
- The replay used integrity-verified cached Expert 4 features/logits; it was not an end-to-end latency or VRAM measurement.
- A probability is not a causal explanation and may be miscalibrated at real platform prevalence.

## 8. Required next step for an eligible submission

Train a new detector from organizer-approved general-purpose backbones or from scratch, using only the strict commercial allowlist, then freeze it before opening a new generator- and source-disjoint audit set. The proposed plan is documented in [`FOUR_EXPERT_RETRAINING_PLAN.md`](FOUR_EXPERT_RETRAINING_PLAN.md). It has not been executed and did not produce the current weights.
