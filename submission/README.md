# SynthFlag submission package

SynthFlag is the public product name for this robust AI-generated image
detector. Its repository-authored inference runtime remains compatible with and
credits the published four-expert method described by Tu et al., plus the
external checkpoints. The installable distribution and command in this
repository are named `synthflag-infer`.

## Submission index

- [Benchmark table and evidence boundaries](BENCHMARKS.md)
- [TEST1 aggregate report, protocol, and model boundary](evidence/test1/README.md)
- [Architecture diagram](ARCHITECTURE.svg)
- [Accessible architecture explanation](ARCHITECTURE.md)
- [Exact reproduction commands](REPRODUCE.md)
- [Package checksum manifest](ARTIFACTS.sha256)
- [Model card](MODEL_CARD.md)
- [Dataset attribution and rights](DATASETS_AND_RIGHTS.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Release audit](RELEASE_AUDIT.md)
- [Implementation provenance](../docs/IMPLEMENTATION_PROVENANCE.md)
- [Day 3 research interview and future-work boundary](../docs/INTERVIEW_PROF_NG.md)
- [Devpost thumbnail](media/synthflag-devpost-thumbnail.png)
- [Devpost gallery screenshots and architecture asset set](media/devpost-gallery/README.md)
- [Machine-readable and source-report evidence](evidence/)

## Result in one sentence

TEST1 scored 15,000 unique public images clean and under one deterministic
composite corruption, producing 30,000 paired predictions and descriptive macro
ROC-AUC `0.9324` clean versus `0.8773` augmented. TEST1 evaluates a
benchmark-only corrected-v2 topology, not the released four-expert arithmetic
mean. The latter retains its separately documented protected V1 ROC-AUC
`0.8505` and retrospective V2 evidence.

## Demo

[Open the verified SynthFlag landing page](https://synthflag.chaipinzheng353496.chatgpt.site/)
or [open the current `/try` deployment](https://synthflag.chaipinzheng353496.chatgpt.site/try).

On 2026-08-31, an unauthenticated production request returned HTTP 200 with the
SynthFlag page title, metadata, method, evidence, and responsible-use content.
The detector architecture and research lineage remain attributed to Tu et al.
The updated `/try` source exposes image scoring plus an eight-midpoint
sampled-frame video interface and reports whether its checkpoint-backed model
service advertises the required capability. Raw video remains in the browser;
the frame mean is descriptive, not a calibrated video probability. Deployment
and worker health must be verified live before calling the feature available to
judges. When the worker is unavailable the UI does not fabricate a score;
executable local inference is documented in [REPRODUCE.md](REPRODUCE.md).

## Evidence status

| Version | Evidence role | Status | Safe claim |
|---|---|---|---|
| TEST1 | Public development benchmark | Complete | Per-dataset clean/augmented metrics for 15,000 unique public images scored by the benchmark-only corrected-v2 topology; not the released four-expert model or TikTok hidden test |
| V1 | Protected final evaluation | Complete | Checksum-bound performance of the released local detector on 7,998 held-out images |
| V2 | Retrospective development study | Complete | Cross-fitted ranking, calibration, robustness, and domain-transfer analysis on 2,004 calibration rows |
| V3 | New paired clean/augmented A/B study | **BLOCKED** | No performance claim; the exact organizer-provided 8,843-image DALL-E Advanced source is absent |

V2 must not be presented as new protected-final validation. Its pooled
disagreement-stack gain failed every leave-one-dataset-out guardrail, so the
released four-expert probability mean remains the production recommendation.
TEST1 is a separate benchmark-only candidate study and must not be transferred
to that released model or the live service.

The Day 3 interview with Professor Ng Teck Khim is preserved separately as
research input. It motivated a local camera-statistics direction, but the brief
exploratory prototype was not strong or stable enough for a final metric and
was not used in the released model, TEST1, or final model selection.

## Integrity

From the repository root:

```bash
cd submission
shasum -a 256 -c ARTIFACTS.sha256
```

`ARTIFACTS.sha256` intentionally does not hash itself. The four large model
checkpoints are distributed separately; their expected sizes and SHA-256
digests are preserved in
[`evidence/weights-manifest.json`](evidence/weights-manifest.json) and enforced
by the inference loader before deserialization.

## Responsible-use boundary

SynthFlag returns a probability-like model score, not proof of an image's
origin. Scores can shift under compression, resizing, screenshots, new image
generators, and unfamiliar domains. For TikTok-like creator operations,
constrain false-positive rate first because a wrong flag can affect authentic
work, distribution, monetization, and appeals; then reduce false negatives
within that cap. Calibrate the threshold on separate representative data,
retain human review for consequential decisions, and report both error costs.

## Repository pointers

- [Inference implementation](../infer/model.py)
- [Command-line interface](../infer/cli.py)
- [Checkpoint instructions](../weights/README.md)
- [License](../LICENSE)

The repository license covers original repository material only. Checkpoints,
dataset pixels, protected split rows, and per-image protected-evaluation scores
are excluded from the public package and remain subject to their own terms.
