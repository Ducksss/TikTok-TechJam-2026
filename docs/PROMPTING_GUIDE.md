# Prompting guide for SynthFlag teammates

The repository contains compact project context and links to the primary
research reports. Give an AI only the smallest set that covers the question.

## Recommended context bundles

| Task | Attach or reference |
|---|---|
| Explain SynthFlag to a stakeholder | `docs/AI_CONTEXT.md`, `submission/MODEL_CARD.md` |
| Answer a detector-method question | [Tu et al., arXiv:2603.21939](https://arxiv.org/abs/2603.21939), `docs/AI_CONTEXT.md` |
| Answer a challenge, team, or leaderboard question | [Gushchin et al., arXiv:2604.11487](https://arxiv.org/abs/2604.11487), `docs/AI_CONTEXT.md` |
| Change inference behavior | `AGENTS.md`, `infer/architecture.py`, `infer/preprocessing.py`, `infer/checkpoints.py`, `infer/model.py`, `infer/cli.py`, relevant tests |
| Change development augmentation | `AGENTS.md`, `docs/AUGMENTATION_TOOLKIT.md`, `synthflag_augment/`, `tests/test_augmentation_toolkit.py` |
| Change the service or `/try` flow | `AGENTS.md`, `service/app.py`, both `landing-page/app/api/analyze*` routes, `landing-page/lib/server/multipart.ts`, `landing-page/app/try/page.tsx`, `landing-page/app/try/video-pipeline.tsx`, `landing-page/lib/video-analysis.ts`, relevant frontend tests |
| Edit the judge-first `/journey` route | `AGENTS.md`, `docs/AI_CONTEXT.md`, `landing-page/app/journey/`, relevant benchmark and release sources |
| Edit diagrams or technical documentation | `AGENTS.md`, `docs/AI_CONTEXT.md`, relevant source files, `landing-page/public/diagrams/` |
| Change CLI output or Track 5 submission JSON | `AGENTS.md`, `infer/cli.py`, `tests/test_cli_outputs.py`, `submission/REPRODUCE.md` |
| Discuss benchmarks | `submission/BENCHMARKS.md`, `submission/evidence/test1/README.md`, and the relevant machine-readable files in `submission/evidence/` |
| Discuss the Day 3 research interview or camera-statistics idea | `docs/INTERVIEW_PROF_NG.md`, the public interview-only transcript, and `docs/AI_CONTEXT.md` |
| Review source provenance | `docs/IMPLEMENTATION_PROVENANCE.md`, `scripts/upstream-source-audit.json`, `submission/THIRD_PARTY_NOTICES.md`, `scripts/check_source_provenance.py` |
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
Use https://arxiv.org/abs/2603.21939 for detector-method details,
https://arxiv.org/abs/2604.11487 for challenge/team/results context, and
docs/AI_CONTEXT.md for the repository boundary. Name the source and section
used. Do not transfer claims between NTIRE teams. Distinguish paper-described
training from released inference.
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
service/app.py, and the web proxy/UI as code facts; the externally referenced
research reports as paper facts; submission/evidence as local-result facts; and
the model card as guidance. Add an evidence label to every material claim. Do
not fabricate calibration, localization, attribution, infrastructure, privacy,
or robustness guarantees.
```

### Interpret a score

```text
Using docs/AI_CONTEXT.md and submission/MODEL_CARD.md, explain what a SynthFlag
score of <score> means and does not mean. Mention the exact threshold being
discussed, avoid treating it as proof, and recommend appropriate corroborating
evidence and human review.
```

### Explain TEST1 or a low-FPR operating policy

```text
Use submission/evidence/test1/README.md and
submission/evidence/test1/metrics_full.csv for TEST1 values, then use
docs/AI_CONTEXT.md for the released-model boundary. State that TEST1 contains
15,000 unique public images and 30,000 paired clean/augmented predictions, uses
a fixed 0.5 reporting threshold, and evaluates a benchmark-only corrected-v2
topology rather than the released four-expert infer/ model. For TikTok-like
creator operations, explain why false positives are constrained first, report
TPR at 1% or 5% FPR, and do not claim that 0.5 is a universal moderation cutoff.
```

### Explain the research interview or future camera-statistics work

```text
Use docs/INTERVIEW_PROF_NG.md and the linked interview-only transcript. Explain
the Bayer sampling and demosaicing motivation, why blur and adversarial
camera-statistic injection matter, and what a source-disjoint future study
would require. State that the interview happened on Day 3, the exploratory
prototype had little research time and was not strong or stable enough for a
final claim, and it was not used in the released model, TEST1, or final model
selection. Do not invent a metric or imply endorsement by Professor Ng.
```

## Prompt hygiene

- State whether the answer should describe the paper, released code, local
  benchmarks, the hosted interface, or a proposed future design.
- Ask for file-path citations when accuracy matters.
- Give the AI the exact evidence JSON/Markdown file for metric questions.
- Keep TEST1's corrected-v2 benchmark topology distinct from the released
  four-expert arithmetic mean. Do not transfer TEST1 metrics to `/try`, the
  service, or `infer/`.
- Phrase low-FPR-first as an operating-policy priority, not as proof that the
  fixed `0.5` point meets one FPR target across all datasets. Consequential
  thresholds require separate calibration and human review.
- Keep the Professor Ng interview in the research-input evidence class. The
  photo and transcript document the conversation; they do not establish model
  performance, publication permission, or researcher endorsement.
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
  it is an optional development utility, not a reproduction of the
  paper-described training policy.
- Never paste checkpoint binaries, private rows, per-image protected scores,
  secrets, or restricted dataset content into a prompt.
