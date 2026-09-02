#!/bin/zsh
set -euo pipefail

STATE_DIR="${SYNTHFLAG_STATE_DIR:-/Users/tiktok/Library/Application Support/SynthFlag}"
NGROK_BIN="${STATE_DIR}/bin/ngrok"
CREDENTIALS="${STATE_DIR}/ngrok-credentials.yml"

if [[ ! -x "${NGROK_BIN}" ]]; then
  print -u2 "ngrok is not installed at ${NGROK_BIN}; run install.sh first."
  exit 1
fi

read -r -s "AUTHTOKEN?Paste the ngrok authtoken (input is hidden): "
print
if [[ -z "${AUTHTOKEN}" ]]; then
  print -u2 "No token entered."
  exit 1
fi

umask 077
touch "${CREDENTIALS}"
chmod 600 "${CREDENTIALS}"
"${NGROK_BIN}" config add-authtoken "${AUTHTOKEN}" --config "${CREDENTIALS}" >/dev/null
unset AUTHTOKEN
chmod 600 "${CREDENTIALS}"
print "Saved the ngrok credential in a mode-0600 file outside Git."
print "Rerun deploy/macos/install.sh with the assigned domain to start the tunnel."
