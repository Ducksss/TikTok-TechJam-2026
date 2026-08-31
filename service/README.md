# SynthFlag inference service

This stateless FastAPI wrapper exposes the released FeatDistill four-expert
ensemble to the SynthFlag `/try` experience. Image or derived-frame bytes are
decoded in memory, scored, and discarded. The service does not write uploads
or results to disk. Short videos are decoded in the browser; the original video
is never submitted to this service.

Run it from the repository root after installing the `server` extra:

```bash
export SYNTHFLAG_WEIGHTS_DIR=/absolute/path/to/weights
uvicorn service.app:app --host 127.0.0.1 --port 8000
```

Set `SYNTHFLAG_DEVICE` to `cuda`, `mps`, or `cpu` to override automatic device
selection. Set `SYNTHFLAG_ALLOWED_ORIGINS` to a comma-separated origin list in
production. Hash verification is enabled by default; only set
`SYNTHFLAG_SKIP_HASH_CHECK=1` when the checkpoint files have already been
verified in the same immutable deployment image.

## HTTP contract

- `GET /health` reports readiness plus image and `sampled_video_frames`
  capability limits.
- `POST /v1/analyze` accepts one JPEG, PNG, or WebP image up to 10 MiB.
- `POST /v1/analyze-frames` accepts 1–8 ordered JPEG, PNG, or WebP frames,
  repeated as `frames`, with JSON `timestamps_ms` and integer `duration_ms`.
  Videos must represent 1–10 seconds; each frame is limited to 2 MiB and the
  frame payload to 16 MiB.

The frame endpoint uses two-frame microbatches under the same inference lock
and returns ordered scores plus arithmetic mean, peak score/time, and count at
the service threshold. These values summarize independent image-model scores;
they are not audio analysis, motion analysis, provenance proof, or a calibrated
video-level probability.

One process admits one active request and one queued request. Further analyses
receive HTTP `429` with `Retry-After: 5`, preventing an unbounded in-process
queue. Run exactly one Uvicorn worker per GPU container so the four checkpoints
are not duplicated in device memory.

For a public demo, use a GPU with at least 24 GB device memory, mount the four
checkpoints privately, set `SYNTHFLAG_EAGER_LOAD=1`, and point both the web
build’s `NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL` and the server runtime’s
`SYNTHFLAG_INFERENCE_URL` at its HTTPS base URL. Keep one warm container during
judging and cap scaling at two single-worker replicas.

The browser endpoint is public by design. In front of it, enforce exact-origin
CORS, a request timeout of 300 seconds, a multipart body limit above 16 MiB,
and per-IP limits of 20 image analyses and 6 video analyses per 10 minutes.
Configure ingress to return `429` with `Retry-After`, and disable multipart-body
logging. CORS is not authentication; service source alone does not prove those
platform controls or live availability.
