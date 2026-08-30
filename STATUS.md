# SynthFlag project status

Last refreshed: **2026-08-31** from the live Git worktree registry, Codex task list, and local automation definitions.

## Naming contract

- **SynthFlag** is the final public product, repository, demo, and submission name.
- **FeatDistill** remains the technically accurate name of the underlying model, released checkpoints, package/inference lineage, and historical experiment evidence. Do not relabel third-party research as SynthFlag.
- New public-facing copy and assets must say SynthFlag; preserve FeatDistill attribution in architecture, methods, and citations.

## Status definitions

| State | Definition |
|---|---|
| **Planned** | Scope and owner are identified, but no reviewable artifact exists yet. |
| **Running** | A task or automation is actively producing or checking the artifact. |
| **Artifact ready** | A reviewable artifact exists in its source worktree but is not integrated. |
| **Integrated** | The selected artifact has been reconciled into `codex/synthflag-submission`. |
| **Verified** | The integrated artifact passed its stated checks with fresh evidence and is submission-ready. |
| **Blocked** | A named dependency is unavailable; no substitute may silently change the contract. |

Codex app states such as `active` and `idle` describe task execution only; the project states above describe deliverable maturity.

## Worktree register

| Workspace | Named branch | Git state | Linked Codex task(s) | Project state | Deliverable and integration decision |
|---|---|---|---|---|---|
| Primary checkout | `main` | **Dirty:** `.gitignore`, `README.md`, `infer/model.py`; untracked `.DS_Store`, `experiments/`, `tests/` | `Finetune model head` — **active**; `Read goal objective file` — **idle**; `Read goal objective file (2)` — **idle** | **Running** | Head fine-tuning, holdout evaluation, follow-up analysis, experiment reports, and tests. Integrate only freshly verified code/results; never tune on protected evaluation data. **Multiple writers currently target this checkout; serialize them before checkpoint or handoff.** |
| Frozen-head experiment worktree | `codex/frozen-encoder-head-finetune` | **Dirty:** `.gitignore`, `README.md`, `infer/model.py`; untracked `.DS_Store`, `experiments/`, `tests/` | `Finetune model head (2)` — **active** | **Running** | Frozen-encoder classifier-head fine-tuning in its own named branch. Reconcile its inherited experiment tree with `main` before accepting results; preserve protected-evaluation isolation and require a fresh report/checksum/test handoff. |
| Brand-site worktree | `codex/synthflag-brand-site` | **Clean:** committed at `cae1653` | `Create Arooth brand guide` — **idle** | **Artifact ready**; deployment **Verified** | SynthFlag brand guide and landing-page source. The live unauthenticated deployment returns HTTP 200; FeatDistill remains only as technical architecture/research credit. Integrate the source selectively after its branch handoff. |
| Brand-assets branch (worktree retired) | `codex/synthflag-brand-assets` | **Clean:** committed at `57f3a40`, synchronized with its upstream; no linked worktree remains | None active; the originating assets task is no longer present | **Artifact ready** | SynthFlag core identity and evidence-system assets are preserved on the named branch. Select and verify the final small public set; do not publish the full historical FeatDistill exploration dump by default. |
| Benchmark-evidence worktree | `codex/benchmark-evidence` | **Dirty:** `.gitignore`, `README.md`, `infer/model.py`; untracked `.DS_Store`, `experiments/`, `tests/` | `Read goal objective file (3)` — **idle** | **Artifact ready**; V3 **Blocked** | V2 benchmark DOCX, reports, metrics, protocols, and verification code. Integrate the evidence-labeled benchmark table only after rerunning its checks. V3 remains blocked on the exact organizer-provided 8,843-image DALL·E Advanced source; do not substitute another dataset. |
| Repository-reskin worktree | `codex/repository-reskin` | **Dirty:** `README.md`, inference/package files; untracked `assets/` | `GitHub` — **idle** | **Artifact ready** | Public README/reskin, CLI/package copy, and hero artwork. Treat as a candidate patch: reconcile with SynthFlag naming and current inference behavior before integration. |
| Corpus-preparation worktree | `codex/wildfake-like-corpus` | **Dirty:** `README.md`, `pyproject.toml`; untracked `config/`, `dataset-requirements.txt`, `docs/`, `scripts/`, `tests/` | `Find WildFake-like datasets` — **active** | **Running** | Commercial-use 25,000-image corpus contract, provenance inventory, preparation script, and tests. Integrate code/manifests/docs only after rights, exact counts, decode, deduplication, overlap, and hash checks; keep pixels and protected benchmarks out of the public package. |
| Submission integration worktree | `codex/synthflag-submission` | **Clean:** definitive package committed for publication | `Find gaps across worktrees` — **active** | **Verified** | Sole integration lane. The README, live demo link, evidence-labeled benchmark table, architecture diagram, reproduction guide, public evidence subset, and checksum manifest are assembled and verified. |

