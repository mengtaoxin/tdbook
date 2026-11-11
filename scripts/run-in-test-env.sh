#!/usr/bin/env bash
# When RUN_TESTS_IN_CONTAINER is exactly 1 in the process environment, run the
# command in an ephemeral ubuntu-b container (mengtaoxin/dockers). Otherwise
# exec in place. Nested calls inside that container see
# TDBOOK_INSIDE_TEST_CONTAINER=1 and exec.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
UBUNTU_B_VERSION="$(tr -d '[:space:]' < "${ROOT_DIR}/docker/UBUNTU_B_VERSION")"
DEFAULT_IMAGE="ghcr.io/mengtaoxin/ubuntu-b:${UBUNTU_B_VERSION}"
IMAGE_NAME="${TDBOOK_TEST_IMAGE:-${DEFAULT_IMAGE}}"

# In-place exec keeps the caller PATH. Login bash re-reads the profile, and
# nvm then drops npm when npm_config_prefix is set. Drop login flags on a
# leading bash so the already resolved node and npm stay put.
in_place_cmd=()
build_in_place_command() {
  in_place_cmd=()
  if [[ $# -eq 0 ]]; then
    return 0
  fi
  local argv0="$1"
  local base="${argv0##*/}"
  if [[ "$base" != "bash" ]]; then
    in_place_cmd=("$@")
    return 0
  fi
  in_place_cmd=("$argv0")
  shift
  local arg=""
  local flags=""
  local options_done=0
  for arg in "$@"; do
    if [[ "$options_done" -eq 1 ]]; then
      in_place_cmd+=("$arg")
      continue
    fi
    case "$arg" in
      --)
        options_done=1
        in_place_cmd+=("$arg")
        ;;
      --login)
        ;;
      --*)
        in_place_cmd+=("$arg")
        ;;
      -*)
        flags="${arg#-}"
        flags="${flags//l/}"
        if [[ -n "$flags" ]]; then
          in_place_cmd+=("-${flags}")
        fi
        ;;
      *)
        options_done=1
        in_place_cmd+=("$arg")
        ;;
    esac
  done
}

if [[ "${TDBOOK_INSIDE_TEST_CONTAINER:-}" == "1" ]]; then
  build_in_place_command "$@"
  exec "${in_place_cmd[@]}"
fi

if [[ "$#" -lt 1 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 2
fi

build_in_place_command "$@"

if [[ "${RUN_TESTS_IN_CONTAINER:-}" != "1" ]]; then
  exec "${in_place_cmd[@]}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "RUN_TESTS_IN_CONTAINER is 1 but docker was not found on PATH." >&2
  exit 1
fi

resolve_ubuntu_b_dir() {
  if [[ -n "${TDBOOK_UBUNTU_B_DIR:-}" ]]; then
    printf '%s\n' "${TDBOOK_UBUNTU_B_DIR}"
    return 0
  fi
  local sibling="${ROOT_DIR}/../dockers/ubuntu-b"
  if [[ -f "${sibling}/Dockerfile" ]]; then
    (cd "${sibling}" && pwd)
    return 0
  fi
  return 1
}

hash_ubuntu_b_sources() {
  local ubuntu_b_dir="$1"
  local dockers_root="$2"
  local hasher
  if command -v sha256sum >/dev/null 2>&1; then
    hasher=(sha256sum)
  else
    hasher=(shasum -a 256)
  fi
  # Dockerfile builds from dockers root (shared scripts/ + ubuntu-b/scripts/).
  cat "${ubuntu_b_dir}/Dockerfile" \
    "${ubuntu_b_dir}/scripts"/*.sh \
    "${dockers_root}/scripts"/*.sh \
    | "${hasher[@]}" | awk '{print $1}'
}

ensure_image() {
  local ubuntu_b_dir=""
  local dockers_root=""
  local dockerfile_hash=""
  local labeled=""
  local need_build=1

  if ubuntu_b_dir="$(resolve_ubuntu_b_dir)"; then
    dockers_root="$(cd "${ubuntu_b_dir}/.." && pwd)"
    dockerfile_hash="$(hash_ubuntu_b_sources "${ubuntu_b_dir}" "${dockers_root}")"

    if docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
      labeled="$(docker image inspect -f '{{ index .Config.Labels "tdbook.ubuntu-b.sha256" }}' "${IMAGE_NAME}" 2>/dev/null || true)"
      if [[ "${labeled}" == "${dockerfile_hash}" ]]; then
        need_build=0
      fi
    fi

    if [[ "${need_build}" -eq 1 ]]; then
      echo "Building ${IMAGE_NAME} from ${dockers_root} (ubuntu-b/Dockerfile) …" >&2
      docker build \
        --label "tdbook.ubuntu-b.sha256=${dockerfile_hash}" \
        -f "${ubuntu_b_dir}/Dockerfile" \
        -t "${IMAGE_NAME}" \
        "${dockers_root}"
    fi
    return 0
  fi

  if docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
    return 0
  fi

  echo "Pulling ${IMAGE_NAME} …" >&2
  if ! docker pull "${IMAGE_NAME}"; then
    echo "Could not pull ${IMAGE_NAME}. Clone mengtaoxin/dockers next to this repo, or set TDBOOK_UBUNTU_B_DIR / TDBOOK_TEST_IMAGE." >&2
    exit 1
  fi
}

ensure_image

docker_args=(
  run --rm --init --ipc=host
  -u ubuntu
  -w /workspaces/tdbook
  -e TDBOOK_INSIDE_TEST_CONTAINER=1
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
  -v "${ROOT_DIR}:/workspaces/tdbook"
  -v tdbook-npm-cache:/home/ubuntu/.npm
  -v tdbook-nm-root:/workspaces/tdbook/node_modules
)

# Forward optional env used by npm / CI / auth.
for key in NODE_AUTH_TOKEN CI GITHUB_ACTIONS CURSOR_AGENT AI_AGENT RUNNING_IN_CURSOR_CLOUD; do
  if [[ -n "${!key-}" ]]; then
    docker_args+=(-e "${key}=${!key}")
  fi
done

# Allocate a TTY when the host has one so Vitest/Playwright colors behave;
# still stream without -t when piped (agents / CI).
if [[ -t 1 ]]; then
  docker_args+=(-t)
fi
if [[ -t 0 ]]; then
  docker_args+=(-i)
fi

docker_args+=("${IMAGE_NAME}")
docker_args+=(/workspaces/tdbook/scripts/prepare-test-container.sh)
docker_args+=("${in_place_cmd[@]}")

exec docker "${docker_args[@]}"
