# SynthFlag repository context for AI agents

Read this file before proposing or changing repository content. For a fuller
project brief, read [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md). For primary
research, use [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939)
and [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487).

## Context freshness contract

- This root `AGENTS.md` is the repository's only automatic coding-agent
  instruction file. Do not add a nested `AGENTS.md` unless a directory truly
  needs narrower instructions and the context checker is updated with it.
- `AGENTS.md`, `README.md`, `docs/AI_CONTEXT.md`, `docs/PROMPTING_GUIDE.md`,
  `docs/README.md`, and `STATUS.md` form the maintained context set. Update them together when a
  change affects naming, public routes, inference outputs, evidence status, or
  release procedure.
- Executed code and machine-readable manifests outrank explanatory copy.
  `training_eval/` is the source of truth for the project-trained residual
  heads, augmentation, training, selected route, and TEST1 evidence. `infer/`
  adapts that implementation to the product API and frozen encoder runtime.
  `STATUS.md` is a refreshable release snapshot, never authority for model
  behavior or a substitute for fresh Git, deployment, or service-health checks.
- Run `python scripts/check_repository_context.py` after changing any context
  surface, public route, diagram inventory, or batch-output contract.
- Run `python scripts/check_source_provenance.py` after changing release source
  or assets. The machine-readable audit manifest remains the authority for
  prohibited source overlap.

## Naming and attribution

- **SynthFlag** is the public product, repository, demo, submission, Python
  package, and primary CLI name.
- The underlying detector lineage and frozen Expert 4 checkpoint are credited
  to Tu et al. Do not present that encoder, its teacher head, or its training as
  original SynthFlag research.
- The current runtime is repository-maintained and checkpoint-compatible.
  Preserve method, checkpoint, dependency, and source attribution in
  `submission/THIRD_PARTY_NOTICES.md`.
- The NTIRE report describes many teams. Claims about different submissions or
  institutions are not interchangeable.

## Released inference contract

- Sources of truth: `training_eval/scripts/model.py` for the project residual
  head implementation, `training_eval/configs/selected_test1.yaml` for the
  selected route, and `infer/architecture.py` for the frozen encoder adapter
  and score conversion; `infer/preprocessing.py` for image transforms,
  `infer/checkpoints.py` for checkpoint integrity, `infer/model.py` for the
  public Python API, and `infer/outputs.py` plus `infer/cli.py` for batch
  artifacts.
- The selected TEST1 graph has one frozen Tu et al. Expert 4 SigLIP So400M
  Patch14-384 teacher plus three project-trained residual heads. Expert 4 emits
  a 1,152-dimensional pooled feature and two teacher logits.
- Each residual head is `LayerNorm(1152) -> Linear(256) -> GELU -> Dropout ->
  Linear(1)` and adds a scalar correction to the detached teacher margin.
- Inference records native image dimensions before converting to RGB, then uses
  bicubic short-edge resize to 384 px, center crop, and SigLIP normalization.
- Native longest side `<=64` uses the CIFAKE residual head with alpha `1.25`.
  Larger images blend epoch-05 and epoch-08 corrected margins `0.65 / 0.35`
  and apply the fixed margin boundary `-1.557959395647049` before sigmoid.
  The resulting score is a research signal, not proof, generator attribution,
  localization, or a calibrated probability for every deployment population.
- A completed CLI run writes `predictions.csv`, Track 5-compatible
  `predictions.json` records with exactly `image_path` and `pred`, and
  `predictions.meta.json`. The JSON artifact is atomic at completed-run time;
  CSV and metadata retain the resumable-run contract.
- Head training and the paper's upstream detector training are not part of the
  released live inference path.
- The former upstream `distortion/` package remains removed.
  `synthflag_augment/` is a separately designed, repository-authored
  development utility with its own API and audit trace. It is not used by
  inference and is not a reproduction of the paper-described training policy.

## Product surfaces

