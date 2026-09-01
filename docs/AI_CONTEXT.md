# SynthFlag AI context pack

Use this file as the compact, repository-grounded context for an AI assistant.
Executed code and machine-readable manifests outrank explanatory copy.

## Executive summary

SynthFlag is the public-facing TikTok TechJam 2026 project. Its selected TEST1
detector centers the team's three trained residual heads, deterministic
native-size routing, augmentation/training/evaluation stack, and public TEST1
record over one frozen Expert 4 SigLIP representation.
The repository also provides a Python API and CLI, an optional FastAPI service,
a public web experience, technical documentation, and evidence-labeled release
materials.

The canonical recorded walkthrough is [**SynthFlag demo
v8**](https://youtu.be/X5-J4NmNHl0). It demonstrates the product story but does
not establish that the separately hosted checkpoint-backed worker is currently
reachable.

`training_eval/` is authoritative for the project contribution: residual-head
implementation, final Google Drive bundle identity, training, augmentation,
routing config, TEST1 predictions, metrics, bootstrap evidence, and tests.
Checkpoint bytes remain outside Git. Expert 4 is a frozen dependency with
required attribution; it is not the project contribution.

## Context freshness

The maintained context set is `/AGENTS.md`, this file,
`PROMPTING_GUIDE.md`, `README.md`, and `/STATUS.md`. Update them together when
naming, routes, inference behavior, outputs, evidence, or release procedure
changes. Run `python scripts/check_repository_context.py` afterward.

## Repository map

| Path | Responsibility | Authority |
|---|---|---|
| `training_eval/scripts/model.py` | Residual-head implementation used by training and product inference | Project model code |
| `training_eval/configs/selected_test1.yaml` | Selected route, blend, alpha, boundary, and artifact contract | Project graph selection |
| `training_eval/scripts/`, `training_eval/tests/` | Training, augmentation, evaluation, bundle verification, and regression tests | Project development stack |
| `training_eval/benchmarks/test1/` | Public row-level predictions, metrics, bootstrap evidence, figures, and integrity | Primary TEST1 evidence |
| `training_eval/weights/` | Final Drive bundle manifest and download record; no checkpoint bytes | Artifact identity |
| `infer/architecture.py` | Frozen encoder adapter, route execution, and score conversion | Product runtime graph |
| `infer/preprocessing.py` | RGB, 384 px resize/crop, and SigLIP normalization | Pixel transform |
| `infer/checkpoints.py` | Manifest verification, identity, and safe tensor loading | Checkpoint boundary |
| `infer/model.py` | Stable Python scoring API and device handling | Runtime API |
| `infer/outputs.py`, `infer/cli.py` | Discovery, locking, resumability, CSV, Track 5 JSON, metadata | Batch behavior |
| `service/app.py` | Health, image analysis, and sampled-frame analysis | HTTP behavior |
| `landing-page/app/` | `/`, `/try`, `/journey`, `/documentation`, compatibility route, and proxies | Public product source |
| `infer/checkpoint_manifest.json` | Packaged Drive locations plus Expert 4 and three-head hashes/sizes | Runtime artifact identity |
| `weights/README.md` | Final Google Drive download and local-install guide | Artifact setup |
| `submission/BENCHMARKS.md` | TEST1 primary evidence and historical-study boundaries | Benchmark summary |
| `submission/evidence/test1/` | Aggregate TEST1 report, metrics, deltas, and integrity | Selected-graph result evidence |
| `submission/MODEL_CARD.md` | Intended use, limitations, rights, and eligibility | Deployment guidance |
| `synthflag_augment/` | Deterministic development-data variants with traces | Optional; not inference |

## Exact selected model contract

### Input and preprocessing

- Public tensor input is `[B,3,H,W]` using `uint8` or finite floats in `[0,1]`.
- PIL inputs must be valid images. Native width/height are recorded before any
  resize because routing depends on the original longest side.
- Inputs are converted to RGB, bicubic-resized to a 384 px short edge,
  center-cropped to `384 x 384`, converted to a tensor, and normalized with
  SigLIP mean/std `(0.5, 0.5, 0.5)`.

### Frozen teacher and project heads

- Teacher: upstream `Expert_4_siglip.pth`, a SigLIP So400M
  Patch14-384 vision encoder plus its original two-logit binary classifier.
- Per image, the teacher supplies a pooled feature `[1152]` and margin
  `teacher_logit[1] - teacher_logit[0]`.
- Each project head is:

```text
LayerNorm(1152) -> Linear(1152,256) -> GELU -> Dropout -> Linear(256,1)
```

- Each head has `297,729` parameters. During inference dropout is disabled.
- A head returns `teacher_margin + alpha * residual(features)`; the teacher
  margin is detached.

### Routing and score

```text
if native_longest_side <= 64:
    margin = teacher_margin + 1.25 * cifake_router_residual
    score = sigmoid(margin)
else:
    margin05 = teacher_margin + epoch05_residual
    margin08 = teacher_margin + epoch08_residual
    stacked_margin = 0.65 * margin05 + 0.35 * margin08
    score = sigmoid(stacked_margin - (-1.557959395647049))
```

The reported benchmark decision convention is `score >= 0.5`. That threshold
is not a universal deployment threshold. The output is a ranking/review signal,
not proof of authorship, generator attribution, localization, or a calibrated
probability for every population.

### Required local artifacts

```text
weights/
├── Expert_4_siglip.pth
├── cifake_router_head.pt
├── general_epoch05_head.pt
└── general_epoch08_head.pt
```

The final Google Drive three-head ZIP has SHA-256
`7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`.
All four checkpoint files remain outside Git. The runtime verifies local
downloads against `infer/checkpoint_manifest.json`; `weights/README.md` links
the final team Google Drive bundle and Expert 4 file.

## Batch and service contracts

A completed CLI run creates:

- `predictions.csv` with `image_name,score`;
- atomic `predictions.json` records containing exactly `image_path` and `pred`;
- `predictions.meta.json`, which binds a resumable run to inputs, runtime, and
  checkpoint identity.

`service/app.py` caches one model per process, admits one active and one queued
analysis, and serializes inference. `/v1/analyze` scores one image. The sampled
frame route scores 1–8 browser-derived frames in two-frame microbatches and
returns ordered scores plus descriptive mean/peak/threshold-count summaries.
The raw video stays in the browser; audio and motion are not analyzed.

Public routes are `/`, `/try`, `/journey`, and `/documentation`.
`/documentation/architecture` forwards legacy fragment links.
`/api/analyze` and `/api/analyze-video` are bounded same-origin proxies.

## TEST1 evidence

TEST1 is the primary evidence for the selected graph:

- 15,000 unique public sources and 30,000 aligned clean/composite evaluations;
- 5,000 balanced rows each from CIFAKE official test, SID-Set public validation,
  and a score-blind WildFake official-test sample;
- one clean and one deterministic 1–5-family composite view per source;
- fixed reported threshold `0.5`, with no fitting during the reporting pass.

| Dataset | Clean AUC | Composite AUC | Clean FP/FN | Composite FP/FN |
|---|---:|---:|---:|---:|
| CIFAKE | 0.9816 | 0.9095 | 288 / 113 | 499 / 388 |
| SID-Set | 0.8691 | 0.8439 | 18 / 1,044 | 58 / 1,038 |
| WildFake | 0.9467 | 0.8785 | 316 / 272 | 861 / 257 |

TEST1 is a public development diagnostic, not the locked TikTok test. The
public suites were inspected during earlier work. The `<=64` route sends all
TEST1 CIFAKE images and no SID/WildFake images to the specialist, so its CIFAKE
result is benchmark-aware rather than proof of unknown-domain routing.

The older V1/V2 studies evaluated the retired four-expert probability mean.
They remain historical evidence only and must not be used to claim performance
for the selected graph. V3 remains blocked because the exact organizer DALL-E
Advanced source is absent.

## Research interview boundary

The Day 3 interview with Professor Ng Teck Khim motivated a future forensic
study of Bayer sampling, demosaicing, local variance, and cross-channel
statistics. The photo and transcript document the research conversation; they
are not detector-performance evidence or endorsement. The early prototype was
not stable enough for a claim and is absent from the selected runtime and
TEST1. See `docs/INTERVIEW_PROF_NG.md` for the maintained evidence boundary.

## Rights and eligibility

- The project owner accepts the collaborator's attestation that the three
  residual heads and their training inputs are rights-cleared for project use.
  This is teammate-attested rather than independently license-audited.
- The disclosed lineage includes a 9,311-image Open Images bulk tranche and 986
  guided-diffusion/BigGAN sample pixels, 682 of which entered gradients. The
  collaborator's attestation resolves the prior retrain gate for project use.
- WildFake remains evaluation-only; no benchmark pixels are redistributed.
- Expert 4 redistribution permission is unproven. A base SigLIP license does
  not automatically license the published fine-tune.
- Under the relayed Track 5 restriction against an existing AIGC detector, the
  selected system may be ineligible unless organizers explicitly clear it.
- Preserve dependency, checkpoint, method, and source attribution in
  `submission/THIRD_PARTY_NOTICES.md`.

## Safe language

Prefer:

- “SynthFlag uses a frozen Expert 4 representation with three
  project-trained residual heads.”
- “TEST1 is a completed public development diagnostic.”
- “Residual-head rights are collaborator-attested and accepted by the project
  owner; they were not independently license-audited in this repository.”
- “A score supports review and must not be treated as proof.”

Avoid:

- “SynthFlag trained or invented Expert 4.”
- “The model passed TikTok's hidden test.”
- “Expert 4 redistribution or organizer eligibility is cleared.”
- “CIFAKE routing demonstrates unknown-domain generalization.”
- “The older four-expert V1/V2 metrics validate the selected TEST1 graph.”

## Verification commands

```bash
python -m unittest discover -s tests
python scripts/check_repository_context.py
python scripts/check_source_provenance.py
```

For the public site, also run its unit checks, lint, and production build.
