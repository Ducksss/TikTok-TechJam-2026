# Proposed clean-room four-expert retraining plan

> **PROPOSED / NOT RUN.** This document is a reproducible engineering plan. It did not produce the current Drive checkpoints, the current upstream Expert 4 weight, the selected three heads, or the TEST1 results. Do not convert estimates below into completed-work claims.

## 1. Goal

Replace the existing-detector dependency with a team-trained, auditable system that:

- remains below the 2B whole-model limit;
- starts only from organizer-approved general-purpose vision backbones or from random initialization—not existing AIGC detector weights;
- trains only on the strict commercial allowlist in [`DATA_RIGHTS.md`](DATA_RIGHTS.md);
- separates global, local, spectral and corruption-stability evidence;
- freezes all model choices before a new source/generator-disjoint audit; and
- publishes hashes, data receipts, commands and logs sufficient to establish what was actually run.

The plan takes inspiration from attributed multi-expert and distillation
literature while using a new data manifest, new initialization provenance, new
expert objectives, and an independent fusion/evaluation contract. The resulting
checkpoints become project-trained only after this plan is executed and logged.

## 2. Parameter envelope

A practical upper-bound design is two approximately 304M-parameter global vision transformers plus two approximately 428.5M-parameter high-capacity vision transformers:

```text
2 × 304M + 2 × 428.5M ≈ 1.465B backbone parameters
+ expert heads, fusion gate and calibration < 5M
= approximately 1.47B loaded parameters
```

The exact parameter count must be computed from the instantiated graph. A model is not declared compliant from checkpoint file size. If an initialization checkpoint's licence or pretraining data cannot be cleared, replace it or initialize that expert from scratch.

## 3. Four deliberately different experts

| Expert | Input emphasis | Learning target | Shortcut to avoid |
|---|---|---|---|
| E1 — global provenance | full image, semantic pairing | content-agnostic real/generated separation across held-out generators | scene category predicts class |
| E2 — local edit | source-disjoint patches and full image | partial inpainting, object replacement and local inconsistency through multiple-instance learning | one small watermark predicts fake |
| E3 — spectral/residual | RGB plus deterministic residual/DCT views | demosaicing, frequency and synthesis residuals that survive codec changes | native JPEG/PNG container predicts class |
| E4 — corruption stability | paired clean and platform-damaged views | invariant ranking under JPEG, blur, resize, noise, colour and crop | transform family or severity predicts class |

Complementarity is an acceptance criterion. If two experts' error vectors are nearly identical on internal audits, one is removed rather than kept for appearance.

## 4. Commercial-only training manifest

### Target scale

The first H200 run should target **300,000 source identities** as a proposal, not a claim:

- 150,000 real/photographic sources; and
- 150,000 generated or AI-edited sources.

Recommended real pool:

