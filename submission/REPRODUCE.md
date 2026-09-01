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
├── manifest.json
├── Expert_4_siglip.pth
├── cifake_router_head.pt
├── general_epoch05_head.pt
└── general_epoch08_head.pt
```

Obtain Expert 4 and the three-head bundle from the rights holder or another
authorized source. This repository intentionally publishes no checkpoint
download URL or access code.

The ZIP must be `3,323,126` bytes with SHA-256
`7a8acf6823cc08ba5e7a55def6c2147f95456a3e9f94c8d60d199e503208be54`.
The runtime verifies every extracted file against `weights/manifest.json`.

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

## 5. Recompute aggregate TEST1 metrics

The public Git package includes aggregate metrics and integrity receipts under
`submission/evidence/test1/`, not the 30,000 per-image predictions. If an
authorized evaluator has the checksum-matched prediction table, run the
documented evaluator from the supplied technical evidence repository and
compare its six rows with `metrics_full.csv`.

This step reproduces reporting from existing selected-graph scores. It does not
rerun image pixels through Expert 4 and does not establish latency or VRAM.

## 6. Evidence boundary

- TEST1 is public development evidence, not a locked organizer test.
- No fitting, threshold selection, or checkpoint selection may use protected
  final-evaluation rows.
- Checkpoint binaries, dataset pixels, local paths, private rows, and protected
  per-image scores must remain outside Git.
- Residual-head rights are collaborator-attested and project-owner accepted,
  not independently license-audited here. Expert 4 redistribution and
  organizer eligibility remain separate.
