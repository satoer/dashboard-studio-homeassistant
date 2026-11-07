# Dashboard Studio V2 - AI Knowledge Base & Reference Specification

## 1. System Architecture & Runtime Environments

- **Platform:** Web-based dashboard editor and runtime for smart homes. Native driver on Homey Pro (LAN) or standalone (MQTT broker / Simulation).
- **Default Port:** 5050 (`http://<homey_ip>:5050/`).
- **Endpoints:**
  - `/` or `/index.html`: Primary entry. Automatically redirects to `/viewer.html` if **Viewer mode only** is enabled in Homey settings, otherwise opens standard dashboard with editor toggle.
  - `/editor.html`: Direct editor workspace. Never redirected.
  - `/viewer.html`: Lightweight kiosk runtime. Excludes all editor modules, tools, and UI scripts for fast boot and minimal RAM usage.
- **State Caching:** Homey app caches last-known capability values and replays them immediately on client connect so widgets populate instantly before incoming device events arrive.
- **Session Synchronization:** **Topic Auto-Echo** in Homey app settings rebroadcasts outgoing widget commands to all connected clients, keeping multiple tablets and browsers in sync. Disable only for isolated multi-user views.
- **Storage Locations:** Homey internal storage: dashboards (`dashboards/*.json`), themes (`themes/*.json`), uploaded images (`/images/`), uploaded audio (`/audio/`). Automatic snapshot backups store up to configured limit (default 10 snapshots). Permanent factory demo: `demo.json`.

## 2. Editor Interface & Navigation

- **Sidebar Header Badges:**
  - App Version: Current software build.
  - Connection Status: `Homey`, `MQTT`, `Simulation`, `Offline`. Hover reveals latency and server address.
  - Dashboard Name: Active configuration filename.
  - Active Page: Active page index (`P1`, `P2`, etc.).
  - Save Status: `Saved`, `Edited`, `Draft`.
- **Editor Modes (Editor Environment):**
  - **Basic:** Minimal inspector. Exposes widget name, visibility, page, basic size/responsive cell, widget label, show container, preset picker, and essentials for that widget type.
  - **Advanced:** Full inspector. Exposes all fine-tuning slideouts: nested typography, border styles, glows, shadows, icon styles, animation speeds, audio triggers, and advanced bindings.
- **Canvas Alignment:**
  - Grid Size: Default 10 px.
  - Snap to Grid: Toggles automatic snapping during drag and resize. In Responsive Columns the control reads **Snap to Grid in groups** and applies inside an open group.
  - Show Grid Overlay: Visual alignment dots. In Fixed Resolution and Scale to Fit Screen the overlay covers the canvas. In Responsive Columns the control reads **Show Grid Overlay in groups** and shows on the open group canvas.
  - Widget Labels In Editor Canvas: `Hide`, `Always`, `Hover`.
- **Quick Toolbar:**
  - Floating palette for rapid editing actions.
  - Modes: `Auto Hide When Docked` (docks when Universal Actions scrolls out of view), `Always Visible`, `Never Visible`.
  - Geometry: Free-floating or edge-docked. Dragging corners or edges reconfigures icon layout into multiple rows or columns.
- **Selection & Layering:**
  - Click to select widget.
  - Group Canvas Box Select: Drag selection rectangle on canvas inside an open group.
  - Select Behind (Stacked Widgets): **Middle Mouse Click** or **Alt + Left-Click** on overlapping stack cycles through and selects widgets underneath.
  - Z-Index Layering: **Bring to Front** and **Send to Back** buttons in top toolbar move active selection one layer up or down.
