<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/synthflag/17-dark-readme-hero.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/synthflag/16-light-readme-hero.png">
    <img src="assets/brand/synthflag/16-light-readme-hero.png" alt="SynthFlag — From pixels to evidence" width="100%">
  </picture>
</p>

<h1 align="center">SynthFlag</h1>

<p align="center">
  Robust AI-generated image detection with reproducible inference and evidence-aware reporting.<br>
  Built for the <strong>TikTok TechJam 2026 Hackathon</strong> on the FeatDistill four-expert detector.
</p>

<p align="center">
  <a href="https://synthflag.chaipinzheng353496.chatgpt.site/"><strong>Live demo</strong></a> ·
  <a href="https://synthflag.chaipinzheng353496.chatgpt.site/try">Try an image</a> ·
  <a href="https://synthflag.chaipinzheng353496.chatgpt.site/journey">Project journey</a> ·
  <a href="https://synthflag.chaipinzheng353496.chatgpt.site/documentation">Documentation</a> ·
  <a href="submission/BENCHMARKS.md">Benchmarks</a> ·
  <a href="submission/REPRODUCE.md">Reproduce</a>
</p>

<p align="center">
  <code>Python ≥ 3.10</code> · <code>Apache-2.0</code> · <code>CLIP + SigLIP</code> · <code>4-expert ensemble</code>
</p>

## Overview

**SynthFlag** packages the research-grade FeatDistill detector into a complete
TikTok TechJam workflow: checkpoint-verified batch inference, a public detector
experience, protected evaluation, and a submission package whose claims remain
traceable to their evidence.

SynthFlag is the public product, submission, Python distribution, and primary
CLI name. **FeatDistill** remains the name of the underlying UESTC detector
architecture, released checkpoints, and research lineage.

### Highlights

- **Four complementary experts:** two CLIP ViT-L/14 experts at 224 px and two
  SigLIP So400M Patch14-384 experts at 384 px.
- **Reliable batch inference:** recursive image discovery, resumable outputs,
  checkpoint integrity verification, and an exclusive writer lock.
- **Evidence before certainty:** benchmark, calibration, and deployment claims
  are separated; unavailable evidence stays unavailable instead of being
  inferred or filled in.
- **Product-ready surfaces:** Python API, CLI, optional FastAPI service, public
  landing page, image-upload experience, and technical documentation.

## Live demo

