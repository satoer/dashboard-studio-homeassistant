#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="https://github.com/satoer/dashboard-studio-homeassistant.git"
DEFAULT_CLONE_DIR="${HOME}/dashboard-studio-homeassistant"

# If invoked via curl | bash outside a checkout, clone or update the repository first
if [ ! -d "${SCRIPT_DIR}/dashboard_studio" ] && [ ! -d "${SCRIPT_DIR}/HomeAssistant" ]; then
  if ! command -v git >/dev/null 2>&1; then
    apt-get update && apt-get install -y git
  fi
  if [ -d "${DEFAULT_CLONE_DIR}/.git" ]; then
    echo "Updating existing repository in ${DEFAULT_CLONE_DIR}..."
    git -C "${DEFAULT_CLONE_DIR}" pull --ff-only
  else
    echo "Cloning Dashboard Studio into ${DEFAULT_CLONE_DIR}..."
    git clone "${REPO_URL}" "${DEFAULT_CLONE_DIR}"
  fi
  SCRIPT_DIR="${DEFAULT_CLONE_DIR}"
fi

if [ -d "${SCRIPT_DIR}/dashboard_studio" ]; then
  BUILD_CONTEXT="${SCRIPT_DIR}/dashboard_studio"
elif [ -d "${SCRIPT_DIR}/HomeAssistant" ]; then
  BUILD_CONTEXT="${SCRIPT_DIR}/HomeAssistant"
else
  echo "Error: Could not find dashboard_studio or HomeAssistant build directory."
  exit 1
fi

DATA_DIR="${DASHBOARD_STUDIO_DATA_DIR:-/opt/dashboard-studio/data}"
PORT="${DASHBOARD_STUDIO_PORT:-5050}"
HA_PORT="${HA_PORT:-8123}"
HA_CONTAINER="${HA_CONTAINER:-}"

echo "========================================================"
echo "  Dashboard Studio - Home Assistant Docker Installer"
echo "========================================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH."
  exit 1
fi

# 1. Detect primary LAN IP address
HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ -z "${HOST_IP}" ]; then
  HOST_IP="127.0.0.1"
fi
HA_URL="${HA_URL:-http://127.0.0.1:${HA_PORT}}"

# 2. Detect running Home Assistant container & its /config mount
if [ -z "${HA_CONTAINER}" ]; then
  HA_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($0) ~ /homeassistant|home-assistant/ {print $1; exit}' || true)"
fi

HA_CONFIG_HOST_DIR=""
if [ -n "${HA_CONTAINER}" ]; then
  echo "[1/4] Detected Home Assistant container: ${HA_CONTAINER}"
  HA_CONFIG_HOST_DIR="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "${HA_CONTAINER}" 2>/dev/null || true)"
fi

if [ -z "${HA_CONFIG_HOST_DIR}" ] && [ -d "/opt/homeassistant/config" ]; then
  HA_CONFIG_HOST_DIR="/opt/homeassistant/config"
fi

if [ -n "${HA_CONFIG_HOST_DIR}" ] && [ -d "${HA_CONFIG_HOST_DIR}" ]; then
  echo "      Found Home Assistant config folder: ${HA_CONFIG_HOST_DIR}"
  mkdir -p "${HA_CONFIG_HOST_DIR}/custom_components"
  rm -rf "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  cp -r "${SCRIPT_DIR}/custom_components/dashboard_studio" "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  echo "      Installed custom_components/dashboard_studio into ${HA_CONFIG_HOST_DIR}/custom_components/"
elif [ -n "${HA_CONTAINER}" ]; then
  echo "      Copying custom_components/dashboard_studio into ${HA_CONTAINER}:/config/custom_components/..."
  docker exec "${HA_CONTAINER}" mkdir -p /config/custom_components
  docker cp "${SCRIPT_DIR}/custom_components/dashboard_studio" "${HA_CONTAINER}:/config/custom_components/"
else
  echo "[1/4] No running Home Assistant container auto-detected (skipping custom_components auto-copy)."
fi

# 3. Build Dashboard Studio Docker image
echo "[2/4] Building dashboard-studio Docker image..."
docker build -t dashboard-studio "${BUILD_CONTEXT}"

# 4. Prepare persistent data directory and start container
echo "[3/4] Preparing persistent data folder at ${DATA_DIR}..."
mkdir -p "${DATA_DIR}"

echo "[4/4] Starting dashboard-studio container on port ${PORT}..."
docker rm -f dashboard-studio >/dev/null 2>&1 || true

DOCKER_ARGS=(
  -d
  --name dashboard-studio
  --restart=unless-stopped
  --network=host
  -e "PORT=${PORT}"
  -e "HA_URL=${HA_URL}"
  -v "${DATA_DIR}:/data"
)

if [ -n "${HA_CONFIG_HOST_DIR}" ] && [ -d "${HA_CONFIG_HOST_DIR}" ]; then
  DOCKER_ARGS+=(-v "${HA_CONFIG_HOST_DIR}:/config")
fi

if [ -n "${HA_TOKEN:-}" ]; then
  DOCKER_ARGS+=(-e "HA_TOKEN=${HA_TOKEN}")
fi

docker run "${DOCKER_ARGS[@]}" dashboard-studio >/dev/null

echo ""
echo "========================================================"
echo "  Dashboard Studio is now running!"
echo "========================================================"
echo "  Designer & Viewer : http://${HOST_IP}:${PORT}"
echo "  Admin & Settings  : http://${HOST_IP}:${PORT}/admin"
echo ""
echo "  Next step in Home Assistant:"
echo "  1. Restart Home Assistant if this is your first install:"
echo "     sudo docker restart ${HA_CONTAINER:-homeassistant}"
echo "  2. In Home Assistant, go to Settings -> Devices & Services"
echo "     -> + Add Integration -> search for 'Dashboard Studio'."
echo "     Adding the integration automatically links your Home"
echo "     Assistant credentials with Dashboard Studio!"
echo "========================================================"
