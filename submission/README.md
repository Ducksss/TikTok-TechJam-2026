# SynthFlag submission package

SynthFlag is the public product. The selected technical graph uses the frozen
FeatDistill Expert 4 checkpoint plus three project-trained residual heads and a
native-size router. Expert 4 remains credited upstream research.

## Start here

- [`BENCHMARKS.md`](BENCHMARKS.md): selected TEST1 results and historical-study boundaries.
- [`MODEL_CARD.md`](MODEL_CARD.md): exact graph, intended use, rights, and eligibility.
- [`ARCHITECTURE.md`](ARCHITECTURE.md): route and score derivation.
- [`REPRODUCE.md`](REPRODUCE.md): environment, artifacts, CLI, and checks.
- [`evidence/test1/`](evidence/test1/): aggregate TEST1 source evidence.
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

## Public-release exclusions

Checkpoint binaries, dataset pixels, private split rows, protected per-image
scores, local paths, secrets, and unlicensed third-party material are excluded.
External artifact links are access locations, not redistribution grants.
