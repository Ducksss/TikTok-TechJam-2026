# SynthFlag AI context pack

Use this file as the compact, repository-grounded context for an AI assistant.
It is deliberately shorter than the complete challenge report while preserving
the important technical and evidence boundaries.

## Executive summary

SynthFlag is the public-facing TikTok TechJam 2026 project. It packages the
released FeatDistill detector into a reproducible Python inference tool, a
checkpoint-backed HTTP service contract, a public web experience, technical
documentation, and an evidence-labeled submission package.

FeatDistill is the credited UESTC method described in Section 8.2 of the NTIRE
2026 challenge report. SynthFlag did not originate the four-expert detector or
the external fine-tuned checkpoints. The project contribution is the verified
integration, checkpoint integrity layer, resumable inference workflow, service
and web interfaces, protected-evaluation discipline, documentation, and public
presentation.

## Repository map

| Path | Responsibility | Source-of-truth status |
|---|---|---|
| `infer/model.py` | Architecture, preprocessing, checkpoint verification, score computation | Authoritative released inference behavior |
| `infer/cli.py` | Recursive batch discovery, run locking, resumability, CSV and metadata output | Authoritative CLI behavior |
| `service/app.py` | Optional FastAPI health and single-image analysis service | Authoritative Python HTTP behavior |
| `landing-page/app/api/analyze/route.ts` | Same-origin proxy and timeout/error mapping | Authoritative web proxy behavior |
| `landing-page/app/try/page.tsx` | Browser file validation, service state, result presentation | Authoritative UI behavior |
| `landing-page/app/documentation/` | Nontechnical and engineering documentation routes | Explanatory public documentation |
| `landing-page/public/diagrams/` | Fourteen downloadable deterministic SVG diagrams | Explanatory visual assets |
| `weights/manifest.json` | Required checkpoint names, sizes, and SHA-256 identities | Machine-readable checkpoint identity |
| `submission/BENCHMARKS.md` | V1/V2/V3 results and evidence boundaries | Public benchmark summary |
| `submission/evidence/` | Aggregate machine-readable and narrative evidence | Local result evidence |
| `submission/MODEL_CARD.md` | Intended use, limitations, thresholds, responsible operation | Deployment guidance |
| `submission/DATASETS_AND_RIGHTS.md` | Dataset provenance and redistribution policy | Rights inventory |
| `submission/RELEASE_AUDIT.md` | Public-release inclusions, exclusions, and checks | Release boundary |
| `STATUS.md` | Worktree ownership and current project-state vocabulary | Coordination record; recheck before relying on it |

## Exact released model contract

### Inputs and preprocessing

- Public tensor input: `[B, 3, H, W]`.
- Accepted tensor types: `uint8`, or finite floating point in `[0,1]`.
- PIL inputs are converted to RGB.
- CLIP branch: bicubic resize to short edge 224, center crop 224, tensor
  conversion, then CLIP normalization with mean
  `(0.48145466, 0.4578275, 0.40821073)` and standard deviation
  `(0.26862954, 0.26130258, 0.27577711)`.
- SigLIP branch: bicubic resize to short edge 384, center crop 384, tensor
  conversion, then mean and standard deviation `(0.5, 0.5, 0.5)`.

### Experts and tensor shapes

| Expert | Backbone configuration | Feature used | Head | Output |
|---|---|---:|---|---|
| 1 and 2 | OpenAI CLIP ViT-L/14, 224 px | `[B,768]` projected image embedding | `768 -> 256 -> ReLU -> Dropout(0.3) -> 2` | `[B,2]` logits |
| 3 and 4 | Google SigLIP So400M Patch14-384 | `[B,1152]` pooled output | `1152 -> 256 -> ReLU -> Dropout(0.3) -> 2` | `[B,2]` logits |

Each expert applies softmax over its two logits. Class index 1 is treated as
`P(fake)`. The released score preserves this arithmetic order:

```text
(P_siglip_3 + P_siglip_4 + P_clip_1 + P_clip_2) / 4
```

There is no weighting, gating, test-time augmentation, generator attribution,
localization, heatmap, or visible-artifact explanation in the released
inference path.

### Checkpoint loading

The loader requires these external files:

- `Expert_1_clip.pth`
- `Expert_2_clip.pth`
- `Expert_3_siglip.pth`
- `Expert_4_siglip.pth`

By default, it validates `manifest.json`, exact byte sizes, and SHA-256 before
deserialization. Loading uses `torch.load(..., weights_only=True)`, requires a
non-empty tensor-only state dictionary, restores with strict architecture
matching, moves each expert to the selected device, and switches it to
evaluation mode. Hashes establish file identity, not authenticity, safety, or
redistribution rights.

## Paper-described training

The challenge report says the UESTC method used two stages:

1. Train each model for two epochs with a binary real-versus-generated
   objective.
