# SynthFlag inference service

This stateless FastAPI wrapper exposes the released FeatDistill four-expert
ensemble to the SynthFlag `/try` experience. Uploaded bytes are decoded in
memory, scored once, and discarded. The service does not write uploads or
results to disk.

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

For a public demo, run a warm GPU worker with the four checkpoints mounted,
set `SYNTHFLAG_EAGER_LOAD=1`, and point both the web build’s
`NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL` and the server runtime’s
`SYNTHFLAG_INFERENCE_URL` at its HTTPS base URL. The browser endpoint is public
by design, so enforce origin allowlisting, request-size limits, and platform
rate limiting in front of it.
