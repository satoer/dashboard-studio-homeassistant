"""The native Dashboard Studio integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, SETUP_PATH
from .http_views import register_views
from .runtime import DashboardStudioRuntime
from .services_handlers import async_register_services, async_unregister_services

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)
PLATFORMS: list[str] = []


async def async_migrate_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Drop the old external server URL and token."""
    if config_entry.version < 2:
        hass.config_entries.async_update_entry(config_entry, data={}, options={}, version=2)
        _LOGGER.info("Migrated Dashboard Studio to the in-process integration")
    return True


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    runtime = DashboardStudioRuntime(hass, entry.entry_id)
    await runtime.async_start()
    hass.data[DOMAIN]["runtime"] = runtime
    hass.data[DOMAIN][entry.entry_id] = runtime

    if not hass.data[DOMAIN].get("views_registered"):
        register_views(hass)
        hass.data[DOMAIN]["views_registered"] = True
    try:
        from homeassistant.components.frontend import add_extra_js_url
        add_extra_js_url(hass, "/dashboard_studio/ds-iconset.js")
    except Exception as err:
        _LOGGER.debug("Could not register ds-iconset with frontend: %s", err)
    runtime.register_panels()
    async_register_services(hass)

    device_registry = dr.async_get(hass)
    device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, "dashboard_studio_server")},
        manufacturer="Dashboard Studio",
        model="Dashboard Studio Runtime & Designer",
        name="Dashboard Studio",
        configuration_url=SETUP_PATH,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    runtime = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    current = hass.data.get(DOMAIN, {}).get("runtime")
    if current is runtime and isinstance(runtime, DashboardStudioRuntime):
        await runtime.async_stop()
        hass.data[DOMAIN].pop("runtime", None)
    if not any(isinstance(value, DashboardStudioRuntime) for value in hass.data.get(DOMAIN, {}).values()):
        async_unregister_services(hass)
    return True