2. Use intermediate feature maps from the epoch-2 checkpoint as dense targets
   for feature-level self-distillation and align current representations to
   those targets.

The report also describes training-set expansion and broader degradation
modeling. The public repository does not contain the complete paper training
pipeline, the training data, or a claim that the released inference package can
reproduce checkpoint training. Never place training inside a live inference
diagram or imply that inference performs self-distillation.

Primary sources: [FeatDistill Section 4.3](references/featdistill-report/report.html#S4.SS3),
[FeatDistill Section 4.7](references/featdistill-report/report.html#S4.SS7), and
[NTIRE Section 8.2](references/ntire-2026-report/report.html#S8.SS2).

## CLI contract

The `synthflag-infer` command recursively discovers supported images in sorted
path order, verifies all checkpoints before constructing the model, acquires an
exclusive output-directory lock, and writes:

- `predictions.csv` with `image_name,score`; and
- `predictions.meta.json` with protocol, package/runtime versions,
  preprocessing identity, checkpoint identity, device, AMP, and batch size.

Supported CLI extensions are JPEG, PNG, BMP, WebP, and TIFF. Results are flushed
and `fsync`-ed in configurable groups. Resume matching is by relative image
path plus exact run metadata, not by image-content hash. If an image changes at
the same relative path, use a new output directory or `--overwrite`.

## HTTP and web contract

The FastAPI service accepts one JPEG, PNG, or WebP image, at most 10 MiB, with
dimensions of at least 32 px and at most 50,000,000 decoded pixels. It may
eager-load at process startup or lazy-load on first analysis. Model creation is
guarded by `_model_lock`; one model is cached per process; prediction is guarded
by `_inference_lock`, so model execution is serialized within a process.

`POST /v1/analyze` returns `score`, a service threshold of `0.5`, model/version,
a short checkpoint identity, and `processing_ms`. The timer begins after image
decode and model acquisition, so it includes inference-lock waiting and
prediction but excludes upload reading, decode, and cold model loading.

The website can call a direct public inference URL or its same-origin
`/api/analyze` proxy. The proxy uses a 5-second health timeout and a 300-second
analysis timeout. The public architecture diagrams describe supported
configurations, not a guarantee about the topology of the current deployment.
Authentication, rate limiting, durable upload/result storage, automatic retry,
and streamed progress are not implemented by these source files.

## Scores, thresholds, and claims

- A score is continuous model evidence, not conclusive proof of origin.
- The service reports threshold `0.5`.
- The website's descriptive bands (`0.25`, `0.5`, `0.75`) are presentation
  language, not a calibration study.
- The protected V1 evidence documents a frozen balanced operating threshold of
  `0.2874746155139839`. It changes binary decisions, not score ranking or
  ROC-AUC, and is not automatically appropriate for a new population.
- The NTIRE challenge report lists UESTC average clean ROC-AUC `0.9729` and
  average robust ROC-AUC `0.8679`. These are organizer challenge results, not
  the repository's local V1/V2 benchmark values. See
  [paper Table 3](references/ntire-2026-report/report.html#S3.T3.4).

## Local evidence boundary

- **V1 calibration:** 2,004 development rows; threshold/configuration selection
  was permitted.
- **V1 final:** 7,998 protected rows, balanced 3,999 real and 3,999 fake; final
  rows were not used for fitting or selection.
- **V2:** 2,004-row retrospective development analysis with duplicate-grouped
  cross-validation and deterministic corruptions; it is not a second protected
  final test.
- **V3:** blocked because the exact organizer 8,843-image DALL-E Advanced source
  is absent. No V3 metric exists, and a similarly named dataset must not be
  substituted.

Use `submission/BENCHMARKS.md` for the complete table. Do not turn partial
evaluation caches, a one-image score, or a planned protocol into a result.

## Public release and rights boundary

Allowed public material includes repository-authored code/docs, aggregate
metrics and protocols, hashes, and correctly attributed CC-licensed paper
content. Excluded material includes checkpoint binaries, dataset pixels,
private split membership, local paths, per-image protected scores, and material
without a redistribution grant.

The vendored FeatDistill and NTIRE report snapshots are separately licensed
under CC BY 4.0; they are not relicensed under the repository's Apache License
2.0. Checkpoint and dataset access do not imply redistribution permission.

## Safe language for answers

Prefer:

- “SynthFlag returns a model score associated with AI-generated-image patterns.”
- “The score should be combined with provenance, context, and human review.”
- “The released ensemble averages four expert probabilities.”
- “The report describes self-distillation during training.”
- “This diagram shows a supported configuration.”

Avoid:

- “SynthFlag proves this image is fake.”
- “The score is calibrated for every image source.”
- “The model identifies which generator made the image.”
- “The model highlights the manipulated region.”
- “Uploads are guaranteed never to be retained.”
- “The public site definitely uses this exact infrastructure.”
