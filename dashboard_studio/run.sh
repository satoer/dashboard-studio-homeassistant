#!/usr/bin/env bash
set -e

echo "[Dashboard Studio] Starting Home Assistant Add-on..."

export DATA_PATH="/data"
mkdir -p /data/dashboards /data/themes /data/widget-presets /data/images /data/audio

# Read options from /data/options.json if present
if [ -f /data/options.json ]; then
    OPT_PORT=$(jq -r '.port // empty' /data/options.json)
    OPT_HA_URL=$(jq -r '.ha_url // empty' /data/options.json)
    OPT_HA_TOKEN=$(jq -r '.ha_token // empty' /data/options.json)

    if [ -n "$OPT_PORT" ] && [ "$OPT_PORT" != "null" ]; then
        export PORT="$OPT_PORT"
    fi
    if [ -n "$OPT_HA_URL" ] && [ "$OPT_HA_URL" != "null" ]; then
        export HA_URL="$OPT_HA_URL"
    fi
    if [ -n "$OPT_HA_TOKEN" ] && [ "$OPT_HA_TOKEN" != "null" ]; then
        export HA_TOKEN="$OPT_HA_TOKEN"
    fi
fi

# Auto-install or update the companion custom_component into Home Assistant's config directory
HA_CONFIG_DIR=""
if [ -d "/homeassistant" ]; then
    HA_CONFIG_DIR="/homeassistant"
elif [ -d "/config" ]; then
    HA_CONFIG_DIR="/config"
fi

if [ -n "$HA_CONFIG_DIR" ] && [ -d "/app/custom_components/dashboard_studio" ]; then
    mkdir -p "$HA_CONFIG_DIR/custom_components/dashboard_studio"
    cp -Rf /app/custom_components/dashboard_studio/* "$HA_CONFIG_DIR/custom_components/dashboard_studio/" 2>/dev/null || true
    echo "[Dashboard Studio] Synced custom_components/dashboard_studio to $HA_CONFIG_DIR/custom_components/dashboard_studio"
fi

cd /app
exec node server.js
