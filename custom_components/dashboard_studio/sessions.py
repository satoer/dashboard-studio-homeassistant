"""Viewer session tracking and the open-dashboard binary sensor ids."""

from __future__ import annotations

import re
from typing import Any


def slugify_dashboard(name: str) -> str:
    clean = re.sub(r"\.json$", "", (name or "").strip(), flags=re.IGNORECASE).lower()
    slug = re.sub(r"[^a-z0-9]+", "_", clean).strip("_")
    return slug or "default"


def sensor_entity_id(dashboard_name: str) -> str:
    return f"binary_sensor.dashboard_studio_{slugify_dashboard(dashboard_name)}_open"


class SessionBook:
    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, Any]] = {}

    def set(self, client_id: str, dashboard: str | None, page: str | None) -> dict[str, Any]:
        current = self._sessions.get(client_id) or {"dashboard": None, "page": None}
        if dashboard:
            current["dashboard"] = dashboard
        if page is not None and page != "":
            current["page"] = page
        self._sessions[client_id] = current
        return current

    def drop(self, client_id: str) -> None:
        self._sessions.pop(client_id, None)

    def summary(self) -> dict[str, dict[str, Any]]:
        grouped: dict[str, dict[str, Any]] = {}
        for session in self._sessions.values():
            name = session.get("dashboard") or ""
            if not name:
                continue
            bucket = grouped.setdefault(name, {"pages": [], "count": 0})
            bucket["count"] += 1
            page = session.get("page")
            if page and page not in bucket["pages"]:
                bucket["pages"].append(page)
        return grouped