## Active automations

| Automation | Schedule | Target task / checkout | Coordination rule |
|---|---|---|---|
| `Finish FeatDistill follow-up` | Active, hourly | `Read goal objective file` on `main` | May resume scoring and later write analyses/reports. |
| `WildFake holdout progress` | Active, every 10 minutes | `Finetune model head` on `main` | Monitors the holdout run and may drive its completion workflow. |

**Main-checkout warning:** these automations and the active fine-tuning task share the primary checkout. Do not add another writer there. Confirm processes are quiescent, inspect the combined diff, and make one named checkpoint before handoff.

## Definitive submission package

The submission branch is the assembly point; source artifacts remain authoritative until selectively integrated.

| Required item | Current source | State | Acceptance gate |
|---|---|---|---|
| README | Root `README.md` and `submission/README.md` | **Verified** | Public name is SynthFlag; FeatDistill attribution, limitations, install, inference, benchmark, live demo, and reproduction links were checked. |
| Benchmark table | `submission/BENCHMARKS.md` plus copied public evidence | **Verified** | V1/V2/V3 evidence status is explicit; unavailable values use `-`; threshold effects are separated from ranking/model claims; protected-data boundaries remain visible. |
| Demo link | [Live SynthFlag landing page](https://synthflag.chaipinzheng353496.chatgpt.site/) and source on `codex/synthflag-brand-site` | **Verified** | An unauthenticated request returned HTTP 200 with SynthFlag title/metadata/content; the page is explanatory and does not claim to provide browser-based inference. |
| Architecture diagram | `submission/ARCHITECTURE.svg` and `submission/ARCHITECTURE.md` | **Verified** | Valid XML, accessible text companion, technically accurate four-expert flow, and explicit SynthFlag/FeatDistill naming boundary. |
| Reproduction commands | `submission/REPRODUCE.md` | **Verified** | Covers package hashes, environment setup, checkpoint verification, inference, output validation, score interpretation, and private benchmark boundaries. |
| Artifact checksums | `submission/ARTIFACTS.sha256` and `submission/evidence/weights-manifest.json` | **Verified** | All 11 static-package checksum entries pass; checkpoint sizes and hashes are separately preserved without shipping checkpoint binaries. |

## Operating and safety rules

1. One task per worktree; one owner per write surface.
2. Create the named branch immediately, then commit or checkpoint before handoff. Never hand off valuable work on a detached HEAD.
3. Integrate by reviewed commits or narrow patches into `codex/synthflag-submission`; resolve branding and experiment overlaps deliberately.
4. Never train, select features, tune thresholds, or choose checkpoints from protected evaluation data. Keep demo/test/organizer data inaccessible to training.
5. Require commercial-use evidence, pinned provenance, complete omit-source checks, exact balance/count checks, decode validation, hashes, and duplicate/overlap checks before accepting a new corpus.
6. Do not replace the exact organizer DALL·E Advanced set with a convenient substitute, and do not claim blocked or planned work as executed.
7. Keep private data and caches out of Git and the public submission; publish only reproducibility metadata and redistributable artifacts.
8. **No CI is requested.** Verification remains explicit local commands with recorded fresh results.
