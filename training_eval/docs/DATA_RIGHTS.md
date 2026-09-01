# Data rights and commercial-use gate

**Status date:** 1 September 2026
**Scope:** training eligibility for a commercially deployable SynthFlag model
**Rule:** public availability is not a licence, and a dataset-level licence is not automatically a licence to every linked pixel.

This is an engineering rights gate, not legal advice. A sample enters a commercial training run only when its manifest row identifies the exact bytes, source page, creator where applicable, licence, licence evidence, retrieval time, and required attribution. Unknown, non-commercial, research-only, or model-output-ambiguous samples fail closed.

## 1. Claim boundary

The current TEST1 detector is a project release backed by a collaborator
rights-clearance attestation accepted by the project owner. That accepted
attestation is the release decision for project use; it is not an independent
item-by-item license audit:

- its frozen image encoder is the released upstream `Expert_4_siglip.pth` AIGC-detector checkpoint, not a checkpoint trained by this team;
- the 25,000-source head-adaptation pool contains a 9,311-image Open Images bulk tranche with source-level licence assertions but without item-by-item licence verification; and
- some generated-image sources have a dataset-level permissive licence while retaining upstream generator-output caveats.

The current project heads may be released under that accepted attestation. They
must not be described as independently license-audited or as a clean-room
retrain. The stricter green-row run below remains an optional commercial-audit
hardening path. Written organizer clearance for the external Expert 4
dependency remains a separate question.

## 2. Strict admission policy

### Green: admissible when the row-level receipt is complete

| Material | Commercial condition | Required evidence |
|---|---|---|
| Public-domain or CC0 pixels | No copyright restriction asserted by the source; other rights can still apply | Pixel hash, source page, licence/declaration URL and snapshot |
| CC BY pixels | Commercial reuse is permitted if attribution and licence conditions are met | Creator, title where supplied, source URL, exact CC BY version, attribution text and snapshot |
| Team-generated pixels | Both generator checkpoint and generation service/terms permit the intended commercial use; prompts and conditioning inputs are also cleared | Model ID and revision, full licence snapshot, prompt/input provenance, seed, output hash |
| Permissively licensed generated dataset | Dataset licence explicitly covers the image data, not just code or annotations, and upstream model-output terms do not conflict | Dataset version, licence snapshot, generator family/revision, pixel hash |

CC BY-SA is commercially usable in principle, but transformed training views can create share-alike compliance questions. This project therefore treats CC BY-SA as **legal-review required**, not green by default. CC BY-ND is excluded because the augmentation pipeline creates modified copies.

### Red: excluded from commercial training

- CC BY-NC, CC BY-NC-SA, research-only or non-commercial material;
- all-rights-reserved, unknown, missing or conflicting licences;
- URL indexes whose publisher says it does not own the linked images;
- a metadata licence presented as if it licensed the linked pixels;
- model outputs when only the code, dataset organization or annotations are permissively licensed;
- evaluation suites once designated as held out, even if their licence could otherwise permit training; and
- any sample without a durable row-level receipt.

## 3. What the 25,000-source experimental pool actually contained

The following counts are provenance, **not a blanket commercial-clearance claim**.

### Real / non-AIGC: 12,500

| Source | Selected | Commercial gate | Decision for a clean retrain |
|---|---:|---|---|
| Open Images V7 bulk validation tranche | 9,311 | Open Images lists images as CC BY 2.0 but explicitly says users should verify each image. These rows retained creator/source metadata but recorded that item-level verification was not performed. | **Exclude until reverified per image.** |
| Open Images item-audited tranche | 2,566 | Rows retained image ID, creator, landing page and CC BY 2.0 evidence. | **Conditional green** with attribution export and licence recheck at freeze time. |
| iNaturalist | 620 | iNaturalist media is individually licensed; its default is CC BY-NC. The acquired candidate manifest contained only CC0 or CC BY rows, but the selected 620 must be joined back to those receipts. | **Conditional green only for confirmed CC0/CC BY rows.** Never treat iNaturalist as blanket-cleared. |
| Wikimedia Commons | 3 | Each file carries its own licence and attribution requirements. | **Conditional green** for the three receipt-pinned CC BY 2.0 files; otherwise exclude. |

Official evidence:

