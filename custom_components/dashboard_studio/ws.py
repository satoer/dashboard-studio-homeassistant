"""Authenticated WebSocket bridge that speaks the Dashboard Studio event names."""

from __future__ import annotations

import json
import uuid

from aiohttp import WSMsgType, web
from homeassistant.components.http import HomeAssistantView

from .const import WS_PATH
from .http_views import async_user_from_token
from .runtime import get_runtime


class StudioClient:
    def __init__(self, ws: web.WebSocketResponse, user) -> None:
        self.ws = ws
        self.user = user
        self.client_id = uuid.uuid4().hex

    async def send_event(self, event: str, data) -> None:
        await self.ws.send_json({"type": "event", "event": event, "data": data})

    async def close(self) -> None:
        if not self.ws.closed:
            await self.ws.close()


class DashboardStudioWsView(HomeAssistantView):
    """Same-origin socket. The first message must be a Home Assistant access token."""

    url = WS_PATH
    name = "api:dashboard_studio:ws"
    requires_auth = False

    async def get(self, request: web.Request) -> web.WebSocketResponse:
        hass = request.app["hass"]
        socket = web.WebSocketResponse(heartbeat=30, max_msg_size=50 * 1024 * 1024)
        await socket.prepare(request)
        await socket.send_json({"type": "auth_required"})
        user = None
        async for message in socket:
            if message.type != WSMsgType.TEXT:
                if message.type in (WSMsgType.CLOSE, WSMsgType.CLOSING, WSMsgType.ERROR):
                    break
                continue
            try:
                body = json.loads(message.data)
            except json.JSONDecodeError:
                continue
            if user is None:
                if body.get("type") != "auth":
                    await socket.send_json({"type": "auth_invalid", "message": "Authenticate first"})
                    continue
                user = await async_user_from_token(hass, str(body.get("access_token") or ""))
                if user is None or not user.is_active:
                    await socket.send_json({"type": "auth_invalid", "message": "Invalid token"})
                    await socket.close()
                    return socket
                await socket.send_json({"type": "auth_ok"})
                continue
            runtime = get_runtime(hass)
            if runtime is None:
                await socket.send_json({"type": "auth_invalid", "message": "Dashboard Studio is not running"})
                break
            client = getattr(request, "_ds_client", None)
            if client is None:
                client = StudioClient(socket, user)
                request._ds_client = client  # type: ignore[attr-defined]
                runtime.attach_client(client)
            if body.get("type") != "cmd":
                continue
            event = str(body.get("event") or "")
            data = body.get("data") if isinstance(body.get("data"), dict) else {}
            try:
                result = await runtime.async_handle_command(event, data, client)
            except Exception as err:  # noqa: BLE001
                result = {"ok": False, "error": str(err)}
                await _send_error(client, event, err, data)
            if body.get("id") is not None:
                await socket.send_json({"type": "ack", "id": body.get("id"), "data": result})
        runtime = get_runtime(hass)
        client = getattr(request, "_ds_client", None)
        if runtime is not None and client is not None:
            await runtime.async_detach_client(client.client_id)
        return socket


async def _send_error(client: StudioClient, event: str, err: Exception, data: dict) -> None:
    message = str(err)
    req_id = data.get("reqId") if isinstance(data, dict) else None
    if event.startswith("file_"):
        op = "save" if "save" in event else ("delete" if "delete" in event else "load")
        if "history" in event:
            await client.send_event("file_history_error", {"op": op, "message": message, "reqId": req_id})
        else:
            await client.send_event("file_op_error", {"op": op, "message": message})
    elif event.startswith("image_"):
        await client.send_event("image_op_error", {"op": event.split("_", 1)[-1], "message": message})
    elif event.startswith("audio_"):
        await client.send_event("audio_op_error", {"op": event.split("_", 1)[-1], "message": message})
