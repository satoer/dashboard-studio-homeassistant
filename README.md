# Dashboard Studio for Home Assistant (v2.3.2)

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![HACS Custom Integration](https://img.shields.io/badge/HACS-Custom%20Integration-orange.svg)](https://hacs.xyz/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **Visualize your smart home, exactly how you imagine it.**  
> Visual WYSIWYG Dashboard Designer and Runtime Server for Home Assistant with full entity control, Ingress support, and MQTT integration.

---

## Quick Installation (Home Assistant OS / Supervised)

1. In Home Assistant, navigate to **Settings &rarr; Add-ons &rarr; Add-on Store**.
2. Click the three dots in the top-right corner and select **Repositories**.
3. Add this repository URL:
   `	ext
   https://github.com/satoer/dashboard-studio-homeassistant
   `
4. Scroll down (or search) for **Dashboard Studio**, click **Install**, and then **Start**.
5. Enable **Show in sidebar** to launch the Designer and Viewer directly within Home Assistant Ingress!

---

## Companion Custom Integration

The Add-on automatically copies the companion custom component into your Home Assistant /config/custom_components/dashboard_studio directory on first startup.

After starting the Add-on:
1. Restart Home Assistant Core once.
2. Go to **Settings &rarr; Devices & Services &rarr; Add Integration**.
3. Search for **Dashboard Studio** and click to add it.
4. Enjoy all 14 automation flowcard equivalents natively in Home Assistant automations (triggers, conditions, and services)!

---

## Direct Kiosk & Tablet Access

In addition to Home Assistant Ingress, you can access the runtime viewer and admin panel directly on dedicated wall-mounted tablets via direct port:
* **Designer / Viewer:** http://<homeassistant-ip>:5050/
* **Admin & Settings:** http://<homeassistant-ip>:5050/admin

---

## Author & Support

Created by **Satoer Creations** ([dashboardstudio@satoer.com](mailto:dashboardstudio@satoer.com)).
