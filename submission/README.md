# SynthFlag submission package

SynthFlag is the public product name for this robust AI-generated image
detector. Its repository-authored inference runtime remains compatible with and
credits the published **FeatDistill** four-expert method and external
checkpoints. The installable distribution and command in this repository are
named `synthflag-infer`.

## Submission index

- [Benchmark table and evidence boundaries](BENCHMARKS.md)
- [Architecture diagram](ARCHITECTURE.svg)
- [Accessible architecture explanation](ARCHITECTURE.md)
- [Exact reproduction commands](REPRODUCE.md)
- [Package checksum manifest](ARTIFACTS.sha256)
- [Model card](MODEL_CARD.md)
- [Dataset attribution and rights](DATASETS_AND_RIGHTS.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Release audit](RELEASE_AUDIT.md)
- [Implementation provenance](../docs/IMPLEMENTATION_PROVENANCE.md)
- [Devpost thumbnail](media/synthflag-devpost-thumbnail.png)
- [Devpost gallery screenshots and architecture asset set](media/devpost-gallery/README.md)
- [Machine-readable and source-report evidence](evidence/)

## Result in one sentence

On the protected 7,998-image V1 final partition, the unchanged released
four-expert probability mean reached ROC-AUC `0.8505`; using the
calibration-fitted threshold `0.2874746155139839` instead of `0.5` raised
balanced accuracy from `0.7763` to `0.8061` and fake recall from `0.5924` to
`0.7127`, with lower precision and specificity. The threshold changes the
operating point, not the score ranking.

## Demo

[Open the verified SynthFlag landing page](https://synthflag.chaipinzheng353496.chatgpt.site/)
or [open the current `/try` deployment](https://synthflag.chaipinzheng353496.chatgpt.site/try).

On 2026-08-31, an unauthenticated production request returned HTTP 200 with the
SynthFlag page title, metadata, method, evidence, and responsible-use content.
FeatDistill appears only as the credited detector architecture and research
lineage. The updated `/try` source exposes image scoring plus an eight-midpoint
sampled-frame video interface and reports whether its checkpoint-backed model
service advertises the required capability. Raw video remains in the browser;
the frame mean is descriptive, not a calibrated video probability. Deployment
and worker health must be verified live before calling the feature available to
judges. When the worker is unavailable the UI does not fabricate a score;
executable local inference is documented in [REPRODUCE.md](REPRODUCE.md).

## Evidence status

| Version | Evidence role | Status | Safe claim |
|---|---|---|---|
| V1 | Protected final evaluation | Complete | Checksum-bound performance of the released local detector on 7,998 held-out images |
| V2 | Retrospective development study | Complete | Cross-fitted ranking, calibration, robustness, and domain-transfer analysis on 2,004 calibration rows |
| V3 | New paired clean/augmented A/B study | **BLOCKED** | No performance claim; the exact organizer-provided 8,843-image DALL-E Advanced source is absent |

V2 must not be presented as new protected-final validation. Its pooled
disagreement-stack gain failed every leave-one-dataset-out guardrail, so the
released four-expert probability mean remains the production recommendation.

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
generators, and unfamiliar domains. Use an appropriate operating threshold,
retain human review for consequential decisions, and report both false-positive
and false-negative costs.

## Repository pointers

- [Inference implementation](../infer/model.py)
- [Command-line interface](../infer/cli.py)
- [Checkpoint instructions](../weights/README.md)
- [License](../LICENSE)

The repository license covers original repository material only. Checkpoints,
dataset pixels, protected split rows, and per-image protected-evaluation scores
are excluded from the public package and remain subject to their own terms.
