"""HTTP views: the editor/viewer, user files, and the admin API."""

from __future__ import annotations

import json
from pathlib import Path
import time
from typing import Any

import aiohttp
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import ADMIN_API_PATH, APP_PATH
from .runtime import get_runtime

MEDIA = {
    "images": "images",
    "audio": "audio",
    "dashboards": "dashboards",
    "snapshots": "snapshots",
    "themes": "themes",
    "templates": "themes",
    "presets": "presets",
    "widgetpresets": "presets",
}


_CHANGELOG_REMOTE_URL = "https://satoer.com/dashboardstudio/changelog.json"
_CHANGELOG_CACHE_TTL = 3600
_changelog_cache: Any = None
_changelog_cache_at: float = 0.0


async def async_get_changelog(hass: HomeAssistant) -> tuple[Any, int]:
    """Fetch changelog with 1-hour cache and local bundled fallback."""
    global _changelog_cache, _changelog_cache_at
    now = time.time()
    if _changelog_cache is not None and (now - _changelog_cache_at) < _CHANGELOG_CACHE_TTL:
        return _changelog_cache, 200

    try:
        session = async_get_clientsession(hass)
        timeout = aiohttp.ClientTimeout(total=10)
        async with session.get(_CHANGELOG_REMOTE_URL, timeout=timeout) as resp:
            if resp.status == 200:
                data = await resp.json(content_type=None)
                _changelog_cache = data
                _changelog_cache_at = now
                return data, 200
    except Exception:
        pass

    if _changelog_cache is not None:
        return _changelog_cache, 200

    here = Path(__file__).resolve().parent
    candidates = [
        resolve_frontend_dir() / "release-changelog.json",
        resolve_frontend_dir() / "changelog.json",
        here.parent.parent / "website" / "changelog.json",
    ]
    for candidate in candidates:
        if candidate.is_file():
            try:
                data = json.loads(candidate.read_text(encoding="utf-8"))
                _changelog_cache = data
                _changelog_cache_at = now
                return data, 200
            except Exception:
                pass

    return {"error": "Failed to fetch changelog"}, 502


def resolve_frontend_dir() -> Path:
    here = Path(__file__).resolve().parent
    bundled = here / "static_frontend"
    if (bundled / "editor.html").is_file() or (bundled / "index.html").is_file():
        return bundled
    repo_assets = here.parent.parent / "assets"
    if (repo_assets / "editor.html").is_file():
        return repo_assets
    return bundled


def resolve_platform_config() -> Path | None:
    here = Path(__file__).resolve().parent
    candidate = here.parent.parent / "individual platforms" / "homeassistant" / "config.json"
    if candidate.is_file():
        return candidate
    bundled = resolve_frontend_dir() / "config.json"
    return bundled if bundled.is_file() else None


async def async_user_from_token(hass: HomeAssistant, token: str):
    if not token:
        return None
    try:
        refresh = await hass.auth.async_validate_access_token(token)
        if refresh is None:
            return None
        return getattr(refresh, "user", None)
    except Exception:
        return None


def token_from_request(request: web.Request) -> str:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip()
    return str(request.query.get("token") or "")


