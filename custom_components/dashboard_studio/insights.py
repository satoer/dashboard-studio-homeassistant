"""Recorder downsample helpers and time-window calculators."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # type: ignore

TIMESPAN_MS = {
    "1h": 3600 * 1000,
    "last_hour": 3600 * 1000,
    "6h": 6 * 3600 * 1000,
    "last_6_hours": 6 * 3600 * 1000,
    "24h": 24 * 3600 * 1000,
    "last_24_hours": 24 * 3600 * 1000,
    "7d": 7 * 24 * 3600 * 1000,
    "last_7_days": 7 * 24 * 3600 * 1000,
    "14d": 14 * 24 * 3600 * 1000,
    "30d": 30 * 24 * 3600 * 1000,
    "last_30_days": 30 * 24 * 3600 * 1000,
    "31d": 31 * 24 * 3600 * 1000,
    "365d": 365 * 24 * 3600 * 1000,
    "last_year": 365 * 24 * 3600 * 1000,
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
    return TIMESPAN_MS.get(str(timespan or "24h").lower(), TIMESPAN_MS["24h"])


def _resolve_zone(tz_name: str | None) -> Any:
    if tz_name:
        try:
            return ZoneInfo(tz_name)
        except Exception:
            pass
        try:
            from homeassistant.util import dt as dt_util

            zone = dt_util.get_time_zone(tz_name)
            if zone is not None:
                return zone
        except Exception:
            pass
    try:
        return ZoneInfo("UTC")
    except Exception:
        return timezone.utc


def time_window(
    timespan: str | None,
    tz_name: str | None = None,
    now: datetime | None = None,
) -> tuple[datetime, datetime]:
    """Calculate start and end datetimes in UTC for given timespan and local timezone."""
    now_utc = now or datetime.now(timezone.utc)
    zone = _resolve_zone(tz_name)
    local_now = now_utc.astimezone(zone)
    key = str(timespan or "24h").lower().strip()

    if key == "today":
        local_midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        local_end = local_midnight + timedelta(days=1) - timedelta(microseconds=1)
        return local_midnight.astimezone(timezone.utc), local_end.astimezone(timezone.utc)

    if key == "yesterday":
        local_midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        local_start = local_midnight - timedelta(days=1)
        local_end = local_midnight - timedelta(microseconds=1)
        return local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)

    if key in ("this_week", "week"):
        local_midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        days_since_monday = local_now.weekday()
        local_start = local_midnight - timedelta(days=days_since_monday)
        return local_start.astimezone(timezone.utc), now_utc

    duration_ms = timespan_ms(key)
    return now_utc - timedelta(milliseconds=duration_ms), now_utc


def window_start(timespan: str | None, now: datetime | None = None) -> datetime:
    start, _ = time_window(timespan, now=now)
    return start


def resample_data(
    entries: list[dict[str, Any]],
    start_or_timeframe: datetime | str | None,
    end: datetime | None = None,
    datapoints: int | None = None,
    resolution: str | None = "auto",
    aggregation: str | None = "mean",
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    """Resample series into evenly spaced time buckets with carry-forward filling."""
    if isinstance(start_or_timeframe, datetime):
        start_dt = start_or_timeframe
        end_dt = end or datetime.now(timezone.utc)
    else:
        start_dt, end_dt = time_window(start_or_timeframe, now=now)

    start_ms = int(start_dt.timestamp() * 1000)
    end_ms = int(end_dt.timestamp() * 1000)
    now_dt = now or datetime.now(timezone.utc)
    now_ms = int(now_dt.timestamp() * 1000)
    future_threshold = now_ms + 60000

    # Determine safe bucket/point count
    point_count = 20
    if datapoints is not None and int(datapoints) > 0:
        point_count = max(2, min(500, int(datapoints)))
    elif resolution and resolution != "auto" and resolution in RESOLUTION_MS:
        duration_ms = max(1000, end_ms - start_ms)
        point_count = max(2, min(500, round(duration_ms / RESOLUTION_MS[resolution])))

    method = AGG_ALIASES.get(str(aggregation or "mean").lower(), "average")

    # Parse and sort samples
    sorted_entries: list[tuple[int, float]] = []
    for point in entries or []:
        try:
            t_raw = point.get("t")
            if isinstance(t_raw, (int, float)):
                ms = int(t_raw if t_raw > 1e11 else t_raw * 1000)
            else:
                ms = int(datetime.fromisoformat(str(t_raw).replace("Z", "+00:00")).timestamp() * 1000)
            val = point.get("v")
            if val is not None:
                sorted_entries.append((ms, float(val)))
        except (KeyError, TypeError, ValueError):
            continue

    sorted_entries.sort(key=lambda item: item[0])

    out: list[dict[str, Any]] = []
    time_span = max(1, end_ms - start_ms)

    for i in range(point_count):
        target_time = start_ms if point_count == 1 else start_ms + int(i * time_span / (point_count - 1))
        target_iso = datetime.fromtimestamp(target_time / 1000, timezone.utc).isoformat().replace("+00:00", "Z")

        # Future hours (e.g. remainder of 'Today') output null to cleanly stop drawing
        if target_time > future_threshold:
            out.append({"t": target_iso, "v": None})
            continue

        if method == "average":
            # Walk back to most recent non-null sample at or before target_time (carry-forward)
            val: float | None = None
            for j in range(len(sorted_entries) - 1, -1, -1):
                pt_ms, pt_v = sorted_entries[j]
                if pt_ms <= target_time:
                    val = pt_v
                    break
            if val is None and sorted_entries:
                val = sorted_entries[0][1]
            out.append({"t": target_iso, "v": round(val, 2) if val is not None else None})
        else:
            # Bucket aggregation for min/max/sum/diff/first/median
            prev_bound = start_ms if i == 0 else start_ms + int((i - 0.5) * time_span / (point_count - 1))
            next_bound = end_ms if i == point_count - 1 else start_ms + int((i + 0.5) * time_span / (point_count - 1))
            bucket_values = [pt_v for pt_ms, pt_v in sorted_entries if prev_bound <= pt_ms < next_bound]

            if bucket_values:
                if method == "min":
                    agg = min(bucket_values)
                elif method == "max":
                    agg = max(bucket_values)
                elif method == "sum":
                    agg = sum(bucket_values)
                elif method == "first":
                    agg = bucket_values[0]
                elif method == "diff":
                    agg = bucket_values[-1] - bucket_values[0]
                elif method == "median":
                    ordered = sorted(bucket_values)
                    mid = len(ordered) // 2
                    agg = ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2
                else:
                    agg = bucket_values[-1]
                out.append({"t": target_iso, "v": round(agg, 2)})
            else:
                # Carry forward last sample at or before target_time
                fallback: float | None = None
                for j in range(len(sorted_entries) - 1, -1, -1):
                    pt_ms, pt_v = sorted_entries[j]
                    if pt_ms <= target_time:
                        fallback = pt_v
                        break
                fill = 0 if method in ("sum", "diff") else fallback
                out.append({"t": target_iso, "v": round(fill, 2) if fill is not None else None})

    return out
