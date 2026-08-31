# SynthFlag repository context for AI agents

Read this file before proposing or changing repository content. For a fuller
project brief, read [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md). For primary
research, use the prompt-friendly FeatDistill
[`report.txt`](docs/references/featdistill-report/report.txt) and NTIRE
[`report.txt`](docs/references/ntire-2026-report/report.txt) snapshots.

## Naming and attribution

- **SynthFlag** is the public product, repository, demo, submission, Python
  package, and primary CLI name.
- **FeatDistill** is the underlying UESTC detector architecture, checkpoint,
  and research lineage. Do not present it as original SynthFlag research.
- The NTIRE report describes many teams. Claims about MICV, Ant International,
  TeleAI, INTSIG, Vincentlc, Reagvis Labs, UESTC, PSU, or Shallow Real are not
  interchangeable.

## Released inference contract

- Source of truth: `infer/model.py`.
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
- The paper's two-stage self-distillation describes training only. Training is
  not part of the released live inference path.

## Product surfaces

- `infer/`: authoritative Python model and resumable batch CLI.
- `service/`: optional FastAPI wrapper. It lazy-loads or optionally eager-loads
  one cached model per process and serializes prediction with an inference lock.
- `landing-page/`: public website with `/`, `/try`, `/documentation`, and
  `/documentation/architecture`.
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
  check Markdown links, inspect the diff, refetch, and push without force.