- **Keyboard Shortcuts (Active in Edit Mode):**
  - `Ctrl/Cmd + E`: Toggle Edit Mode (works from Live or Edit mode).
  - `Ctrl/Cmd + S`: Save to Homey or Export Dashboard.
  - Hold ``` or `²` (Azerty): Temporary Live Preview (interact with widgets while holding; releasing returns to Edit Mode with selection intact).
  - Hold `Ctrl/Cmd + ``` or `²`: Temporary Live Preview while keeping editor sidebar open.
  - `Ctrl/Cmd + Z`: Undo (up to 20 steps).
  - `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z`: Redo (up to 20 steps).
  - `Ctrl/Cmd + C` / `X` / `V`: Copy / Cut / Paste widget snippet via internal clipboard.
  - `Ctrl/Cmd + D`: Duplicate selected widget.
  - `Del` or `Backspace`: Delete selected widget.
  - *Note:* Shortcuts are bypassed while typing inside text fields or code editors.

## 3. Layout Modes & Responsive Geometry

Configured in **Dashboard Environment -> Layout Mode**. Existing widgets are preserved when switching modes.

### Fixed Resolution
- Free-form canvas using absolute pixel coordinates: `X`, `Y`, `Width`, `Height`.
- Dimensions: Choose **Resolution Preset** (phones, tablets, displays) or type custom **Width** and **Height** in px (`0` on an axis fills available viewport space).
- Best for pixel-perfect wall tablets and overlapping layered designs.

### Scale to Fit Screen
- Canvas is designed in fixed pixels identical to Fixed Resolution, but scales uniformly at runtime to fill viewport.
- **Keep Aspect Ratio:**
  - *Enabled (default):* Uniform scaling with letterboxing. Dashboard background still fills whole display.
  - *Disabled:* Stretches layout non-uniformly across entire viewport.

### Responsive Columns
- Fluid column grid where widgets act as cells and reflow automatically across varying screen widths.
- **Environment Settings (Dashboard Settings -> Dashboard Environment):**
  - `Column Count`: Maximum number of columns across wide displays.
  - `Reduce Columns to Fit`: Automatically drops column count when window narrows below `Min Column Width` before scrolling.
  - `Min Column Width`: Hard width floor per column (px).
  - `Max Column Width`: Caps column expansion (`0` = fill available space).
  - `Column Alignment`: Placement of leftover space (`Left`, `Center`, `Right`, `Stretch`).
  - `Gap (px)`: Horizontal and vertical spacing between cells.
  - `Min Widget Height`: Height floor for `Auto` cells, and the default `Min Height` for `Fill` cells.
  - `Page Padding`: Grid insets from viewport edges (Left, Right, Top, Bottom).
  - `Width`: Maximum page width (`0` = full viewport width). Height is unused.
  - `Hide Scrollbars on dashboard`: Clips scrollbars for clean kiosk screens.
- **Per-Widget Settings (Responsive Layout & Dimensions):**
  - `Scale Mode`:
    - `Resize` (default): Widget container reflows and expands to cell dimensions.
    - `Rescale`: Maintains Widget Width and Widget Height as design aspect ratio, scaling interior content proportionally from center while borders, corner radius, padding, and glow remain at configured pixel values.
  - `Order`: Numeric sequence index (lower numbers render first). Automatically assigned on creation.
  - `Column Span`: Number of grid columns the cell spans across.
  - `Preferred Column`: Specific column target (`0` = auto-place; if target column is unavailable, widget temporarily auto-places and returns when column fits).
  - `Cell Height Mode`: `Auto` (default, content height floored by `Min Widget Height`), `Fixed` (typed `Cell Height` in px), or `Fill` (uses free space down to the next widget that shares any of its columns, content is not used for packing). `Min Height` (Fill only) overrides `Min Widget Height` for that cell, including when it is last in the column. Same three modes on closed groups.
- **Groups in Responsive Columns:**
  - A closed group acts as a single cell in the responsive grid.
  - `Resize`: Stretches group members to fill cell.
  - `Rescale`: Scales entire composite group proportionally from center, preserving design aspect ratio across devices.
  - Editing: Open group to adjust members on free-form canvas. **Snap to Grid in groups** and **Show Grid Overlay in groups** (Editor Environment) apply on that group canvas. Closing recalculates bounding box from members with `Show Container` enabled. Members with `Show Container` disabled act as floating overlays.

## 4. Data Routing, Topics & Formula Engine

### Topic Structure & Routing
- Topics are communication channels formatted as strings without spaces:
  - Device Capability: `<device_id>/<capability_id>` (e.g. `sensor_123/measure_temperature`, `light_456/onoff`).
  - Homey Flow Event: `homey/event/<name>` (triggered by **Send ... to Dashboard** action).
  - Homey Insight: `homey/insight/<log_name>` (pushed by **Send Insight** action).
  - Local Client Topic: `local/<name>` (e.g. `local/active_tab`, `local/dialog_open`). Stays 100% inside client browser, generates zero network/hub traffic, executes synchronously.
- **Homey Capability Configuration:** Capabilities are hidden by default. In Homey app open **Settings -> Dashboard Studio -> Configuration**, expand device, and check each capability to enable incoming updates and outgoing control.
- **Access Badges:**
  - `[R]`: Read-only. Displays incoming data; ignores outgoing control commands.
  - `[W]`: Write-only. Command channel without state feedback.
  - `[RW]`: Read/write bidirectional channel.
  - `[L]`: Local in-browser topic.
  - `[F]`: Homey Flow event topic.

### Binding Options
Click faders icon next to bound property to configure:
- **Default Value:** Fallback value used when topic has not published any data yet. Available across checkboxes, numbers, text, colors, icons, selects.
- **Color Adjustments (Bound Color Fields):**
  - `Apply Corrections`: Toggles color transformation pipeline.
  - Channels: Color Tone, Color Intensity, Brightness.
  - Modes:
    - `Adj` (Relative Offset/Multiplier): Color Tone (-180 to +180 deg), Color Intensity (0 to 200%), Brightness (0 to 200%).
    - `Fix` (Absolute Pin): Color Tone (0 to 360 deg), Color Intensity (0 to 100%), Brightness (0 to 100%).
- **Boolean Transform Modes (Bound Checkbox Fields):**
  - **Boolean Payload Mapping:** Maps custom incoming text strings to on/off states.
    - `Custom True Value`: Exact case-insensitive string that coerces to ON.
    - `Custom False Value`: Exact case-insensitive string that coerces to OFF.
    - Blank field acts as wildcard for opposite state.
  - **Numeric Payload Formula:** Runs incoming numerical payload through formula; non-zero coerces to ON, zero coerces to OFF.

### Payload Formula Engine
- **Formula Constraints:** Maximum 512 characters. Evaluates on incoming payload or referenced topics.
- **Variables & Chips:**
  - `value`: Primary incoming payload from bound topic.
  - `{{topic/path}}`: External live topic reference.
- **Operators:**
  - Arithmetic: `+`, `-`, `*`, `/`, `%` (modulo), `^` (power).
  - Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`. Case-insensitive for string comparisons.
