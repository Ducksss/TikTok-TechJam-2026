# Dataset attribution and rights inventory

Last reviewed: **2026-09-01**

## Release rule

This repository publishes aggregate metrics, protocols, hashes, and
documentation. It does **not** publish dataset pixels, private split rows,
local dataset paths, prompts, captions, or per-image protected-evaluation
scores. Access to a dataset is not the same as permission to redistribute it.

| Source | Role in evidence | Primary reference | Rights evidence found | Public-repository policy |
|---|---|---|---|---|
| CIFAKE | TEST1 evaluation and low-resolution-head train source | [Official Kaggle dataset page](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images) and [paper](https://arxiv.org/abs/2303.14126) | The publisher's dataset page declares MIT terms and requires citation of CIFAR-10 and CIFAKE. The real images derive from CIFAR-10 and the fake images were produced with Stable Diffusion 1.4. | Do not mirror pixels. The official test subset remains evaluation-only; the train-derived specialist and its benchmark-aware route must be disclosed. |
| SID-Set | TEST1 public-validation evaluation | [Official SIDA repository](https://github.com/hzlsaber/SIDA) | The official repository provides access instructions, but no repository-level dataset license was located during this audit. Public download access alone is not a redistribution grant. | Treat pixels, captions, masks, and descriptions as non-redistributable unless the rights holder supplies explicit terms. |
| WildFake | TEST1 official-test metadata sample | [WildFake paper](https://arxiv.org/abs/2402.11843) | The paper is available under its publication license, but that does not automatically license the dataset. WildFake aggregates content with heterogeneous rights; no dataset-wide redistribution grant was located. | Evaluation only. Cite the paper; do not mirror pixels or assume commercial redistribution rights. |
| COCO val2017 | Audited real-image side of planned V3 | [Official COCO site and terms](https://cocodataset.org/#termsofuse) | COCO annotations are published under CC BY 4.0; image rights follow the individual Flickr source licenses and are not replaced by the annotation license. | No COCO images or annotations are shipped here. Any future image redistribution requires per-image license review and attribution. |
| Organizer DALL-E Advanced set | Required fake-image side of V3 | [NTIRE 2026 challenge report](https://arxiv.org/abs/2604.11487) | The exact 8,843-image organizer-provided source is absent, and no redistribution authorization is available in this repository. | V3 remains blocked. Do not substitute another collection, publish pixels, or claim V3 results. |

## Protected evaluation boundary

- TEST1 public suites were inspected during development and are not a pristine
  blind holdout. The reporting pass performs no fitting.
- The CIFAKE test subset is not used to train the specialist head, but native
  resolution nearly identifies that dataset in TEST1.
- V1 final rows were held out from fitting and threshold selection.
- V2 is retrospective development analysis on V1 calibration rows, not new
  protected-final validation.
- V3 cannot run until the exact organizer source is obtained through an
  authorized channel.
- No protected labels or per-image scores may be used for training, feature
  selection, checkpoint choice, calibration, or threshold tuning.

## Selected-head commercial gate

The current residual heads are research artifacts, not commercially cleared.
The large-image training lineage includes:

- a 9,311-image Open Images bulk tranche with source-level CC BY assertions but
  without item-by-item verification; and
- 986 precomputed guided-diffusion/BigGAN sample pixels without an explicit
  data-specific license, 682 of which entered the gradient split.

A rights-clean release must reverify or replace every unresolved row, export
required attribution, retrain the affected heads, rerun an untouched audit, and
issue new hashes. Expert 4 is a separate checkpoint rights/eligibility gate;
clearing training pixels does not clear the upstream fine-tune.

## Requirements for any future public dataset artifact

Before adding pixels, prompts, captions, or row-level metadata, record:

1. canonical source URL, version, and retrieval date;
2. copyright holder or source owner;
3. exact license or written permission, including commercial-use status;
4. required attribution and share-alike obligations;
5. allowed redistribution scope for images and annotations separately;
6. generator/model terms for synthetic images;
7. consent, privacy, biometric, and sensitive-content considerations;
8. hashes, duplicate/overlap checks, and protected-split isolation;
9. the complete omit-source registry; and
10. a takedown/contact procedure.

If any field is unclear, publish only non-sensitive aggregate metadata and keep
the underlying artifact out of Git.

This inventory is a technical provenance record, not legal advice.