- [Open Images V7 licence statement and image metadata schema](https://storage.googleapis.com/openimages/web/download_v7.html)
- [Open Images V7 description and verification warning](https://storage.googleapis.com/openimages/web/factsfigures_v7.html)
- [iNaturalist media-licensing help](https://help.inaturalist.org/en/support/solutions/articles/151000169918)
- [Wikimedia Commons licensing policy](https://commons.wikimedia.org/wiki/Commons:Licensing)

### AI-generated / AIGC: 12,500

| Source | Selected | Recorded source licence | Strict decision |
|---|---:|---|---|
| DiffusionDB 2M | 6,581 | CC0 1.0; the dataset card states that the image dataset is available under CC0 | **Green with pinned dataset revision and content/safety filtering.** |
| DGM-Eval generated release | 3,014 | Repository states that its data and code are MIT | **Conditional green by generator family.** Retain only rows whose upstream checkpoint/output terms were separately cleared; NC families remain excluded. |
| X-AIGD | 1,918 | Dataset card marked CC BY 4.0 | **Conditional green** with attribution, pinned revision and generator-output provenance. A Hub licence tag alone is not a substitute for a retained licence snapshot. |
| TIGAS BigGAN fallback | 986 | Dataset package marked MIT, while its own card distinguishes dataset organization from individual generator outputs | **Amber / exclude from the strict run** until output rights and the exact BigGAN checkpoint lineage are documented. |
| AIGenImages2026 | 1 | Acquisition record marked CC BY 4.0 | **Conditional green** only after its exact official dataset revision and attribution record are preserved. One row has no meaningful coverage value. |

Official evidence:

- [DiffusionDB dataset card and CC0 statement](https://huggingface.co/datasets/poloclub/diffusiondb)
- [DiffusionDB project repository](https://github.com/poloclub/diffusiondb)
- [DGM-Eval data-access and MIT statement](https://github.com/layer6ai-labs/dgm-eval)
- [X-AIGD dataset card](https://huggingface.co/datasets/Coxy7/X-AIGD)
- [TIGAS dataset card](https://huggingface.co/datasets/H1merka/TIGAS_dataset)
- [AIGenImages2026 official project repository](https://github.com/mever-team/WildFC)

The earlier acquisition plan correctly excluded GenImage and RQ-Transformer families with non-commercial terms. They remain excluded.

## 4. Sources that are not on the commercial allowlist

| Source | Why it is excluded from training |
|---|---|
| CC12M / Conceptual 12M | Its official repository distributes URL-caption pairs and states that the project does not own the images and cannot legally provide the pixels. A CC12M URL is not a commercial pixel licence. [Official repository](https://github.com/google-research-datasets/conceptual-12m) |
| DataComp CommonPool | The pool distributes web URL-text records/metadata. A licence on the index does not establish rights to every linked image. Admit only independently verified pixel records, never “CommonPool” as a blanket source. [Official project](https://github.com/mlfoundations/datacomp) |
| GenImage | CC BY-NC-SA terms are incompatible with the stated commercial-only rule. [Licence](https://github.com/GenImage-Dataset/GenImage/blob/main/License) |
| Community Forensics | Official distribution is research-purpose material with mixed upstream model terms. [Official download page](https://jespark.net/projects/2024/community_forensics/download_dataset.html) |
| RQ-Transformer outputs | The relevant released checkpoint terms include CC BY-NC-SA restrictions. [Official licence](https://github.com/kakaobrain/rq-vae-transformer/blob/main/LICENSE) |
| WildFake | Used only as a public development benchmark here. Its aggregate source families have heterogeneous underlying rights, and its test labels were inspected during development. |
| SID-Set | Used only as a public validation benchmark. It mixes Open Images-derived real pixels, generated images and tampered derivatives; no blanket commercial-training claim is made. [Paper](https://arxiv.org/abs/2412.04292) |
| CIFAKE | Its repository declares MIT, but SynthFlag deliberately keeps the sampled official test images out of general training. The low-resolution branch used CIFAKE train data and is disclosed as benchmark-aware. [Official repository](https://github.com/jordan-bird/CIFAKE-Real-and-AI-Generated-Synthetic-Images) |

Public evaluation is not commercial-training clearance. TEST1's CIFAKE, SID-Set and WildFake pixels remain evaluation-only in this repository.

## 5. Checkpoints are a separate rights gate

A commercial-data manifest does not clear a pretrained model. Before a new training run, record for every initialization checkpoint:

1. the exact checkpoint SHA-256 and download URL;
2. checkpoint licence and repository licence;
3. whether its pretraining-data terms satisfy the organizer's rule;
4. whether it is a general-purpose backbone or an existing AIGC detector; and
5. written competition approval where the distinction is uncertain.

The current `Expert_4_siglip.pth` is an upstream existing AIGC detector. Under the relayed Track 5 rule, it is not a safe competition submission dependency without explicit written clearance, regardless of its parameter count.

## 6. Required release artifacts

A future commercially eligible run must ship:

- `train_manifest.parquet` with one row per exact pixel source;
- `ATTRIBUTION.md` generated from all CC BY rows;
- immutable licence snapshots and SHA-256 receipts;
- `excluded_sources.csv` with fail-closed reasons;
- generator model, revision, licence, prompt/input, seed and output hash for self-generated pixels;
- source-identity/prompt/generator-disjoint split receipts; and
- a model card that identifies every starting checkpoint and distinguishes measured from proposed work.

If any row cannot satisfy that contract, drop it. Do not repair the narrative by changing the description of the source.
