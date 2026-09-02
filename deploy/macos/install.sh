#!/bin/zsh
set -euo pipefail

PROGRAM_NAME="${0:t}"
NGROK_VERSION="3.39.11"
NGROK_ARCHIVE_SHA256="9324a6552d74e25d5bdfdbedc4b32422c96f044fda37877498ad8ef10bddf7f7"
NGROK_BINARY_SHA256="ea3a570604bd161d00ba7358af4ad2d6b0ac4c8421c17fc0106b527deffbc88f"
NGROK_URL="https://bin.equinox.io/a/dy27whJwwmb/ngrok-v3-3.39.11-darwin-arm64.zip"
RUNTIME_DIR="${SYNTHFLAG_RUNTIME_DIR:-/Users/tiktok/Services/SynthFlag}"
STATE_DIR="${SYNTHFLAG_STATE_DIR:-/Users/tiktok/Library/Application Support/SynthFlag}"
SOURCE_REF="origin/main"
DOMAIN=""
PREPARE_ONLY=0
SKIP_PYTHON=0

usage() {
  print "Usage: ${PROGRAM_NAME} [--prepare-only | --domain <assigned-name>.ngrok.app] [--ref origin/main] [--skip-python]"
}

while (( $# > 0 )); do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --ref)
      SOURCE_REF="${2:-}"
      shift 2
      ;;
    --prepare-only)
      PREPARE_ONLY=1
      shift
      ;;
    --skip-python)
      SKIP_PYTHON=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      print -u2 -- "Unknown argument: $1"
      usage >&2
      exit 2
      ;;
  esac
done

if (( PREPARE_ONLY == 0 )) && \
  [[ ! "${DOMAIN}" =~ '^[a-zA-Z0-9][a-zA-Z0-9.-]*\.ngrok\.app$' ]]; then
  print -u2 -- "--domain must be the assigned hostname ending in .ngrok.app"
  exit 2
fi
if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  print -u2 -- "This package requires Apple-silicon macOS."
  exit 1
fi

SCRIPT_DIR="${0:A:h}"
SOURCE_REPO="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel)"
ORIGIN_URL="$(git -C "${SOURCE_REPO}" remote get-url origin)"
LAUNCH_AGENTS="/Users/tiktok/Library/LaunchAgents"
GUI_DOMAIN="gui/$(id -u)"

umask 077
mkdir -p "/Users/tiktok/Services" "${STATE_DIR}/bin" "${STATE_DIR}/downloads" \
  "${STATE_DIR}/logs" "${STATE_DIR}/weights" "${LAUNCH_AGENTS}"
chmod 700 "${STATE_DIR}" "${STATE_DIR}/bin" "${STATE_DIR}/downloads" \
  "${STATE_DIR}/logs" "${STATE_DIR}/weights"

if [[ ! -d "${RUNTIME_DIR}/.git" ]]; then
  if [[ -e "${RUNTIME_DIR}" ]]; then
    print -u2 -- "Refusing to replace non-Git path: ${RUNTIME_DIR}"
    exit 1
  fi
  git clone "${ORIGIN_URL}" "${RUNTIME_DIR}"
fi
if [[ -n "$(git -C "${RUNTIME_DIR}" status --porcelain)" ]]; then
  print -u2 -- "Runtime checkout has local changes; refusing to overwrite ${RUNTIME_DIR}."
  exit 1
fi
git -C "${RUNTIME_DIR}" fetch origin --prune
git -C "${RUNTIME_DIR}" checkout --detach "${SOURCE_REF}"

ARCHIVE="${STATE_DIR}/downloads/ngrok-v3-${NGROK_VERSION}-darwin-arm64.zip"
if [[ ! -f "${ARCHIVE}" ]]; then
  curl --fail --location --silent --show-error "${NGROK_URL}" --output "${ARCHIVE}"
fi
OBSERVED_ARCHIVE_SHA="$(shasum -a 256 "${ARCHIVE}" | awk '{print $1}')"
if [[ "${OBSERVED_ARCHIVE_SHA}" != "${NGROK_ARCHIVE_SHA256}" ]]; then
  print -u2 -- "ngrok archive checksum mismatch; expected pinned ${NGROK_VERSION}."
  exit 1
fi
mkdir -p "${STATE_DIR}/downloads/ngrok-${NGROK_VERSION}"
ditto -x -k "${ARCHIVE}" "${STATE_DIR}/downloads/ngrok-${NGROK_VERSION}"
install -m 0755 "${STATE_DIR}/downloads/ngrok-${NGROK_VERSION}/ngrok" "${STATE_DIR}/bin/ngrok"
OBSERVED_BINARY_SHA="$(shasum -a 256 "${STATE_DIR}/bin/ngrok" | awk '{print $1}')"
if [[ "${OBSERVED_BINARY_SHA}" != "${NGROK_BINARY_SHA256}" ]]; then
  print -u2 -- "ngrok binary checksum mismatch."
  exit 1
