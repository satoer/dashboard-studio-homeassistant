#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "  Dashboard Studio - Native Home Assistant Installer"
echo "========================================================"

# Temporary work directory cleanup
TMP_DIR=""
cleanup() {
  if [ -n "${TMP_DIR}" ] && [ -d "${TMP_DIR}" ]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

# 1. Resolve source files (support cloned repo or piped curl/wget execution)
REPO_URL="https://github.com/satoer/dashboard-studio-homeassistant.git"
TARBALL_URL="https://github.com/satoer/dashboard-studio-homeassistant/archive/refs/heads/main.tar.gz"

SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

SOURCE_COMPONENT=""
if [ -n "${SCRIPT_DIR}" ] && [ -d "${SCRIPT_DIR}/custom_components/dashboard_studio" ]; then
  SOURCE_COMPONENT="${SCRIPT_DIR}/custom_components/dashboard_studio"
else
  echo "[1/5] Downloading latest release from GitHub..."
  TMP_DIR="$(mktemp -d)"
  if command -v git >/dev/null 2>&1; then
    git clone --depth 1 "${REPO_URL}" "${TMP_DIR}/repo" >/dev/null 2>&1
    SOURCE_COMPONENT="${TMP_DIR}/repo/custom_components/dashboard_studio"
  elif command -v curl >/dev/null 2>&1 && command -v tar >/dev/null 2>&1; then
    mkdir -p "${TMP_DIR}/tarball"
    curl -sSL "${TARBALL_URL}" | tar -xz -C "${TMP_DIR}/tarball" --strip-components=1
    SOURCE_COMPONENT="${TMP_DIR}/tarball/custom_components/dashboard_studio"
  elif command -v wget >/dev/null 2>&1 && command -v tar >/dev/null 2>&1; then
    mkdir -p "${TMP_DIR}/tarball"
    wget -qO- "${TARBALL_URL}" | tar -xz -C "${TMP_DIR}/tarball" --strip-components=1
    SOURCE_COMPONENT="${TMP_DIR}/tarball/custom_components/dashboard_studio"
  else
    echo "Error: Neither git, curl, nor wget is available to download files." >&2
    exit 1
  fi
fi

if [ ! -d "${SOURCE_COMPONENT}" ]; then
  echo "Error: Could not locate custom_components/dashboard_studio in downloaded source." >&2
  exit 1
fi

# 2. Stop and remove obsolete Docker container if it exists
if command -v docker >/dev/null 2>&1; then
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq '^dashboard-studio$'; then
    echo "[2/5] Stopping and removing obsolete dashboard-studio Docker container..."
    docker stop dashboard-studio >/dev/null 2>&1 || true
    docker rm dashboard-studio >/dev/null 2>&1 || true
    echo "      Removed old container on port 5050."
  else
    echo "[2/5] No old dashboard-studio container running."
  fi
else
  echo "[2/5] Docker not found (skipping container cleanup)."
fi

# 3. Detect Home Assistant installation & config path
echo "[3/5] Detecting Home Assistant configuration path..."
HA_CONTAINER=""
if command -v docker >/dev/null 2>&1; then
  HA_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | awk 'tolower($0) ~ /homeassistant|home-assistant/ {print $1; exit}' || true)"
fi

HA_CONFIG_HOST_DIR=""
if [ -n "${HA_CONTAINER}" ]; then
  echo "      Found Home Assistant container: ${HA_CONTAINER}"
  HA_CONFIG_HOST_DIR="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "${HA_CONTAINER}" 2>/dev/null || true)"
fi

