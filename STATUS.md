# SynthFlag project status

Last refreshed: **2026-09-02**. This file records durable release state and
verification gates. It intentionally does not mirror volatile Codex task,
automation, process, or worktree dirtiness state.

## Current authority

- `origin/main` is the public release integration line. No feature branch or
  historical worktree is a permanent integration authority.
- The root `AGENTS.md` is the repository's only automatic coding-agent
  instruction file. `README.md`, `docs/AI_CONTEXT.md`,
  `docs/PROMPTING_GUIDE.md`, and `docs/README.md` are its maintained human- and
  prompt-facing companions.
- Executed code and machine-readable manifests define current behavior.
  Explanatory docs, diagrams, this status file, and hosted surfaces must be
  checked against those sources.
- Run `python scripts/check_repository_context.py` after changing naming,
  routes, output contracts, diagram inventory, evidence state, or agent
  context.

## Released product surfaces

| Surface | Contract |
|---|---|
| Public identity | **SynthFlag** is the product, repository, demo, submission, Python distribution, and primary CLI. The project-trained heads, routing, training/evaluation harness, and TEST1 record are the primary technical contribution; Expert 4 retains dependency attribution. |
| Recorded demo | [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0) is the canonical video walkthrough. It is distinct from current hosted-service reachability. |
| Model development | `training_eval/` is authoritative for the project residual-head implementation, training, deterministic augmentation, route configuration, tests, final three-head Google Drive bundle identity, public TEST1 predictions, bootstrap evidence, and reports. Checkpoint bytes are not tracked in Git. |
| Batch inference | `infer/` uses the authoritative `training_eval.scripts.model.ResidualHead` implementation with the frozen Expert 4 adapter, native-size routing, and resumable directory inference. |
| Development augmentation | `synthflag_augment/` provides repository-authored, sample-keyed image variants and audit traces; it is optional, outside inference, and not paper-described training reproduction. |
| Batch artifacts | A completed run produces `predictions.csv`, Track 5 `predictions.json` records with `image_path,pred`, and `predictions.meta.json`. |
| HTTP service | `service/app.py` exposes checkpoint-backed health, single-image analysis, and bounded sampled-frame analysis with two-frame microbatches; its Mac launch agent runs one eager MPS worker on loopback and does not silently use public CPU inference. |
| Web experience | Primary routes are `/`, `/try`, `/journey`, and the unified `/documentation`; the current TEST1 diagram appears first and the restored interactive V1/V2 trace plus 18 historical SVGs remain visibly labeled as an archive. `/documentation/architecture` preserves legacy fragments. The `/api/analyze` and `/api/analyze-video` proxies bound request bodies before multipart parsing. A configured direct route is health-probed before same-origin fallback, and an analysis POST is never replayed automatically. Raw videos remain in the browser while eight midpoint PNG frames are submitted and response metadata is matched to them. |
| Mac host package | `deploy/macos/` owns pinned ngrok installation, launchd agents, loopback binding, edge route/rate policy, checkpoint/MPS gates, health checks, and rollback. It does not prove that credentials, a public tunnel, or a matching Sites deployment are active. |
| Submission package | `submission/` contains the evidence-labeled benchmarks, architecture, reproduction guide, rights inventory, model card, release audit, and checksums. |
| Attribution and source hygiene | Method, checkpoint, dependency, and source credit is preserved in third-party notices; the release check rejects prohibited source overlap. |

The two long-form web routes are intentionally distinct: `/journey` is the
judge-first project and decision narrative, while `/documentation` combines
the readable technical appendix, current selected-model visual, and restored
historical visual archive. The legacy `/documentation/architecture` route
forwards to the matching current or historical anchor inside `/documentation`.

## Evidence state

| Evidence | State | Boundary |
|---|---|---|
| TEST1 selected-graph diagnostic | Available | 15,000 unique public sources and 30,000 clean/composite evaluations across CIFAKE, SID-Set, and WildFake; public suites were previously inspected and the resolution route is benchmark-aware. |
| Residual-head rights | Attested | The project owner accepts the collaborator's rights-clearance attestation for the project-trained heads and their training inputs; this is not an independent license audit and does not clear Expert 4 redistribution or organizer eligibility. |
| Professor Ng interview | Research input | Day 3 camera-statistics direction only; the early prototype is absent from the selected runtime and TEST1, with no performance claim or endorsement. |
| V1/V2 four-expert studies | Historical | Evidence for the retired four-expert runtime; not evidence for the selected TEST1 graph. |
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
- The Mac/ngrok package and private checkpoint set are prepared, but public
  activation remains **BLOCKED** until the owner enters an ngrok authtoken,
  supplies the assigned domain, and redeploys the existing Site from its owning
  account. Do not create a replacement Site or call scoring live before the
  direct and forced-proxy checks pass from an external network.
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

1. Preserve SynthFlag public naming and Tu et al. research attribution.
2. Preserve the exact selected TEST1 route, `1.25` low-resolution alpha,
   `0.65 / 0.35` large-image blend, and `-1.557959395647049` boundary unless a
   code change is explicitly requested and verified.
3. Keep every checkpoint binary and archive outside Git; use the hash-pinned
   team Google Drive release as the final distribution source. Keep the public
   TEST1 technical record tracked and preserve the separate upstream-checkpoint,
   protected-data, privacy, dataset, and licensing exclusions in
   `submission/RELEASE_AUDIT.md`.
4. Validate relevant tests/builds, JSON, SVG, Markdown links, artifact
   checksums, and `scripts/check_repository_context.py`.
5. Run `scripts/check_source_provenance.py`; only the canonical Apache-2.0
   license may remain byte-identical to the pinned upstream snapshot.
6. Verify deployment, service health, repository metadata, and submission state
   live before making public-readiness claims.
