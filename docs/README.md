# SynthFlag documentation hub

This directory is the entry point for teammates, maintainers, and AI tools that
need repository context without reconstructing the project from chat history.

## Start here

| Need | Read or attach to a prompt |
|---|---|
| One high-signal project brief | [`AI_CONTEXT.md`](AI_CONTEXT.md) |
| Copy-paste prompt patterns | [`PROMPTING_GUIDE.md`](PROMPTING_GUIDE.md) |
| Automatic coding-agent guidance | [`../AGENTS.md`](../AGENTS.md) |
| Implementation provenance and upstream snapshot audit | [`IMPLEMENTATION_PROVENANCE.md`](IMPLEMENTATION_PROVENANCE.md) |
| Deterministic development-data augmentation | [`AUGMENTATION_TOOLKIT.md`](AUGMENTATION_TOOLKIT.md) |
| Judge-first project and decision journey | [`../landing-page/app/journey/page.tsx`](../landing-page/app/journey/page.tsx) |
| Detector technical report | [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939) |
| NTIRE challenge report | [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487) |
| Public submission evidence | [`../submission/README.md`](../submission/README.md) |
| Selected TEST1 aggregate evidence | [`../submission/evidence/test1/`](../submission/evidence/test1/) |
| Detailed architecture diagrams | [`../landing-page/app/documentation/architecture/atlas.tsx`](../landing-page/app/documentation/architecture/atlas.tsx) and [`../landing-page/public/diagrams/`](../landing-page/public/diagrams/) |
| Brand system | [`BRAND_GUIDE.md`](BRAND_GUIDE.md) |

## Evidence hierarchy

When two documents differ, prefer the narrowest authoritative source:

1. Executed code and machine-readable manifests for current behavior.
2. Checksum-bound evidence in `submission/evidence/` for local results.
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

The primary public routes have separate jobs: `/journey` is the judge-first
project narrative and `/documentation` is the unified readable technical
appendix, evidence guide, and deepest model and system atlas. The legacy
`/documentation/architecture` route forwards fragments to the same section in
`/documentation`.
The `/try` working surface supports one image or eight browser-extracted
midpoint frames from a 1–10 second video; the raw video remains local and the
frame summary is not a video-level probability. Its same-origin proxies bound
request bodies before multipart parsing, and returned video metadata must match
the submitted samples.

Verify the maintained context set, route inventory, diagram count, and batch
output contract with:

```bash
python scripts/check_repository_context.py
```

Reject byte-identical files from the pinned upstream source snapshot with:

```bash
python scripts/check_source_provenance.py
```
