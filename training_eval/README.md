# SynthFlag model development and TEST1 record

This directory is the source of truth for the project's model contribution.
It contains the residual-head implementation used by product inference, the
training and deterministic augmentation runners, selected routing contract,
tests, three-head bundle record, and the full public TEST1 evaluation package.

## Selected project graph

```text
frozen Expert 4 feature + teacher margin
  ├─ native longest side <= 64
  │    └─ cifake_router_head.pt at alpha 1.25
  └─ native longest side > 64
       └─ 0.65 * general_epoch05_head margin
        + 0.35 * general_epoch08_head margin
        - (-1.557959395647049) before sigmoid
```

Each project head is implemented in `scripts/model.py`:

```text
LayerNorm(1152) -> Linear(256) -> GELU -> Dropout -> Linear(1)
```

The team Google Drive ZIP is the final distribution source for the three head
binaries. No checkpoint bytes are tracked in Git. The Drive file, bundle hash,
per-head hashes, and routing metadata are pinned by
`weights/head_bundle_manifest.json`, `../infer/checkpoint_manifest.json`, and
`ARTIFACTS.sha256`. The external Expert 4 dependency is downloaded separately
from the same team Drive folder.

## Contents

- `scripts/model.py`: authoritative residual-head implementation and safe loader.
- `scripts/train_head.py`: frozen-feature, source-disjoint head trainer.
- `scripts/augmentations.py`: deterministic label-symmetric robustness views.
- `scripts/evaluate_predictions.py`: auditable binary metric calculator.
- `scripts/verify_bundle.py`: bundle size, hash, and tensor-shape verification.
- `configs/selected_test1.yaml`: exact selected route and parameter contract.
- `tests/`: collaborator-authored model, training, augmentation, evaluation,
  and bundle tests.
- `benchmarks/test1/`: 30,000 public TEST1 rows, metrics, paired bootstrap,
  figures, reports, source card, summary, and integrity record.
- `docs/`: model, augmentation, data-rights, and research-call documentation.

## Verify

```bash
python -m pip install -r training_eval/requirements.txt
python -m pytest -q training_eval/tests
python training_eval/scripts/evaluate_predictions.py \
  training_eval/benchmarks/test1/predictions.csv \
  --label-column label \
  --score-column reported_probability \
  --group-columns dataset view \
  --output-json /tmp/synthflag-test1-summary.json
```

## Rights decision

The project owner accepts the collaborator's attestation that the three heads
and their training inputs are rights-cleared for project use. No replacement
retraining is required for this project release under that decision. This is
not represented as an independent license audit. The external Expert 4
redistribution and organizer eligibility questions remain separate.
