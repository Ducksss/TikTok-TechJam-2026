# Third-party notices

Last reviewed: **2026-09-01**

The repository's [Apache License 2.0](../LICENSE) applies to original material
that the repository contributors are authorized to license. It does not replace
the terms below. Package installation downloads dependencies separately; those
packages remain under their own licenses.

## Runtime dependencies

| Package | Pinned version | Declared license | Primary license source |
|---|---:|---|---|
| PyTorch | `2.10.0` | BSD-3-Clause-style | [PyTorch LICENSE](https://github.com/pytorch/pytorch/blob/main/LICENSE) |
| torchvision | `0.25.0` | BSD-style | [torchvision LICENSE](https://github.com/pytorch/vision/blob/main/LICENSE) |
| Transformers | `5.3.0` | Apache-2.0 | [Transformers LICENSE](https://github.com/huggingface/transformers/blob/main/LICENSE) |
| Pillow | `12.1.0` | MIT-CMU | [Pillow LICENSE](https://github.com/python-pillow/Pillow/blob/main/LICENSE) |
| tqdm | `4.67.2` | MPL-2.0 AND MIT | [tqdm LICENCE](https://github.com/tqdm/tqdm/blob/master/LICENCE) |

Binary wheels may include additional notices for bundled native libraries.
Distributors of compiled environments must retain the notices supplied by each
wheel or source distribution.

## Model and checkpoint lineage

| Component | Evidence | Release treatment |
|---|---|---|
| Google SigLIP base model | The [`google/siglip-so400m-patch14-384` model card](https://huggingface.co/google/siglip-so400m-patch14-384) declares Apache-2.0 and identifies WebLI training. | Preserve attribution and the Apache-2.0 terms when redistributing covered base-model material. |
| Tu et al. `Expert_4_siglip.pth` | Architecture and hash are documented locally; the file is obtained from an authorized external source. No explicit fine-tuned-checkpoint redistribution license was located in the audited public materials. | Required by the selected graph, but not included in Git or the submission archive. Do not re-upload or bundle without permission. |
| Three SynthFlag residual heads | Project-trained head artifacts distributed as a separate bundle. The collaborator attests that the heads and their training inputs are rights-cleared, and the project owner accepts that attestation. | Not included in Git. Treat rights as teammate-attested rather than independently audited; this does not clear upstream Expert 4 redistribution or organizer eligibility. |
| Tu et al. method | [Technical report, arXiv:2603.21939](https://arxiv.org/abs/2603.21939) | Cite the authors; do not relabel the detector architecture or checkpoints as original SynthFlag research. |

## Source attribution

Earlier revisions incorporated Apache-2.0 source from the public repository
maintained by GitHub user `tzlkkk`. The current release retains that attribution
while excluding prohibited upstream source overlap. The selected runtime remains
checkpoint-compatible with Tu et al. Expert 4 and adds project-trained routed
residual heads.

## Publications

| Publication | Declared license | Release treatment |
|---|---|---|
| Detector technical report by Tu et al., arXiv:2603.21939v1 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) on the [versioned arXiv HTML](https://arxiv.org/html/2603.21939v1) | Referenced externally; no copy of the report or its figures is included in this repository. |
| “NTIRE 2026 Challenge on Robust AI-Generated Image Detection in the Wild,” arXiv:2604.11487v1 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) on the [versioned arXiv HTML](https://arxiv.org/html/2604.11487v1) | Referenced externally; no copy of the report or its figures is included in this repository. |

## Dataset and benchmark materials

No dataset pixels, TEST1 source identities or row-level predictions, or
protected row-level results are redistributed. Dataset attribution and rights
evidence are recorded in
[DATASETS_AND_RIGHTS.md](DATASETS_AND_RIGHTS.md).

## Project artwork

The SynthFlag wordmark and architecture diagram are project release assets.
The removed `competition.png` challenge-site screenshot was intentionally
excluded because it combined third-party photographs, event marks, and page
artwork without a documented redistribution grant.

Names and logos may be protected by trademark law even when a file is
otherwise distributed under an open-source license. No trademark clearance is
asserted by this notice.

## Interview evidence

The Day 3 call image and automated transcript were supplied by the SynthFlag
team. The public transcript is limited to the researcher interview and excludes
later internal team chatter. The accompanying summary is team-authored and does
not claim that Professor Ng Teck Khim endorsed SynthFlag or its results.

This technical audit did not independently verify publication, likeness, or
name-use permission from every depicted or named participant. Maintainers must
confirm the necessary consent before broader redistribution. The interview
evidence is not relicensed as model research or performance evidence by this
notice.

This notice summarizes public metadata and is not legal advice.
