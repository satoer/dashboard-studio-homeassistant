#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "  Dashboard Studio - Native Home Assistant Installer"
echo "========================================================"

# 1. Stop and remove obsolete Docker container if it exists
if command -v docker >/dev/null 2>&1; then
  if docker ps -a --format '{{.Names}}' | grep -Eq '^dashboard-studio$'; then
    echo "[1/4] Stopping and removing obsolete dashboard-studio Docker container..."
    docker stop dashboard-studio >/dev/null 2>&1 || true
    docker rm dashboard-studio >/dev/null 2>&1 || true
    echo "      Removed old container on port 5050."
  else
    echo "[1/4] No old dashboard-studio container running."
  fi
else
  echo "[1/4] Docker not found (skipping container cleanup)."
fi

# 2. Detect Home Assistant container & its /config mount
HA_CONTAINER=""
if command -v docker >/dev/null 2>&1; then
  HA_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($0) ~ /homeassistant|home-assistant/ {print $1; exit}' || true)"
fi

HA_CONFIG_HOST_DIR=""
if [ -n "${HA_CONTAINER}" ]; then
  echo "[2/4] Detected Home Assistant container: ${HA_CONTAINER}"
  HA_CONFIG_HOST_DIR="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "${HA_CONTAINER}" 2>/dev/null || true)"
fi

if [ -z "${HA_CONFIG_HOST_DIR}" ] && [ -d "/opt/homeassistant/config" ]; then
  HA_CONFIG_HOST_DIR="/opt/homeassistant/config"
fi

# 3. Copy custom_components/dashboard_studio into Home Assistant config
echo "[3/4] Installing native custom component..."
if [ -n "${HA_CONFIG_HOST_DIR}" ] && [ -d "${HA_CONFIG_HOST_DIR}" ]; then
  mkdir -p "${HA_CONFIG_HOST_DIR}/custom_components"
  rm -rf "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  cp -r "${SCRIPT_DIR}/custom_components/dashboard_studio" "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  echo "      Installed into ${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"

  # Migrate old /opt/dashboard-studio/data if present
  if [ -d "/opt/dashboard-studio/data" ]; then
    mkdir -p "${HA_CONFIG_HOST_DIR}/dashboard_studio"
    cp -rn /opt/dashboard-studio/data/* "${HA_CONFIG_HOST_DIR}/dashboard_studio/" 2>/dev/null || true
    echo "      Copied existing dashboards from /opt/dashboard-studio/data into ${HA_CONFIG_HOST_DIR}/dashboard_studio"
  fi
elif [ -n "${HA_CONTAINER}" ]; then
  docker exec "${HA_CONTAINER}" mkdir -p /config/custom_components
  docker cp "${SCRIPT_DIR}/custom_components/dashboard_studio" "${HA_CONTAINER}:/config/custom_components/"
  echo "      Installed into ${HA_CONTAINER}:/config/custom_components/dashboard_studio"
else
  echo "      Warning: Could not auto-detect /config folder. Please copy custom_components/dashboard_studio manually."
fi

# 4. Restart Home Assistant
echo "[4/4] Restarting Home Assistant..."
if [ -n "${HA_CONTAINER}" ]; then
  docker restart "${HA_CONTAINER}" >/dev/null
  echo "      Restarted ${HA_CONTAINER} container."
fi

HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
if [ -z "${HOST_IP}" ]; then
  HOST_IP="<your-ha-ip>"
fi

echo ""
echo "========================================================"
echo "  Dashboard Studio is ready!"
echo "========================================================"
echo "  1. Open Home Assistant: http://${HOST_IP}:8123"
echo "  2. Go to Settings -> Devices & Services -> Add Integration -> search 'Dashboard Studio' -> Submit."
echo "  3. Open 'Dashboard Studio Setup' in the sidebar to enable devices."
echo "  4. Open 'Dashboard Studio' in the sidebar (or visit http://${HOST_IP}:8123/dashboard_studio/)."
echo "========================================================"
