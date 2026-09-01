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
| Machine-readable upstream source audit | [`../scripts/upstream-source-audit.json`](../scripts/upstream-source-audit.json) |
| Deterministic development-data augmentation | [`AUGMENTATION_TOOLKIT.md`](AUGMENTATION_TOOLKIT.md) |
| Judge-first project and decision journey | [`../landing-page/app/journey/page.tsx`](../landing-page/app/journey/page.tsx) |
| Detector technical report | [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939) |
| NTIRE challenge report | [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487) |
| Public submission evidence | [`../submission/README.md`](../submission/README.md) |
| TEST1 protocol, metrics, and model boundary | [`../submission/evidence/test1/README.md`](../submission/evidence/test1/README.md) |
| Day 3 Professor Ng interview, photo, transcript, and future plan | [`INTERVIEW_PROF_NG.md`](INTERVIEW_PROF_NG.md) |
| Detailed architecture diagrams | [`../landing-page/app/documentation/architecture/atlas.tsx`](../landing-page/app/documentation/architecture/atlas.tsx) and [`../landing-page/public/diagrams/`](../landing-page/public/diagrams/) |
| Brand system | [`BRAND_GUIDE.md`](BRAND_GUIDE.md) |

## Evidence hierarchy

When two documents differ, prefer the narrowest authoritative source:

1. Executed code and machine-readable manifests for current behavior.
2. Checksum-bound evidence in `submission/evidence/` for local results.
3. The primary research reports for paper-described methods and rankings.
4. Explanatory website copy and diagrams.
5. Plans, status notes, and prompt examples.

Always preserve evidence labels. A paper claim is not automatically a released
code behavior; a local benchmark is not the organizer leaderboard; and a
planned evaluation is not a completed result.

TEST1 is completed public-development evidence, but it evaluates a
benchmark-only corrected-v2 Expert-4/router and stored-head system rather than
the released four-expert `infer/` model. Its 15,000 public images produce 30,000
paired clean/augmented predictions. Keep that model boundary beside every
TEST1 metric. For TikTok-like consequential operations, explain the
low-false-positive-first policy using strict TPR-at-FPR results; do not call the
fixed `0.5` benchmark point a universal moderation threshold.

The Professor Ng interview is research input rather than result evidence. Its
Day 3 local-camera-statistics prototype had little research time, was not strong
or stable enough for a final metric, and did not enter the released model or
TEST1. Keep that boundary beside the photo, transcript, and future-work ideas.

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
