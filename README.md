# Dashboard Studio for Home Assistant (v2.3.2)

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![HACS Integration](https://img.shields.io/badge/HACS-Custom%20Integration-orange.svg)](https://hacs.xyz/)
[![Local Storage](https://img.shields.io/badge/Storage-100%25%20Local-green.svg)]()
[![Free to Use](https://img.shields.io/badge/License-Free%20to%20Use-cyan.svg)]()

> **Visualize your home, exactly how you imagine it.**

---

## Introduction

Unleash your creativity with **Dashboard Studio**, the ultimate visual interface design tool for your smart home. Break free from rigid grids, static rows, and predefined button lists. Dashboard Studio functions more like a free-form graphics program: giving you a completely blank canvas where you can place, layer, group, rotate, and resize widgets with pixel-perfect precision to create compositions that match your interior design and personal style.

This Add-on turns your Home Assistant instance into a local web server that hosts both the visual WYSIWYG designer and a high-performance, real-time viewer runtime. It runs smoothly on iPads, Android tablets, desktop browsers, smartphones, and dedicated touchscreen displays (such as wall-mounted tablets or Raspberry Pi kiosks).

With **100% local storage directly on your Home Assistant**, your dashboard files, themes, widget presets, uploaded media, and automated timestamped snapshots remain entirely private on your local hub with zero cloud latency and absolutely no subscription fees.

---

## Key Perks & Features

* **Visual WYSIWYG Canvas:** Free-form drag, drop, multi-selection, alignment guides, grouping, z-indexing, and responsive scaling.
* **Rich Native Widget Suite:**
  * **Controls:** Gauges, Sliders, Toggle Buttons, Push Buttons, and Light Grids.
  * **Media & Information:** Clocks (Analog & Digital), Weather, Live Images, Video Streams, and Animated Arrows for energy flows.
  * **Dynamic Content:** Markdown Text widgets, RSS/Atom news feeds, and WebCal/iCal agendas.
  * **Charts & Historical Data:** High-performance graphing engine connecting directly to Home Assistant Recorder history.
* **Dual-Access Architecture:**
  * **Home Assistant Ingress:** Integrated directly into your Home Assistant sidebar.
  * **Direct Port 5050:** Dedicated direct web UI access for wall tablets and kiosk browsers without needing Home Assistant authentication wrappers.
* **Native Home Assistant Integration:**
  * Automatic mapping of Areas, Devices, Entities, and Attributes.
  * Native support for Helpers (input_boolean, input_number, input_text, input_select, counter, 	imer).
  * Automations, Scripts, and Scenes mapped as interactive flow topics.
  * Automatic installation of the companion custom integration exposing 14 native Automation triggers, conditions, and action services.
* **Integrated MQTT Driver:** Connect widgets directly to any local or external MQTT broker alongside Home Assistant entities.
* **Snapshot Drawer & History:** Automatic and manual timestamped version backups of your dashboards with one-click restore.

---

## Quick Installation Guide

### Step 1: Add the Repository
1. In Home Assistant, open **Settings &rarr; Add-ons &rarr; Add-on Store**.
2. Click the three dots menu (`...`) in the top-right corner &rarr; **Repositories**.
3. Add the repository URL:
   `	ext
   https://github.com/satoer/dashboard-studio-homeassistant
   `
4. Click **Add**, then close the dialog.

### Step 2: Install & Start
1. Search for or select **Dashboard Studio** in the Add-on Store list.
2. Click **Install** (the initial build takes 1-2 minutes).
3. Toggle **Show in sidebar** and **Start on boot**.
4. Click **Start**.

### Step 3: Enable Native Automations (Companion Integration)
On startup, the Add-on automatically places the companion custom component into your Home Assistant /config/custom_components/dashboard_studio folder:
1. Restart Home Assistant Core once (**Developer Tools &rarr; Restart**).
2. Go to **Settings &rarr; Devices & Services &rarr; Add Integration**.
3. Search for **Dashboard Studio** and click to add it.
4. All 14 automation triggers, conditions, and action services are now available in your Home Assistant Automation Editor!

### Step 4: Dedicated Wall-Mounted Tablets & Kiosks
For wall displays or kiosks, open:
* **Viewer Runtime:** `http://<homeassistant-ip>:5050/viewer.html?dashboard=YourDashboardName`
* **Configuration & Admin Panel:** `http://<homeassistant-ip>:5050/admin`

---

## Support & Official Website

For comprehensive guides, tutorials, video walkthroughs, and interactive live demos, visit the official website:

* **Official Website & Documentation:** [https://satoer.com/dashboardstudio/](https://satoer.com/dashboardstudio/)
* **Interactive Online Demo:** [https://satoer.com/dashboardstudio/demo/](https://satoer.com/dashboardstudio/demo/)
* **Support Email:** [dashboardstudio@satoer.com](mailto:dashboardstudio@satoer.com)

---

## Support the Project

Dashboard Studio is an independent passion project representing thousands of hours of development to bring you a professional-grade interface tool for free.

If you enjoy using the software and want to help support ongoing development, consider buying a couple of Red Bulls:

☕ [**Donate via PayPal**](https://www.paypal.com/donate/?hosted_button_id=GR8AUPXN8TW9Q)

Donations are never required, but always deeply appreciated and keep the motivation high!

---

## Copyright & License Terms

© 2026 **Satoer Creations**. All rights reserved.

Dashboard Studio is an independent project built and maintained with passion by a single developer.

### Free to Use
It is completely free for both personal and commercial use. Feel free to use it in your own smart home, at work, or for commercial client installations at no cost.

### Support the Project
A great deal of time, effort, and care goes into developing and maintaining Dashboard Studio. If this software helps you run your business or you are making money with your installations, a donation is always very much appreciated to help support ongoing development.

### Respect the Work
All designs, code, and assets remain the property of Satoer Creations. Please do not resell, repackage, or redistribute Dashboard Studio, and do not claim it as your own creation.

### Disclaimer
Dashboard Studio is provided "as is" without warranty of any kind. Use at your own discretion.
