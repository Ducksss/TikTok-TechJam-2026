#!/bin/zsh
set -euo pipefail

PUBLIC_URL=""
if [[ "${1:-}" == "--public-url" ]]; then
  PUBLIC_URL="${2:-}"
fi

LISTENERS="$(lsof -nP -iTCP:8000 -sTCP:LISTEN 2>/dev/null || true)"
if [[ -z "${LISTENERS}" ]]; then
  print -u2 "No service is listening on TCP port 8000."
  exit 1
fi
if print -r -- "${LISTENERS}" | tail -n +2 | awk '{print $9}' | \
  grep -Ev '^(127\.0\.0\.1|\[::1\]):8000$' >/dev/null; then
  print -u2 "Port 8000 has a non-loopback listener:"
  print -u2 -r -- "${LISTENERS}"
  exit 1
fi

LOCAL_HEALTH="$(curl --fail --silent --show-error http://127.0.0.1:8000/health)"
python3 -c \
  'import json,sys; p=json.loads(sys.argv[1]); assert p["device"] == "mps" and p["ready"] is True, p' \
  "${LOCAL_HEALTH}"
print "Local service is ready on MPS and bound only to loopback."

if [[ -n "${PUBLIC_URL}" ]]; then
  PUBLIC_HEALTH="$(curl --fail --silent --show-error \
    -H 'ngrok-skip-browser-warning: 1' "${PUBLIC_URL%/}/health")"
  python3 -c \
    'import json,sys; p=json.loads(sys.argv[1]); assert p["device"] == "mps" and p["ready"] is True, p' \
    "${PUBLIC_HEALTH}"
  print "Public ngrok health is ready on MPS."
fi
