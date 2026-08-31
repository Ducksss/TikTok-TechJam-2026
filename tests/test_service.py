from __future__ import annotations

import asyncio
import io
import json
import unittest
from unittest.mock import AsyncMock, patch

import torch
from fastapi.testclient import TestClient
from PIL import Image

from service import app as service_app


def _png_bytes(value: int = 127) -> bytes:
    payload = io.BytesIO()
    Image.new("RGB", (64, 64), (value, value, value)).save(payload, format="PNG")
    return payload.getvalue()


class _FakeModel:
    def __init__(self, scores: list[float]) -> None:
        self._scores = iter(scores)
        self.batch_sizes: list[int] = []

    def predict_pil(self, images: list[Image.Image]) -> torch.Tensor:
        self.batch_sizes.append(len(images))
        return torch.tensor(
            [next(self._scores) for _ in images], dtype=torch.float32
        )


class ServiceContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(service_app.app)

    def _video_request(
        self,
        *,
        count: int = 8,
        duration_ms: int = 10_000,
        timestamps_ms: list[int] | None = None,
        frame_payload: bytes | None = None,
        content_type: str = "image/png",
    ):
        timestamps = timestamps_ms or [625 + index * 1_250 for index in range(count)]
        payload = frame_payload or _png_bytes()
        files = [
            ("frames", (f"frame-{index}.png", payload, content_type))
            for index in range(count)
        ]
        return self.client.post(
            "/v1/analyze-frames",
            data={
                "duration_ms": str(duration_ms),
                "timestamps_ms": json.dumps(timestamps),
            },
            files=files,
        )

    def test_health_advertises_backward_compatible_capabilities(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("ready", payload)
        self.assertEqual(payload["capabilities"]["image"]["endpoint"], "/v1/analyze")
        self.assertEqual(
            payload["capabilities"]["sampled_video_frames"],
            {
                "accepted_mime_types": ["image/jpeg", "image/png", "image/webp"],
                "aggregation": "arithmetic_mean",
                "endpoint": "/v1/analyze-frames",
                "max_duration_ms": 10_000,
                "max_frame_bytes": 2 * 1024 * 1024,
                "max_frames": 8,
                "max_payload_bytes": 16 * 1024 * 1024,
                "min_duration_ms": 1_000,
                "visual_only": True,
            },
        )

    def test_eight_frames_return_ordered_scores_and_server_aggregates(self) -> None:
        expected_scores = [0.1, 0.2, 0.8, 0.4, 0.9, 0.3, 0.7, 0.6]
        model = _FakeModel(expected_scores)

        with (
            patch.object(service_app, "_get_model", AsyncMock(return_value=model)),
            patch.object(service_app, "_checkpoint_digest", "test-digest"),
        ):
            response = self._video_request()

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["analysis_type"], "sampled_video_frames")
        self.assertEqual(payload["aggregation"], "arithmetic_mean")
        self.assertEqual(payload["duration_ms"], 10_000)
        self.assertEqual(payload["sample_count"], 8)
        self.assertEqual(model.batch_sizes, [2, 2, 2, 2])
        self.assertEqual(
            [frame["timestamp_ms"] for frame in payload["frame_scores"]],
            [625, 1_875, 3_125, 4_375, 5_625, 6_875, 8_125, 9_375],
        )
        returned_scores = [frame["score"] for frame in payload["frame_scores"]]
        for actual, expected in zip(returned_scores, expected_scores, strict=True):
            self.assertAlmostEqual(actual, expected)
        self.assertAlmostEqual(payload["summary"]["mean_score"], 0.5)
        self.assertAlmostEqual(payload["summary"]["peak_score"], 0.9)
        self.assertEqual(payload["summary"]["peak_frame_index"], 4)
        self.assertEqual(payload["summary"]["peak_timestamp_ms"], 5_625)
        self.assertEqual(payload["summary"]["above_threshold_count"], 4)

    def test_single_image_contract_is_unchanged(self) -> None:
        model = _FakeModel([0.42])
        with patch.object(
            service_app, "_get_model", AsyncMock(return_value=model)
        ):
            response = self.client.post(
                "/v1/analyze",
                files={"image": ("sample.png", _png_bytes(), "image/png")},
            )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertAlmostEqual(response.json()["score"], 0.42)
        self.assertEqual(response.json()["threshold"], 0.5)

    def test_busy_service_rejects_an_unbounded_queue(self) -> None:
        with patch.object(service_app, "_inference_slots", asyncio.Semaphore(0)):
            response = self.client.post(
                "/v1/analyze",
                files={"image": ("sample.png", _png_bytes(), "image/png")},
            )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["retry-after"], "5")

    def test_rejects_zero_or_more_than_eight_frames(self) -> None:
        response = self.client.post(
            "/v1/analyze-frames",
            data={"duration_ms": "1000", "timestamps_ms": "[]"},
        )
        self.assertEqual(response.status_code, 422)

        response = self._video_request(count=9)
        self.assertEqual(response.status_code, 422)

    def test_rejects_malformed_or_mismatched_timestamps(self) -> None:
        response = self.client.post(
            "/v1/analyze-frames",
            data={"duration_ms": "1000", "timestamps_ms": "not-json"},
            files=[("frames", ("frame.png", _png_bytes(), "image/png"))],
        )
        self.assertEqual(response.status_code, 422)

        response = self._video_request(count=2, timestamps_ms=[500])
        self.assertEqual(response.status_code, 422)

        response = self._video_request(count=2, timestamps_ms=[1_500, 500])
        self.assertEqual(response.status_code, 422)

    def test_rejects_out_of_range_duration(self) -> None:
        response = self._video_request(duration_ms=10_001)
        self.assertEqual(response.status_code, 422)

    def test_rejects_oversized_or_invalid_frames(self) -> None:
        response = self._video_request(
            count=1,
            timestamps_ms=[500],
            duration_ms=1_000,
            frame_payload=b"x" * (2 * 1024 * 1024 + 1),
        )
        self.assertEqual(response.status_code, 413)

        response = self._video_request(
            count=1,
            timestamps_ms=[500],
            duration_ms=1_000,
            frame_payload=b"not an image",
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
