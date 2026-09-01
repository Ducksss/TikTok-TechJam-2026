# SynthFlag submission package

SynthFlag is the public product. Its primary technical contribution is the
project's three trained residual heads, native-size router, training and
augmentation implementation, and full TEST1 evaluation record. Product
inference uses those artifacts over a frozen Expert 4 dependency.

## Start here

- [**SynthFlag demo v8**](https://youtu.be/X5-J4NmNHl0): canonical recorded
  product walkthrough; separate from live worker availability.
- [`BENCHMARKS.md`](BENCHMARKS.md): selected TEST1 results and historical-study boundaries.
- [`MODEL_CARD.md`](MODEL_CARD.md): exact graph, intended use, rights, and eligibility.
- [`ARCHITECTURE.md`](ARCHITECTURE.md): route and score derivation.
- [`REPRODUCE.md`](REPRODUCE.md): environment, artifacts, CLI, and checks.
- [`evidence/test1/`](evidence/test1/): aggregate TEST1 source evidence.
- [`evidence/README.md`](evidence/README.md): current-versus-historical evidence map.
- [`../training_eval/`](../training_eval/): authoritative model-development
  implementation, configs, tests, row-level TEST1 evidence, and reports.
- [`../docs/INTERVIEW_PROF_NG.md`](../docs/INTERVIEW_PROF_NG.md): Professor Ng
  interview, transcript boundary, and future-work plan.
- [`ARTIFACTS.sha256`](ARTIFACTS.sha256): release artifact checksums.
- [`DATASETS_AND_RIGHTS.md`](DATASETS_AND_RIGHTS.md): dataset and redistribution inventory.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md): upstream notices.
- [`RELEASE_AUDIT.md`](RELEASE_AUDIT.md): public inclusion/exclusion gates.

## Selected score

For native longest side `<=64`, score is sigmoid of the Expert 4 teacher margin
plus `1.25` times the CIFAKE head correction. Larger images blend corrected
epoch-05 and epoch-08 margins `0.65 / 0.35` and subtract the frozen margin
boundary `-1.557959395647049` before sigmoid.

The completed CLI writes `predictions.csv`, `predictions.meta.json`, and atomic
Track 5 `predictions.json` records containing exactly `image_path` and `pred`.

## Evidence headline

TEST1 evaluates 15,000 unique public images clean and under deterministic
composite corruption. Descriptive macro AUC is `0.9324` clean and `0.8773`
composite. TEST1 is not TikTok's hidden test, the route is benchmark-aware, and
residual-head rights are collaborator-attested and accepted by the project
owner rather than independently audited in this repository.

Older V1/V2 files measure the retired four-expert probability-mean runtime and
are retained only for audit history. V3 remains blocked; no missing result has
been converted to zero or estimated.

The Day 3 Professor Ng interview is research input, not performance evidence
or endorsement. Its early camera-statistics prototype is not part of the
selected runtime or TEST1.

## Public-release exclusions

The external Expert 4 binary, dataset pixels, private split rows, protected
per-image scores, local paths, secrets, and unlicensed third-party material are
excluded. The three project residual-head binaries and public TEST1 row-level
predictions are tracked, hash-pinned project artifacts.
