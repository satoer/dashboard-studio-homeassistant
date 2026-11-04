"""Markdown and JSON blocks for calendar events."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any


def events_to_markdown(events: list[dict[str, Any]], title: str = "Calendar", settings: dict[str, Any] | None = None) -> str:
    options = settings or {}
    style = str(options.get("calendarListStyle") or options.get("calendarView") or "list")
    if style == "week":
        return _week_markdown(events, title, options)
    if style == "day":
        return _day_markdown(events, title, options)
    return _list_markdown(events, title, options)


def _list_markdown(events: list[dict[str, Any]], title: str, options: dict[str, Any]) -> str:
    lines = [f"## {title}", ""]
    grouped = bool(options.get("calendarGroupByTimeOfDay", True))
    current_group = ""
    if not events:
        lines.append("No events.")
        return "\n".join(lines)
    for event in events:
        if grouped:
            group = _time_group(str(event.get("start") or ""), options)
            if group != current_group:
                current_group = group
                lines.extend(["", f"### {group}", ""])
        lines.append(_event_line(event, options))
    return "\n".join(lines).strip()


def _week_markdown(events: list[dict[str, Any]], title: str, options: dict[str, Any]) -> str:
    lines = [f"## {title}", ""]
    buckets: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        buckets.setdefault(_day_heading(str(event.get("start") or ""), options), []).append(event)
    if not buckets:
        lines.append("No events.")
        return "\n".join(lines)
    for heading, items in buckets.items():
        lines.append(f"### {heading}")
        for event in items:
            lines.append(_event_line(event, options))
        lines.append("")
    return "\n".join(lines).strip()


def _day_markdown(events: list[dict[str, Any]], title: str, options: dict[str, Any]) -> str:
    lines = [f"## {title}", ""]
    if not events:
        lines.append("No events.")
        return "\n".join(lines)
    for event in events:
        when = _format_when(str(event.get("start") or ""), options)
        lines.append(f"### {when}")
        lines.append(_event_line(event, options))
        lines.append("")
    return "\n".join(lines).strip()


def _event_line(event: dict[str, Any], options: dict[str, Any]) -> str:
    summary = str(event.get("summary") or "Event")
    when = _format_when(str(event.get("start") or ""), options)
    where = str(event.get("location") or "")
    icon = _icon_for(summary, options) if options.get("calendarShowIcons", True) else ""
    order = str(options.get("calendarEventOrder") or "icon_time_title")
    parts = {
        "icon": icon,
        "time": when,
        "title": summary,
    }
    sequence = [piece for piece in order.split("_") if piece in parts]
    if not sequence:
        sequence = ["icon", "time", "title"]
    text = " ".join(parts[piece] for piece in sequence if parts[piece]).strip()
    if where:
        text = f"{text} ({where})"
    if options.get("calendarWrapEventsInBlocks", True):
        color = _color_for(event, options)
        source = _source_for(event, options)
        wrapped = f"> {text}"
        if color:
            wrapped = f"> [{color}] {text}"
        if source:
            wrapped = f"{wrapped}  \n> {source}"
        return wrapped
    return f"- {text}"


def _format_when(value: str, options: dict[str, Any]) -> str:
    moment = _parse(value, options.get("timeZone"))
    if moment is None:
        return value
    pattern = str(options.get("calendarDateFormat") or "dd-mm-yyyy")
    month = f"{moment.month:02d}"
    day = f"{moment.day:02d}"
    date = pattern.replace("yyyy", f"{moment.year:04d}").replace("mm", month).replace("dd", day)
    if "T" not in value and len(value) <= 10:
        return date
    return f"{date} {moment.hour:02d}:{moment.minute:02d}"


def _day_heading(value: str, options: dict[str, Any]) -> str:
    moment = _parse(value, options.get("timeZone"))
    if moment is None:
        return "Unknown day"
    names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    if str(options.get("calendarWeekStart") or "monday") == "sunday":
        names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        index = (moment.weekday() + 1) % 7
    else:
        index = moment.weekday()
    return f"{names[index]} {_format_when(value, options).split(' ')[0]}"


def _time_group(value: str, options: dict[str, Any] | None = None) -> str:
    tz_name = (options or {}).get("timeZone")
    moment = _parse(value, tz_name)
    if moment is None:
        return "Later"
    if moment.hour < 12:
        return "Morning"
    if moment.hour < 17:
        return "Afternoon"
    return "Evening"


def _icon_for(summary: str, options: dict[str, Any]) -> str:
    text = str(options.get("calendarIconBindingsText") or "")
    lowered = summary.lower()
    for line in text.splitlines():
        if "=" not in line:
            continue
        word, icon = line.split("=", 1)
        if word.strip().lower() and word.strip().lower() in lowered:
            return f":{icon.strip()}:"
    if options.get("calendarUseDefaultIcon", True):
        icon = str(options.get("calendarDefaultIcon") or "ph-calendar")
        return f":{icon}:"
    return ""


def _color_for(event: dict[str, Any], options: dict[str, Any]) -> str:
    mode = str(options.get("calendarColorBlockMode") or "event_type")
    if mode == "none":
        return ""
    if mode == "source":
        return str(event.get("source") or "")
    return "All day" if event.get("isAllDay") else "Timed"


def _source_for(event: dict[str, Any], options: dict[str, Any]) -> str:
    bindings = str(options.get("calendarSourceBlockBindingsText") or "")
    source = str(event.get("source") or "")
    if not source or not bindings:
        return source
    for line in bindings.splitlines():
        if "=" not in line:
            continue
        name, label = line.split("=", 1)
        if name.strip() == source:
            return label.strip()
    return source


def _parse(value: str, tz_name: Any = None) -> datetime | None:
    text = (value or "").replace("Z", "+00:00")
    if not text:
        return None
    try:
        moment = datetime.fromisoformat(text)
    except ValueError:
        return None
    if moment.tzinfo is None or not tz_name:
        return moment
    local = _in_zone(moment, str(tz_name))
    return local or moment


def _in_zone(moment: datetime, tz_name: str) -> datetime | None:
    try:
        from zoneinfo import ZoneInfo

        return moment.astimezone(ZoneInfo(tz_name))
    except Exception:  # noqa: BLE001
        offset = _fallback_offset(moment.astimezone(timezone.utc), tz_name)
        if offset is None:
            return None
        return moment.astimezone(timezone(offset))


# Used only when the IANA database is not installed. Home Assistant ships tzdata,
# so ZoneInfo handles the real timezone, including zones that are not listed here.
_EU_CENTRAL = {
    "Europe/Amsterdam",
    "Europe/Berlin",
    "Europe/Brussels",
    "Europe/Paris",
    "Europe/Madrid",
    "Europe/Rome",
    "Europe/Vienna",
    "Europe/Zurich",
    "Europe/Prague",
    "Europe/Warsaw",
    "Europe/Stockholm",
    "Europe/Oslo",
    "Europe/Copenhagen",
}
_FIXED_OFFSETS = {
    "UTC": 0,
    "Etc/UTC": 0,
    "Asia/Tokyo": 9,
    "Asia/Shanghai": 8,
}


def _fallback_offset(moment: datetime, tz_name: str) -> timedelta | None:
    if tz_name in _EU_CENTRAL:
        return timedelta(hours=2 if _eu_dst(moment) else 1)
    if tz_name in ("Europe/London", "Europe/Dublin", "Europe/Lisbon"):
        return timedelta(hours=1 if _eu_dst(moment) else 0)
    if tz_name in ("Europe/Helsinki", "Europe/Athens", "Europe/Bucharest", "Europe/Kyiv"):
        return timedelta(hours=3 if _eu_dst(moment) else 2)
    fixed = _FIXED_OFFSETS.get(tz_name)
    if isinstance(fixed, int):
        return timedelta(hours=fixed)
    us = {
        "America/New_York": -5,
        "America/Chicago": -6,
        "America/Denver": -7,
        "America/Los_Angeles": -8,
    }
    if tz_name in us:
        return timedelta(hours=us[tz_name] + (1 if _us_dst(moment) else 0))
    if tz_name == "Australia/Sydney":
        return timedelta(hours=11 if _au_dst(moment) else 10)
    return None


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> datetime:
    if n < 0:
        if month == 12:
            cursor = datetime(year + 1, 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
        else:
            cursor = datetime(year, month + 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
        while cursor.weekday() != weekday:
            cursor -= timedelta(days=1)
        return cursor
    cursor = datetime(year, month, 1, tzinfo=timezone.utc)
    while cursor.weekday() != weekday:
        cursor += timedelta(days=1)
    return cursor + timedelta(weeks=n - 1)


def _eu_dst(moment: datetime) -> bool:
    start = _nth_weekday(moment.year, 3, 6, -1).replace(hour=1)
    end = _nth_weekday(moment.year, 10, 6, -1).replace(hour=1)
    return start <= moment.astimezone(timezone.utc) < end


def _us_dst(moment: datetime) -> bool:
    start = _nth_weekday(moment.year, 3, 6, 2).replace(hour=7)
    end = _nth_weekday(moment.year, 11, 6, 1).replace(hour=6)
    return start <= moment.astimezone(timezone.utc) < end


def _au_dst(moment: datetime) -> bool:
    start = _nth_weekday(moment.year, 10, 6, 1).replace(hour=16)
    end = _nth_weekday(moment.year, 4, 6, 1).replace(hour=16)
    local = moment.astimezone(timezone.utc)
    if local.month > 4 and local.month < 10:
        return False
    return local >= start or local < end


def select_merged_events(groups: list[tuple[str, list[dict[str, Any]]]], maximum: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Merge several calendars, then keep the soonest events across all of them."""
    merged: list[dict[str, Any]] = []
    order: list[str] = []
    for label, events in groups:
        order.append(label)
        for event in events:
            copied = dict(event)
            copied["source"] = label
            merged.append(copied)
    merged.sort(key=lambda item: item.get("start") or "")
    if maximum:
        merged = merged[:maximum]
    counts = {label: 0 for label in order}
    for event in merged:
        source = str(event.get("source") or "")
        if source in counts:
            counts[source] += 1
    sources = [{"label": label, "event_count": counts[label]} for label in order if counts[label]]
    return merged, sources


def event_blocks(events: list[dict[str, Any]]) -> str:
    payload = [
        {
            "summary": event.get("summary") or "",
            "start": event.get("start") or "",
            "end": event.get("end") or "",
            "location": event.get("location") or "",
            "description": event.get("description") or "",
            "isTimed": event.get("isTimed"),
            "isAllDay": event.get("isAllDay"),
            "isMultiDay": event.get("isMultiDay"),
            "isRecurring": event.get("isRecurring"),
            "calendarEventKind": event.get("calendarEventKind") or "",
            "calendarEventBlock": event.get("calendarEventBlock") or "",
        }
        for event in events
    ]
    return json.dumps(payload)


def source_blocks(sources: list[dict[str, Any]]) -> str:
    return json.dumps(sources)
