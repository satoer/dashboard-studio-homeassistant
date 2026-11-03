"""Config flow for the Dashboard Studio integration."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult

from .const import CONF_API_TOKEN, CONF_SERVER_URL, DEFAULT_SERVER_URL, DOMAIN


class DashboardStudioConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Dashboard Studio."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(
                title="Dashboard Studio",
                data={
                    CONF_SERVER_URL: str(
                        user_input.get(CONF_SERVER_URL, DEFAULT_SERVER_URL)
                    ).rstrip("/"),
                    CONF_API_TOKEN: str(user_input.get(CONF_API_TOKEN, "")).strip(),
                },
            )

        schema = vol.Schema(
            {
                vol.Required(CONF_SERVER_URL, default=DEFAULT_SERVER_URL): str,
                vol.Optional(CONF_API_TOKEN, default=""): str,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema)

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return DashboardStudioOptionsFlowHandler(config_entry)


class DashboardStudioOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options flow for Dashboard Studio."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_url = self._config_entry.options.get(
            CONF_SERVER_URL,
            self._config_entry.data.get(CONF_SERVER_URL, DEFAULT_SERVER_URL),
        )
        current_token = self._config_entry.options.get(
            CONF_API_TOKEN,
            self._config_entry.data.get(CONF_API_TOKEN, ""),
        )

        schema = vol.Schema(
            {
                vol.Required(CONF_SERVER_URL, default=current_url): str,
                vol.Optional(CONF_API_TOKEN, default=current_token): str,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
