# Prompting guide for SynthFlag teammates

The repository contains compact project context and links to the primary
research papers. Give an AI only the smallest set that covers the question;
consult the papers when the task needs challenge or method detail.

## Recommended context bundles

| Task | Attach or reference |
|---|---|
| Explain SynthFlag to a stakeholder | `docs/AI_CONTEXT.md`, `submission/MODEL_CARD.md`, and [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0) when a recorded walkthrough helps |
| Answer a Tu et al. method question | [arXiv:2603.21939](https://arxiv.org/abs/2603.21939), `docs/AI_CONTEXT.md` |
| Answer a challenge, team, or leaderboard question | [arXiv:2604.11487](https://arxiv.org/abs/2604.11487), `docs/AI_CONTEXT.md` |
| Change inference behavior | `AGENTS.md`, `training_eval/scripts/model.py`, `training_eval/configs/selected_test1.yaml`, `training_eval/tests/`, then the `infer/` product adapter and relevant tests |
| Change development augmentation | `AGENTS.md`, `docs/AUGMENTATION_TOOLKIT.md`, `synthflag_augment/`, `tests/test_augmentation_toolkit.py` |
| Change the service or `/try` flow | `AGENTS.md`, `service/app.py`, both `landing-page/app/api/analyze*` routes, `landing-page/lib/server/multipart.ts`, `landing-page/lib/inference-transport.ts`, `landing-page/app/try/page.tsx`, `landing-page/app/try/video-pipeline.tsx`, `landing-page/lib/video-analysis.ts`, relevant frontend tests |
| Operate the Mac public worker | `deploy/macos/README.md`, `deploy/macos/templates/`, `infer/checkpoint_manifest.json`, `service/README.md`, `STATUS.md` |
| Edit the judge-first `/journey` route | `AGENTS.md`, `docs/AI_CONTEXT.md`, `landing-page/app/journey/`, relevant benchmark and release sources |
| Edit diagrams or technical documentation | `AGENTS.md`, `docs/AI_CONTEXT.md`, relevant source files, `landing-page/public/diagrams/` |
| Change CLI output or Track 5 submission JSON | `AGENTS.md`, `infer/cli.py`, `tests/test_cli_outputs.py`, `submission/REPRODUCE.md` |
| Discuss selected-model benchmarks | `submission/BENCHMARKS.md`, `submission/evidence/test1/`, `submission/MODEL_CARD.md` |
| Review attribution and licensing | `submission/THIRD_PARTY_NOTICES.md`, `submission/MODEL_CARD.md`, `scripts/check_source_provenance.py` |
| Prepare a public release | `submission/RELEASE_AUDIT.md`, `submission/DATASETS_AND_RIGHTS.md`, `submission/THIRD_PARTY_NOTICES.md`, `STATUS.md` |

## Copy-paste prompts

### Explain the project

```text
Use docs/AI_CONTEXT.md as the project contract. Explain SynthFlag to a
nontechnical teammate in five short sections: purpose, image flow, frozen
Expert 4 plus routed residual heads, meaning of the score, and limitations. Keep paper facts, released-code
behavior, and local benchmark evidence clearly labeled.
```

### Answer from the paper

```text
Use Tu et al., arXiv:2603.21939, for method details; Gushchin et al.,
arXiv:2604.11487, for challenge/team/results context; and docs/AI_CONTEXT.md for
the repository boundary. Name the source and section used. Do not transfer
claims between NTIRE teams. Distinguish paper-described training from released
inference.
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
Create documentation for <audience/topic>. Treat training_eval/scripts/model.py
and training_eval/configs/selected_test1.yaml as the project-model source of
truth; treat infer/ as its product adapter and service/app.py plus the web
proxy/UI as delivery code facts. Treat the vendored NTIRE report as paper
facts, training_eval/benchmarks/test1 as primary local-result facts, and the
model card as guidance. Add an evidence label to every material claim. Do not
fabricate calibration, localization, attribution, infrastructure, privacy, or
robustness guarantees.
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
- Treat [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0) as a recorded
  walkthrough, not proof that the hosted inference worker is currently live.
- Ask for file-path citations when accuracy matters.
- Give the AI the exact evidence JSON/Markdown file for metric questions.
- Treat `training_eval/` as the source of truth for the project's model
  implementation, training, augmentation, selected route, tests, and TEST1
  evidence. Treat `infer/` as the product adapter around that implementation.
- Treat TEST1 as the selected-graph public development diagnostic. Treat V1/V2
  as historical four-expert evidence and V3 as blocked.
- Treat the Professor Ng interview as research input for a future
  camera-statistics study, not performance evidence or endorsement; its early
  prototype is not part of the selected runtime or TEST1.
- Describe residual-head rights as collaborator-attested and project-owner
  accepted, not independently audited. Keep Expert 4 redistribution and
  organizer eligibility as separate unresolved questions.
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
  it is an optional development utility, not paper-described training reproduction.
- Never paste checkpoint binaries, private rows, per-image protected scores,
  secrets, or restricted dataset content into a prompt. All checkpoint bytes
  are excluded from Git; the three project heads and Expert 4 are distributed
  through the hash-pinned team Google Drive release. Public TEST1 predictions
  remain tracked evidence.
