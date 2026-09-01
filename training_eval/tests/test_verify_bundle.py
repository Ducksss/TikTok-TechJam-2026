from __future__ import annotations

import hashlib
import json

import torch

from model import ResidualHead
from verify_bundle import verify_manifest


def test_bundle_verifies_hash_size_and_head_shape(tmp_path) -> None:
    model = ResidualHead(input_width=8, hidden_width=4, dropout=0.0)
    head = tmp_path / "head.pt"
    torch.save(
        {
            "architecture": {"input_width": 8, "hidden_width": 4},
            "state_dict": model.state_dict(),
            "selected_alpha": 1.0,
        },
        head,
    )
    digest = hashlib.sha256(head.read_bytes()).hexdigest()
    manifest = tmp_path / "HEADS_MANIFEST.json"
    manifest.write_text(
        json.dumps(
            {
                "files": [
                    {
                        "path": "head.pt",
                        "sha256": digest,
                        "size_bytes": head.stat().st_size,
                        "role": "residual_head",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    report = verify_manifest(manifest)
    assert report["valid"] is True
    assert report["files"][0]["checkpoint_tensor_shapes"]["hidden.weight"] == (4, 8)
