"""Constants for the Dashboard Studio integration."""

DOMAIN = "dashboard_studio"

EVENT_TRIGGER = "dashboard_studio_trigger"
EVENT_LOADED = "dashboard_studio_loaded"
EVENT_SAVED = "dashboard_studio_saved"
EVENT_PAGE_OPENED = "dashboard_studio_page_opened"

SERVICE_SEND = "send"
SERVICE_SEND_INSIGHTS = "send_insights"
SERVICE_SEND_INSIGHTS_ADVANCED = "send_insights_advanced"
SERVICE_RELOAD = "reload"
SERVICE_LOAD_FILTER_ICAL = "load_filter_ical"
SERVICE_WEBCAL_TO_MARKDOWN = "webcal_to_markdown"
SERVICE_COMBINE_ICAL_DATA = "combine_ical_data"
SERVICE_FETCH_RSS_MARKDOWN = "fetch_rss_markdown"

STORAGE_VERSION = 1
STORAGE_KEY = "dashboard_studio.config"

WS_PATH = "/api/dashboard_studio/ws"
APP_PATH = "/dashboard_studio"
SETUP_PATH = "/dashboard_studio/setup"
ADMIN_API_PATH = "/api/dashboard_studio/admin"

PANEL_APP = "dashboard-studio"
PANEL_SETUP = "dashboard-studio-setup"

LIGHT_COMPOSITE_CAP_ID = "light_state_json"
LIGHT_SINGLE_CAPS = frozenset(
    {
        "onoff",
        "dim",
        "light_hue",
        "light_saturation",
        "light_temperature",
        "light_mode",
    }
)

HELPER_DOMAINS = frozenset(
    {
        "input_boolean",
        "input_number",
        "input_text",
        "input_select",
        "input_datetime",
        "counter",
        "timer",
    }
)

FLOW_DOMAINS = frozenset({"automation", "script"})
MOOD_DOMAINS = frozenset({"scene"})
