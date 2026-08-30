<p align="center">
  <img src="assets/brand/synthflag-primary-wordmark.png" alt="SynthFlag" width="100%">
</p>

# SynthFlag

**SynthFlag** is the TikTok TechJam 2026 submission for detecting AI-generated
images in real-world collections. It packages the research-grade FeatDistill
four-expert detector into a reproducible inference workflow with protected
evaluation, checkpoint integrity checks, and submission-facing evidence.

FeatDistill remains the name of the underlying detector architecture and the
Python package. SynthFlag is the public product and submission name.

## Submission package

- [Submission overview](submission/README.md)
- [Benchmark table](submission/BENCHMARKS.md)
- [Architecture diagram and explanation](submission/ARCHITECTURE.md)
- [Exact reproduction commands](submission/REPRODUCE.md)
- [Artifact checksums](submission/ARTIFACTS.sha256)
- [Project status and worktree register](STATUS.md)

## Benchmark snapshot

The protected V1 final partition contains 7,998 images: 3,999 real and 3,999
fake. The recommended balanced operating point changes only the frozen decision
threshold; it does not retrain the detector or change its ranking.

| Configuration | ROC-AUC | Balanced accuracy | F1 | Fake recall | Precision | Specificity |
|---|---:|---:|---:|---:|---:|---:|
| Released mean, threshold 0.5 | 0.8505 | 0.7763 | 0.7259 | 0.5924 | 0.9371 | 0.9602 |
| **SynthFlag balanced point, threshold 0.2874746155** | **0.8505** | **0.8061** | **0.7861** | **0.7127** | 0.8764 | 0.8995 |

The complete table separates protected V1 results, retrospective V2
development evidence, and blocked V3 fields. See
[submission/BENCHMARKS.md](submission/BENCHMARKS.md) for the evidence boundary
and unavailable values.

## How it works

![SynthFlag architecture: four FeatDistill experts merged into one fake-image score](submission/ARCHITECTURE.svg)

Two CLIP experts process 224 px inputs and two SigLIP experts process 384 px
inputs. Each returns a fake-image probability. The released inference path
averages the four probabilities into a single score from 0 to 1. SynthFlag's
balanced operating point applies the calibration-frozen threshold
`0.2874746155` to that unchanged score.

## Quick start

Python 3.10 or newer is required. When using CUDA, install a PyTorch build that
matches the local driver.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

Download the four released expert checkpoints and place them directly in
`weights/`. Their expected sizes and SHA-256 digests are recorded in
[`weights/manifest.json`](weights/manifest.json).

```bash
python -m infer \
  --images-dir /path/to/images \
  --out-dir outputs/predictions \
  --weights-dir weights \
  --device auto
```

The command recursively reads JPEG, PNG, BMP, WebP, and TIFF images and writes
`predictions.csv` plus `predictions.meta.json`. Runs are resumable; an exclusive
output lock prevents concurrent writers from corrupting the CSV.

## Demo

[Open the live SynthFlag landing page](https://synthflag.chaipinzheng353496.chatgpt.site/).
An unauthenticated production request was verified to return HTTP 200 with the
SynthFlag title, metadata, method, evidence, and responsible-use content. The
hosted page is an explanatory submission demo rather than a browser inference
upload form; executable inference is provided by the local CLI above.

## Reproduce the evidence

The full benchmark commands, environment checks, expected inputs, verification
steps, and evidence limitations are in
[submission/REPRODUCE.md](submission/REPRODUCE.md). Dataset-derived rows,
individual scores, local paths, and protected data are intentionally excluded
from the public package.

## Research and responsibility

SynthFlag builds on FeatDistill, the UESTC solution for the NTIRE 2026
Challenge on Robust AI-Generated Image Detection in the Wild. The hackathon
integration, reproducibility layer, evidence package, and product presentation
are the submission work; the detector architecture and released checkpoints
must retain their upstream attribution.

A SynthFlag score is a signal, not conclusive proof of an image's origin.
Decisions with real consequences should include human review and supporting
evidence.

Please cite the challenge report when using the detector or checkpoints:

```bibtex
@inproceedings{gushchin2026ntire,
  title     = {NTIRE 2026 Challenge on Robust AI-Generated Image Detection in the Wild},
  author    = {Gushchin, Aleksandr and others},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition Workshops},
  pages     = {1895--1913},
  year      = {2026}
}
```

[arXiv:2604.11487](https://arxiv.org/abs/2604.11487) ·
[CVPR 2026 Open Access](https://openaccess.thecvf.com/CVPR2026_workshops/NTIRE)

Repository code is provided under the [Apache License 2.0](LICENSE). Upstream
model and checkpoint terms may impose additional requirements and should be
reviewed separately.