class DashboardStudioAppView(HomeAssistantView):
    """Serve the Dashboard Studio frontend and user media under /dashboard_studio/."""

    url = f"{APP_PATH}/{{path:.*}}"
    name = "api:dashboard_studio:app"
    requires_auth = False

    async def get(self, request: web.Request, path: str = "") -> web.StreamResponse:
        hass = request.app["hass"]
        rel = (path or "index.html").lstrip("/")
        if rel in ("", "/"):
            rel = "index.html"
        if rel == "setup" or rel == "setup/":
            page = Path(__file__).resolve().parent / "panel" / "admin.html"
            return web.FileResponse(
                page,
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
            )
        if rel == "ds-iconset.js":
            here = Path(__file__).resolve().parent
            iconset = here / "ds-iconset.js"
            if not iconset.is_file():
                iconset = resolve_frontend_dir() / "ds-iconset.js"
            if iconset.is_file():
                return web.FileResponse(
                    iconset,
                    headers={"Cache-Control": "no-cache, must-revalidate", "Content-Type": "application/javascript"},
                )
        if rel == "settings.json":
            runtime = get_runtime(hass)
            body = runtime.client_settings() if runtime else {}
            return web.json_response(body)
        if rel == "config.json":
            config_path = resolve_platform_config()
            if config_path and config_path.is_file():
                return web.FileResponse(config_path)
        if rel in ("release-changelog.json", "changelog.json"):
            data, status = await async_get_changelog(hass)
            return web.json_response(data, status=status, headers={"Cache-Control": "public, max-age=3600"})
        parts = [part for part in rel.split("/") if part and part not in (".", "..")]
        if parts and parts[0] in MEDIA:
            runtime = get_runtime(hass)
            if runtime is None:
                return web.Response(status=404, text="Not Found")
            target = _safe_join(runtime.root / MEDIA[parts[0]], "/".join(parts[1:]))
            if target is None or not target.is_file():
                factory = resolve_frontend_dir()
                target = _safe_join(factory / parts[0], "/".join(parts[1:])) if len(parts) > 1 else None
            if target is None or not target.is_file():
                return web.Response(status=404, text="Not Found")
            return web.FileResponse(target)
        frontend = resolve_frontend_dir()
        target = _safe_join(frontend, "/".join(parts) if parts else "index.html")
        if target is None or not target.is_file():
            return web.Response(status=404, text="Not Found")
        return web.FileResponse(target)


class DashboardStudioRootView(HomeAssistantView):
    """Redirect /dashboard_studio to the app index and keep the query string."""

    url = APP_PATH
    name = "api:dashboard_studio:root"
    requires_auth = False

    async def get(self, request: web.Request) -> web.StreamResponse:
        query = f"?{request.query_string}" if request.query_string else ""
        raise web.HTTPFound(f"{APP_PATH}/index.html{query}")


