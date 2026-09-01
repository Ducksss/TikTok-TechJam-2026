# SynthFlag implementation provenance

SynthFlag is a repository-authored integration around the frozen FeatDistill
Expert 4 checkpoint and project-trained residual heads. It is not a claim that
SynthFlag researchers originated or trained Expert 4.

## Historical finding

The repository's root commit, `360624e71303c27e21a9725895b86e62f722076d`,
was compared with `tzlkkk/FeatDistill` commit
`6feb63ef12a3bd38c8d7ade98183c5f727a0c62d`. Twenty of the 21 tracked files in
that root commit had identical Git blobs; only `.gitignore` differed. The two
repositories do not share commit ancestry, but the file evidence establishes
that the repository began from a copied source snapshot.

That history is disclosed instead of being hidden. Historical FeatDistill
source remains available through earlier Git commits under its Apache License
2.0 terms. Rewriting public history is a separate repository-administration
decision and is not required to understand the present source tree.

## Current implementation boundary

SynthFlag Infer 3.0 uses the independently organized runtime boundaries from
Infer 2.0 while replacing the retired four-expert score with the collaborator's
selected TEST1 graph:
testable contracts:

- `infer/checkpoints.py` owns manifest parsing, file identity, safe tensor-only
  deserialization, and checkpoint-set identity;
- `infer/architecture.py` declares the checkpoint-compatible Expert 4 teacher,
  strict residual-head schema, native-size route, fixed stack, and score conversion;
- `infer/preprocessing.py` owns RGB conversion, 384 px bicubic short-edge resize,
  center crop, tensor conversion, and SigLIP normalization;
- `infer/model.py` is the stable Python scoring API;
- `infer/outputs.py` owns resumable CSV, atomic Track 5 JSON, metadata, and
  output-directory locking; and
- `infer/cli.py` coordinates directory inference through those boundaries.

Expert 4 parameter keys constrain its module attributes and binary teacher-head
layout. The three residual head state dictionaries constrain `norm`, `hidden`,
and `residual` names. Compatibility with those artifacts is not presented as
original model research.

The former `distortion/` package was removed. It was byte-identical upstream
training/degradation code, had no consumer in the released inference, service,
or public benchmark path, and was not needed to support the fixed-weight
detector contract. SynthFlag does not claim to reproduce FeatDistill training.

The later `synthflag_augment/` package does not restore that source. It is a
separately designed development utility with a new namespace, declarative
recipe API, sample-keyed random streams, normalized strengths, and
machine-readable operation traces. It remains outside inference and is not
presented as FeatDistill code or as a reconstruction of its training policy.

## Reimplementation claim

This is an independently organized reimplementation of the released inference
behavior, not a legal "clean-room" claim. The implementation was produced with
knowledge of the public method, checkpoint schema, prior runtime behavior,
model cards, and published reports. FeatDistill attribution therefore remains
mandatory in the model card, technical docs, user interface, and notices.

## Historical Infer 2.0 verification record

On 2026-08-31, the rewritten runtime passed these independent checks:

- all four real checkpoints loaded with strict schema matching: 396 keys and
  no missing or unexpected keys for each CLIP expert, and 452 keys with no
  missing or unexpected keys for each SigLIP expert;
- characterized CLIP and SigLIP preprocessing tensors were byte-identical to
  the prior released behavior;
- a CPU forward pass using a real CLIP checkpoint and a real SigLIP checkpoint
  produced logits exactly equal to the audited upstream runtime, with maximum
  absolute error `0`; and
- the repository test suite covered checkpoint integrity, preprocessing,
  probability fusion, input/output validation, resumable batch artifacts, and
  the source-overlap guard.

That record validates the retired four-expert runtime only. It is not
performance evidence for the selected TEST1 graph.

## Selected TEST1 integration record

On 2026-09-01, integration verified the collaborator-published three-head ZIP
and every extracted head against declared SHA-256 and byte-size identities. The
current runtime then loaded the real upstream Expert 4 checkpoint plus all three
heads with strict tensor schemas and executed both the `<=64` and `>64` routes
on Apple MPS. Aggregate TEST1 metrics are stored under
`submission/evidence/test1/` with the public-development, routing, rights, and
eligibility boundaries attached.

## Mechanical guard

`docs/provenance/featdistill-upstream.json` pins the audited upstream commit and
SHA-256 digest of every upstream file. Run:

```bash
python scripts/check_source_provenance.py
```

The check scans tracked and untracked release candidates and rejects any file
that is byte-identical to the audited upstream snapshot. The canonical
Apache-2.0 `LICENSE` text is the sole intentional exception. This guard detects
exact snapshot reintroduction; it does not replace human authorship review or
license compliance. The new augmentation package is covered by the same guard
and by behavioral tests that exercise its separate public contract.
