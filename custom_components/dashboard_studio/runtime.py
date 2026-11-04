"""In-process Dashboard Studio runtime for Home Assistant."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.const import EVENT_STATE_CHANGED
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from .cache import StateCache
from .const import (
    DOMAIN,
    EVENT_LOADED,
    EVENT_PAGE_OPENED,
    EVENT_SAVED,
    EVENT_TRIGGER,
    PANEL_APP,
    PANEL_SETUP,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .sessions import SessionBook, sensor_entity_id
from .storage_files import (
    clear_snapshots,
    delete_json,
    delete_media,
    list_json_files,
    list_media,
    list_snapshots,
    peek_version,
    read_dashboard_documents,
    read_json,
    rename_media,
    save_json,
    save_media,
)
from .topics import (
    collect_referenced_strings,
    enabled_payloads_for_state,
    normalize_dashboard_id,
    normalize_page_id,
    plan_helper_call,
    plan_service_calls,
    plan_topic_command,
    trigger_tokens,
    unused_enabled_topics,
)
from .topics import build_catalog

_LOGGER = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "cacheValues": "all",
    "keepDashboardFileHistory": True,
    "dashboardFileHistoryMax": 10,
    "hideEditor": False,
    "warnWhenDriverOffline": True,
    "autoEcho": True,
    "topicEcho": True,
    "calendarDateFormat": "dd-mm-yyyy",
    "calendarWeekStart": "monday",
    "calendarEventOrder": "icon_time_title",
    "calendarWrapEventsInBlocks": True,
    "calendarColorBlockMode": "event_type",
    "calendarSourceBlockBindingsText": "",
    "calendarGroupByTimeOfDay": True,
    "calendarShowIcons": True,
    "calendarUseDefaultIcon": True,
    "calendarDefaultIcon": "ph-calendar",
    "calendarIconBindingsText": "",
}


class DashboardStudioRuntime:
    """Owns the whitelist, live cache, files, and connected viewers."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self.hass = hass
        self.entry_id = entry_id
        self.root = Path(hass.config.path("dashboard_studio"))
        self.cache = StateCache()
        self.sessions = SessionBook()
        self.clients: dict[str, Any] = {}
        self.enabled: dict[str, list[str]] = {}
        self.settings: dict[str, Any] = dict(DEFAULT_SETTINGS)
        self.catalog: dict[str, Any] = {"devices": [], "by_key": {}, "by_entity": {}}
        self._known: set[str] = set()
        self._relevant: set[str] = set()
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._unsubs: list[Any] = []
        self._rebuild_timer = None

    async def async_start(self) -> None:
        stored = await self._store.async_load() or {}
        self.enabled = stored.get("enabled_capabilities") or {}
        self.settings = {**DEFAULT_SETTINGS, **(stored.get("app_settings") or {})}
        await self.hass.async_add_executor_job(self._ensure)
        self.rebuild_catalog()
        await self.async_refresh_enabled(broadcast=False)
        self._unsubs.append(self.hass.bus.async_listen(EVENT_STATE_CHANGED, self._on_state_event))
        for event_name in (
            "device_registry_updated",
            "entity_registry_updated",
            "area_registry_updated",
        ):
            self._unsubs.append(self.hass.bus.async_listen(event_name, self._on_registry_event))

    async def async_stop(self) -> None:
        if self._rebuild_timer is not None:
            self._rebuild_timer.cancel()
            self._rebuild_timer = None
        while self._unsubs:
            unsub = self._unsubs.pop()
            unsub()
        for client_id, client in list(self.clients.items()):
            close = getattr(client, "close", None)
            if close:
                await close()
            self.clients.pop(client_id, None)
        for state in list(self.hass.states.async_all()):
            if state.entity_id.startswith("binary_sensor.dashboard_studio_") and state.entity_id.endswith("_open"):
                self.hass.states.async_remove(state.entity_id)
        for panel in (PANEL_APP, PANEL_SETUP):
            try:
                async_remove_panel(self.hass, panel)
            except Exception:  # noqa: BLE001
                pass

    def _ensure(self) -> None:
        from .storage_files import ensure_dirs

        ensure_dirs(self.root)

    async def async_save_store(self) -> None:
        await self._store.async_save(
            {"enabled_capabilities": self.enabled, "app_settings": self.settings}
        )

    def client_settings(self) -> dict[str, Any]:
        return dict(self.settings)

    def rebuild_catalog(self) -> None:
        states = []
        self._known = set()
        for state in self.hass.states.async_all():
            self._known.add(state.entity_id)
            states.append(
                {
                    "entity_id": state.entity_id,
                    "state": state.state,
                    "attributes": dict(state.attributes),
                }
            )
        entities = {}
        try:
            registry = er.async_get(self.hass)
            for entry in registry.entities.values():
                entities[entry.entity_id] = {"device_id": entry.device_id, "area_id": entry.area_id}
        except Exception:  # noqa: BLE001
            _LOGGER.debug("Entity registry is not available yet")
        devices = {}
        try:
            dev_reg = dr.async_get(self.hass)
            for device in dev_reg.devices.values():
                devices[device.id] = {
                    "name": device.name,
                    "name_by_user": device.name_by_user,
                    "area_id": device.area_id,
                }
        except Exception:  # noqa: BLE001
            _LOGGER.debug("Device registry is not available yet")
        areas = {}
        try:
            area_reg = ar.async_get(self.hass)
            for area in area_reg.areas.values():
                areas[area.id] = area.name
        except Exception:  # noqa: BLE001
            _LOGGER.debug("Area registry is not available yet")
        self.catalog = build_catalog(states, entities, devices, areas)
        self._rebuild_relevant()

    def _rebuild_relevant(self) -> None:
        relevant: set[str] = set()
        by_entity = self.catalog.get("by_entity") or {}
        for entity_id, mappings in by_entity.items():
            for mapping in mappings:
                allowed = self.enabled.get(mapping.get("deviceId"))
                if isinstance(allowed, list) and mapping.get("capId") in allowed:
                    relevant.add(entity_id)
        for key, caps in self.enabled.items():
            if isinstance(caps, list) and caps and "." in str(key):
                relevant.add(str(key))
        self._relevant = relevant

    def clear_state_cache(self) -> None:
        self.cache.clear()

    @callback
    def _on_registry_event(self, event: Event) -> None:
        self._schedule_catalog_rebuild()

    @callback
    def _schedule_catalog_rebuild(self) -> None:
        if self._rebuild_timer is not None:
            self._rebuild_timer.cancel()
        self._rebuild_timer = self.hass.loop.call_later(1.0, self._run_catalog_rebuild)

    @callback
    def _run_catalog_rebuild(self) -> None:
        self._rebuild_timer = None
        self.hass.async_create_task(self._async_finish_catalog_rebuild())

    async def _async_finish_catalog_rebuild(self) -> None:
        previous = set(self._relevant)
        self.rebuild_catalog()
        for entity_id in self._relevant - previous:
            state = self.hass.states.get(entity_id)
            if state is None:
                continue
            await self.async_handle_state(state)

    @callback
    def _on_state_event(self, event: Event) -> None:
        new_state = event.data.get("new_state")
        if new_state is None:
            return
        entity_id = new_state.entity_id
        if entity_id in self._relevant:
            self.hass.async_create_task(self.async_handle_state(new_state))
            return
        if entity_id not in self._known:
            self._known.add(entity_id)
            self._schedule_catalog_rebuild()

    async def async_handle_state(self, state) -> None:
        state_dict = {
            "entity_id": state.entity_id,
            "state": state.state,
            "attributes": dict(state.attributes),
        }
        payloads = enabled_payloads_for_state(state_dict, self.catalog, self.enabled)
        for payload in payloads:
            self._cache_mqtt(payload)
        if payloads:
            await self._broadcast_payloads(payloads)

    def _cache_mqtt(self, payload: dict[str, Any], category: str | None = None) -> None:
        if payload.get("isVariable"):
            category = "variable"
        elif payload.get("isFlow"):
            category = "flow"
        elif payload.get("isMood"):
            category = "mood"
        else:
            category = category or "device"
        self.cache.put(payload["topic"], "mqtt", payload, self.settings, category, payload.get("value"))

    async def _broadcast_payloads(self, payloads: list[dict[str, Any]]) -> None:
        for payload in payloads:
            await self.broadcast("mqtt_message", payload)

    async def async_refresh_enabled(self, broadcast: bool = True) -> None:
        self.cache.clear()
        collected = []
        for state in self.hass.states.async_all():
            state_dict = {
                "entity_id": state.entity_id,
                "state": state.state,
                "attributes": dict(state.attributes),
            }
            for payload in enabled_payloads_for_state(state_dict, self.catalog, self.enabled):
                self._cache_mqtt(payload)
                collected.append(payload)
        if broadcast and collected:
            await self._broadcast_payloads(collected)

    async def broadcast(self, event: str, data: Any) -> None:
        dead = []
        for client_id, client in list(self.clients.items()):
            try:
                await client.send_event(event, data)
            except Exception:  # noqa: BLE001
                dead.append(client_id)
        for client_id in dead:
            await self.async_detach_client(client_id)

    def attach_client(self, client) -> None:
        self.clients[client.client_id] = client

    async def async_detach_client(self, client_id: str) -> None:
        self.clients.pop(client_id, None)
        self.sessions.drop(client_id)
        self.publish_open_sensors()

    def snapshot_items(self) -> list[dict[str, Any]]:
        return self.cache.snapshot(self.settings)

    def publish_open_sensors(self) -> None:
        summary = self.sessions.summary()
        seen = set()
        for name, info in summary.items():
            entity_id = sensor_entity_id(name)
            seen.add(entity_id)
            pages = info["pages"]
            self.hass.states.async_set(
                entity_id,
                "on",
                {
                    "dashboard": name,
                    "page": pages[0] if pages else "",
                    "active_pages": pages,
                    "viewer_count": info["count"],
                    "friendly_name": f"Dashboard Studio {name} open",
                },
            )
        for state in self.hass.states.async_all():
            if not state.entity_id.startswith("binary_sensor.dashboard_studio_") or not state.entity_id.endswith("_open"):
                continue
            if state.entity_id not in seen:
                self.hass.states.async_set(
                    state.entity_id,
                    "off",
                    {**dict(state.attributes), "viewer_count": 0, "active_pages": []},
                )

    async def async_handle_command(self, event: str, data: dict[str, Any] | None, client) -> Any:
        payload = data or {}
        if event == "request_state_sync":
            await client.send_event("state_snapshot", self.snapshot_items())
            return {"ok": True, "topics": len(self.cache)}
        if event == "get_settings":
            await client.send_event("settings_updated", self.client_settings())
            return {"ok": True}
        if event == "set_state":
            await self.async_set_state(payload)
            return {"ok": True}
        if event == "dashboard_trigger":
            name = payload.get("name") or payload.get("event")
            if name:
                tokens = trigger_tokens(payload.get("value"))
                self.hass.bus.async_fire(
                    EVENT_TRIGGER,
                    {"event": str(name), "topic": str(name), **tokens},
                )
            return {"ok": True}
        if event == "dashboard_loaded":
            return await self._session_event(client, payload, loaded=True)
        if event == "dashboard_page":
            return await self._session_event(client, payload, loaded=False)
        if event == "dashboard_saved":
            raw_name = payload.get("name") or payload.get("dashboard")
            dash = normalize_dashboard_id(raw_name) or "default"
            self.hass.bus.async_fire(
                EVENT_SAVED,
                {"dashboard": dash, "dashboard_name": raw_name or dash},
            )
            return {"ok": True}
        if event == "file_list":
            files = await self._files(list_json_files, payload.get("type") or "dashboards")
            await client.send_event("file_list_response", {"type": payload.get("type") or "dashboards", "files": files})
            return {"files": files}
        if event == "file_load":
            content = await self._read(payload.get("type") or "dashboards", payload.get("name") or payload.get("filename"))
            await client.send_event(
                "file_load_response",
                {"type": payload.get("type") or "dashboards", "name": payload.get("name"), "content": content},
            )
            return {"content": content}
        if event == "file_save":
            saved = await self._save(payload.get("type") or "dashboards", payload.get("name"), payload.get("content"))
            await client.send_event("file_op_success", {"op": "save", "type": payload.get("type"), "name": payload.get("name")})
            return {"success": True, "filename": saved}
        if event == "file_delete":
            await self._delete(payload.get("type") or "dashboards", payload.get("name"))
            await client.send_event("file_op_success", {"op": "delete", "type": payload.get("type"), "name": payload.get("name")})
            return {"success": True}
        if event == "file_history_list":
            items = await self.hass.async_add_executor_job(list_snapshots, self.root, payload.get("baseName") or "")
            await client.send_event(
                "file_history_list_response",
                {
                    "type": payload.get("type") or "dashboards",
                    "baseName": payload.get("baseName"),
                    "items": items,
                    "reqId": payload.get("reqId"),
                },
            )
            return {"items": items}
        if event == "file_history_peek":
            version = await self.hass.async_add_executor_job(peek_version, self.root, payload.get("name") or "", self.factory_root())
            await client.send_event(
                "file_history_peek_response",
                {
                    "type": payload.get("type") or "dashboards",
                    "name": payload.get("name"),
                    "version": version,
                    "reqId": payload.get("reqId"),
                },
            )
            return {"version": version}
        if event == "file_history_clear":
            await self.hass.async_add_executor_job(clear_snapshots, self.root, payload.get("baseName") or "")
            await client.send_event(
                "file_history_clear_response",
                {"type": payload.get("type") or "dashboards", "baseName": payload.get("baseName")},
            )
            return {"success": True}
        if event in ("image_list", "audio_list"):
            kind = "audio" if event.startswith("audio") else "images"
            files = await self.hass.async_add_executor_job(list_media, self.root, "audio" if kind == "audio" else "images", self.factory_root())
            await client.send_event(f"{'audio' if kind == 'audio' else 'image'}_list_response", files)
            return {"files": files}
        if event in ("image_upload", "audio_upload"):
            kind = "audio" if event.startswith("audio") else "images"
            saved = await self.hass.async_add_executor_job(
                save_media, self.root, kind, payload.get("name") or "", payload.get("content")
            )
            prefix = "audio" if kind == "audio" else "image"
            await client.send_event(f"{prefix}_op_success", {"op": "upload", "name": saved})
            files = await self.hass.async_add_executor_job(list_media, self.root, kind, self.factory_root())
            await client.send_event(f"{prefix}_list_response", files)
            return {"success": True, "name": saved}
        if event in ("image_delete", "audio_delete"):
            kind = "audio" if event.startswith("audio") else "images"
            names = payload.get("names") or ([payload.get("name")] if payload.get("name") else [])
            await self.hass.async_add_executor_job(delete_media, self.root, kind, names)
            prefix = "audio" if kind == "audio" else "image"
            await client.send_event(f"{prefix}_op_success", {"op": "delete", "name": payload.get("name")})
            files = await self.hass.async_add_executor_job(list_media, self.root, kind, self.factory_root())
            await client.send_event(f"{prefix}_list_response", files)
            return {"success": True}
        if event in ("image_rename", "audio_rename"):
            kind = "audio" if event.startswith("audio") else "images"
            renamed = await self.hass.async_add_executor_job(
                rename_media, self.root, kind, payload.get("from") or "", payload.get("to") or ""
            )
            prefix = "audio" if kind == "audio" else "image"
            await client.send_event(f"{prefix}_op_success", {"op": "rename", "name": renamed, "from": payload.get("from"), "to": renamed})
            files = await self.hass.async_add_executor_job(list_media, self.root, kind, self.factory_root())
            await client.send_event(f"{prefix}_list_response", files)
            return {"success": True, "name": renamed}
        return {"ok": False, "error": "unknown_event"}

    async def _session_event(self, client, payload: dict[str, Any], loaded: bool) -> dict[str, Any]:
        raw_name = payload.get("name") or payload.get("dashboard")
        dash = normalize_dashboard_id(raw_name) or "default"
        page = normalize_page_id(payload.get("page")) if payload.get("page") is not None else "1"
        self.sessions.set(client.client_id, dash, page)
        self.publish_open_sensors()
        if loaded:
            self.hass.bus.async_fire(
                EVENT_LOADED,
                {"dashboard": dash, "dashboard_name": raw_name or dash, "page": page},
            )
        elif not payload.get("restore"):
            self.hass.bus.async_fire(
                EVENT_PAGE_OPENED,
                {
                    "dashboard": dash,
                    "dashboard_name": raw_name or dash,
                    "page": page,
                    "page_name": "" if payload.get("page") is None else str(payload.get("page")),
                },
            )
        return {"ok": True}

    def factory_root(self) -> Path | None:
        from .http_views import resolve_frontend_dir

        path = resolve_frontend_dir()
        return path if path.is_dir() else None

    async def _files(self, func, storage_type: str):
        return await self.hass.async_add_executor_job(func, self.root, storage_type, self.factory_root())

    async def _read(self, storage_type: str, name: str):
        return await self.hass.async_add_executor_job(read_json, self.root, storage_type, name, self.factory_root())

    async def _save(self, storage_type: str, name: str, content: Any):
        keep = self.settings.get("keepDashboardFileHistory", True) is not False
        maximum = int(self.settings.get("dashboardFileHistoryMax") or 10)
        return await self.hass.async_add_executor_job(save_json, self.root, storage_type, name, content, keep, maximum)

    async def _delete(self, storage_type: str, name: str) -> None:
        await self.hass.async_add_executor_job(delete_json, self.root, storage_type, name)

    async def async_set_state(self, data: dict[str, Any]) -> None:
        if not data:
            return
        if data.get("deviceId") == "dashboardstudio":
            tokens = trigger_tokens(data.get("value"))
            name = str(data.get("capabilityId") or "")
            self.hass.bus.async_fire(EVENT_TRIGGER, {"event": name, "topic": name, **tokens})
            return
        topic = str(data.get("topic") or "")
        if not topic and data.get("deviceId") and data.get("capabilityId"):
            topic = f"homeassistant/{data['deviceId']}/{data['capabilityId']}"
        if not topic:
            return
        if self.settings.get("autoEcho", True) is not False and self.settings.get("topicEcho", True) is not False:
            await self.publish_custom(topic, data.get("value"))
        command = plan_topic_command(topic, data.get("value"))
        kind = command.get("kind")
        if kind == "helper":
            await self._call_all(plan_helper_call(command["entity_id"], command["value"]))
            return
        if kind == "flow":
            entity_id = command["entity_id"]
            domain = entity_id.split(".", 1)[0]
            if command.get("action") == "start":
                if domain == "script":
                    await self._call("script", "turn_on", {"entity_id": entity_id})
                else:
                    await self._call("automation", "trigger", {"entity_id": entity_id})
            elif command.get("action") == "enabled":
                tokens = trigger_tokens(command.get("value"))
                service = "turn_on" if tokens["val_bool"] else "turn_off"
                await self._call("automation", service, {"entity_id": entity_id})
            return
        if kind == "scene":
            await self._call("scene", "turn_on", {"entity_id": command["entity_id"]})
            return
        if kind != "capability":
            return
        mapping = self.catalog["by_key"].get(f"{command['device_or_entity']}/{command['cap_id']}")
        if mapping:
            state = self.hass.states.get(mapping["entityId"])
            attrs = dict(state.attributes) if state else {}
            await self._call_all(plan_service_calls(mapping["entityId"], mapping.get("entityCapId") or command["cap_id"], command["value"], attrs))
            return
        entity_id = command["device_or_entity"]
        if "." not in entity_id:
            return
        state = self.hass.states.get(entity_id)
        attrs = dict(state.attributes) if state else {}
        await self._call_all(plan_service_calls(entity_id, command["cap_id"], command["value"], attrs))

    async def publish_custom(self, topic: str, value: Any, retain: bool = True) -> None:
        clean = topic.strip().lstrip("/")
        lowered = clean.lower()
        if lowered.startswith("homey/event/") or lowered.startswith("homeassistant/event/") or lowered.startswith("homey/events/") or lowered.startswith("homeassistant/events/"):
            name = clean.split("/", 2)[-1]
            payload = {"name": name, "value": value}
            if retain:
                self.cache.put(f"homey/event/{name}", "event", payload, self.settings, "event", value)
            await self.broadcast("dashboard_event", payload)
            return
        if lowered.startswith("homey/insight/") or lowered.startswith("homeassistant/insight/"):
            name = clean.split("/", 2)[-1]
            payload = {"name": name, "data": value}
            if retain:
                self.cache.put(f"homey/insight/{name}", "insight", payload, self.settings, "insight", value)
            await self.broadcast("dashboard_insight", payload)
            return
        sub = clean
        for prefix in ("homeassistant/", "homey/"):
            if sub.startswith(prefix):
                sub = sub[len(prefix) :]
                break
        parts = sub.split("/")
        mqtt = {
            "topic": f"homeassistant/{sub}",
            "value": value,
            "deviceId": parts[0] if parts else "homeassistant",
            "capabilityId": "/".join(parts[1:]) if len(parts) > 1 else "state",
            "setable": True,
            "getable": True,
            "title": sub,
        }
        if retain:
            self._cache_mqtt(mqtt)
        await self.broadcast("mqtt_message", mqtt)

    async def async_reload_viewers(self, dashboard: str | None) -> None:
        name = (dashboard or "all").strip() or "all"
        await self.broadcast("reload_dashboard", {"name": name})

    async def async_publish_insight(self, topic: str, points: list[dict[str, Any]]) -> None:
        name = topic.strip().lstrip("/")
        for prefix in ("homey/insight/", "homeassistant/insight/", "homey/", "homeassistant/"):
            if name.startswith(prefix):
                name = name[len(prefix) :]
                break
        payload = {"name": name, "data": points}
        self.cache.put(f"homey/insight/{name}", "insight", payload, self.settings, "insight", points)
        await self.broadcast("dashboard_insight", payload)

    def scan_topics(self) -> dict[str, Any]:
        referenced: set[str] = set()
        documents = read_dashboard_documents(self.root)
        for document in documents:
            collect_referenced_strings(document, referenced)
        unused = unused_enabled_topics(self.enabled, self.catalog.get("devices") or [], referenced)
        return {"unused": unused, "dashboardsScanned": len(documents)}

    async def _call(self, domain: str, service: str, data: dict[str, Any]) -> None:
        await self.hass.services.async_call(domain, service, data, blocking=False)

    async def _call_all(self, calls: list[dict[str, Any]]) -> None:
        for call in calls:
            await self._call(call["domain"], call["service"], call["data"])

    def register_panels(self) -> None:
        async_register_built_in_panel(
            self.hass,
            "iframe",
            sidebar_title="Dashboard Studio",
            sidebar_icon="mdi:view-dashboard",
            frontend_url_path=PANEL_APP,
            config={"url": "/dashboard_studio/index.html"},
            require_admin=False,
            update=True,
        )
        async_register_built_in_panel(
            self.hass,
            "iframe",
            sidebar_title="Dashboard Studio Setup",
            sidebar_icon="mdi:cog",
            frontend_url_path=PANEL_SETUP,
            config={"url": "/dashboard_studio/setup"},
            require_admin=True,
            update=True,
        )


def get_runtime(hass: HomeAssistant) -> DashboardStudioRuntime | None:
    domain_data = hass.data.get(DOMAIN) or {}
    runtime = domain_data.get("runtime")
    return runtime if isinstance(runtime, DashboardStudioRuntime) else None
