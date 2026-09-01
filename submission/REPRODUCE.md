# Reproduce SynthFlag inference and TEST1 aggregate checks

## 1. Environment

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[server,test]"
```

## 2. Supply verified artifacts

Place these files together:

```text
weights/
├── Expert_4_siglip.pth
├── cifake_router_head.pt
├── general_epoch05_head.pt
└── general_epoch08_head.pt
```

Download the final three-head bundle and Expert 4 file from the team Google
Drive links in `weights/README.md`. Extract the three heads into `weights/` and
place Expert 4 beside them. No checkpoint bytes are tracked in Git. Expected
byte sizes and SHA-256 digests are pinned in
`infer/checkpoint_manifest.json`; the runtime rejects any mismatch.

The final three-head Drive bundle is recorded in
`training_eval/weights/head_bundle_manifest.json`, including its Drive file ID,
bundle hash, per-file hashes, and routing roles. After downloading and
extracting the bundle, verify its included manifest with:

```bash
python training_eval/scripts/verify_bundle.py \
  /path/to/extracted/head_bundle_manifest.json
```

## 3. Run batch inference

```bash
synthflag-infer \
  --images-dir /absolute/path/to/images \
  --out-dir /absolute/path/to/outputs \
  --weights-dir /absolute/path/to/weights \
  --device auto
```

The completed output directory contains:

```text
predictions.csv
predictions.json
predictions.meta.json
```

`predictions.json` contains records with exactly `image_path` and `pred`.
Rerun the same command to resume or use `--overwrite` for a new run.

## 4. Run service and tests

```bash
SYNTHFLAG_WEIGHTS_DIR=/absolute/path/to/weights \
  uvicorn service.app:app --host 127.0.0.1 --port 8000

python -m unittest discover -s tests
python scripts/check_repository_context.py
python scripts/check_source_provenance.py
```

For the website:

```bash
cd landing-page
pnpm test
pnpm lint
pnpm build
```

## 5. Recompute TEST1 metrics from the complete public record

The collaborator-authoritative package includes all 30,000 public-development
prediction rows, the evaluator, metrics, bootstrap evidence, figures, and
integrity receipts under `training_eval/benchmarks/test1/`:

```bash
python training_eval/scripts/evaluate_predictions.py \
  training_eval/benchmarks/test1/predictions.csv \
  --label-column label \
  --score-column reported_probability \
  --group-columns dataset view \
  --output-json /tmp/synthflag-test1-summary.json \
  --output-csv /tmp/synthflag-test1-metrics.csv
```

Compare the regenerated six-row table with
`training_eval/benchmarks/test1/metrics_full.csv` and the submission copy at
`submission/evidence/test1/metrics_full.csv`.

This step reproduces reporting from existing selected-graph scores. It does not
rerun image pixels through Expert 4 and does not establish latency or VRAM.

## 6. Evidence boundary

- TEST1 is public development evidence, not a locked organizer test.
- No fitting, threshold selection, or checkpoint selection may use protected
  final-evaluation rows.
- All checkpoint binaries and archives remain outside Git and are distributed
  through the hash-pinned team Google Drive release. Public TEST1 prediction
  rows remain tracked evidence. Dataset pixels, local paths, private rows, and
  protected per-image scores must remain outside Git.
- Residual-head rights are collaborator-attested and project-owner accepted,
  not independently license-audited here. Expert 4 redistribution and
  organizer eligibility remain separate.
