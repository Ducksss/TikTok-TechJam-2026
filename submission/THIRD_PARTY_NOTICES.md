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
| NumPy (optional distortion extra) | `2.2.5` | BSD-3-Clause | [NumPy LICENSE](https://github.com/numpy/numpy/blob/main/LICENSE.txt) |
| SciPy (optional distortion extra) | `1.15.3` | BSD-3-Clause | [SciPy LICENSE](https://github.com/scipy/scipy/blob/main/LICENSE.txt) |
| Kornia (optional distortion extra) | `0.8.2` | Apache-2.0 | [Kornia LICENSE](https://github.com/kornia/kornia/blob/master/LICENSE) |

Binary wheels may include additional notices for bundled native libraries.
Distributors of compiled environments must retain the notices supplied by each
wheel or source distribution.

## Model and checkpoint lineage

| Component | Evidence | Release treatment |
|---|---|---|
| OpenAI CLIP implementation | The official [CLIP repository](https://github.com/openai/CLIP) declares MIT for its code. Its [ViT-L/14 model card](https://huggingface.co/openai/clip-vit-large-patch14) documents research-oriented use and deployment limitations. | Attribute OpenAI and follow the model card. The code license alone is not treated as proof that every derivative checkpoint is redistributable. |
| Google SigLIP base model | The [`google/siglip-so400m-patch14-384` model card](https://huggingface.co/google/siglip-so400m-patch14-384) declares Apache-2.0 and identifies WebLI training. | Preserve attribution and the Apache-2.0 terms when redistributing covered base-model material. |
| Four FeatDistill `Expert_*.pth` files | Architecture and hashes are documented locally; the files are obtained from an external mirror. No explicit fine-tuned-checkpoint redistribution license was located in the audited public materials. | Not included in Git or the submission archive. Do not re-upload or bundle without written permission from the checkpoint rights holder. |
| FeatDistill method | [Technical report, arXiv:2603.21939](https://arxiv.org/abs/2603.21939) | Cite the authors; do not relabel the detector architecture or checkpoints as original SynthFlag research. |

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
