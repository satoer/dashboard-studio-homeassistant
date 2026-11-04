"""Recorder downsample helpers. History fetching stays in the service layer."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

TIMESPAN_MS = {
    "1h": 3600 * 1000,
    "6h": 6 * 3600 * 1000,
    "24h": 24 * 3600 * 1000,
    "7d": 7 * 24 * 3600 * 1000,
    "14d": 14 * 24 * 3600 * 1000,
    "30d": 30 * 24 * 3600 * 1000,
    "31d": 31 * 24 * 3600 * 1000,
    "365d": 365 * 24 * 3600 * 1000,
}

RESOLUTION_MS = {
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 3600 * 1000,
    "6h": 6 * 3600 * 1000,
    "1d": 24 * 3600 * 1000,
}

AGG_ALIASES = {
    "mean": "average",
    "avg": "average",
    "average": "average",
    "min": "min",
    "max": "max",
    "sum": "sum",
    "delta": "diff",
    "diff": "diff",
    "last": "last",
    "first": "first",
    "median": "median",
}


def timespan_ms(timespan: str | None) -> int:
    return TIMESPAN_MS.get(str(timespan or "24h"), TIMESPAN_MS["24h"])


def resample_data(
    entries: list[dict[str, Any]],
    timeframe: str | None,
    resolution: str | None = "auto",
    aggregation: str | None = "mean",
    now_ms: int | None = None,
) -> list[dict[str, Any]]:
    """Bucket history points. Empty buckets carry the last known value, except sum and delta."""
    if not entries:
        return []
    now = now_ms if now_ms is not None else int(datetime.now(timezone.utc).timestamp() * 1000)
    duration = timespan_ms(timeframe)
    start = now - duration
    method = AGG_ALIASES.get(str(aggregation or "mean"), "average")
    bucket_count = 48
    if resolution and resolution != "auto" and resolution in RESOLUTION_MS:
        bucket_count = max(1, min(500, round(duration / RESOLUTION_MS[resolution])))
    bucket_size = duration / bucket_count
    buckets: list[list[float]] = [[] for _ in range(bucket_count)]
    for point in entries:
        try:
            ms = int(datetime.fromisoformat(str(point["t"]).replace("Z", "+00:00")).timestamp() * 1000)
            value = float(point["v"])
        except (KeyError, TypeError, ValueError):
            continue
        if ms < start:
            continue
        index = min(bucket_count - 1, max(0, int((ms - start) / bucket_size)))
        buckets[index].append(value)

    out: list[dict[str, Any]] = []
    last_known = float(entries[0].get("v") or 0)
    for index, values in enumerate(buckets):
        midpoint = start + (index + 0.5) * bucket_size
        stamp = datetime.fromtimestamp(midpoint / 1000, timezone.utc).isoformat().replace("+00:00", "Z")
        if not values:
            fill = 0 if method in ("sum", "diff") else round(last_known, 2)
            out.append({"t": stamp, "v": fill})
            continue
        if method == "average":
            agg = sum(values) / len(values)
        elif method == "min":
            agg = min(values)
        elif method == "max":
            agg = max(values)
        elif method == "sum":
            agg = sum(values)
        elif method == "first":
            agg = values[0]
        elif method == "diff":
            agg = values[-1] - values[0]
        elif method == "median":
            ordered = sorted(values)
            mid = len(ordered) // 2
            agg = ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2
        else:
            agg = values[-1]
        last_known = agg
        out.append({"t": stamp, "v": round(agg, 2)})
    return out


def window_start(timespan: str | None, now: datetime | None = None) -> datetime:
    moment = now or datetime.now(timezone.utc)
    return moment - timedelta(milliseconds=timespan_ms(timespan))