- Recorded demo: [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0).
  Treat it as a recorded product walkthrough, not evidence that the hosted
  inference worker is currently reachable.
- `infer/`: product inference adapter, stable Python API, and resumable batch
  CLI over the authoritative project head implementation.
- `training_eval/`: authoritative project model-development record: residual
  head code, exact collaborator Drive ZIP and extracted binaries,
  training/evaluation runners, deterministic augmentations, configs, tests,
  TEST1 row-level predictions, reports, and integrity artifacts.
- `synthflag_augment/`: optional deterministic development-data augmentation;
  never use protected final-evaluation rows to tune its recipes.
- `service/`: optional FastAPI wrapper. It lazy-loads or optionally eager-loads
  one cached model per process, admits one active and one queued analysis, and
  serializes prediction with an inference lock. The image route uses `B=1`;
  the sampled-video frame route uses two-frame microbatches.
- `landing-page/`: public website with primary routes `/`, `/try`, `/journey`,
  and `/documentation`, plus the compatibility route
  `/documentation/architecture` and the
  same-origin `/api/analyze` and `/api/analyze-video` proxies. Short videos are
  decoded locally into eight midpoint PNG samples; the original video is not
  uploaded. The proxies bound request bodies before multipart parsing, and the
  video client binds returned duration and timestamps to its submitted samples.
  - `/journey` is the judge-first project and decision narrative.
  - `/documentation` is the unified technical appendix, evidence guide, deep
    model walkthrough, and system atlas.
  - `/documentation/architecture` preserves legacy links by forwarding the
    current URL fragment to the matching `/documentation` section.
- `submission/`: evidence-labeled release package, benchmark tables, model card,
  rights inventory, checksums, and reproduction guide.
- `weights/manifest.json`: identities of the upstream Expert 4 checkpoint and
  three selected residual-head files. The three collaborator-trained heads are
  tracked project artifacts; the upstream Expert 4 binary remains external.

## Evidence rules

- Treat paper facts, released-code behavior, local benchmark evidence, planned
  studies, and deployment guidance as different evidence classes.
- Treat TEST1 as a completed public development diagnostic, not the locked
  TikTok test. Preserve the retired V1/V2/V3 four-expert results as historical
  evidence only. A dash means unavailable, not zero; V3 remains blocked.
- Treat the Day 3 Professor Ng interview as research input and a future-work
  direction, not model-performance evidence or endorsement. Its early
  camera-statistics prototype is absent from the selected runtime and TEST1.
- The project owner accepts the collaborator's attestation that the residual
  heads and their training inputs are rights-cleared for project use. Describe
  that status as teammate-attested, not independently audited. Keep the
  benchmark-aware `<=64` route, separate Expert 4 redistribution boundary, and
  organizer-eligibility uncertainty visible in the model card and evidence.
- Do not infer final metrics from partial caches, one-image checks, framework
  tests, or specifications.
- Never train, tune, select checkpoints, calibrate, or select thresholds using
  protected final-evaluation rows.
- Keep the upstream Expert 4 binary, dataset pixels, local paths, private split
  rows, per-image protected scores, prompts/captions, and unlicensed third-party
  material out of Git. The exact collaborator head ZIP, three rights-attested
  project residual heads, and public TEST1 row-level predictions are explicit
  tracked exceptions.

## Change discipline

- Inspect `STATUS.md`, `git status`, `git worktree list --porcelain`, and fresh
  `origin/main` before editing or integrating. The primary checkout may have
  other active writers.
- Use a named `codex/` branch and an isolated worktree for independent changes.
- Do not add CI unless the user requests it.
- Do not change model/API behavior while editing documentation.
- Verify claims against primary source files and label inference as inference.
- Before release, run the relevant tests/build, validate JSON and SVG files,
  check Markdown links, run `python scripts/check_repository_context.py`,
  run `python scripts/check_source_provenance.py`, inspect the diff, refetch,
  and push without force.
