# SynthFlag project status

Last refreshed: **2026-09-01**. This file records durable release state and
verification gates. It intentionally does not mirror volatile Codex task,
automation, process, or worktree dirtiness state.

## Current authority

- `origin/main` is the public release integration line. No feature branch or
  historical worktree is a permanent integration authority.
- The root `AGENTS.md` is the repository's only automatic coding-agent
  instruction file. `docs/AI_CONTEXT.md`, `docs/PROMPTING_GUIDE.md`, and
  `docs/README.md` are its maintained human- and prompt-facing companions.
- Executed code and machine-readable manifests define current behavior.
  Explanatory docs, diagrams, this status file, and hosted surfaces must be
  checked against those sources.
- Run `python scripts/check_repository_context.py` after changing naming,
  routes, output contracts, diagram inventory, evidence state, or agent
  context.

## Released product surfaces

| Surface | Contract |
|---|---|
| Public identity | **SynthFlag** is the product, repository, demo, submission, Python distribution, and primary CLI. **FeatDistill** is the attributed UESTC detector and checkpoint lineage. |
| Batch inference | Repository-authored modules under `infer/` implement the checkpoint-verified FeatDistill-compatible four-expert mean and resumable directory inference. |
| Development augmentation | `synthflag_augment/` provides repository-authored, sample-keyed image variants and audit traces; it is optional, outside inference, and not FeatDistill training reproduction. |
| Batch artifacts | A completed run produces `predictions.csv`, Track 5 `predictions.json` records with `image_path,pred`, and `predictions.meta.json`. |
| HTTP service | `service/app.py` exposes checkpoint-backed health, single-image analysis, and bounded sampled-frame analysis with two-frame microbatches; it does not make the public worker available by itself. |
| Web experience | Source routes are `/`, `/try`, `/journey`, `/documentation`, and `/documentation/architecture`, plus `/api/analyze` and `/api/analyze-video` proxies. Raw videos remain in the browser while eight midpoint PNG frames are submitted. |
| Submission package | `submission/` contains the evidence-labeled benchmarks, architecture, reproduction guide, rights inventory, model card, release audit, and checksums. |
| Source provenance | The initial copied snapshot is disclosed; the current runtime is independently organized, exact upstream files are rejected, and historical method/code credit is preserved. |

The long-form web routes are intentionally distinct: `/journey` is the
judge-first project and decision narrative, `/documentation` is the readable
technical appendix, and `/documentation/architecture` is the deep model and
system atlas.

## Evidence state

| Evidence | State | Boundary |
|---|---|---|
| V1 calibration | Available | 2,004 development rows; configuration and threshold selection permitted. |
| V1 protected final | Available | 7,998 rows; not used for fitting, checkpoint choice, or threshold selection. |
| V2 retrospective development study | Available | Duplicate-grouped cross-validation and corruptions on the 2,004-row development evidence; not a second protected final test. |
| V3 | **Blocked** | Exact organizer 8,843-image DALL-E Advanced source absent; no substitute and no metric. |

A dash in the public benchmark table means unavailable, never zero. Partial
caches, framework tests, package checks, one-image scores, or planned protocols
are not benchmark results.

## External-state boundary

Repository source does not prove that a deployment is reachable, its inference
worker is connected, the GitHub repository is public, its About fields are
saved, or a Devpost draft is complete. Recheck those systems at action time.

- Verify the deployed routes over HTTP and inspect `/api/analyze` health and
  advertised `sampled_video_frames` capability before calling the demo live.
- `connected: false` or `ready: false` means the UI cannot provide a live
  checkpoint-backed score, even when the page itself loads.
- Never claim a GitHub visibility/About change, media upload, or Devpost save or
  submission until the external service confirms it.

## Worktree and release discipline

Worktree state changes too quickly to copy here. Before editing or integrating,
inspect it directly:

```bash
git status --short --branch
git worktree list --porcelain
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
```

Use one named `codex/` branch and one owner per write surface. Preserve unrelated
changes. Integrate reviewed commits into fresh `origin/main`, rerun checks,
refetch before pushing, and never force-push the release branch.

## Release gates

1. Preserve SynthFlag/FeatDistill naming and research attribution.
2. Preserve the exact released four-expert score unless a code change is
   explicitly requested and verified.
3. Preserve protected-evaluation, privacy, checkpoint, dataset, and licensing
   exclusions documented in `submission/RELEASE_AUDIT.md`.
4. Validate relevant tests/builds, JSON, SVG, Markdown links, artifact
   checksums, and `scripts/check_repository_context.py`.
5. Run `scripts/check_source_provenance.py`; only the canonical Apache-2.0
   license may remain byte-identical to the pinned upstream snapshot.
6. Verify deployment, service health, repository metadata, and submission state
   live before making public-readiness claims.
