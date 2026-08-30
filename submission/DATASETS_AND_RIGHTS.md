# Dataset attribution and rights inventory

Last reviewed: **2026-08-31**

## Release rule

This repository publishes aggregate metrics, protocols, hashes, and
documentation. It does **not** publish dataset pixels, private split rows,
local dataset paths, prompts, captions, or per-image protected-evaluation
scores. Access to a dataset is not the same as permission to redistribute it.

| Source | Role in evidence | Primary reference | Rights evidence found | Public-repository policy |
|---|---|---|---|---|
| CIFAKE | V1/V2 evaluation source | [Official Kaggle dataset page](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images) and [paper](https://arxiv.org/abs/2303.14126) | The publisher's dataset page declares MIT terms and requires citation of CIFAR-10 and CIFAKE. The real images derive from CIFAR-10 and the fake images were produced with Stable Diffusion 1.4. | Attribute the sources; do not mirror pixels from this repository. Recheck the current source page before any separate redistribution. |
| SID-Set | V1/V2 evaluation source | [Official SIDA repository](https://github.com/hzlsaber/SIDA) | The official repository provides access instructions, but no repository-level dataset license was located during this audit. Public download access alone is not a redistribution grant. | Treat pixels, captions, masks, and descriptions as non-redistributable unless the rights holder supplies explicit terms. |
| WildFake | V1/V2 evaluation source | [WildFake paper](https://arxiv.org/abs/2402.11843) | The paper is available under its publication license, but that does not automatically license the dataset. WildFake aggregates author-generated material and content from multiple datasets, model repositories, and community platforms; no single dataset-wide redistribution grant was located. | Cite the paper; do not mirror pixels or assume commercial redistribution rights. Review every upstream source before reuse outside evaluation. |
| COCO val2017 | Audited real-image side of planned V3 | [Official COCO site and terms](https://cocodataset.org/#termsofuse) | COCO annotations are published under CC BY 4.0; image rights follow the individual Flickr source licenses and are not replaced by the annotation license. | No COCO images or annotations are shipped here. Any future image redistribution requires per-image license review and attribution. |
| Organizer DALL-E Advanced set | Required fake-image side of V3 | [NTIRE 2026 challenge report](https://arxiv.org/abs/2604.11487) | The exact 8,843-image organizer-provided source is absent, and no redistribution authorization is available in this repository. | V3 remains blocked. Do not substitute another collection, publish pixels, or claim V3 results. |

## Protected evaluation boundary

- V1 final rows were held out from fitting and threshold selection.
- V2 is retrospective development analysis on V1 calibration rows, not new
  protected-final validation.
- V3 cannot run until the exact organizer source is obtained through an
  authorized channel.
- No protected labels or per-image scores may be used for training, feature
  selection, checkpoint choice, calibration, or threshold tuning.

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
