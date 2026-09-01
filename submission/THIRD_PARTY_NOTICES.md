# Third-party notices

Last reviewed: **2026-08-31**

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
| FeatDistill `Expert_4_siglip.pth` | Architecture and hash are documented locally; the file is obtained from the authors' external checkpoint release. No explicit fine-tuned-checkpoint redistribution license was located in the audited public materials. | Required by the selected graph, but not included in Git or the submission archive. Do not re-upload or bundle without permission. |
| Three SynthFlag residual heads | Project-trained head artifacts distributed as a separate bundle. The collaborator attests that the heads and their training inputs are rights-cleared, and the project owner accepts that attestation. | Not included in Git. Treat rights as teammate-attested rather than independently audited; this does not clear upstream Expert 4 redistribution or organizer eligibility. |
| FeatDistill method | [Technical report, arXiv:2603.21939](https://arxiv.org/abs/2603.21939) | Cite the authors; do not relabel the detector architecture or checkpoints as original SynthFlag research. |

## Historical source lineage

The repository root commit contained a source snapshot matching 20 of 21 files
from [`tzlkkk/FeatDistill`](https://github.com/tzlkkk/FeatDistill) commit
`6feb63ef12a3bd38c8d7ade98183c5f727a0c62d`. The two repositories have separate
Git ancestry, but the identical-file evidence establishes copying. That
historical source is covered by the upstream Apache License 2.0 and remains
attributed in the root [`NOTICE`](../NOTICE).

The current inference and artifact runtime is independently reorganized and
rewritten. It remains checkpoint-compatible with the published FeatDistill
method and is not described as a clean-room implementation. See the complete
[implementation provenance record](../docs/IMPLEMENTATION_PROVENANCE.md).

## Publications

| Publication | Declared license | Release treatment |
|---|---|---|
| “FeatDistill: A Feature Distillation Enhanced Multi-Expert Ensemble Framework for Robust AI-generated Image Detection,” arXiv:2603.21939v1 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) on the [versioned arXiv HTML](https://arxiv.org/html/2603.21939v1) | A versioned HTML snapshot, its referenced paper figures, and a modified plain-text extraction are included under CC BY 4.0 with source, full author list, version, change, and license attribution in `docs/references/featdistill-report/README.md`. They are not relicensed under Apache-2.0. |
| “NTIRE 2026 Challenge on Robust AI-Generated Image Detection in the Wild,” arXiv:2604.11487v1 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) on the [versioned arXiv HTML](https://arxiv.org/html/2604.11487v1) | A versioned HTML snapshot, its referenced paper figures, and a modified plain-text extraction are included under CC BY 4.0 with source, author, version, change, and license attribution in `docs/references/ntire-2026-report/README.md`. They are not relicensed under Apache-2.0. |

## Dataset and benchmark materials

No dataset pixels or protected row-level results are redistributed. Dataset
attribution and rights evidence are recorded in
[DATASETS_AND_RIGHTS.md](DATASETS_AND_RIGHTS.md).

## Project artwork

The SynthFlag wordmark and architecture diagram are project release assets.
The removed `competition.png` challenge-site screenshot was intentionally
excluded because it combined third-party photographs, event marks, and page
artwork without a documented redistribution grant.

Names and logos may be protected by trademark law even when a file is
otherwise distributed under an open-source license. No trademark clearance is
asserted by this notice.

This notice summarizes public metadata and is not legal advice.
