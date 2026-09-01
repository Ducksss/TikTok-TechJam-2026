# SynthFlag licensing and release audit

Audit date: **2026-09-01**

## Verdict

**PASS for public release of the current tracked Git tree, with enforced
exclusions and third-party attribution.** The release is suitable for
publication because prohibited upstream runtime/training source, the external
Expert 4 binary, dataset pixels, private split rows, and per-image
protected scores are not tracked in the current tree. Those exclusions are
mandatory: the audit did not establish a redistribution grant for Expert 4,
SID-Set, WildFake as a combined dataset, COCO image pixels as a collection, or
the private organizer DALL-E Advanced set. The project owner separately accepts
the collaborator's rights-clearance attestation for the residual heads and
their training inputs; the audit records but did not independently verify it.

This is a technical release-readiness verdict, not a legal opinion.

## Requirement-to-evidence matrix

| Requirement or risk | Evidence | Result |
|---|---|---|
| Repository code license | Root `LICENSE` is the Apache License 2.0 text; README links it and separates third-party rights. | **Pass** |
| Source attribution and hygiene | `THIRD_PARTY_NOTICES.md` records upstream attribution; the embedded digest inventory and source check reject prohibited upstream files except the canonical license. | **Pass** |
| Current implementation boundary | `training_eval/` contains the collaborator-authoritative residual-head model, training, deterministic augmentation, evaluation, configs, tests, and complete TEST1 record. `infer/` imports that head implementation and adapts it to the product encoder/service/CLI contract. | **Pass** |
| Dependency attribution | Pinned runtime dependencies are listed with declared licenses and primary license URLs in `THIRD_PARTY_NOTICES.md`. | **Pass** |
| Base-model attribution | SigLIP identifiers, model card, license/limitations, and Tu et al. Expert 4 lineage are documented. | **Pass** |
| Checkpoint and head permission | Expert 4 redistribution is unproven and its binary remains excluded. The exact collaborator Drive ZIP and three extracted residual heads are tracked first-party project artifacts under the collaborator attestation accepted by the project owner; ZIP identity, file hashes, and tensor shapes are verified. | **Pass by exclusion for Expert 4; head attestation accepted** |
| Dataset attribution | CIFAKE, SID-Set, WildFake, COCO, and organizer DALL-E roles and rights evidence are documented. | **Pass** |
| Dataset redistribution | No dataset pixels, captions, masks, prompts, or private row-level manifests are tracked. Ambiguous sources are non-redistributable by policy. | **Pass by exclusion** |
| Model card | Intended uses, out-of-scope uses, data statement, metrics, thresholds, limitations, integrity, and responsible operation are documented in `MODEL_CARD.md`. | **Pass** |
| Responsible-use wording | README, submission overview, and model card state that scores are signals rather than proof and require human review for consequential use. | **Pass** |
| TEST1 evidence boundary | `training_eval/benchmarks/test1/` publishes the 30,000 public-development prediction rows, metrics, paired bootstrap, figures, reports, and integrity record. Dataset pixels, local manifests, cached features/logits, protected rows, and the external checkpoint remain excluded. | **Pass by public technical record** |
| Day 3 interview evidence | The team supplied a call image and automated transcript. The public copy ends with the researcher interview, excludes later internal chatter, and is labeled as research input rather than performance evidence or endorsement. Publication/likeness permission for every depicted or named participant was not independently verified. | **Conditional: maintainers must confirm consent** |
| Public artifact integrity | All entries in `ARTIFACTS.sha256` and `training_eval/ARTIFACTS.sha256` were verified. The three project-head binaries are shipped and hash-pinned; the external Expert 4 identity is recorded without shipping that binary. | **Pass** |
| Public visual provenance | The project wordmark, architecture diagram, and Devpost thumbnail remain. The thumbnail derives only from project-created SynthFlag brand assets; the unused challenge-site screenshot was removed because its redistribution rights were undocumented. | **Pass** |
| External research reports | The Tu et al. detector report and NTIRE challenge report are cited through their primary publication pages; no copies are included in this repository. | **Pass** |

## Release contents

Allowed in the public Git release:

- current repository-authored source code, configuration, and documentation
  covered by the root repository license;
- the authoritative `training_eval/` project model-development and TEST1 stack,
  including its source, configs, tests, reports, public row-level predictions,
  figures, and package integrity record;
- the optional `synthflag_augment/` development utility and its tests, which
  do not participate in released inference or reproduce upstream training;
- the SynthFlag wordmark, project-created architecture diagram, and Devpost
  thumbnail;
- aggregate benchmark tables, public TEST1 row-level predictions, reports,
  protocols, figures, bootstrap evidence, and hashes;
- TEST1 aggregate metrics and paired deltas for the selected Expert 4 plus
  three-head runtime, with its public-development and routing limits attached;
- the team-supplied Day 3 interview image and interview-only transcript, after
  maintainers confirm publication and likeness consent for depicted and named
  participants;
- the exact collaborator Drive head ZIP, three extracted residual-head
  binaries, checkpoint filenames, expected sizes, and SHA-256 identities; and
- citations and links to separately hosted upstream material.

Excluded from the public Git release:

- `Expert_4_siglip.pth` and other external or unverified model binaries;
- dataset images, prompts, captions, masks, and private manifests;
- protected split membership, local paths, and per-image protected scores;
- private or protected row-level predictions, local source manifests, cached
  features/logits, and local benchmark protocol paths;
- internal post-interview team chatter from the supplied automated transcript;
- the organizer-provided DALL-E Advanced set; and
- third-party screenshots or promotional artwork without a documented grant;
  and
- source or assets rejected by the repository source-hygiene check, except the
  canonical Apache-2.0 license text.

## Maintainer release checklist

1. Run `git ls-files` and confirm the three expected project heads are tracked
   while no external checkpoint, dataset pixel, private score, secret, cache,
   or local-path artifact is tracked.
2. Run `cd submission && shasum -a 256 -c ARTIFACTS.sha256`.
   Then run `cd ../training_eval && shasum -a 256 -c ARTIFACTS.sha256`.
3. Validate every JSON evidence file and parse `ARCHITECTURE.svg` as XML.
4. Run `python scripts/check_source_provenance.py` and confirm that no
   prohibited exact upstream file is present.
5. Install pinned dependencies in a clean environment and run
   `python -m infer --help` plus `python -m pip check`.
6. Confirm the README, model card, dataset inventory, and third-party notices
   link to current primary sources.
7. Reconfirm that `origin/main` has not advanced before pushing.
8. Never attach the external Expert 4 checkpoint or dataset pixels to a GitHub
   release without a documented redistribution grant. Preserve the three
   project-head hashes on every release.
9. Confirm publication and likeness consent for every depicted or named
   participant before broadly redistributing the interview image or transcript.

## Residual boundaries

- Residual-head rights rely on a collaborator attestation accepted by the
  project owner; supporting license records were not independently audited in
  this repository.
- The audit did not reconstruct the complete training-data provenance of
  upstream Expert 4.
- It did not perform trademark clearance for the SynthFlag name or artwork.
- External source terms can change; re-audit before a new binary/data release.
- The audit records the team's authorization to add the interview evidence but
  does not establish consent from every depicted or named participant.
- A source-code release pass does not certify a hosted deployment's privacy,
  security, accessibility, or regulatory compliance.
