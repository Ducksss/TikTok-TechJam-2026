from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import torch

from infer.checkpoints import (
    CHECKPOINT_FILENAMES,
    checkpoint_identity_digest,
    load_expert_state,
    verify_checkpoint_files,
)


class CheckpointContractTest(unittest.TestCase):
    def _make_checkpoint_set(self, root: Path) -> dict[str, object]:
        records = {}
        for index, filename in enumerate(CHECKPOINT_FILENAMES, start=1):
            payload = (f"checkpoint-{index}\n").encode("ascii")
            (root / filename).write_bytes(payload)
            records[filename] = {
                "size_bytes": len(payload),
                "sha256": hashlib.sha256(payload).hexdigest(),
                "download_url": f"https://invalid.example/{filename}",
            }
        manifest = {"schema_version": 2, "files": records}
        (root / "manifest.json").write_text(
            json.dumps(manifest), encoding="utf-8"
        )
        return manifest

    def test_verifies_expert4_and_three_head_identities(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            self._make_checkpoint_set(root)
            paths = verify_checkpoint_files(root)
            self.assertEqual(tuple(paths), CHECKPOINT_FILENAMES)

    def test_checkpoint_set_identity_ignores_download_urls(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            manifest = self._make_checkpoint_set(root)
            first = checkpoint_identity_digest(root)
            manifest["files"][CHECKPOINT_FILENAMES[0]]["download_url"] = (
                "https://another.invalid/mirror"
            )
            (root / "manifest.json").write_text(
                json.dumps(manifest), encoding="utf-8"
            )
            self.assertEqual(checkpoint_identity_digest(root), first)

    def test_rejects_checkpoint_content_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            self._make_checkpoint_set(root)
            (root / CHECKPOINT_FILENAMES[2]).write_bytes(b"same-size-no")
            with self.assertRaisesRegex(ValueError, "size mismatch|SHA-256 mismatch"):
                verify_checkpoint_files(root)

    def test_loads_wrapped_tensor_only_state_dictionary(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            checkpoint = Path(temporary_directory) / "expert.pth"
            torch.save({"model_state_dict": {"weight": torch.ones(2)}}, checkpoint)
            state = load_expert_state(checkpoint)
            torch.testing.assert_close(state["weight"], torch.ones(2))

    def test_rejects_non_tensor_checkpoint_values(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            checkpoint = Path(temporary_directory) / "expert.pth"
            torch.save({"weight": "not-a-tensor"}, checkpoint)
            with self.assertRaisesRegex(ValueError, "tensors only"):
                load_expert_state(checkpoint)


if __name__ == "__main__":
    unittest.main()
