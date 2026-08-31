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
| Judge-first project and decision journey | [`../landing-page/app/journey/page.tsx`](../landing-page/app/journey/page.tsx) |
| Full FeatDistill technical report | [`references/featdistill-report/report.txt`](references/featdistill-report/report.txt) |
| Full NTIRE challenge report as text | [`references/ntire-2026-report/report.txt`](references/ntire-2026-report/report.txt) |
| Original arXiv HTML snapshots and figures | [`references/featdistill-report/README.md`](references/featdistill-report/README.md) and [`references/ntire-2026-report/README.md`](references/ntire-2026-report/README.md) |
| Public submission evidence | [`../submission/README.md`](../submission/README.md) |
| Detailed architecture diagrams | [`../landing-page/app/documentation/architecture/page.tsx`](../landing-page/app/documentation/architecture/page.tsx) and [`../landing-page/public/diagrams/`](../landing-page/public/diagrams/) |
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

The public routes have separate jobs: `/journey` is the judge-first project
narrative, `/documentation` is the readable technical appendix, and
`/documentation/architecture` is the deepest model and system atlas.

Verify the maintained context set, route inventory, diagram count, and batch
output contract with:

```bash
python scripts/check_repository_context.py
```

Reject byte-identical files from the pinned upstream source snapshot with:

```bash
python scripts/check_source_provenance.py
```

Verify both vendored reports, their figures, metadata, and checksums with:

```bash
python scripts/verify_reference_snapshots.py
```