fi
codesign --verify --deep --strict "${STATE_DIR}/bin/ngrok"
SIGNATURE_INFO="$(codesign --display --verbose=4 "${STATE_DIR}/bin/ngrok" 2>&1)"
if [[ "${SIGNATURE_INFO}" != *'TeamIdentifier=TEX8MHRDQ9'* ]]; then
  print -u2 -- "ngrok Developer ID team did not match ngrok, Inc."
  exit 1
fi
if [[ "$("${STATE_DIR}/bin/ngrok" version | awk '{print $3}')" != "${NGROK_VERSION}" ]]; then
  print -u2 -- "ngrok version did not match ${NGROK_VERSION}."
  exit 1
fi

if (( SKIP_PYTHON == 0 )); then
  if [[ ! -x "${STATE_DIR}/venv/bin/python" ]]; then
    python3 -m venv "${STATE_DIR}/venv"
  fi
  "${STATE_DIR}/venv/bin/python" -m pip install --disable-pip-version-check \
    --editable "${RUNTIME_DIR}[server]"
fi
if [[ ! -x "${STATE_DIR}/venv/bin/python" ]]; then
  print -u2 -- "Python runtime missing at ${STATE_DIR}/venv; rerun without --skip-python."
  exit 1
fi

"${STATE_DIR}/venv/bin/python" -c \
  'import torch; assert torch.backends.mps.is_built() and torch.backends.mps.is_available(), "Apple MPS is unavailable"'
SYNTHFLAG_WEIGHTS_DIR="${STATE_DIR}/weights" \
  "${STATE_DIR}/venv/bin/python" -c \
  'import os; from infer.checkpoints import verify_checkpoint_files; verify_checkpoint_files(os.environ["SYNTHFLAG_WEIGHTS_DIR"])'

if (( PREPARE_ONLY == 1 )); then
  print "Prepared the stable runtime, Python environment, verified checkpoints, and pinned ngrok binary."
  print "Rerun with --domain after the assigned ngrok hostname is available."
  exit 0
fi

if [[ ! -f "${STATE_DIR}/ngrok-credentials.yml" ]]; then
  print 'version: "3"\nagent: {}' > "${STATE_DIR}/ngrok-credentials.yml"
fi
chmod 600 "${STATE_DIR}/ngrok-credentials.yml"
"${STATE_DIR}/venv/bin/python" "${RUNTIME_DIR}/deploy/macos/render_templates.py" \
  --templates "${RUNTIME_DIR}/deploy/macos/templates" \
  --launch-agents "${LAUNCH_AGENTS}" \
  --state-dir "${STATE_DIR}" \
  --runtime-dir "${RUNTIME_DIR}" \
  --domain "${DOMAIN}"
chmod 600 "${STATE_DIR}/ngrok.yml" "${STATE_DIR}/traffic-policy.yml"
plutil -lint "${LAUNCH_AGENTS}/com.synthflag.inference.plist" \
  "${LAUNCH_AGENTS}/com.synthflag.ngrok.plist"
ruby -e 'require "yaml"; YAML.safe_load(File.read(ARGV.fetch(0)), permitted_classes: [], aliases: false)' \
  "${STATE_DIR}/traffic-policy.yml"
"${STATE_DIR}/bin/ngrok" config check \
  --config "${STATE_DIR}/ngrok-credentials.yml" \
  --config "${STATE_DIR}/ngrok.yml"

for label in com.synthflag.inference com.synthflag.ngrok; do
  launchctl bootout "${GUI_DOMAIN}/${label}" >/dev/null 2>&1 || true
done
launchctl bootstrap "${GUI_DOMAIN}" "${LAUNCH_AGENTS}/com.synthflag.inference.plist"
launchctl enable "${GUI_DOMAIN}/com.synthflag.inference"
launchctl kickstart -k "${GUI_DOMAIN}/com.synthflag.inference"

if grep -Eq '^[[:space:]]+authtoken:' "${STATE_DIR}/ngrok-credentials.yml"; then
  launchctl bootstrap "${GUI_DOMAIN}" "${LAUNCH_AGENTS}/com.synthflag.ngrok.plist"
  launchctl enable "${GUI_DOMAIN}/com.synthflag.ngrok"
  launchctl kickstart -k "${GUI_DOMAIN}/com.synthflag.ngrok"
  print "Installed and started SynthFlag inference plus ngrok for https://${DOMAIN}."
else
  print "Inference is installed. ngrok is prepared but not started because no authtoken is stored."
  print "Run ${RUNTIME_DIR}/deploy/macos/configure_ngrok_token.sh, then rerun this installer."
fi
