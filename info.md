# Dashboard Studio for Home Assistant

Dashboard Studio is a fully customizable dashboard designer and viewer running natively inside Home Assistant Core.

There is no external server, Docker container, or Node.js process to maintain, and no port 5050. Everything runs in-process on Home Assistant port 8123.

---

## Quick Setup

1. **Restart Home Assistant** after downloading via HACS or placing the folder into `custom_components/`.
2. Go to **Settings -> Devices & Services -> Add Integration**.
3. Search for **Dashboard Studio** and click **Submit**.
4. Open **Dashboard Studio Setup** in the sidebar to enable the device capabilities you want to use.
5. Open **Dashboard Studio** in the sidebar to create and view dashboards.

---

## Key Highlights

* **Zero Token Setup:** Uses your existing Home Assistant web session.
* **Granular Whitelist:** Expose only the specific entities and capabilities you want on dashboards.
* **Persistent Backups:** Dashboards, snapshots, images, and audio live in `/config/dashboard_studio/` and are included in normal Home Assistant backups.
* **Built-in Services:** Send custom topics, trigger reloads, graph recorder insights, and parse iCal/RSS feeds natively.