class DashboardStudioAdminView(HomeAssistantView):
    """Admin-only JSON API for the capability whitelist and settings."""

    url = f"{ADMIN_API_PATH}/{{action}}"
    name = "api:dashboard_studio:admin"
    requires_auth = False

    async def get(self, request: web.Request, action: str) -> web.Response:
        runtime = get_runtime(request.app["hass"])
        if runtime is None:
            return web.json_response({"error": "not_running"}, status=503)
        token = token_from_request(request)
        is_session = bool(getattr(runtime, "session_token", None) and token == runtime.session_token)
        user = request.get("hass_user")
        if user is None and not is_session:
            user = await async_user_from_token(request.app["hass"], token)
        if not is_session and (user is None or not (getattr(user, "is_admin", False) or getattr(user, "is_owner", False))):
            return web.json_response({"error": "admin_required"}, status=401)
        if action == "devices":
            runtime.rebuild_catalog()
            return web.json_response({"devices": runtime.catalog.get("devices") or []})
        if action == "config":
            return web.json_response(
                {"enabled_capabilities": runtime.enabled, "app_settings": runtime.client_settings()}
            )
        if action == "scan":
            report = await request.app["hass"].async_add_executor_job(runtime.scan_topics)
            return web.json_response(report)
        if action == "backup":
            return web.json_response(
                {"enabled_capabilities": runtime.enabled, "app_settings": runtime.settings}
            )
        if action == "files":
            storage_type = str(request.query.get("type") or "dashboards")
            base = str(request.query.get("base") or "")
            files = await request.app["hass"].async_add_executor_job(
                _list_admin_files, runtime, storage_type, base
            )
            return web.json_response({"files": files})
        if action == "media":
            kind = "audio" if request.query.get("kind") == "audio" else "images"
            files = await request.app["hass"].async_add_executor_job(_list_admin_media, runtime, kind)
            return web.json_response({"files": files})
        if action == "locale":
            lang = str(request.query.get("lang") or "en")
            flat = await request.app["hass"].async_add_executor_job(_load_locale_flat, lang)
            return web.json_response(
                {"locale": lang, "strings": flat},
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
            )
        return web.json_response({"error": "unknown_action"}, status=404)

    async def post(self, request: web.Request, action: str) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        runtime = get_runtime(hass)
        if runtime is None:
            return web.json_response({"error": "not_running"}, status=503)
        token = token_from_request(request)
        is_session = bool(getattr(runtime, "session_token", None) and token == runtime.session_token)
        user = request.get("hass_user")
        if user is None and not is_session:
            user = await async_user_from_token(hass, token)
        if not is_session and (user is None or not (getattr(user, "is_admin", False) or getattr(user, "is_owner", False))):
            return web.json_response({"error": "admin_required"}, status=401)
        try:
            body: dict[str, Any] = await request.json()
        except json.JSONDecodeError:
            body = {}
        if action == "config":
            if isinstance(body.get("enabled_capabilities"), dict):
                runtime.enabled = {
                    str(key): [str(cap) for cap in value]
                    for key, value in body["enabled_capabilities"].items()
                    if isinstance(value, list)
                }
            if isinstance(body.get("app_settings"), dict):
                runtime.settings.update(body["app_settings"])
            await runtime.async_save_store()
            runtime.rebuild_catalog()
            await runtime.async_refresh_enabled(broadcast=True)
            await runtime.broadcast("settings_updated", runtime.client_settings())
            return web.json_response({"ok": True})
        if action == "restore":
            incoming = body.get("backup") if isinstance(body.get("backup"), dict) else body
            if isinstance(incoming.get("enabled_capabilities"), dict):
                runtime.enabled = incoming["enabled_capabilities"]
            if isinstance(incoming.get("app_settings"), dict):
                runtime.settings.update(incoming["app_settings"])
            await runtime.async_save_store()
            runtime.rebuild_catalog()
            await runtime.async_refresh_enabled(broadcast=True)
            return web.json_response({"ok": True})
        if action == "delete-file":
            from .storage_files import delete_json, delete_media

            kind = str(body.get("type") or "dashboards")
            name = str(body.get("name") or "")
            if kind in ("images", "audio"):
                await hass.async_add_executor_job(delete_media, runtime.root, kind, [name])
            elif kind == "snapshots":
                await hass.async_add_executor_job(_unlink_snapshot, runtime.root, name)
            else:
                await hass.async_add_executor_job(delete_json, runtime.root, kind, name)
            return web.json_response({"ok": True})
        if action == "clear-cache":
            runtime.clear_state_cache()
            await runtime.async_refresh_enabled(broadcast=True)
            return web.json_response({"ok": True})
        if action == "clear-snapshots":
            from .storage_files import clear_snapshots

            base = str(body.get("base") or "")
            if base:
                removed = await hass.async_add_executor_job(clear_snapshots, runtime.root, base)
            else:
                def _clear_all_snaps() -> int:
                    folder = runtime.root / "snapshots"
                    count = 0
                    if folder.is_dir():
                        for p in folder.glob("*.json"):
                            if p.is_file():
                                p.unlink()
                                count += 1
                    return count

                removed = await hass.async_add_executor_job(_clear_all_snaps)
            return web.json_response({"ok": True, "removed": removed})
        return web.json_response({"error": "unknown_action"}, status=404)


def _unlink_snapshot(root: Path, name: str) -> None:
    from .storage_files import sanitize_segment

    safe = sanitize_segment(name)
    path = root / "snapshots" / f"{safe}.json"
    if path.is_file():
        path.unlink()


def _list_admin_files(runtime, storage_type: str, base: str) -> list:
    from .storage_files import list_all_snapshots, list_json_files, list_snapshots

    if storage_type == "snapshots":
        if base:
            return list_snapshots(runtime.root, base)
        return list_all_snapshots(runtime.root)
    return list_json_files(runtime.root, storage_type, runtime.factory_root())


def _list_admin_media(runtime, kind: str) -> list:
    from .storage_files import list_media

    return list_media(runtime.root, kind, runtime.factory_root())


