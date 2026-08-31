from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path

from infer.cli import CSV_FIELDS, _write_submission_json


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

            _write_submission_json(csv_path, json_path)

            self.assertEqual(
                json.loads(json_path.read_text(encoding="utf-8")),
                [
                    {"image_path": "nested/real.jpg", "pred": 0.125},
                    {"image_path": "fake.png", "pred": 0.875},
                ],
            )


if __name__ == "__main__":
    unittest.main()
