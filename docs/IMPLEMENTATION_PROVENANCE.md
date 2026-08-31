# SynthFlag implementation provenance

SynthFlag is a repository-authored integration and inference implementation for
the published FeatDistill detector method and its four externally supplied
checkpoints. It is not a claim that SynthFlag researchers originated the
FeatDistill architecture, training method, or checkpoint weights.

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

SynthFlag Infer 2.0 was reorganized and rewritten around public,
testable contracts:

- `infer/checkpoints.py` owns manifest parsing, file identity, safe tensor-only
  deserialization, and checkpoint-set identity;
- `infer/architecture.py` declares the checkpoint-compatible CLIP and SigLIP
  expert graph and the exact four-probability mean;
- `infer/preprocessing.py` owns RGB conversion, bicubic short-edge resize,
  center crop, tensor conversion, and backbone normalization;
- `infer/model.py` is the stable Python scoring API;
- `infer/outputs.py` owns resumable CSV, atomic Track 5 JSON, metadata, and
  output-directory locking; and
- `infer/cli.py` coordinates directory inference through those boundaries.

Checkpoint parameter keys constrain some module attribute names and the binary
head layout. Those compatibility requirements come from the external state
dictionaries; they are not presented as original model research.

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

## Verification record

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

The representative family-level A/B plus the four-checkpoint schema check and
fusion test establish the compatibility seams. It was not a second full
four-expert benchmark run, and it does not create new performance evidence.

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
