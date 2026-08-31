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
- **FeatDistill** is the underlying UESTC detector architecture, checkpoint,
  and research lineage. Do not present it as original SynthFlag research.
- The repository began from a copied FeatDistill snapshot. The current runtime
  is a repository-authored, checkpoint-compatible reimplementation, not a
  clean-room claim. Preserve the disclosure and boundary in
  `docs/IMPLEMENTATION_PROVENANCE.md` and `NOTICE`.
- The NTIRE report describes many teams. Claims about MICV, Ant International,
  TeleAI, INTSIG, Vincentlc, Reagvis Labs, UESTC, PSU, or Shallow Real are not
  interchangeable.

## Released inference contract

- Sources of truth: `infer/architecture.py` for expert topology and score
  fusion, `infer/preprocessing.py` for image transforms,
  `infer/checkpoints.py` for checkpoint integrity, `infer/model.py` for the
  public Python API, and `infer/outputs.py` plus `infer/cli.py` for batch
  artifacts.
- Four independent experts: two CLIP ViT-L/14 experts at 224 px and two SigLIP
  So400M Patch14-384 experts at 384 px.
- Each expert has a `feature -> Linear(256) -> ReLU -> Dropout(0.3) ->
  Linear(2)` binary head. CLIP features are 768-dimensional; SigLIP pooled
  features are 1152-dimensional.
- Inference converts inputs to RGB, uses bicubic short-edge resize plus center
  crop, and applies backbone-specific normalization.
- The score is the exact unweighted arithmetic mean of four class-index-1
  softmax probabilities. It is a signal, not proof, generator attribution,
  localization, or a calibrated probability for every deployment population.
- A completed CLI run writes `predictions.csv`, Track 5-compatible
  `predictions.json` records with exactly `image_path` and `pred`, and
  `predictions.meta.json`. The JSON artifact is atomic at completed-run time;
  CSV and metadata retain the resumable-run contract.
- The paper's two-stage self-distillation describes training only. Training is
  not part of the released live inference path. Do not restore the removed
  upstream `distortion/` training utilities without a separately scoped,
  independently implemented requirement.

## Product surfaces

- `infer/`: authoritative Python model and resumable batch CLI.
- `service/`: optional FastAPI wrapper. It lazy-loads or optionally eager-loads
  one cached model per process, admits one active and one queued analysis, and
  serializes prediction with an inference lock. The image route uses `B=1`;
  the sampled-video frame route uses two-frame microbatches.
- `landing-page/`: public website with `/`, `/try`, `/journey`,
  `/documentation`, and `/documentation/architecture`, plus the
  same-origin `/api/analyze` and `/api/analyze-video` proxies. Short videos are
  decoded locally into eight midpoint PNG samples; the original video is not
  uploaded.
  - `/journey` is the judge-first project and decision narrative.
  - `/documentation` is the readable technical appendix and evidence guide.
  - `/documentation/architecture` is the deep model and system atlas.
- `submission/`: evidence-labeled release package, benchmark tables, model card,
  rights inventory, checksums, and reproduction guide.
- `weights/manifest.json`: identities of the four required external
  checkpoints. Checkpoint binaries are intentionally excluded.

## Evidence rules

- Treat paper facts, released-code behavior, local benchmark evidence, planned
  studies, and deployment guidance as different evidence classes.
- Preserve the V1/V2/V3 boundaries in `submission/BENCHMARKS.md`. A dash means
  unavailable, not zero. V3 is blocked and has no performance result.
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
