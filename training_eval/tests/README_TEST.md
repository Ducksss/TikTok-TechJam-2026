# Running `test_model.py`

This test suite validates the core residual-head model implementation used in the training/evaluation pipeline.

## Requirements

Make sure you have **Python 3.10+** installed.

Clone the repository:

```bash
git clone https://github.com/Ducksss/TikTok-TechJam-2026.git
cd TikTok-TechJam-2026/training_eval
```

## 1. Create a Virtual Environment

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 2. Install Dependencies

From inside the `training_eval` directory:

```bash
pip install -r requirements.txt
```

The required packages include PyTorch and pytest.

## 3. Run `test_model.py`

Still inside:

```text
TikTok-TechJam-2026/training_eval
```

run:

```bash
pytest tests/test_model.py -v
```

You should see output similar to:

```text
tests/test_model.py::test_zero_initialisation_is_teacher_identity PASSED
tests/test_model.py::test_checkpoint_state_dict_is_strictly_compatible PASSED

2 passed
```

## What the Tests Check

### `test_zero_initialisation_is_teacher_identity`

Checks that a newly initialized `ResidualHead` initially reproduces the teacher model's AI-vs-real logit difference correctly.

### `test_checkpoint_state_dict_is_strictly_compatible`

Creates a temporary model checkpoint, reloads it with `load_head_checkpoint()`, and checks that:

* the stored `selected_alpha` is preserved
* the model architecture is reconstructed correctly
* the loaded model parameters are compatible with the original model

## Run All Tests

To run the entire training/evaluation test suite instead:

```bash
pytest tests/ -v
```

## Quick Run

If Python and the dependencies are already installed, the only commands you need are:

```bash
cd training_eval
pytest tests/test_model.py -v
```

No pretrained weights, datasets, or GPU are required for `test_model.py`.