def _safe_join(root: Path, relative: str) -> Path | None:
    if not relative:
        return None
    candidate = (root / relative).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def _deep_merge_dict(base: dict[str, Any], over: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge_dict(out[k], v)
        else:
            out[k] = v
    return out


def _flatten_leaves_dict(tree: dict[str, Any], prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    if not isinstance(tree, dict):
        return out
    for k, v in tree.items():
        next_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, str):
            out[next_key] = v
        elif isinstance(v, dict):
            out.update(_flatten_leaves_dict(v, next_key))
    return out


def _adapt_platform_text(text: str, lang: str = "en") -> str:
    if not isinstance(text, str):
        return text
    clean_lang = "".join(ch for ch in str(lang or "en").split("-")[0].split("_")[0].lower() if ch.isalpha())
    res = (
        text.replace("In de Homey-app: Systeem → Algemeen.", "In Home Assistant: Instellingen → Systeem → Netwerk.")
        .replace("In the Homey app, go to System → General.", "In Home Assistant, go to Settings → System → Network.")
        .replace("Under System Information, note the Address", "Find your local IP address")
        .replace("Noteer onder Systeeminformatie het adres", "Zoek hier het lokale IP-adres")
        .replace("Removed from Homey", "Removed from Home Assistant")
        .replace("Verwijderd uit Homey", "Verwijderd uit Home Assistant")
        .replace("Homey-app", "Home Assistant")
        .replace("Homey app", "Home Assistant")
        .replace("Homey API", "Home Assistant API")
        .replace("Homey will stop publishing updates", "Dashboard Studio will stop publishing updates")
        .replace("all user dashboard files on Homey are removed", "all user dashboard files in Home Assistant are removed")
        .replace("outside Homey", "outside Home Assistant")
        .replace("buiten Homey", "buiten Home Assistant")
        .replace("op Homey", "op Home Assistant")
        .replace("van Homey", "van Home Assistant")
        .replace("Only backups the Homey settings", "Only backs up the Home Assistant configuration")
        .replace("Only restores the Homey settings", "Only restores the Home Assistant configuration")
    )
    if clean_lang == "nl":
        res = (
            res.replace("Flow-kaarten", "Services & Kalender")
            .replace("Flow cards", "Services & Kalender")
            .replace("Flow Cards", "Services & Kalender")
            .replace("flow cards", "services")
            .replace("flow card", "service")
            .replace("flow-kaart", "dienst")
        )
    else:
        res = (
            res.replace("Flow-kaarten", "Services & Calendar")
            .replace("Flow cards", "Services & Calendar")
            .replace("Flow Cards", "Services & Calendar")
            .replace("flow cards", "services")
            .replace("flow card", "service")
            .replace("flow-kaart", "service")
        )
    res = (
        res.replace("Homey devices organized by zone", "Home Assistant entities organized by area")
        .replace("Homey User Variables, Flows, and Zone Moods", "Home Assistant Helpers, Automations/Scripts, and Scenes")
        .replace("Homey", "Home Assistant")
    )
    return res


def _load_locale_flat(lang: str) -> dict[str, str]:
    locales_dir = Path(__file__).resolve().parent / "locales"
    en_file = locales_dir / "en.json"
    en_data: dict[str, Any] = {}
    if en_file.is_file():
        try:
            en_data = json.loads(en_file.read_text(encoding="utf-8"))
        except Exception:
            en_data = {}

    clean_lang = "".join(ch for ch in str(lang or "en").split("-")[0].split("_")[0].lower() if ch.isalpha())
    user_file = locales_dir / f"{clean_lang}.json" if clean_lang else en_file
    user_data: dict[str, Any] = {}
    if user_file.is_file() and clean_lang != "en":
        try:
            user_data = json.loads(user_file.read_text(encoding="utf-8"))
        except Exception:
            user_data = {}

    merged_settings = _deep_merge_dict(en_data.get("settings") or {}, user_data.get("settings") or {})
    flat = _flatten_leaves_dict(merged_settings, "settings")
    for k, v in list(flat.items()):
        flat[k] = _adapt_platform_text(v, clean_lang)
    return flat


def register_views(hass: HomeAssistant) -> None:
    hass.http.register_view(DashboardStudioRootView())
    hass.http.register_view(DashboardStudioAppView())
    hass.http.register_view(DashboardStudioAdminView())
    from .ws import DashboardStudioWsView

    hass.http.register_view(DashboardStudioWsView())
