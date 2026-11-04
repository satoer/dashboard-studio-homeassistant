# Dashboard Studio for Home Assistant

A high-performance, fully customizable dashboard designer and viewer running natively inside Home Assistant.

Dashboard Studio runs 100% in-process as a Home Assistant custom component. There is no external server, no Node.js process, no Docker container, and no port 5050 to maintain. Everything is served directly by Home Assistant over port 8123 using your active Home Assistant session.

---

## Features

* **Native In-Process Integration:** Runs entirely within Home Assistant Core with zero external dependencies or background containers.
* **Single Sign-On Security:** Uses your existing Home Assistant login session. No long-lived access tokens to generate, copy, or paste.
* **Instant Sidebar Setup:** Adds an admin-only Setup panel directly to the Home Assistant sidebar for device and capability management.
* **Selective Capability Whitelisting:** Choose exactly which devices and capabilities are exposed to dashboards, keeping memory and network usage minimal.
* **Full-Featured Designer:** Drag-and-drop dashboard designer with widgets, composite widgets, themes, and presets.
* **Safe Local Storage:** All dashboards, snapshots, themes, presets, images, and audio files are stored under `/config/dashboard_studio/` and are automatically included in standard Home Assistant backups.
* **Kiosk & Tablet Ready:** Automatic WebSocket reconnection and seamless token renewal for always-on wall displays.
* **Rich Services:** Built-in actions for sending custom MQTT-style topics, reloading dashboards, generating recorder insight charts, and converting iCal/RSS feeds to Markdown.

---

## Installation

### Method 1: Single-Command Automated Installer (Linux / Docker / Supervised)

Run this single command in your Linux terminal (via SSH or directly on your server):

```bash
curl -sSL https://raw.githubusercontent.com/satoer/dashboard-studio-homeassistant/main/install.sh | sudo bash
```

*(or using wget)*:

```bash
wget -qO- https://raw.githubusercontent.com/satoer/dashboard-studio-homeassistant/main/install.sh | sudo bash
```

**What the installer does automatically:**
1. Detects your Home Assistant configuration directory (Docker container mount, Home Assistant OS/Supervised, or Core path).
2. Stops and removes any obsolete `dashboard-studio` Docker container on port 5050.
3. Downloads and installs `custom_components/dashboard_studio` into your Home Assistant `/config/custom_components/` directory.
4. Migrates existing dashboards from `/opt/dashboard-studio/data` if present.
5. Restarts Home Assistant.

---

### Method 2: HACS

1. Open **HACS** in your Home Assistant sidebar.
2. Click the three dots in the top right corner and select **Custom repositories**.
3. Add the repository URL: `https://github.com/satoer/dashboard-studio-homeassistant` and select category **Integration**.
4. Click **Download** on the Dashboard Studio card.
5. **Restart Home Assistant**.
6. In Home Assistant, navigate to **Settings -> Devices & Services -> Add Integration**.
7. Search for **Dashboard Studio** and click **Submit** (no configuration inputs required).

---

### Method 3: Manual Installation

1. Download the latest release or clone this repository.
2. Copy the `custom_components/dashboard_studio` folder into your Home Assistant `/config/custom_components/` directory.
   The structure should be:
   ```text
   /config/
     └── custom_components/
           └── dashboard_studio/
                 ├── __init__.py
                 ├── manifest.json
                 ├── static_frontend/
                 └── ...
   ```
3. **Restart Home Assistant**.
4. In Home Assistant, navigate to **Settings -> Devices & Services -> Add Integration**.
5. Search for **Dashboard Studio** and click **Submit**.

---

## Updating Dashboard Studio

To update an existing installation to the latest version:

### Option 1: Single-Command Update (Linux / Docker / Supervised)

Run the exact same automated command on your server:

```bash
curl -sSL https://raw.githubusercontent.com/satoer/dashboard-studio-homeassistant/main/install.sh | sudo bash
```

*(or with wget)*:

```bash
wget -qO- https://raw.githubusercontent.com/satoer/dashboard-studio-homeassistant/main/install.sh | sudo bash
```

### Option 2: HACS
If installed via HACS, navigate to **HACS -> Integrations**, click **Update** on Dashboard Studio, and restart Home Assistant.

### Option 3: Manual Update
Replace the `custom_components/dashboard_studio/` folder with the new release files and restart Home Assistant.

> [!NOTE]
> **User files are 100% protected during updates.**
> All dashboards, uploaded images, audio files, custom themes, presets, version snapshots, and capability settings are stored in `/config/dashboard_studio/` and `/config/.storage/`. Updates only replace the integration code in `/config/custom_components/dashboard_studio/` and never touch or overwrite your personal data.

---

## Getting Started

1. **Enable Devices & Capabilities:**
   In the Home Assistant sidebar, click **Dashboard Studio Setup** (admin-only). Browse your devices, entities, helpers, automations, or scenes and select the checkboxes for the capabilities you want available on your dashboards. Click **Save**.

2. **Open the Dashboard Studio Designer:**
   Click the link in the top banner of **Dashboard Studio Setup**, or open directly in any browser tab:
   * **Designer & App:** `http://<your-ha-ip>:8123/dashboard_studio/`
   * **Direct Dashboard View:** `http://<your-ha-ip>:8123/dashboard_studio/?dashboard=<name>`
   * **Viewer Only Mode:** Can be toggled on in the Setup panel under Settings.

---

## File Storage Locations

All user assets are saved under your Home Assistant configuration directory so that Home Assistant backups protect your work:

* `/config/dashboard_studio/dashboards/`: Dashboard JSON definitions
* `/config/dashboard_studio/snapshots/`: Automatic version history snapshots
* `/config/dashboard_studio/images/`: Uploaded gallery images
* `/config/dashboard_studio/audio/`: Uploaded audio files
* `/config/dashboard_studio/themes/`: Custom themes
* `/config/dashboard_studio/presets/`: Custom widget presets
* `.storage/dashboard_studio.config`: Whitelist and general settings

---

## Available Home Assistant Services

The integration provides the following in-process services under the `dashboard_studio` domain:

* `dashboard_studio.send`: Broadcast a custom topic and value to all connected dashboards.
* `dashboard_studio.reload`: Reload dashboards on connected wall tablets or viewers.
* `dashboard_studio.send_insights`: Query Home Assistant Recorder history and stream downsampled chart data.
* `dashboard_studio.send_insights_advanced`: Downsample history with custom resolution and aggregation methods.
* `dashboard_studio.load_filter_ical`: Fetch, filter, and format RFC 5545 calendar feeds.
* `dashboard_studio.webcal_to_markdown`: Merge up to 5 iCal feeds and format them into Markdown with localized times.
* `dashboard_studio.combine_ical_data`: Merge multiple iCal documents into a single calendar feed.
* `dashboard_studio.fetch_rss_markdown`: Fetch RSS/Atom feeds and format them into Markdown headlines or summaries.