- **Logical Functions (Arguments: comparisons, topic chips, or numbers. 0 = false, non-zero = true):**
  - `and(a, b, ...)`: Returns 1 if all arguments are non-zero, else 0.
  - `or(a, b, ...)`: Returns 1 if at least one argument is non-zero, else 0.
  - `not(a)`: Returns 1 if argument is 0, else 0.
  - `xor(a, b, ...)`: Returns 1 if an odd number of arguments are non-zero, else 0.
  - `nor(a, b, ...)`: Returns 1 if all arguments are 0, else 0.
- **Math & Utility Functions:**
  - `if(condition, valueIfTrue, valueIfFalse)`: Conditional ternary evaluation.
  - `round(n)` or `round(n, decimals)`: Rounds to integer or specified decimal places.
  - `min(a, b, ...)`: Returns smallest argument.
  - `max(a, b, ...)`: Returns largest argument.
  - `abs(n)`: Absolute numerical value.
  - `number(n)`: Coerces string or argument to number.
- **Nested Formulas & Multi-Band Thresholds:**
  - Place nested `if()` calls in the else branch to map ranges.
  - Rule: Evaluate **highest** threshold on outside first so upper values match immediately.
  - Example: `if(value >= 66, #ff0000, if(value >= 33, #00ff00, #0000ff))` (>=66 Red, 33-65 Green, <33 Blue).
  - Return Values: Supports numbers, quoted strings (`"text"`), hex colors (`#rrggbb`), theme tokens (`@token`), Phosphor icon classes (`"ph-..."`).

## 5. Standardized Data Schemas & Payload Formats

### Unified Light State (JSON)
Single standardized JSON payload controlling power, brightness, color, and temperature simultaneously. Compatible with Home Assistant light standards.

```json
{
  "state": "ON",
  "brightness": 255,
  "color_mode": "hs",
  "color": {
    "h": 360,
    "s": 100
  },
  "color_temp": 153
}
```
- `state`: `"ON"` or `"OFF"`.
- `brightness`: Integer `0` to `255`.
- `color_mode`: `"hs"` (hue/saturation) or `"color_temp"` (mireds).
- `color.h`: `0` to `360`. `color.s`: `0` to `100`.
- `color_temp`: Mireds (`153` cold white to `500` warm white).
- **Partial Updates (Patching):** Omitted fields remain unchanged (e.g. `{"brightness": 128}` dims light without altering color or state).
- **Auto-Color Extraction:** Binding any Color property (such as Icon Color or Theme Background) directly to a Unified Light State topic automatically extracts hue and saturation.
- **Light Grid Array:** Light Grid widget can bind directly to a JSON array of state objects:
  `[ {"state": "ON", "brightness": 255}, {"state": "OFF"}, {"state": "ON", "color": {"h": 120, "s": 100}} ]`

### Graph Data Formats
- **1. Live Stream (Single Number):** Incoming numerical payload (e.g. `24.5`) appends to historical buffer. Configured via **Buffer Size (Stream)** and **Scroll Direction**.
- **2. Simple Array (Snapshot):** Plain number array replacing entire series: `[10, 15, 12, 18, 20]`. X-axis uses point index.
- **3. Object Array (Snapshot with Time/Labels):**
  ```json
  [
    { "t": "2026-05-01T08:00:00Z", "v": null },
    { "t": "2026-05-01T10:00:00Z", "l": "Morning", "v": 100 },
    { "t": "2026-05-01T12:00:00Z", "l": "Noon", "v": 105 }
  ]
  ```
  - `v` (required): Numerical Y-axis value. Use `null` for missing/empty readings; line breaks at `null` instead of dropping to zero.
  - `l` (optional): Category label string. Rendered ONLY when **X Axis Format** is set to **Text Labels**.
  - `t` (optional): ISO-8601 timestamp string. Rendered ONLY when **X Axis Format** is set to Date/Time formats. Never place category words in `t`.
  - Sorting: If all points contain valid `t`, sorted chronologically; otherwise keeps array order.
- **4. Categorized Map (Object):** Key-value object where keys are X-axis labels and values are numbers:
  `{"Solar\n(22%)": 3.2, "Grid\n(38%)": 5.4, "Heating": 4.1}`.
  Requires **X Axis Format** set to **Text Labels**. Supports `\n` for multi-line labels.

### List / Log Data Formats
- **1. Simple Text (Log Mode):** Plain text string prepends to top of list. Older lines trimmed at Max Lines. Supports `\n` line breaks.
- **2. Pipe-Delimited String:** Single string encoding checkbox, icon, and text:
  - `"Front Door Open"`: Unchecked, no icon.
  - `"ph-warning|Front Door Open"`: Unchecked, warning icon.
  - `"true|Front Door Open"`: Checked, no icon.
  - `"true|ph-warning|Front Door Open"`: Checked, warning icon.
- **3. JSON Array (List Mode - Replaces List):**
  ```json
  [
    { "text": "Network Online", "checked": true, "icon": "ph-wifi-high", "timestamp": 1709550000000 },
    { "text": "Door Closed", "checked": false }
  ]
  ```
