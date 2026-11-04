const fs = require('fs');

const file = 'b:/Dashboard-Studio/DashboardStudio/assets/dashboards/demo.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const rewrites = {
  title_main: {
    text: "## :ph-rocket-launch: Dashboard Studio Showcase\n\n__The ultimate demonstration of capability__\n\nExplore interactive widgets, deep customizations, and premium layouts in this live demo.",
    typography: { mdH2: { color: "@accent", textAlign: "left", fontSize: 24, fontBold: true }, mdParagraph: { color: "@textMuted", textAlign: "left", fontSize: 13, italic: true } },
    mdBlockSpacing: 4
  },
  nav_info: {
    text: ":ph-cursor-click: **Interactive Demo**\n\nClick any card to explore the widget features. You can select different templates in the editor to see how styles dynamically adapt to your design.",
    typography: { mdParagraph: { color: "@text", textAlign: "center", fontSize: 14 } },
    mdBlockSpacing: 8
  },
  p2_title: {
    text: "# :ph-toggle-left: Switches & Buttons",
    typography: { mdH1: { color: "@text", textAlign: "center", fontSize: 22 } }
  },
  sw_desc_1: {
    text: "### :ph-info: Button Styles & Features\n\n| Style | Description |\n|---|---|\n| **Toggle** | Classic UI for persistent On/Off states. |\n| **Button** | Standard rectangular actions with glowing bounds. |\n| **Design** | Every color across On, Off, Hover, and Icons can be tweaked! |",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } },
    mdTableStyle: "minimal"
  },
  sw_desc_2: {
    text: "### :ph-lightning: Momentary Mode\nThe switch automatically resets to **Off** immediately after being released to trigger single events.",
    typography: { mdH3: { color: "@warning", textAlign: "left" }, mdParagraph: { fontSize: 13, textAlign: "left" } }
  },
  p3_title: {
    text: "# :ph-gauge: Smart Gauges",
    typography: { mdH1: { textAlign: "center", fontSize: 22 } }
  },
  gauge_desc: {
    text: "### :ph-faders: Configurable Gauges\n\n| Feature | Capability |\n|---|---|\n| **Axis** | Smart axis labels with custom baselines. |\n| **Shorten** | Auto-format numbers (e.g. 1720 to 1.72k). |\n| **Gradients** | Transition seamlessly across data tiers. |\n| **Layouts** | Top, bottom, left or right alignments. |\n| **Simulation** | Driven by internal simulation values. |\n\n> *Tip:* Experiment with Size Adjustments or Offset sliders to perfect the positioning.",
    mdTableStyle: "card_rows",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  p4_title: {
    text: "# :ph-chart-line-up: Live Graphs",
    typography: { mdH1: { textAlign: "center", fontSize: 22 } }
  },
  graph_txt: {
    text: ":ph-stack: **Layering Technique**\n\nThis graph combines **two widgets** on top of each other. The background traces a long-term trend, while the foreground renders live noise data. \n\n*Enable \"Transparent Background\" on the top layer to achieve this effect.*",
    typography: { mdParagraph: { textAlign: "left", fontSize: 13 } }
  },
  p5_title: {
    text: "# :ph-sliders-horizontal: Precision Sliders",
    typography: { mdH1: { textAlign: "center", fontSize: 22 } }
  },
  slider_desc: {
    text: "### :ph-hand-swipe-right: Interactive Controls\nSliders support both touch gestures and mouse drag interaction.\n\n- **Orientations:** Vertical & Horizontal modes.\n- **Thickness:** Independent track & fill width.\n- **Depth:** Drop shadows on interactive thumbs.",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  p6_title: { text: "# :ph-arrow-up-right: Animated Arrows & Lines", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  p7_title: { text: "# :ph-list-checks: Edit Box & Lists", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  list_info: {
    text: "### :ph-list-dashes: Interactive Lists & Logs\nThe widget on the left demonstrates real-time logging alongside the checklist engine.\n\n1. **Interact:** Tap checkboxes to toggle states with strikethroughs.\n2. **Master Actions:** Use topics to hit *Select All*, *Clear*, or *Delete*.\n3. **Format:** Accepts boolean strings or complete JSON arrays.\n4. **Sync:** Publish edits back to Homey dynamically.",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  p8_title: { text: "# :ph-text-t: Rich Typography", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  lbl_rich: {
    text: "### :ph-markdown-logo: Markdown Support\nDashboard Studio supports robust **Rich Text** formatting seamlessly.\n\n| Style | Preview |\n|---|---|\n| Headers | Automatically resize & render. |\n| Bold & Italic | **Bold** and _Italic_ easily. |\n| Tables | Use 20+ preset table themes! |\n\nThis is ideal for creating instruction panels or system status logs! You can even add custom Google fonts natively via Typography.",
    mdTableStyle: "minimal",
    typography: { mdH3: { textAlign: "left", color: "@accentSoft" }, mdParagraph: { textAlign: "left" } }
  },
  lbl_align: { text: "### Alignment Control\n*(Right Aligned)*", textAlign: "right" },
  lbl_font: { text: "### Digital Fonts\n*(JetBrains Mono)*" },
  p9_title: { text: "# :ph-image: Icons & Images", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  p10_title: { text: "# :ph-clock: Timekeeping", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  p11_title: { text: "# :ph-battery-high: Battery Monitoring", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  p12_title: { text: "# :ph-bounding-box: Advanced Layouts", typography: { mdH1: { textAlign: "center", fontSize: 22 } } },
  lbl_layout_info: {
    text: "### :ph-exclude: Container Grouping\n\nThe panel on the left is created by putting a **Container Widget** _behind_ the switches.\n\n> Use `Send to Back` and `Bring to Front` to orchestrate advanced z-index layering.",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  label_5916: {
    text: "### :ph-arrows-left-right: Arrow Dynamics\n\n- **Vector Control:** Drag handles to adjust direction.\n- **Lines:** Set head size to 0 to transform arrows into standard lines.\n- **Animation:** Toggle flow effects to visualize active movement!"
  },
  label_9334: { text: "### Standard Fonts\n*(Roboto)*", typography: { mdH3: { textAlign: "center" } } },
  label_7416: { text: ":ph-crop: **Scaled & Cropped**\nFocuses on the center of the asset" },
  label_0756: { text: ":ph-arrows-in: **Scaled to Fit**\nWith interval auto-refreshing" },
  label_8971: { text: ":ph-arrows-out: **Non-Proportional**\nStretched across container bounds" },
  label_8704: { text: "### Mr. Fusion\n**Home Energy Reactor**\n_Output: 1.21 GW_", typography: { mdH3: { color: "@warning" } } },
  label_5596: {
    text: "## :ph-presentation: Welcome to the Layout Engine\n\nPreview Dashboard Studio’s potential. Select **Reset Canvas** and click save to start a fresh layout, and make sure your platform connection is live.\n\n*You can load this `demo` view anytime through the dashboard loader.*",
    typography: { mdH2: { textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  label_0692: { text: ":ph-video-camera: **Camera 01**\n_Living Room_" },
  label_5408: { text: "Thick line without arrowhead\n_(Head size = 0)_" },
  label_278377: { text: ":ph-arrow-fat-line-down: **Reversed Flow**\nThick vector path" },
  label_8583280: { text: "Curved Bezier" },
  label_8482777: { text: "**Pulsing Flow**\n_Width 100, Gradient 0_" },
  label_7932811: { text: "Drunk arrow" },
  label_2005513: {
    text: ":ph-layers-intersection: **Seamless Page Transitions**\n\nDid you know this camera view is technically on **Page 2**? By assigning widgets to multiple pages (e.g., `[1, 2]`), you create static components that seamlessly persist while other background elements slide away. Perfect for fixed sidebars!",
    typography: { mdParagraph: { textAlign: "left" } },
    mdBlockSpacing: 12
  },
  label_8098: { text: "The **Output Topic** of the button is wired directly to the **Trigger Topic** of the box using a local `local/switch` topic." },
  label_1293: { text: ":ph-arrows-clockwise: Widget **Rotation** property is bound dynamically to a live driver value!" },
  label_1536420: { text: "The **Output** of the Edit box drives the **Data payload** of the List box using a shared local topic." },
  label_3953404: { text: "_Check out the help documentation for detailed guides!_" },
  label_503562: { text: "### :ph-vector-logo: SVG Animations\nAn image widget can natively render and animate complex SVGs." },
  label_9382935: {
    text: "### :ph-radio-button: Selection Groups\nButtons sharing a `Selection Group ID` act as a radio array: enabling one automatically deselects all sibling peers.",
    typography: { mdH3: { color: "@accentSoft", textAlign: "left" }, mdParagraph: { textAlign: "left" } }
  },
  label_389162219: { text: "# :ph-list: Context Menus", typography: { mdH1: { textAlign: "left", fontSize: 22 } } },
  label_156382317: { text: "A standard **Toggle** button. Its output topic triggers activation for the Menu widget globally, while keeping noise off your home network using standard `local/` scoping.", typography:{ mdParagraph: { textAlign: "left" } } },
  label_3936373: { text: "When a target menu item is invoked, the action signals back to the triggering button to elegantly shut the menu down.", typography:{ mdParagraph: { textAlign: "left" } } },
  label_2194784: { text: "Checkbox-style items. Toggling them does _not_ forcefully dismiss the menu array. (You can adjust this via Close Methods).", typography:{ mdParagraph: { textAlign: "left" } } },
  label_8996431: { text: "These are grouped items. Only **one** configuration option can be enabled simultaneously.", typography:{ mdParagraph: { textAlign: "left" } } },
  label_3747553: { text: "This button invokes a smooth, animated slide-out context menu overlay.", typography:{ mdParagraph: { textAlign: "left" } } }
};

let count = 0;
for (const [id, widget] of Object.entries(data.widgets)) {
  if (widget.type === 'label') {
    widget.type = 'text';
    const ov = widget.overrides || {};
    
    // Save old font before deleting
    const oldFont = ov.fontFamily;
    
    // Default alignment
    const align = ov.textAlign || 'center';
    
    delete ov.textColor;
    delete ov.fontSize;
    delete ov.fontFamily;
    delete ov.lineHeight;
    delete ov.labelCase;
    delete ov.textAlign;
    
    if (ov.metaName && ov.metaName.startsWith('Label -')) {
      ov.metaName = ov.metaName.replace('Label -', 'Text -');
    }

    if (rewrites[id]) {
      const rw = rewrites[id];
      ov.text = rw.text;
      ov.typography = rw.typography || {};
      
      if (!ov.typography.mdParagraph) ov.typography.mdParagraph = {};
      
      // Preserve old special fonts if they were used (like Jetbrains Mono)
      if (oldFont && oldFont !== "'Inter', sans-serif" && oldFont !== "") {
        ov.typography.mdParagraph.fontFamily = oldFont;
        if (!ov.typography.mdH3) ov.typography.mdH3 = {};
        ov.typography.mdH3.fontFamily = oldFont;
      }

      if (rw.mdTableStyle) ov.mdTableStyle = rw.mdTableStyle;
      if (rw.mdBlockSpacing) ov.mdBlockSpacing = rw.mdBlockSpacing;
      if (rw.textAlign) {
        ov.textAlign = rw.textAlign;
      } else {
        ov.textAlign = 'typography'; 
      }
    } else {
      // generic mapping for anything unexpected
      ov.typography = {
        mdParagraph: { textAlign: align, fontFamily: oldFont }
      };
      ov.textAlign = 'typography';
    }
    count++;
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Migrated ' + count + ' label widgets to text widgets.');
