# Mac MPS host through ngrok

This package runs the selected SynthFlag TEST1 detector on this Apple-silicon
Mac and publishes only its HTTP inference surface through ngrok:

```text
Browser -> ngrok HTTPS -> 127.0.0.1:8000 -> Apple MPS
```

There is deliberately no nginx layer. Uvicorn is loopback-only, ngrok handles
public TLS and NAT traversal, and both processes are user launch agents that
start at login and restart after a crash. Availability therefore depends on
this Mac remaining plugged in, awake, online, and logged in; this is not a
24/7 service-level commitment.

## Private paths

- Stable checkout: `/Users/tiktok/Services/SynthFlag`
- Virtual environment, checkpoints, ngrok binary/config/token, and logs:
  `/Users/tiktok/Library/Application Support/SynthFlag`
- User agents: `/Users/tiktok/Library/LaunchAgents/com.synthflag.*.plist`

The token and checkpoint bytes never enter Git. The installer refuses to start
unless Apple MPS is available and all four checkpoint sizes and SHA-256 hashes
match `infer/checkpoint_manifest.json`. Hash verification stays enabled again
when the service constructs the model.

## First installation

1. Download Expert 4 and the final three-head bundle from the team Drive links
   in `infer/checkpoint_manifest.json`. Install them into the private state
   directory with:

   ```bash
   python3 deploy/macos/install_checkpoints.py \
     --repo "$PWD" \
     --weights-dir "/Users/tiktok/Library/Application Support/SynthFlag/weights" \
     --expert4-file "/path/to/Expert_4_siglip.pth" \
     --head-bundle-file "/path/to/SynthFlag_TEST1_head_bundle_v1.zip"
   ```

2. In the ngrok dashboard, copy the free account's assigned `*.ngrok.app`
   domain. Run the installer with that hostname:

   ```bash
   deploy/macos/install.sh --domain "your-assigned-name.ngrok.app"
   ```

   The installer requires Python 3.10 or newer. If macOS's `/usr/bin/python3`
   is older, point it at a compatible interpreter for the first run, for
   example `SYNTHFLAG_PYTHON=/path/to/python3.12 deploy/macos/install.sh ...`.

   The ngrok 3.39.11 Apple-silicon archive and executable are pinned by
   SHA-256. The installer also validates its embedded Developer ID team as
   ngrok, Inc. (`TEX8MHRDQ9`). The versioned archive URL and both checksums
   prevent a different release from being installed silently.

   If the domain is not assigned yet, use
   `deploy/macos/install.sh --prepare-only`. It installs and starts only the
   loopback MPS service while preparing ngrok; rerunning later is safe.

3. Enter the ngrok authtoken locally; input is hidden and the resulting file is
   mode `0600`:

   ```bash
   deploy/macos/configure_ngrok_token.sh
   deploy/macos/install.sh --domain "your-assigned-name.ngrok.app"
   ```

4. Verify local and public health:

   ```bash
   deploy/macos/healthcheck.sh \
     --public-url "https://your-assigned-name.ngrok.app"
   ```

5. Build the web source with
   `NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL=https://your-assigned-name.ngrok.app`.
   In the existing Sites project, set runtime
   `SYNTHFLAG_INFERENCE_URL` to the same base URL, save a version from the
   pushed source commit, and deploy it. Do not create another Sites project.

## Edge contract

`traffic-policy.yml` permits `GET /health`, both analysis POST routes, and only
their CORS preflights. The health preflight is required because the direct
browser probe sends `ngrok-skip-browser-warning`. Everything else receives a
404 at the edge. Per client IP, the sliding windows admit 20 image requests and
6 video requests per 10 minutes; ngrok supplies `429` and `Retry-After` when a
bucket is exhausted.

The ngrok local inspector is disabled with `web_addr: false`. Full Capture is
an opt-in provider setting and must remain disabled in the ngrok Traffic
Inspector. Ordinary provider request metadata remains subject to ngrok's
account and retention controls; neither the service nor Uvicorn writes access
or request-body logs.

## Operations and rollback

Inspect service state without exposing secrets:

```bash
launchctl print "gui/$(id -u)/com.synthflag.inference"
launchctl print "gui/$(id -u)/com.synthflag.ngrok"
tail -n 100 "/Users/tiktok/Library/Application Support/SynthFlag/logs/inference.stderr.log"
tail -n 100 "/Users/tiktok/Library/Application Support/SynthFlag/logs/ngrok.stderr.log"
```

`install.sh` is idempotent. It refuses to update a dirty stable checkout,
refetches its requested remote ref, revalidates MPS/checkpoints/configuration,
and replaces only these two launch agents.

To stop and unregister both agents while retaining the runtime, checkpoints,
token, binary, and logs for recovery, run:

```bash
deploy/macos/rollback.sh
```

Deleting retained private state is intentionally a separate manual action so a
rollback cannot destroy the checkpoint release or ngrok credential.