- public-domain/CC0 rows from [PD12M](https://huggingface.co/datasets/Spawning/PD12M);
- item-verified CC BY Open Images rows with complete attribution; and
- item-verified CC0/CC BY iNaturalist or Wikimedia rows only where the exact file receipt survives the strict gate.

Recommended generated pool:

- pinned CC0 DiffusionDB rows;
- permissively licensed dataset rows whose image-data and upstream generator terms are both documented; and
- newly generated pairs from approved generator checkpoints, using rights-cleared real-image captions/prompts and recorded model revisions, seeds and inputs.

CC12M/CommonPool URL membership alone is insufficient. NC, research-only, unknown and output-ambiguous rows are excluded before sampling.

### Pairing and splits

Real source `r_i` produces a detailed caption and a shorter generation prompt only through an approved captioning route. Generated partners share semantics but not pixels. This reduces the chance that “mountains are real” and “fantasy portraits are fake” becomes the task.

Group splitting happens before view generation:

```text
train / development / calibration / locked audit = 75 / 10 / 5 / 10
```

No source identity, near-duplicate cluster, prompt family or generator revision crosses groups. At least 20% of generator families are held out from all gradients. A separate modern-generator audit stays sealed until the model and threshold are frozen.

## 5. Symmetric corruption curriculum

Every source receives a clean anchor and deterministic counterfactual views. Both labels draw from the same recipe distribution.

### Stage A — isolated families

- JPEG quality 95–30;
- blur sigma 0.3–2.5;
- down/up-sampling 0.75–0.20;
- Gaussian/Poisson noise at matched perceptual magnitudes;
- colour/exposure/gamma changes; and
- crop/reframe retaining 95–60%.

### Stage B — ordered composites

Sample 2–5 distinct families with order logged. Matched terminal codecs remove source-format leakage. Compression-before-resize and compression-after-resize are treated as different platform paths.

### Stage C — hard forensic damage

Only after Stage B gates pass: neural codecs, symmetric watermark insertion/removal, screenshot/display simulation and watermark-erasing attacks. A watermark operation is applied to both real and generated images; it never supplies the label.

Curriculum promotion is risk-based: promote the weakest family/severity, not the most visually dramatic augmentation. Candidate selection uses minimum AUC across clean and corruption families, plus class-specific FPR/FNR gates.

## 6. Training objectives

For expert `k`, optimize:

```text
L_k = L_binary
    + lambda_consistency × L(clean, corrupt)
    + lambda_rank × L_pairwise_rank
    + lambda_domain × L_generator/source_adversarial
    + lambda_cal × L_calibration
```

E2 adds a patch multiple-instance/localization term; E3 adds cross-codec residual consistency; E4 gives extra weight to the current worst corruption family. Class-balanced source batches prevent the number of augmented views from changing effective class prevalence.

After experts converge, train a tiny fusion model on frozen expert margins using only the calibration-development partition. Distil the fused decision into a compact student only if the student passes per-domain and per-corruption regression gates. Distillation is not evidence of success until its frozen audit exists.

## 7. H200 execution plan

### Hardware profile

- four H200 141GB GPUs, one primary expert per GPU during independent training;
- BF16 autocast, activation checkpointing only if required;
- deterministic source sampler and persisted view seeds;
- sharded, sequentially readable training data; and
- validation on source identities, never individual augmented rows.

### Phases

| Phase | Work | Exit condition |
|---|---|---|
| 0. Rights freeze | build green manifest and attribution package | zero unresolved/NC rows |
| 1. 2k-step pilot | measure throughput, memory and loss stability for every expert | no OOM/NaN; logs and checkpoint hashes present |
| 2. Independent experts | train each expert with source-held-out development | clean + worst-family gates pass |
| 3. Complementarity audit | compare error vectors and held-out generators | each retained expert contributes independent lift |
| 4. Fusion | fit gate/stacker without opening locked audit | formula and threshold frozen |
| 5. Locked audit | one reporting-only evaluation | integrity report and full confusion/ROC/PR/calibration metrics |

Wall-time and cost are deliberately not asserted here. Throughput depends on resolution, backbone, sharding and optimizer state. The 2,000-step pilot must write measured images/second, peak VRAM and projected GPU-hours before the full run is authorized.

## 8. FP/FN-aware acceptance gates

One universal threshold cannot serve every TikTok action.

### Auto-action / provenance-check tier

- optimize `TPR @ FPR <= 1%` and `TPR @ FPR <= 5%`;
- a new real-image false positive on the untouched audit can veto a marginal recall gain; and
- the detector triggers review/provenance checks, not an automatic public accusation.

### Soft-review tier

- lower threshold to improve tamper recall;
- no user-facing penalty from this tier alone; and
- monitor per-generator and per-real-source alert rates.

Every promotion report includes ROC-AUC, AP, TPR@1%/5% FPR, EER, confusion matrix, recall, specificity, F1, MCC, calibration and clean-to-corruption deltas. “Higher AUC” cannot hide a harmful operating point.

## 9. Minimum evidence package

A completed run must contain:

- immutable train/dev/calibration/audit manifests and licence snapshots;
- initialization model cards, licences and SHA-256 hashes;
- source code commit, full configuration and environment lock;
- per-step logs, GPU type, measured GPU-hours and failure/restart records;
- every expert checkpoint plus independent and fused audit metrics;
- rejected-candidate ledger and predeclared promotion gates;
- exact parameter count and measured inference latency/VRAM; and
- a statement that the hidden TikTok test was not used unless the organizer supplies an official score.

Until those files exist, this remains a proposal. The four weights already in Drive remain upstream research checkpoints and are not evidence that this H200 plan was run.