- **Interactive Checklist Outputs:**
  - Output Modes: `On Any Change` (immediate publish on click/edit) or `On Trigger Topic Only` (publishes on receipt of trigger message).
  - Output Formats: `JSON Array (Objects)` (full array with text/checked/icon/timestamp) or `Boolean Array` (`[true, false, true]`).
- **Control Topics:**
  - `Trigger Topic`: Receiving any message triggers state publication.
  - `Trigger Topic: Select All`: Marks all items checked.
  - `Trigger Topic: Deselect All`: Marks all items unchecked.
  - `Trigger Topic: Delete Selected`: Permanently removes checked items.
- **State Persistence & Loopback Defense:** Bind widget **Data** and **Output Topic** to the same Homey variable. The widget detects its own echo via content fingerprinting and avoids re-publishing.

### Calendar & iCal JSON
Returned by Homey flow card **Load & filter iCal** as **Filtered Events (JSON)** token:
```json
{
  "filterStart": "2026-05-01T00:00:00.000Z",
  "filterEnd": "2026-05-07T23:59:59.999Z",
  "events": [
    {
      "title": "Team sync",
      "startDate": "2026-05-02T14:00:00.000Z",
      "endDate": "2026-05-02T15:00:00.000Z",
      "uid": "event-uid@example.com",
      "allDay": false,
      "calendarId": "source_id",
      "isTimed": true,
      "isAllDay": false,
      "isMultiDay": false,
      "isRecurring": false,
      "calendarEventKind": "timed",
      "calendarEventBlock": 2
    }
  ]
}
```
- `calendarEventKind`: `timed`, `all_day`, `multi_day`, `recurring`.
- `calendarEventBlock`: Numeric index `1` to `4` mapping to event color blocks in markdown tables.

## 6. Markdown & Text Widget Formatting Reference

Rendered through `markdown-it` and sanitized via `DOMPurify`.

### Inline Phosphor Icons
- **Legacy slug:** `:ph-house:`, `:ph-lightbulb-fill:`. Uses widget Markdown Icon Style.
- **Explicit weight & glyph:** `:ph-duotone ph-android-logo:`, `:ph(ph-bold ph-sun):`.
- **Sizing:** Append `|size` in pixels: `:ph-sun|32:`, `:ph-duotone ph-heart|24:`.
- **Tinting:**
  - Single color (hex or theme token): `:ph-heart|#ff8800:`, `:ph-sun|@accent:`.
  - Duotone two-layer tint: `:ph-duotone ph-android-logo|@primary|@danger:` (primary glyph layer, secondary accent layer).
  - Combined size and tint: `:ph-cloud-sun|32|#ff8800:`.

### Image Syntax & Attributes
- **Basic:** `![Alt Text](url)`.
- **Sizing:**
  - Width only: `![Alt|240](url)` (height scales proportionally).
  - Height only: `![Alt|x180](url)` (width scales proportionally).
  - Explicit width and height: `![Alt|240x180](url)`.
- **Tinting:** `![Alt|#ff8800](url.svg)`, `![Alt|@accent](url.png)`. Fills transparent silhouette with flat color.
- **Combined:** `![Alt|240|@accent](url)`.

### Links & Navigation
- **Standard Link:** `[Label](url)` (opens in current tab).
- **New Tab Link:** `[Label](url ^)` (trailing caret inside parentheses opens new tab with `rel="noopener noreferrer"`).
- **Internal Help Link:** `[Label](help://Topic%20Name/subpage#heading-slug)`. Opens in-app Documentation panel. Trailing `^` is ignored.

### Inline Styling Wrappers
- **Text Color:** `[color #RRGGBB]text[/color]` or `[color @themeToken]text[/color]`. Usable in headers, paragraphs, table cells.
- **Table Cell Background:** `[cell #RRGGBB]` or `[cell @themeToken]` placed at the very start of a markdown table cell.
  Example: `| Room | [cell @accentSoft][color @text]21 °C[/color] |`.
- **Block Callouts:** `[block1:Content]` through `[block4:Content]`. Styled via Block 1-4 Color settings in Text widget.
- **GFM Tables:** Standard syntax `| A | B |` with alignment row `| :--- | :---: | ---: |`. Can be forced via widget typography alignment settings.
- **Line Breaks in Payload:** `\n` inside single-line topic payloads or MQTT strings is converted to `<br>`.
- **Live Topic Embedding:** `{{topic/path}}` in text widget body is automatically interpolated with real-time topic data.

## 7. Homey Integration & Flow Cards

### Device Configuration (Homey App Settings)
- Navigate to **Settings -> Dashboard Studio -> Configuration**.
- Expand devices and check desired capabilities. Each checked capability creates an addressable topic and permits remote write operations. Unchecked capabilities are inaccessible.
- Variables appear as read-only topics.

### Flow Triggers (When...)
- **Dashboard Studio <event> triggered:** Fires when an interactive widget with matching **Output Topic** is activated. Exposes tags:
  - `Value (String)`: Raw payload string.
  - `Value (Number)`: Numerical coercion.
  - `Value (Boolean)`: Boolean coercion.
