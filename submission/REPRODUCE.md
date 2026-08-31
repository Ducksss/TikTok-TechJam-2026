# Reproduce SynthFlag inference and verify the submission

Run these commands from the repository root unless a section says otherwise.
They match the checked-in package metadata and CLI arguments.

Before downloading external checkpoints or data, read the
[model card](MODEL_CARD.md), [dataset rights inventory](DATASETS_AND_RIGHTS.md),
[third-party notices](THIRD_PARTY_NOTICES.md), and
[release audit](RELEASE_AUDIT.md). Reproduction instructions do not grant
redistribution rights for any external artifact.

## 1. Verify the static submission package

```bash
cd submission
shasum -a 256 -c ARTIFACTS.sha256
cd ..
```

The checksum manifest excludes itself to avoid a self-referential hash.

## 2. Create the pinned Python environment

Python 3.10 or newer is required. The repository pins PyTorch `2.10.0`,
torchvision `0.25.0`, transformers `5.3.0`, Pillow `12.1.0`, and tqdm `4.67.2`.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e .
.venv/bin/python -m pip check
```

For CUDA, install a PyTorch build compatible with the host driver before the
editable install if the pinned wheel is not appropriate for that platform.

## 3. Supply and verify the four released checkpoints

Follow [`weights/README.md`](../weights/README.md) and place these files directly
under `weights/`:

```text
weights/
├── manifest.json
├── Expert_1_clip.pth
├── Expert_2_clip.pth
├── Expert_3_siglip.pth
└── Expert_4_siglip.pth
```

Verify all sizes and SHA-256 digests before model deserialization:

```bash
.venv/bin/python - <<'PY'
from infer.model import verify_checkpoint_files

paths = verify_checkpoint_files("weights", verify_hashes=True)
for name in sorted(paths):
    print(name, "verified")
PY
```

Expected checkpoint identities are also preserved in
[`evidence/weights-manifest.json`](evidence/weights-manifest.json).

## 4. Run batch inference

`--device auto` selects CUDA when available and otherwise CPU. To choose a
specific CUDA device, pass `--device cuda:0`.

```bash
.venv/bin/python -m infer \
  --images-dir /path/to/images \
  --out-dir outputs/predictions \
  --weights-dir weights \
  --device auto \
  --batch-size 1
```

The command recursively reads JPEG, PNG, BMP, WebP, and TIFF files. It writes:

- `outputs/predictions/predictions.csv` with `image_name,score`;
- `outputs/predictions/predictions.json` with the Track 5 `image_path,pred`
  record contract; and
- `outputs/predictions/predictions.meta.json` with the input root, checkpoint
  identity, runtime versions, preprocessing ID, device, and batch size.

Running the same command again resumes incomplete work. Use a new output
directory, or add `--overwrite`, after replacing any input while retaining its
relative filename.

## 5. Validate the output contract

```bash
head -n 5 outputs/predictions/predictions.csv
.venv/bin/python -m json.tool \
  outputs/predictions/predictions.json >/dev/null
.venv/bin/python -m json.tool \
  outputs/predictions/predictions.meta.json >/dev/null
```

`predictions.json` is written atomically when the directory run completes. It
is a JSON array whose records have a POSIX-style relative `image_path` and a
continuous `pred` value in `[0, 1]`. The CLI validates every score before
writing.

## 6. Run through the Python API

```bash
.venv/bin/python - <<'PY'
from PIL import Image
from infer import Model

model = Model(device="auto", model_data_dir="weights")
score = float(model.predict_pil([Image.open("/path/to/image.jpg")])[0])
print({"fake_score": score})
PY
```

## 7. Interpret a score without changing the detector

The CLI does not emit a hard class. For a downstream decision, compare the
score with a threshold chosen before evaluation:

```bash
.venv/bin/python - <<'PY'
score = 0.42  # replace with a value from predictions.csv
for threshold in (0.5, 0.2874746155139839):
    print(threshold, "fake" if score >= threshold else "real")
PY
```

Threshold `0.5` is the historical default. Threshold
`0.2874746155139839` was frozen from V1 calibration for a more balanced
operating point. Do not retune either threshold on protected or V3 evaluation
labels.

## 8. Benchmark reproducibility boundary

This branch contains the inference release and public benchmark evidence, but
not private split rows, per-image scores, datasets, or checkpoints. Therefore a
fresh numerical rerun of V1/V2 is intentionally not possible from
`submission/` alone. The included artifacts support exact integrity checks and
metric inspection:

```bash
jq '.sample_count, .baseline.metrics, .profiles.auc.metrics' \
  submission/evidence/final_report.json
jq '.study_design, .claim_boundary, .v1_final_policy' \
  submission/evidence/v2_protocol.json
jq . submission/evidence/v3_coco_audit.json
```

The full private benchmark harness must keep `experiments/private/` and dataset
inputs outside the public submission. Its independent verification commands,
when those authorized private inputs and the benchmark-evidence code are
present, are:

```bash
.venv/bin/python -m experiments.verify_results \
  --split experiments/private/split.csv \
  --protocol experiments/results/protocol.json \
  --calibration-scores experiments/private/calibration_scores.csv \
  --cospy-calibration-scores experiments/private/cospy_artifact_calibration_mps.csv \
  --frozen-config experiments/results/frozen_config.json \
  --final-scores experiments/private/final_scores.csv \
  --cospy-final-scores experiments/private/cospy_artifact_final_mps.csv \
  --final-report experiments/results/final_report.json \
  --weights weights --full-checkpoint-hashes

.venv/bin/python -m experiments.verify_v2
```

V3 cannot be run yet. It requires the exact organizer-provided 8,843-image
DALL-E Advanced source. The audited COCO archive alone is insufficient, and a
similarly named substitute would violate the frozen protocol.
