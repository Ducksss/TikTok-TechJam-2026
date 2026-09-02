#!/bin/zsh
set -euo pipefail

LAUNCH_AGENTS="/Users/tiktok/Library/LaunchAgents"
GUI_DOMAIN="gui/$(id -u)"

for label in com.synthflag.ngrok com.synthflag.inference; do
  launchctl bootout "${GUI_DOMAIN}/${label}" >/dev/null 2>&1 || true
  launchctl disable "${GUI_DOMAIN}/${label}" >/dev/null 2>&1 || true
done
rm -f "${LAUNCH_AGENTS}/com.synthflag.ngrok.plist"
rm -f "${LAUNCH_AGENTS}/com.synthflag.inference.plist"

print "SynthFlag launch agents were stopped and removed."
print "The runtime checkout, checkpoints, ngrok binary, token, and logs were retained."
