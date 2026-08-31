# Prompting guide for SynthFlag teammates

The repository now contains both compact context and the complete research
report. Give an AI only the smallest set that covers the question; add the full
report when the task needs challenge or method detail.

## Recommended context bundles

| Task | Attach or reference |
|---|---|
| Explain SynthFlag to a stakeholder | `docs/AI_CONTEXT.md`, `submission/MODEL_CARD.md` |
| Answer a FeatDistill method question | `docs/references/featdistill-report/report.txt`, `docs/AI_CONTEXT.md` |
| Answer a challenge, team, or leaderboard question | `docs/references/ntire-2026-report/report.txt`, `docs/AI_CONTEXT.md` |
| Change inference behavior | `AGENTS.md`, `infer/architecture.py`, `infer/preprocessing.py`, `infer/checkpoints.py`, `infer/model.py`, `infer/cli.py`, relevant tests |
| Change development augmentation | `AGENTS.md`, `docs/AUGMENTATION_TOOLKIT.md`, `synthflag_augment/`, `tests/test_augmentation_toolkit.py` |
| Change the service or `/try` flow | `AGENTS.md`, `service/app.py`, both `landing-page/app/api/analyze*` routes, `landing-page/app/try/page.tsx`, `landing-page/app/try/video-pipeline.tsx`, `landing-page/lib/video-analysis.ts` |
| Edit the judge-first `/journey` route | `AGENTS.md`, `docs/AI_CONTEXT.md`, `landing-page/app/journey/`, relevant benchmark and release sources |
| Edit diagrams or technical documentation | `AGENTS.md`, `docs/AI_CONTEXT.md`, relevant source files, `landing-page/public/diagrams/` |
| Change CLI output or Track 5 submission JSON | `AGENTS.md`, `infer/cli.py`, `tests/test_cli_outputs.py`, `submission/REPRODUCE.md` |
| Discuss benchmarks | `submission/BENCHMARKS.md`, relevant files in `submission/evidence/` |
| Review source provenance | `docs/IMPLEMENTATION_PROVENANCE.md`, `docs/provenance/featdistill-upstream.json`, `NOTICE`, `scripts/check_source_provenance.py` |
| Prepare a public release | `docs/IMPLEMENTATION_PROVENANCE.md`, `submission/RELEASE_AUDIT.md`, `submission/DATASETS_AND_RIGHTS.md`, `submission/THIRD_PARTY_NOTICES.md`, `STATUS.md` |

## Copy-paste prompts

### Explain the project

```text
Use docs/AI_CONTEXT.md as the project contract. Explain SynthFlag to a
nontechnical teammate in five short sections: purpose, image flow, four-expert
model, meaning of the score, and limitations. Keep paper facts, released-code
behavior, and local benchmark evidence clearly labeled.
```

### Answer from the paper

```text
Use docs/references/featdistill-report/report.txt for FeatDistill method details,
docs/references/ntire-2026-report/report.txt for challenge/team/results context,
and docs/AI_CONTEXT.md for the repository boundary. Name the source and section
used. Do not transfer claims from another NTIRE team to UESTC. Distinguish
paper-described training from released inference.
```

### Review a technical claim

```text
Check this claim against the narrowest authoritative repository source listed
in docs/AI_CONTEXT.md. Return: verdict, exact source path, supporting behavior,
and any evidence-label correction. Do not infer behavior from diagrams alone.

Claim: <paste claim here>
```

### Plan a code change

```text
Read AGENTS.md and docs/AI_CONTEXT.md first. Inspect the current implementation,
STATUS.md, Git status, worktree registry, and fresh origin/main. Propose the
smallest implementation plan that preserves inference, protected-evaluation,
and public-release boundaries. Name files, tests, risks, and acceptance checks.

Change requested: <describe change>
```

### Generate new documentation

```text
Create documentation for <audience/topic>. Treat infer/architecture.py,
infer/preprocessing.py, infer/checkpoints.py, infer/model.py, infer/cli.py,
service/app.py, and the web proxy/UI as code facts; the vendored NTIRE report
as paper facts; submission/evidence as local-result facts; and the model card
as guidance. Add an evidence label to every material claim. Do not fabricate
calibration, localization, attribution, infrastructure, privacy, or robustness
guarantees.
```

### Interpret a score

```text
Using docs/AI_CONTEXT.md and submission/MODEL_CARD.md, explain what a SynthFlag
score of <score> means and does not mean. Mention the exact threshold being
discussed, avoid treating it as proof, and recommend appropriate corroborating
evidence and human review.
```

## Prompt hygiene

- State whether the answer should describe the paper, released code, local
  benchmarks, the hosted interface, or a proposed future design.
- Ask for file-path citations when accuracy matters.
- Give the AI the exact evidence JSON/Markdown file for metric questions.
- Recheck `STATUS.md` and Git state for worktree or release questions because
  coordination facts can become stale.
- Keep the site roles distinct: `/journey` is the judge narrative and
  `/documentation` is the unified readable appendix, evidence guide, and deep
  technical atlas. `/documentation/architecture` is a compatibility route for
  legacy links, not a separate information destination.
- Keep image scores distinct from sampled-video summaries: the video mean is a
  descriptive aggregate, not motion analysis or a calibrated video probability.
- After changing naming, routes, output contracts, evidence status, or context
  files, run `python scripts/check_repository_context.py`.
- After changing release source or assets, run
  `python scripts/check_source_provenance.py`.
- Keep `synthflag_augment` out of inference diagrams and protected-final tuning;
  it is an optional development utility, not FeatDistill training reproduction.
- Never paste checkpoint binaries, private rows, per-image protected scores,
  secrets, or restricted dataset content into a prompt.
