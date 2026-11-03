"""The Dashboard Studio integration for Home Assistant."""
from __future__ import annotations

import logging
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_API_TOKEN,
    CONF_SERVER_URL,
    DEFAULT_SERVER_URL,
    DOMAIN,
    EVENT_CALL,
    SERVICE_COMBINE_ICAL_DATA,
    SERVICE_FETCH_RSS_MARKDOWN,
    SERVICE_LOAD_FILTER_ICAL,
    SERVICE_RELOAD,
    SERVICE_SEND,
    SERVICE_SEND_INSIGHTS,
    SERVICE_SEND_INSIGHTS_ADVANCED,
    SERVICE_WEBCAL_TO_MARKDOWN,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)


async def _call_server_service(
    hass: HomeAssistant, action: str, payload: dict[str, Any]
) -> dict[str, Any]:
    """Forward a service call to the Dashboard Studio server HTTP API with event bus fallback."""
    domain_data = hass.data.get(DOMAIN, {})
    server_url = DEFAULT_SERVER_URL
    api_token = ""

    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and entry_data.get(CONF_SERVER_URL):
            server_url = str(entry_data[CONF_SERVER_URL]).rstrip("/")
            api_token = str(entry_data.get(CONF_API_TOKEN, "")).strip()
            break

    session = async_get_clientsession(hass)
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"

    url = f"{server_url}/api/service/{action}"
    try:
        async with session.post(
            url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=25)
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                if isinstance(data, dict):
                    return data
                return {"success": True, "result": data}
            text = await resp.text()
            _LOGGER.warning(
                "Dashboard Studio HTTP service %s returned status %s: %s",
                action,
                resp.status,
                text,
            )
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug(
            "Dashboard Studio HTTP service %s unreachable at %s (%s); firing event bus fallback",
            action,
            url,
            err,
        )

    hass.bus.async_fire(
        EVENT_CALL,
        {
            "action": action,
            "data": payload,
        },
    )
    return {"success": True, "dispatched_via": "event_bus"}


async def _async_register_services(hass: HomeAssistant) -> None:
    """Register all 8 Dashboard Studio services if not already registered."""
    if hass.services.has_service(DOMAIN, SERVICE_SEND):
        return

    async def handle_send(call: ServiceCall) -> None:
        await _call_server_service(hass, SERVICE_SEND, dict(call.data))

    async def handle_send_insights(call: ServiceCall) -> None:
        await _call_server_service(hass, SERVICE_SEND_INSIGHTS, dict(call.data))

    async def handle_send_insights_advanced(call: ServiceCall) -> None:
        await _call_server_service(hass, SERVICE_SEND_INSIGHTS_ADVANCED, dict(call.data))

    async def handle_reload(call: ServiceCall) -> None:
        await _call_server_service(hass, SERVICE_RELOAD, dict(call.data))

    async def handle_load_filter_ical(call: ServiceCall) -> ServiceResponse:
        res = await _call_server_service(hass, SERVICE_LOAD_FILTER_ICAL, dict(call.data))
        return {
            "ical_data": res.get("ical_data", ""),
            "event_count": res.get("event_count", 0),
            "summary_text": res.get("summary_text", ""),
        }

    async def handle_webcal_to_markdown(call: ServiceCall) -> ServiceResponse:
        res = await _call_server_service(hass, SERVICE_WEBCAL_TO_MARKDOWN, dict(call.data))
        return {
            "markdown": res.get("markdown", ""),
            "event_count": res.get("event_count", 0),
            "event_blocks_json": res.get("event_blocks_json", "[]"),
            "source_blocks_json": res.get("source_blocks_json", "[]"),
        }

    async def handle_combine_ical_data(call: ServiceCall) -> ServiceResponse:
        res = await _call_server_service(hass, SERVICE_COMBINE_ICAL_DATA, dict(call.data))
        return {
            "ical_data": res.get("ical_data", ""),
            "event_count": res.get("event_count", 0),
            "summary_text": res.get("summary_text", ""),
        }

    async def handle_fetch_rss_markdown(call: ServiceCall) -> ServiceResponse:
        res = await _call_server_service(hass, SERVICE_FETCH_RSS_MARKDOWN, dict(call.data))
        return {
            "markdown": res.get("markdown", ""),
            "item_count": res.get("item_count", 0),
        }

    hass.services.async_register(DOMAIN, SERVICE_SEND, handle_send)
    hass.services.async_register(DOMAIN, SERVICE_SEND_INSIGHTS, handle_send_insights)
    hass.services.async_register(
        DOMAIN, SERVICE_SEND_INSIGHTS_ADVANCED, handle_send_insights_advanced
    )
    hass.services.async_register(DOMAIN, SERVICE_RELOAD, handle_reload)
    hass.services.async_register(
        DOMAIN,
        SERVICE_LOAD_FILTER_ICAL,
        handle_load_filter_ical,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_WEBCAL_TO_MARKDOWN,
        handle_webcal_to_markdown,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COMBINE_ICAL_DATA,
        handle_combine_ical_data,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_FETCH_RSS_MARKDOWN,
        handle_fetch_rss_markdown,
        supports_response=SupportsResponse.OPTIONAL,
    )


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Dashboard Studio component."""
    hass.data.setdefault(DOMAIN, {})
    await _async_register_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Dashboard Studio from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        CONF_SERVER_URL: entry.options.get(
            CONF_SERVER_URL, entry.data.get(CONF_SERVER_URL, DEFAULT_SERVER_URL)
        ),
        CONF_API_TOKEN: entry.options.get(
            CONF_API_TOKEN, entry.data.get(CONF_API_TOKEN, "")
        ),
    }

    device_registry = dr.async_get(hass)
    device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, "dashboard_studio_server")},
        manufacturer="Dashboard Studio",
        model="Dashboard Studio Runtime & Designer",
        name="Dashboard Studio",
        configuration_url=hass.data[DOMAIN][entry.entry_id][CONF_SERVER_URL],
    )

    await _async_register_services(hass)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if DOMAIN in hass.data:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return True


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry when options change."""
    await hass.config_entries.async_reload(entry.entry_id)