# If not found via Docker mount, check standard directories
if [ -z "${HA_CONFIG_HOST_DIR}" ] || [ ! -d "${HA_CONFIG_HOST_DIR}" ]; then
  CANDIDATE_PATHS=(
    "/usr/share/hassio/homeassistant"
    "/opt/homeassistant/config"
    "/opt/homeassistant"
    "/srv/homeassistant"
    "/var/homeassistant/config"
    "/etc/homeassistant"
    "${HOME}/.homeassistant"
    "/root/.homeassistant"
  )
  for P in "${CANDIDATE_PATHS[@]}"; do
    if [ -d "${P}" ] && { [ -f "${P}/configuration.yaml" ] || [ -d "${P}/custom_components" ]; }; then
      HA_CONFIG_HOST_DIR="${P}"
      break
    fi
  done

  # Search user home directories if running with sudo
  if [ -z "${HA_CONFIG_HOST_DIR}" ]; then
    for H in /home/*/.homeassistant; do
      if [ -d "${H}" ] && { [ -f "${H}/configuration.yaml" ] || [ -d "${H}/custom_components" ]; }; then
        HA_CONFIG_HOST_DIR="${H}"
        break
      fi
    done
  fi

  # Deep search if still not found
  if [ -z "${HA_CONFIG_HOST_DIR}" ]; then
    SEARCH_FOUND="$(find /opt /srv /etc /var /home -maxdepth 4 -name "configuration.yaml" 2>/dev/null | head -n 1 || true)"
    if [ -n "${SEARCH_FOUND}" ]; then
      HA_CONFIG_HOST_DIR="$(dirname "${SEARCH_FOUND}")"
    fi
  fi
fi

# 4. Install custom component and migrate data
echo "[4/5] Installing native custom component..."
if [ -n "${HA_CONFIG_HOST_DIR}" ] && [ -d "${HA_CONFIG_HOST_DIR}" ]; then
  mkdir -p "${HA_CONFIG_HOST_DIR}/custom_components"
  rm -rf "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  cp -r "${SOURCE_COMPONENT}" "${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"
  echo "      Installed into ${HA_CONFIG_HOST_DIR}/custom_components/dashboard_studio"

  # Migrate old /opt/dashboard-studio/data if present
  if [ -d "/opt/dashboard-studio/data" ]; then
    mkdir -p "${HA_CONFIG_HOST_DIR}/dashboard_studio"
    cp -rn /opt/dashboard-studio/data/* "${HA_CONFIG_HOST_DIR}/dashboard_studio/" 2>/dev/null || true
    echo "      Migrated existing dashboards from /opt/dashboard-studio/data into ${HA_CONFIG_HOST_DIR}/dashboard_studio"
  fi
elif [ -n "${HA_CONTAINER}" ]; then
  docker exec "${HA_CONTAINER}" mkdir -p /config/custom_components
  docker cp "${SOURCE_COMPONENT}" "${HA_CONTAINER}:/config/custom_components/dashboard_studio"
  echo "      Installed into ${HA_CONTAINER}:/config/custom_components/dashboard_studio"
else
  echo "Error: Could not locate Home Assistant configuration directory." >&2
  echo "Please copy 'custom_components/dashboard_studio' manually into your Home Assistant /config/custom_components/ directory." >&2
  exit 1
fi

# 5. Restart Home Assistant
echo "[5/5] Restarting Home Assistant..."
RESTARTED=0
if [ -n "${HA_CONTAINER}" ]; then
  docker restart "${HA_CONTAINER}" >/dev/null 2>&1 && RESTARTED=1
  echo "      Restarted ${HA_CONTAINER} Docker container."
fi
if [ "${RESTARTED}" -eq 0 ] && command -v systemctl >/dev/null 2>&1; then
  for SVC in home-assistant homeassistant home-assistant@homeassistant; do
    if systemctl is-active --quiet "${SVC}" 2>/dev/null || systemctl is-enabled --quiet "${SVC}" 2>/dev/null; then
      systemctl restart "${SVC}" >/dev/null 2>&1 && RESTARTED=1
      echo "      Restarted ${SVC} systemd service."
      break
    fi
  done
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
echo "  2. Go to Settings -> Devices & Services -> Add Integration."
echo "  3. Search for 'Dashboard Studio' and click Submit."
echo "  4. In the Home Assistant sidebar, open 'Dashboard Studio Setup'."
echo "     Enable the devices and capabilities you want on your dashboards."
echo "  5. Click the link in Setup (or visit http://${HOST_IP}:8123/dashboard_studio/)"
echo "     to design and view your dashboards in full screen."
echo "========================================================"