- [Open the SynthFlag landing page](https://synthflag.chaipinzheng353496.chatgpt.site/)
- [Try the image detector](https://synthflag.chaipinzheng353496.chatgpt.site/try)
- [Follow the project journey](https://synthflag.chaipinzheng353496.chatgpt.site/journey)
- [Read the visual documentation](https://synthflag.chaipinzheng353496.chatgpt.site/documentation)
- [Explore the deep architecture atlas](https://synthflag.chaipinzheng353496.chatgpt.site/documentation/architecture)

The hosted `/try` route provides the complete file-drop experience and reports
whether a checkpoint-backed model service is connected. It never fabricates a
score when the public worker is unavailable. Use the local service setup below
for executable checkpoint-backed scoring.

## Benchmark snapshot

The protected V1 final partition contains 7,998 images: 3,999 real and 3,999
fake. The recommended balanced operating point changes only the frozen decision
threshold; it does not retrain the detector or change its ranking.

| Configuration | ROC-AUC | Balanced accuracy | F1 | Fake recall | Precision | Specificity |
|---|---:|---:|---:|---:|---:|---:|
| Released mean, threshold 0.5 | 0.8505 | 0.7763 | 0.7259 | 0.5924 | 0.9371 | 0.9602 |
| **SynthFlag balanced point, threshold 0.2874746155** | **0.8505** | **0.8061** | **0.7861** | **0.7127** | 0.8764 | 0.8995 |

The complete [benchmark table](submission/BENCHMARKS.md) separates protected
V1 results, retrospective V2 development evidence, and blocked V3 fields. A
threshold change moves the operating point; it is not an architecture or
ranking improvement.

## Architecture

![SynthFlag architecture: four FeatDistill experts merged into one fake-image score](submission/ARCHITECTURE.svg)

Each expert returns a class-index-1 softmax probability. The released inference
path takes their exact unweighted arithmetic mean, producing one score from 0
to 1. SynthFlag's balanced operating point applies the calibration-frozen
threshold `0.2874746155` to that unchanged score.

Read the [architecture explanation](submission/ARCHITECTURE.md), follow the
[project and decision journey](https://synthflag.chaipinzheng353496.chatgpt.site/journey),
or explore the
[interactive model journey](https://synthflag.chaipinzheng353496.chatgpt.site/documentation/architecture).

## Quick start

### 1. Install

Python 3.10 or newer is required. When using CUDA, install a PyTorch build that
matches the local driver.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

### 2. Add checkpoints

Place the four released expert checkpoints directly in `weights/`:

```text
weights/
├─ manifest.json
├─ Expert_1_clip.pth
├─ Expert_2_clip.pth
├─ Expert_3_siglip.pth
└─ Expert_4_siglip.pth
```

Expected filenames, sizes, and SHA-256 digests are recorded in
[`weights/manifest.json`](weights/manifest.json). Checkpoint binaries are
intentionally excluded from Git.

### 3. Run inference

```bash
synthflag-infer \
  --images-dir /path/to/images \
  --out-dir outputs/predictions \
  --weights-dir weights \
  --device auto
```

`python -m infer` and the legacy `featdistill-infer` command remain available
for compatibility with the underlying detector release.

## Output contract

The CLI recursively reads JPEG, PNG, BMP, WebP, and TIFF files and creates:

```text
outputs/predictions/
├─ predictions.csv
├─ predictions.json
└─ predictions.meta.json
```

```csv
image_name,score
collection/example.jpg,0.873421
```

The completed run also writes the Track 5 submission format:

```json
[
  {
    "image_path": "collection/example.jpg",
    "pred": 0.873421
  }
]
```

- `image_name` is a POSIX-style path relative to `--images-dir`.
- `score` is the continuous ensemble output in the range `[0, 1]`.
- `predictions.json` mirrors the completed CSV as `image_path` / `pred`
  records for the TikTok TechJam evaluator.
- `predictions.meta.json` binds resumable output to its input root and weight
  manifest.
- Rerun the same command to resume, or pass `--overwrite` to begin again.

If input bytes change while filenames stay the same, use a new output directory
or `--overwrite` so old and new predictions are never mixed.

## Local detector experience

Install the optional service dependencies and start the checkpoint-backed API:

```bash
python -m pip install -e ".[server]"
export SYNTHFLAG_WEIGHTS_DIR=/absolute/path/to/weights
export SYNTHFLAG_EAGER_LOAD=1
uvicorn service.app:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd landing-page
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000/try`. The interface accepts one JPEG, PNG, or WebP
image up to 10 MB and displays the continuous `P(AI-generated)` score. It does
not persist uploaded bytes or results. See [`service/README.md`](service/README.md)
for the production GPU, health-check, and origin-allowlisting contract.

## Repository structure

```text
.
├─ infer/          # Authoritative model and resumable batch CLI
├─ service/        # Optional FastAPI inference service
├─ landing-page/   # Public website, detector UI, and visual documentation
├─ submission/     # Benchmarks, model card, checksums, and release audit
├─ docs/           # Project context and versioned research references
├─ distortion/     # Optional controlled robustness utilities
├─ assets/         # Approved SynthFlag identity and evidence graphics
└─ weights/        # Checkpoint manifest and setup guidance
```

## Submission package

- [Submission overview](submission/README.md)
- [Benchmark table](submission/BENCHMARKS.md)
- [Architecture diagram and explanation](submission/ARCHITECTURE.md)
- [Exact reproduction commands](submission/REPRODUCE.md)
- [Artifact checksums](submission/ARTIFACTS.sha256)
- [Model card](submission/MODEL_CARD.md)
- [Dataset attribution and rights](submission/DATASETS_AND_RIGHTS.md)
- [Third-party notices](submission/THIRD_PARTY_NOTICES.md)
- [Release audit](submission/RELEASE_AUDIT.md)
- [Project status and release gates](STATUS.md)

## Documentation and AI context

- [Documentation hub](docs/README.md)
- [Prompt-ready project context](docs/AI_CONTEXT.md)
- [Prompting guide for teammates](docs/PROMPTING_GUIDE.md)
- [Repository instructions for coding agents](AGENTS.md)
- [Versioned FeatDistill report snapshot](docs/references/featdistill-report/README.md)
- [Versioned NTIRE report snapshot](docs/references/ntire-2026-report/README.md)

For a fast handoff, give an AI assistant `docs/AI_CONTEXT.md`. Add the
FeatDistill report snapshot for method details and the NTIRE report snapshot
for complete challenge context, other team methods, official results, or
citations.

## Reproduce the evidence

The full benchmark commands, environment checks, expected inputs, verification
steps, and evidence limitations are in
[`submission/REPRODUCE.md`](submission/REPRODUCE.md). Dataset-derived rows,
individual scores, local paths, and protected data are intentionally excluded
from the public package.

## Hackathon reflection

The hardest part was not producing another headline accuracy number; it was
keeping every claim attached to the split and experiment that actually supports
it. We separated the protected V1 result, retrospective V2 robustness study,
and blocked V3 plan so calibration data, unavailable organizer data, and final
test evidence could not silently blend together.

We also learned that robustness is conditional. Compression, resizing, and
screenshot-like transformations affect datasets differently, while a lower
threshold improves fake recall by accepting more false positives. That is why
SynthFlag exposes a continuous score, documents the operating point, and treats
the output as review evidence rather than an automatic verdict.

Given more time, we would deploy a durable GPU-backed public inference worker,
evaluate the frozen detector on the exact organizer validation source once it
is legitimately available, expand representative error slices, and add an
abstention policy for uncertain or unfamiliar domains.

## Research, citation, and responsible use

SynthFlag builds on **FeatDistill**, the UESTC solution for the NTIRE 2026
Challenge on Robust AI-Generated Image Detection in the Wild. The hackathon
integration, reproducibility layer, evidence package, and product presentation
are the submission work; the detector architecture and released checkpoints
retain their upstream attribution.

Underlying detector report: [FeatDistill, arXiv:2603.21939](https://arxiv.org/abs/2603.21939).

A SynthFlag score is a signal, not conclusive proof of an image's origin,
generator identity, or manipulated region. Decisions with real consequences
should include human review and supporting evidence.

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

## License and distribution

Repository code and original project documentation are provided under the
[Apache License 2.0](LICENSE). That license does **not** grant rights to
third-party model checkpoints, datasets, benchmark images, dependency code, or
trademarks.

This Git repository intentionally excludes the four fine-tuned checkpoints,
dataset pixels, private split rows, and per-image protected-evaluation scores.
The checkpoint mirror is an external source, not a redistribution grant. Read
the [model card](submission/MODEL_CARD.md),
[dataset and rights inventory](submission/DATASETS_AND_RIGHTS.md),
[third-party notices](submission/THIRD_PARTY_NOTICES.md), and
[release audit](submission/RELEASE_AUDIT.md) before packaging or redistributing
anything beyond this source tree.
