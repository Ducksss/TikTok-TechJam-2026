from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

import torch
from PIL import Image

from infer.cli import run
from infer.checkpoints import CHECKPOINT_FILENAMES
from infer.outputs import CSV_FIELDS, read_prediction_rows, write_submission_json


class SubmissionJsonTest(unittest.TestCase):
    def test_exports_track5_image_path_and_pred_records(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_directory = Path(temporary_directory)
            csv_path = output_directory / "predictions.csv"
            json_path = output_directory / "predictions.json"

            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(CSV_FIELDS)
                writer.writerow(["nested/real.jpg", "0.125"])
                writer.writerow(["fake.png", "0.875"])

            write_submission_json(csv_path, json_path)

            self.assertEqual(
                json.loads(json_path.read_text(encoding="utf-8")),
                [
                    {"image_path": "nested/real.jpg", "pred": 0.125},
                    {"image_path": "fake.png", "pred": 0.875},
                ],
            )

    def test_rejects_duplicate_resume_rows(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            csv_path = Path(temporary_directory) / "predictions.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(CSV_FIELDS)
                writer.writerow(["same.png", "0.1"])
                writer.writerow(["same.png", "0.2"])

            with self.assertRaisesRegex(ValueError, "duplicate image_name"):
                read_prediction_rows(csv_path)

    def test_rejects_non_probability_score(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            csv_path = Path(temporary_directory) / "predictions.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(CSV_FIELDS)
                writer.writerow(["bad.png", "1.01"])

            with self.assertRaisesRegex(ValueError, "outside \\[0,1\\]"):
                read_prediction_rows(csv_path)

    def test_directory_run_writes_and_resumes_all_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            images_dir = root / "images"
            weights_dir = root / "weights"
            out_dir = root / "outputs"
            (images_dir / "nested").mkdir(parents=True)
            weights_dir.mkdir()
            Image.new("RGB", (40, 40), "red").save(images_dir / "a.png")
            Image.new("RGB", (40, 40), "blue").save(
                images_dir / "nested" / "b.jpg"
            )

            records = {}
            for index, filename in enumerate(CHECKPOINT_FILENAMES):
                payload = f"fake-{index}".encode("ascii")
                (weights_dir / filename).write_bytes(payload)
                records[filename] = {
                    "size_bytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                }
            (weights_dir / "manifest.json").write_text(
                json.dumps({"schema_version": 1, "files": records}),
                encoding="utf-8",
            )

            arguments = argparse.Namespace(
                images_dir=images_dir,
                out_dir=out_dir,
                weights_dir=weights_dir,
                batch_size=2,
                save_every=1,
                device="cpu",
                no_amp=True,
                skip_hash_check=False,
                overwrite=False,
            )

            class FakeModel:
                device = torch.device("cpu")
                use_amp = False

                def __init__(self, **_: object) -> None:
                    pass

                def predict_pil(self, images: list[Image.Image]) -> torch.Tensor:
                    if len(images) != 2:
                        raise AssertionError("expected one two-image batch")
                    return torch.tensor([0.25, 0.75])

            with (
                patch("infer.cli.Model", FakeModel),
                redirect_stdout(io.StringIO()),
                redirect_stderr(io.StringIO()),
            ):
                run(arguments)

            self.assertEqual(
                read_prediction_rows(out_dir / "predictions.csv"),
                [("a.png", 0.25), ("nested/b.jpg", 0.75)],
            )
            self.assertEqual(
                json.loads((out_dir / "predictions.json").read_text(encoding="utf-8")),
                [
                    {"image_path": "a.png", "pred": 0.25},
                    {"image_path": "nested/b.jpg", "pred": 0.75},
                ],
            )
            metadata = json.loads(
                (out_dir / "predictions.meta.json").read_text(encoding="utf-8")
            )
            self.assertEqual(metadata["format_version"], 2)
            self.assertFalse((out_dir / ".inference.lock").exists())

            with patch(
                "infer.cli.Model",
                side_effect=AssertionError("resume should not construct the model"),
            ), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                run(arguments)


if __name__ == "__main__":
    unittest.main()