- **Dashboard Loaded / Refreshed:** Fires when any client opens or refreshes a dashboard. Exposes tag:
  - `Dashboard Name`: Name of opened configuration file (e.g. `tablet`).
- **Dashboard Saved:** Fires immediately after editor successfully saves configuration to Homey.

### Flow Actions (Then...)
- **Send <event> with value <val> to Dashboard:** Publishes data to topic `homey/event/<event>`. Accepts strings, numbers, booleans, or JSON.
- **Send Insight <log> for <range> with resolution <points> to Dashboard:** Resamples historical log into evenly spaced points and pushes to `homey/insight/<log_name>`.
  - Ranges: Rolling hours/days, or **Today** (midnight to midnight).
  - Empty or future intervals are emitted with `"v": null` to maintain time axis without drawing false lines.
- **Get Insight Data (Advanced):** Same pipeline as Send Insight, but outputs flow tags: `Raw Data JSON`, `Highest`, `Lowest`, `Average`.
- **Reload Dashboard <name>:** Instructs all open display/kiosk clients currently viewing `<name>` to reload configuration from Homey. Editors are unaffected.
- **Load & filter iCal from <url> for <window>:** Downloads calendar feed, trims events to specified timeframe, and outputs **Filtered Events (JSON)**.
- **Convert <events> to <layout> markdown:** Converts calendar JSON into formatted Markdown table matching selected view (Day, Week, Month, Today/Tomorrow). Uses styling from Homey App Settings -> Calendar.
- **Combine calendar events from <A> and <B>:** Merges two calendar JSON payloads.
- **Calendar Flow Best Practices:**
  - Poll feeds at most once every 15 minutes to avoid rate-limiting from Apple/Google.
  - When loading 3 or more feeds, chain serially (Load A -> Combine with B -> Combine with C) rather than spawning heavy parallel requests on Homey hardware.

## 8. Complete Catalog of All 18 Widgets

### 1. Widget Presets
- Reusable appearance and behavior templates for a specific widget type.
- Built-in factory presets plus user-created **My Presets** (saved to Homey storage).
- Applied via Preset Picker in widget inspector. Only checked/included properties in the preset overwrite widget values; unincluded properties remain untouched.

### 2. Arrow / Line
- **Type:** `arrow`
- **Purpose:** Static visual divider or animated flow indicator.
- **Data & Behavior:** Types: Line, Arrow, Double Arrow, Elbow, Curved Bezier. Orientation/direction, length, line width.
- **Appearance:** Stroke color, opacity, dash array (`stroke-dasharray`).
- **Animation:** Enable Animation toggle, flow direction, animation speed.

### 3. Battery
- **Type:** `battery`
- **Purpose:** Battery level, liquid tank, or percentage gauge.
- **Data & Behavior:** Value topic (0-100), Charging State topic (boolean).
- **Appearance:** Orientation (horizontal/vertical), outline style, fill style, warning threshold, danger threshold, normal/warning/danger/charging fill colors, charging lightning bolt glyph.
- **Audio Triggers:** On Full, On Empty, On Charging, On Stop Charging.

### 4. Clock
- **Type:** `clock`
- **Purpose:** Real-time clock and calendar display.
- **Data & Behavior:** Display mode (Digital, Analog, Flip). Timezone offset, 12h/24h format, show seconds, show AM/PM. Date formats.
- **Appearance:** Dial colors, tick marks, hour/minute/second hand styling, digital typography.
- **Audio Triggers:** Every Second, Every Minute, Every Hour, Every Day.

### 5. Container
- **Type:** `container`
- **Purpose:** Structural card backdrop, grouping frame, or labeled panel.
- **Data & Behavior:** Group Label (header string displayed above card).
- **Appearance:** Card background color, gradient type (flat, linear, mirror, radial), background image, opacity, border width, border color, corner radius, glow/shadow effects, padding.
- **Show Container Toggle:** Disabling hides the card backdrop while leaving child widgets visible.

### 6. Dialog Box
- **Type:** `dialog`
- **Purpose:** Confirmation modal overlay. Serves as master default for Switch/Button confirmation dialogs, or can be overridden locally.
- **Data & Behavior:** Dialog title text, confirmation message text, Confirm button label/icon, Cancel button label/icon.
- **Appearance:** Backdrop dimming opacity, backdrop blur, dialog card dimensions, card background, border, button colors.

### 7. Edit Box
- **Type:** `editbox`
- **Purpose:** User text or number entry field that publishes values to topics.
- **Data & Behavior:** Input type (text, number, password), placeholder text, default value. Action topic (target topic).
- **Trigger Actions:** Send on Enter key, Send on Blur (focus lost), Submit button.
- **Number Constraints:** Min, max, step increments.

### 8. Gauge
- **Type:** `gauge`
- **Purpose:** Radial or linear metric indicator.
- **Data & Behavior:** Value topic, min, max. Value formatting: decimal places, keep trailing zeros, abbreviate large numbers. Units text, caption text.
- **Appearance:** Gauge style (Radial full circle, semi-circle, horseshoe arc, linear horizontal/vertical bar). Arc width, track color, bar fill color, threshold color zones.
- **Icons:** Central icon slot (`icons.on`), Phosphor icon or custom image, tint.
- **Typography:** Caption, value, unit, and axis tick labels.
- **Audio Triggers:** On Value Change.

