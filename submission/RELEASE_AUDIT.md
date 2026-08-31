# SynthFlag licensing and release audit

Audit date: **2026-08-31**

## Verdict

**PASS for public release of the tracked Git source tree, with enforced
exclusions.** The release is suitable for publication because checkpoint
binaries, dataset pixels, private split rows, and per-image protected scores
are not tracked. Those exclusions are mandatory: the audit did not establish a
redistribution grant for the four fine-tuned checkpoints, SID-Set, WildFake as
a combined dataset, COCO image pixels as a collection, or the private
organizer DALL-E Advanced set.

This is a technical release-readiness verdict, not a legal opinion.

## Requirement-to-evidence matrix

| Requirement or risk | Evidence | Result |
|---|---|---|
| Repository code license | Root `LICENSE` is the Apache License 2.0 text; README links it and separates third-party rights. | **Pass** |
| Dependency attribution | Pinned runtime and optional dependencies are listed with declared licenses and primary license URLs in `THIRD_PARTY_NOTICES.md`. | **Pass** |
| Base-model attribution | CLIP and SigLIP identifiers, model cards, licenses/limitations, and FeatDistill lineage are documented. | **Pass** |
| Fine-tuned checkpoint permission | No explicit redistribution license was located; `.gitignore` excludes common model formats and the Git tree contains no checkpoint binary. | **Pass by exclusion** |
| Dataset attribution | CIFAKE, SID-Set, WildFake, COCO, and organizer DALL-E roles and rights evidence are documented. | **Pass** |
| Dataset redistribution | No dataset pixels, captions, masks, prompts, or private row-level manifests are tracked. Ambiguous sources are non-redistributable by policy. | **Pass by exclusion** |
| Model card | Intended uses, out-of-scope uses, data statement, metrics, thresholds, limitations, integrity, and responsible operation are documented in `MODEL_CARD.md`. | **Pass** |
| Responsible-use wording | README, submission overview, and model card state that scores are signals rather than proof and require human review for consequential use. | **Pass** |
| Public artifact integrity | All 15 entries in `ARTIFACTS.sha256` were verified; checkpoint identity is separately recorded without shipping binaries. | **Pass** |
| Public visual provenance | The project wordmark and architecture diagram remain. The unused challenge-site screenshot was removed because its redistribution rights were undocumented. | **Pass** |
| Vendored research reports | The versioned FeatDistill and NTIRE arXiv HTML pages declare CC BY 4.0. Their snapshots, referenced paper figures, modified plain-text extractions, attribution, source URLs, retrieval times, and hashes are recorded under `docs/references/`. | **Pass** |

## Release contents

Allowed in the public Git release:

- original source code, configuration, and documentation covered by the root
  repository license;
- the SynthFlag wordmark and project-created architecture diagram;
- aggregate benchmark tables, non-row-level reports, protocols, and hashes;
- checkpoint filenames, expected sizes, and SHA-256 identities; and
- citations and links to separately hosted upstream material.
- the attributed, version-pinned FeatDistill and NTIRE report snapshots and
  figures under their declared CC BY 4.0 licenses.

Excluded from the public Git release:

- `Expert_*.pth` and all other model binaries;
- dataset images, prompts, captions, masks, and private manifests;
- protected split membership, local paths, and per-image protected scores;
- the organizer-provided DALL-E Advanced set; and
- third-party screenshots or promotional artwork without a documented grant.

## Maintainer release checklist

1. Run `git ls-files` and confirm no checkpoint, dataset, private-score, secret,
   cache, or local-path artifact is tracked.
2. Run `cd submission && shasum -a 256 -c ARTIFACTS.sha256`.
3. Validate every JSON evidence file and parse `ARCHITECTURE.svg` as XML.
4. Install pinned dependencies in a clean environment and run
   `python -m infer --help` plus `python -m pip check`.
5. Confirm the README, model card, dataset inventory, and third-party notices
   link to current primary sources.
6. Reconfirm that `origin/main` has not advanced before pushing.
7. Never attach checkpoints or dataset pixels to a GitHub release unless the
   exact artifact has documented redistribution permission.

## Residual boundaries

- The audit did not reconstruct the complete training-data provenance of the
  upstream fine-tuned checkpoints.
- It did not perform trademark clearance for the SynthFlag name or artwork.
- External source terms can change; re-audit before a new binary/data release.
- A source-code release pass does not certify a hosted deployment's privacy,
  security, accessibility, or regulatory compliance.
