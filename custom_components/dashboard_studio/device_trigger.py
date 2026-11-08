"""Device triggers for Dashboard Studio (Home Assistant equivalent of Homey trigger flowcards)."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.device_automation import DEVICE_TRIGGER_BASE_SCHEMA
from homeassistant.components.homeassistant.triggers import event as event_trigger
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_PLATFORM, CONF_TYPE
from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.trigger import TriggerActionType, TriggerInfo
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    EVENT_LOADED,
    EVENT_PAGE_OPENED,
    EVENT_SAVED,
    EVENT_TRIGGER,
)

CONF_TOPIC = "topic"
CONF_NAME = "name"
CONF_DASHBOARD = "dashboard"
CONF_PAGE = "page"

TRIGGER_TYPE_WIDGET_TRIGGER = "dashboard_trigger"
TRIGGER_TYPE_DASHBOARD_LOADED = "dashboard_loaded"
TRIGGER_TYPE_DASHBOARD_SAVED = "dashboard_saved"
TRIGGER_TYPE_PAGE_OPENED = "dashboard_page_opened"

TRIGGER_TYPES = {
    TRIGGER_TYPE_WIDGET_TRIGGER,
    TRIGGER_TYPE_DASHBOARD_LOADED,
    TRIGGER_TYPE_DASHBOARD_SAVED,
    TRIGGER_TYPE_PAGE_OPENED,
}

TRIGGER_SCHEMA = DEVICE_TRIGGER_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In(TRIGGER_TYPES),
        vol.Optional(CONF_TOPIC): cv.string,
        vol.Optional(CONF_NAME): cv.string,
        vol.Optional(CONF_DASHBOARD): cv.string,
        vol.Optional(CONF_PAGE): cv.string,
    }
)


async def async_get_triggers(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, Any]]:
    """List device triggers for Dashboard Studio."""
    base = {
        CONF_PLATFORM: "device",
        CONF_DEVICE_ID: device_id,
        CONF_DOMAIN: DOMAIN,
    }
    return [
        {**base, CONF_TYPE: TRIGGER_TYPE_WIDGET_TRIGGER},
        {**base, CONF_TYPE: TRIGGER_TYPE_DASHBOARD_LOADED},
        {**base, CONF_TYPE: TRIGGER_TYPE_DASHBOARD_SAVED},
        {**base, CONF_TYPE: TRIGGER_TYPE_PAGE_OPENED},
    ]


async def async_get_trigger_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """List trigger capabilities (filter fields for topic, dashboard, and page)."""
    trigger_type = config.get(CONF_TYPE)
    if trigger_type == TRIGGER_TYPE_WIDGET_TRIGGER:
        return {
            "extra_fields": vol.Schema(
                {
                    vol.Optional(CONF_TOPIC): str,
                    vol.Optional(CONF_NAME): str,
                }
            )
        }
    if trigger_type in (TRIGGER_TYPE_DASHBOARD_LOADED, TRIGGER_TYPE_DASHBOARD_SAVED):
        return {
            "extra_fields": vol.Schema(
                {
                    vol.Optional(CONF_DASHBOARD): str,
                    vol.Optional(CONF_NAME): str,
                }
            )
        }
    if trigger_type == TRIGGER_TYPE_PAGE_OPENED:
        return {
            "extra_fields": vol.Schema(
                {
                    vol.Optional(CONF_DASHBOARD): str,
                    vol.Optional(CONF_NAME): str,
                    vol.Optional(CONF_PAGE): str,
                }
            )
        }
    return {}


async def async_attach_trigger(
    hass: HomeAssistant,
    config: ConfigType,
    action: TriggerActionType,
    trigger_info: TriggerInfo,
) -> CALLBACK_TYPE:
    """Attach a trigger."""
    trigger_type = config[CONF_TYPE]
    event_data: dict[str, Any] = {}

    if trigger_type == TRIGGER_TYPE_WIDGET_TRIGGER:
        event_type = EVENT_TRIGGER
        target = str(config.get(CONF_TOPIC) or config.get(CONF_NAME) or "").strip()
        if target:
            event_data[CONF_TOPIC] = target
    elif trigger_type == TRIGGER_TYPE_DASHBOARD_LOADED:
        event_type = EVENT_LOADED
        dash = str(config.get(CONF_DASHBOARD) or config.get(CONF_NAME) or "").strip()
        if dash:
            event_data[CONF_DASHBOARD] = dash
    elif trigger_type == TRIGGER_TYPE_DASHBOARD_SAVED:
        event_type = EVENT_SAVED
        dash = str(config.get(CONF_DASHBOARD) or config.get(CONF_NAME) or "").strip()
        if dash:
            event_data[CONF_DASHBOARD] = dash
    else:
        event_type = EVENT_PAGE_OPENED
        dash = str(config.get(CONF_DASHBOARD) or config.get(CONF_NAME) or "").strip()
        if dash:
            event_data[CONF_DASHBOARD] = dash
        if config.get(CONF_PAGE):
            event_data[CONF_PAGE] = str(config[CONF_PAGE]).strip()

    event_config = event_trigger.TRIGGER_SCHEMA(
        {
            event_trigger.CONF_PLATFORM: "event",
            event_trigger.CONF_EVENT_TYPE: event_type,
            event_trigger.CONF_EVENT_DATA: event_data,
        }
    )
    return await event_trigger.async_attach_trigger(
        hass, event_config, action, trigger_info, platform_type="device"
    )
