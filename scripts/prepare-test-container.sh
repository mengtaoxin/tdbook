#!/usr/bin/env bash
# Runs inside the ubuntu-b test image: hydrate Linux npm / node_modules volumes,
# then exec the command. Stamp files live on the Linux node_modules volume so
# host darwin modules never mix in. Prefer the image's baked Playwright browsers
# at PLAYWRIGHT_BROWSERS_PATH=/ms-playwright.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

# npm run on the host puts host node_modules/.bin on PATH; docker run does not
# forward that. Put the Linux volume's bins first so bare `vitest` / similar work.
export PATH="${ROOT_DIR}/node_modules/.bin:${PATH}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}"

# Named volumes are often root-owned on first create; ubuntu must write npm/node_modules.
sudo chown -R ubuntu:ubuntu \
  /home/ubuntu/.npm \
  "${ROOT_DIR}/node_modules" \
  2>/dev/null || true

STAMP_DIR="${ROOT_DIR}/node_modules/.cache/tdbook-test-env"
lock_stamp="${STAMP_DIR}/package-lock.sha256"

lock_hash="$(
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum package-lock.json | awk '{print $1}'
  else
    shasum -a 256 package-lock.json | awk '{print $1}'
  fi
)"

if [[ ! -f "${lock_stamp}" ]] || [[ "$(cat "${lock_stamp}")" != "${lock_hash}" ]]; then
  echo "Preparing test container: npm ci …" >&2
  npm ci
  # npm ci replaces node_modules; create the stamp path after install.
  mkdir -p "${STAMP_DIR}"
  printf '%s\n' "${lock_hash}" >"${lock_stamp}"
fi

if [[ ! -d "${PLAYWRIGHT_BROWSERS_PATH}" ]] \
  || [[ -z "$(find "${PLAYWRIGHT_BROWSERS_PATH}" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
  echo "Preparing test container: playwright install chromium …" >&2
  npx playwright install chromium
fi

exec "$@"
