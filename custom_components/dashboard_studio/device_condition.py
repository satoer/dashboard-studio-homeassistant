"""Device conditions for Dashboard Studio (Home Assistant equivalent of Homey condition flowcards)."""
from __future__ import annotations

import re
from typing import Any

import voluptuous as vol
from homeassistant.const import CONF_CONDITION, CONF_DEVICE_ID, CONF_DOMAIN, CONF_TYPE
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.condition import ConditionCheckerType
from homeassistant.helpers.typing import ConfigType, TemplateVarsType

from .const import DOMAIN

CONF_DASHBOARD = "dashboard"
CONF_PAGE = "page"

CONDITION_TYPE_IS_OPEN = "dashboard_is_open"
CONDITION_TYPE_IS_OPEN_PAGE = "dashboard_is_open_page"

CONDITION_TYPES = {
    CONDITION_TYPE_IS_OPEN,
    CONDITION_TYPE_IS_OPEN_PAGE,
}

CONDITION_SCHEMA = cv.DEVICE_CONDITION_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In(CONDITION_TYPES),
        vol.Optional(CONF_DASHBOARD): cv.string,
        vol.Optional(CONF_PAGE): cv.string,
    }
)


def _slugify_dashboard(name: str) -> str:
    clean = re.sub(r"\.json$", "", (name or "").strip(), flags=re.IGNORECASE).lower()
    slug = re.sub(r"[^a-z0-9]+", "_", clean).strip("_")
    return slug or "default"


async def async_get_conditions(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, Any]]:
    """List device conditions for Dashboard Studio."""
    base = {
        CONF_CONDITION: "device",
        CONF_DEVICE_ID: device_id,
        CONF_DOMAIN: DOMAIN,
    }
    return [
        {**base, CONF_TYPE: CONDITION_TYPE_IS_OPEN},
        {**base, CONF_TYPE: CONDITION_TYPE_IS_OPEN_PAGE},
    ]


async def async_get_condition_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """List condition capabilities."""
    cond_type = config.get(CONF_TYPE)
    if cond_type == CONDITION_TYPE_IS_OPEN:
        return {
            "extra_fields": vol.Schema(
                {
                    vol.Required(CONF_DASHBOARD, default="default"): str,
                }
            )
        }
    if cond_type == CONDITION_TYPE_IS_OPEN_PAGE:
        return {
            "extra_fields": vol.Schema(
                {
                    vol.Required(CONF_DASHBOARD, default="default"): str,
                    vol.Required(CONF_PAGE, default="1"): str,
                }
            )
        }
    return {}


@callback
def async_condition_from_config(
    hass: HomeAssistant, config: ConfigType
) -> ConditionCheckerType:
    """Evaluate whether a dashboard (and optional page) is currently open."""
    cond_type = config.get(CONF_TYPE)
    dashboard = str(config.get(CONF_DASHBOARD, "default")).strip()
    page = str(config.get(CONF_PAGE, "")).strip()
    slug = _slugify_dashboard(dashboard)
    entity_id = f"binary_sensor.dashboard_studio_{slug}_open"

    def _page_matches(val: Any) -> bool:
        target = page.lower()
        s = str(val or "").strip().lower()
        if s == target:
            return True
        if target.isdigit() and s.isdigit():
            return int(target) == int(s)
        return False

    @callback
    def test_is_open(
        hass: HomeAssistant, variables: TemplateVarsType = None
    ) -> bool:
        state = hass.states.get(entity_id)
        if state is None or state.state != "on":
            return False
        if cond_type == CONDITION_TYPE_IS_OPEN_PAGE and page:
            current_page = state.attributes.get("page")
            if _page_matches(current_page):
                return True
            active_pages = state.attributes.get("active_pages", [])
            if isinstance(active_pages, list):
                return any(_page_matches(p) for p in active_pages)
            return False
        return True

    return test_is_open
