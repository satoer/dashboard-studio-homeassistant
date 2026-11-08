/**
 * Dashboard Studio - Editor Tooltip Data Dictionary
 * Personally authored plain-English tooltips for 100% of editor settings, labels, and buttons.
 * Deep links connect directly to relevant sections in the in-app Documentation guide.
 */
(function (global) {
    'use strict';

    var SETTINGS_METADATA = {
    "editor-tools": {
        "title": "Editor Tools",
        "description": "Quick toolbar actions to manage galleries, snippets, helper scripts, and editor display modes.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "2-editor-tools"
        }
    },
    "editor-zoom": {
        "title": "Edit Mode Zoom",
        "description": "Adjust canvas magnification level in edit mode to inspect fine widget details or zoom out for full layouts.",
        "help": null
    },
    "viewer-url": {
        "title": "Viewer URL",
        "description": "Direct address link to display this dashboard in fullscreen viewer mode on tablets and wall displays.",
        "help": null
    },
    "theme": {
        "title": "Theme",
        "description": "Selects the active color palette and visual styling preset applied across dashboard widgets. You can link this setting to a data topic to switch themes dynamically, such as automatically adapting palettes based on the time of day or activating custom event themes.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "2-themes-theme-explorer"
        }
    },
    "create-widget": {
        "title": "Create Widget",
        "description": "Add a new smart home widget such as a switch, gauge, slider, battery, or graph to the canvas.",
        "help": {
            "topic": "Widgets"
        }
    },
    "selected-widget": {
        "title": "Selected Widget",
        "description": "Select an active widget from the list to inspect and edit its properties in this panel.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "universal-actions": {
        "title": "Universal Actions",
        "description": "Clipboard and history operations including copy, cut, paste, undo, and redo for canvas widgets.",
        "help": null
    },
    "undo": {
        "title": "Undo",
        "description": "Undo the last layout change or property modification on the canvas.",
        "help": null
    },
    "redo": {
        "title": "Redo",
        "description": "Reapply the change that was previously undone.",
        "help": null
    },
    "save": {
        "title": "Save Dashboard",
        "description": "Persist all layout, widget, and configuration changes to storage.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "7-universal-actions"
        }
    },
    "duplicate": {
        "title": "Duplicate Widget",
        "description": "Create an exact duplicate clone of the selected widget with all its current settings.",
        "help": null
    },
    "delete": {
        "title": "Delete Widget",
        "description": "Permanently delete the selected widget or widgets from the dashboard canvas.",
        "help": null
    },
    "lock": {
        "title": "Lock Widget",
        "description": "Lock widget position and dimensions to prevent accidental dragging.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "bring-forward": {
        "title": "Bring Forward",
        "description": "Raise the selected widget one layer higher in the visual stacking order.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "send-backward": {
        "title": "Send Backward",
        "description": "Lower the selected widget one layer deeper in the visual stacking order.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "align-left": {
        "title": "Align Left",
        "description": "Align the left edges of selected widgets to the leftmost element.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "align-center": {
        "title": "Align Center",
        "description": "Center selected widgets horizontally relative to one another.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "align-right": {
        "title": "Align Right",
        "description": "Align the right edges of selected widgets to the rightmost element.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "align-top": {
        "title": "Align Top",
        "description": "Align the top edges of selected widgets to the highest element.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "align-middle": {
        "title": "Align Middle",
        "description": "Center selected widgets vertically relative to one another.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "align-bottom": {
        "title": "Align Bottom",
        "description": "Align the bottom edges of selected widgets to the lowest element.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "distribute-h": {
        "title": "Distribute Horizontally",
        "description": "Space selected widgets with equal horizontal distance between them.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "distribute-v": {
        "title": "Distribute Vertically",
        "description": "Space selected widgets with equal vertical distance between them.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "dataDriver": {
        "title": "Platform Connection",
        "description": "Determines which home automation platform or data protocol powers the dashboard:\n• Homey: Connects to Athom Homey Pro via local WebSockets and device capability topics.\n• Home Assistant: Connects to Home Assistant WebSocket API for entity states and service calls.\n• Node-RED: Communicates with Node-RED flows via custom WebSocket or HTTP endpoints.\n• MQTT: Connects directly to an MQTT broker supporting JSON payloads and wildcards.\n• Simulation: Generates demo data locally without external network connections.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "editorMode": {
        "title": "Editor Mode",
        "description": "Sets the complexity level of the widget configuration panel:\n• Basic: Streamlined interface showing only essential visual and functional settings.\n• Advanced: Full access to all fine-grained styling, raw data bindings, and timing options.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "editorTooltips": {
        "title": "Editor Setting Tooltips",
        "description": "Display interactive descriptive flyout cards and direct documentation links when hovering over settings labels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "quickToolbarVisibility": {
        "title": "Quick Toolbar",
        "description": "Controls when the floating widget toolbar appears on the canvas:\n• Auto Hide When Docked: Conceals the floating toolbar whenever the side editor is open.\n• Always Visible: Keeps the floating toolbar pinned above selected widgets at all times.\n• Never Visible: Completely hides the floating toolbar for an unobstructed canvas view.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "gridSize": {
        "title": "Grid Size",
        "description": "The spacing in pixels between snap points and overlay grid lines across the canvas.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "snapToGrid": {
        "title": "Snap to Grid",
        "description": "Automatically snap widget edges and positions to the nearest grid step when dragging or resizing.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "showGrid": {
        "title": "Show Grid Overlay",
        "description": "Display visual grid dots or lines on the canvas to help align controls precisely.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "widgetLabelMode": {
        "title": "Widget Labels In Canvas",
        "description": "Controls the display of widget title headers on the canvas:\n• Hide: Keeps widget headers hidden for a clean dashboard appearance.\n• Always: Permanently displays widget title headers above widgets on the canvas.\n• Hover: Reveals widget headers only when hovering the mouse over the widget.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "11-editor-environment"
        }
    },
    "currentPage": {
        "title": "Active Page",
        "description": "The page currently displayed in the editor and shown by default when launching the viewer.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "currentPageOutputTopic": {
        "title": "Current Page Output Topic",
        "description": "MQTT or Home Assistant topic updated with the active page index whenever navigation changes.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "layoutMode": {
        "title": "Layout Mode",
        "description": "Determines how the dashboard canvas adapts to different screens:\n• Fixed Resolution: Locks the canvas to an exact pixel width and height with standard scrolling.\n• Scale to Fit Screen: Proportionally zooms and scales the entire canvas to fit any display.\n• Responsive Columns: Automatically reflows widgets into flexible columns based on screen width.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutScaleKeepAspect": {
        "title": "Keep Aspect Ratio",
        "description": "Preserve the original width-to-height ratio when scaling the canvas up or down to fit displays.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveColumnCount": {
        "title": "Column Count",
        "description": "The number of vertical grid columns used to distribute widgets in Responsive Grid mode.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveReduceColumnsToFit": {
        "title": "Reduce Columns to Fit",
        "description": "Automatically reduce column counts on narrower mobile screens to keep cards easily readable.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveMinSize": {
        "title": "Minimum Widget Size",
        "description": "Smallest allowable width in pixels for cards before triggering column reduction.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveMaxSize": {
        "title": "Maximum Widget Size",
        "description": "Largest allowable width in pixels for cards in fluid grid columns.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveAlign": {
        "title": "Grid Alignment",
        "description": "Horizontal alignment of the responsive grid column group within the browser viewport.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveGap": {
        "title": "Grid Gap",
        "description": "Spacing in pixels between rows and columns in Responsive Grid mode.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsiveMinWidgetHeight": {
        "title": "Minimum Widget Height",
        "description": "Base cell height in pixels for grid rows in Responsive mode.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsivePagePaddingLeft": {
        "title": "Page Padding Left",
        "description": "Horizontal padding on the left edge of the responsive canvas.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsivePagePaddingRight": {
        "title": "Page Padding Right",
        "description": "Horizontal padding on the right edge of the responsive canvas.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsivePagePaddingTop": {
        "title": "Page Padding Top",
        "description": "Vertical padding on the top edge of the responsive canvas.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "layoutResponsivePagePaddingBottom": {
        "title": "Page Padding Bottom",
        "description": "Vertical padding on the bottom edge of the responsive canvas.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "canvasPreset": {
        "title": "Canvas Preset",
        "description": "Quickly apply predefined dimensions for common wall tablets like iPad, Fire HD, or Nest Hub.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasWidth": {
        "title": "Canvas Width",
        "description": "The exact width of the dashboard canvas in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasHeight": {
        "title": "Canvas Height",
        "description": "The exact height of the dashboard canvas in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "hideScrollbars": {
        "title": "Hide Scrollbars",
        "description": "Hide horizontal and vertical browser scrollbars in the live viewer for a clean kiosk appearance.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgType": {
        "title": "Background Type",
        "description": "Defines how canvas background colors blend:\n• Flat Color: Applies a single solid background color across the entire dashboard.\n• Linear Gradient: Transitions smoothly between colors in a directional straight line.\n• Mirror Gradient: Creates a symmetrical bi-directional color blend centered on the canvas.\n• Radial: Radiates color outward in concentric circles from the center.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgColor": {
        "title": "Background Color",
        "description": "Primary canvas background color or start color for background gradients.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgEndColor": {
        "title": "Gradient End Color",
        "description": "Secondary canvas background color used for the gradient end point.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgOpacity": {
        "title": "Background Opacity",
        "description": "Transparency level of the canvas background layer.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgEndOpacity": {
        "title": "End Color Opacity",
        "description": "Transparency level of the gradient end color.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgAngle": {
        "title": "Gradient Angle",
        "description": "Direction of the linear background gradient in degrees.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "canvasBgImage": {
        "title": "Background Image",
        "description": "Path or gallery URL for full-screen canvas background artwork.",
        "help": {
            "topic": "Image Gallery Manager"
        }
    },
    "canvasBgFit": {
        "title": "Background Fit",
        "description": "How the background image scales across the canvas (Cover, Contain, Fill, or Center).",
        "help": {
            "topic": "Image Gallery Manager"
        }
    },
    "canvasBgOverlay": {
        "title": "Color Overlay",
        "description": "Optional tinted tint wash layered on top of the background image to improve card contrast.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "inactivityReturnEnabled": {
        "title": "Return on Inactivity",
        "description": "Automatically switch back to the home or screensaver page when no user touch occurs.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "inactivityTimeout": {
        "title": "Inactivity Timeout",
        "description": "Idle duration in seconds before the dashboard automatically navigates back to the home page.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "inactivityReturnPage": {
        "title": "Return Page",
        "description": "The page the dashboard opens on, and returns to after a period of inactivity.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "holdDuration": {
        "title": "Hold Duration",
        "description": "Duration in milliseconds required to trigger long-press actions and protected switch toggles.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeLeftAction": {
        "title": "Swipe Left Action",
        "description": "Specifies the action triggered when swiping left across the dashboard:\n• Go to Next Page: Navigates forward to the subsequent dashboard page.\n• Go to Previous Page: Navigates backward to the preceding dashboard page.\n• Go to Specific Page: Jumps directly to a chosen target dashboard page.\n• Trigger Topic: Fires an automation topic command or webhook without changing pages.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeLeftPage": {
        "title": "Swipe Left Target Page",
        "description": "The dashboard page to navigate to when executing a left swipe.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeLeftTopic": {
        "title": "Swipe Left Topic",
        "description": "MQTT or automation topic to publish to when swiping left.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeLeftPayload": {
        "title": "Swipe Left Payload",
        "description": "Value sent to the MQTT topic when swiping left.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeRightAction": {
        "title": "Swipe Right Action",
        "description": "Specifies the action triggered when swiping right across the dashboard:\n• Go to Next Page: Navigates forward to the subsequent dashboard page.\n• Go to Previous Page: Navigates backward to the preceding dashboard page.\n• Go to Specific Page: Jumps directly to a chosen target dashboard page.\n• Trigger Topic: Fires an automation topic command or webhook without changing pages.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeRightPage": {
        "title": "Swipe Right Target Page",
        "description": "The dashboard page to navigate to when executing a right swipe.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeRightTopic": {
        "title": "Swipe Right Topic",
        "description": "MQTT or automation topic to publish to when swiping right.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeRightPayload": {
        "title": "Swipe Right Payload",
        "description": "Value sent to the MQTT topic when swiping right.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeUpAction": {
        "title": "Swipe Up Action",
        "description": "Specifies the action triggered when swiping up across the dashboard:\n• Go to Next Page: Navigates forward to the subsequent dashboard page.\n• Go to Previous Page: Navigates backward to the preceding dashboard page.\n• Go to Specific Page: Jumps directly to a chosen target dashboard page.\n• Trigger Topic: Fires an automation topic command or webhook without changing pages.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeUpPage": {
        "title": "Swipe Up Target Page",
        "description": "The dashboard page to navigate to when executing an upward swipe.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeUpTopic": {
        "title": "Swipe Up Topic",
        "description": "MQTT or automation topic to publish to when swiping up.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeUpPayload": {
        "title": "Swipe Up Payload",
        "description": "Value sent to the MQTT topic when swiping up.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeDownAction": {
        "title": "Swipe Down Action",
        "description": "Specifies the action triggered when swiping down across the dashboard:\n• Go to Next Page: Navigates forward to the subsequent dashboard page.\n• Go to Previous Page: Navigates backward to the preceding dashboard page.\n• Go to Specific Page: Jumps directly to a chosen target dashboard page.\n• Trigger Topic: Fires an automation topic command or webhook without changing pages.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeDownPage": {
        "title": "Swipe Down Target Page",
        "description": "The dashboard page to navigate to when executing a downward swipe.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeDownTopic": {
        "title": "Swipe Down Topic",
        "description": "MQTT or automation topic to publish to when swiping down.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeDownPayload": {
        "title": "Swipe Down Payload",
        "description": "Value sent to the MQTT topic when swiping down.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "swipeWrapAround": {
        "title": "Wrap Around Navigation",
        "description": "Allow swiping past the last page to wrap back around to the first page.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "swipeIgnorePages": {
        "title": "Ignore Pages",
        "description": "Comma-separated list of page numbers where canvas swipe gestures should be disabled.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "audioTopicMap": {
        "title": "Topic Audio Triggers",
        "description": "Map specific MQTT topics and values to sound effects played automatically through the dashboard.",
        "help": {
            "topic": "Audio Gallery"
        }
    },
    "customFonts": {
        "title": "Custom Google Fonts",
        "description": "Comma-separated font names loaded from Google Fonts for custom dashboard typography.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultLabelCase": {
        "title": "Default Font Family",
        "description": "Controls default capitalization formatting for widget title headers:\n• UPPERCASE: Converts all characters in widget titles to capital letters.\n• Capitalize: Formats titles with the first letter of each word capitalized.\n• lowercase: Formats all characters in widget titles to lowercase.\n• None: Preserves exact text casing as entered or received from data topics.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultLabelBold": {
        "title": "Default Bold Text",
        "description": "Renders standard widget labels in bold font weight by default.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultLabelLineHeight": {
        "title": "Default Line Height",
        "description": "Vertical line height multiplier for text spacing.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultFsGeneral": {
        "title": "Default Value Color",
        "description": "Global fallback text color applied to dynamic sensor readings and values.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultFsUnit": {
        "title": "Default Value Font Size",
        "description": "Fallback typography font size in pixels for primary numerical values.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "16-typography"
        }
    },
    "defaultWidth": {
        "title": "Default Widget Width",
        "description": "Standard width in pixels assigned to newly added widgets.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "17-master-widget-settings"
        }
    },
    "defaultHeight": {
        "title": "Default Widget Height",
        "description": "Standard height in pixels assigned to newly added widgets.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "17-master-widget-settings"
        }
    },
    "defaultPadding": {
        "title": "Default Widget Padding",
        "description": "Internal spacing in pixels between widget edges and contents.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "17-master-widget-settings"
        }
    },
    "defaultBorderOpacity": {
        "title": "Default Border Opacity",
        "description": "Fallback border opacity for container frames and cards.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "innerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Tint color applied to inner perimeter glow lighting effects.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "innerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "Intensity of the inner border glow effect.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "metaName": {
        "title": "Widget Label",
        "description": "User-friendly name shown in layer lists and canvas badges to easily identify this widget.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "locked": {
        "title": "Lock Widget",
        "description": "Locks widget position and size on the canvas to prevent accidental drag moves.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "page": {
        "title": "Page Assignment",
        "description": "The dashboard page number where this widget is displayed.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "12-dashboard-environment"
        }
    },
    "zIndex": {
        "title": "Layer Order",
        "description": "Stacking depth of this widget relative to other elements on the same canvas page.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "x": {
        "title": "Position X",
        "description": "Horizontal coordinate of the widget top-left corner in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "y": {
        "title": "Position Y",
        "description": "Vertical coordinate of the widget top-left corner in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "w": {
        "title": "Width",
        "description": "Total width of the widget in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "h": {
        "title": "Height",
        "description": "Total height of the widget in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "width": {
        "title": "Width",
        "description": "Total width of the widget in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "height": {
        "title": "Height",
        "description": "Total height of the widget in pixels.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "fixedAspectRatio": {
        "title": "Keep Aspect Ratio",
        "description": "Maintains proportional width and height when resizing the widget.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "dimBackgroundWhenVisible": {
        "title": "Dim Background When Visible",
        "description": "Dims and blurs the underlying dashboard canvas when this widget appears on screen.",
        "help": {
            "topic": "Styling & Layering"
        }
    },
    "holdToActivate": {
        "title": "Hold to Activate",
        "description": "Requires holding down the widget for the configured hold duration before executing its action.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "requireConfirmation": {
        "title": "Require Confirmation",
        "description": "Displays a verification prompt before toggling switches or firing critical commands.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "confirmPrompt": {
        "title": "Confirmation Prompt",
        "description": "Custom warning message displayed inside the confirmation dialog.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "outputTopic": {
        "title": "Output Topic",
        "description": "Primary topic or capability where commands and values are sent when interacting with this widget.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "payloadOn": {
        "title": "Payload On",
        "description": "Data value sent to the output topic when switching into the active state.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "payloadOff": {
        "title": "Payload Off",
        "description": "Data value sent to the output topic when switching into the inactive state.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "state": {
        "title": "Current State",
        "description": "Current on/off status or raw value of the widget.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "feedbackTopic": {
        "title": "Feedback Topic",
        "description": "Dedicated topic used to listen for state confirmations independently from output commands.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "targetPage": {
        "title": "Target Page",
        "description": "Navigates the viewer directly to this dashboard page when the widget is clicked.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "openUrl": {
        "title": "Target URL",
        "description": "Web address opened in the browser when the widget is tapped.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "urlNewTab": {
        "title": "Open in New Tab",
        "description": "Opens target web address in a new browser window instead of the current view.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "audio": {
        "title": "Interaction Sound",
        "description": "Sound effect played whenever a user taps or toggles this widget.",
        "help": {
            "topic": "Audio Gallery"
        }
    },
    "deactivatedColor": {
        "title": "Deactivated Color",
        "description": "Color used for the widget body while Deactivated is on.",
        "help": null
    },
    "deactivatedColorAccent": {
        "title": "Deactivated Accent Color",
        "description": "Color used for icons and small details while Deactivated is on.",
        "help": null
    },
    "label": {
        "title": "Widget Label",
        "description": "Optional title drawn with this widget. Leave it blank when the widget should stand on its own.",
        "help": null
    },
    "responsiveScaleMode": {
        "title": "Scale Mode",
        "description": "Determines how widget content adapts when grid column widths expand or contract.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsiveOrder": {
        "title": "Column Order",
        "description": "Display sorting order of this card relative to other cards in the responsive grid.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsiveColumnSpan": {
        "title": "Column Span",
        "description": "Number of grid columns this widget stretches across.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsivePreferredColumn": {
        "title": "Preferred Column",
        "description": "Initial target column index where this card prefers to be placed.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsiveCellHeightMode": {
        "title": "Cell Height Mode",
        "description": "Controls whether widget height matches grid rows or maintains custom aspect ratio.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsiveCellHeight": {
        "title": "Cell Height",
        "description": "Custom row height in pixels for this widget within the responsive grid.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsiveMinHeight": {
        "title": "Min Height",
        "description": "Minimum vertical height below which this widget will not shrink.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "responsivePadding": {
        "title": "Responsive Padding",
        "description": "Outer margin spacing applied around this widget cell in responsive grid mode.",
        "help": {
            "topic": "Layout Modes"
        }
    },
    "arrow.mainColor": {
        "title": "Arrow Main Color",
        "description": "Primary color of the line stroke and arrow head.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.flowColor": {
        "title": "Flow Color",
        "description": "Color of the animated pulses travelling along the arrow line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.reverseFlowColor": {
        "title": "Reverse Flow Color",
        "description": "Color of animated pulses when energy or fluid direction is reversed.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.thickness": {
        "title": "Line Thickness",
        "description": "Stroke thickness in pixels for the arrow path.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.headSize": {
        "title": "Arrow Head Size",
        "description": "Scale multiplier for the pointer arrowhead at the line terminus.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.lineRadius": {
        "title": "Corner Radius",
        "description": "Smoothness of curved bends along multi-segment arrow paths.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.headRound": {
        "title": "Head Rounding",
        "description": "Rounds sharp tips and corners on the arrowhead.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.flowWidth": {
        "title": "Flow Pulse Width",
        "description": "Length of each animated dash packet moving along the path.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.gradientWidth": {
        "title": "Gradient Length",
        "description": "Fade-off softness on the tail of each moving flow particle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.enableGlow": {
        "title": "Enable Path Glow",
        "description": "Casts an illuminated neon glow around the arrow line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.glowColor": {
        "title": "Glow Color",
        "description": "Color tint for the surrounding halo light.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.glowWidth": {
        "title": "Glow Radius",
        "description": "Spread distance in pixels of the illuminated outer glow.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.glowOpacity": {
        "title": "Glow Opacity",
        "description": "Brightness intensity of the outer glow halo.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.animationEnabled": {
        "title": "Enable Flow Animation",
        "description": "Animates traveling pulses along the line to visualize live energy or liquid flow.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.animationSpeed": {
        "title": "Flow Speed",
        "description": "Time in seconds for a flow particle to traverse the full path length.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.animationReverse": {
        "title": "Reverse Direction",
        "description": "Reverses flow travel direction along the path.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.fromX": {
        "title": "Start X Coordinate",
        "description": "Horizontal pixel coordinate where the arrow starts.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.fromY": {
        "title": "Start Y Coordinate",
        "description": "Vertical pixel coordinate where the arrow starts.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.toX": {
        "title": "End X Coordinate",
        "description": "Horizontal pixel coordinate where the arrowhead points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.toY": {
        "title": "End Y Coordinate",
        "description": "Vertical pixel coordinate where the arrowhead points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "arrow.customPoints": {
        "title": "Path Waypoints",
        "description": "Additional corner coordinate waypoints for complex multi-bend routing.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow"
        }
    },
    "battery.value": {
        "title": "Battery Percentage",
        "description": "Current battery charge level from 0% to 100%.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.vertical": {
        "title": "Vertical Orientation",
        "description": "Orient the battery vertically with terminal on top instead of horizontal.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.segments": {
        "title": "Battery Segments",
        "description": "Divide the battery into discrete fill bars (e.g. 4 or 5 bars) or set 0 for smooth fill.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.lowThreshold": {
        "title": "Low Battery Threshold",
        "description": "Percentage below which the battery indicator turns red to warn of critical level.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.goodColor": {
        "title": "Healthy Color",
        "description": "Fill color used when battery charge is above the low warning threshold.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.lowColor": {
        "title": "Low Warning Color",
        "description": "Fill color displayed when battery level drops into warning territory.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.borderColor": {
        "title": "Casing Color",
        "description": "Color of the outer battery frame and terminal cap.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.emptyColor": {
        "title": "Depleted Color",
        "description": "Background color of uncharged battery segments.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.outlineWidth": {
        "title": "Casing Outline Width",
        "description": "Thickness in pixels of the outer battery casing border.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.innerPadding": {
        "title": "Segment Padding",
        "description": "Clearance spacing in pixels between casing wall and fill segments.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.terminalSize": {
        "title": "Terminal Cap Size",
        "description": "Width and height of the positive battery terminal bump.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.charging": {
        "title": "Charging Trigger",
        "description": "Topic or boolean flag indicating whether the battery is currently charging.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.stopCharging": {
        "title": "Stop Charging Trigger",
        "description": "Condition or event indicating that charging has halted.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.full": {
        "title": "Full Battery Trigger",
        "description": "State indicating the battery has reached 100% full capacity.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "battery.empty": {
        "title": "Dead Battery Trigger",
        "description": "Alert state indicating the battery is completely exhausted.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery"
        }
    },
    "clock.displayMode": {
        "title": "Clock Face Type",
        "description": "Selects the clock visualization style:\n• Analog Clock: Renders a traditional clock face with rotating hour, minute, and second hands.\n• Flip Clock: Displays split-flap mechanical cards that animate when digits flip.\n• Date Time Text: Formats the current time and date as customizable digital typography.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.clockUse12Hour": {
        "title": "12-Hour Format",
        "description": "Display time with AM/PM indicators instead of 24-hour military notation.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.useSystemTime": {
        "title": "Use System Time",
        "description": "Synchronize time automatically with the viewing device internal clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.timeOffset": {
        "title": "Time Offset",
        "description": "Manual offset in minutes added to local time for secondary timezone clocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.timezone": {
        "title": "Timezone",
        "description": "Specific geographic timezone identifier (e.g. America/New_York).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.showTicks": {
        "title": "Show Dial Ticks",
        "description": "Render tick marks around the perimeter of the analog clock face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.showNumbers": {
        "title": "Show Dial Numbers",
        "description": "Render 1 through 12 hour numbers on the analog dial.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.tickColor": {
        "title": "Tick Color",
        "description": "Color of the minute and hour tick marks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.sweepMode": {
        "title": "Sweep Second Hand",
        "description": "Controls the motion of the second hand:\n• tick: Steps the second hand forward once per second with crisp mechanical motion.\n• smooth: Glides the second hand continuously in a fluid uninterrupted sweep.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.hourColor": {
        "title": "Hour Hand Color",
        "description": "Color of the short hour hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.minuteColor": {
        "title": "Minute Hand Color",
        "description": "Color of the long minute hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.secondColor": {
        "title": "Second Hand Color",
        "description": "Color of the thin second hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.wHour": {
        "title": "Hour Hand Width",
        "description": "Width in pixels of the short hour hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.lHour": {
        "title": "Hour Hand Length",
        "description": "Length in pixels of the short hour hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.wMin": {
        "title": "Minute Hand Width",
        "description": "Width in pixels of the long minute hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.lMin": {
        "title": "Minute Hand Length",
        "description": "Length in pixels of the long minute hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.wSec": {
        "title": "Second Hand Width",
        "description": "Width in pixels of the thin second hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.lSec": {
        "title": "Second Hand Length",
        "description": "Length in pixels of the thin second hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipUpperColor": {
        "title": "Flip Card Top Color",
        "description": "Background color of the upper flap on flip clocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipLowerColor": {
        "title": "Flip Card Bottom Color",
        "description": "Background color of the lower flap on flip clocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipShowLabels": {
        "title": "Flip Unit Labels",
        "description": "Display HOURS, MINUTES, and SECONDS sub-labels under flip digits.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipShowSeconds": {
        "title": "Show Seconds Flaps",
        "description": "Include animated seconds flip cards alongside hours and minutes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipSeparator": {
        "title": "Flip Separator",
        "description": "Character displayed between flip cards (e.g. colon or dot).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipCardRadius": {
        "title": "Flip Corner Radius",
        "description": "Rounding radius in pixels on the outer corners of flip cards.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.flipLocale": {
        "title": "Flip Locale",
        "description": "Regional locale for day and month abbreviations.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textShowTime": {
        "title": "Show Digital Time",
        "description": "Display current digital hours, minutes, and seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textShowDate": {
        "title": "Show Calendar Date",
        "description": "Display current date below or beside the time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textBlinkSeparator": {
        "title": "Blinking Colons",
        "description": "Pulse the colon separator on and off every second.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textTimeSeparator": {
        "title": "Time Separator",
        "description": "Character placed between hours and minutes (defaults to colon).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textDateSeparator": {
        "title": "Date Separator",
        "description": "Character placed between date segments (e.g. hyphen or slash).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textDateLinebreak": {
        "title": "Date on New Line",
        "description": "Place the calendar date on a second line beneath the digital time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.textWeekPrefix": {
        "title": "Week Number Prefix",
        "description": "Label prefix displayed before calendar week numbers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "container.customShape": {
        "title": "Container Shape",
        "description": "Geometric shape of the card outline (Rectangle, Rounded, Circle, Hexagon, or Custom Polygon).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "container"
        }
    },
    "container.shapePoints": {
        "title": "Polygon Points",
        "description": "Custom coordinate vertex list defining irregular polygon outlines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "container"
        }
    },
    "editbox.inputMode": {
        "title": "Input Format",
        "description": "Sets the text field size and layout:\n• Single Line: Standard text input field for short commands, names, or values.\n• Multi-Line: Expandable text box with enter key support for notes, code, or JSON payloads.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.sendBehavior": {
        "title": "Send Trigger",
        "description": "Controls when entered text is transmitted:\n• Live (On Type): Transmits input data continuously with each keystroke as you type.\n• Keyboard (Enter): Transmits input data when pressing Enter, keeping keyboard focus.\n• Keyboard (Enter) & Exit: Transmits data when pressing Enter and removes keyboard focus.\n• Trigger Topic: Sends the current value only when an external trigger topic fires.\n• Open URL: Navigates to a dynamic URL constructed with the entered text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.clearOnSend": {
        "title": "Clear on Send",
        "description": "Automatically empties the input field after sending its text to the output topic.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.customPlaceholder": {
        "title": "Placeholder Text",
        "description": "Faint instructional hint text shown inside the input box when empty.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.placeholderColor": {
        "title": "Placeholder Color",
        "description": "Text color applied to the placeholder hint string.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.textPadding": {
        "title": "Input Content Padding",
        "description": "Internal spacing in pixels around the typed text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.bgColor": {
        "title": "Input Background Color",
        "description": "Background fill color of the input field.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.borderColor": {
        "title": "Input Border Color",
        "description": "Border outline color of the text input container.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.borderRadius": {
        "title": "Border Radius",
        "description": "Corner curvature in pixels for the text box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.enableFocusColor": {
        "title": "Highlight on Focus",
        "description": "Changes border and background color when user taps into the field.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.focusColor": {
        "title": "Active Focus Color",
        "description": "Accent color applied to border when the input has active cursor focus.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "editbox.triggerTopic": {
        "title": "Send Trigger Topic",
        "description": "Optional topic that causes the editbox to submit its current text value when triggered.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox"
        }
    },
    "gauge.gaugeType": {
        "title": "Gauge Dial Style",
        "description": "Radial circular arc, Semi-circle dial, or Linear bar thermometer.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.value": {
        "title": "Gauge Reading",
        "description": "Current numerical sensor value displayed on the dial.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.min": {
        "title": "Minimum Value",
        "description": "Lowest numerical value representing the zero point on the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.max": {
        "title": "Maximum Value",
        "description": "Highest numerical value representing full scale on the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.decimalPlaces": {
        "title": "Decimal Precision",
        "description": "Number of decimal digits shown on the numerical reading.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.barThickness": {
        "title": "Active Bar Thickness",
        "description": "Thickness in pixels of the colored progress bar arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.trackThickness": {
        "title": "Background Track Thickness",
        "description": "Thickness in pixels of the empty background guide track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.gapRound": {
        "title": "Circular Arc Span",
        "description": "Opening gap angle at the bottom of circular dial gauges.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.gapHoriz": {
        "title": "Linear Bar Spacing",
        "description": "Spacing clearance around linear thermometer bars.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.gaugeCol0": {
        "title": "Minimum Gradient Color",
        "description": "Color of the gauge bar at minimum reading.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.gaugeCol100": {
        "title": "Maximum Gradient Color",
        "description": "Color of the gauge bar at maximum reading.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.solidBarColor": {
        "title": "Solid Color Override",
        "description": "Single static color for the bar instead of a dual-color gradient.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.showIcon": {
        "title": "Show Gauge Center Icon",
        "description": "Displays a sensor icon inside the hollow center of the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.customDisplayRange": {
        "title": "Custom Display Scale",
        "description": "Remap displayed numerical text independently from physical dial angle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.displayMin": {
        "title": "Display Range Minimum",
        "description": "Target mapped minimum scale for displayed numerical readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.displayMax": {
        "title": "Display Range Maximum",
        "description": "Target mapped maximum scale for displayed numerical readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.displayDecimalPlaces": {
        "title": "Display Decimal Digits",
        "description": "Decimal precision used specifically for remapped display values.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.abbreviateLargeValues": {
        "title": "Abbreviate Large Values",
        "description": "Format large numbers with compact metric suffixes like k or M.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.keepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Preserve fixed decimal zero padding (e.g. 21.0 instead of 21).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.trackBlur": {
        "title": "Track Glow Blur",
        "description": "Glow blur radius applied behind the empty background track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.trackOutlineWidth": {
        "title": "Track Outline Width",
        "description": "Stroke thickness for the background track border.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.trackOutlineColor": {
        "title": "Track Outline Color",
        "description": "Color of the border framing the gauge track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "gauge.trackInnerGlow": {
        "title": "Track Inner Glow",
        "description": "Perimeter inner glow depth along the interior track edges.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge"
        }
    },
    "graph.graphType": {
        "title": "Graph Visualization Style",
        "description": "Chart presentation: Line curve, Stepped line, Bar chart, or Area fill.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.timeWindow": {
        "title": "History Time Window",
        "description": "Time duration displayed across the horizontal axis (e.g. 1 hour, 24 hours, 7 days).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.refreshRate": {
        "title": "Data Poll Interval",
        "description": "Frequency in seconds for fetching updated history data from Home Assistant or Homey.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.yMin": {
        "title": "Y-Axis Minimum",
        "description": "Lower limit of the vertical scale. Leave blank for automatic range scaling.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.yMax": {
        "title": "Y-Axis Maximum",
        "description": "Upper limit of the vertical scale. Leave blank for automatic range scaling.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.yAuto": {
        "title": "Automatic Y Scaling",
        "description": "Dynamically adjust vertical axis bounds to match the highest and lowest data points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.fillArea": {
        "title": "Fill Under Curve",
        "description": "Renders a translucent color gradient fill between the line curve and bottom axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.lineWidth": {
        "title": "Line Stroke Width",
        "description": "Thickness in pixels of the plotted trend line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.lineTension": {
        "title": "Curve Smoothing",
        "description": "Bezier curvature smoothness: 0 for straight angular segments, 0.4 for smooth waves.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showGridX": {
        "title": "Show Vertical Time Grid",
        "description": "Draws vertical grid guide lines across time intervals.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showGridY": {
        "title": "Show Horizontal Value Grid",
        "description": "Draws horizontal grid lines for numerical value levels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showPoints": {
        "title": "Show Data Point Dots",
        "description": "Renders circular markers on individual recorded data samples.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointRadius": {
        "title": "Data Marker Radius",
        "description": "Size in pixels of plotted sample point dots.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.legendPosition": {
        "title": "Legend Placement",
        "description": "Specifies where the series legend is anchored:\n• Top: Places the series legend in a horizontal row above the chart plot.\n• Bottom: Places the series legend in a horizontal row beneath the horizontal axis.\n• Left: Docks the legend in a vertical column along the left edge of the chart.\n• Right: Docks the legend in a vertical column along the right edge of the chart.\n• Floating: Overlays the legend inside the chart plotting area.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.tooltipEnabled": {
        "title": "Hover Tooltips",
        "description": "Shows exact time and sensor reading when hovering or touching curve points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.yAxisTitle": {
        "title": "Y-Axis Title",
        "description": "Label text printed vertically along the left value axis (e.g. Watts, °C, %).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.xAxisFormat": {
        "title": "Time Format",
        "description": "Timestamp notation along the bottom axis (12-hour, 24-hour, or date).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "icon.iconName": {
        "title": "Phosphor Icon Name",
        "description": "The icon identifier selected from the built-in Phosphor icon library.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.iconSize": {
        "title": "Icon Size",
        "description": "Visual scale of the icon glyph in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.iconColor": {
        "title": "Icon Color",
        "description": "Fill and stroke color of the icon symbol.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.iconWeight": {
        "title": "Icon Weight",
        "description": "Phosphor icon stroke style (Regular, Bold, Thin, Light, Fill, or Duotone).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.iconOffX": {
        "title": "Icon Offset X",
        "description": "Fine-tune horizontal pixel positioning within the widget frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.iconOffY": {
        "title": "Icon Offset Y",
        "description": "Fine-tune vertical pixel positioning within the widget frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "icon.rotation": {
        "title": "Icon Rotation Angle",
        "description": "Rotate the icon in degrees (0 to 360) for directional arrows or custom orientations.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon"
        }
    },
    "image.imageUrl": {
        "title": "Image Source URL",
        "description": "Web URL, Home Assistant camera proxy, or local gallery image file path.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.imageFit": {
        "title": "Image Sizing Behavior",
        "description": "How artwork fills the frame: Cover (crops to fit), Contain (shows full image), or Fill (stretches).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.imageOpacity": {
        "title": "Image Opacity",
        "description": "Transparency level of the displayed image from 0.0 (transparent) to 1.0 (opaque).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.imageBlur": {
        "title": "Image Blur Filter",
        "description": "Applies soft focus blur in pixels to the image artwork.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.imageBorderRadius": {
        "title": "Image Corner Radius",
        "description": "Rounds the outer corners of the image frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.fallbackUrl": {
        "title": "Fallback Backup Image",
        "description": "Backup image URL displayed if camera stream or primary source link fails.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.refreshInterval": {
        "title": "Camera Auto-Refresh",
        "description": "Reload interval in seconds to update security camera snapshots automatically.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "image.aspectRatio": {
        "title": "Fixed Proportions",
        "description": "Locks image frame to specific standard ratios like 16:9, 4:3, or 1:1.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image"
        }
    },
    "label.text": {
        "title": "Display Text",
        "description": "Static text string or template string containing inline topic variables.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.fontSize": {
        "title": "Font Size",
        "description": "Typography size in pixels for the label text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.fontWeight": {
        "title": "Font Weight",
        "description": "Typographic thickness: Normal (400), Medium (500), or Bold (700).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.fontColor": {
        "title": "Text Color",
        "description": "Color applied to the label text letters.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.fontFamily": {
        "title": "Font Family",
        "description": "Typeface used to render the label text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.textAlign": {
        "title": "Horizontal Alignment",
        "description": "Align text to the Left, Center, or Right within its bounding box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.textVerticalAlign": {
        "title": "Vertical Alignment",
        "description": "Align text to the Top, Middle, or Bottom inside its container.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "label.textOverflow": {
        "title": "Overflow Behavior",
        "description": "How long text is handled: Truncate with ellipsis, Wrap to multiple lines, or Clip.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label"
        }
    },
    "lightgrid.gridColumns": {
        "title": "Matrix Columns",
        "description": "Number of columns of light tile buttons across the grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.gridRows": {
        "title": "Matrix Rows",
        "description": "Number of rows of light tile buttons down the grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.lightSpacing": {
        "title": "Tile Spacing",
        "description": "Gap clearance in pixels separating individual light tiles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.lightSize": {
        "title": "Tile Size",
        "description": "Diameter or square dimension in pixels for each light button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.lightShape": {
        "title": "Tile Shape",
        "description": "Geometric appearance of the light buttons: Rounded Square or Circle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.colorMode": {
        "title": "Color Control Mode",
        "description": "Light control capabilities: Simple Toggle, Brightness Dimmer, or Full RGB Color.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.multiSelect": {
        "title": "Multi-Light Selection",
        "description": "Allows selecting multiple room lights simultaneously for grouped adjustments.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.brightnessStep": {
        "title": "Brightness Step Size",
        "description": "Percentage jump applied per swipe or step when adjusting dimmers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.colorTempMin": {
        "title": "Color Temp Minimum",
        "description": "Warmest Kelvin or Mired limit supported by your smart bulbs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.colorTempMax": {
        "title": "Color Temp Maximum",
        "description": "Coolest Kelvin or Mired limit supported by your smart bulbs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.showLabels": {
        "title": "Show Light Names",
        "description": "Prints room or fixture names beneath individual light buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "list.listItems": {
        "title": "List Data Source",
        "description": "Array of items or JSON topic supplying the list rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.itemSpacing": {
        "title": "Row Spacing",
        "description": "Vertical margin in pixels between individual list rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.showDividers": {
        "title": "Show Row Dividers",
        "description": "Draws subtle hairline separator lines between list entries.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.dividerColor": {
        "title": "Divider Line Color",
        "description": "Color applied to horizontal separator divider lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.maxItems": {
        "title": "Maximum Rows Displayed",
        "description": "Caps the list display to the most recent N items (useful for event logs).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.scrollBehavior": {
        "title": "Scroll Behavior",
        "description": "Enable vertical touch scrolling or hide overflow beyond widget boundary.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.itemHeight": {
        "title": "Row Height",
        "description": "Fixed height in pixels allocated to each list entry.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.selectable": {
        "title": "Enable Row Selection",
        "description": "Allows tapping list rows to highlight them and trigger associated events.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.activeItemColor": {
        "title": "Active Row Highlight",
        "description": "Background tint color for currently selected list row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "menu.menuOrientation": {
        "title": "Menu Direction",
        "description": "Arrange navigation menu buttons Horizontally in a top bar or Vertically in a side panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.menuItems": {
        "title": "Menu Items Configuration",
        "description": "Configure navigation buttons, target pages, trigger topics, icons, and badge counters.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "menu.activeColor": {
        "title": "Active Tab Color",
        "description": "Accent color highlighting the button of the currently viewed page.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.hoverColor": {
        "title": "Hover Highlight Color",
        "description": "Background tint applied when pointer hovers over a menu tab.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.indicatorStyle": {
        "title": "Active Indicator Style",
        "description": "Visual accent marking active tab: Full Pill highlight, Underline bar, or Glow.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.itemPadding": {
        "title": "Menu Tab Padding",
        "description": "Internal spacing in pixels inside each navigation tab button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.compactMode": {
        "title": "Compact Icon-Only Mode",
        "description": "Hides text titles to save screen space, displaying only icons on narrow displays.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "menu.collapseBelow": {
        "title": "Mobile Collapse Width",
        "description": "Screen width threshold in pixels below which the menu collapses into compact mode.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu"
        }
    },
    "slider.min": {
        "title": "Minimum Value",
        "description": "Lowest numerical value at the start of the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.max": {
        "title": "Maximum Value",
        "description": "Highest numerical value at the end of the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.stepSize": {
        "title": "Slider Step Interval",
        "description": "Value increment per step when moving the slider thumb (e.g. 1 for integer, 0.5 for half steps).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.vertical": {
        "title": "Vertical Orientation",
        "description": "Orient slider track vertically for volume faders or thermostat temperature controls.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.sendValueMode": {
        "title": "Value Send Behavior",
        "description": "Determines when slider values are published to your smart-home controller:\n• Send value on release: Transmits the final value only after letting go, reducing network traffic.\n• Send value directly on movement: Streams values continuously in real time as you drag the handle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.allowDecimals": {
        "title": "Allow Fractional Values",
        "description": "Permits decimal numbers on the slider output instead of rounding to whole integers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.showVal": {
        "title": "Show Numerical Value",
        "description": "Displays the current numerical level in real time on the slider card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.valueLocation": {
        "title": "Value Placement",
        "description": "Position of the numerical readout: Center, Inside Thumb, Top, or Bottom.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.unit": {
        "title": "Measurement Unit",
        "description": "Suffix appended after the numerical value (e.g. %, °C, W, lm).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.trackThickness": {
        "title": "Slider Track Thickness",
        "description": "Thickness in pixels of the background guide groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.trackColor": {
        "title": "Slider Track Color",
        "description": "Background groove color along which the slider handle travels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillThickness": {
        "title": "Active Fill Thickness",
        "description": "Thickness in pixels of the active filled portion of the track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.fillColor": {
        "title": "Slider Fill Color",
        "description": "Color of the filled active portion representing the current set level.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbSize": {
        "title": "Thumb Handle Size",
        "description": "Diameter in pixels of the draggable round thumb knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.thumbColor": {
        "title": "Thumb Handle Color",
        "description": "Color of the draggable knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "slider.thumbShadow": {
        "title": "Thumb Drop Shadow",
        "description": "Casts a realistic elevation shadow underneath the draggable slider knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider"
        }
    },
    "switch.mode": {
        "title": "Switch Operation Mode",
        "description": "Determines the electrical switching behavior of the widget:\n• Toggle Switch: Alternates between On and Off states with each tap, maintaining state.\n• Push Button (Momentary): Activates while pressed and immediately reverts when released.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.style": {
        "title": "Button Visual Style",
        "description": "Selects the visual container design for the switch:\n• Switch (Pill): Classic toggle pill slider with sliding thumb indicator.\n• Button (Rect): Modern interactive push card with custom background and borders.\n• Image Only: Clickable icon or image without background button frames.\n• Text Only: Lightweight text link button without border containers.\n• Invisible: Transparent touch zone placed over custom dashboard background artwork.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.actionType": {
        "title": "Interaction Action",
        "description": "Specifies what happens when tapping the switch or button:\n• Send Topic: Publishes an automation command or payload to your controller.\n• Go to Page: Switches the dashboard view directly to another page.\n• Open URL: Launches an external website or mobile app deep link in your browser.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.separateOnOffTopics": {
        "title": "Separate On and Off Topics",
        "description": "Use distinct MQTT or API topics for switching on vs switching off devices.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "switch.outputTopicOff": {
        "title": "Turn Off Topic",
        "description": "Dedicated topic used exclusively when deactivating this device.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "switch.onPayload": {
        "title": "On State Value",
        "description": "Exact payload published when turning the switch on (e.g. ON, true, or 1).",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "switch.offPayload": {
        "title": "Off State Value",
        "description": "Exact payload published when turning the switch off (e.g. OFF, false, or 0).",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)"
        }
    },
    "switch.backgroundColorOn": {
        "title": "Active State Color",
        "description": "Button background color when the device is turned on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.backgroundColorOff": {
        "title": "Inactive State Color",
        "description": "Button background color when the device is turned off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.backgroundColorHover": {
        "title": "Hover Accent Color",
        "description": "Subtle background glow when hovering pointer over the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.thumbColor": {
        "title": "Toggle Knob Color",
        "description": "Color of the sliding knob inside toggle style switches.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.enableGlow": {
        "title": "Illuminated Edge Glow",
        "description": "Casts a glowing neon border around the button when switched on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.bevel": {
        "title": "3D Beveled Edges",
        "description": "Adds tactile chamfer highlights to give the button a physical push-button feel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.buttonRadius": {
        "title": "Button Corner Curvature",
        "description": "Corner rounding radius in pixels for the button enclosure.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.selectionGroup": {
        "title": "Radio Selection Group",
        "description": "Name of a mutually exclusive group where selecting one button automatically turns off others.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "text.text": {
        "title": "Markdown & Text Content",
        "description": "Supports full Markdown formatting, tables, headings, checklists, and dynamic {{topic}} tokens.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textAlign": {
        "title": "Horizontal Text Alignment",
        "description": "Align text to Left, Center, or Right within the frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textVerticalAlign": {
        "title": "Vertical Text Alignment",
        "description": "Align text to Top, Middle, or Bottom inside the card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.labelCase": {
        "title": "Text Capitalization",
        "description": "Controls capitalization formatting for markdown and label text:\n• Use Typography Settings: Inherits capitalization rules defined in Dashboard Settings.\n• UPPERCASE: Converts all characters to capital letters.\n• Capitalize: Formats text with the first letter of each word capitalized.\n• lowercase: Formats all characters to lowercase.\n• None: Preserves exact text casing as entered in the markdown source.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textRotation": {
        "title": "Text Angle Rotation",
        "description": "Rotate text block in 90-degree steps for vertical side banner titles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textOffX": {
        "title": "Text Offset X",
        "description": "Nudge text position horizontally in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textOffY": {
        "title": "Text Offset Y",
        "description": "Nudge text position vertically in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdLinkTarget": {
        "title": "Markdown Link Destination",
        "description": "Controls how markdown hyperlink clicks are handled:\n• Use Markdown Setting (per link): Follows target tags specified directly in markdown links.\n• Always Open in New Tab: Forces all markdown links to launch in a separate browser tab.\n• Always Open in Same Tab: Opens markdown links inside the current dashboard window.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdTextWrap": {
        "title": "Automatic Word Wrapping",
        "description": "Wraps long text to subsequent lines rather than clipping or overflowing.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdAutoFitText": {
        "title": "Dynamic Auto-Fit Font Scaling",
        "description": "Automatically shrinks or grows font size so text fills available space without clipping.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdOverflowScroll": {
        "title": "Touch Scroll Overflow",
        "description": "Allows smooth vertical scrolling when content exceeds the card height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollMotion": {
        "title": "Ticker Marquee Animation",
        "description": "Defines the movement trajectory for scrolling text:\n• Loop: Wraps text continuously so the beginning reappears right after the end.\n• Bounce: Reverses scroll direction when reaching the boundary, moving back and forth.\n• Reset: Scrolls completely out of view before re-entering from the start.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollSpeed": {
        "title": "Ticker Scroll Speed",
        "description": "Velocity of the animated marquee text in pixels per second.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollReverse": {
        "title": "Reverse Ticker Direction",
        "description": "Scrolls ticker text from right-to-left instead of left-to-right.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollGap": {
        "title": "Ticker Repeat Clearance",
        "description": "Spacing in pixels between the end of the text and the start of the repeated loop.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollHold": {
        "title": "Ticker Pause Duration",
        "description": "Pause duration in seconds before marquee restarts scrolling.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.textScrollFade": {
        "title": "Ticker Edge Fade",
        "description": "Feathered gradient fade mask on text edges to soften entrance and exit.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdTableStyle": {
        "title": "Markdown Table Styling",
        "description": "Visual appearance for markdown tables (Clean, Striped, Bordered, or Modern Glass).",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdCalendarWeekStart": {
        "title": "Calendar First Day of Week",
        "description": "Sets which day starts weekly calendar views in markdown tables:\n• Europe (Monday): Starts weekly calendar views on Monday following the ISO 8601 standard.\n• Americas / Japan (Sunday): Starts weekly calendar views on Sunday following traditional layouts.\n• Middle East (Saturday): Starts weekly calendar views on Saturday following regional week schedules.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdTableColumnWidthMode": {
        "title": "Table Column Sizing",
        "description": "Controls how table column widths are distributed:\n• Auto (each table natural width): Allows each column to size naturally based on cell content.\n• Align table columns (same column count): Synchronizes widths across tables sharing identical column counts.\n• Equal Table Column Widths: Divides table width evenly among all columns.\n• Fixed Table Column Width: Enforces a uniform pixel width across every column.\n• Custom Column Width: Uses comma-separated column width percentages specified in settings.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdTableBorderRadius": {
        "title": "Table Corner Rounding",
        "description": "Rounding radius in pixels on markdown table borders.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdTableCellPadding": {
        "title": "Table Cell Padding",
        "description": "Internal spacing in pixels inside table cells.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.mdIconWeight": {
        "title": "Markdown Icon Weight",
        "description": "Phosphor icon stroke style for embedded icons in markdown text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.dropShadowColor": {
        "title": "Text Drop Shadow Color",
        "description": "Color tint for text drop shadow elevation.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.dropShadowBlur": {
        "title": "Text Shadow Blur Radius",
        "description": "Softness spread of the text shadow for legibility against busy backgrounds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "canvasBg": {
        "title": "Canvas Background Start",
        "description": "Primary background fill color for the dashboard canvas. Sets the flat color or the top gradient tone.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-the-styling-cascade-master-vs-local"
        }
    },
    "canvasBgEnd": {
        "title": "Canvas Background End",
        "description": "Secondary background color used to generate a smooth gradient across the entire canvas.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-the-styling-cascade-master-vs-local"
        }
    },
    "canvasImage": {
        "title": "Background Image URL",
        "description": "URL or local image path for the dashboard wallpaper. Overlays behind all widgets.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-the-styling-cascade-master-vs-local"
        }
    },
    "canvasBgSize": {
        "title": "Canvas Image Fit",
        "description": "Controls how background images scale within the canvas:\n• Cover: Scales the image to fill the canvas completely, cropping excess if necessary.\n• Contain: Scales the image to fit entirely within the screen without cropping.\n• Tile: Repeats the image pattern horizontally and vertically across the canvas.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-the-styling-cascade-master-vs-local"
        }
    },
    "inactivityPageEnabled": {
        "title": "Landing Page & Inactivity Return",
        "description": "Opens the Startup Landing Page when the dashboard loads, and returns to that page after a period of inactivity on a wall display.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "8-canvas-settings--inspector"
        }
    },
    "inactivityTimeoutSeconds": {
        "title": "Inactivity Timeout",
        "description": "Number of idle seconds before the dashboard switches back to the default landing page. Set to 0 to disable.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "8-canvas-settings--inspector"
        }
    },
    "preloadImagesOnAllPages": {
        "title": "Preload All Page Images",
        "description": "Load images across all pages at startup so tab switches and floorplan navigations feel instantaneous.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "8-canvas-settings--inspector"
        }
    },
    "holdToActivateDuration": {
        "title": "Hold to Activate Duration",
        "description": "How long you must press a switch or action button before triggering. Prevents accidental taps on wall touchscreens.",
        "help": null
    },
    "gestureTouchOnly": {
        "title": "Touchscreen Only Gestures",
        "description": "Restricts swipe gestures to touchscreen fingers only, ignoring desktop mouse drags.",
        "help": null
    },
    "swipeLeftEnabled": {
        "title": "Swipe Left Action",
        "description": "Enable swipe left gesture on canvas to switch pages or trigger home automation actions.",
        "help": null
    },
    "swipeRightEnabled": {
        "title": "Swipe Right Action",
        "description": "Enable swipe right gesture on canvas to switch pages or trigger home automation actions.",
        "help": null
    },
    "swipeUpEnabled": {
        "title": "Swipe Up Action",
        "description": "Enable swipe up gesture on canvas to jump between dashboard screens.",
        "help": null
    },
    "swipeDownEnabled": {
        "title": "Swipe Down Action",
        "description": "Enable swipe down gesture on canvas to switch pages or refresh panels.",
        "help": null
    },
    "fontFamily": {
        "title": "Global Font Family",
        "description": "Default typeface inherited by all widgets across the dashboard unless overridden locally.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultTextAlign": {
        "title": "Default Text Alignment",
        "description": "Global horizontal text alignment for widget labels and values.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultTextVerticalAlign": {
        "title": "Default Vertical Alignment",
        "description": "Global vertical text alignment inside widget containers.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultColVal": {
        "title": "Default Value Color",
        "description": "Global font color used for sensor readings, toggles, and dynamic state numbers.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultColLabel": {
        "title": "Default Label Color",
        "description": "Global font color used for widget titles and descriptive captions.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultFsVal": {
        "title": "Default Value Font Size",
        "description": "Base font size for sensor values and primary readouts.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultFsLabel": {
        "title": "Default Label Font Size",
        "description": "Base font size for titles and secondary descriptive text.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgVisible": {
        "title": "Show Container Card",
        "description": "Toggles whether widgets render an outer card container by default.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "glowEnabled": {
        "title": "Enable Outer Glow",
        "description": "Adds a soft luminous drop glow around widget card edges.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultCornerRadius": {
        "title": "Corner Radius",
        "description": "Global corner rounding for widget cards and panels.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgColStart": {
        "title": "Card Background Start",
        "description": "Primary card background color or start of the linear gradient.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgOpacityStart": {
        "title": "Card Start Opacity",
        "description": "Transparency percentage for the card background start color.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgColEnd": {
        "title": "Card Background End",
        "description": "Secondary background color for card linear gradients.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgOpacityEnd": {
        "title": "Card End Opacity",
        "description": "Transparency percentage for the card background gradient end color.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgAngle": {
        "title": "Gradient Angle",
        "description": "Direction in degrees for the background color blend across cards.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "bgBlur": {
        "title": "Frosted Glass Blur",
        "description": "Applies hardware accelerated background backdrop blur behind translucent widget cards.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "glowColor": {
        "title": "Card Glow Color",
        "description": "Luminous color tint cast around the outer edge of widget cards.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "glowRadius": {
        "title": "Card Glow Radius",
        "description": "Diffusion distance in pixels for the card outer glow effect.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "glowOpacity": {
        "title": "Card Glow Opacity",
        "description": "Brightness and visibility strength of the outer card glow.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "borderColor": {
        "title": "Border Stroke Color",
        "description": "Color for outer card outlines and structural separation lines.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "defaultBorderWidth": {
        "title": "Border Width",
        "description": "Thickness in pixels of the card outline stroke. Set to 0 for borderless cards.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "innerGlow": {
        "title": "Inner Border Highlight",
        "description": "Adds a subtle inset rim light along the top inside edge of cards for frosted glass depth.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "1-global-defaults-master-settings"
        }
    },
    "arrow.pathBendRadius": {
        "title": "Path Corner Radius",
        "description": "Rounding radius in pixels applied to multi-point elbow corners on custom routing lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "2-custom-path-geometry"
        }
    },
    "battery.group_label": {
        "title": "Battery Label Typography",
        "description": "Font, color, and size options for the widget title displayed above or beside the battery gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery",
            "anchor": "3-text--typography"
        }
    },
    "empty.group_label": {
        "title": "Container Label Typography",
        "description": "Font family, color, and size options for the title displayed on this grouped container card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "container",
            "anchor": "3-text--typography"
        }
    },
    "label.textRotation": {
        "title": "Label Rotation",
        "description": "Rotate the label text by degrees. Ideal for vertical sidebar badges and rotated sensor axis headers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "2-layout--dimensions"
        }
    },
    "label.group_label": {
        "title": "Label Typography",
        "description": "Configure typography, size, line height, and color for this standalone text label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "3-text--typography"
        }
    },
    "editbox.urlPrefix": {
        "title": "Prefix URL",
        "description": "Fixed prefix automatically prepended to the user input before dispatching or opening the link.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "1-data--behavior"
        }
    },
    "editbox.urlSuffix": {
        "title": "Suffix URL",
        "description": "Fixed suffix appended to the end of user input before dispatching.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "1-data--behavior"
        }
    },
    "editbox.bgOpacity": {
        "title": "Input Background Opacity",
        "description": "Background transparency percentage for the text input entry field.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "2-appearance"
        }
    },
    "editbox.borderWidth": {
        "title": "Input Border Width",
        "description": "Stroke thickness in pixels for the text box input field outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "2-appearance"
        }
    },
    "editbox.group_editboxLabel": {
        "title": "Widget Label Typography",
        "description": "Font, size, and styling for the descriptive caption above the input box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "3-text--typography"
        }
    },
    "editbox.group_editboxInput": {
        "title": "Input Text Typography",
        "description": "Font family, size, and alignment for the text entered by the user inside the edit box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "editbox",
            "anchor": "3-text--typography"
        }
    },
    "icon.active": {
        "title": "Default State",
        "description": "Initial icon state when no topic data has been received yet.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "1-data-behavior"
        }
    },
    "icon.group_icon_style_iconSourceOff": {
        "title": "Inactive Icon Style",
        "description": "Icon graphic, color, and size displayed when the linked sensor or switch is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "2-icon-states-inactive--active"
        }
    },
    "icon.group_icon_style_iconSourceOn": {
        "title": "Active Icon Style",
        "description": "Icon graphic, active color tint, and size displayed when the linked state evaluates to true.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "2-icon-states-inactive--active"
        }
    },
    "icon.size": {
        "title": "Base Icon Size",
        "description": "Default icon dimension in pixels when not overridden by individual states.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance--effects"
        }
    },
    "icon.blink": {
        "title": "Blink on Active",
        "description": "Continuously flash or pulse the icon while in the active state to attract attention for alarms.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance--effects"
        }
    },
    "icon.animSpeed": {
        "title": "Blink Period",
        "description": "Duration in seconds for one complete pulse or blink cycle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance--effects"
        }
    },
    "icon.glowOnActive": {
        "title": "Glow on Active",
        "description": "Cast a bright luminous aura around the icon whenever it turns on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance--effects"
        }
    },
    "icon.group_iconCaption": {
        "title": "Widget Caption Typography",
        "description": "Font, color, and alignment for the caption label rendered under or beside the icon.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "4-text--typography"
        }
    },
    "image.sourceType": {
        "title": "Source Type",
        "description": "Defines where the image data originates:\n• URL: Loads image files from remote web addresses or local camera snapshot paths.\n• Animated Vector Graphic (SVG): Renders inline scalable vector graphics with animated vector effects.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data--source"
        }
    },
    "image.url": {
        "title": "Image URL",
        "description": "Direct web URL or local media gallery path for the photo, floorplan, or camera snapshot.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data--source"
        }
    },
    "image.svgRaw": {
        "title": "Raw SVG Code",
        "description": "Inline SVG markup code to render directly on canvas with crisp vector scaling.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data--source"
        }
    },
    "image.opacity": {
        "title": "Image Opacity",
        "description": "Transparency level of the image layer from 0% invisible to 100% fully opaque.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.liveRefresh": {
        "title": "Enable Live Refresh",
        "description": "Periodically re-fetch the image file to support live security cameras and dynamic weather radar feeds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data--source"
        }
    },
    "image.intervalUnit": {
        "title": "Refresh Interval Unit",
        "description": "Time unit for live camera refreshes, selectable in seconds or minutes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data--source"
        }
    },
    "image.fit": {
        "title": "Image Fit Mode",
        "description": "How the photo fits into the widget bounds. Cover fills completely while Contain prevents any clipping.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.proportional": {
        "title": "Keep Aspect Ratio",
        "description": "Preserve original image proportions to prevent distortion when resizing.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.scale": {
        "title": "Image Scale Percentage",
        "description": "Zoom factor for the image inside its viewport frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.moveX": {
        "title": "Pan Horizontal (X)",
        "description": "Shift image horizontally within its frame to center key details.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.moveY": {
        "title": "Pan Vertical (Y)",
        "description": "Shift image vertically within its frame to focus on the desired subject.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.group_label": {
        "title": "Widget Caption Typography",
        "description": "Font, color, and size options for the title displayed alongside the image.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "3-text-typography"
        }
    },
    "clock._clockInstanceTypeRowSpacer": {
        "title": "Layout Spacer",
        "description": "Internal spacing element maintaining alignment across clock mode selectors.",
        "help": null
    },
    "clock.numberDistance": {
        "title": "Dial Number Distance",
        "description": "Radial distance percentage placing hour numbers closer to the center or outer bezel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face--hands"
        }
    },
    "clock.capSize": {
        "title": "Center Pivot Cap Size",
        "description": "Diameter in pixels of the center circular cap holding the analog clock hands.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face--hands"
        }
    },
    "clock.backCapSize": {
        "title": "Rear Hand Extension Cap",
        "description": "Size of the decorative counterweight hub at the back of the second hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face--hands"
        }
    },
    "clock.flipLabelHour": {
        "title": "Hour Tile Label",
        "description": "Custom text displayed under the hours tile on flip clocks, such as Hours or Uur.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.flipLabelMinute": {
        "title": "Minute Tile Label",
        "description": "Custom text displayed under the minutes tile on flip clocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.flipLabelSecond": {
        "title": "Second Tile Label",
        "description": "Custom text displayed under the seconds tile on flip clocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.textShowHour": {
        "title": "Show Hours Segment",
        "description": "Toggle display of the hour digits in digital text clock mode.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textShowMinute": {
        "title": "Show Minutes Segment",
        "description": "Toggle display of the minute digits in digital text clock mode.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textShowSecond": {
        "title": "Show Seconds Segment",
        "description": "Toggle display of running seconds digits in digital text clock mode.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textDateSeg0": {
        "title": "Date Segment 1",
        "description": "First component of the formatted date string, such as weekday name or day number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textDateSeg1": {
        "title": "Date Segment 2",
        "description": "Second component of the formatted date string.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textDateSeg2": {
        "title": "Date Segment 3",
        "description": "Third component of the formatted date string, such as month name.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textDateSeg3": {
        "title": "Date Segment 4",
        "description": "Fourth component of the formatted date string, such as full year.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textDateSeg4": {
        "title": "Date Segment 5",
        "description": "Fifth optional component of the formatted date string.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.textLocale": {
        "title": "Date Language & Locale",
        "description": "Locale identifier for month and day name translations, such as nl-NL, de-DE, or en-US.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.group_clockGroupLabel": {
        "title": "Clock Widget Label",
        "description": "Font, size, and styling for the title displayed on the clock widget.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "clock.group_clockAnalogNum": {
        "title": "Dial Numbers Typography",
        "description": "Font family and size for the 1 to 12 numerals on analog clock dials.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face--hands"
        }
    },
    "clock.group_clockFlipNum": {
        "title": "Flip Digits Typography",
        "description": "Font and sizing for numbers rendered on flip clock cards.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.group_clockFlipLabel": {
        "title": "Flip Sub-Labels Typography",
        "description": "Font and color options for the small text labels beneath flip clock digits.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.group_clockFlipAmPm": {
        "title": "AM / PM Typography",
        "description": "Font, size, and color for the 12-hour AM and PM indicator tag.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.group_clockTimeDate": {
        "title": "Digital Time & Date Typography",
        "description": "Typography and styling for digital clock numbers and calendar lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "gauge.displayKeepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Preserve fixed decimal precision so 21.00 does not collapse to 21.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.abbreviatedDecimalPlaces": {
        "title": "Abbreviated Decimals",
        "description": "Number of decimal places shown when large sensor numbers are abbreviated with k or M.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.barType": {
        "title": "Gauge Visual Style",
        "description": "Selects the visual geometry of the gauge display:\n• round: Renders a curved radial arc gauge dial.\n• horizontal: Renders a straight linear bar progress meter.\n• none: Hides the gauge bar, displaying only numeric values, icons, and labels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.gaugeSizeOffset": {
        "title": "Dial Size Adjustment",
        "description": "Fine-tune the diameter or outer margin of the gauge arc within its container.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barOpacity": {
        "title": "Value Bar Opacity",
        "description": "Opacity percentage of the active progress fill bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barGlow": {
        "title": "Value Bar Glow",
        "description": "Adds a luminous glow along the filled portion of the gauge arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.startColor": {
        "title": "Gauge Start Color",
        "description": "Color at the low end of the gauge scale. Blends smoothly into middle and end colors.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.colMidCustom": {
        "title": "Middle & Baseline Color",
        "description": "Color at the midpoint or baseline reference mark on bi-directional temperature and power dials.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.endColor": {
        "title": "Gauge End Color",
        "description": "Color at the top of the gauge range representing high sensor readings.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barOutlineWidth": {
        "title": "Bar Outline Width",
        "description": "Thickness in pixels of the stroke surrounding the active gauge bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barOutlineColor": {
        "title": "Bar Outline Color",
        "description": "Color of the outline stroke bounding the active gauge arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barOutlineOpacity": {
        "title": "Bar Outline Opacity",
        "description": "Transparency percentage for the active bar outline stroke.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barInnerGlow": {
        "title": "Bar Inner Glow",
        "description": "Adds a soft internal lighting gradient along the inside edge of the value bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barInnerGlowColor": {
        "title": "Bar Inner Glow Color",
        "description": "Highlight color for the inside edge glow on the gauge fill.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.barInnerGlowOpacity": {
        "title": "Bar Inner Glow Opacity",
        "description": "Intensity of the inner rim glow along the active bar fill.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.trackColor": {
        "title": "Empty Track Color",
        "description": "Background track color for the unfilled portion of the gauge arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.trackOpacity": {
        "title": "Empty Track Opacity",
        "description": "Transparency percentage of the empty background track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.trackOutlineOpacity": {
        "title": "Track Outline Opacity",
        "description": "Transparency percentage of the stroke outlining the background track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.trackInnerGlowColor": {
        "title": "Track Inner Glow Color",
        "description": "Color of the recessed inner shadow line inside the background track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.trackInnerGlowOpacity": {
        "title": "Track Inner Glow Opacity",
        "description": "Strength of the inset groove lighting on the empty gauge track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.baselineMode": {
        "title": "Enable Center Baseline",
        "description": "Fills outward from a center point instead of zero. Ideal for thermostat offsets and solar net metering.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.baselineValue": {
        "title": "Baseline Reference Value",
        "description": "Numeric origin point from which the bar expands left or right.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.showLabels": {
        "title": "Show Axis Scale Labels",
        "description": "Display numeric calibration labels along the gauge scale.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.rotateLabels": {
        "title": "Rotate Scale Labels",
        "description": "Angled numbers follow the circular curve of the dial.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.labelCount": {
        "title": "Target Tick Count",
        "description": "Approximate number of major interval divisions generated around the arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.labelOffset": {
        "title": "Scale Label Offset",
        "description": "Distance in pixels pushing numbers further inside or outside the gauge track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.axisDecimals": {
        "title": "Axis Decimal Precision",
        "description": "Number of decimal places shown on numeric scale marks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.axisRoundingMode": {
        "title": "Axis Scale Rounding",
        "description": "Determines how scale tick marks and limits are calculated:\n• Fit Data Range: Sets scale boundaries strictly to your specified minimum and maximum values.\n• Clean Steps: Snaps scale ticks to human-friendly increments like 1, 2, 5, or 10.\n• Whole Numbers Only: Constrains scale tick intervals strictly to integers for count values.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.showTickMarks": {
        "title": "Show Tick Marks",
        "description": "Render small radial notch lines along the gauge perimeter.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.tickMarkThickness": {
        "title": "Tick Mark Thickness",
        "description": "Line width in pixels of the calibration notch marks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.tickMarkLength": {
        "title": "Tick Mark Length",
        "description": "Radial length in pixels of the calibration tick lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.tickMarkOffset": {
        "title": "Tick Mark Offset",
        "description": "Radial position shifting tick marks closer to the track or dial edge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.tickMarkColorCustom": {
        "title": "Tick Mark Color",
        "description": "Color applied to the scale tick marks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.group_icon_style_iconSourceOn": {
        "title": "Gauge Center Icon",
        "description": "Icon symbol, color, and size displayed inside the center of the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.iconSize": {
        "title": "Center Icon Size",
        "description": "Base size in pixels of the center icon graphic.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.layoutRound": {
        "title": "Round Gauge Text Position",
        "description": "Placement of the main value reading inside the circular arc.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.layoutHorizontal": {
        "title": "Linear Bar Text Position",
        "description": "Placement of value and unit text on horizontal gauge bars.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.unit": {
        "title": "Unit of Measurement",
        "description": "Text appended to readings, such as degrees Celsius, Watts, or percentage.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.valueAlignment": {
        "title": "Value Text Alignment",
        "description": "Horizontal text alignment for the main sensor measurement.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.group_gaugeCaption": {
        "title": "Widget Caption Typography",
        "description": "Font, color, and size for the title label displayed on the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.group_gaugeValue": {
        "title": "Primary Reading Typography",
        "description": "Font family, weight, and size for the main sensor number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.group_gaugeUnit": {
        "title": "Unit Text Typography",
        "description": "Font styling and color for measurement unit symbols.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "gauge.group_gaugeAxis": {
        "title": "Scale Labels Typography",
        "description": "Font styling, size, and color for numbers around the dial scale.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text--typography"
        }
    },
    "graph.series": {
        "title": "Data Series Configuration",
        "description": "Add, reorder, or customize individual data lines and bar series plotted on this graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.bufferMode": {
        "title": "Streaming Buffer Mode",
        "description": "Controls how historical data samples are stored in memory:\n• Point Count: Retains a fixed maximum number of data entries regardless of elapsed time.\n• Time Period: Retains data points within a sliding time window such as 1 hour or 24 hours.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.reverseDirection": {
        "title": "Reverse Timeline Direction",
        "description": "Plots newest incoming points on the left edge instead of the traditional right side.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.maxPoints": {
        "title": "Maximum Cached Points",
        "description": "Memory buffer limit per series before older data points roll off the timeline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.durationPreset": {
        "title": "Timeline Time Period",
        "description": "Horizontal time span displayed across the graph, from 15 minutes up to 30 days.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.fixedTimeWindow": {
        "title": "Fixed Time Window",
        "description": "Locks horizontal axis to a fixed duration window regardless of point count.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.timelineAdvance": {
        "title": "Timeline Progress Style",
        "description": "Controls how the horizontal time axis moves forward:\n• On New Value: Only advances the timeline when a fresh data packet arrives.\n• Continuous Real Time: Continuously scrolls the timeline second-by-second in real time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.durationCustomValue": {
        "title": "Custom Duration Value",
        "description": "Numeric length for the custom graph time window.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.durationCustomUnit": {
        "title": "Custom Duration Unit",
        "description": "Time unit for the custom window, selectable in minutes, hours, or days.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.lineGaps": {
        "title": "Handle Missing Data Gaps",
        "description": "Determines how periods without incoming data are drawn:\n• Break on Missing Time: Leaves an empty gap when data stops arriving to highlight sensor dropouts.\n• Connect Points: Bridges directly across missing intervals with unbroken lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.dynamicFloor": {
        "title": "Dynamic Floor",
        "description": "Automatically scales vertical axis bottom to the minimum observed sensor value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.dynamicCeiling": {
        "title": "Dynamic Ceiling",
        "description": "Automatically scales vertical axis top to the peak observed sensor value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.fixedFloor": {
        "title": "Fixed Axis Floor",
        "description": "Hard lower bound for the vertical value axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.fixedCeiling": {
        "title": "Fixed Axis Ceiling",
        "description": "Hard upper bound for the vertical value axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.useBaseline": {
        "title": "Enable Zero Baseline",
        "description": "Draws an explicit reference baseline across the graph at a chosen value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.baselineVal": {
        "title": "Baseline Reference Value",
        "description": "Numeric height of the horizontal baseline on the value axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.negMode": {
        "title": "Negative Value Handling",
        "description": "Controls how negative sensor values are represented:\n• Show as Negative: Plots negative values beneath the zero baseline.\n• Show as Positive: Inverts negative values to positive numbers for magnitude comparisons.\n• Ignore (Hide): Excludes negative readings from the graph completely.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "connecting-data--understanding-formats"
        }
    },
    "graph.type": {
        "title": "Visual Graph Type",
        "description": "Selects the rendering technique for data series:\n• Line: Connects consecutive data points with crisp straight angled segments.\n• Smooth: Curves lines gracefully between points using cubic spline interpolation.\n• Stepped: Draws horizontal and vertical step lines, ideal for binary or relay states.\n• Bar: Plots data points as vertical rectangular bars.\n• Text: Overlays latest numeric readings directly on the plot area.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.smoothingAmount": {
        "title": "Line Smoothing Curvature",
        "description": "Spline tension smoothing sharp jagged zig-zags between data points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barDirection": {
        "title": "Bar Orientation",
        "description": "Draw bars rising vertically from the bottom or extending horizontally from the left.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barGroupMode": {
        "title": "Bar Series Layout",
        "description": "Choose how multiple bar series are arranged across the graph:\n• Side by Side: Divides each category slot into separate columns placed next to each other.\n• Stacked: Layers all series bars directly on top of each other at the same baseline position.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barStackGapStep": {
        "title": "Stacked Gap Step",
        "description": "Additional gap in pixels added to each consecutive bar drawn on top, narrowing upper bars so underlying series remain visible.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barGap": {
        "title": "Bar Spacing Gap",
        "description": "Spacing in pixels between adjacent columns in bar charts.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barRadius": {
        "title": "Bar Corner Radius",
        "description": "Corner rounding applied to the top caps of vertical bars.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.barOutlineWidth": {
        "title": "Bar Outline Width",
        "description": "Stroke width bounding individual bar columns.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.graphOffX": {
        "title": "Graph Horizontal Offset",
        "description": "Shifts the plotting area horizontally within the widget bounding box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphOffY": {
        "title": "Graph Vertical Offset",
        "description": "Shifts the plotting area vertically within the widget bounding box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHTopShow": {
        "title": "Top Border Line",
        "description": "Show the upper horizontal boundary line bounding the graph area.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHTopCol": {
        "title": "Top Line Color",
        "description": "Color for the top plot boundary line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHTopW": {
        "title": "Top Line Width",
        "description": "Thickness in pixels of the top bounding line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHTopOp": {
        "title": "Top Line Opacity",
        "description": "Transparency percentage for the top bounding line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBotShow": {
        "title": "Bottom Axis Line",
        "description": "Show the lower horizontal axis line across the bottom of the chart.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBotCol": {
        "title": "Bottom Axis Color",
        "description": "Color for the bottom horizontal baseline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBotW": {
        "title": "Bottom Axis Width",
        "description": "Thickness in pixels of the bottom axis line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBotOp": {
        "title": "Bottom Axis Opacity",
        "description": "Transparency percentage for the bottom horizontal axis line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVLeftShow": {
        "title": "Left Axis Line",
        "description": "Show the vertical axis line running along the left margin.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVLeftCol": {
        "title": "Left Axis Color",
        "description": "Color for the left vertical axis boundary.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVLeftW": {
        "title": "Left Axis Width",
        "description": "Stroke thickness in pixels of the left vertical axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVLeftOp": {
        "title": "Left Axis Opacity",
        "description": "Transparency percentage for the left vertical axis line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVRightShow": {
        "title": "Right Axis Line",
        "description": "Show the vertical line along the right edge of the chart.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVRightCol": {
        "title": "Right Axis Color",
        "description": "Color for the right vertical boundary line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVRightW": {
        "title": "Right Axis Width",
        "description": "Thickness in pixels of the right boundary line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVRightOp": {
        "title": "Right Axis Opacity",
        "description": "Transparency percentage for the right vertical boundary line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVShow": {
        "title": "Vertical Grid Lines",
        "description": "Display vertical background grid lines indicating time divisions.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVCol": {
        "title": "Vertical Grid Color",
        "description": "Color of the vertical time interval grid lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVW": {
        "title": "Vertical Grid Width",
        "description": "Line width in pixels of the vertical grid dividers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVOp": {
        "title": "Vertical Grid Opacity",
        "description": "Transparency percentage for the vertical time grid lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridVSpace": {
        "title": "Vertical Grid Spacing",
        "description": "Spacing in pixels between vertical lines. Set to 0 to match category tick marks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBaseShow": {
        "title": "Baseline Grid Line",
        "description": "Draw a distinct horizontal line across the zero or baseline mark.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBaseCol": {
        "title": "Baseline Grid Color",
        "description": "Color for the horizontal baseline line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBaseW": {
        "title": "Baseline Grid Width",
        "description": "Thickness in pixels of the baseline grid stroke.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHBaseOp": {
        "title": "Baseline Grid Opacity",
        "description": "Transparency percentage for the horizontal baseline grid line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHInnerShow": {
        "title": "Horizontal Grid Lines",
        "description": "Display horizontal background grid lines marking value levels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHInnerCol": {
        "title": "Horizontal Grid Color",
        "description": "Color for inner horizontal value grid lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHInnerW": {
        "title": "Horizontal Grid Width",
        "description": "Thickness in pixels of the inner horizontal grid lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHInnerOp": {
        "title": "Horizontal Grid Opacity",
        "description": "Transparency percentage of the inner horizontal grid lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.gridHInnerSpace": {
        "title": "Horizontal Grid Spacing",
        "description": "Pixel spacing between horizontal lines. Set to 0 to match value axis ticks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointSize": {
        "title": "Data Point Dot Size",
        "description": "Radius in pixels of circular marker dots rendered at each sample point.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showPointValues": {
        "title": "Show Point Values",
        "description": "Print numeric values directly above or beside data points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesHoverOnly": {
        "title": "Values on Hover Only",
        "description": "Shows data point numbers only when hovering over a specific point or bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesAbbreviate": {
        "title": "Abbreviate Large Values",
        "description": "Compress large figures with k, M, or B suffixes for compact display.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesDecimals": {
        "title": "Value Decimal Places",
        "description": "Number of decimal places shown on data point text tags.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesDistribution": {
        "title": "Point Value Distribution",
        "description": "Determines how value labels are distributed across the plot:\n• Time (Peaks & Troughs): Slices the timeline into sections and places labels at local peaks and valleys within each section.\n• Time (Uniform): Distributes labels evenly across time slices, selecting the data point closest to the center of each slice.\n• Point Step (Every N Points): Places labels strictly every Nth data point, anchored directly to data nodes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.autoPointValuesInterval": {
        "title": "Auto Point Interval",
        "description": "Automatically spaces point labels to prevent visual crowding.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesTimeWidth": {
        "title": "Time Section Width (px)",
        "description": "Width in pixels of each time section column (for example 48px). Smaller widths display more values across the plot, while larger widths display fewer values.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesStep": {
        "title": "Point Step",
        "description": "Spacing interval for value labels in Point Step mode. For example, 1 displays a value on every single node point, 2 on every other point, and 3 on every third point.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.pointValuesInterval": {
        "title": "Point Label Interval",
        "description": "Show numeric labels only every Nth point on busy dense graphs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showLegend": {
        "title": "Show Series Legend",
        "description": "Display an interactive series legend with colored swatches and toggles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendLayout": {
        "title": "Legend Layout",
        "description": "Arrange legend items horizontally in a row or stacked vertically in a column.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendSwatch": {
        "title": "Legend Swatch Shape",
        "description": "Select square, circular, or line styled color swatches for each series.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendShowContainer": {
        "title": "Show Legend Box",
        "description": "Wrap the legend in a frosted glass card container.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendAutoSize": {
        "title": "Auto Size Legend",
        "description": "Automatically resize the legend box to fit its item labels snugly.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendW": {
        "title": "Legend Width",
        "description": "Explicit width in pixels for the legend box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendH": {
        "title": "Legend Height",
        "description": "Explicit height in pixels for the legend box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendOffX": {
        "title": "Legend Offset X",
        "description": "Horizontal pixel adjustment for positioning the legend overlay.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendOffY": {
        "title": "Legend Offset Y",
        "description": "Vertical pixel adjustment for positioning the legend overlay.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.graphAnimation": {
        "title": "Graph Animation",
        "description": "Controls line drawing animations:\n• None: Renders chart lines and updates immediately without animation delay.\n• Draw In & Morph: Plays an initial drawing animation and smoothly morphs curves on value updates.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimDuration": {
        "title": "Full Update Period",
        "description": "Transition duration in seconds when redrawing the entire graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimStreamDuration": {
        "title": "Streaming Period",
        "description": "Slide animation duration in seconds when new streaming points arrive.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimShimmer": {
        "title": "Shimmer on Unchanged Data",
        "description": "Brief subtle shimmer to acknowledge incoming data when the reading remains unchanged.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimStaggerBars": {
        "title": "Stagger Bar Rise",
        "description": "Cascades bar growth sequentially from left to right on load.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimPreviewFull": {
        "title": "Preview Full Animation",
        "description": "Replays the graph load animation directly inside the editor canvas.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.graphAnimPreviewStream": {
        "title": "Preview Stream Step",
        "description": "Simulates an incoming real-time telemetry point on the editor canvas.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_label": {
        "title": "Graph Widget Caption",
        "description": "Typography and color for the title rendered above the graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_axisX": {
        "title": "Time Axis (X) Typography",
        "description": "Base style for the category tick numbers. The value axis copies this until you change it. Rotation tilts these numbers. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_axisY": {
        "title": "Value Axis (Y) Typography",
        "description": "Font, size, and styling for sensor numbers along the vertical axis. Rotation tilts those numbers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_axisXLabel": {
        "title": "X Axis (Label)",
        "description": "Base style for the words that name an axis. The other axis label copies this until you change it. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.group_axisYLabel": {
        "title": "Y Axis (Label)",
        "description": "Style for the value axis title. It follows X Axis (Label) until you override it. Rotation starts at -90 degrees and is not copied from the other axis. Horizontal bars rename this to the X axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.group_defaultGraphAxisXLabel": {
        "title": "X Axis (Label)",
        "description": "Base style for the words that name an axis. The other axis label copies this until you change it. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.group_defaultGraphAxisYLabel": {
        "title": "Y Axis (Label)",
        "description": "Style for the value axis title. It follows X Axis (Label) until you override it. Rotation starts at -90 degrees and is not copied from the other axis. Horizontal bars rename this to the X axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.group_text": {
        "title": "Data Values Typography",
        "description": "Base typography for plotted data values and readouts.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_pointVal": {
        "title": "Line Point Labels Typography",
        "description": "Font styling for numeric tags on line chart data points.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_pointValBar": {
        "title": "Bar Point Labels Typography",
        "description": "Font styling for numeric tags on bar chart columns.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.group_legendItem": {
        "title": "Legend Items Typography",
        "description": "Font, color, and size for series titles in the chart legend.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "lightgrid.lightsData": {
        "title": "Configured Light Devices",
        "description": "Manage connected smart lamps, dimmers, tunable white bulbs, and RGB strips.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "2-data--binding-unified-light-state"
        }
    },
    "lightgrid.columns": {
        "title": "Grid Columns",
        "description": "Number of light tiles arranged per row across the grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.itemHeight": {
        "title": "Tile Height",
        "description": "Fixed height in pixels for each individual light button tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.itemWidth": {
        "title": "Tile Width",
        "description": "Fixed width in pixels for each light button tile. Set to 0 to stretch.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.itemSpacing": {
        "title": "Tile Spacing",
        "description": "Gap in pixels between light tiles in the grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileBackgroundColor": {
        "title": "Tile Background Color",
        "description": "Default background color for light tiles when unselected.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileHoverColor": {
        "title": "Tile Hover Color",
        "description": "Highlight color when hovering over a light tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileBackgroundOpacity": {
        "title": "Tile Background Opacity",
        "description": "Transparency percentage for individual light tiles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileBlur": {
        "title": "Tile Frosted Blur",
        "description": "Frosted glass backdrop blur applied behind each light tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileOutlineWidth": {
        "title": "Tile Outline Width",
        "description": "Stroke width in pixels for the tile border.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileOutlineColor": {
        "title": "Tile Outline Color",
        "description": "Color of the border stroke bounding each light tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileOutlineOpacity": {
        "title": "Tile Outline Opacity",
        "description": "Transparency percentage of the tile border outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileInnerGlow": {
        "title": "Tile Inner Glow",
        "description": "Adds a subtle inner glass bevel highlight around each tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileInnerGlowColor": {
        "title": "Tile Inner Glow Color",
        "description": "Highlight color for the inside edge glow on tiles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.tileInnerGlowOpacity": {
        "title": "Tile Inner Glow Opacity",
        "description": "Intensity of the inner glow along tile borders.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.toggleColorOn": {
        "title": "Toggle Color (On)",
        "description": "Active indicator color when a light is turned on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.toggleColorOff": {
        "title": "Toggle Color (Off)",
        "description": "Muted indicator color when a light is powered off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.alwaysShowPanel": {
        "title": "Always Show Control Panel",
        "description": "Keeps the color picker and brightness slider panel docked continuously.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.previewPopover": {
        "title": "Preview Popover In Editor",
        "description": "Opens the control panel popover in the editor to inspect styling.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.autoDeselect": {
        "title": "Auto Close Control Panel",
        "description": "Automatically dismisses the popover panel after a period of user inactivity.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.deselectTime": {
        "title": "Panel Auto Close Timeout",
        "description": "Seconds to wait after your last touch before hiding the control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverOffX": {
        "title": "Panel Position X",
        "description": "Horizontal pixel offset for positioning the floating light control popover.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverOffY": {
        "title": "Panel Position Y",
        "description": "Vertical pixel offset for positioning the floating light control popover.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverW": {
        "title": "Control Panel Width",
        "description": "Width in pixels of the floating light detail popover.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverH": {
        "title": "Control Panel Height",
        "description": "Height in pixels of the floating light detail popover.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverCornerRadius": {
        "title": "Panel Corner Radius",
        "description": "Corner rounding for the floating control panel card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBgColStart": {
        "title": "Panel Background Start",
        "description": "Start background color for the floating control card gradient.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBgOpacityStart": {
        "title": "Panel Start Opacity",
        "description": "Transparency percentage for the control card background.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBgColEnd": {
        "title": "Panel Background End",
        "description": "End background color for the floating control card gradient.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBgOpacityEnd": {
        "title": "Panel End Opacity",
        "description": "Transparency percentage for the end color of the card gradient.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBgAngle": {
        "title": "Panel Gradient Angle",
        "description": "Angle in degrees for the background gradient of the popover card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBorderColor": {
        "title": "Panel Border Color",
        "description": "Color of the outline stroke surrounding the control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBorderWidth": {
        "title": "Panel Border Width",
        "description": "Stroke thickness in pixels for the control panel outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverBorderOpacity": {
        "title": "Panel Border Opacity",
        "description": "Transparency percentage of the control panel outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverGlowEnabled": {
        "title": "Panel Outer Glow",
        "description": "Adds a luminous glow around the edges of the floating control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverGlowColor": {
        "title": "Panel Glow Color",
        "description": "Color tint for the popover outer glow aura.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.popoverGlowRadius": {
        "title": "Panel Glow Radius",
        "description": "Spread distance in pixels for the floating panel glow.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.presetCols": {
        "title": "Color Preset Columns",
        "description": "Number of color swatch columns inside the light popover panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.presetRows": {
        "title": "Color Preset Rows",
        "description": "Number of color preset rows shown in the popover.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.presetGap": {
        "title": "Preset Swatch Gap",
        "description": "Gap in pixels between color swatch buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.presetIndicators": {
        "title": "Preset Type Indicators",
        "description": "Displays visual icons differentiating RGB color presets from warm white temperature presets.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderTrackH": {
        "title": "Brightness Track Height",
        "description": "Height in pixels of the brightness and temperature slider tracks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderFillH": {
        "title": "Brightness Fill Height",
        "description": "Thickness of the filled progress bar inside the popover slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderThumbSz": {
        "title": "Slider Thumb Handle Size",
        "description": "Diameter in pixels of the draggable handle on the light popover slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderColFill": {
        "title": "Slider Fill Color",
        "description": "Color for the active filled track of the popover slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderColTrack": {
        "title": "Slider Track Color",
        "description": "Background groove color for the popover slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.sliderColThumb": {
        "title": "Slider Thumb Color",
        "description": "Color of the draggable handle knob on the popover slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.iconSize": {
        "title": "Light Icon Size",
        "description": "Base size in pixels for the bulb and lamp icons on each tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.iconColOff": {
        "title": "Icon Color (Off)",
        "description": "Color of the lamp icon when the light is powered off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.iconColOn": {
        "title": "Icon Color (On)",
        "description": "Color of the lamp icon when the light is powered on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.useLightColor": {
        "title": "Tint Icon by Bulb Color",
        "description": "Dynamically tints the tile icon to match the real-time live RGB color emitted by the bulb.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.iconColorize": {
        "title": "Colorize Custom PNG Icons",
        "description": "Applies CSS color masking to custom uploaded transparent PNG images.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.labelPos": {
        "title": "Widget Label Position",
        "description": "Position of the main widget title relative to the light grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.group_lgWidgetLabel": {
        "title": "Widget Title Typography",
        "description": "Font, size, and styling for the primary title displayed on the light grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.group_lgLightName": {
        "title": "Light Tile Names Typography",
        "description": "Font family, size, and color for the individual device names printed on tiles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.group_lgPanelTitle": {
        "title": "Control Panel Title Typography",
        "description": "Font styling for the active lamp title displayed in the header of the popover panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "list.data": {
        "title": "List Data Source",
        "description": "Topic payload or static array supplying text lines, shopping lists, or security log events.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "1-data-behavior"
        }
    },
    "list.maxLines": {
        "title": "Maximum Display Lines",
        "description": "Maximum number of rows retained before older log entries roll off the screen.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "1-data-behavior"
        }
    },
    "list.rawMode": {
        "title": "Raw String Mode",
        "description": "Treat incoming string payloads directly as newline separated items without JSON decoding.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "1-data-behavior"
        }
    },
    "list.triggerTopic": {
        "title": "Item Click Trigger Topic",
        "description": "MQTT or Homey topic triggered when the user taps a list row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.outputMode": {
        "title": "Trigger Output Mode",
        "description": "Controls when checked items are published:\n• On Trigger Topic Only: Publishes the selected list items only when an external trigger topic fires.\n• On Any Change: Immediately publishes updated list items whenever checkboxes or selections change.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.outputFormat": {
        "title": "Trigger Output Format",
        "description": "Selects the data structure published by the list:\n• JSON Array (Objects): Publishes items as structured JSON objects containing id, label, and state.\n• Boolean Array: Publishes items as a compact array of boolean true or false flags.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.selectAllTopic": {
        "title": "Select All Trigger Topic",
        "description": "Topic published to batch check all items in a to-do list.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.deselectAllTopic": {
        "title": "Deselect All Trigger Topic",
        "description": "Topic published to clear checkmarks from all list items.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.deleteSelectedTopic": {
        "title": "Delete Selected Trigger Topic",
        "description": "Topic published to clear checked items from shopping lists and tasks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "2-output--trigger"
        }
    },
    "list.showIcons": {
        "title": "Show Row Icons",
        "description": "Display an icon before each list item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.showTimestamp": {
        "title": "Show Event Timestamp",
        "description": "Displays the date and time when each log entry was received.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.enableCheckboxes": {
        "title": "Interactive Checkboxes",
        "description": "Adds clickable checkmarks to items for interactive tasks and shopping lists.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.lineGap": {
        "title": "Item Row Spacing",
        "description": "Vertical spacing in pixels between consecutive list rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.readOnly": {
        "title": "Read Only Mode",
        "description": "Disables checkbox toggling and item selection. Ideal for view-only security logs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.checkboxAlignment": {
        "title": "Checkbox Alignment",
        "description": "Places interactive checkboxes on the left edge or right margin of the row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.strikethroughChecked": {
        "title": "Strikethrough Checked Items",
        "description": "Draws a line through completed tasks and purchased shopping items.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.group_icon_style_iconSourceRow": {
        "title": "Default Row Icon",
        "description": "Icon graphic and color styling rendered alongside log entries.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.group_icon_style_iconSourceCheckboxOn": {
        "title": "Checked Checkbox Icon",
        "description": "Icon symbol and active color displayed when an item is checked.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.group_icon_style_iconSourceCheckboxOff": {
        "title": "Unchecked Checkbox Icon",
        "description": "Icon symbol and muted color displayed when an item is unchecked.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.iconGap": {
        "title": "Icon Spacing",
        "description": "Gap in pixels separating row icons from item text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.timeFormat": {
        "title": "Time Display Format",
        "description": "Time format for log timestamps, including hour, minute, and second options.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.time24h": {
        "title": "24-Hour Time Format",
        "description": "Display log timestamps using 24-hour military time instead of 12-hour AM and PM.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.dateFormat": {
        "title": "Date Display Format",
        "description": "Calendar formatting for log timestamps, such as DD-MM-YYYY or MM/DD/YY.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.group_listLabel": {
        "title": "List Caption Typography",
        "description": "Font, size, and styling for the title heading above the list.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.group_listItem": {
        "title": "List Item Text Typography",
        "description": "Font family, size, line height, and color for list row text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list"
        }
    },
    "list.group_listTimestamp": {
        "title": "Log Timestamp Typography",
        "description": "Font and muted color styling for the timestamp shown beside entries.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "menu.menuLayout": {
        "title": "Menu Layout Direction",
        "description": "Arranges menu navigation items:\n• Vertical: Arranges menu navigation items in a single vertical column.\n• Horizontal: Arranges menu navigation items in a single horizontal row.\n• Horizontal & Vertical: Displays menu items in a two-dimensional grid layout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuStyle": {
        "title": "Menu Flyout Style",
        "description": "Controls the opening animation and panel positioning:\n• Static (Always visible): Keeps navigation items permanently visible without opening or closing.\n• Instant (no slide): Toggles navigation items immediately without transition animations.\n• Dropdown Menu: Expands navigation items downward from the menu button.\n• Dropup Menu: Expands navigation items upward above the menu button.\n• Slide Left Panel: Slides an off-canvas navigation drawer inward from the left screen edge.\n• Slide Right Panel: Slides an off-canvas navigation drawer inward from the right screen edge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuTriggerTopic": {
        "title": "Menu Trigger Topic",
        "description": "Topic to open (true) or collapse (false) the menu remotely from Homey flows or MQTT.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "2-triggering--status-topics"
        }
    },
    "menu.menuStatusTopic": {
        "title": "Menu Status Topic",
        "description": "Topic published when the menu opens or closes to synchronize dashboard state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "2-triggering--status-topics"
        }
    },
    "menu.menuCloseMethod": {
        "title": "Auto Close Method",
        "description": "Determines when the menu closes automatically:\n• Never close automatically: Keeps the menu open until you explicitly tap the close button.\n• Close after selection except toggle items: Closes upon clicking action links while keeping toggle controls open.\n• Always automatically close: Closes the menu drawer immediately after clicking any item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuWAuto": {
        "title": "Auto Width (Fit Items)",
        "description": "Automatically calculate menu width based on item content lengths.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuHAuto": {
        "title": "Auto Height (Fit Items)",
        "description": "Automatically size menu height to contain all items without inner scrollbars.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuItemSpacing": {
        "title": "Item Spacing",
        "description": "Spacing in pixels between navigation buttons inside the menu.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuItemRadius": {
        "title": "Item Corner Radius",
        "description": "Corner rounding for individual menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuSelectionGroup": {
        "title": "Selection Group Name",
        "description": "Name of the mutually exclusive group ensuring only one menu item stays highlighted at once.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "4-selection-groups"
        }
    },
    "menu.menuSelectionDeselectAllTopic": {
        "title": "Deselect All Group Topic",
        "description": "Topic published to clear active selections across all items in this group.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "4-selection-groups"
        }
    },
    "menu.menuSelectionMode": {
        "title": "Selection Highlighting Mode",
        "description": "Highlight the active page automatically or retain the last button clicked.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "4-selection-groups"
        }
    },
    "menu.menuActiveItemColor": {
        "title": "Active Item Background",
        "description": "Background fill color for the currently active or selected menu item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuActiveLabelColor": {
        "title": "Active Item Text Color",
        "description": "Font color for the text of the selected menu item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuActiveIconColor": {
        "title": "Active Item Icon Color",
        "description": "Icon tint color for the currently selected menu item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuLabelHint": {
        "title": "Menu Label Hint",
        "description": "Controls hover tooltip behavior for menu button labels:\n• Disabled: Never displays a hover tooltip over the button label.\n• When Label Is Truncated: Shows a tooltip only when text exceeds button width and gets clipped.\n• Always: Always displays the full label text in a hover tooltip.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuWidgetLabel": {
        "title": "Menu Widget Caption Typography",
        "description": "Font and color styling for the title heading rendered above the menu.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuItemTitle": {
        "title": "Item Title Typography",
        "description": "Font family, size, and styling for the primary text on each menu button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuItemSub": {
        "title": "Item Subtitle Typography",
        "description": "Font styling for secondary description lines under menu button titles.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuItemBadge": {
        "title": "Badge Typography",
        "description": "Font styling and color for notification count badges on menu items.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "slider.trackOpacity": {
        "title": "Slider Track Opacity",
        "description": "Transparency percentage of the slider track groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackOutlineWidth": {
        "title": "Track Outline Width",
        "description": "Stroke thickness in pixels bounding the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackOutlineColor": {
        "title": "Track Outline Color",
        "description": "Border stroke color surrounding the slider track groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackOutlineOpacity": {
        "title": "Track Outline Opacity",
        "description": "Transparency percentage of the slider track border outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackInnerGlow": {
        "title": "Track Inner Glow",
        "description": "Adds a recessed bevel lighting gradient inside the slider groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackInnerGlowColor": {
        "title": "Track Inner Glow Color",
        "description": "Highlight color for the inner rim glow of the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.trackInnerGlowOpacity": {
        "title": "Track Inner Glow Opacity",
        "description": "Intensity of the inner glow gradient inside the slider track groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillOpacity": {
        "title": "Slider Fill Opacity",
        "description": "Transparency percentage of the active fill bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillOutlineWidth": {
        "title": "Fill Outline Width",
        "description": "Stroke width in pixels for the border bounding the filled progress bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillOutlineColor": {
        "title": "Fill Outline Color",
        "description": "Border stroke color outlining the active filled bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillOutlineOpacity": {
        "title": "Fill Outline Opacity",
        "description": "Transparency percentage for the fill bar border outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillInnerGlow": {
        "title": "Fill Inner Glow",
        "description": "Adds a luminous glass highlight along the active filled bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillInnerGlowColor": {
        "title": "Fill Inner Glow Color",
        "description": "Color for the inner light reflection inside the active fill bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.fillInnerGlowOpacity": {
        "title": "Fill Inner Glow Opacity",
        "description": "Intensity of the inner light highlight along the active fill bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbOutlineWidth": {
        "title": "Thumb Handle Outline Width",
        "description": "Thickness in pixels of the border surrounding the draggable handle knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbOutlineColor": {
        "title": "Thumb Handle Outline Color",
        "description": "Color of the border stroke around the draggable thumb knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbOutlineOpacity": {
        "title": "Thumb Outline Opacity",
        "description": "Transparency percentage of the draggable handle border.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbInnerGlow": {
        "title": "Thumb Handle Inner Glow",
        "description": "Adds a frosted glass rim highlight inside the draggable knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbInnerGlowColor": {
        "title": "Thumb Inner Glow Color",
        "description": "Highlight color for the inside edge glow on the draggable knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.thumbInnerGlowOpacity": {
        "title": "Thumb Inner Glow Opacity",
        "description": "Intensity of the inner glow gradient on the draggable handle.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.captionPosition": {
        "title": "Slider Label Location",
        "description": "Position of the widget caption relative to the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "slider.group_sliderWidgetLabel": {
        "title": "Widget Label Typography",
        "description": "Font, size, and styling for the primary title heading on the slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "slider.group_sliderCaption": {
        "title": "Slider Caption Typography",
        "description": "Font styling for secondary labels and descriptive text beside the slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "slider.group_sliderValue": {
        "title": "Slider Value Typography",
        "description": "Font family, weight, and size for the numeric level readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "slider.group_sliderUnit": {
        "title": "Slider Unit Typography",
        "description": "Font styling for measurement units such as percent or degrees.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "switch.sendOffOnGroupDeselect": {
        "title": "Send Off on Group Deselect",
        "description": "Publishes an explicit off payload to this switch when deactivated by another button in its selection group.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "1-mode--behavior"
        }
    },
    "switch.pageTo": {
        "title": "Target Page Navigation",
        "description": "Canvas page number to jump to when this button is pressed.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "1-mode--behavior"
        }
    },
    "switch.urlTo": {
        "title": "Target URL Navigation",
        "description": "Web link or dashboard URL opened in browser when clicked.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "1-mode--behavior"
        }
    },
    "switch.extraOutputTopics": {
        "title": "Additional Output Topics",
        "description": "Publish simultaneous command payloads to multiple extra MQTT or Homey topics on a single click.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "2-linking-to-devices"
        }
    },
    "switch.scale": {
        "title": "Overall Scale Multiplier",
        "description": "Proportionally resizes switch toggle components and icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.contentAlign": {
        "title": "Button Content Alignment",
        "description": "Horizontal alignment for icons and labels inside the button card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonContentInset": {
        "title": "Button Content Inset",
        "description": "Padding in pixels between the button border and interior labels or icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbOutlineWidth": {
        "title": "Toggle Knob Outline Width",
        "description": "Thickness in pixels of the border around the sliding toggle knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbOutlineColor": {
        "title": "Toggle Knob Outline Color",
        "description": "Color of the border stroke bounding the sliding toggle knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbOutlineOpacity": {
        "title": "Toggle Knob Outline Opacity",
        "description": "Transparency percentage for the sliding knob outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbInnerGlow": {
        "title": "Toggle Knob Inner Glow",
        "description": "Adds a frosted glass rim highlight inside the sliding toggle knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbInnerGlowColor": {
        "title": "Toggle Knob Inner Glow Color",
        "description": "Highlight color for the inside edge glow on the toggle knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.thumbInnerGlowOpacity": {
        "title": "Toggle Knob Inner Glow Opacity",
        "description": "Intensity of the inner glow gradient on the sliding knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.backgroundOpacity": {
        "title": "Button Background Opacity",
        "description": "Transparency percentage for the button body background.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonBlur": {
        "title": "Button Frosted Blur",
        "description": "Backdrop blur strength applied behind translucent button cards.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.glowColor": {
        "title": "Button Glow Color",
        "description": "Color of the luminous outer halo cast when the switch is active.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.btnGlowRadius": {
        "title": "Button Glow Radius",
        "description": "Spread distance in pixels of the active switch outer glow.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.outlineWidth": {
        "title": "Button Outline Width",
        "description": "Thickness in pixels of the stroke bounding the switch button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.outlineColor": {
        "title": "Button Outline Color",
        "description": "Color for the button border stroke.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.outlineOpacity": {
        "title": "Button Outline Opacity",
        "description": "Transparency percentage for the button border stroke.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonInnerGlow": {
        "title": "Button Inner Glow",
        "description": "Adds a subtle inner highlight along the top inside rim of the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonInnerGlowColor": {
        "title": "Button Inner Glow Color",
        "description": "Color of the inside rim highlight on the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonInnerGlowOpacity": {
        "title": "Button Inner Glow Opacity",
        "description": "Intensity of the inner rim lighting gradient.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonLabelHint": {
        "title": "Button Label Hint",
        "description": "Controls hover tooltip behavior for button labels:\n• Disabled: Never displays a hover tooltip over the button label.\n• When Label Is Truncated: Shows a tooltip only when text exceeds button width and gets clipped.\n• Always: Always displays the full label text in a hover tooltip.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.showIcon": {
        "title": "Show Button Icon",
        "description": "Toggles whether an icon graphic is rendered on the switch button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.group_icon_style_iconSourceOn": {
        "title": "Active Icon Style",
        "description": "Icon symbol, color, and size displayed when the switch is in the on state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.group_icon_style_iconSourceOff": {
        "title": "Inactive Icon Style",
        "description": "Icon symbol and muted color displayed when the switch is in the off state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.buttonLabel": {
        "title": "Button Label",
        "description": "Primary text caption displayed on the button surface.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.buttonLabelPosition": {
        "title": "Button Label Position",
        "description": "Placement of the label text inside or outside the button card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.textOnlyLabelVerticalAlign": {
        "title": "Label Vertical Alignment",
        "description": "Vertical alignment for buttons configured in text-only mode.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.group_switchGroupLabel": {
        "title": "Widget Caption Typography",
        "description": "Font and color styling for the title heading above the switch widget.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.group_switchButtonOutsideLabel": {
        "title": "Outside Label Typography",
        "description": "Typography for button captions positioned outside the card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "switch.group_switchButtonInsideLabel": {
        "title": "Inside Label Typography",
        "description": "Typography for button labels rendered directly on the button face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch"
        }
    },
    "text.mdTableCustomColumnCount": {
        "title": "Custom Column Count",
        "description": "Number of custom columns configured in Markdown table layout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableColumnWidthPx": {
        "title": "Fixed Column Width",
        "description": "Uniform fixed column width in pixels. Set to 0 for automatic proportional width.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableCustomColumnWidths": {
        "title": "Per-Column Custom Widths",
        "description": "Comma-separated list of individual pixel column widths for Markdown tables.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdIconColor": {
        "title": "Markdown Icon Color",
        "description": "Color for inline icons embedded within Markdown text blocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdIconOpacity": {
        "title": "Markdown Icon Opacity",
        "description": "Transparency percentage for inline Markdown icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdIconAccentColor": {
        "title": "Markdown Icon Accent Color",
        "description": "Accent highlight color for secondary details on two-tone Markdown icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdIconAccentOpacity": {
        "title": "Markdown Icon Accent Opacity",
        "description": "Transparency percentage for the two-tone accent on inline Markdown icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableBorderColor": {
        "title": "Table Border Color",
        "description": "Stroke color bounding Markdown table cells and grids.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableBorderOpacity": {
        "title": "Table Border Opacity",
        "description": "Transparency percentage of the table cell borders.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdSeparatorColor": {
        "title": "Separator Line Color",
        "description": "Color for horizontal divider lines separating Markdown content sections.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdSeparatorOpacity": {
        "title": "Separator Line Opacity",
        "description": "Transparency percentage for horizontal separator lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableHeaderBg": {
        "title": "Table Header Background",
        "description": "Fill color for the header row at the top of Markdown tables.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableHeaderBgOpacity": {
        "title": "Table Header Opacity",
        "description": "Transparency percentage of the table header row background.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableHeaderAccentBg": {
        "title": "Table Header Accent Background",
        "description": "Accent color for highlighted or alternating header cells.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableHeaderAccentBgOpacity": {
        "title": "Table Header Accent Opacity",
        "description": "Transparency percentage of the table header accent fill.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableRowBg": {
        "title": "Table Row Background",
        "description": "Primary background fill color for standard Markdown table rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableRowBgOpacity": {
        "title": "Table Row Opacity",
        "description": "Transparency percentage for standard table row backgrounds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableRowAltBg": {
        "title": "Table Alternate Row Background",
        "description": "Secondary background color for alternating zebra-striped table rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdTableRowAltBgOpacity": {
        "title": "Table Alternate Row Opacity",
        "description": "Transparency percentage for alternating zebra rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdHrColor": {
        "title": "Horizontal Rule Color",
        "description": "Color for thematic break lines created with triple dashes in Markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdHrOpacity": {
        "title": "Horizontal Rule Opacity",
        "description": "Transparency percentage for horizontal rule lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdBlock1Color": {
        "title": "Block 1 Accent Color",
        "description": "Theme color applied to Markdown block container 1.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdBlock2Color": {
        "title": "Block 2 Accent Color",
        "description": "Theme color applied to Markdown block container 2.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdBlock3Color": {
        "title": "Block 3 Accent Color",
        "description": "Theme color applied to Markdown block container 3.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.mdBlock4Color": {
        "title": "Block 4 Accent Color",
        "description": "Theme color applied to Markdown block container 4.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textScroll": {
        "title": "Continuous Text Marquee",
        "description": "Controls continuous text animation:\n• None: Keeps text stationary within the widget container.\n• Horizontal: Scrolls overflowing text horizontally like a news marquee ticker.\n• Vertical: Scrolls multi-line text upward continuously like a teleprompter.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "animations--effects"
        }
    },
    "text.textScrollOverflowOnly": {
        "title": "Scroll Only on Overflow",
        "description": "Scrolls the marquee only when text exceeds the visible widget boundary.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "animations--effects"
        }
    },
    "text.dropShadowOpacity": {
        "title": "Drop Shadow Opacity",
        "description": "Transparency percentage for text drop shadows enhancing contrast over wallpapers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text"
        }
    },
    "text.group_textWidgetLabel": {
        "title": "Widget Caption Typography",
        "description": "Font, size, and styling for the primary title heading on the text widget.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdPara": {
        "title": "Paragraph Typography",
        "description": "Font family, size, line spacing, and color for standard body paragraphs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdH1": {
        "title": "Header 1 Typography",
        "description": "Font styling for primary top-level headings in Markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdH2": {
        "title": "Header 2 Typography",
        "description": "Font styling for secondary section headings in Markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdH3": {
        "title": "Header 3 Typography",
        "description": "Font styling for tertiary subheadings in Markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdTh": {
        "title": "Table Header Typography",
        "description": "Font, weight, and color for Markdown table header cells.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdTd": {
        "title": "Table Body Typography",
        "description": "Font styling for standard data cells inside Markdown tables.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdBlockTypography": {
        "title": "Block Typography",
        "description": "Typography for stylized container blocks and callout boxes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "text.group_textMdCode": {
        "title": "Monospace Code Typography",
        "description": "Monospace font styling for inline code tags and code blocks.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "3-text--typography"
        }
    },
    "menu.menuIconLoc": {
        "title": "Icon Location",
        "description": "Place the menu item icon to the left, right, top, or center of the button text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuItemWidth": {
        "title": "Menu Item Width",
        "description": "Fixed width in pixels for each menu button. Set to 0 for automatic width based on contents.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.menuItemHeight": {
        "title": "Menu Item Height",
        "description": "Fixed height in pixels for each menu button. Set to 0 for automatic height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.itemSpacing": {
        "title": "Menu Button Spacing",
        "description": "Gap in pixels separating adjacent menu navigation buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.itemCornerRadius": {
        "title": "Menu Button Corner Radius",
        "description": "Corner rounding for individual menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "1-menu-behavior"
        }
    },
    "menu.itemBgOn": {
        "title": "Item Background (On)",
        "description": "Background fill color for menu items currently in an active or selected state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBgOnOpacity": {
        "title": "Item Background Opacity (On)",
        "description": "Transparency percentage for active menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBgOff": {
        "title": "Item Background (Off)",
        "description": "Default background fill color for inactive unselected menu buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBgOffOpacity": {
        "title": "Item Background Opacity (Off)",
        "description": "Transparency percentage for inactive menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBgHover": {
        "title": "Item Hover Background",
        "description": "Highlight color applied when hovering the mouse over a menu button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBgHoverOpacity": {
        "title": "Item Hover Opacity",
        "description": "Transparency percentage of the menu item button hover color.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemBlur": {
        "title": "Item Background Blur",
        "description": "Frosted glass backdrop blur applied behind individual menu buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemOutlineWidth": {
        "title": "Item Outline Width",
        "description": "Border stroke thickness in pixels for menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemOutlineColor": {
        "title": "Item Outline Color",
        "description": "Color of the border stroke surrounding each menu button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemOutlineOpacity": {
        "title": "Item Outline Opacity",
        "description": "Transparency percentage of the menu button border outline.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemInnerGlow": {
        "title": "Item Inner Glow",
        "description": "Adds a subtle inner glass bevel highlight around menu item edges.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemInnerGlowColor": {
        "title": "Item Inner Glow Color",
        "description": "Color for the inner light reflection inside menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.itemInnerGlowOpacity": {
        "title": "Item Inner Glow Opacity",
        "description": "Intensity of the inner glow gradient on menu buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.iconColOn": {
        "title": "Icon Color (On)",
        "description": "Color of the icon graphic when this menu item is active.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.iconColOff": {
        "title": "Icon Color (Off)",
        "description": "Color of the icon graphic when this menu item is inactive.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.iconAccentOn": {
        "title": "Icon Accent Color (On)",
        "description": "Secondary accent tint for two-tone icons in the active state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.iconAccentOff": {
        "title": "Icon Accent Color (Off)",
        "description": "Secondary accent tint for two-tone icons in the inactive state.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.iconSize": {
        "title": "Menu Icon Size",
        "description": "Base icon dimension in pixels across all menu item buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuSeparatorShowLine": {
        "title": "Show Separator Line",
        "description": "Draw a thin dividing rule inside menu divider sections.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuSeparatorLineColor": {
        "title": "Separator Line Color",
        "description": "Color of the horizontal or vertical dividing rule between menu sections.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.menuSeparatorGap": {
        "title": "Separator Gap",
        "description": "Spacing in pixels around menu separator dividing lines.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuLabel": {
        "title": "Widget Caption Typography",
        "description": "Font, size, and styling for the primary title heading above the menu.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "menu.group_menuItem": {
        "title": "Menu Item Typography",
        "description": "Font family, size, and styling for the primary title on menu buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance--text--typography"
        }
    },
    "slider.value": {
        "title": "Slider Value",
        "description": "Default level percentage or sensor state when not driven by a live topic.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.customDisplayRange": {
        "title": "Custom Display Range",
        "description": "Remap raw sensor numbers to a custom scale, such as 15 to 25 degrees for a thermostat.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.displayMin": {
        "title": "Display Minimum",
        "description": "Lower numeric bound represented at the far left or bottom of the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.displayMax": {
        "title": "Display Maximum",
        "description": "Upper numeric bound represented at the far right or top of the slider track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.displayDecimalPlaces": {
        "title": "Display Decimal Places",
        "description": "Number of decimal places shown on the slider value label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.displayKeepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Preserve fixed decimal formatting so 20.0 does not collapse to 20.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.trackBlur": {
        "title": "Track Frosted Blur",
        "description": "Frosted glass backdrop blur applied behind the slider track groove.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.widgetLabel": {
        "title": "Widget Label Text",
        "description": "Title text displayed above the slider indicating what device or setting it controls.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "slider.labelLocation": {
        "title": "Slider Label Location",
        "description": "Placement of the title caption above, below, or inside the slider frame.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text--typography"
        }
    },
    "theme-corrections": {
        "title": "Theme Corrections",
        "description": "Fine-tune color tone, saturation intensity, contrast, and brightness across your active theme.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "theme-corrections-reset": {
        "title": "Reset Theme Corrections",
        "description": "Reset color tone, intensity, contrast, and brightness adjustments back to center default values.",
        "help": null
    },
    "theme-color-tone": {
        "title": "Color Tone",
        "description": "Rotate every theme color around the color wheel from minus 180 to plus 180 degrees. Zero keeps the current palette.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "theme-color-intensity": {
        "title": "Color Intensity",
        "description": "Scale color saturation from 0% monochrome to 200% vivid color. 100% keeps current theme palette intensity.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "theme-brightness": {
        "title": "Brightness",
        "description": "Scale overall theme lightness from 0% to 200%. 100% keeps current theme palette values intact.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "theme-contrast": {
        "title": "Contrast",
        "description": "Spread dark theme colors darker and light theme colors lighter from 0% to 200%. 100% preserves normal theme contrast.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "theme-reset-defaults-to-theme": {
        "title": "Reset Defaults to Theme",
        "description": "Restore all widget default colors to match active theme tokens without modifying per-widget customizations.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "14-theme-colors"
        }
    },
    "widget-presets": {
        "title": "Widget Presets",
        "description": "Apply pre-configured appearance and behavior styles designed for this widget type, or cycle through style variants.",
        "help": {
            "topic": "Widgets"
        }
    },
    "widget-presets-prev": {
        "title": "Previous Preset",
        "description": "Load the previous main preset style for the currently selected widget.",
        "help": null
    },
    "widget-presets-next": {
        "title": "Next Preset",
        "description": "Load the next main preset style for the currently selected widget.",
        "help": null
    },
    "widget-presets-menu": {
        "title": "Preset Menu",
        "description": "Open the preset selection menu to pick a pre-made design for this widget.",
        "help": {
            "topic": "Widgets"
        }
    },
    "widget-presets-sub-prev": {
        "title": "Previous Sub-Preset",
        "description": "Load the previous variation or sub-preset for the current widget design.",
        "help": null
    },
    "widget-presets-sub-next": {
        "title": "Next Sub-Preset",
        "description": "Load the next variation or sub-preset for the current widget design.",
        "help": null
    },
    "widget-presets-sub-menu": {
        "title": "Sub-Preset Menu",
        "description": "Select an alternative colorway or layout variation for this preset.",
        "help": null
    },
    "widget-presets-save": {
        "title": "Save Preset",
        "description": "Save current widget settings as a reusable preset on Homey for future dashboards.",
        "help": null
    },
    "widget-presets-export": {
        "title": "Export Preset",
        "description": "Export current widget settings to a local preset JSON file to share or back up.",
        "help": null
    },
    "widget-presets-import": {
        "title": "Import Preset",
        "description": "Import widget settings from a local preset file to apply to this widget.",
        "help": null
    },
    "widget-presets-reset": {
        "title": "Reset to Default",
        "description": "Reset style and behavior settings on this widget back to factory defaults.",
        "help": null
    },
    "widget-defaults-reset": {
        "title": "Reset Widget Defaults",
        "description": "Restore all widget master default values to factory settings without altering platform or connection settings.",
        "help": null
    },
    "topic-monitor-dialog": {
        "title": "Topic Monitor",
        "description": "Open the real-time MQTT and smart home topic monitor to inspect incoming device telemetry and state changes.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "10-data-stream-explorer"
        }
    },
    "topic-monitor-clear": {
        "title": "Clear Topic History",
        "description": "Clear recorded topic messages and activity log from the live monitor list.",
        "help": null
    },
    "topic-monitor-copy-all": {
        "title": "Copy All Topics",
        "description": "Copy every discovered topic and entity name to the clipboard for quick pasting into widget data fields.",
        "help": null
    },
    "topic-monitor-advanced-explorer": {
        "title": "Advanced Explorer",
        "description": "Open deep topic intelligence and system statistics to analyze message frequency and device payloads.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "10-data-stream-explorer"
        }
    },
    "topic-monitor-filter": {
        "title": "Filter Topics",
        "description": "Filter the list of captured smart home topics by typing keyword or entity names.",
        "help": null
    },
    "button.bind": {
        "title": "Data Binding",
        "description": "Connect this setting to a live smart home topic or entity from Homey, Home Assistant, or MQTT so it updates in real time.",
        "help": {
            "topic": "Connecting Widgets & Data (Topics)",
            "anchor": "binding-in-the-editor"
        }
    },
    "button.reset": {
        "title": "Reset to Default",
        "description": "Revert this setting back to its standard value or active theme preset.",
        "help": null
    },
    "button.color-picker": {
        "title": "Color Picker",
        "description": "Open the color palette and picker to customize this color or select a theme token.",
        "help": {
            "topic": "Data Types & Formats",
            "widgetSub": "colors",
            "anchor": "theme-tokens"
        }
    },
    "btn-gallery": {
        "title": "Image Gallery",
        "description": "Open Image Gallery to upload, manage, and copy image file paths for background and icon widgets.",
        "help": {
            "topic": "Image Gallery Manager",
            "anchor": "opening-the-gallery"
        }
    },
    "btn-audio-gallery": {
        "title": "Audio Gallery",
        "description": "Open Audio Gallery to upload, preview, and assign audio alert sounds to widgets.",
        "help": {
            "topic": "Audio Gallery"
        }
    },
    "btn-share": {
        "title": "Share Snippet",
        "description": "Export or import reusable widget snippets and component configurations as portable text code.",
        "help": null
    },
    "share-export-snippet": {
        "title": "Export Snippet",
        "description": "Export the selected widget and its configuration as a text snippet to share with others.",
        "help": null
    },
    "share-import-snippet": {
        "title": "Import Snippet",
        "description": "Import a widget snippet from clipboard code directly into the active dashboard canvas.",
        "help": null
    },
    "btn-tools": {
        "title": "Editor Tools",
        "description": "Access automated dashboard scripts, batch helpers, alignment utilities, and diagnostic tools.",
        "help": {
            "topic": "Tools"
        }
    },
    "btn-theme-toggle": {
        "title": "Editor Theme",
        "description": "Switch editor panels between dark mode, light mode, or automatic mode matching your canvas background.",
        "help": null
    },
    "btn-help": {
        "title": "Documentation",
        "description": "Open the interactive Dashboard Studio documentation guide with widget guides and keyboard shortcuts.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "2-editor-tools"
        }
    },
    "editor-zoom-reset": {
        "title": "Reset Zoom",
        "description": "Reset editor canvas magnification back to 100% normal view.",
        "help": null
    },
    "btn-copy-viewer-url": {
        "title": "Copy Viewer URL",
        "description": "Copy the clean fullscreen dashboard viewer web link directly to your clipboard.",
        "help": null
    },
    "dashboard-save-homey": {
        "title": "Save to Homey",
        "description": "Persist the current dashboard layout and widget configurations directly to Homey storage.",
        "help": null
    },
    "dashboard-load-homey": {
        "title": "Load from Homey",
        "description": "Load a previously saved dashboard layout and widgets from Homey storage.",
        "help": null
    },
    "dashboard-export": {
        "title": "Export Dashboard",
        "description": "Save and download the full dashboard layout, widgets, and settings as a local JSON file.",
        "help": null
    },
    "dashboard-import": {
        "title": "Import Dashboard",
        "description": "Restore a dashboard layout and widgets from a local JSON backup file.",
        "help": null
    },
    "btn-reset-canvas": {
        "title": "Clear Canvas",
        "description": "Remove all widgets and reset canvas settings to start a completely fresh dashboard layout.",
        "help": null
    },
    "theme-prev": {
        "title": "Previous Theme",
        "description": "Switch to the previous installed theme palette in the list.",
        "help": null
    },
    "template-select-btn": {
        "title": "Theme Selector",
        "description": "Open dropdown list of installed themes to choose an overall color palette.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "toolbar-theme-controls"
        }
    },
    "theme-next": {
        "title": "Next Theme",
        "description": "Switch to the next installed theme palette in the list.",
        "help": null
    },
    "theme-explorer-btn": {
        "title": "Theme Explorer",
        "description": "Browse visual live previews of installed themes and color schemes before selecting one.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "the-theme-explorer-gallery"
        }
    },
    "theme-save": {
        "title": "Save Theme",
        "description": "Save your customized theme palette directly to server storage for future use.",
        "help": null
    },
    "theme-export": {
        "title": "Export Theme",
        "description": "Export the active theme palette to a local JSON file to share or archive.",
        "help": null
    },
    "theme-import": {
        "title": "Import Theme",
        "description": "Import a custom theme file from disk and add it to your available theme options.",
        "help": null
    },
    "theme-delete": {
        "title": "Delete Theme",
        "description": "Delete the selected custom theme from the system.",
        "help": null
    },
    "add-widget-select-btn": {
        "title": "Widget Type Selector",
        "description": "Choose which type of widget to create and place onto your dashboard.",
        "help": {
            "topic": "Widgets"
        }
    },
    "btn-add-widget": {
        "title": "Add Widget",
        "description": "Spawn the selected widget type directly onto the canvas at default position.",
        "help": {
            "topic": "Widgets"
        }
    },
    "widget-select-btn": {
        "title": "Widget Selection List",
        "description": "Open dropdown of all canvas widgets to quickly jump to and focus on any specific widget.",
        "help": null
    },
    "reset-all-colors": {
        "title": "Reset All Colors",
        "description": "Reset all widget color overrides across the dashboard back to current theme defaults.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "6-selected-widget-tools"
        }
    },
    "move-to-page": {
        "title": "Move to Page",
        "description": "Move the selected widget or widgets to another dashboard page or display on all pages.",
        "help": null
    },
    "toolbar-btn-copy": {
        "title": "Copy Widget",
        "description": "Copy selected widget configuration to clipboard so you can paste it on any page.",
        "help": null
    },
    "toolbar-btn-cut": {
        "title": "Cut Widget",
        "description": "Cut selected widget from canvas into clipboard to move it to another location or page.",
        "help": null
    },
    "toolbar-btn-paste": {
        "title": "Paste Widget",
        "description": "Paste copied widget from clipboard onto current canvas page.",
        "help": null
    },
    "btn-group-create": {
        "title": "Group Widgets",
        "description": "Group selected widgets together into a container so they can be moved and scaled as one unit.",
        "help": null
    },
    "btn-group-ungroup": {
        "title": "Ungroup Widgets",
        "description": "Break apart the selected group container and keep all individual member widgets on the canvas.",
        "help": null
    },
    "btn-group-open": {
        "title": "Open Group",
        "description": "Focus directly inside the selected group container to edit its internal widgets.",
        "help": null
    },
    "page-insert": {
        "title": "Insert Page",
        "description": "Create and insert a new blank dashboard page at a chosen position in the page sequence.",
        "help": null
    },
    "page-delete": {
        "title": "Delete Page",
        "description": "Remove an empty dashboard page from the sequence.",
        "help": null
    },
    "page-prev": {
        "title": "Previous Page",
        "description": "Navigate canvas view to the previous dashboard page.",
        "help": null
    },
    "page-indicator": {
        "title": "Current Page",
        "description": "Displays the active dashboard page number currently shown in the editor.",
        "help": null
    },
    "page-next": {
        "title": "Next Page",
        "description": "Navigate canvas view to the next dashboard page.",
        "help": null
    },
    "toggle-all-groups": {
        "title": "Collapse or Expand Groups",
        "description": "Quickly toggle all property accordion groups in the inspector open or closed at once.",
        "help": null
    },
    "fab-mode-switch": {
        "title": "Toggle Edit Mode",
        "description": "Switch between live interactive dashboard view and editing mode.",
        "help": null
    },
    "menu.menuLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title above the menu.",
        "help": null
    },
    "menu.menuLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title above the menu, in pixels.",
        "help": null
    },
    "menu.menuLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title above the menu.",
        "help": null
    },
    "menu.menuLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title above the menu, such as uppercase or as typed.",
        "help": null
    },
    "menu.menuLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title above the menu in a heavier weight.",
        "help": null
    },
    "menu.menuLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title above the menu in italic.",
        "help": null
    },
    "menu.menuLabelCol": {
        "title": "Color",
        "description": "Color of the optional title above the menu.",
        "help": null
    },
    "menu.menuLabelOpacity": {
        "title": "Opacity",
        "description": "How solid the optional title above the menu looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "menu.menuLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title above the menu left or right, in pixels. Negative values move left.",
        "help": null
    },
    "menu.menuLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title above the menu up or down, in pixels. Negative values move up.",
        "help": null
    },
    "menu.menuItemFont": {
        "title": "Font",
        "description": "Font used for each menu item.",
        "help": null
    },
    "menu.menuItemFs": {
        "title": "Font Size",
        "description": "Text size for each menu item, in pixels.",
        "help": null
    },
    "menu.menuItemAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of each menu item.",
        "help": null
    },
    "menu.menuItemCase": {
        "title": "Case",
        "description": "Letter case for each menu item, such as uppercase or as typed.",
        "help": null
    },
    "menu.menuItemBold": {
        "title": "Bold",
        "description": "Draw each menu item in a heavier weight.",
        "help": null
    },
    "menu.menuItemItalic": {
        "title": "Italic",
        "description": "Draw each menu item in italic.",
        "help": null
    },
    "menu.menuItemCol": {
        "title": "Color (On)",
        "description": "Color of each menu item while that part is on.",
        "help": null
    },
    "menu.menuItemOpacity": {
        "title": "Opacity",
        "description": "How solid each menu item looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "menu.menuItemOffX": {
        "title": "Offset X",
        "description": "Nudges each menu item left or right, in pixels. Negative values move left.",
        "help": null
    },
    "menu.menuItemOffY": {
        "title": "Offset Y",
        "description": "Nudges each menu item up or down, in pixels. Negative values move up.",
        "help": null
    },
    "menu.menuItemColOff": {
        "title": "Color (Off)",
        "description": "Color of each menu item while that part is off.",
        "help": null
    },
    "menu.menuDefaultItemFont": {
        "title": "Font",
        "description": "Font used for each menu item.",
        "help": null
    },
    "menu.menuDefaultItemFs": {
        "title": "Font Size",
        "description": "Text size for each menu item, in pixels.",
        "help": null
    },
    "menu.menuDefaultItemAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of each menu item.",
        "help": null
    },
    "menu.menuDefaultItemCase": {
        "title": "Case",
        "description": "Letter case for each menu item, such as uppercase or as typed.",
        "help": null
    },
    "menu.menuDefaultItemBold": {
        "title": "Bold",
        "description": "Draw each menu item in a heavier weight.",
        "help": null
    },
    "menu.menuDefaultItemItalic": {
        "title": "Italic",
        "description": "Draw each menu item in italic.",
        "help": null
    },
    "menu.menuDefaultItemCol": {
        "title": "Color (On)",
        "description": "Color of each menu item while that part is on.",
        "help": null
    },
    "menu.menuDefaultItemOpacity": {
        "title": "Opacity",
        "description": "How solid each menu item looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "menu.menuDefaultItemOffX": {
        "title": "Offset X",
        "description": "Nudges each menu item left or right, in pixels. Negative values move left.",
        "help": null
    },
    "menu.menuDefaultItemOffY": {
        "title": "Offset Y",
        "description": "Nudges each menu item up or down, in pixels. Negative values move up.",
        "help": null
    },
    "menu.menuDefaultItemColOff": {
        "title": "Color (Off)",
        "description": "Color of each menu item while that part is off.",
        "help": null
    },
    "menu.group_menuDefaultItem": {
        "title": "Typography",
        "description": "Font, size, color, and placement for each menu item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "switch.switchGroupLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title above the switch.",
        "help": null
    },
    "switch.switchGroupLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title above the switch, in pixels.",
        "help": null
    },
    "switch.switchGroupLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title above the switch.",
        "help": null
    },
    "switch.switchGroupLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title above the switch, such as uppercase or as typed.",
        "help": null
    },
    "switch.switchGroupLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title above the switch in a heavier weight.",
        "help": null
    },
    "switch.switchGroupLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title above the switch in italic.",
        "help": null
    },
    "switch.switchGroupLabelCol": {
        "title": "Color",
        "description": "Color of the optional title above the switch.",
        "help": null
    },
    "switch.switchGroupLabelOpacity": {
        "title": "Opacity",
        "description": "How solid the optional title above the switch looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "switch.switchGroupLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title above the switch left or right, in pixels. Negative values move left.",
        "help": null
    },
    "switch.switchGroupLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title above the switch up or down, in pixels. Negative values move up.",
        "help": null
    },
    "switch.switchButtonOutsideLabelFont": {
        "title": "Font",
        "description": "Font used for the caption sitting outside the button.",
        "help": null
    },
    "switch.switchButtonOutsideLabelFs": {
        "title": "Font Size",
        "description": "Text size for the caption sitting outside the button, in pixels.",
        "help": null
    },
    "switch.switchButtonOutsideLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption sitting outside the button.",
        "help": null
    },
    "switch.switchButtonOutsideLabelCase": {
        "title": "Case",
        "description": "Letter case for the caption sitting outside the button, such as uppercase or as typed.",
        "help": null
    },
    "switch.switchButtonOutsideLabelBold": {
        "title": "Bold",
        "description": "Draw the caption sitting outside the button in a heavier weight.",
        "help": null
    },
    "switch.switchButtonOutsideLabelItalic": {
        "title": "Italic",
        "description": "Draw the caption sitting outside the button in italic.",
        "help": null
    },
    "switch.switchButtonOutsideLabelCol": {
        "title": "Color (On)",
        "description": "Color of the caption sitting outside the button while that part is on.",
        "help": null
    },
    "switch.switchButtonOutsideLabelOpacity": {
        "title": "Opacity",
        "description": "How solid the caption sitting outside the button looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "switch.switchButtonOutsideLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the caption sitting outside the button left or right, in pixels. Negative values move left.",
        "help": null
    },
    "switch.switchButtonOutsideLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption sitting outside the button up or down, in pixels. Negative values move up.",
        "help": null
    },
    "switch.switchButtonOutsideLabelColOff": {
        "title": "Color (Off)",
        "description": "Color of the caption sitting outside the button while that part is off.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultFont": {
        "title": "Font",
        "description": "Font used for the caption sitting outside the button.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultFs": {
        "title": "Font Size",
        "description": "Text size for the caption sitting outside the button, in pixels.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption sitting outside the button.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultCase": {
        "title": "Case",
        "description": "Letter case for the caption sitting outside the button, such as uppercase or as typed.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultBold": {
        "title": "Bold",
        "description": "Draw the caption sitting outside the button in a heavier weight.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultItalic": {
        "title": "Italic",
        "description": "Draw the caption sitting outside the button in italic.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultCol": {
        "title": "Color (On)",
        "description": "Color of the caption sitting outside the button while that part is on.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultOpacity": {
        "title": "Opacity",
        "description": "How solid the caption sitting outside the button looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultOffX": {
        "title": "Offset X",
        "description": "Nudges the caption sitting outside the button left or right, in pixels. Negative values move left.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption sitting outside the button up or down, in pixels. Negative values move up.",
        "help": null
    },
    "switch.switchButtonOutsideDefaultColOff": {
        "title": "Color (Off)",
        "description": "Color of the caption sitting outside the button while that part is off.",
        "help": null
    },
    "switch.group_switchButtonOutsideDefault": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the caption sitting outside the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "6-text-typography"
        }
    },
    "switch.switchButtonInsideLabelFont": {
        "title": "Font",
        "description": "Font used for the caption sitting inside the button.",
        "help": null
    },
    "switch.switchButtonInsideLabelFs": {
        "title": "Font Size",
        "description": "Text size for the caption sitting inside the button, in pixels.",
        "help": null
    },
    "switch.switchButtonInsideLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption sitting inside the button.",
        "help": null
    },
    "switch.switchButtonInsideLabelCase": {
        "title": "Case",
        "description": "Letter case for the caption sitting inside the button, such as uppercase or as typed.",
        "help": null
    },
    "switch.switchButtonInsideLabelBold": {
        "title": "Bold",
        "description": "Draw the caption sitting inside the button in a heavier weight.",
        "help": null
    },
    "switch.switchButtonInsideLabelItalic": {
        "title": "Italic",
        "description": "Draw the caption sitting inside the button in italic.",
        "help": null
    },
    "switch.switchButtonInsideLabelCol": {
        "title": "Color (On)",
        "description": "Color of the caption sitting inside the button while that part is on.",
        "help": null
    },
    "switch.switchButtonInsideLabelOpacity": {
        "title": "Opacity",
        "description": "How solid the caption sitting inside the button looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "switch.switchButtonInsideLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the caption sitting inside the button left or right, in pixels. Negative values move left.",
        "help": null
    },
    "switch.switchButtonInsideLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption sitting inside the button up or down, in pixels. Negative values move up.",
        "help": null
    },
    "switch.switchButtonInsideLabelColOff": {
        "title": "Color (Off)",
        "description": "Color of the caption sitting inside the button while that part is off.",
        "help": null
    },
    "switch.switchButtonInsideDefaultFont": {
        "title": "Font",
        "description": "Font used for the caption sitting inside the button.",
        "help": null
    },
    "switch.switchButtonInsideDefaultFs": {
        "title": "Font Size",
        "description": "Text size for the caption sitting inside the button, in pixels.",
        "help": null
    },
    "switch.switchButtonInsideDefaultAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption sitting inside the button.",
        "help": null
    },
    "switch.switchButtonInsideDefaultCase": {
        "title": "Case",
        "description": "Letter case for the caption sitting inside the button, such as uppercase or as typed.",
        "help": null
    },
    "switch.switchButtonInsideDefaultBold": {
        "title": "Bold",
        "description": "Draw the caption sitting inside the button in a heavier weight.",
        "help": null
    },
    "switch.switchButtonInsideDefaultItalic": {
        "title": "Italic",
        "description": "Draw the caption sitting inside the button in italic.",
        "help": null
    },
    "switch.switchButtonInsideDefaultCol": {
        "title": "Color (On)",
        "description": "Color of the caption sitting inside the button while that part is on.",
        "help": null
    },
    "switch.switchButtonInsideDefaultOpacity": {
        "title": "Opacity",
        "description": "How solid the caption sitting inside the button looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "switch.switchButtonInsideDefaultOffX": {
        "title": "Offset X",
        "description": "Nudges the caption sitting inside the button left or right, in pixels. Negative values move left.",
        "help": null
    },
    "switch.switchButtonInsideDefaultOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption sitting inside the button up or down, in pixels. Negative values move up.",
        "help": null
    },
    "switch.switchButtonInsideDefaultColOff": {
        "title": "Color (Off)",
        "description": "Color of the caption sitting inside the button while that part is off.",
        "help": null
    },
    "switch.group_switchButtonInsideDefault": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the caption sitting inside the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "6-text-typography"
        }
    },
    "slider.sliderWidgetLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the slider.",
        "help": null
    },
    "slider.sliderWidgetLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the slider, in pixels.",
        "help": null
    },
    "slider.sliderWidgetLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the slider.",
        "help": null
    },
    "slider.sliderWidgetLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the slider, such as uppercase or as typed.",
        "help": null
    },
    "slider.sliderWidgetLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the slider in a heavier weight.",
        "help": null
    },
    "slider.sliderWidgetLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the slider in italic.",
        "help": null
    },
    "slider.sliderWidgetLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the slider.",
        "help": null
    },
    "slider.sliderWidgetLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the slider left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.sliderWidgetLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the slider up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the slider.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the slider, in pixels.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the slider.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the slider, such as uppercase or as typed.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the slider in a heavier weight.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the slider in italic.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the slider.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the slider left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.defaultSliderWidgetLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the slider up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.group_defaultSliderWidgetLabel": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the optional title on the slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "slider.sliderCaptionFont": {
        "title": "Font",
        "description": "Font used for the slider caption.",
        "help": null
    },
    "slider.sliderCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the slider caption, in pixels.",
        "help": null
    },
    "slider.sliderCaptionCase": {
        "title": "Case",
        "description": "Letter case for the slider caption, such as uppercase or as typed.",
        "help": null
    },
    "slider.sliderCaptionBold": {
        "title": "Bold",
        "description": "Draw the slider caption in a heavier weight.",
        "help": null
    },
    "slider.sliderCaptionItalic": {
        "title": "Italic",
        "description": "Draw the slider caption in italic.",
        "help": null
    },
    "slider.sliderCaptionCol": {
        "title": "Color",
        "description": "Color of the slider caption.",
        "help": null
    },
    "slider.sliderCaptionOpacity": {
        "title": "Opacity",
        "description": "How solid the slider caption looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "slider.sliderCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the slider caption left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.sliderCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the slider caption up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.defaultSliderCaptionFont": {
        "title": "Font",
        "description": "Font used for the slider caption.",
        "help": null
    },
    "slider.defaultSliderCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the slider caption, in pixels.",
        "help": null
    },
    "slider.defaultSliderCaptionCase": {
        "title": "Case",
        "description": "Letter case for the slider caption, such as uppercase or as typed.",
        "help": null
    },
    "slider.defaultSliderCaptionBold": {
        "title": "Bold",
        "description": "Draw the slider caption in a heavier weight.",
        "help": null
    },
    "slider.defaultSliderCaptionCol": {
        "title": "Color",
        "description": "Color of the slider caption.",
        "help": null
    },
    "slider.defaultSliderCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the slider caption left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.defaultSliderCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the slider caption up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.group_defaultSliderCaption": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the slider caption.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "slider.sliderValueFont": {
        "title": "Font",
        "description": "Font used for the number on the slider.",
        "help": null
    },
    "slider.sliderValueFs": {
        "title": "Font Size",
        "description": "Text size for the number on the slider, in pixels.",
        "help": null
    },
    "slider.sliderValueAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the number on the slider.",
        "help": null
    },
    "slider.sliderValueBold": {
        "title": "Bold",
        "description": "Draw the number on the slider in a heavier weight.",
        "help": null
    },
    "slider.sliderValueItalic": {
        "title": "Italic",
        "description": "Draw the number on the slider in italic.",
        "help": null
    },
    "slider.sliderValueCol": {
        "title": "Color",
        "description": "Color of the number on the slider.",
        "help": null
    },
    "slider.sliderValueOpacity": {
        "title": "Opacity",
        "description": "How solid the number on the slider looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "slider.sliderValueOffX": {
        "title": "Offset X",
        "description": "Nudges the number on the slider left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.sliderValueOffY": {
        "title": "Offset Y",
        "description": "Nudges the number on the slider up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.defaultSliderValueFont": {
        "title": "Font",
        "description": "Font used for the number on the slider.",
        "help": null
    },
    "slider.defaultSliderValueFs": {
        "title": "Font Size",
        "description": "Text size for the number on the slider, in pixels.",
        "help": null
    },
    "slider.defaultSliderValueAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the number on the slider.",
        "help": null
    },
    "slider.defaultSliderValueBold": {
        "title": "Bold",
        "description": "Draw the number on the slider in a heavier weight.",
        "help": null
    },
    "slider.defaultSliderValueCol": {
        "title": "Color",
        "description": "Color of the number on the slider.",
        "help": null
    },
    "slider.defaultSliderValueOffX": {
        "title": "Offset X",
        "description": "Nudges the number on the slider left or right, in pixels. Negative values move left.",
        "help": null
    },
    "slider.defaultSliderValueOffY": {
        "title": "Offset Y",
        "description": "Nudges the number on the slider up or down, in pixels. Negative values move up.",
        "help": null
    },
    "slider.group_defaultSliderValue": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the number on the slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "slider.sliderUnitFont": {
        "title": "Font",
        "description": "Font used for the unit next to the slider value.",
        "help": null
    },
    "slider.sliderUnitFs": {
        "title": "Font Size",
        "description": "Text size for the unit next to the slider value, in pixels.",
        "help": null
    },
    "slider.sliderUnitBold": {
        "title": "Bold",
        "description": "Draw the unit next to the slider value in a heavier weight.",
        "help": null
    },
    "slider.sliderUnitItalic": {
        "title": "Italic",
        "description": "Draw the unit next to the slider value in italic.",
        "help": null
    },
    "slider.sliderUnitCol": {
        "title": "Color",
        "description": "Color of the unit next to the slider value.",
        "help": null
    },
    "slider.sliderUnitOpacity": {
        "title": "Opacity",
        "description": "How solid the unit next to the slider value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "slider.defaultSliderUnitFont": {
        "title": "Font",
        "description": "Font used for the unit next to the slider value.",
        "help": null
    },
    "slider.defaultSliderUnitFs": {
        "title": "Font Size",
        "description": "Text size for the unit next to the slider value, in pixels.",
        "help": null
    },
    "slider.defaultSliderUnitBold": {
        "title": "Bold",
        "description": "Draw the unit next to the slider value in a heavier weight.",
        "help": null
    },
    "slider.defaultSliderUnitItalic": {
        "title": "Italic",
        "description": "Draw the unit next to the slider value in italic.",
        "help": null
    },
    "slider.defaultSliderUnitCol": {
        "title": "Color",
        "description": "Color of the unit next to the slider value.",
        "help": null
    },
    "slider.defaultSliderUnitOpacity": {
        "title": "Opacity",
        "description": "How solid the unit next to the slider value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "slider.group_defaultSliderUnit": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the unit next to the slider value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "text.textWidgetLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the text widget.",
        "help": null
    },
    "text.textWidgetLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the text widget, in pixels.",
        "help": null
    },
    "text.textWidgetLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the text widget.",
        "help": null
    },
    "text.textWidgetLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the text widget, such as uppercase or as typed.",
        "help": null
    },
    "text.textWidgetLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the text widget in a heavier weight.",
        "help": null
    },
    "text.textWidgetLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the text widget in italic.",
        "help": null
    },
    "text.textWidgetLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the text widget.",
        "help": null
    },
    "text.textWidgetLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the text widget left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textWidgetLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the text widget up or down, in pixels. Negative values move up.",
        "help": null
    },
    "list.listItemFont": {
        "title": "Font",
        "description": "Font used for each list row.",
        "help": null
    },
    "list.listItemFs": {
        "title": "Font Size",
        "description": "Text size for each list row, in pixels.",
        "help": null
    },
    "list.listItemCase": {
        "title": "Case",
        "description": "Letter case for each list row, such as uppercase or as typed.",
        "help": null
    },
    "list.listItemBold": {
        "title": "Bold",
        "description": "Draw each list row in a heavier weight.",
        "help": null
    },
    "list.listItemCol": {
        "title": "Color",
        "description": "Color of each list row.",
        "help": null
    },
    "list.defaultListItemFont": {
        "title": "Font",
        "description": "Font used for each list row.",
        "help": null
    },
    "list.defaultListItemFs": {
        "title": "Font Size",
        "description": "Text size for each list row, in pixels.",
        "help": null
    },
    "list.defaultListItemCase": {
        "title": "Case",
        "description": "Letter case for each list row, such as uppercase or as typed.",
        "help": null
    },
    "list.defaultListItemBold": {
        "title": "Bold",
        "description": "Draw each list row in a heavier weight.",
        "help": null
    },
    "list.defaultListItemCol": {
        "title": "Color",
        "description": "Color of each list row.",
        "help": null
    },
    "list.group_defaultListItem": {
        "title": "Typography",
        "description": "Font, size, color, and placement for each list row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "6-text-typography"
        }
    },
    "list.listTimestampFont": {
        "title": "Font",
        "description": "Font used for the time stamp on a list row.",
        "help": null
    },
    "list.listTimestampFs": {
        "title": "Font Size",
        "description": "Text size for the time stamp on a list row, in pixels.",
        "help": null
    },
    "list.listTimestampAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the time stamp on a list row.",
        "help": null
    },
    "list.listTimestampCase": {
        "title": "Case",
        "description": "Letter case for the time stamp on a list row, such as uppercase or as typed.",
        "help": null
    },
    "list.listTimestampBold": {
        "title": "Bold",
        "description": "Draw the time stamp on a list row in a heavier weight.",
        "help": null
    },
    "list.listTimestampItalic": {
        "title": "Italic",
        "description": "Draw the time stamp on a list row in italic.",
        "help": null
    },
    "list.listTimestampCol": {
        "title": "Color",
        "description": "Color of the time stamp on a list row.",
        "help": null
    },
    "list.listTimestampOpacity": {
        "title": "Opacity",
        "description": "How solid the time stamp on a list row looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "list.defaultListTimestampFont": {
        "title": "Font",
        "description": "Font used for the time stamp on a list row.",
        "help": null
    },
    "list.defaultListTimestampFs": {
        "title": "Font Size",
        "description": "Text size for the time stamp on a list row, in pixels.",
        "help": null
    },
    "list.defaultListTimestampAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the time stamp on a list row.",
        "help": null
    },
    "list.defaultListTimestampCase": {
        "title": "Case",
        "description": "Letter case for the time stamp on a list row, such as uppercase or as typed.",
        "help": null
    },
    "list.defaultListTimestampBold": {
        "title": "Bold",
        "description": "Draw the time stamp on a list row in a heavier weight.",
        "help": null
    },
    "list.defaultListTimestampItalic": {
        "title": "Italic",
        "description": "Draw the time stamp on a list row in italic.",
        "help": null
    },
    "list.defaultListTimestampCol": {
        "title": "Color",
        "description": "Color of the time stamp on a list row.",
        "help": null
    },
    "list.defaultListTimestampOpacity": {
        "title": "Opacity",
        "description": "How solid the time stamp on a list row looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "list.group_defaultListTimestamp": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the time stamp on a list row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "6-text-typography"
        }
    },
    "list.listLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the list.",
        "help": null
    },
    "list.listLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the list, in pixels.",
        "help": null
    },
    "list.listLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the list.",
        "help": null
    },
    "list.listLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the list, such as uppercase or as typed.",
        "help": null
    },
    "list.listLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the list in a heavier weight.",
        "help": null
    },
    "list.listLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the list.",
        "help": null
    },
    "list.listLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the list left or right, in pixels. Negative values move left.",
        "help": null
    },
    "list.listLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the list up or down, in pixels. Negative values move up.",
        "help": null
    },
    "list.defaultListLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the list.",
        "help": null
    },
    "list.defaultListLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the list, in pixels.",
        "help": null
    },
    "list.defaultListLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the list.",
        "help": null
    },
    "list.defaultListLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the list, such as uppercase or as typed.",
        "help": null
    },
    "list.defaultListLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the list in a heavier weight.",
        "help": null
    },
    "list.defaultListLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the list.",
        "help": null
    },
    "list.group_defaultListLabel": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the optional title on the list.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "6-text-typography"
        }
    },
    "lightgrid.lgWidgetLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the light grid.",
        "help": null
    },
    "lightgrid.lgWidgetLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the light grid, in pixels.",
        "help": null
    },
    "lightgrid.lgWidgetLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the light grid.",
        "help": null
    },
    "lightgrid.lgWidgetLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the light grid, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.lgWidgetLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the light grid in a heavier weight.",
        "help": null
    },
    "lightgrid.lgWidgetLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the light grid.",
        "help": null
    },
    "lightgrid.lgWidgetLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the light grid left or right, in pixels. Negative values move left.",
        "help": null
    },
    "lightgrid.lgWidgetLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the light grid up or down, in pixels. Negative values move up.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the light grid.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the light grid, in pixels.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the light grid.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the light grid, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the light grid in a heavier weight.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the light grid.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the light grid left or right, in pixels. Negative values move left.",
        "help": null
    },
    "lightgrid.defaultLgWidgetLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the light grid up or down, in pixels. Negative values move up.",
        "help": null
    },
    "lightgrid.group_defaultLgWidgetLabel": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the optional title on the light grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "7-text-typography"
        }
    },
    "lightgrid.lgLightNameFont": {
        "title": "Font",
        "description": "Font used for the name on each light tile.",
        "help": null
    },
    "lightgrid.lgLightNameFs": {
        "title": "Font Size",
        "description": "Text size for the name on each light tile, in pixels.",
        "help": null
    },
    "lightgrid.lgLightNameAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the name on each light tile.",
        "help": null
    },
    "lightgrid.lgLightNameCase": {
        "title": "Case",
        "description": "Letter case for the name on each light tile, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.lgLightNameBold": {
        "title": "Bold",
        "description": "Draw the name on each light tile in a heavier weight.",
        "help": null
    },
    "lightgrid.lgLightNameCol": {
        "title": "Color",
        "description": "Color of the name on each light tile.",
        "help": null
    },
    "lightgrid.defaultLgLightNameFont": {
        "title": "Font",
        "description": "Font used for the name on each light tile.",
        "help": null
    },
    "lightgrid.defaultLgLightNameFs": {
        "title": "Font Size",
        "description": "Text size for the name on each light tile, in pixels.",
        "help": null
    },
    "lightgrid.defaultLgLightNameAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the name on each light tile.",
        "help": null
    },
    "lightgrid.defaultLgLightNameCase": {
        "title": "Case",
        "description": "Letter case for the name on each light tile, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.defaultLgLightNameBold": {
        "title": "Bold",
        "description": "Draw the name on each light tile in a heavier weight.",
        "help": null
    },
    "lightgrid.defaultLgLightNameCol": {
        "title": "Color",
        "description": "Color of the name on each light tile.",
        "help": null
    },
    "lightgrid.group_defaultLgLightName": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the name on each light tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "7-text-typography"
        }
    },
    "lightgrid.lgPanelTitleFont": {
        "title": "Font",
        "description": "Font used for the title on the light control panel.",
        "help": null
    },
    "lightgrid.lgPanelTitleFs": {
        "title": "Font Size",
        "description": "Text size for the title on the light control panel, in pixels.",
        "help": null
    },
    "lightgrid.lgPanelTitleAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the title on the light control panel.",
        "help": null
    },
    "lightgrid.lgPanelTitleCase": {
        "title": "Case",
        "description": "Letter case for the title on the light control panel, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.lgPanelTitleBold": {
        "title": "Bold",
        "description": "Draw the title on the light control panel in a heavier weight.",
        "help": null
    },
    "lightgrid.lgPanelTitleCol": {
        "title": "Color",
        "description": "Color of the title on the light control panel.",
        "help": null
    },
    "lightgrid.lgPanelTitleOffX": {
        "title": "Offset X",
        "description": "Nudges the title on the light control panel left or right, in pixels. Negative values move left.",
        "help": null
    },
    "lightgrid.lgPanelTitleOffY": {
        "title": "Offset Y",
        "description": "Nudges the title on the light control panel up or down, in pixels. Negative values move up.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleFont": {
        "title": "Font",
        "description": "Font used for the title on the light control panel.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleFs": {
        "title": "Font Size",
        "description": "Text size for the title on the light control panel, in pixels.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the title on the light control panel.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleCase": {
        "title": "Case",
        "description": "Letter case for the title on the light control panel, such as uppercase or as typed.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleBold": {
        "title": "Bold",
        "description": "Draw the title on the light control panel in a heavier weight.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleCol": {
        "title": "Color",
        "description": "Color of the title on the light control panel.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleOffX": {
        "title": "Offset X",
        "description": "Nudges the title on the light control panel left or right, in pixels. Negative values move left.",
        "help": null
    },
    "lightgrid.defaultLgPanelTitleOffY": {
        "title": "Offset Y",
        "description": "Nudges the title on the light control panel up or down, in pixels. Negative values move up.",
        "help": null
    },
    "lightgrid.group_defaultLgPanelTitle": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the title on the light control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "7-text-typography"
        }
    },
    "icon.iconCaptionFont": {
        "title": "Font",
        "description": "Font used for the caption under the icon.",
        "help": null
    },
    "icon.iconCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the caption under the icon, in pixels.",
        "help": null
    },
    "icon.iconCaptionAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption under the icon.",
        "help": null
    },
    "icon.iconCaptionCase": {
        "title": "Case",
        "description": "Letter case for the caption under the icon, such as uppercase or as typed.",
        "help": null
    },
    "icon.iconCaptionBold": {
        "title": "Bold",
        "description": "Draw the caption under the icon in a heavier weight.",
        "help": null
    },
    "icon.iconCaptionItalic": {
        "title": "Italic",
        "description": "Draw the caption under the icon in italic.",
        "help": null
    },
    "icon.iconCaptionCol": {
        "title": "Color",
        "description": "Color of the caption under the icon.",
        "help": null
    },
    "icon.iconCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the caption under the icon left or right, in pixels. Negative values move left.",
        "help": null
    },
    "icon.iconCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption under the icon up or down, in pixels. Negative values move up.",
        "help": null
    },
    "icon.defaultIconCaptionFont": {
        "title": "Font",
        "description": "Font used for the caption under the icon.",
        "help": null
    },
    "icon.defaultIconCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the caption under the icon, in pixels.",
        "help": null
    },
    "icon.defaultIconCaptionAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption under the icon.",
        "help": null
    },
    "icon.defaultIconCaptionCase": {
        "title": "Case",
        "description": "Letter case for the caption under the icon, such as uppercase or as typed.",
        "help": null
    },
    "icon.defaultIconCaptionBold": {
        "title": "Bold",
        "description": "Draw the caption under the icon in a heavier weight.",
        "help": null
    },
    "icon.defaultIconCaptionItalic": {
        "title": "Italic",
        "description": "Draw the caption under the icon in italic.",
        "help": null
    },
    "icon.defaultIconCaptionCol": {
        "title": "Color",
        "description": "Color of the caption under the icon.",
        "help": null
    },
    "icon.defaultIconCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the caption under the icon left or right, in pixels. Negative values move left.",
        "help": null
    },
    "icon.defaultIconCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the caption under the icon up or down, in pixels. Negative values move up.",
        "help": null
    },
    "icon.group_defaultIconCaption": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the caption under the icon.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "4-text-typography"
        }
    },
    "image.labelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the image.",
        "help": null
    },
    "image.labelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the image, in pixels.",
        "help": null
    },
    "image.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the image.",
        "help": null
    },
    "image.labelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the image, such as uppercase or as typed.",
        "help": null
    },
    "image.labelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the image in a heavier weight.",
        "help": null
    },
    "image.labelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the image in italic.",
        "help": null
    },
    "image.labelCol": {
        "title": "Color",
        "description": "Color of the optional title on the image.",
        "help": null
    },
    "image.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the image left or right, in pixels. Negative values move left.",
        "help": null
    },
    "image.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the image up or down, in pixels. Negative values move up.",
        "help": null
    },
    "battery.labelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the battery.",
        "help": null
    },
    "battery.labelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the battery, in pixels.",
        "help": null
    },
    "battery.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the battery.",
        "help": null
    },
    "battery.labelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the battery, such as uppercase or as typed.",
        "help": null
    },
    "battery.labelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the battery in a heavier weight.",
        "help": null
    },
    "battery.labelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the battery in italic.",
        "help": null
    },
    "battery.labelCol": {
        "title": "Color",
        "description": "Color of the optional title on the battery.",
        "help": null
    },
    "battery.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the battery left or right, in pixels. Negative values move left.",
        "help": null
    },
    "battery.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the battery up or down, in pixels. Negative values move up.",
        "help": null
    },
    "empty.labelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the container.",
        "help": null
    },
    "empty.labelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the container, in pixels.",
        "help": null
    },
    "empty.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the container.",
        "help": null
    },
    "empty.labelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the container, such as uppercase or as typed.",
        "help": null
    },
    "empty.labelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the container in a heavier weight.",
        "help": null
    },
    "empty.labelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the container in italic.",
        "help": null
    },
    "empty.labelCol": {
        "title": "Color",
        "description": "Color of the optional title on the container.",
        "help": null
    },
    "empty.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the container left or right, in pixels. Negative values move left.",
        "help": null
    },
    "empty.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the container up or down, in pixels. Negative values move up.",
        "help": null
    },
    "graph.labelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the graph.",
        "help": null
    },
    "graph.labelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the graph, in pixels.",
        "help": null
    },
    "graph.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the graph.",
        "help": null
    },
    "graph.labelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the graph, such as uppercase or as typed.",
        "help": null
    },
    "graph.labelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the graph in a heavier weight.",
        "help": null
    },
    "graph.labelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the graph in italic.",
        "help": null
    },
    "graph.labelCol": {
        "title": "Color",
        "description": "Color of the optional title on the graph.",
        "help": null
    },
    "graph.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the graph left or right, in pixels. Negative values move left.",
        "help": null
    },
    "graph.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the graph up or down, in pixels. Negative values move up.",
        "help": null
    },
    "label.labelFont": {
        "title": "Font",
        "description": "Font used for the label text.",
        "help": null
    },
    "label.labelFs": {
        "title": "Font Size",
        "description": "Text size for the label text, in pixels.",
        "help": null
    },
    "label.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the label text.",
        "help": null
    },
    "label.labelCase": {
        "title": "Case",
        "description": "Letter case for the label text, such as uppercase or as typed.",
        "help": null
    },
    "label.labelBold": {
        "title": "Bold",
        "description": "Draw the label text in a heavier weight.",
        "help": null
    },
    "label.labelItalic": {
        "title": "Italic",
        "description": "Draw the label text in italic.",
        "help": null
    },
    "label.labelCol": {
        "title": "Color",
        "description": "Color of the label text.",
        "help": null
    },
    "label.labelOpacity": {
        "title": "Opacity",
        "description": "How solid the label text looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "label.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the label text left or right, in pixels. Negative values move left.",
        "help": null
    },
    "label.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the label text up or down, in pixels. Negative values move up.",
        "help": null
    },
    "label.labelDefaultFont": {
        "title": "Font",
        "description": "Font used for the label text.",
        "help": null
    },
    "label.labelDefaultFs": {
        "title": "Font Size",
        "description": "Text size for the label text, in pixels.",
        "help": null
    },
    "label.labelDefaultAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the label text.",
        "help": null
    },
    "label.labelDefaultCase": {
        "title": "Case",
        "description": "Letter case for the label text, such as uppercase or as typed.",
        "help": null
    },
    "label.labelDefaultBold": {
        "title": "Bold",
        "description": "Draw the label text in a heavier weight.",
        "help": null
    },
    "label.labelDefaultItalic": {
        "title": "Italic",
        "description": "Draw the label text in italic.",
        "help": null
    },
    "label.labelDefaultCol": {
        "title": "Color",
        "description": "Color of the label text.",
        "help": null
    },
    "label.labelDefaultOpacity": {
        "title": "Opacity",
        "description": "How solid the label text looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "label.labelDefaultOffX": {
        "title": "Offset X",
        "description": "Nudges the label text left or right, in pixels. Negative values move left.",
        "help": null
    },
    "label.labelDefaultOffY": {
        "title": "Offset Y",
        "description": "Nudges the label text up or down, in pixels. Negative values move up.",
        "help": null
    },
    "label.group_labelDefault": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the label text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "3-text-typography"
        }
    },
    "videostream.labelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the video.",
        "help": null
    },
    "videostream.labelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the video, in pixels.",
        "help": null
    },
    "videostream.labelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the video.",
        "help": null
    },
    "videostream.labelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the video, such as uppercase or as typed.",
        "help": null
    },
    "videostream.labelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the video in a heavier weight.",
        "help": null
    },
    "videostream.labelCol": {
        "title": "Color",
        "description": "Color of the optional title on the video.",
        "help": null
    },
    "videostream.labelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the video left or right, in pixels. Negative values move left.",
        "help": null
    },
    "videostream.labelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the video up or down, in pixels. Negative values move up.",
        "help": null
    },
    "videostream.group_label": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the optional title on the video.",
        "help": null
    },
    "editbox.editboxInputFont": {
        "title": "Font",
        "description": "Font used for the text typed into the box.",
        "help": null
    },
    "editbox.editboxInputFs": {
        "title": "Font Size",
        "description": "Text size for the text typed into the box, in pixels.",
        "help": null
    },
    "editbox.editboxInputAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the text typed into the box.",
        "help": null
    },
    "editbox.editboxInputCase": {
        "title": "Case",
        "description": "Letter case for the text typed into the box, such as uppercase or as typed.",
        "help": null
    },
    "editbox.editboxInputBold": {
        "title": "Bold",
        "description": "Draw the text typed into the box in a heavier weight.",
        "help": null
    },
    "editbox.editboxInputItalic": {
        "title": "Italic",
        "description": "Draw the text typed into the box in italic.",
        "help": null
    },
    "editbox.editboxInputCol": {
        "title": "Color",
        "description": "Color of the text typed into the box.",
        "help": null
    },
    "editbox.editboxLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title on the edit box.",
        "help": null
    },
    "editbox.editboxLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title on the edit box, in pixels.",
        "help": null
    },
    "editbox.editboxLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title on the edit box.",
        "help": null
    },
    "editbox.editboxLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title on the edit box, such as uppercase or as typed.",
        "help": null
    },
    "editbox.editboxLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title on the edit box in a heavier weight.",
        "help": null
    },
    "editbox.editboxLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title on the edit box in italic.",
        "help": null
    },
    "editbox.editboxLabelCol": {
        "title": "Color",
        "description": "Color of the optional title on the edit box.",
        "help": null
    },
    "editbox.editboxLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title on the edit box left or right, in pixels. Negative values move left.",
        "help": null
    },
    "editbox.editboxLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title on the edit box up or down, in pixels. Negative values move up.",
        "help": null
    },
    "gauge.gaugeCaptionFont": {
        "title": "Font",
        "description": "Font used for the gauge caption.",
        "help": null
    },
    "gauge.gaugeCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the gauge caption, in pixels.",
        "help": null
    },
    "gauge.gaugeCaptionCase": {
        "title": "Case",
        "description": "Letter case for the gauge caption, such as uppercase or as typed.",
        "help": null
    },
    "gauge.gaugeCaptionBold": {
        "title": "Bold",
        "description": "Draw the gauge caption in a heavier weight.",
        "help": null
    },
    "gauge.gaugeCaptionItalic": {
        "title": "Italic",
        "description": "Draw the gauge caption in italic.",
        "help": null
    },
    "gauge.gaugeCaptionCol": {
        "title": "Color",
        "description": "Color of the gauge caption.",
        "help": null
    },
    "gauge.gaugeCaptionOpacity": {
        "title": "Opacity",
        "description": "How solid the gauge caption looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.gaugeCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the gauge caption left or right, in pixels. Negative values move left.",
        "help": null
    },
    "gauge.gaugeCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the gauge caption up or down, in pixels. Negative values move up.",
        "help": null
    },
    "gauge.gaugeCaptionAlignRound": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption on a round gauge.",
        "help": null
    },
    "gauge.defaultGaugeCaptionAlignRound": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption on a round gauge.",
        "help": null
    },
    "gauge.gaugeCaptionAlignHoriz": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption on a horizontal gauge.",
        "help": null
    },
    "gauge.defaultGaugeCaptionAlignHoriz": {
        "title": "Alignment",
        "description": "Horizontal alignment of the caption on a horizontal gauge.",
        "help": null
    },
    "gauge.defaultGaugeCaptionFont": {
        "title": "Font",
        "description": "Font used for the gauge caption.",
        "help": null
    },
    "gauge.defaultGaugeCaptionFs": {
        "title": "Font Size",
        "description": "Text size for the gauge caption, in pixels.",
        "help": null
    },
    "gauge.defaultGaugeCaptionCase": {
        "title": "Case",
        "description": "Letter case for the gauge caption, such as uppercase or as typed.",
        "help": null
    },
    "gauge.defaultGaugeCaptionBold": {
        "title": "Bold",
        "description": "Draw the gauge caption in a heavier weight.",
        "help": null
    },
    "gauge.defaultGaugeCaptionItalic": {
        "title": "Italic",
        "description": "Draw the gauge caption in italic.",
        "help": null
    },
    "gauge.defaultGaugeCaptionCol": {
        "title": "Color",
        "description": "Color of the gauge caption.",
        "help": null
    },
    "gauge.defaultGaugeCaptionOpacity": {
        "title": "Opacity",
        "description": "How solid the gauge caption looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.defaultGaugeCaptionOffX": {
        "title": "Offset X",
        "description": "Nudges the gauge caption left or right, in pixels. Negative values move left.",
        "help": null
    },
    "gauge.defaultGaugeCaptionOffY": {
        "title": "Offset Y",
        "description": "Nudges the gauge caption up or down, in pixels. Negative values move up.",
        "help": null
    },
    "gauge.group_defaultGaugeCaption": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the gauge caption.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text-typography"
        }
    },
    "gauge.gaugeValueFont": {
        "title": "Font",
        "description": "Font used for the gauge value.",
        "help": null
    },
    "gauge.gaugeValueFs": {
        "title": "Font Size",
        "description": "Text size for the gauge value, in pixels.",
        "help": null
    },
    "gauge.gaugeValueBold": {
        "title": "Bold",
        "description": "Draw the gauge value in a heavier weight.",
        "help": null
    },
    "gauge.gaugeValueItalic": {
        "title": "Italic",
        "description": "Draw the gauge value in italic.",
        "help": null
    },
    "gauge.gaugeValueCol": {
        "title": "Color",
        "description": "Color of the gauge value.",
        "help": null
    },
    "gauge.gaugeValueOpacity": {
        "title": "Opacity",
        "description": "How solid the gauge value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.gaugeValueOffX": {
        "title": "Offset X",
        "description": "Nudges the gauge value left or right, in pixels. Negative values move left.",
        "help": null
    },
    "gauge.gaugeValueOffY": {
        "title": "Offset Y",
        "description": "Nudges the gauge value up or down, in pixels. Negative values move up.",
        "help": null
    },
    "gauge.defaultGaugeValueFont": {
        "title": "Font",
        "description": "Font used for the gauge value.",
        "help": null
    },
    "gauge.defaultGaugeValueFs": {
        "title": "Font Size",
        "description": "Text size for the gauge value, in pixels.",
        "help": null
    },
    "gauge.defaultGaugeValueBold": {
        "title": "Bold",
        "description": "Draw the gauge value in a heavier weight.",
        "help": null
    },
    "gauge.defaultGaugeValueItalic": {
        "title": "Italic",
        "description": "Draw the gauge value in italic.",
        "help": null
    },
    "gauge.defaultGaugeValueCol": {
        "title": "Color",
        "description": "Color of the gauge value.",
        "help": null
    },
    "gauge.defaultGaugeValueOpacity": {
        "title": "Opacity",
        "description": "How solid the gauge value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.defaultGaugeValueOffX": {
        "title": "Offset X",
        "description": "Nudges the gauge value left or right, in pixels. Negative values move left.",
        "help": null
    },
    "gauge.defaultGaugeValueOffY": {
        "title": "Offset Y",
        "description": "Nudges the gauge value up or down, in pixels. Negative values move up.",
        "help": null
    },
    "gauge.group_defaultGaugeValue": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the gauge value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text-typography"
        }
    },
    "gauge.gaugeUnitFont": {
        "title": "Font",
        "description": "Font used for the unit next to the gauge value.",
        "help": null
    },
    "gauge.gaugeUnitFs": {
        "title": "Font Size",
        "description": "Text size for the unit next to the gauge value, in pixels.",
        "help": null
    },
    "gauge.gaugeUnitBold": {
        "title": "Bold",
        "description": "Draw the unit next to the gauge value in a heavier weight.",
        "help": null
    },
    "gauge.gaugeUnitItalic": {
        "title": "Italic",
        "description": "Draw the unit next to the gauge value in italic.",
        "help": null
    },
    "gauge.gaugeUnitCol": {
        "title": "Color",
        "description": "Color of the unit next to the gauge value.",
        "help": null
    },
    "gauge.gaugeUnitOpacity": {
        "title": "Opacity",
        "description": "How solid the unit next to the gauge value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.defaultGaugeUnitFont": {
        "title": "Font",
        "description": "Font used for the unit next to the gauge value.",
        "help": null
    },
    "gauge.defaultGaugeUnitFs": {
        "title": "Font Size",
        "description": "Text size for the unit next to the gauge value, in pixels.",
        "help": null
    },
    "gauge.defaultGaugeUnitBold": {
        "title": "Bold",
        "description": "Draw the unit next to the gauge value in a heavier weight.",
        "help": null
    },
    "gauge.defaultGaugeUnitItalic": {
        "title": "Italic",
        "description": "Draw the unit next to the gauge value in italic.",
        "help": null
    },
    "gauge.defaultGaugeUnitCol": {
        "title": "Color",
        "description": "Color of the unit next to the gauge value.",
        "help": null
    },
    "gauge.defaultGaugeUnitOpacity": {
        "title": "Opacity",
        "description": "How solid the unit next to the gauge value looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.group_defaultGaugeUnit": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the unit next to the gauge value.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text-typography"
        }
    },
    "gauge.gaugeAxisFont": {
        "title": "Font",
        "description": "Font used for the numbers along the gauge scale.",
        "help": null
    },
    "gauge.gaugeAxisFs": {
        "title": "Font Size",
        "description": "Text size for the numbers along the gauge scale, in pixels.",
        "help": null
    },
    "gauge.gaugeAxisBold": {
        "title": "Bold",
        "description": "Draw the numbers along the gauge scale in a heavier weight.",
        "help": null
    },
    "gauge.gaugeAxisItalic": {
        "title": "Italic",
        "description": "Draw the numbers along the gauge scale in italic.",
        "help": null
    },
    "gauge.gaugeAxisCol": {
        "title": "Color",
        "description": "Color of the numbers along the gauge scale.",
        "help": null
    },
    "gauge.gaugeAxisOpacity": {
        "title": "Opacity",
        "description": "How solid the numbers along the gauge scale looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.defaultGaugeAxisFont": {
        "title": "Font",
        "description": "Font used for the numbers along the gauge scale.",
        "help": null
    },
    "gauge.defaultGaugeAxisFs": {
        "title": "Font Size",
        "description": "Text size for the numbers along the gauge scale, in pixels.",
        "help": null
    },
    "gauge.defaultGaugeAxisBold": {
        "title": "Bold",
        "description": "Draw the numbers along the gauge scale in a heavier weight.",
        "help": null
    },
    "gauge.defaultGaugeAxisItalic": {
        "title": "Italic",
        "description": "Draw the numbers along the gauge scale in italic.",
        "help": null
    },
    "gauge.defaultGaugeAxisCol": {
        "title": "Color",
        "description": "Color of the numbers along the gauge scale.",
        "help": null
    },
    "gauge.defaultGaugeAxisOpacity": {
        "title": "Opacity",
        "description": "How solid the numbers along the gauge scale looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "gauge.group_defaultGaugeAxis": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the numbers along the gauge scale.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "4-text-typography"
        }
    },
    "clock.clockGroupLabelFont": {
        "title": "Font",
        "description": "Font used for the optional title above the clock.",
        "help": null
    },
    "clock.clockGroupLabelFs": {
        "title": "Font Size",
        "description": "Text size for the optional title above the clock, in pixels.",
        "help": null
    },
    "clock.clockGroupLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the optional title above the clock.",
        "help": null
    },
    "clock.clockGroupLabelCase": {
        "title": "Case",
        "description": "Letter case for the optional title above the clock, such as uppercase or as typed.",
        "help": null
    },
    "clock.clockGroupLabelBold": {
        "title": "Bold",
        "description": "Draw the optional title above the clock in a heavier weight.",
        "help": null
    },
    "clock.clockGroupLabelItalic": {
        "title": "Italic",
        "description": "Draw the optional title above the clock in italic.",
        "help": null
    },
    "clock.clockGroupLabelCol": {
        "title": "Color",
        "description": "Color of the optional title above the clock.",
        "help": null
    },
    "clock.clockGroupLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the optional title above the clock left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.clockGroupLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the optional title above the clock up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.defaultClockAnalogNumFont": {
        "title": "Font",
        "description": "Font used for the numbers on an analog clock.",
        "help": null
    },
    "clock.defaultClockAnalogNumFs": {
        "title": "Font Size",
        "description": "Text size for the numbers on an analog clock, in pixels.",
        "help": null
    },
    "clock.defaultClockAnalogNumCase": {
        "title": "Case",
        "description": "Letter case for the numbers on an analog clock, such as uppercase or as typed.",
        "help": null
    },
    "clock.defaultClockAnalogNumBold": {
        "title": "Bold",
        "description": "Draw the numbers on an analog clock in a heavier weight.",
        "help": null
    },
    "clock.defaultClockAnalogNumItalic": {
        "title": "Italic",
        "description": "Draw the numbers on an analog clock in italic.",
        "help": null
    },
    "clock.defaultClockAnalogNumCol": {
        "title": "Color",
        "description": "Color of the numbers on an analog clock.",
        "help": null
    },
    "clock.defaultClockAnalogNumOffX": {
        "title": "Offset X",
        "description": "Nudges the numbers on an analog clock left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.defaultClockAnalogNumOffY": {
        "title": "Offset Y",
        "description": "Nudges the numbers on an analog clock up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.group_defaultClockAnalogNum": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the numbers on an analog clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockAnalogNumFont": {
        "title": "Font",
        "description": "Font used for the numbers on an analog clock.",
        "help": null
    },
    "clock.clockAnalogNumFs": {
        "title": "Font Size",
        "description": "Text size for the numbers on an analog clock, in pixels.",
        "help": null
    },
    "clock.clockAnalogNumCase": {
        "title": "Case",
        "description": "Letter case for the numbers on an analog clock, such as uppercase or as typed.",
        "help": null
    },
    "clock.clockAnalogNumBold": {
        "title": "Bold",
        "description": "Draw the numbers on an analog clock in a heavier weight.",
        "help": null
    },
    "clock.clockAnalogNumItalic": {
        "title": "Italic",
        "description": "Draw the numbers on an analog clock in italic.",
        "help": null
    },
    "clock.clockAnalogNumCol": {
        "title": "Color",
        "description": "Color of the numbers on an analog clock.",
        "help": null
    },
    "clock.defaultClockFlipNumFont": {
        "title": "Font",
        "description": "Font used for the digits on a flip clock.",
        "help": null
    },
    "clock.defaultClockFlipNumFs": {
        "title": "Font Size",
        "description": "Text size for the digits on a flip clock, in pixels.",
        "help": null
    },
    "clock.defaultClockFlipNumBold": {
        "title": "Bold",
        "description": "Draw the digits on a flip clock in a heavier weight.",
        "help": null
    },
    "clock.defaultClockFlipNumItalic": {
        "title": "Italic",
        "description": "Draw the digits on a flip clock in italic.",
        "help": null
    },
    "clock.defaultClockFlipNumCol": {
        "title": "Color",
        "description": "Color of the digits on a flip clock.",
        "help": null
    },
    "clock.group_defaultClockFlipNum": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the digits on a flip clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.clockFlipNumFont": {
        "title": "Font",
        "description": "Font used for the digits on a flip clock.",
        "help": null
    },
    "clock.clockFlipNumFs": {
        "title": "Font Size",
        "description": "Text size for the digits on a flip clock, in pixels.",
        "help": null
    },
    "clock.clockFlipNumBold": {
        "title": "Bold",
        "description": "Draw the digits on a flip clock in a heavier weight.",
        "help": null
    },
    "clock.clockFlipNumItalic": {
        "title": "Italic",
        "description": "Draw the digits on a flip clock in italic.",
        "help": null
    },
    "clock.clockFlipNumCol": {
        "title": "Color",
        "description": "Color of the digits on a flip clock.",
        "help": null
    },
    "clock.defaultClockFlipLabelFont": {
        "title": "Font",
        "description": "Font used for the small labels under flip-clock digits.",
        "help": null
    },
    "clock.defaultClockFlipLabelFs": {
        "title": "Font Size",
        "description": "Text size for the small labels under flip-clock digits, in pixels.",
        "help": null
    },
    "clock.defaultClockFlipLabelCase": {
        "title": "Case",
        "description": "Letter case for the small labels under flip-clock digits, such as uppercase or as typed.",
        "help": null
    },
    "clock.defaultClockFlipLabelBold": {
        "title": "Bold",
        "description": "Draw the small labels under flip-clock digits in a heavier weight.",
        "help": null
    },
    "clock.defaultClockFlipLabelItalic": {
        "title": "Italic",
        "description": "Draw the small labels under flip-clock digits in italic.",
        "help": null
    },
    "clock.defaultClockFlipLabelCol": {
        "title": "Color",
        "description": "Color of the small labels under flip-clock digits.",
        "help": null
    },
    "clock.defaultClockFlipLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the small labels under flip-clock digits left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.defaultClockFlipLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the small labels under flip-clock digits up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.group_defaultClockFlipLabel": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the small labels under flip-clock digits.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.clockFlipLabelFont": {
        "title": "Font",
        "description": "Font used for the small labels under flip-clock digits.",
        "help": null
    },
    "clock.clockFlipLabelFs": {
        "title": "Font Size",
        "description": "Text size for the small labels under flip-clock digits, in pixels.",
        "help": null
    },
    "clock.clockFlipLabelCase": {
        "title": "Case",
        "description": "Letter case for the small labels under flip-clock digits, such as uppercase or as typed.",
        "help": null
    },
    "clock.clockFlipLabelBold": {
        "title": "Bold",
        "description": "Draw the small labels under flip-clock digits in a heavier weight.",
        "help": null
    },
    "clock.clockFlipLabelItalic": {
        "title": "Italic",
        "description": "Draw the small labels under flip-clock digits in italic.",
        "help": null
    },
    "clock.clockFlipLabelCol": {
        "title": "Color",
        "description": "Color of the small labels under flip-clock digits.",
        "help": null
    },
    "clock.clockFlipLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the small labels under flip-clock digits left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.clockFlipLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the small labels under flip-clock digits up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.defaultClockFlipAmPmFont": {
        "title": "Font",
        "description": "Font used for the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.defaultClockFlipAmPmFs": {
        "title": "Font Size",
        "description": "Text size for the AM and PM marker on a flip clock, in pixels.",
        "help": null
    },
    "clock.defaultClockFlipAmPmAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.defaultClockFlipAmPmCase": {
        "title": "Case",
        "description": "Letter case for the AM and PM marker on a flip clock, such as uppercase or as typed.",
        "help": null
    },
    "clock.defaultClockFlipAmPmBold": {
        "title": "Bold",
        "description": "Draw the AM and PM marker on a flip clock in a heavier weight.",
        "help": null
    },
    "clock.defaultClockFlipAmPmItalic": {
        "title": "Italic",
        "description": "Draw the AM and PM marker on a flip clock in italic.",
        "help": null
    },
    "clock.defaultClockFlipAmPmCol": {
        "title": "Color",
        "description": "Color of the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.defaultClockFlipAmPmOffX": {
        "title": "Offset X",
        "description": "Nudges the AM and PM marker on a flip clock left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.defaultClockFlipAmPmOffY": {
        "title": "Offset Y",
        "description": "Nudges the AM and PM marker on a flip clock up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.group_defaultClockFlipAmPm": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the AM and PM marker on a flip clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.clockFlipAmPmFont": {
        "title": "Font",
        "description": "Font used for the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.clockFlipAmPmFs": {
        "title": "Font Size",
        "description": "Text size for the AM and PM marker on a flip clock, in pixels.",
        "help": null
    },
    "clock.clockFlipAmPmAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.clockFlipAmPmCase": {
        "title": "Case",
        "description": "Letter case for the AM and PM marker on a flip clock, such as uppercase or as typed.",
        "help": null
    },
    "clock.clockFlipAmPmBold": {
        "title": "Bold",
        "description": "Draw the AM and PM marker on a flip clock in a heavier weight.",
        "help": null
    },
    "clock.clockFlipAmPmItalic": {
        "title": "Italic",
        "description": "Draw the AM and PM marker on a flip clock in italic.",
        "help": null
    },
    "clock.clockFlipAmPmCol": {
        "title": "Color",
        "description": "Color of the AM and PM marker on a flip clock.",
        "help": null
    },
    "clock.clockFlipAmPmOffX": {
        "title": "Offset X",
        "description": "Nudges the AM and PM marker on a flip clock left or right, in pixels. Negative values move left.",
        "help": null
    },
    "clock.clockFlipAmPmOffY": {
        "title": "Offset Y",
        "description": "Nudges the AM and PM marker on a flip clock up or down, in pixels. Negative values move up.",
        "help": null
    },
    "clock.defaultClockTimeDateFont": {
        "title": "Font",
        "description": "Font used for the time and date readout.",
        "help": null
    },
    "clock.defaultClockTimeDateFs": {
        "title": "Font Size",
        "description": "Text size for the time and date readout, in pixels.",
        "help": null
    },
    "clock.defaultClockTimeDateAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the time and date readout.",
        "help": null
    },
    "clock.defaultClockTimeDateCase": {
        "title": "Case",
        "description": "Letter case for the time and date readout, such as uppercase or as typed.",
        "help": null
    },
    "clock.defaultClockTimeDateBold": {
        "title": "Bold",
        "description": "Draw the time and date readout in a heavier weight.",
        "help": null
    },
    "clock.defaultClockTimeDateItalic": {
        "title": "Italic",
        "description": "Draw the time and date readout in italic.",
        "help": null
    },
    "clock.defaultClockTimeDateCol": {
        "title": "Color",
        "description": "Color of the time and date readout.",
        "help": null
    },
    "clock.group_defaultClockTimeDate": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the time and date readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.clockTimeDateFont": {
        "title": "Font",
        "description": "Font used for the time and date readout.",
        "help": null
    },
    "clock.clockTimeDateFs": {
        "title": "Font Size",
        "description": "Text size for the time and date readout, in pixels.",
        "help": null
    },
    "clock.clockTimeDateAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the time and date readout.",
        "help": null
    },
    "clock.clockTimeDateCase": {
        "title": "Case",
        "description": "Letter case for the time and date readout, such as uppercase or as typed.",
        "help": null
    },
    "clock.clockTimeDateBold": {
        "title": "Bold",
        "description": "Draw the time and date readout in a heavier weight.",
        "help": null
    },
    "clock.clockTimeDateItalic": {
        "title": "Italic",
        "description": "Draw the time and date readout in italic.",
        "help": null
    },
    "clock.clockTimeDateCol": {
        "title": "Color",
        "description": "Color of the time and date readout.",
        "help": null
    },
    "graph.defaultGraphAxisXFont": {
        "title": "Font",
        "description": "Font used for the labels on the horizontal axis.",
        "help": null
    },
    "graph.group_defaultGraphAxisX": {
        "title": "Typography",
        "description": "Base style for the category tick numbers. The value axis copies this until you change it. Rotation tilts these numbers. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.axisXFont": {
        "title": "Font",
        "description": "Font used for the labels on the horizontal axis.",
        "help": null
    },
    "graph.defaultGraphAxisYFont": {
        "title": "Font",
        "description": "Font used for the labels on the vertical axis.",
        "help": null
    },
    "graph.group_defaultGraphAxisY": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the labels on the vertical axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.axisYFont": {
        "title": "Font",
        "description": "Font used for the labels on the vertical axis.",
        "help": null
    },
    "graph.defaultGraphTextFont": {
        "title": "Font",
        "description": "Font used for the numbers in a text graph.",
        "help": null
    },
    "graph.group_defaultGraphText": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the numbers in a text graph.",
        "help": null
    },
    "graph.textFont": {
        "title": "Font",
        "description": "Font used for the numbers in a text graph.",
        "help": null
    },
    "graph.defaultGraphPointValFont": {
        "title": "Font",
        "description": "Font used for the value labels on a line graph.",
        "help": null
    },
    "graph.defaultGraphPointValFs": {
        "title": "Font Size",
        "description": "Text size for the value labels on a line graph, in pixels.",
        "help": null
    },
    "graph.defaultGraphPointValAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the value labels on a line graph.",
        "help": null
    },
    "graph.defaultGraphPointValCase": {
        "title": "Case",
        "description": "Letter case for the value labels on a line graph, such as uppercase or as typed.",
        "help": null
    },
    "graph.defaultGraphPointValBold": {
        "title": "Bold",
        "description": "Draw the value labels on a line graph in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphPointValItalic": {
        "title": "Italic",
        "description": "Draw the value labels on a line graph in italic.",
        "help": null
    },
    "graph.defaultGraphPointValCol": {
        "title": "Color",
        "description": "Color of the value labels on a line graph.",
        "help": null
    },
    "graph.defaultGraphPointValOpacity": {
        "title": "Opacity",
        "description": "How solid the value labels on a line graph looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "graph.defaultGraphPointValOffX": {
        "title": "Offset X",
        "description": "Nudges the value labels on a line graph left or right, in pixels. Negative values move left.",
        "help": null
    },
    "graph.defaultGraphPointValOffY": {
        "title": "Offset Y",
        "description": "Nudges the value labels on a line graph up or down, in pixels. Negative values move up.",
        "help": null
    },
    "graph.defaultGraphPointValInvertYNegative": {
        "title": "Invert Y on Negative Values",
        "description": "Flips the vertical offset direction when a data point value is negative, placing positive values above the line point and negative values below.",
        "help": null
    },
    "graph.group_defaultGraphPointVal": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the value labels on a line graph.",
        "help": null
    },
    "graph.pointValFont": {
        "title": "Font",
        "description": "Font used for the value labels on a line graph.",
        "help": null
    },
    "graph.pointValFs": {
        "title": "Font Size",
        "description": "Text size for the value labels on a line graph, in pixels.",
        "help": null
    },
    "graph.pointValAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the value labels on a line graph.",
        "help": null
    },
    "graph.pointValCase": {
        "title": "Case",
        "description": "Letter case for the value labels on a line graph, such as uppercase or as typed.",
        "help": null
    },
    "graph.pointValBold": {
        "title": "Bold",
        "description": "Draw the value labels on a line graph in a heavier weight.",
        "help": null
    },
    "graph.pointValItalic": {
        "title": "Italic",
        "description": "Draw the value labels on a line graph in italic.",
        "help": null
    },
    "graph.pointValCol": {
        "title": "Color",
        "description": "Color of the value labels on a line graph.",
        "help": null
    },
    "graph.pointValOpacity": {
        "title": "Opacity",
        "description": "How solid the value labels on a line graph looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "graph.pointValOffX": {
        "title": "Offset X",
        "description": "Nudges the value labels on a line graph left or right, in pixels. Negative values move left.",
        "help": null
    },
    "graph.pointValOffY": {
        "title": "Offset Y",
        "description": "Nudges the value labels on a line graph up or down, in pixels. Negative values move up.",
        "help": null
    },
    "graph.pointValInvertYNegative": {
        "title": "Invert Y on Negative Values",
        "description": "Flips the vertical offset direction when a data point value is negative, placing positive values above the line point and negative values below.",
        "help": null
    },
    "graph.defaultGraphPointValBarFont": {
        "title": "Font",
        "description": "Font used for the value labels on a bar graph.",
        "help": null
    },
    "graph.defaultGraphPointValBarFs": {
        "title": "Font Size",
        "description": "Text size for the value labels on a bar graph, in pixels.",
        "help": null
    },
    "graph.defaultGraphPointValBarAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the value labels on a bar graph.",
        "help": null
    },
    "graph.defaultGraphPointValBarCase": {
        "title": "Case",
        "description": "Letter case for the value labels on a bar graph, such as uppercase or as typed.",
        "help": null
    },
    "graph.defaultGraphPointValBarBold": {
        "title": "Bold",
        "description": "Draw the value labels on a bar graph in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphPointValBarItalic": {
        "title": "Italic",
        "description": "Draw the value labels on a bar graph in italic.",
        "help": null
    },
    "graph.defaultGraphPointValBarCol": {
        "title": "Color",
        "description": "Color of the value labels on a bar graph.",
        "help": null
    },
    "graph.defaultGraphPointValBarOpacity": {
        "title": "Opacity",
        "description": "How solid the value labels on a bar graph looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "graph.defaultGraphPointValBarOffX": {
        "title": "Offset X",
        "description": "Nudges the value labels on a bar graph left or right, in pixels. Negative values move left.",
        "help": null
    },
    "graph.defaultGraphPointValBarOffY": {
        "title": "Offset Y",
        "description": "Nudges the value labels on a bar graph up or down, in pixels. Negative values move up.",
        "help": null
    },
    "graph.defaultGraphPointValBarInvertYNegative": {
        "title": "Invert Y on Negative Values",
        "description": "Flips the vertical offset direction when a data point value is negative, placing positive values above the bar and negative values below.",
        "help": null
    },
    "graph.group_defaultGraphPointValBar": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the value labels on a bar graph.",
        "help": null
    },
    "graph.pointValBarFont": {
        "title": "Font",
        "description": "Font used for the value labels on a bar graph.",
        "help": null
    },
    "graph.pointValBarFs": {
        "title": "Font Size",
        "description": "Text size for the value labels on a bar graph, in pixels.",
        "help": null
    },
    "graph.pointValBarAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the value labels on a bar graph.",
        "help": null
    },
    "graph.pointValBarCase": {
        "title": "Case",
        "description": "Letter case for the value labels on a bar graph, such as uppercase or as typed.",
        "help": null
    },
    "graph.pointValBarBold": {
        "title": "Bold",
        "description": "Draw the value labels on a bar graph in a heavier weight.",
        "help": null
    },
    "graph.pointValBarItalic": {
        "title": "Italic",
        "description": "Draw the value labels on a bar graph in italic.",
        "help": null
    },
    "graph.pointValBarCol": {
        "title": "Color",
        "description": "Color of the value labels on a bar graph.",
        "help": null
    },
    "graph.pointValBarOpacity": {
        "title": "Opacity",
        "description": "How solid the value labels on a bar graph looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "graph.pointValBarOffX": {
        "title": "Offset X",
        "description": "Nudges the value labels on a bar graph left or right, in pixels. Negative values move left.",
        "help": null
    },
    "graph.pointValBarOffY": {
        "title": "Offset Y",
        "description": "Nudges the value labels on a bar graph up or down, in pixels. Negative values move up.",
        "help": null
    },
    "graph.pointValBarInvertYNegative": {
        "title": "Invert Y on Negative Values",
        "description": "Flips the vertical offset direction when a data point value is negative, placing positive values above the bar and negative values below.",
        "help": null
    },
    "graph.defaultGraphLegendItemFont": {
        "title": "Font",
        "description": "Font used for the text in the graph legend.",
        "help": null
    },
    "graph.defaultGraphLegendItemFs": {
        "title": "Font Size",
        "description": "Text size for the text in the graph legend, in pixels.",
        "help": null
    },
    "graph.defaultGraphLegendItemAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the text in the graph legend.",
        "help": null
    },
    "graph.defaultGraphLegendItemCase": {
        "title": "Case",
        "description": "Letter case for the text in the graph legend, such as uppercase or as typed.",
        "help": null
    },
    "graph.defaultGraphLegendItemBold": {
        "title": "Bold",
        "description": "Draw the text in the graph legend in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphLegendItemItalic": {
        "title": "Italic",
        "description": "Draw the text in the graph legend in italic.",
        "help": null
    },
    "graph.defaultGraphLegendItemCol": {
        "title": "Color",
        "description": "Color of the text in the graph legend.",
        "help": null
    },
    "graph.defaultGraphLegendItemOpacity": {
        "title": "Opacity",
        "description": "How solid the text in the graph legend looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "graph.group_defaultGraphLegendItem": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the text in the graph legend.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.legendItemFont": {
        "title": "Font",
        "description": "Font used for the text in the graph legend.",
        "help": null
    },
    "graph.legendItemFs": {
        "title": "Font Size",
        "description": "Text size for the text in the graph legend, in pixels.",
        "help": null
    },
    "graph.legendItemAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the text in the graph legend.",
        "help": null
    },
    "graph.legendItemCase": {
        "title": "Case",
        "description": "Letter case for the text in the graph legend, such as uppercase or as typed.",
        "help": null
    },
    "graph.legendItemBold": {
        "title": "Bold",
        "description": "Draw the text in the graph legend in a heavier weight.",
        "help": null
    },
    "graph.legendItemItalic": {
        "title": "Italic",
        "description": "Draw the text in the graph legend in italic.",
        "help": null
    },
    "graph.legendItemCol": {
        "title": "Color",
        "description": "Color of the text in the graph legend.",
        "help": null
    },
    "graph.legendItemOpacity": {
        "title": "Opacity",
        "description": "How solid the text in the graph legend looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "dialogBoxTextFont": {
        "title": "Font",
        "description": "Font used for the message in a confirmation dialog.",
        "help": null
    },
    "dialogBoxTextFs": {
        "title": "Font Size",
        "description": "Text size for the message in a confirmation dialog, in pixels.",
        "help": null
    },
    "dialogBoxTextAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the message in a confirmation dialog.",
        "help": null
    },
    "dialogBoxTextCase": {
        "title": "Case",
        "description": "Letter case for the message in a confirmation dialog, such as uppercase or as typed.",
        "help": null
    },
    "dialogBoxTextBold": {
        "title": "Bold",
        "description": "Draw the message in a confirmation dialog in a heavier weight.",
        "help": null
    },
    "dialogBoxTextItalic": {
        "title": "Italic",
        "description": "Draw the message in a confirmation dialog in italic.",
        "help": null
    },
    "dialogBoxTextCol": {
        "title": "Color",
        "description": "Color of the message in a confirmation dialog.",
        "help": null
    },
    "dialogBoxTextOpacity": {
        "title": "Opacity",
        "description": "How solid the message in a confirmation dialog looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "dialogBoxTextOffX": {
        "title": "Offset X",
        "description": "Nudges the message in a confirmation dialog left or right, in pixels. Negative values move left.",
        "help": null
    },
    "dialogBoxTextOffY": {
        "title": "Offset Y",
        "description": "Nudges the message in a confirmation dialog up or down, in pixels. Negative values move up.",
        "help": null
    },
    "group_dialogBoxText": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the message in a confirmation dialog.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "3-typography"
        }
    },
    "dialogBoxButtonLabelFont": {
        "title": "Font",
        "description": "Font used for the confirm and dismiss button captions.",
        "help": null
    },
    "dialogBoxButtonLabelFs": {
        "title": "Font Size",
        "description": "Text size for the confirm and dismiss button captions, in pixels.",
        "help": null
    },
    "dialogBoxButtonLabelAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of the confirm and dismiss button captions.",
        "help": null
    },
    "dialogBoxButtonLabelCase": {
        "title": "Case",
        "description": "Letter case for the confirm and dismiss button captions, such as uppercase or as typed.",
        "help": null
    },
    "dialogBoxButtonLabelBold": {
        "title": "Bold",
        "description": "Draw the confirm and dismiss button captions in a heavier weight.",
        "help": null
    },
    "dialogBoxButtonLabelItalic": {
        "title": "Italic",
        "description": "Draw the confirm and dismiss button captions in italic.",
        "help": null
    },
    "dialogBoxButtonLabelCol": {
        "title": "Color",
        "description": "Color of the confirm and dismiss button captions.",
        "help": null
    },
    "dialogBoxButtonLabelOpacity": {
        "title": "Opacity",
        "description": "How solid the confirm and dismiss button captions looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "dialogBoxButtonLabelOffX": {
        "title": "Offset X",
        "description": "Nudges the confirm and dismiss button captions left or right, in pixels. Negative values move left.",
        "help": null
    },
    "dialogBoxButtonLabelOffY": {
        "title": "Offset Y",
        "description": "Nudges the confirm and dismiss button captions up or down, in pixels. Negative values move up.",
        "help": null
    },
    "group_dialogBoxButtonLabel": {
        "title": "Typography",
        "description": "Font, size, color, and placement for the confirm and dismiss button captions.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "3-typography"
        }
    },
    "text.textMdParaFont": {
        "title": "Font",
        "description": "Font used for paragraphs in a text widget.",
        "help": null
    },
    "text.textMdParaFs": {
        "title": "Font Size",
        "description": "Text size for paragraphs in a text widget, in pixels.",
        "help": null
    },
    "text.textMdParaAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of paragraphs in a text widget.",
        "help": null
    },
    "text.textMdParaCase": {
        "title": "Case",
        "description": "Letter case for paragraphs in a text widget, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdParaBold": {
        "title": "Bold",
        "description": "Draw paragraphs in a text widget in a heavier weight.",
        "help": null
    },
    "text.textMdParaItalic": {
        "title": "Italic",
        "description": "Draw paragraphs in a text widget in italic.",
        "help": null
    },
    "text.textMdParaCol": {
        "title": "Color",
        "description": "Color of paragraphs in a text widget.",
        "help": null
    },
    "text.textMdParaOpacity": {
        "title": "Opacity",
        "description": "How solid paragraphs in a text widget looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdParaOffX": {
        "title": "Offset X",
        "description": "Nudges paragraphs in a text widget left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdParaOffY": {
        "title": "Offset Y",
        "description": "Nudges paragraphs in a text widget up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdParaBlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after paragraphs in a text widget, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdParaLineHeight": {
        "title": "Line Height",
        "description": "Line spacing for paragraphs in a text widget. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdH1Font": {
        "title": "Font",
        "description": "Font used for a level 1 heading.",
        "help": null
    },
    "text.textMdH1Fs": {
        "title": "Font Size",
        "description": "Text size for a level 1 heading, in pixels.",
        "help": null
    },
    "text.textMdH1Align": {
        "title": "Alignment",
        "description": "Horizontal alignment of a level 1 heading.",
        "help": null
    },
    "text.textMdH1Case": {
        "title": "Case",
        "description": "Letter case for a level 1 heading, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdH1Bold": {
        "title": "Bold",
        "description": "Draw a level 1 heading in a heavier weight.",
        "help": null
    },
    "text.textMdH1Italic": {
        "title": "Italic",
        "description": "Draw a level 1 heading in italic.",
        "help": null
    },
    "text.textMdH1Col": {
        "title": "Color",
        "description": "Color of a level 1 heading.",
        "help": null
    },
    "text.textMdH1Opacity": {
        "title": "Opacity",
        "description": "How solid a level 1 heading looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdH1OffX": {
        "title": "Offset X",
        "description": "Nudges a level 1 heading left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdH1OffY": {
        "title": "Offset Y",
        "description": "Nudges a level 1 heading up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdH1BlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after a level 1 heading, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdH1LineHeight": {
        "title": "Line Height",
        "description": "Line spacing for a level 1 heading. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdH2Font": {
        "title": "Font",
        "description": "Font used for a level 2 heading.",
        "help": null
    },
    "text.textMdH2Fs": {
        "title": "Font Size",
        "description": "Text size for a level 2 heading, in pixels.",
        "help": null
    },
    "text.textMdH2Align": {
        "title": "Alignment",
        "description": "Horizontal alignment of a level 2 heading.",
        "help": null
    },
    "text.textMdH2Case": {
        "title": "Case",
        "description": "Letter case for a level 2 heading, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdH2Bold": {
        "title": "Bold",
        "description": "Draw a level 2 heading in a heavier weight.",
        "help": null
    },
    "text.textMdH2Italic": {
        "title": "Italic",
        "description": "Draw a level 2 heading in italic.",
        "help": null
    },
    "text.textMdH2Col": {
        "title": "Color",
        "description": "Color of a level 2 heading.",
        "help": null
    },
    "text.textMdH2Opacity": {
        "title": "Opacity",
        "description": "How solid a level 2 heading looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdH2OffX": {
        "title": "Offset X",
        "description": "Nudges a level 2 heading left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdH2OffY": {
        "title": "Offset Y",
        "description": "Nudges a level 2 heading up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdH2BlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after a level 2 heading, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdH2LineHeight": {
        "title": "Line Height",
        "description": "Line spacing for a level 2 heading. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdH3Font": {
        "title": "Font",
        "description": "Font used for a level 3 heading.",
        "help": null
    },
    "text.textMdH3Fs": {
        "title": "Font Size",
        "description": "Text size for a level 3 heading, in pixels.",
        "help": null
    },
    "text.textMdH3Align": {
        "title": "Alignment",
        "description": "Horizontal alignment of a level 3 heading.",
        "help": null
    },
    "text.textMdH3Case": {
        "title": "Case",
        "description": "Letter case for a level 3 heading, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdH3Bold": {
        "title": "Bold",
        "description": "Draw a level 3 heading in a heavier weight.",
        "help": null
    },
    "text.textMdH3Italic": {
        "title": "Italic",
        "description": "Draw a level 3 heading in italic.",
        "help": null
    },
    "text.textMdH3Col": {
        "title": "Color",
        "description": "Color of a level 3 heading.",
        "help": null
    },
    "text.textMdH3Opacity": {
        "title": "Opacity",
        "description": "How solid a level 3 heading looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdH3OffX": {
        "title": "Offset X",
        "description": "Nudges a level 3 heading left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdH3OffY": {
        "title": "Offset Y",
        "description": "Nudges a level 3 heading up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdH3BlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after a level 3 heading, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdH3LineHeight": {
        "title": "Line Height",
        "description": "Line spacing for a level 3 heading. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdThFont": {
        "title": "Font",
        "description": "Font used for table header cells.",
        "help": null
    },
    "text.textMdThFs": {
        "title": "Font Size",
        "description": "Text size for table header cells, in pixels.",
        "help": null
    },
    "text.textMdThCase": {
        "title": "Case",
        "description": "Letter case for table header cells, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdThBold": {
        "title": "Bold",
        "description": "Draw table header cells in a heavier weight.",
        "help": null
    },
    "text.textMdThItalic": {
        "title": "Italic",
        "description": "Draw table header cells in italic.",
        "help": null
    },
    "text.textMdThCol": {
        "title": "Color",
        "description": "Color of table header cells.",
        "help": null
    },
    "text.textMdThOpacity": {
        "title": "Opacity",
        "description": "How solid table header cells looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdThOffX": {
        "title": "Offset X",
        "description": "Nudges table header cells left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdThOffY": {
        "title": "Offset Y",
        "description": "Nudges table header cells up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdThBlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after table header cells, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdThLineHeight": {
        "title": "Line Height",
        "description": "Line spacing for table header cells. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdThAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of table header cells. Table Defined follows the alignment written in the markdown table.",
        "help": null
    },
    "text.textMdThColFilled": {
        "title": "Header Text",
        "description": "Text color for table header cells when the header row has a fill.",
        "help": null
    },
    "text.textMdTdFont": {
        "title": "Font",
        "description": "Font used for table body cells.",
        "help": null
    },
    "text.textMdTdFs": {
        "title": "Font Size",
        "description": "Text size for table body cells, in pixels.",
        "help": null
    },
    "text.textMdTdCase": {
        "title": "Case",
        "description": "Letter case for table body cells, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdTdBold": {
        "title": "Bold",
        "description": "Draw table body cells in a heavier weight.",
        "help": null
    },
    "text.textMdTdItalic": {
        "title": "Italic",
        "description": "Draw table body cells in italic.",
        "help": null
    },
    "text.textMdTdCol": {
        "title": "Color",
        "description": "Color of table body cells.",
        "help": null
    },
    "text.textMdTdOpacity": {
        "title": "Opacity",
        "description": "How solid table body cells looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdTdOffX": {
        "title": "Offset X",
        "description": "Nudges table body cells left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdTdOffY": {
        "title": "Offset Y",
        "description": "Nudges table body cells up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdTdBlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after table body cells, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdTdLineHeight": {
        "title": "Line Height",
        "description": "Line spacing for table body cells. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdTdAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of table body cells. Table Defined follows the alignment written in the markdown table.",
        "help": null
    },
    "text.textMdBlockTypographyFont": {
        "title": "Font",
        "description": "Font used for quotes and lists.",
        "help": null
    },
    "text.textMdBlockTypographyFs": {
        "title": "Font Size",
        "description": "Text size for quotes and lists, in pixels.",
        "help": null
    },
    "text.textMdBlockTypographyAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of quotes and lists.",
        "help": null
    },
    "text.textMdBlockTypographyCase": {
        "title": "Case",
        "description": "Letter case for quotes and lists, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdBlockTypographyBold": {
        "title": "Bold",
        "description": "Draw quotes and lists in a heavier weight.",
        "help": null
    },
    "text.textMdBlockTypographyItalic": {
        "title": "Italic",
        "description": "Draw quotes and lists in italic.",
        "help": null
    },
    "text.textMdBlockTypographyCol": {
        "title": "Color",
        "description": "Color of quotes and lists.",
        "help": null
    },
    "text.textMdBlockTypographyOpacity": {
        "title": "Opacity",
        "description": "How solid quotes and lists looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdBlockTypographyOffX": {
        "title": "Offset X",
        "description": "Nudges quotes and lists left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdBlockTypographyOffY": {
        "title": "Offset Y",
        "description": "Nudges quotes and lists up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdBlockTypographyBlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after quotes and lists, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdBlockTypographyLineHeight": {
        "title": "Line Height",
        "description": "Line spacing for quotes and lists. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdCodeFont": {
        "title": "Font",
        "description": "Font used for code.",
        "help": null
    },
    "text.textMdCodeFs": {
        "title": "Font Size",
        "description": "Text size for code, in pixels.",
        "help": null
    },
    "text.textMdCodeAlign": {
        "title": "Alignment",
        "description": "Horizontal alignment of code.",
        "help": null
    },
    "text.textMdCodeCase": {
        "title": "Case",
        "description": "Letter case for code, such as uppercase or as typed.",
        "help": null
    },
    "text.textMdCodeBold": {
        "title": "Bold",
        "description": "Draw code in a heavier weight.",
        "help": null
    },
    "text.textMdCodeItalic": {
        "title": "Italic",
        "description": "Draw code in italic.",
        "help": null
    },
    "text.textMdCodeCol": {
        "title": "Color",
        "description": "Color of code.",
        "help": null
    },
    "text.textMdCodeOpacity": {
        "title": "Opacity",
        "description": "How solid code looks. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "text.textMdCodeOffX": {
        "title": "Offset X",
        "description": "Nudges code left or right, in pixels. Negative values move left.",
        "help": null
    },
    "text.textMdCodeOffY": {
        "title": "Offset Y",
        "description": "Nudges code up or down, in pixels. Negative values move up.",
        "help": null
    },
    "text.textMdCodeBlockSpace": {
        "title": "Block Spacing",
        "description": "Extra space after code, in pixels. A negative number pulls the next block closer.",
        "help": null
    },
    "text.textMdCodeLineHeight": {
        "title": "Line Height",
        "description": "Line spacing for code. 1 is normal, and higher values spread the lines apart.",
        "help": null
    },
    "text.textMdCodeBg": {
        "title": "Background",
        "description": "Background color behind code.",
        "help": null
    },
    "deactivated": {
        "title": "Deactivated",
        "description": "Dims this widget and ignores taps, while keeping it on the canvas.",
        "help": null
    },
    "visible": {
        "title": "Visibility",
        "description": "Shows or hides this widget. A linked topic can turn it on and off from your automation.",
        "help": null
    },
    "opacity": {
        "title": "Opacity",
        "description": "How solid the whole widget is. 100 is fully opaque and 0 is invisible.",
        "help": null
    },
    "editorModeOverride": {
        "title": "Editor Mode Override",
        "description": "Keeps this one widget in Basic or Advanced settings when the dashboard editor mode is the other way.",
        "help": {
            "topic": "Widgets",
            "anchor": "basic-settings-and-advanced"
        }
    },
    "padding": {
        "title": "Padding",
        "description": "Space between the widget edge and what is drawn inside it, in pixels.",
        "help": null
    },
    "cornerRadius": {
        "title": "Corner Radius",
        "description": "Rounds the corners of the widget background.",
        "help": null
    },
    "borderWidth": {
        "title": "Border Width",
        "description": "Thickness of the line around the widget. 0 hides the border.",
        "help": null
    },
    "borderOpacity": {
        "title": "Border Opacity",
        "description": "How solid the widget border is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "group.name": {
        "title": "Group Name",
        "description": "Name shown for this group in the editor. It is not drawn on the dashboard.",
        "help": null
    },
    "group.locked": {
        "title": "Locked",
        "description": "Stops the group, and the widgets inside it, from being moved or resized on the canvas.",
        "help": null
    },
    "group.visible": {
        "title": "Visibility",
        "description": "Shows or hides every widget in this group. A linked topic can do the same from your automation.",
        "help": null
    },
    "group.overridePage": {
        "title": "Override Page",
        "description": "Shows this group on a chosen page, instead of the pages set on each widget inside it.",
        "help": null
    },
    "group.dimBackground": {
        "title": "Dim Background",
        "description": "Darkens the rest of the dashboard while this group is visible.",
        "help": null
    },
    "selection.allowEmpty": {
        "title": "Allow Empty Selection",
        "description": "Lets every item in the selection group turn off. Leave it off when one item should always stay on.",
        "help": null
    },
    "audioTopic": {
        "title": "Audio Topic",
        "description": "Topic that plays the clip beside it. Publish any payload to that topic to hear the sound.",
        "help": null
    },
    "audioUrl": {
        "title": "Audio Clip",
        "description": "Sound file played when the topic beside it receives a payload.",
        "help": null
    },
    "row.name": {
        "title": "Light Name",
        "description": "Name shown on this light tile.",
        "help": null
    },
    "row.outputMode": {
        "title": "Output Mode",
        "description": "Light opens the color panel. Switch sends on and off values, or a page and URL, without that panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "3-switch-output-mode-button-panel"
        }
    },
    "row.actionType": {
        "title": "On Click",
        "description": "What a tap does for this row. Send a value, open a page, or open a web address.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "row.mode": {
        "title": "Item Mode",
        "description": "Push sends one payload. Toggle stays on or off. Select acts like a radio button with the other items in its group.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "row.label": {
        "title": "Item Label",
        "description": "Text shown on this menu item.",
        "help": null
    },
    "row.onPayload": {
        "title": "On Value",
        "description": "Payload published when this row turns on.",
        "help": null
    },
    "row.offPayload": {
        "title": "Off Value",
        "description": "Payload published when this row turns off.",
        "help": null
    },
    "row.state": {
        "title": "State",
        "description": "On or off state for this row. Link a topic when your automation should drive it.",
        "help": null
    },
    "row.pageTo": {
        "title": "Target Page",
        "description": "Dashboard page opened when this row is used.",
        "help": null
    },
    "row.urlTo": {
        "title": "Target URL",
        "description": "Web address opened when this row is used.",
        "help": null
    },
    "row.urlNewTab": {
        "title": "New Tab",
        "description": "Opens the web address in a new browser tab instead of leaving the dashboard.",
        "help": null
    },
    "row.selectionGroup": {
        "title": "Selection Group",
        "description": "Items that share this name act as one set. Turning one on turns the others off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "4-selection-groups"
        }
    },
    "row.sendOffOnGroupDeselect": {
        "title": "Send Off When Turned Off by Group",
        "description": "Also publishes the off value when another item in the same selection group turns this one off.",
        "help": null
    },
    "row.outputTopic": {
        "title": "Output Topic",
        "description": "Topic that receives this item's on and off values. Leave it blank to only open a page or URL.",
        "help": null
    },
    "row.colorPresets": {
        "title": "Color Presets",
        "description": "Saved colors this light can jump to from the control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "row.overridePresets": {
        "title": "Override Presets",
        "description": "Uses a custom preset list for this light instead of the grid default.",
        "help": null
    },
    "row.topics.header": {
        "title": "Output Topics",
        "description": "Topics this light publishes to when it is switched or adjusted.",
        "help": null
    },
    "row.topics.onTopic": {
        "title": "On Topic",
        "description": "Topic published when this output turns on.",
        "help": null
    },
    "row.topics.offTopic": {
        "title": "Off Topic",
        "description": "Topic published when this output turns off.",
        "help": null
    },
    "row.topics.topic": {
        "title": "Topic",
        "description": "Topic that receives this output.",
        "help": null
    },
    "row.topics.onValue": {
        "title": "On Value",
        "description": "Payload sent when this output turns on.",
        "help": null
    },
    "row.topics.offValue": {
        "title": "Off Value",
        "description": "Payload sent when this output turns off.",
        "help": null
    },
    "row.topics.hold": {
        "title": "Hold to Activate",
        "description": "Requires a press and hold before this output fires.",
        "help": null
    },
    "extra.header": {
        "title": "Extra Output Topics",
        "description": "More topics this button can publish, besides its main output.",
        "help": null
    },
    "extra.onTopic": {
        "title": "On Topic",
        "description": "Extra topic published when the button turns on.",
        "help": null
    },
    "extra.offTopic": {
        "title": "Off Topic",
        "description": "Extra topic published when the button turns off.",
        "help": null
    },
    "extra.topic": {
        "title": "Topic",
        "description": "Extra topic that receives this output.",
        "help": null
    },
    "extra.onValue": {
        "title": "On Value",
        "description": "Payload sent on the extra topic when the button turns on.",
        "help": null
    },
    "extra.offValue": {
        "title": "Off Value",
        "description": "Payload sent on the extra topic when the button turns off.",
        "help": null
    },
    "extra.hold": {
        "title": "Hold to Activate",
        "description": "Requires a press and hold before this extra output fires.",
        "help": null
    },
    "graph.series.name": {
        "title": "Series Name",
        "description": "Name shown in the legend for this line or bar.",
        "help": null
    },
    "graph.series.visible": {
        "title": "Show Graph",
        "description": "Draws this series. Turn it off to keep the data without showing the line or bars.",
        "help": null
    },
    "graph.series.data": {
        "title": "Series Data",
        "description": "Topic or payload that feeds this series. A number streams one point. An array replaces the whole series.",
        "help": {
            "topic": "Data Types & Formats",
            "widgetSub": "graph-data-formats",
            "anchor": "quick-field-guide"
        }
    },
    "graph.series.valueMultiplier": {
        "title": "Value Multiplier",
        "description": "Multiplies every sample before it is drawn. 0 leaves the value unchanged.",
        "help": null
    },
    "graph.series.positiveColor": {
        "title": "Positive Color",
        "description": "Color used for values on the high side of the baseline.",
        "help": null
    },
    "graph.series.positiveColorOpacity": {
        "title": "Positive Opacity",
        "description": "Opacity percentage for positive lines or bars.",
        "help": null
    },
    "graph.series.negativeColor": {
        "title": "Negative Color",
        "description": "Color used for values on the low side of the baseline.",
        "help": null
    },
    "graph.series.negativeColorOpacity": {
        "title": "Negative Opacity",
        "description": "Opacity percentage for negative lines or bars.",
        "help": null
    },
    "graph.series.lineWidth": {
        "title": "Line Width",
        "description": "Thickness of this series line, in pixels.",
        "help": null
    },
    "graph.series.pointColor": {
        "title": "Point Color",
        "description": "Color of the dots drawn on this series.",
        "help": null
    },
    "graph.series.positiveFillColor": {
        "title": "Positive Fill Color",
        "description": "Fill color under the line, or inside bars, for values above the baseline.",
        "help": null
    },
    "graph.series.positiveStartOpacity": {
        "title": "Positive Start Opacity",
        "description": "How solid the positive fill is at one end of the gradient.",
        "help": null
    },
    "graph.series.positiveEndOpacity": {
        "title": "Positive End Opacity",
        "description": "How solid the positive fill is at the other end of the gradient.",
        "help": null
    },
    "graph.series.negativeFillColor": {
        "title": "Negative Fill Color",
        "description": "Fill color for values below the baseline.",
        "help": null
    },
    "graph.series.negativeStartOpacity": {
        "title": "Negative Start Opacity",
        "description": "How solid the negative fill is at one end of the gradient.",
        "help": null
    },
    "graph.series.negativeEndOpacity": {
        "title": "Negative End Opacity",
        "description": "How solid the negative fill is at the other end of the gradient.",
        "help": null
    },
    "graph.series.positiveOutlineColor": {
        "title": "Positive Outline Color",
        "description": "Outline color for bars above the baseline.",
        "help": null
    },
    "graph.series.negativeOutlineColor": {
        "title": "Negative Outline Color",
        "description": "Outline color for bars below the baseline.",
        "help": null
    },
    "iconSourceOn": {
        "title": "Icon Source (On)",
        "description": "Use a Phosphor icon, your own image, or a site favicon while this part is on.",
        "help": null
    },
    "iconSourceOff": {
        "title": "Icon Source (Off)",
        "description": "Use a Phosphor icon, your own image, or a site favicon while this part is off.",
        "help": null
    },
    "iconOn": {
        "title": "Icon (On)",
        "description": "Phosphor icon drawn while this part is on.",
        "help": null
    },
    "iconOff": {
        "title": "Icon (Off)",
        "description": "Phosphor icon drawn while this part is off.",
        "help": null
    },
    "iconWeightOn": {
        "title": "Icon Style (On)",
        "description": "Phosphor weight used while this part is on, from thin through duotone.",
        "help": null
    },
    "iconWeightOff": {
        "title": "Icon Style (Off)",
        "description": "Phosphor weight used while this part is off, from thin through duotone.",
        "help": null
    },
    "imgOn": {
        "title": "Image URL (On)",
        "description": "Address of the image used while this part is on. On Homey you can pick it from the gallery.",
        "help": null
    },
    "imgOff": {
        "title": "Image URL (Off)",
        "description": "Address of the image used while this part is off. On Homey you can pick it from the gallery.",
        "help": null
    },
    "colorizeOn": {
        "title": "Tint Image (On)",
        "description": "Recolors the custom image with the icon color while this part is on.",
        "help": null
    },
    "colorizeOff": {
        "title": "Tint Image (Off)",
        "description": "Recolors the custom image with the icon color while this part is off.",
        "help": null
    },
    "iconSlotAccentOn": {
        "title": "Icon Accent (On)",
        "description": "Second color used by a duotone icon while this part is on.",
        "help": null
    },
    "iconSlotAccentOff": {
        "title": "Icon Accent (Off)",
        "description": "Second color used by a duotone icon while this part is off.",
        "help": null
    },
    "iconSlotOffsetXOn": {
        "title": "Icon Offset X (On)",
        "description": "Nudges the on icon left or right, in pixels.",
        "help": null
    },
    "iconSlotOffsetYOn": {
        "title": "Icon Offset Y (On)",
        "description": "Nudges the on icon up or down, in pixels.",
        "help": null
    },
    "iconSlotRotationOn": {
        "title": "Icon Rotation (On)",
        "description": "Rotates the on icon, in degrees.",
        "help": null
    },
    "iconSlotOffsetXOff": {
        "title": "Icon Offset X (Off)",
        "description": "Nudges the off icon left or right, in pixels.",
        "help": null
    },
    "iconSlotOffsetYOff": {
        "title": "Icon Offset Y (Off)",
        "description": "Nudges the off icon up or down, in pixels.",
        "help": null
    },
    "iconSlotRotationOff": {
        "title": "Icon Rotation (Off)",
        "description": "Rotates the off icon, in degrees.",
        "help": null
    },
    "iconColOnOverrideEn": {
        "title": "Custom Icon Color (On)",
        "description": "Uses a color chosen here for the on icon, instead of the shared icon color.",
        "help": null
    },
    "iconColOnOverride": {
        "title": "Icon Color (On)",
        "description": "Color of the on icon when a custom color is enabled.",
        "help": null
    },
    "iconColOffOverrideEn": {
        "title": "Custom Icon Color (Off)",
        "description": "Uses a color chosen here for the off icon, instead of the shared icon color.",
        "help": null
    },
    "iconColOffOverride": {
        "title": "Icon Color (Off)",
        "description": "Color of the off icon when a custom color is enabled.",
        "help": null
    },
    "arrow.arrowAnimEnabled": {
        "title": "Enable Animation",
        "description": "Moves a dash along the line. Turn it off for a still separator.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowAnimReverse": {
        "title": "Reverse Flow",
        "description": "Runs the moving dash back toward the start of the line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowAnimSpeed": {
        "title": "Animation Speed",
        "description": "How long one dash takes to travel the line, in seconds. Lower is faster.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowColFlow": {
        "title": "Flow Color",
        "description": "Color of the dash that travels along the line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowColFlowRev": {
        "title": "Reverse Flow Color",
        "description": "Color of the dash when the flow runs backward.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowColGlow": {
        "title": "Glow Color",
        "description": "Color of the soft halo around the line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "4-glow-effects"
        }
    },
    "arrow.arrowColMain": {
        "title": "Main Color",
        "description": "Color of the line itself.",
        "help": null
    },
    "arrow.arrowFlowWidth": {
        "title": "Flow Width",
        "description": "Thickness of the traveling dash, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowGlowOpacity": {
        "title": "Glow Opacity",
        "description": "How strong the halo around the line is. 100 is solid and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "4-glow-effects"
        }
    },
    "arrow.arrowGlowWidth": {
        "title": "Glow Width",
        "description": "How far the halo spreads from the line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "4-glow-effects"
        }
    },
    "arrow.arrowGradientWidth": {
        "title": "Gradient Width",
        "description": "Length of the fade on the traveling dash, as a percent of the line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "3-animated-flows"
        }
    },
    "arrow.arrowHeadRound": {
        "title": "Head Roundness",
        "description": "Rounds the corners of the arrow head.",
        "help": null
    },
    "arrow.arrowHeadSz": {
        "title": "Head Size",
        "description": "Size of the arrow head. 0 draws a plain line with no head.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "arrow",
            "anchor": "1-creating-static-lines-separators"
        }
    },
    "arrow.arrowLineRadius": {
        "title": "Corner Radius",
        "description": "Rounds the bends in the line.",
        "help": null
    },
    "arrow.arrowThick": {
        "title": "Thickness",
        "description": "Thickness of the line, in pixels.",
        "help": null
    },
    "battery.battColBorder": {
        "title": "Border Color",
        "description": "Color of the line around the battery body.",
        "help": null
    },
    "battery.battColEmpty": {
        "title": "Empty Color",
        "description": "Color of the unfilled part of the battery.",
        "help": null
    },
    "battery.battColGood": {
        "title": "Good Color",
        "description": "Fill color while the level is above the low threshold.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery",
            "anchor": "1-data-behavior"
        }
    },
    "battery.battColLow": {
        "title": "Low Color",
        "description": "Fill color while the level is at or below the low threshold.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery",
            "anchor": "1-data-behavior"
        }
    },
    "battery.defaultBatteryInnerPad": {
        "title": "Inner Padding",
        "description": "Space between the battery shell and the fill, in pixels.",
        "help": null
    },
    "battery.defaultBatteryLowThresh": {
        "title": "Low Threshold",
        "description": "Level where the fill switches from the good color to the low color.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "battery",
            "anchor": "1-data-behavior"
        }
    },
    "battery.defaultBatterySegments": {
        "title": "Segments",
        "description": "How many blocks the fill is split into. 0 draws one continuous fill.",
        "help": null
    },
    "battery.defaultBatteryTerminalSz": {
        "title": "Terminal Size",
        "description": "Size of the small cap on the end of the battery.",
        "help": null
    },
    "battery.defaultBatteryVertical": {
        "title": "Vertical",
        "description": "Stands the battery on its end instead of on its side.",
        "help": null
    },
    "clock.everySecond": {
        "title": "Sound",
        "description": "Sound played each time the seconds change. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "audio"
        }
    },
    "clock.everyMinute": {
        "title": "Sound",
        "description": "Sound played each time the minute changes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "audio"
        }
    },
    "clock.everyHour": {
        "title": "Sound",
        "description": "Sound played each time the hour changes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "audio"
        }
    },
    "clock.everyDay": {
        "title": "Sound",
        "description": "Sound played when the date changes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "audio"
        }
    },
    "clock.defaultClockDisplayMode": {
        "title": "Clock Type",
        "description": "Analog face, flip clock, or a plain time and date readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "1-display-modes"
        }
    },
    "clock.defaultClockUseSystemTime": {
        "title": "Use System Time",
        "description": "Follows the clock of the device showing the dashboard. Turn it off to pick a timezone.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "2-time-source-timezones"
        }
    },
    "clock.defaultClockTimezone": {
        "title": "Timezone",
        "description": "Region whose time to show when system time is off. Example: Europe/Amsterdam.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "2-time-source-timezones"
        }
    },
    "clock.defaultClockOffset": {
        "title": "Manual Offset",
        "description": "Adds or subtracts minutes from the clock. Use this when a timezone is not enough.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "2-time-source-timezones"
        }
    },
    "clock.defaultClockUse12Hour": {
        "title": "12-Hour Clock",
        "description": "Shows AM and PM instead of 00 to 23.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "2-time-source-timezones"
        }
    },
    "clock.defaultClockShowNumbers": {
        "title": "Show Numbers",
        "description": "Draws hour numbers on the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockShowTicks": {
        "title": "Show Ticks",
        "description": "Draws the small marks between the numbers on the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockSweep": {
        "title": "Sweep Mode",
        "description": "Glides the second hand instead of ticking it once per second.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockNumDist": {
        "title": "Number Distance",
        "description": "How far the hour numbers sit from the center, as a percent of the face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockNumSize": {
        "title": "Number Size",
        "description": "Size of the hour numbers on the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockNumColor": {
        "title": "Number Color",
        "description": "Color of the hour numbers on the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockNumFont": {
        "title": "Number Font",
        "description": "Font used for the hour numbers on the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockNumFontBold": {
        "title": "Number Bold",
        "description": "Draws the analog hour numbers in a heavier weight.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockColHour": {
        "title": "Hour Hand Color",
        "description": "Color of the short hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockColMin": {
        "title": "Minute Hand Color",
        "description": "Color of the long hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockColSec": {
        "title": "Second Hand Color",
        "description": "Color of the thin hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockColTicks": {
        "title": "Tick Color",
        "description": "Color of the marks around the analog face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockColNumbers": {
        "title": "Number Color",
        "description": "Color of the hour numbers on this clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandLengthHour": {
        "title": "Hour Hand Length",
        "description": "Length of the short hand, as a percent of the face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandLengthMin": {
        "title": "Minute Hand Length",
        "description": "Length of the long hand, as a percent of the face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandLengthSec": {
        "title": "Second Hand Length",
        "description": "Length of the thin hand, as a percent of the face.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandWidthHour": {
        "title": "Hour Hand Width",
        "description": "Thickness of the short hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandWidthMin": {
        "title": "Minute Hand Width",
        "description": "Thickness of the long hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.clockHandWidthSec": {
        "title": "Second Hand Width",
        "description": "Thickness of the thin hand.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockCapSize": {
        "title": "Center Cap Size",
        "description": "Size of the dot where the hands meet.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockBackCapSize": {
        "title": "Back Cap Size",
        "description": "Size of the cap drawn behind the hands.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "3-analog-face-hands"
        }
    },
    "clock.defaultClockFlipShowSeconds": {
        "title": "Show Seconds",
        "description": "Adds a seconds card to the flip clock.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipShowLabels": {
        "title": "Show Labels",
        "description": "Shows the small hour, minute, and second captions under the cards.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipCardRadius": {
        "title": "Card Roundness",
        "description": "Rounds the corners of each flip card, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipSeparator": {
        "title": "Card Gap",
        "description": "Space between the flip cards, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipUpperColor": {
        "title": "Upper Card Color",
        "description": "Color of the top half of each flip card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipLowerColor": {
        "title": "Lower Card Color",
        "description": "Color of the bottom half of each flip card.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipLocale": {
        "title": "Flip Language",
        "description": "Language used for flip-clock captions.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipLabelHour": {
        "title": "Hour Caption",
        "description": "Replaces the word under the hour cards. Leave it empty for the language default.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipLabelMinute": {
        "title": "Minute Caption",
        "description": "Replaces the word under the minute cards. Leave it empty for the language default.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockFlipLabelSecond": {
        "title": "Second Caption",
        "description": "Replaces the word under the second cards. Leave it empty for the language default.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "4-flip-clock-configuration"
        }
    },
    "clock.defaultClockTextShowTime": {
        "title": "Show Time",
        "description": "Includes the clock time in the text readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextShowHour": {
        "title": "Show Hour",
        "description": "Includes the hour in the text readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextShowMinute": {
        "title": "Show Minute",
        "description": "Includes the minute in the text readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextShowSecond": {
        "title": "Show Second",
        "description": "Includes the seconds in the text readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextShowDate": {
        "title": "Show Date",
        "description": "Adds the date under or beside the time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateLinebreak": {
        "title": "Date on Next Line",
        "description": "Puts the date on its own line under the time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextBlinkSeparator": {
        "title": "Blink Separator",
        "description": "Flashes the character between the hours and minutes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextSeparator": {
        "title": "Time Separator",
        "description": "Character between the hours, minutes, and seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeparator": {
        "title": "Date Separator",
        "description": "Character between the parts of the date.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextLocale": {
        "title": "Date Language",
        "description": "Language used for month and weekday names.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextWeekPrefix": {
        "title": "Week Caption",
        "description": "Text placed before the week number. Leave it empty to use the language default.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeg0": {
        "title": "Date Part 1",
        "description": "First piece of the date line, such as the weekday or the day number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeg1": {
        "title": "Date Part 2",
        "description": "Second piece of the date line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeg2": {
        "title": "Date Part 3",
        "description": "Third piece of the date line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeg3": {
        "title": "Date Part 4",
        "description": "Fourth piece of the date line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "clock.defaultClockTextDateSeg4": {
        "title": "Date Part 5",
        "description": "Fifth piece of the date line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock",
            "anchor": "5-date-time-text-layout"
        }
    },
    "dialogBoxMessage": {
        "title": "Message",
        "description": "Question shown on the confirmation overlay. Line breaks stay visible.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxConfirmLabel": {
        "title": "Confirm Label",
        "description": "Caption on the button that accepts the action. The usual word is Yes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxDismissLabel": {
        "title": "Dismiss Label",
        "description": "Caption on the button that cancels the action. The usual word is No.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxButtonColor": {
        "title": "Button Color",
        "description": "Background color of the confirm and dismiss buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxButtonRoundness": {
        "title": "Button Roundness",
        "description": "Rounds the corners of the confirm and dismiss buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxAutoButtonSize": {
        "title": "Auto Button Size",
        "description": "Sizes the buttons from their captions. Turn it off to set a width and height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxButtonWidth": {
        "title": "Button Width",
        "description": "Width of the confirm and dismiss buttons when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxButtonHeight": {
        "title": "Button Height",
        "description": "Height of the confirm and dismiss buttons when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxShowButtonIcons": {
        "title": "Show Button Icons",
        "description": "Draws an icon on the confirm and dismiss buttons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxShowDialogIcon": {
        "title": "Show Dialog Icon",
        "description": "Draws an icon beside the message.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "1-message-and-buttons"
        }
    },
    "dialogBoxBackgroundColor": {
        "title": "Background Color",
        "description": "Fill color of the confirmation panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxBorderColor": {
        "title": "Border Color",
        "description": "Color of the line around the confirmation panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxBorderWidth": {
        "title": "Border Width",
        "description": "Thickness of the line around the confirmation panel. 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxBorderOpacity": {
        "title": "Border Opacity",
        "description": "How solid the panel border is. 100 is fully opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxCornerRadius": {
        "title": "Corner Radius",
        "description": "Rounds the corners of the confirmation panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxAutoDialogSize": {
        "title": "Auto Dialog Size",
        "description": "Sizes the panel from the message. Turn it off to set a width and height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxDialogWidth": {
        "title": "Dialog Width",
        "description": "Width of the panel when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxDialogHeight": {
        "title": "Dialog Height",
        "description": "Height of the panel when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxCenterDialog": {
        "title": "Center Dialog",
        "description": "Keeps the panel in the middle of the dashboard. Turn it off to place it yourself.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxDialogX": {
        "title": "Dialog X",
        "description": "Horizontal position of the panel when centering is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxDialogY": {
        "title": "Dialog Y",
        "description": "Vertical position of the panel when centering is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "dialogBoxModalMode": {
        "title": "Modal Mode",
        "description": "Dims the dashboard and blocks other taps until Confirm or Dismiss is chosen.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "2-panel-look-and-placement"
        }
    },
    "confirmGesture": {
        "title": "Confirm With",
        "description": "Which button press should ask for confirmation before the action runs.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "4-use-it-on-a-switch-button"
        }
    },
    "confirmWhenTurningOff": {
        "title": "Confirm When Turning Off",
        "description": "Also asks before a toggle switch turns off. On is always confirmed when confirmation is required.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "4-use-it-on-a-switch-button"
        }
    },
    "previewInEditMode": {
        "title": "Preview in Edit Mode",
        "description": "Shows the confirmation panel on the canvas while you edit, so you can place it. The buttons do not run the action there.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "dialog-box",
            "anchor": "4-use-it-on-a-switch-button"
        }
    },
    "editbox.editboxBgColor": {
        "title": "Background Color",
        "description": "Fill color of the text field.",
        "help": null
    },
    "editbox.editboxBgOpacity": {
        "title": "Background Opacity",
        "description": "How solid the text field fill is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "editbox.editboxBorderColor": {
        "title": "Border Color",
        "description": "Color of the line around the text field.",
        "help": null
    },
    "editbox.editboxBorderWidth": {
        "title": "Border Width",
        "description": "Thickness of the line around the text field. 0 hides it.",
        "help": null
    },
    "editbox.editboxBorderRadius": {
        "title": "Border Radius",
        "description": "Rounds the corners of the text field.",
        "help": null
    },
    "editbox.editboxEnableFocusColor": {
        "title": "Focus Glow",
        "description": "Draws a glow around the field while someone is typing.",
        "help": null
    },
    "editbox.editboxFocusColor": {
        "title": "Focus Color",
        "description": "Color of the glow shown while the field is in use.",
        "help": null
    },
    "editbox.editboxPlaceholderColor": {
        "title": "Placeholder Color",
        "description": "Color of the hint text shown before anything is typed.",
        "help": null
    },
    "editbox.editboxTextPadding": {
        "title": "Text Padding",
        "description": "Space between the field edge and the typed text, in pixels.",
        "help": null
    },
    "gauge.defaultGaugeType": {
        "title": "Style",
        "description": "Round dial or a horizontal bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeAbbreviateLargeValues": {
        "title": "Abbreviate Large Values",
        "description": "Shows big numbers as thousands and millions, such as 1.2k.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeKeepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Keeps zeros at the end of the number, so 20.50 stays 20.50.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeDisplayDecimalPlaces": {
        "title": "Decimal Places",
        "description": "How many digits to show after the decimal point.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeDisplayKeepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Keeps zeros at the end of the displayed number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeCustomDisplayRange": {
        "title": "Custom Display Range",
        "description": "Shows a different number range than the one used to position the bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeDisplayMin": {
        "title": "Display Minimum",
        "description": "Lowest number shown on the readout when a custom display range is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeDisplayMax": {
        "title": "Display Maximum",
        "description": "Highest number shown on the readout when a custom display range is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "1-data-behavior"
        }
    },
    "gauge.defaultGaugeBarThick": {
        "title": "Bar Width",
        "description": "Thickness of the filled bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeTrackThick": {
        "title": "Track Width",
        "description": "Thickness of the empty track behind the bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeBarOpacity": {
        "title": "Bar Opacity",
        "description": "How solid the filled bar is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeTrackOpacity": {
        "title": "Track Opacity",
        "description": "How solid the empty track is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeTrackBlur": {
        "title": "Track Blur",
        "description": "Frosts whatever shows through the track. 0 is sharp.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeSolidBarColor": {
        "title": "Solid Color at Value",
        "description": "Uses one color for the filled bar instead of a gradient along the scale.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.gaugeBarGlow": {
        "title": "Bar Glow",
        "description": "Draws a soft halo around the filled bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.gaugeColTrack": {
        "title": "Track Color",
        "description": "Color of the empty track behind the bar.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeShowIcon": {
        "title": "Show Icon",
        "description": "Draws an icon with the gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.defaultGaugeIconSize": {
        "title": "Icon Size",
        "description": "Size of the gauge icon, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.defaultGaugeIconOffX": {
        "title": "Icon Offset X",
        "description": "Nudges the gauge icon left or right, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.defaultGaugeIconOffY": {
        "title": "Icon Offset Y",
        "description": "Nudges the gauge icon up or down, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "3-icon"
        }
    },
    "gauge.defaultGaugeRoundLayout": {
        "title": "Text Position",
        "description": "Where the caption and value sit on a round gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeHorizontalLayout": {
        "title": "Text Position",
        "description": "Where the caption and value sit on a horizontal gauge.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeRoundGap": {
        "title": "Round Gap",
        "description": "Space between the round gauge and its text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeHorizontalGap": {
        "title": "Horizontal Gap",
        "description": "Space between the horizontal bar and its text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.defaultGaugeSizeOffset": {
        "title": "Size Adjustment",
        "description": "Grows or shrinks the gauge inside its box, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "gauge",
            "anchor": "2-appearance"
        }
    },
    "gauge.valueChange": {
        "title": "On Value Change",
        "description": "Sound played when the gauge value changes. Leave it empty to stay silent.",
        "help": null
    },
    "graph.axisXFontSize": {
        "title": "Font Size",
        "description": "Text size for the labels on the horizontal axis, in pixels.",
        "help": null
    },
    "graph.axisXFontColor": {
        "title": "Color",
        "description": "Color of the labels on the horizontal axis.",
        "help": null
    },
    "graph.axisXFontOpacity": {
        "title": "Opacity",
        "description": "How solid the labels on the horizontal axis are. 100 is opaque and 0 hides them.",
        "help": null
    },
    "graph.axisXFontBold": {
        "title": "Bold",
        "description": "Draws the labels on the horizontal axis in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphAxisXFontSize": {
        "title": "Font Size",
        "description": "Text size for the labels on the horizontal axis, in pixels.",
        "help": null
    },
    "graph.defaultGraphAxisXFontColor": {
        "title": "Color",
        "description": "Color of the labels on the horizontal axis.",
        "help": null
    },
    "graph.defaultGraphAxisXFontOpacity": {
        "title": "Opacity",
        "description": "How solid the labels on the horizontal axis are. 100 is opaque and 0 hides them.",
        "help": null
    },
    "graph.defaultGraphAxisXFontBold": {
        "title": "Bold",
        "description": "Draws the labels on the horizontal axis in a heavier weight.",
        "help": null
    },
    "graph.axisYFontSize": {
        "title": "Font Size",
        "description": "Text size for the labels on the vertical axis, in pixels.",
        "help": null
    },
    "graph.axisYFontColor": {
        "title": "Color",
        "description": "Color of the labels on the vertical axis.",
        "help": null
    },
    "graph.axisYFontOpacity": {
        "title": "Opacity",
        "description": "How solid the labels on the vertical axis are. 100 is opaque and 0 hides them.",
        "help": null
    },
    "graph.axisYFontBold": {
        "title": "Bold",
        "description": "Draws the labels on the vertical axis in a heavier weight.",
        "help": null
    },
    "graph.axisYRotation": {
        "title": "Rotation",
        "description": "Tilts the value-axis numbers by degrees. 0 keeps them upright. The chart margin grows so the numbers stay on the canvas.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphAxisYRotation": {
        "title": "Rotation",
        "description": "Tilts the value-axis numbers by degrees. 0 keeps them upright. The chart margin grows so the numbers stay on the canvas.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.axisXLabelFont": {
        "title": "Font",
        "description": "Font used for the X axis title. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.defaultGraphAxisXLabelFont": {
        "title": "Font",
        "description": "Font used for the X axis title. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.axisXLabelFontSize": {
        "title": "Font Size",
        "description": "Text size for the X axis title, in pixels. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.defaultGraphAxisXLabelFontSize": {
        "title": "Font Size",
        "description": "Text size for the X axis title, in pixels. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.axisXLabelFontColor": {
        "title": "Color",
        "description": "Color of the X axis title. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.defaultGraphAxisXLabelFontColor": {
        "title": "Color",
        "description": "Color of the X axis title. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.axisXLabelFontOpacity": {
        "title": "Opacity",
        "description": "How solid the X axis title is. 100 is opaque and 0 hides it. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.defaultGraphAxisXLabelFontOpacity": {
        "title": "Opacity",
        "description": "How solid the X axis title is. 100 is opaque and 0 hides it. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.axisXLabelFontBold": {
        "title": "Bold",
        "description": "Draws the X axis title in a heavier weight. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.defaultGraphAxisXLabelFontBold": {
        "title": "Bold",
        "description": "Draws the X axis title in a heavier weight. The Y axis title uses this until you change it.",
        "help": null
    },
    "graph.axisXLabelRotation": {
        "title": "Rotation",
        "description": "Tilts this axis title by degrees. 0 keeps the words upright. When Bar Direction is Horizontal and this rotation is still the default, it starts at -90.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphAxisXLabelRotation": {
        "title": "Rotation",
        "description": "Tilts this axis title by degrees. 0 keeps the words upright. When Bar Direction is Horizontal and this rotation is still the default, it starts at -90.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.axisYLabelFont": {
        "title": "Font",
        "description": "Font used for the Y axis title. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.defaultGraphAxisYLabelFont": {
        "title": "Font",
        "description": "Font used for the Y axis title. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.axisYLabelFontSize": {
        "title": "Font Size",
        "description": "Text size for the Y axis title, in pixels. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.defaultGraphAxisYLabelFontSize": {
        "title": "Font Size",
        "description": "Text size for the Y axis title, in pixels. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.axisYLabelFontColor": {
        "title": "Color",
        "description": "Color of the Y axis title. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.defaultGraphAxisYLabelFontColor": {
        "title": "Color",
        "description": "Color of the Y axis title. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.axisYLabelFontOpacity": {
        "title": "Opacity",
        "description": "How solid the Y axis title is. 100 is opaque and 0 hides it. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.defaultGraphAxisYLabelFontOpacity": {
        "title": "Opacity",
        "description": "How solid the Y axis title is. 100 is opaque and 0 hides it. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.axisYLabelFontBold": {
        "title": "Bold",
        "description": "Draws the Y axis title in a heavier weight. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.defaultGraphAxisYLabelFontBold": {
        "title": "Bold",
        "description": "Draws the Y axis title in a heavier weight. Leave it unset to follow X Axis (Label).",
        "help": null
    },
    "graph.axisYLabelRotation": {
        "title": "Rotation",
        "description": "Tilts this axis title by degrees. The starting angle is -90 so the words run along a vertical axis. When Bar Direction is Horizontal and this rotation is still the default, it starts at 0. This does not copy the other title rotation.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphAxisYLabelRotation": {
        "title": "Rotation",
        "description": "Tilts this axis title by degrees. The starting angle is -90 so the words run along a vertical axis. When Bar Direction is Horizontal and this rotation is still the default, it starts at 0. This does not copy the other title rotation.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphAxisYFontSize": {
        "title": "Font Size",
        "description": "Text size for the labels on the vertical axis, in pixels.",
        "help": null
    },
    "graph.defaultGraphAxisYFontColor": {
        "title": "Color",
        "description": "Color of the labels on the vertical axis.",
        "help": null
    },
    "graph.defaultGraphAxisYFontOpacity": {
        "title": "Opacity",
        "description": "How solid the labels on the vertical axis are. 100 is opaque and 0 hides them.",
        "help": null
    },
    "graph.defaultGraphAxisYFontBold": {
        "title": "Bold",
        "description": "Draws the labels on the vertical axis in a heavier weight.",
        "help": null
    },
    "graph.textSize": {
        "title": "Font Size",
        "description": "Text size for the numbers in a text graph, in pixels.",
        "help": null
    },
    "graph.defaultGraphTextSize": {
        "title": "Font Size",
        "description": "Text size for the numbers in a text graph, in pixels.",
        "help": null
    },
    "graph.textColor": {
        "title": "Color",
        "description": "Color of the numbers in a text graph.",
        "help": null
    },
    "graph.defaultGraphTextColor": {
        "title": "Color",
        "description": "Color of the numbers in a text graph.",
        "help": null
    },
    "graph.textFontBold": {
        "title": "Bold",
        "description": "Draws the numbers in a text graph in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphTextFontBold": {
        "title": "Bold",
        "description": "Draws the numbers in a text graph in a heavier weight.",
        "help": null
    },
    "graph.defaultGraphType": {
        "title": "Graph Type",
        "description": "Line, smooth curve, stepped line, bars, or a text readout.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.defaultGraphSmoothingAmount": {
        "title": "Smoothing",
        "description": "How much a smooth line rounds the peaks. The stored samples stay the same.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "choosing-the-right-visual-style"
        }
    },
    "graph.defaultGraphLineW": {
        "title": "Line Width",
        "description": "Thickness of the graph line, in pixels.",
        "help": null
    },
    "graph.defaultGraphLineGaps": {
        "title": "Line Gaps",
        "description": "Breaks the line where a sample is missing instead of dropping to zero.",
        "help": null
    },
    "graph.defaultGraphBarDirection": {
        "title": "Bar Direction",
        "description": "Draws bars up from the baseline or out to the side.",
        "help": null
    },
    "graph.defaultGraphBarGroupMode": {
        "title": "Bar Series Layout",
        "description": "Determines how multiple bar series are arranged across graphs:\n• Side by Side: Divides each category slot into separate columns placed next to each other.\n• Stacked: Layers all series bars directly on top of each other at the same baseline position.",
        "help": null
    },
    "graph.defaultGraphBarStackGapStep": {
        "title": "Stacked Gap Step",
        "description": "Additional gap in pixels for each consecutive bar layered on top.",
        "help": null
    },
    "graph.defaultGraphBarGap": {
        "title": "Bar Gap",
        "description": "Space between bars, as a share of the bar width.",
        "help": null
    },
    "graph.defaultGraphBarRadius": {
        "title": "Bar Radius",
        "description": "Rounds the corners of the bars.",
        "help": null
    },
    "graph.defaultGraphNegMode": {
        "title": "Negative Bars",
        "description": "Draws values below the baseline, mirrors them upward, or hides them.",
        "help": null
    },
    "graph.defaultGraphUseBaseline": {
        "title": "Use Baseline",
        "description": "Fills from a chosen value instead of from zero. Handy for power that goes in and out.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphBaselineVal": {
        "title": "Baseline Value",
        "description": "The number the fill and the bars grow away from.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphDynamicFloor": {
        "title": "Dynamic Floor",
        "description": "Lets the bottom of the scale follow the lowest sample.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphDynamicCeiling": {
        "title": "Dynamic Ceiling",
        "description": "Lets the top of the scale follow the highest sample.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphOffX": {
        "title": "Graph Offset X",
        "description": "Nudges the plot left or right inside the widget, in pixels.",
        "help": null
    },
    "graph.defaultGraphOffY": {
        "title": "Graph Offset Y",
        "description": "Nudges the plot up or down inside the widget, in pixels.",
        "help": null
    },
    "graph.defaultGraphShowLegend": {
        "title": "Show Legend",
        "description": "Shows the series names beside or over the plot.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendPosition": {
        "title": "Legend Position",
        "description": "Where the legend sits around the plot.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendLayout": {
        "title": "Legend Layout",
        "description": "Stacks legend items or places them in a row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendSwatch": {
        "title": "Legend Swatch",
        "description": "Shape of the color chip next to each series name.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendShowContainer": {
        "title": "Legend Background",
        "description": "Draws a panel behind the legend.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendAutoSize": {
        "title": "Legend Auto Size",
        "description": "Sizes the legend from its labels. Turn it off to set a width and height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendWidth": {
        "title": "Legend Width",
        "description": "Width of the legend panel when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphLegendHeight": {
        "title": "Legend Height",
        "description": "Height of the legend panel when auto size is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "the-interactive-companion-legend"
        }
    },
    "graph.defaultGraphDurationPreset": {
        "title": "Time Period",
        "description": "How much time the graph shows, from a short window up to a full day.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphDurationCustomValue": {
        "title": "Custom Duration",
        "description": "Length of the time window when the period is set to custom.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphDurationCustomUnit": {
        "title": "Duration Unit",
        "description": "Minutes, hours, or days for a custom time window.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphFixedTimeWindow": {
        "title": "Fixed Time Period",
        "description": "Keeps the time window from sliding as new samples arrive.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphBufferMode": {
        "title": "Buffer Mode",
        "description": "Stream keeps the latest samples. Snapshot replaces the whole series from one payload.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphMaxPoints": {
        "title": "Maximum Samples",
        "description": "How many points a streaming graph keeps before the oldest one drops off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphReverseDirection": {
        "title": "Reverse Direction",
        "description": "New samples enter from the other side of the plot.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphTimelineAdvance": {
        "title": "Timeline Progress",
        "description": "Moves the plot with the clock, or only when a new sample arrives.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "managing-timelines-streaming-buffers"
        }
    },
    "graph.defaultGraphAnimDuration": {
        "title": "Draw Duration",
        "description": "How long the line or bars take to draw in, in milliseconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "animations-transitions"
        }
    },
    "graph.defaultGraphAnimStreamDuration": {
        "title": "Stream Duration",
        "description": "How long a new streaming point takes to ease into place.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "animations-transitions"
        }
    },
    "graph.defaultGraphAnimShimmer": {
        "title": "Shimmer",
        "description": "Adds a light sweep across the series while it draws.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "animations-transitions"
        }
    },
    "graph.defaultGraphAnimStaggerBars": {
        "title": "Stagger Bars",
        "description": "Draws bars one after another instead of all at once.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "animations-transitions"
        }
    },
    "graph.defaultGraphPointShow": {
        "title": "Show Points",
        "description": "Draws a dot on each sample.",
        "help": null
    },
    "graph.defaultGraphPointSize": {
        "title": "Point Size",
        "description": "Size of the dots on each sample, in pixels.",
        "help": null
    },
    "graph.defaultGraphShowPointValues": {
        "title": "Show Point Values",
        "description": "Prints the number next to samples on the plot.",
        "help": null
    },
    "graph.defaultGraphPointValuesHoverOnly": {
        "title": "Values on Hover",
        "description": "Shows point numbers only while the pointer is over the graph.",
        "help": null
    },
    "graph.defaultGraphPointValuesAbbreviate": {
        "title": "Abbreviate Point Values",
        "description": "Shows large point numbers as thousands and millions.",
        "help": null
    },
    "graph.defaultGraphPointValuesDecimals": {
        "title": "Point Decimals",
        "description": "How many digits to show after the decimal on point labels.",
        "help": null
    },
    "graph.defaultGraphPointValuesDistribution": {
        "title": "Point Value Distribution",
        "description": "Determines how value labels are distributed across the plot:\n• Time (Peaks & Troughs): Slices the timeline into sections and places labels at local peaks and valleys within each section.\n• Time (Uniform): Distributes labels evenly across time slices, selecting the data point closest to the center of each slice.\n• Point Step (Every N Points): Places labels strictly every Nth data point, anchored directly to data nodes.",
        "help": null
    },
    "graph.defaultGraphAutoPointValuesInterval": {
        "title": "Auto Point Interval",
        "description": "Automatically spaces point labels to prevent visual crowding.",
        "help": null
    },
    "graph.defaultGraphPointValuesTimeWidth": {
        "title": "Time Section Width (px)",
        "description": "Width in pixels of each time section column (for example 48px). Smaller widths display more values across the plot, while larger widths display fewer values.",
        "help": null
    },
    "graph.defaultGraphPointValuesStep": {
        "title": "Point Step",
        "description": "Spacing interval for value labels in Point Step mode. For example, 1 displays a value on every single node point, 2 on every other point, and 3 on every third point.",
        "help": null
    },
    "graph.defaultGraphPointValuesInterval": {
        "title": "Point Value Spacing",
        "description": "How often a point number is printed along the series.",
        "help": null
    },
    "graph.defaultGraphAxesSplit": {
        "title": "Separate Axis Styles",
        "description": "Lets the vertical axis use its own tick style instead of copying the horizontal axis.",
        "help": null
    },
    "graph.defaultGraphTickSplit": {
        "title": "Separate Grid Styles",
        "description": "Lets horizontal and vertical grid lines use different colors and weights.",
        "help": null
    },
    "graph.tickXSpacing": {
        "title": "Tick Spacing",
        "description": "Distance between vertical grid lines, in pixels.",
        "help": null
    },
    "graph.tickXSize": {
        "title": "Tick Length",
        "description": "Length of the tick marks on the horizontal axis.",
        "help": null
    },
    "graph.tickXThickness": {
        "title": "Grid Thickness",
        "description": "Thickness of the vertical grid lines.",
        "help": null
    },
    "graph.tickXColor": {
        "title": "Grid Color",
        "description": "Color of the vertical grid lines.",
        "help": null
    },
    "graph.tickXOffset": {
        "title": "Tick Offset",
        "description": "Nudges the tick marks in or out from the plot.",
        "help": null
    },
    "graph.defaultGraphTickXSpacing": {
        "title": "Tick Spacing",
        "description": "Distance between vertical grid lines, in pixels.",
        "help": null
    },
    "graph.defaultGraphTickXSize": {
        "title": "Tick Length",
        "description": "Length of the tick marks on the horizontal axis.",
        "help": null
    },
    "graph.defaultGraphTickXThickness": {
        "title": "Grid Thickness",
        "description": "Thickness of the vertical grid lines.",
        "help": null
    },
    "graph.defaultGraphTickXColor": {
        "title": "Grid Color",
        "description": "Color of the vertical grid lines.",
        "help": null
    },
    "graph.defaultGraphTickXOffset": {
        "title": "Tick Offset",
        "description": "Nudges the tick marks in or out from the plot.",
        "help": null
    },
    "graph.tickYSpacing": {
        "title": "Tick Count",
        "description": "How many horizontal grid lines to draw.",
        "help": null
    },
    "graph.tickYSize": {
        "title": "Tick Length",
        "description": "Length of the tick marks on the vertical axis.",
        "help": null
    },
    "graph.tickYThickness": {
        "title": "Grid Thickness",
        "description": "Thickness of the horizontal grid lines.",
        "help": null
    },
    "graph.tickYColor": {
        "title": "Grid Color",
        "description": "Color of the horizontal grid lines.",
        "help": null
    },
    "graph.tickYOffset": {
        "title": "Tick Offset",
        "description": "Nudges the tick marks in or out from the plot.",
        "help": null
    },
    "graph.tickYCount": {
        "title": "Tick Count",
        "description": "How many horizontal grid lines to draw.",
        "help": null
    },
    "graph.defaultGraphTickYSpacing": {
        "title": "Tick Count",
        "description": "How many horizontal grid lines to draw.",
        "help": null
    },
    "graph.defaultGraphTickYSize": {
        "title": "Tick Length",
        "description": "Length of the tick marks on the vertical axis.",
        "help": null
    },
    "graph.defaultGraphTickYThickness": {
        "title": "Grid Thickness",
        "description": "Thickness of the horizontal grid lines.",
        "help": null
    },
    "graph.defaultGraphTickYColor": {
        "title": "Grid Color",
        "description": "Color of the horizontal grid lines.",
        "help": null
    },
    "graph.defaultGraphTickYOffset": {
        "title": "Tick Offset",
        "description": "Nudges the tick marks in or out from the plot.",
        "help": null
    },
    "graph.defaultGraphTickYCount": {
        "title": "Tick Count",
        "description": "How many horizontal grid lines to draw.",
        "help": null
    },
    "graph.defaultGraphPositiveColorOpacity": {
        "title": "Positive Color Opacity",
        "description": "Default opacity percentage for positive lines and bars across graphs.",
        "help": null
    },
    "graph.defaultGraphNegativeColorOpacity": {
        "title": "Negative Color Opacity",
        "description": "Default opacity percentage for negative lines and bars across graphs.",
        "help": null
    },
    "graph.defaultGraphPositiveStartOpacity": {
        "title": "Positive Start Opacity",
        "description": "How solid the fill above the baseline is at one end.",
        "help": null
    },
    "graph.defaultGraphPositiveEndOpacity": {
        "title": "Positive End Opacity",
        "description": "How solid the fill above the baseline is at the other end.",
        "help": null
    },
    "graph.defaultGraphNegativeStartOpacity": {
        "title": "Negative Start Opacity",
        "description": "How solid the fill below the baseline is at one end.",
        "help": null
    },
    "graph.defaultGraphNegativeEndOpacity": {
        "title": "Negative End Opacity",
        "description": "How solid the fill below the baseline is at the other end.",
        "help": null
    },
    "graph.graphBarOutlineWidth": {
        "title": "Bar Outline Width",
        "description": "Thickness of the line around the bars. 0 hides the line.",
        "help": null
    },
    "graph.graphBarOutlineColor": {
        "title": "Positive Bar Outline",
        "description": "Color of the line around bars above the baseline.",
        "help": null
    },
    "graph.graphNegBarOutlineColor": {
        "title": "Negative Bar Outline",
        "description": "Color of the line around bars below the baseline.",
        "help": null
    },
    "icon.defaultIconSize": {
        "title": "Icon Size",
        "description": "Size of the icon, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance-effects"
        }
    },
    "icon.defaultIconBlink": {
        "title": "Blink",
        "description": "Flashes the icon while it is active.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance-effects"
        }
    },
    "icon.defaultIconAnimSpeed": {
        "title": "Blink Speed",
        "description": "How long one blink takes, in seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance-effects"
        }
    },
    "icon.defaultIconGlowOnActive": {
        "title": "Glow When Active",
        "description": "Draws a halo around the icon while it is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "3-appearance-effects"
        }
    },
    "icon.activated": {
        "title": "Sound",
        "description": "Sound played when the icon turns on. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "audio"
        }
    },
    "icon.deactivated": {
        "title": "Sound",
        "description": "Sound played when the icon turns off. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "icon",
            "anchor": "audio"
        }
    },
    "image.defaultImageFit": {
        "title": "Fit",
        "description": "How the picture sits in the box. Contain shows the whole image, and cover fills the box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.defaultImageProp": {
        "title": "Keep Proportions",
        "description": "Stops the picture from being stretched out of shape.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.defaultImageScale": {
        "title": "Scale",
        "description": "Zooms the picture inside the box, as a percent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.defaultImageOpacity": {
        "title": "Opacity",
        "description": "How solid the picture is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "2-appearance"
        }
    },
    "image.defaultImageFallbackUrl": {
        "title": "Fallback Image",
        "description": "Picture shown when the main address fails to load.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "image",
            "anchor": "1-data-source"
        }
    },
    "label.labelWAuto": {
        "title": "Auto Width",
        "description": "Sizes the label to its text. Turn it off to set a fixed width.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "2-layout-dimensions"
        }
    },
    "label.labelHAuto": {
        "title": "Auto Height",
        "description": "Sizes the label to its text. Turn it off to set a fixed height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "2-layout-dimensions"
        }
    },
    "label.labelDefaultWAuto": {
        "title": "Auto Width",
        "description": "Default for new labels. Sizes the box to the text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "2-layout-dimensions"
        }
    },
    "label.labelDefaultHAuto": {
        "title": "Auto Height",
        "description": "Default for new labels. Sizes the box to the text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "label",
            "anchor": "2-layout-dimensions"
        }
    },
    "lightgrid.lgCols": {
        "title": "Columns",
        "description": "How many light tiles sit in each row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgItemWidth": {
        "title": "Tile Width",
        "description": "Width of each light tile, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgItemHeight": {
        "title": "Tile Height",
        "description": "Height of each light tile, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgItemSpacing": {
        "title": "Tile Spacing",
        "description": "Gap between light tiles, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgAutoDeselect": {
        "title": "Auto Deselect",
        "description": "Closes the selected tile after a short wait.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgDeselectTime": {
        "title": "Deselect Time",
        "description": "How long a tile stays selected before it closes, in seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "4-tile-layout"
        }
    },
    "lightgrid.lgColTileBg": {
        "title": "Tile Background",
        "description": "Color behind each light name.",
        "help": null
    },
    "lightgrid.lgColTileHover": {
        "title": "Tile Hover Color",
        "description": "Color of a tile while it is pressed or hovered.",
        "help": null
    },
    "lightgrid.lgColTileText": {
        "title": "Light Name Color",
        "description": "Default color of the name on each tile.",
        "help": null
    },
    "lightgrid.lgTileBackgroundOpacity": {
        "title": "Tile Opacity",
        "description": "How solid the tile background is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "lightgrid.lgTileBlur": {
        "title": "Tile Blur",
        "description": "Frosts whatever shows through a tile. 0 is sharp.",
        "help": null
    },
    "lightgrid.lgIconSize": {
        "title": "Icon Size",
        "description": "Size of the icon on each tile, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "6-icons-appearance"
        }
    },
    "lightgrid.lgIconColOff": {
        "title": "Icon Color (Off)",
        "description": "Color of the tile icon while the light is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "6-icons-appearance"
        }
    },
    "lightgrid.lgIconColOn": {
        "title": "Icon Color (On)",
        "description": "Color of the tile icon while the light is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "6-icons-appearance"
        }
    },
    "lightgrid.lgIconColorize": {
        "title": "Tint Images",
        "description": "Recolors custom tile images with the icon color.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "6-icons-appearance"
        }
    },
    "lightgrid.lgUseLightColor": {
        "title": "Use Light Color",
        "description": "Colors the on icon with the lamp color instead of the icon color.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "6-icons-appearance"
        }
    },
    "lightgrid.lgColToggleOff": {
        "title": "Switch Color (Off)",
        "description": "Track color while a switch-mode tile is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "3-switch-output-mode-button-panel"
        }
    },
    "lightgrid.lgColToggleOn": {
        "title": "Switch Color (On)",
        "description": "Track color while a switch-mode tile is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "3-switch-output-mode-button-panel"
        }
    },
    "lightgrid.lgPopoverW": {
        "title": "Panel Width",
        "description": "Width of the color and brightness panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.lgPopoverH": {
        "title": "Panel Height",
        "description": "Height of the color and brightness panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.lgPresetCols": {
        "title": "Preset Columns",
        "description": "How many color presets sit in each row of the panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.lgPresetRows": {
        "title": "Preset Rows",
        "description": "How many rows of color presets the panel shows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.lgPresetGap": {
        "title": "Preset Gap",
        "description": "Space between color presets, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.lgPresetIndicators": {
        "title": "Color Indicators",
        "description": "Shows a small mark for color presets and white presets.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.defaultLightGridPresets": {
        "title": "Lighting Presets",
        "description": "The colors and white levels new light grids offer in the control panel.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "5-the-control-panel-popover"
        }
    },
    "lightgrid.tileOn": {
        "title": "Sound",
        "description": "Sound played when a tile turns on. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "audio"
        }
    },
    "lightgrid.tileOff": {
        "title": "Sound",
        "description": "Sound played when a tile turns off. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "audio"
        }
    },
    "lightgrid.panelOpen": {
        "title": "Sound",
        "description": "Sound played when the control panel opens. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "audio"
        }
    },
    "lightgrid.panelClose": {
        "title": "Sound",
        "description": "Sound played when the control panel closes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid",
            "anchor": "audio"
        }
    },
    "list.defaultListMaxLines": {
        "title": "Max Lines",
        "description": "How many rows to keep. Older rows drop off the end.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "1-data-behavior"
        }
    },
    "list.defaultListRawMode": {
        "title": "Raw Data",
        "description": "Shows the payload as it arrived, without parsing icons or checkboxes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "1-data-behavior"
        }
    },
    "list.defaultListShowIcons": {
        "title": "Show Icons",
        "description": "Draws the row icon when the payload includes one.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.defaultListIconSize": {
        "title": "Icon Size",
        "description": "Size of the icon on each row, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.defaultListIconColor": {
        "title": "Icon Color",
        "description": "Color of the row icons.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.defaultListIconGap": {
        "title": "Icon Gap",
        "description": "Space between the row icon and the text, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "5-icon"
        }
    },
    "list.defaultListShowTimestamp": {
        "title": "Show Timestamp",
        "description": "Prints the time each row was added.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.defaultListTimeFormat": {
        "title": "Time Format",
        "description": "How the time is written, such as hours and minutes or a full date.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.defaultListDateFormat": {
        "title": "Date Format",
        "description": "How the date is written next to the time.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.defaultListTime24h": {
        "title": "24-Hour Clock",
        "description": "Uses 00 to 23 instead of AM and PM.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "3-timestamp-format"
        }
    },
    "list.defaultListGap": {
        "title": "Row Spacing",
        "description": "Space between list rows, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.defaultListLineHeight": {
        "title": "Line Height",
        "description": "Line spacing inside each row. 1 is normal.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.lineHeight": {
        "title": "Line Height",
        "description": "Line spacing inside each row. 1 is normal.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.defaultListTextWrap": {
        "title": "Wrap Text",
        "description": "Lets a long row break onto more lines. Off keeps it on one line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.textWrap": {
        "title": "Wrap Text",
        "description": "Lets a long row break onto more lines. Off keeps it on one line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "4-appearance"
        }
    },
    "list.checkboxOn": {
        "title": "Sound",
        "description": "Sound played when a row is checked. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "audio"
        }
    },
    "list.checkboxOff": {
        "title": "Sound",
        "description": "Sound played when a row is unchecked. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "list",
            "anchor": "audio"
        }
    },
    "menu.menuIconSize": {
        "title": "Icon Size",
        "description": "Size of the icons on menu items, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuIconColOn": {
        "title": "Icon Color (On)",
        "description": "Color of item icons while that item is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuIconColOff": {
        "title": "Icon Color (Off)",
        "description": "Color of item icons while that item is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuIconAccentOn": {
        "title": "Icon Accent (On)",
        "description": "Second color for duotone icons while the item is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuIconAccentOff": {
        "title": "Icon Accent (Off)",
        "description": "Second color for duotone icons while the item is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuItemBgOn": {
        "title": "Item Background (On)",
        "description": "Fill behind an item while it is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuItemBgOff": {
        "title": "Item Background (Off)",
        "description": "Fill behind an item while it is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuItemBgHover": {
        "title": "Item Background (Hover)",
        "description": "Fill behind an item while it is hovered or pressed.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "5-appearance-text-typography"
        }
    },
    "menu.menuItemBgOnOpacity": {
        "title": "On Background Opacity",
        "description": "How solid the on-state item fill is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "menu.menuItemBgOffOpacity": {
        "title": "Off Background Opacity",
        "description": "How solid the off-state item fill is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "menu.menuItemBgHoverOpacity": {
        "title": "Hover Background Opacity",
        "description": "How solid the hover fill is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "menu.menuItemBlur": {
        "title": "Item Blur",
        "description": "Frosts whatever shows through a menu item. 0 is sharp.",
        "help": null
    },
    "menu.menuSpacerStyle": {
        "title": "Separator Style",
        "description": "A separator item can be an empty gap or a gap with a line.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "menu.menuSpacerAmount": {
        "title": "Separator Gap",
        "description": "Height or width of a separator item, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "menu.menuSpacerColor": {
        "title": "Separator Color",
        "description": "Color of the line inside a separator item.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "menu.menuDefaultLabelHint": {
        "title": "Label Hint",
        "description": "How a long item name is shortened, such as an ellipsis or a fade.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "3-menu-items"
        }
    },
    "menu.open": {
        "title": "Sound",
        "description": "Sound played when the menu opens. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "audio"
        }
    },
    "menu.close": {
        "title": "Sound",
        "description": "Sound played when the menu closes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "audio"
        }
    },
    "menu.select": {
        "title": "Sound",
        "description": "Sound played when a menu item is chosen. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "audio"
        }
    },
    "menu.toggleOn": {
        "title": "Sound",
        "description": "Sound played when a menu item turns on. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "audio"
        }
    },
    "menu.toggleOff": {
        "title": "Sound",
        "description": "Sound played when a menu item turns off. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "menu",
            "anchor": "audio"
        }
    },
    "host": {
        "title": "Broker Host",
        "description": "Address of the MQTT broker. Use http when the broker has no certificate.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "port": {
        "title": "WebSocket Port",
        "description": "Port the broker uses for WebSocket clients. 9001 is a common choice.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "useSSL": {
        "title": "Use SSL",
        "description": "Connects to the broker with a secure socket. Turn it off for a plain local broker.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "username": {
        "title": "Username",
        "description": "Name the broker expects. Leave it empty when the broker allows anonymous clients.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "password": {
        "title": "Password",
        "description": "Password for the broker user. Leave it empty when no password is set.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "clientId": {
        "title": "Client ID",
        "description": "Name this dashboard uses on the broker. Leave it empty to let the broker assign one.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "subTopic": {
        "title": "Subscribe Topic",
        "description": "Topic filter this dashboard listens to. A hash listens to every topic under that path.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "namespace": {
        "title": "Namespace",
        "description": "Optional prefix for Node-RED socket messages. Leave it empty unless your flow uses one.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "9-platform-connection"
        }
    },
    "interval": {
        "title": "Simulation Interval",
        "description": "How often the built-in demo driver publishes a new sample, in milliseconds.",
        "help": null
    },
    "stats_panel": {
        "title": "Statistics",
        "description": "Connection counts and message totals for the data driver.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "10-data-stream-explorer"
        }
    },
    "monitor_panel": {
        "title": "Live Monitor",
        "description": "Watch topics as payloads arrive, and copy a name into a binding.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "10-data-stream-explorer"
        }
    },
    "slider.defaultSliderVertical": {
        "title": "Vertical",
        "description": "Stands the slider on end. Off draws it left to right.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderShowVal": {
        "title": "Show Value",
        "description": "Prints the current number on the slider.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderAllowDecimals": {
        "title": "Allow Fractions",
        "description": "Lets the slider stop between whole numbers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderStepSize": {
        "title": "Fraction Step",
        "description": "Smallest fraction the slider will move when fractions are allowed.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderCustomDisplayRange": {
        "title": "Custom Display Range",
        "description": "Shows a different number than the one sent to your automation.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderDisplayMin": {
        "title": "Display Minimum",
        "description": "Lowest number shown on the readout when a custom display range is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderDisplayMax": {
        "title": "Display Maximum",
        "description": "Highest number shown on the readout when a custom display range is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderDisplayDecimalPlaces": {
        "title": "Decimal Places",
        "description": "How many digits to show after the decimal point.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderDisplayKeepTrailingZeros": {
        "title": "Keep Trailing Zeros",
        "description": "Keeps zeros at the end of the readout, so 20.50 stays 20.50.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "1-data-behavior"
        }
    },
    "slider.defaultSliderLabelLocation": {
        "title": "Caption Position",
        "description": "Where the caption sits around the track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "slider.defaultSliderValueLocation": {
        "title": "Value Position",
        "description": "Where the number sits around the track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "3-text-typography"
        }
    },
    "slider.defaultSliderTrackThick": {
        "title": "Track Height",
        "description": "Thickness of the empty track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderFillThick": {
        "title": "Fill Height",
        "description": "Thickness of the filled part of the track.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderTrackOpacity": {
        "title": "Track Opacity",
        "description": "How solid the empty track is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderFillOpacity": {
        "title": "Fill Opacity",
        "description": "How solid the filled part of the track is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderTrackBlur": {
        "title": "Track Blur",
        "description": "Frosts whatever shows through the track. 0 is sharp.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderThumbSz": {
        "title": "Thumb Size",
        "description": "Size of the knob you drag.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.defaultSliderThumbShadow": {
        "title": "Thumb Shadow",
        "description": "Draws a soft shadow under the knob.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "2-appearance"
        }
    },
    "slider.sliderColTrack": {
        "title": "Track Color",
        "description": "Color of the empty track.",
        "help": null
    },
    "slider.sliderColFill": {
        "title": "Fill Color",
        "description": "Color of the filled part of the track.",
        "help": null
    },
    "slider.sliderColThumb": {
        "title": "Thumb Color",
        "description": "Color of the knob.",
        "help": null
    },
    "slider.valueSent": {
        "title": "Sound",
        "description": "Sound played when the slider publishes a new value. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "slider",
            "anchor": "audio"
        }
    },
    "switch.defaultSwitchMode": {
        "title": "Mode",
        "description": "Toggle stays on or off. Push sends one press. Other modes cover hold and radio groups.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "1-mode-behavior"
        }
    },
    "switch.defaultSwitchStyle": {
        "title": "Visual Style",
        "description": "Look of the control, such as a switch, a button, or text only.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.defaultSwitchAlign": {
        "title": "Alignment",
        "description": "Where the button sits inside the widget box.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "4-visual-styles"
        }
    },
    "switch.defaultSwitchScale": {
        "title": "Scale",
        "description": "Grows or shrinks the whole control.",
        "help": null
    },
    "switch.defaultSwitchShowIcon": {
        "title": "Show Icon",
        "description": "Draws an icon on the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconOn": {
        "title": "Icon (On)",
        "description": "Phosphor icon used while the button is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconOnFilled": {
        "title": "Filled Icon (On)",
        "description": "Uses the filled Phosphor weight while the button is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconOffFilled": {
        "title": "Filled Icon (Off)",
        "description": "Uses the filled Phosphor weight while the button is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconSize": {
        "title": "Icon Size",
        "description": "Size of the button icon, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconOffX": {
        "title": "Icon Offset X",
        "description": "Nudges the icon left or right, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchIconOffY": {
        "title": "Icon Offset Y",
        "description": "Nudges the icon up or down, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.defaultSwitchLabelPos": {
        "title": "Caption Position",
        "description": "Where the caption sits around or inside the button.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "6-text-typography"
        }
    },
    "switch.defaultSwitchLabelHint": {
        "title": "Caption Hint",
        "description": "How a long caption is shortened, such as an ellipsis or a fade.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "6-text-typography"
        }
    },
    "switch.defaultSwitchBevel": {
        "title": "3D Bevel",
        "description": "Adds a raised edge so the button looks pressed into the surface.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "7-appearance-effects"
        }
    },
    "switch.switchColOn": {
        "title": "Background (On)",
        "description": "Fill color while the button is on.",
        "help": null
    },
    "switch.switchColOff": {
        "title": "Background (Off)",
        "description": "Fill color while the button is off.",
        "help": null
    },
    "switch.switchColHover": {
        "title": "Background (Hover)",
        "description": "Fill color while the button is hovered or pressed.",
        "help": null
    },
    "switch.switchBackgroundOpacity": {
        "title": "Background Opacity",
        "description": "How solid the button fill is. 100 is opaque and 0 is clear.",
        "help": null
    },
    "switch.switchButtonBlur": {
        "title": "Background Blur",
        "description": "Frosts whatever shows through the button. 0 is sharp.",
        "help": null
    },
    "switch.switchCornerRadius": {
        "title": "Button Radius",
        "description": "Rounds the corners of the button.",
        "help": null
    },
    "switch.switchButtonContentInset": {
        "title": "Content Inset",
        "description": "Space between the button edge and its icon or caption, in pixels.",
        "help": null
    },
    "switch.switchColThumb": {
        "title": "Thumb Color",
        "description": "Color of the knob on a switch-style control.",
        "help": null
    },
    "switch.switchIconColOn": {
        "title": "Icon Color (On)",
        "description": "Color of the icon while the button is on.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.switchIconColOff": {
        "title": "Icon Color (Off)",
        "description": "Color of the icon while the button is off.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.switchIconColHover": {
        "title": "Icon Color (Hover)",
        "description": "Color of the icon while the button is hovered.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "5-icons"
        }
    },
    "switch.switchGlow": {
        "title": "Glow",
        "description": "Draws a halo around the button.",
        "help": null
    },
    "switch.switchGlowColor": {
        "title": "Glow Color",
        "description": "Color of the halo around the button.",
        "help": null
    },
    "switch.switchGlowRadius": {
        "title": "Glow Radius",
        "description": "How far the halo spreads from the button.",
        "help": null
    },
    "switch.on": {
        "title": "Sound",
        "description": "Sound played when the switch turns on. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "audio"
        }
    },
    "switch.off": {
        "title": "Sound",
        "description": "Sound played when the switch turns off. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "audio"
        }
    },
    "switch.press": {
        "title": "Sound",
        "description": "Sound played when the button is pressed. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "audio"
        }
    },
    "switch.release": {
        "title": "Sound",
        "description": "Sound played when the button is released. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "switch",
            "anchor": "audio"
        }
    },
    "text.textMdTableStyle": {
        "title": "Table Style",
        "description": "Pick a table layout, from a plain grid to a calendar or a board.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdEqualTableColumnWidths": {
        "title": "Equal Column Widths",
        "description": "Gives every column the same width.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdSyncTableColumnWidths": {
        "title": "Align Columns",
        "description": "Lines up columns across tables that have the same number of columns.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableColumnWidthPx": {
        "title": "Fixed Column Width",
        "description": "Width used for every column, in pixels. 0 lets each column size itself.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableBorderRadius": {
        "title": "Table Corner Radius",
        "description": "Rounds the outer corners of the table, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableCellPadding": {
        "title": "Cell Padding",
        "description": "Space inside each table cell, in pixels.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableBorderColor": {
        "title": "Table Border",
        "description": "Color of the lines around table cells.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableBorderOpacity": {
        "title": "Border Opacity",
        "description": "How solid the table lines are. 100 is opaque and 0 hides them.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableHeaderBg": {
        "title": "Header Background",
        "description": "Fill behind the header row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableHeaderBgOpacity": {
        "title": "Header Opacity",
        "description": "How solid the header fill is. 100 is opaque and 0 is clear.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableHeaderAccentBg": {
        "title": "Header Accent",
        "description": "Second header color, used by table styles that stripe the header.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableHeaderAccentBgOpacity": {
        "title": "Header Accent Opacity",
        "description": "How solid the header accent is. 100 is opaque and 0 is clear.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableRowBg": {
        "title": "Row Background",
        "description": "Fill behind ordinary table rows.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableRowBgOpacity": {
        "title": "Row Opacity",
        "description": "How solid the row fill is. 100 is opaque and 0 is clear.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableRowAltBg": {
        "title": "Alternate Row",
        "description": "Fill behind every other table row.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdTableRowAltBgOpacity": {
        "title": "Alternate Row Opacity",
        "description": "How solid the alternate row fill is. 100 is opaque and 0 is clear.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdSeparatorColor": {
        "title": "Separator Color",
        "description": "Color of horizontal rules and theme separators in the text.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdSeparatorOpacity": {
        "title": "Separator Opacity",
        "description": "How solid those separator lines are. 100 is opaque and 0 hides them.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdHrColor": {
        "title": "Horizontal Rule",
        "description": "Color of a markdown horizontal rule.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdHrOpacity": {
        "title": "Rule Opacity",
        "description": "How solid horizontal rules are. 100 is opaque and 0 hides them.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdIconColor": {
        "title": "Icon Color",
        "description": "Color of Phosphor icons written in the markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdIconOpacity": {
        "title": "Icon Opacity",
        "description": "How solid those icons are. 100 is opaque and 0 hides them.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdIconAccentColor": {
        "title": "Icon Accent",
        "description": "Second color for duotone icons written in the markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdIconAccentOpacity": {
        "title": "Icon Accent Opacity",
        "description": "How solid the duotone second color is. 100 is opaque and 0 hides it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdIconWeight": {
        "title": "Icon Style",
        "description": "Phosphor weight used for icons written in the markdown.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdBlock1Color": {
        "title": "Block 1 Color",
        "description": "Color of the first themed block, such as a callout or calendar band.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdBlock2Color": {
        "title": "Block 2 Color",
        "description": "Color of the second themed block.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdBlock3Color": {
        "title": "Block 3 Color",
        "description": "Color of the third themed block.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdBlock4Color": {
        "title": "Block 4 Color",
        "description": "Color of the fourth themed block.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdCalendarWeekStart": {
        "title": "Week Start",
        "description": "Which day a calendar table treats as the first day of the week.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "2-markdown"
        }
    },
    "text.textMdLinkTarget": {
        "title": "Link Open Behavior",
        "description": "Opens markdown links in this tab, a new tab, or as the dashboard decides.",
        "help": null
    },
    "text.textMdAutoFitText": {
        "title": "Auto-Fit Text",
        "description": "Shrinks the text so it stays inside the widget.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "1-text-settings"
        }
    },
    "text.textMdOverflowScroll": {
        "title": "Scroll Overflow",
        "description": "Lets you scroll text that does not fit, instead of clipping it.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "1-text-settings"
        }
    },
    "text.textMdTextWrap": {
        "title": "Wrap Text",
        "description": "Breaks long lines onto the next line. Off keeps each line intact.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "1-text-settings"
        }
    },
    "text.contentAnimationOnLiveTopics": {
        "title": "Animate Live Text",
        "description": "Replays the text animation when an inline topic inside the markdown changes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "animations-effects"
        }
    },
    "text.defaultTextContentAnimationOnLiveTopics": {
        "title": "Animate Live Text",
        "description": "Default for new text widgets. Replays the animation when an inline topic changes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "animations-effects"
        }
    },
    "text.textChange": {
        "title": "Sound",
        "description": "Sound played when the text content changes. Leave it empty to stay silent.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "text",
            "anchor": "audio"
        }
    },
    "videostream.url": {
        "title": "Stream URL",
        "description": "Address of the video stream or snapshot.",
        "help": null
    },
    "videostream.zoom": {
        "title": "Zoom",
        "description": "Magnifies the picture inside the box, as a percent.",
        "help": null
    },
    "videostream.defaultVsZoom": {
        "title": "Zoom",
        "description": "Default magnification for new video widgets, as a percent.",
        "help": null
    },
    "videostream.panX": {
        "title": "Pan X",
        "description": "Slides the zoomed picture left or right.",
        "help": null
    },
    "videostream.panY": {
        "title": "Pan Y",
        "description": "Slides the zoomed picture up or down.",
        "help": null
    },
    "videostream.defaultVsPanX": {
        "title": "Pan X",
        "description": "Default horizontal pan for new video widgets.",
        "help": null
    },
    "videostream.defaultVsPanY": {
        "title": "Pan Y",
        "description": "Default vertical pan for new video widgets.",
        "help": null
    },
    "videostream.showLiveInEditor": {
        "title": "Show Live in Editor",
        "description": "Plays the stream while you are editing. Off shows a still stand-in so the editor stays light.",
        "help": null
    },
    "videostream.defaultVsShowLiveInEditor": {
        "title": "Show Live in Editor",
        "description": "Default for new video widgets. Plays the stream in the editor when on.",
        "help": null
    },
    "battery.defaultBatteryOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the battery, in pixels. 0 hides the line.",
        "help": null
    },
    "gauge.defaultGaugeTrackOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the track, in pixels. 0 hides the line.",
        "help": null
    },
    "gauge.defaultGaugeTrackOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the track.",
        "help": null
    },
    "gauge.defaultGaugeTrackOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the track is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "gauge.defaultGaugeTrackInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the track, in pixels. 0 turns the halo off.",
        "help": null
    },
    "gauge.defaultGaugeTrackInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the track.",
        "help": null
    },
    "gauge.defaultGaugeTrackInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the track is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "gauge.defaultGaugeBarOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the value bar, in pixels. 0 hides the line.",
        "help": null
    },
    "gauge.defaultGaugeBarOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the value bar.",
        "help": null
    },
    "gauge.defaultGaugeBarOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the value bar is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "gauge.defaultGaugeBarInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the value bar, in pixels. 0 turns the halo off.",
        "help": null
    },
    "gauge.defaultGaugeBarInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the value bar.",
        "help": null
    },
    "gauge.defaultGaugeBarInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the value bar is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "lightgrid.lgTileOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around each light tile, in pixels. 0 hides the line.",
        "help": null
    },
    "lightgrid.lgTileOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around each light tile.",
        "help": null
    },
    "lightgrid.lgTileOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around each light tile is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "lightgrid.lgTileInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside each light tile, in pixels. 0 turns the halo off.",
        "help": null
    },
    "lightgrid.lgTileInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside each light tile.",
        "help": null
    },
    "lightgrid.lgTileInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside each light tile is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "menu.menuItemOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around each menu item, in pixels. 0 hides the line.",
        "help": null
    },
    "menu.menuItemOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around each menu item.",
        "help": null
    },
    "menu.menuItemOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around each menu item is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "menu.menuItemInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside each menu item, in pixels. 0 turns the halo off.",
        "help": null
    },
    "menu.menuItemInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside each menu item.",
        "help": null
    },
    "menu.menuItemInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside each menu item is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "slider.defaultSliderTrackOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the track, in pixels. 0 hides the line.",
        "help": null
    },
    "slider.defaultSliderTrackOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the track.",
        "help": null
    },
    "slider.defaultSliderTrackOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the track is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "slider.defaultSliderTrackInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the track, in pixels. 0 turns the halo off.",
        "help": null
    },
    "slider.defaultSliderTrackInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the track.",
        "help": null
    },
    "slider.defaultSliderTrackInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the track is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "slider.defaultSliderFillOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the filled part of the track, in pixels. 0 hides the line.",
        "help": null
    },
    "slider.defaultSliderFillOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the filled part of the track.",
        "help": null
    },
    "slider.defaultSliderFillOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the filled part of the track is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "slider.defaultSliderFillInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the filled part of the track, in pixels. 0 turns the halo off.",
        "help": null
    },
    "slider.defaultSliderFillInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the filled part of the track.",
        "help": null
    },
    "slider.defaultSliderFillInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the filled part of the track is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "slider.defaultSliderThumbOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the thumb, in pixels. 0 hides the line.",
        "help": null
    },
    "slider.defaultSliderThumbOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the thumb.",
        "help": null
    },
    "slider.defaultSliderThumbOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the thumb is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "slider.defaultSliderThumbInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the thumb, in pixels. 0 turns the halo off.",
        "help": null
    },
    "slider.defaultSliderThumbInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the thumb.",
        "help": null
    },
    "slider.defaultSliderThumbInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the thumb is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "switch.switchThumbOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the thumb, in pixels. 0 hides the line.",
        "help": null
    },
    "switch.switchThumbOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the thumb.",
        "help": null
    },
    "switch.switchThumbOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the thumb is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "switch.switchThumbInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the thumb, in pixels. 0 turns the halo off.",
        "help": null
    },
    "switch.switchThumbInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the thumb.",
        "help": null
    },
    "switch.switchThumbInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the thumb is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "switch.switchOutlineWidth": {
        "title": "Outline Width",
        "description": "Thickness of the line around the button, in pixels. 0 hides the line.",
        "help": null
    },
    "switch.switchOutlineColor": {
        "title": "Outline Color",
        "description": "Color of the line around the button.",
        "help": null
    },
    "switch.switchOutlineOpacity": {
        "title": "Outline Opacity",
        "description": "How solid the line around the button is. 100 is fully opaque and 0 hides it.",
        "help": null
    },
    "switch.switchButtonInnerGlow": {
        "title": "Inner Glow",
        "description": "Width of the soft halo inside the button face, in pixels. 0 turns the halo off.",
        "help": null
    },
    "switch.switchButtonInnerGlowColor": {
        "title": "Inner Glow Color",
        "description": "Color of the soft halo inside the button face.",
        "help": null
    },
    "switch.switchButtonInnerGlowOpacity": {
        "title": "Inner Glow Opacity",
        "description": "How strong the halo inside the button face is. 100 is solid and 0 is invisible.",
        "help": null
    },
    "defaultGraphPointValuesDistribution": {
        "title": "Default Graph Point Values Distribution",
        "description": "Determines how value labels are distributed across the plot:\n• Time (Peaks & Troughs): Slices the timeline into sections and places labels at local peaks and valleys within each section.\n• Time (Uniform): Distributes labels evenly across time slices, selecting the data point closest to the center of each slice.\n• Point Step (Every N Points): Places labels strictly every Nth data point, anchored directly to data nodes.",
        "help": null
    },
    "graph.showAxisX": {
        "title": "Show X Axis",
        "description": "Displays horizontal time or category labels along the bottom of the graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphShowAxisX": {
        "title": "Show X Axis",
        "description": "Displays horizontal time or category labels along the bottom of the graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.timeFormat": {
        "title": "X Axis Format",
        "description": "Determines how horizontal axis timestamps and categories are displayed:\n• Datapoints: Displays sequential numeric index numbers for each incoming data entry.\n• Text Labels: Formats axis markers using string category names from incoming data.\n• Date Hours: Displays combined calendar date and hour timestamps.\n• Date: Displays calendar day and month values without clock times.\n• Hours: Displays only the hour component of incoming readings.\n• Hours:Minutes: Standard time format displaying hours and minutes.\n• Hours:Minutes:Seconds: High-precision time format including seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphTimeFormat": {
        "title": "X Axis Format",
        "description": "Determines how horizontal axis timestamps and categories are displayed:\n• Datapoints: Displays sequential numeric index numbers for each incoming data entry.\n• Text Labels: Formats axis markers using string category names from incoming data.\n• Date Hours: Displays combined calendar date and hour timestamps.\n• Date: Displays calendar day and month values without clock times.\n• Hours: Displays only the hour component of incoming readings.\n• Hours:Minutes: Standard time format displaying hours and minutes.\n• Hours:Minutes:Seconds: High-precision time format including seconds.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.dateFormat": {
        "title": "Date Format",
        "description": "Sets the calendar date order and separator format when dates are displayed on the horizontal axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphDateFormat": {
        "title": "Date Format",
        "description": "Sets the calendar date order and separator format when dates are displayed on the horizontal axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.time24h": {
        "title": "24 Hour Clock",
        "description": "Formats horizontal axis clock times using 24-hour notation instead of 12-hour AM and PM periods.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphTime24h": {
        "title": "24 Hour Clock",
        "description": "Formats horizontal axis clock times using 24-hour notation instead of 12-hour AM and PM periods.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.convertToLocalTime": {
        "title": "Convert to Local Time",
        "description": "Automatically converts UTC timestamps from incoming sensor feeds to your local device timezone.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphConvertToLocalTime": {
        "title": "Convert to Local Time",
        "description": "Automatically converts UTC timestamps from incoming sensor feeds to your local device timezone.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.timeOffset": {
        "title": "Manual Time Offset",
        "description": "Applies a minute-based time shift to compensate for sensor clock discrepancies or remote server time zones.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphTimeOffset": {
        "title": "Manual Time Offset",
        "description": "Applies a minute-based time shift to compensate for sensor clock discrepancies or remote server time zones.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisWidthX": {
        "title": "X Axis Fixed Width",
        "description": "Enforces an exact pixel height for the horizontal axis container, or 0 for automatic spacing.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisWidthX": {
        "title": "X Axis Fixed Width",
        "description": "Enforces an exact pixel height for the horizontal axis container, or 0 for automatic spacing.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisOffY": {
        "title": "X Axis Spacing",
        "description": "Adjusts vertical pixel distance between horizontal axis labels and the bottom plot boundary.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisOffY": {
        "title": "X Axis Spacing",
        "description": "Adjusts vertical pixel distance between horizontal axis labels and the bottom plot boundary.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.autoAxisResX": {
        "title": "Auto X Axis Interval",
        "description": "Dynamically adjusts label spacing along the horizontal axis to prevent text overlap as the graph resizes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAutoAxisResX": {
        "title": "Auto X Axis Interval",
        "description": "Dynamically adjusts label spacing along the horizontal axis to prevent text overlap as the graph resizes.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisResX": {
        "title": "X Axis Interval",
        "description": "Specifies the exact step interval or point count between successive horizontal axis labels when auto interval is disabled.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisResX": {
        "title": "X Axis Interval",
        "description": "Specifies the exact step interval or point count between successive horizontal axis labels when auto interval is disabled.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisXRotation": {
        "title": "Rotation",
        "description": "Tilts the category-axis numbers by degrees. 0 keeps them upright. The chart margin grows so the numbers stay on the canvas. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.defaultGraphAxisXRotation": {
        "title": "Rotation",
        "description": "Tilts the category-axis numbers by degrees. 0 keeps them upright. The chart margin grows so the numbers stay on the canvas. Horizontal bars rename this group to the Y axis.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.showAxisY": {
        "title": "Show Y Axis",
        "description": "Displays vertical value scale numbers and tick markings along the side of the graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphShowAxisY": {
        "title": "Show Y Axis",
        "description": "Displays vertical value scale numbers and tick markings along the side of the graph.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.roundingMode": {
        "title": "Y Axis Scale Mode",
        "description": "Determines how vertical axis scale increments and boundary values are calculated:\n• Fit Data Range (Exact Min/Max): Sets vertical axis limits strictly to your minimum and maximum values.\n• Clean Steps (1, 2, 5...): Automatically adjusts scale ticks to user-friendly steps like 1, 2, 5, or 10.\n• Whole Numbers Only (Counts): Constrains scale intervals strictly to integer counts without fractions.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphRoundingMode": {
        "title": "Y Axis Scale Mode",
        "description": "Determines how vertical axis scale increments and boundary values are calculated:\n• Fit Data Range (Exact Min/Max): Sets vertical axis limits strictly to your minimum and maximum values.\n• Clean Steps (1, 2, 5...): Automatically adjusts scale ticks to user-friendly steps like 1, 2, 5, or 10.\n• Whole Numbers Only (Counts): Constrains scale intervals strictly to integer counts without fractions.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.decimals": {
        "title": "Y Axis Decimals",
        "description": "Sets the number of decimal digits displayed on vertical axis value numbers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.abbreviateLargeValues": {
        "title": "Abbreviate Large Values (k, M)",
        "description": "Shows large value-axis numbers as thousands and millions, such as 12.5k or 3.2M. Turn it off to print the full number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "clean-numbers-tilted-labels"
        }
    },
    "defaultGraphDecimals": {
        "title": "Y Axis Decimals",
        "description": "Sets the number of decimal digits displayed on vertical axis value numbers.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAbbreviateLargeValues": {
        "title": "Abbreviate Large Values (k, M)",
        "description": "Shows large value-axis numbers as thousands and millions, such as 12.5k or 3.2M. Turn it off to print the full number.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "clean-numbers-tilted-labels"
        }
    },
    "graph.headroom": {
        "title": "Headroom Percentage",
        "description": "Adds percentage headroom above and below data limits to prevent plot peaks and valleys from touching chart borders.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphHeadroom": {
        "title": "Headroom Percentage",
        "description": "Adds percentage headroom above and below data limits to prevent plot peaks and valleys from touching chart borders.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisWidthY": {
        "title": "Y Axis Fixed Width",
        "description": "Enforces an exact pixel width for the vertical axis sidebar, or 0 for automatic sizing based on number width.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisWidthY": {
        "title": "Y Axis Fixed Width",
        "description": "Enforces an exact pixel width for the vertical axis sidebar, or 0 for automatic sizing based on number width.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisOffX": {
        "title": "Y Axis Spacing",
        "description": "Adjusts horizontal pixel clearance between vertical axis numbers and the plot line grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisOffX": {
        "title": "Y Axis Spacing",
        "description": "Adjusts horizontal pixel clearance between vertical axis numbers and the plot line grid.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.autoAxisResY": {
        "title": "Auto Y Axis Line Count",
        "description": "Automatically calculates the optimal number of horizontal grid lines based on chart height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAutoAxisResY": {
        "title": "Auto Y Axis Line Count",
        "description": "Automatically calculates the optimal number of horizontal grid lines based on chart height.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisResY": {
        "title": "Y Axis Line Count",
        "description": "Sets the explicit number of horizontal grid lines and vertical labels when auto line count is disabled.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphAxisResY": {
        "title": "Y Axis Line Count",
        "description": "Sets the explicit number of horizontal grid lines and vertical labels when auto line count is disabled.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.axisXLabel": {
        "title": "X Axis Label",
        "description": "Words drawn along the category axis, outside the tick labels. Leave this empty to hide the title. Horizontal bars rename this to Y Axis Label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "defaultGraphAxisXLabel": {
        "title": "X Axis Label",
        "description": "Words drawn along the category axis, outside the tick labels. Leave this empty to hide the title. Horizontal bars rename this to Y Axis Label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.axisYLabel": {
        "title": "Y Axis Label",
        "description": "Words drawn along the value axis, outside the tick numbers. Leave this empty to hide the title. Horizontal bars rename this to X Axis Label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "defaultGraphAxisYLabel": {
        "title": "Y Axis Label",
        "description": "Words drawn along the value axis, outside the tick numbers. Leave this empty to hide the title. Horizontal bars rename this to X Axis Label.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph",
            "anchor": "scales-limits-friendly-axis-numbers"
        }
    },
    "graph.showTickX": {
        "title": "Show X Axis Tick Marks",
        "description": "Displays small tick mark indicators along the horizontal axis line at each time step.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphShowTickX": {
        "title": "Show X Axis Tick Marks",
        "description": "Displays small tick mark indicators along the horizontal axis line at each time step.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "graph.showTickY": {
        "title": "Show Y Axis Tick Marks",
        "description": "Displays small tick mark indicators along the vertical axis line at each value step.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "defaultGraphShowTickY": {
        "title": "Show Y Axis Tick Marks",
        "description": "Displays small tick mark indicators along the vertical axis line at each value step.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "graph"
        }
    },
    "lightgrid.lgLightNameOffX": {
        "title": "Light Name Offset X",
        "description": "Adjusts horizontal pixel position of the light channel label within each grid tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "lightgrid.lgLightNameOffY": {
        "title": "Light Name Offset Y",
        "description": "Adjusts vertical pixel position of the light channel label within each grid tile.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "lightgrid"
        }
    },
    "locale": {
        "title": "Language & Locale",
        "description": "Sets the global display language for dates, weekdays, months, countdown timers, and clock labels across the dashboard:\n• Auto (Browser Default): Automatically detects the language from the tablet or browser settings.\n• Built-in Languages: Applies one of the 13 included language dictionaries across all widgets.\n• Saved Custom Presets: Applies a named custom translation preset saved in the editor.\n• Custom / Edit Translations: Opens the translation editor to customize individual words and units.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "13-regional-localization"
        }
    },
    "editTranslations": {
        "title": "Edit Custom Translations",
        "description": "Opens the Custom Language & Translations dialog where you can customize countdown units (years, days, hours, minutes, seconds), custom ending text when elapsed, clock labels, months, and weekdays, or save reusable language presets.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "13-regional-localization"
        }
    },
    "timeFormat": {
        "title": "Time Format",
        "description": "Sets the global 12-hour or 24-hour clock preference inherited by Clock, List, and Graph widgets:\n• Auto (From Locale): Uses the standard 12-hour or 24-hour clock convention for the active language.\n• 24-Hour (14:30): Displays hours from 00 to 23 across all widgets.\n• 12-Hour (2:30 PM): Displays hours from 1 to 12 with localized AM and PM indicators.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "13-regional-localization"
        }
    },
    "dateFormat": {
        "title": "Date Format",
        "description": "Sets the global calendar date order inherited by List and Graph widgets when their date format is set to Auto:\n• Auto (From Locale): Selects the natural day, month, and year order for the active language.\n• DD-MM-YYYY: Day, month, and four-digit year separated by hyphens (31-12-2026).\n• DD/MM/YYYY: Day, month, and four-digit year separated by slashes (31/12/2026).\n• MM/DD/YYYY: Month, day, and four-digit year separated by slashes (12/31/2026).\n• YYYY-MM-DD: ISO year, month, and day order (2026-12-31).\n• DD MMM YYYY: Day, short localized month name, and year (31 Dec 2026).",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "13-regional-localization"
        }
    },
    "firstDayOfWeek": {
        "title": "First Day of Week",
        "description": "Sets the starting weekday column for markdown calendars in Text widgets and ISO week calculations:\n• Auto (From Locale): Starts the week on Monday or Sunday based on the active language convention.\n• Monday: Starts every calendar week on Monday.\n• Sunday: Starts every calendar week on Sunday.",
        "help": {
            "topic": "Editor Interface Guide",
            "anchor": "13-regional-localization"
        }
    },
    "clock.locale": {
        "title": "Language Override",
        "description": "Sets the language used for weekday names, month names, week prefixes, and flip clock unit labels on this clock widget. Choose Auto to follow the Master Dashboard Language & Locale setting.",
        "help": {
            "topic": "Widgets",
            "widgetSub": "clock"
        }
    },
    "master.theme": {
        "title": "Theme",
        "description": "Selects the active color palette and visual styling preset applied across dashboard widgets. You can link this setting to a data topic to switch themes dynamically, such as automatically adapting palettes based on the time of day or activating custom event themes.",
        "help": {
            "topic": "Styling & Layering",
            "anchor": "2-themes-theme-explorer"
        }
    }
};

    global.EditorTooltipData = SETTINGS_METADATA;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SETTINGS_METADATA;
    }
})(typeof window !== 'undefined' ? window : this);