### 9. Graph
- **Type:** `graph`
- **Purpose:** Historical chart, categorical bar graph, or real-time streaming plot.
- **Data & Behavior:**
  - Modes: Live Stream (buffer size, scroll direction) vs Snapshot (replaces series).
  - Chart Types: Line, Area, Bar, Spline (smooth cubic curve).
  - Auto Min/Max: Automatic range detection or fixed bounds. Zero baseline option. Smoothing amount (0-100).
- **Axes & Labels:**
  - X-Axis Format: `Datapoints` (index), `Text Labels` (reads `l` key or object keys), Date/Time formats (reads ISO `t` key).
  - Axis Fixed Width, label rotation, tick intervals.
  - Y-Axis Rounding: Exact Bounds, Smart Intervals, Strict Integers.
- **Appearance:** Line stroke width, fill gradient, point markers, horizontal grid lines, vertical grid lines, negative value handling.

### 10. Icon
- **Type:** `icon`
- **Purpose:** Status indicator glyph or standalone graphic button.
- **Data & Behavior:** State topic (boolean or value).
- **Icon Slots:** Inactive Slot (`icons.off`) and Active Slot (`icons.on`). Identity mirroring toggle (`activeIconMirrorsInactive`). Supports Phosphor icon class or custom image URL (`/images/...`).
- **Appearance:** Sizing, icon colors, duotone accent color, blink effect, animation spin/pulse speed.
- **Audio Triggers:** On Activated, On Deactivated.

### 11. Image
- **Type:** `image`
- **Purpose:** Picture display, camera stream, SVG graphic, or animated asset.
- **Data & Source:**
  - Source Types: URL (web/LAN link), SVG (raw XML string), Gallery path (`/images/...`).
  - Image Fit: `cover`, `contain`, `fill`, `none`, `tile`.
  - Live Refresh: Timer-based URL reload in milliseconds for snapshot camera feeds. Pauses when editor open or tab hidden.
  - Fallback URL: Image shown on HTTP error or broken link (default `images/brokenlink.png`; clear to show nothing).
- **Animations:** Rotation, pulse, bounce.

### 12. Light Grid
- **Type:** `lightgrid`
- **Purpose:** Compact multi-tile smart lighting controller.
- **Data & Behavior:**
  - Binding: Bound to Unified Light State JSON array, or each tile bound to individual light topics.
  - Control Modes: Toggle (simple click on/off), Dimmer, or Control Panel Popover (shows slider, color wheel, temperature bar, and preset buttons).
- **Tile Layout:** Columns, rows, tile gap, tile corner radius.
- **Appearance & Icons:** Per-light icon slots (`icons.on`), light name typography, status indicators, panel slider styling.
- **Audio Triggers:** On Tile On, On Tile Off, On Panel Open, On Panel Close.

### 13. List / Log
- **Type:** `list`
- **Purpose:** Event history log, live message feed, or interactive task checklist.
- **Data & Behavior:**
  - Modes: Log mode (appends plain text strings with Max Lines limit) or List mode (JSON array of items).
  - Raw Data Mode: Displays raw payload without parsing.
  - Output Modes: `On Any Change` or `On Trigger Topic Only`.
  - Output Formats: `JSON Array (Objects)` or `Boolean Array`.
  - Control Topics: Trigger Topic, Select All, Deselect All, Delete Selected.
- **Appearance:** Show checkboxes toggle, checkbox alignment (Left/Right), read-only toggle, strikethrough checked items, timestamps (12h/24h, date formats). Row icons (Default, On, Off slots).
- **Audio Triggers:** On Checkbox On, On Checkbox Off.

### 14. Menu
- **Type:** `menu`
- **Purpose:** Multi-button navigation bar, dropdown menu, or slide-out drawer.
- **Data & Behavior:**
  - Layout Types: Dropdown, Vertical List, Horizontal Bar, Slide-out Panel.
  - Menu Items: Array of rows. Each row configures Label, Icon (On/Off slots, Phosphor/custom image), Tap Action (**Topic Publish**, **Go to Page**, **Open URL**), Status Topic binding.
  - Selection Groups: Radio-button mutual exclusivity across menu items. `Send Off When Turned Off by Group` option.
- **Typography:** Group label, item text, active/inactive colors.
- **Audio Triggers:** Menu Open, Menu Close, Item Press, Item Release, Item Toggle On, Item Toggle Off.

### 15. Slider
- **Type:** `slider`
- **Purpose:** Linear continuous controller for brightness, volume, setpoints.
- **Data & Behavior:** Value topic, min, max, step increment. Orientation (horizontal/vertical).
- **Custom Display Range:** Remaps displayed value readout (`displayMin`, `displayMax`) without altering underlying raw transmitted payload.
- **Behavior:** Update on drag vs update on release.
- **Appearance:** Track height/width, track color, fill color, thumb size, thumb shape, thumb glow. Value readout and unit typography.
- **Audio Triggers:** On Value Sent.

