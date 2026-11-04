"""Config flow for the native Dashboard Studio integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN


class DashboardStudioConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Add Dashboard Studio with no URL and no token."""

    VERSION = 2

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Dashboard Studio", data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> config_entries.OptionsFlow:
        return DashboardStudioOptionsFlowHandler(config_entry)


class DashboardStudioOptionsFlowHandler(config_entries.OptionsFlow):
    """Capability setup lives in the admin sidebar panel."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        return self.async_abort(reason="use_sidebar")
