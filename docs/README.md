# SynthFlag documentation hub

This directory is the entry point for teammates, maintainers, and AI tools that
need repository context without reconstructing the project from chat history.

## Start here

| Need | Read or attach to a prompt |
|---|---|
| One high-signal project brief | [`AI_CONTEXT.md`](AI_CONTEXT.md) |
| Recorded product walkthrough | [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0) |
| Copy-paste prompt patterns | [`PROMPTING_GUIDE.md`](PROMPTING_GUIDE.md) |
| Automatic coding-agent guidance | [`../AGENTS.md`](../AGENTS.md) |
| Deterministic development-data augmentation | [`AUGMENTATION_TOOLKIT.md`](AUGMENTATION_TOOLKIT.md) |
| Judge-first project and decision journey | [`../landing-page/app/journey/page.tsx`](../landing-page/app/journey/page.tsx) |
| Detector technical report | [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939) |
| NTIRE challenge report | [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487) |
| Public submission evidence | [`../submission/README.md`](../submission/README.md) |
| Selected TEST1 aggregate evidence | [`../submission/evidence/test1/`](../submission/evidence/test1/) |
| Authoritative model-development, final Drive bundle identity, and full TEST1 record | [`../training_eval/`](../training_eval/) |
| Professor Ng interview and research boundary | [`INTERVIEW_PROF_NG.md`](INTERVIEW_PROF_NG.md) |
| Selected architecture diagram | [`../submission/ARCHITECTURE.svg`](../submission/ARCHITECTURE.svg) and [`../submission/ARCHITECTURE.md`](../submission/ARCHITECTURE.md) |
| Restored historical four-expert atlas | [`../landing-page/app/documentation/architecture/atlas.tsx`](../landing-page/app/documentation/architecture/atlas.tsx), [`../landing-page/app/documentation/architecture/model-journey.tsx`](../landing-page/app/documentation/architecture/model-journey.tsx), and [`../landing-page/public/diagrams/README.md`](../landing-page/public/diagrams/README.md) |
| Brand system | [`BRAND_GUIDE.md`](BRAND_GUIDE.md) |

## Evidence hierarchy

When two documents differ, prefer the narrowest authoritative source:

1. `training_eval/` executed code and machine-readable manifests for project
   model behavior, with `infer/` as the product adapter.
2. Checksum-bound evidence in `training_eval/benchmarks/test1/` and
   `submission/evidence/` for local results.
3. The versioned challenge report for paper-described methods and rankings.
4. Explanatory website copy and diagrams.
5. Plans, status notes, and prompt examples.

Always preserve evidence labels. A paper claim is not automatically a released
code behavior; a local benchmark is not the organizer leaderboard; and a
planned evaluation is not a completed result.

The selected runtime is the Expert 4 plus three-head native-size graph described
in `AI_CONTEXT.md`. Older four-expert diagrams and V1/V2 evidence are historical
unless they have been explicitly revised for the selected graph.

Residual-head rights are collaborator-attested and accepted by the project
owner. That status does not independently audit licenses, grant Expert 4
redistribution, or establish organizer eligibility.

Checkpoint bytes are excluded from Git. The hash-pinned team Google Drive
release linked from [`../weights/README.md`](../weights/README.md) is the final
distribution source.

The Professor Ng interview is research input for a future camera-statistics
study. Its early prototype is absent from the selected runtime and TEST1; the
photo and transcript do not establish model performance or endorsement.

The primary public routes have separate jobs: `/journey` is the judge-first
project narrative and `/documentation` is the unified readable technical
appendix. Documentation shows the current TEST1 architecture first, followed
by the restored interactive V1/V2 trace and 18-diagram four-expert archive with
historical labels. The legacy `/documentation/architecture` route forwards
fragments to the matching current or historical section in `/documentation`.
The `/try` working surface supports one image or eight browser-extracted
midpoint frames from a 1–10 second video; the raw video remains local and the
frame summary is not a video-level probability. Its same-origin proxies bound
request bodies before multipart parsing, and returned video metadata must match
the submitted samples. A configured direct ngrok endpoint is health-probed
before the proxy; analysis POSTs use one selected route and never replay
automatically. The Apple-silicon host procedure and rollback boundary live in
[`deploy/macos/README.md`](../deploy/macos/README.md).

Verify the maintained context set, route inventory, diagram count, and batch
output contract with:

```bash
python scripts/check_repository_context.py
```

Reject byte-identical files from the pinned upstream source snapshot with:

```bash
python scripts/check_source_provenance.py
```