### 16. Switch / Button
- **Type:** `switch`
- **Purpose:** Universal switch, push button, page navigator, or URL launcher.
- **Data & Behavior:**
  - Modes: Toggle Switch, Push Button (Momentary), Go to Page, Open URL, Script/Action.
  - State (On/Off) Topic: Listens to device state to reflect ON/OFF status.
  - Command (Output) Topic: Topic published on interaction.
  - Payload Configuration: Custom On Value and Off Value (boolean, string, number).
  - Hold to Activate Duration: Required press-and-hold duration (seconds) before action fires.
  - Confirmation Dialog: Intercepts action with modal confirmation prompt (uses Master Dialog Box or local overrides).
  - Selection Groups: Radio-style exclusivity across buttons sharing group ID.
- **Visual Styles:** Toggle Switch, Push Button, Rocker Switch, Tile, Round Push, Flush.
- **Icons:** Dual slots (`icons.on`, `icons.off`). Phosphor icons or custom image URLs, tint with icon color, separate on/off/hover colors.
- **Typography:** Group Label (above control) and Button Label (inside or outside control: Top, Bottom, Left, Right).
- **Audio Triggers:** On Press, On Release, On Toggle On, On Toggle Off.

### 17. Text
- **Type:** `text`
- **Purpose:** Markdown text display, tabular data, live status messages, calendar views.
- **Data & Behavior:** Static or topic-bound Markdown content. Live variable interpolation (`{{topic/path}}`).
- **Markdown Table Styles:** Classic, Modern, Clean, Borderless, Compact, Stat Strip, Kanban columns.
- **Color Overrides:** Table background, table border, separator line, table header background, alternating row background, block 1-4 callout colors.
- **Typography Slideouts:** Paragraph, H1, H2, H3, Table Header, Table Body, Inline Code, Blockquote, Link.
- **Audio Triggers:** On Text Change.

### 18. Label
- **Type:** `label`
- **Purpose:** Lightweight plain text display for quick captions, titles, or status readouts without Markdown overhead.
- **Data & Behavior:** Text content (static or bound topic), vertical alignment (Top, Middle, Bottom), text rotation (-360 to 360 deg).
- **Layout & Sizing:** Auto Width (Fit to Content), Auto Height (Fit to Content). Fitted size is used for closed-group Rescale/Resize. Text does not wrap (explicit line breaks only).
- **Typography:** Nested typography (`overrides.typography.label`): font family, size, case, bold, italic, alignment, color, opacity, offsets.
- **Appearance:** Show Container toggle (defaults to false for transparent placement). Inherits container styling when enabled.

## 9. Tools, Media Galleries & Audio System

### Tools Menu (Hammer Icon)
Plugin scripts loaded on demand:
- **Widget Preset Editor (`scripts/widget-preset-editor.js`):**
  - Spreadsheet matrix for managing presets. Rows = widget properties; Columns = preset variants.
  - `Include` Checkboxes: Controls which properties are applied. Only checked properties overwrite widget settings.
  - Filter modes: `All`, `Included` (properties stored in at least one open column), `Differing` (properties with differing values across columns).
  - Actions: Copy to My Presets, Duplicate, Save to Homey, Export/Import JSON.
- **Set Link Open Behavior (`scripts/link-target.js`):**
  - Bulk modifies link targeting (**New Tab** vs **Same Tab**) across Switch (Open URL), Edit Box (Open URL), Menu (row URLs), Light Grid (per-light URLs), and Text (markdown links via `^`).

### Image Gallery Manager
- Dedicated file manager on Homey Pro storage under `/images/`.
- Formats: JPG, PNG, GIF, SVG, WEBP. Maximum file size: 8 MB.
- View modes: Responsive thumbnail grid and detailed list view (sort by name, size, date).
- Quick Actions: Upload, search, multi-select delete, rename, download, copy path (`/images/filename.ext`).
- Field Insertion: Image URL fields in widget inspectors provide a gallery picker button to select or upload images directly.

### Audio Gallery & Audio Subsystem
- Audio file storage on Homey Pro under `/audio/`.
- Formats: MP3, WAV, OGG, M4A, AAC, WEBM, FLAC. Maximum file size: 15 MB.
- Built-in sound library: Kenney free audio pack built into the app (cannot be deleted or renamed).
- **Startup Mute Protection:** All dashboard audio playback is automatically muted for 5 seconds after dashboard load to prevent burst playback caused by cached state replay.
- **Topic Audio:** Configured in **Dashboard Settings -> Audio**. Maps specific topics to audio file paths; plays chosen clip whenever topic receives a new payload.
- **Per-Widget Audio:** 10 widget types feature an Audio slideout supporting direct assignment of clips to operational events (press, release, toggle, threshold, interval).

## 10. Styling Hierarchy & Theme System

### 3-Tier Styling Cascade
1. **Theme Colors (Global Root):**
   - Palette tokens applied system-wide:
     - `@background`: Base canvas background.
     - `@backgroundAccent`: Gradient secondary background.
     - `@primary`: Primary brand / control color.
     - `@accent`: Secondary highlight / indicator color.
     - `@text`: Default high-contrast text color.
     - `@textMuted`: Secondary / caption text color.
     - `@cardBackground`: Default widget container fill.
     - `@cardBorder`: Standard card border stroke.
     - `@cardBorderAccent`: Focused / highlighted border stroke.
     - `@success`: Positive state / on indicator.
     - `@warning`: Attention / threshold indicator.
     - `@danger`: Alarm / critical threshold indicator.
   - Tokens can be entered into color fields or used in Markdown (`[color @accent]...`, `[cell @cardBackground]`). Changing token updates all bound elements instantly.
