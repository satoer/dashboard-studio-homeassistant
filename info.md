# Dashboard Studio for Home Assistant

Dashboard Studio is a fully customizable dashboard designer and viewer running natively inside Home Assistant Core.

Dashboard Studio runs 100% in-process as a Home Assistant custom component on port 8123.

---

## Quick Setup

### One-Command Installer & Updater (Linux / Docker / Supervised)
```bash
curl -sSL https://raw.githubusercontent.com/satoer/dashboard-studio-homeassistant/main/install.sh | sudo bash
```
*Note: Run the same command at any time to update. User dashboards, media, snapshots, and settings in `/config/dashboard_studio/` are never overwritten or touched.*

### Or via HACS
1. Add custom repository: `https://github.com/satoer/dashboard-studio-homeassistant` (category: Integration).
2. Download and **Restart Home Assistant**.
3. Go to **Settings -> Devices & Services -> Add Integration**, search for **Dashboard Studio**, and click **Submit**.
4. Open **Dashboard Studio Setup** in the sidebar to enable the device capabilities you want on your dashboards.
5. Click the link in Setup (or visit `http://<your-ha-ip>:8123/dashboard_studio/`) to design and view dashboards.

---

## Key Highlights

* **Zero Token Setup:** Uses your existing Home Assistant web session.
* **Granular Whitelist:** Expose only the specific entities and capabilities you want on dashboards.
* **Persistent Backups:** Dashboards, snapshots, images, and audio live in `/config/dashboard_studio/` and are included in normal Home Assistant backups.
* **Built-in Services:** Send custom topics, trigger reloads, graph recorder insights, and parse iCal/RSS feeds natively.
