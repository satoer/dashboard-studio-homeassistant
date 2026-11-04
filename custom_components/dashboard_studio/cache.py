"""In-memory topic cache. Values are pushed only for whitelisted capabilities."""

from __future__ import annotations

import json
from typing import Any


class StateCache:
    def __init__(self) -> None:
        self._items: dict[str, dict[str, Any]] = {}

    def clear(self) -> None:
        self._items.clear()

    def __len__(self) -> int:
        return len(self._items)

    def mode(self, settings: dict[str, Any]) -> str:
        mode = settings.get("cacheValues", settings.get("stateCaching", "all"))
        if mode is False:
            return "none"
        return str(mode or "all")

    def allows(self, settings: dict[str, Any], category: str, payload: Any) -> bool:
        mode = self.mode(settings)
        if mode in ("none", "false"):
            return False
        if mode == "devices":
            return category in ("device", "variable")
        if mode == "optimized":
            raw = payload if isinstance(payload, str) else json.dumps(payload, default=str)
            return len(raw.encode("utf-8")) < 16384
        return True

    def put(self, topic: str, item_type: str, data: Any, settings: dict[str, Any], category: str, sample: Any) -> None:
        if self.allows(settings, category, sample):
            self._items[topic] = {"type": item_type, "data": data, "timestamp": _now_ms()}
        else:
            self._items.pop(topic, None)

    def snapshot(self, settings: dict[str, Any]) -> list[dict[str, Any]]:
        if self.mode(settings) in ("none", "false"):
            return []
        ordered = sorted(self._items.values(), key=lambda item: item.get("timestamp") or 0)
        return [{"type": item["type"], "data": item["data"]} for item in ordered]


def _now_ms() -> int:
    import time

    return int(time.time() * 1000)