2. **Master Widget Defaults (Dashboard Settings):**
   - Universal starting values for Container Style, Dialog Box, and individual widget types (Gauge, Slider, Switch, Light Grid, Clock). Newly created widgets inherit master defaults.
3. **Local Widget Overrides (Inspector):**
   - Explicit settings applied to an individual widget instance. Deviations override master defaults.
- **Resetting Overrides:**
  - Field Reset Arrow: Clicking reset icon beside an overridden input reverts that property to master default.
  - Selected Widget Tools -> **Current**: Clears color and font overrides on selected widget, reverting to active theme.
  - Selected Widget Tools -> **All**: Clears color and font overrides across all widgets on canvas.

## 11. Advanced Recipes, Patterns & Troubleshooting

### Teleporting Groups (Modal Dialog Overlays)
Pattern to show complex multi-widget popups or confirmation dialogs without changing pages:
1. Create dialog components (backdrop container, message text, action buttons) on the canvas.
2. Select all components and click **Group**.
3. Move the group to an unused page index (e.g. Page 99) or leave on active page.
4. Bind Group **Visibility** to a local topic: `local/show_dialog`.
5. Open Button: Action publishes `true` to `local/show_dialog`.
6. Confirm Button: Action executes desired Homey command AND publishes `false` to `local/show_dialog`.
7. Cancel Button: Action publishes `false` to `local/show_dialog`.

### Auto-Hiding Controls
Pattern to reveal controls on tap and automatically hide them after a delay:
1. Bind target widget or group **Visibility** to `local/controls_visible`.
2. Button action publishes `true` to `local/controls_visible`.
3. Create Homey Flow: **When** `Dashboard Studio 'local/controls_visible' triggered` with value `true` -> **Then** Delay X seconds -> Send `false` to `local/controls_visible`.

### Dynamic Ambience Lighting
Pattern to synchronize dashboard background tone with a room's physical RGB smart lamp:
1. In Homey app settings, enable **Unified Light State (JSON)** for the target RGB fixture.
2. In Dashboard Settings -> Theme Colors, bind **Background** to the light's Unified Light State topic.
3. Open **Binding Options** on Background. Enable **Apply Corrections** under **Color Adjustments**.
4. Set Brightness to **Fix** mode and dial to a dark percentage (e.g. 15-25%) so room hue is mirrored on the canvas without washing out readability.
5. Bind **Background Accent** to the same topic with a slight Color Tone offset (`Adj` +20 deg) to create a matching ambient gradient.

### URL Query Parameters Reference
Used to initialize dashboard state, automate kiosks, or direct device bookmarks:
- `?dashboard=<name>` or `?cfg=<name>`: Loads `dashboards/<name>.json` (e.g. `?dashboard=tablet`).
- `&page=<n>`: Automatically navigates to 1-based page index (e.g. `&page=2`).
- `&theme=<name>`: Forces specific theme on load (e.g. `&theme=Clean Slate`).
- `&token=<secret>`: Security authentication token.
- `&test_mode=true`: Enables loading of experimental widgets from `widgets-experimental/`.
- Combined Example:
  `http://192.168.1.50:5050/viewer.html?dashboard=wallpanel&page=1&theme=Dark&token=pass123`

### Security & Remote Access
- **Security Token:** Configured in Homey App Settings -> Dashboard Studio -> Settings -> **Require Security Token**.
  - Server-side enforcement: Unauthenticated requests without `?token=<token>` are blocked at HTTP server level before any dashboard HTML or device capabilities can be served.
- **Port Forwarding:** Forward external router TCP port (e.g. 5050) to Homey local IP port 5050.
  - *Risk:* Plain HTTP connections expose security tokens to network interception.
- **Recommended Remote Access:** Use WireGuard or Tailscale VPN to access the local Homey IP securely without opening public router ports.

### Troubleshooting Matrix
1. **Widget Not Updating:**
   - Capability not enabled: Open Homey App Settings -> Dashboard Studio -> Configuration and verify capability checkbox is checked.
   - Topic case mismatch: Topics are strictly case-sensitive (`sensor/measure_temp` != `sensor/measure_Temp`). Inspect live traffic in **Data Stream Explorer**.
   - Read/Write mismatch: Binding interactive control (slider/switch) to a `[R]` read-only topic will not transmit commands.
2. **Layout Displaced / Broken on Mobile:**
   - In **Responsive Columns**, check `Min Column Width`. If viewport is narrower than this floor and `Reduce Columns to Fit` is disabled, horizontal scrolling occurs.
   - For dedicated phone views, design a tailored layout at phone resolution (e.g. 390x844) and save as `mobile.json`, targeting it via `?dashboard=mobile`.
3. **Only Viewer Displays (Cannot Access Editor):**
   - **Viewer mode only** is enabled in Homey settings. Navigate directly to `/editor.html` to access editor.
4. **Missing Save, Load, Image Gallery, or Audio Gallery Buttons:**
   - Platform is not set to Homey. Open **Dashboard Settings -> Platform Connection** and switch Platform dropdown from `MQTT` or `Simulation` to `Homey`.
