# SynthFlag repository context for AI agents

Read this file before proposing or changing repository content. For a fuller
project brief, read [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md). For primary
research, use the prompt-friendly FeatDistill
[`report.txt`](docs/references/featdistill-report/report.txt) and NTIRE
[`report.txt`](docs/references/ntire-2026-report/report.txt) snapshots.

## Context freshness contract

- This root `AGENTS.md` is the repository's only automatic coding-agent
  instruction file. Do not add a nested `AGENTS.md` unless a directory truly
  needs narrower instructions and the context checker is updated with it.
- `AGENTS.md`, `docs/AI_CONTEXT.md`, `docs/PROMPTING_GUIDE.md`, `docs/README.md`,
  and `STATUS.md` form the maintained context set. Update them together when a
  change affects naming, public routes, inference outputs, evidence status, or
  release procedure.
- Executed code and machine-readable manifests outrank explanatory copy.
  `STATUS.md` is a refreshable release snapshot, never authority for model
  behavior or a substitute for fresh Git, deployment, or service-health checks.
- Run `python scripts/check_repository_context.py` after changing any context
  surface, public route, diagram inventory, or batch-output contract.
- Run `python scripts/check_source_provenance.py` after changing release source
  or assets. Do not reintroduce byte-identical source from the audited upstream
  FeatDistill snapshot.

## Naming and attribution

- **SynthFlag** is the public product, repository, demo, submission, Python
  package, and primary CLI name.
- **FeatDistill** is the UESTC research lineage and the source of the frozen
  Expert 4 checkpoint used by the selected graph. Do not present that encoder,
  its teacher head, or its training as original SynthFlag research.
- The repository began from a copied FeatDistill snapshot. The current runtime
  is a repository-authored, checkpoint-compatible reimplementation, not a
  clean-room claim. Preserve the disclosure and boundary in
  `docs/IMPLEMENTATION_PROVENANCE.md` and `NOTICE`.
- The NTIRE report describes many teams. Claims about MICV, Ant International,
  TeleAI, INTSIG, Vincentlc, Reagvis Labs, UESTC, PSU, or Shallow Real are not
  interchangeable.

## Released inference contract

- Sources of truth: `infer/architecture.py` for the Expert 4 teacher, residual
  heads, native-size route, and score conversion; `infer/preprocessing.py` for image transforms,
  `infer/checkpoints.py` for checkpoint integrity, `infer/model.py` for the
  public Python API, and `infer/outputs.py` plus `infer/cli.py` for batch
  artifacts.
- The selected TEST1 graph has one frozen FeatDistill Expert 4 SigLIP So400M
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
  inference and is not a reproduction of FeatDistill's training policy.

## Product surfaces

- `infer/`: authoritative Python model and resumable batch CLI.
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
  three selected residual-head files. Checkpoint binaries are intentionally excluded.

## Evidence rules

- Treat paper facts, released-code behavior, local benchmark evidence, planned
  studies, and deployment guidance as different evidence classes.
- Treat TEST1 as a completed public development diagnostic, not the locked
  TikTok test. Preserve the retired V1/V2/V3 four-expert results as historical
  evidence only. A dash means unavailable, not zero; V3 remains blocked.
- The selected graph is research-only pending a rights-clean retrain. Its
  benchmark-aware `<=64` route and unresolved large-head data rights must remain
  visible in the model card and submission evidence.
- Do not infer final metrics from partial caches, one-image checks, framework
  tests, or specifications.
- Never train, tune, select checkpoints, calibrate, or select thresholds using
  protected final-evaluation rows.
- Keep checkpoint binaries, dataset pixels, local paths, private split rows,
  per-image protected scores, prompts/captions, and unlicensed third-party
  material out of Git.

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
