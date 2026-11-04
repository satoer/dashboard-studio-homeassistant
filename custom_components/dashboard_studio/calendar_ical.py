"""Small RFC 5545 reader for Dashboard Studio calendar services."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

_VEVENT = re.compile(r"BEGIN:VEVENT(.*?)END:VEVENT", re.IGNORECASE | re.DOTALL)
_VTIMEZONE = re.compile(r"BEGIN:VTIMEZONE(.*?)END:VTIMEZONE", re.IGNORECASE | re.DOTALL)
_VCAL_OPEN = re.compile(r"BEGIN:VCALENDAR", re.IGNORECASE)
_VCAL_CLOSE = re.compile(r"END:VCALENDAR", re.IGNORECASE)
_DAY_INDEX = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}

TIMEFRAME_DAYS = {
    "today": 1,
    "2d": 2,
    "3d": 3,
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
}


def unfold_ics(text: str) -> str:
    return re.sub(r"\r?\n[ \t]", "", text or "")


def _prop(block: str, name: str) -> str:
    match = re.search(rf"^{name}(?:;[^:]*)?:(.*)$", block, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else ""


def _zone(name: str | None):
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo(name or "UTC")
    except Exception:  # noqa: BLE001
        return timezone.utc


def _timezone_offsets(text: str) -> dict[str, timedelta]:
    offsets: dict[str, timedelta] = {}
    for match in _VTIMEZONE.finditer(text):
        block = match.group(1)
        tzid = _prop(block, "TZID")
        if not tzid:
            continue
        standard = re.search(r"BEGIN:STANDARD(.*?)END:STANDARD", block, re.IGNORECASE | re.DOTALL)
        chosen = standard.group(1) if standard else block
        raw = _prop(chosen, "TZOFFSETTO") or "+0000"
        sign = -1 if raw.startswith("-") else 1
        digits = raw.lstrip("+-")
        hours = int(digits[:2] or 0)
        minutes = int(digits[2:4] or 0) if len(digits) >= 4 else 0
        offsets[tzid] = timedelta(hours=sign * hours, minutes=sign * minutes)
    return offsets


def _line_parts(block: str, name: str) -> tuple[str, str]:
    match = re.search(rf"^{name}((?:;[^:]*)?):(.*)$", block, re.IGNORECASE | re.MULTILINE)
    if not match:
        return "", ""
    return match.group(1) or "", match.group(2).strip()


def parse_ics_datetime(raw: str, params: str = "", offsets: dict[str, timedelta] | None = None, fallback_tz: str = "UTC") -> datetime | None:
    text = (raw or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        try:
            return datetime.strptime(text, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    all_day = False
    try:
        if "T" not in text and len(text) >= 8:
            parsed = datetime.strptime(text[:8], "%Y%m%d")
            all_day = True
        else:
            parsed = datetime.strptime(text[:15], "%Y%m%dT%H%M%S")
    except ValueError:
        return None
    tzid_match = re.search(r"TZID=([^;:]+)", params or "", re.IGNORECASE)
    tzid = tzid_match.group(1) if tzid_match else ""
    if tzid and offsets and tzid in offsets and not all_day:
        return (parsed.replace(tzinfo=timezone.utc) - offsets[tzid]).replace(tzinfo=timezone.utc)
    if tzid and not all_day:
        try:
            return parsed.replace(tzinfo=_zone(tzid)).astimezone(timezone.utc)
        except Exception:  # noqa: BLE001
            pass
    if all_day:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.replace(tzinfo=_zone(fallback_tz)).astimezone(timezone.utc)


def _parse_exdates(block: str, offsets: dict[str, timedelta], fallback_tz: str) -> list[datetime]:
    found = []
    for match in re.finditer(r"^EXDATE((?:;[^:]*)?):(.*)$", block, re.IGNORECASE | re.MULTILINE):
        for piece in match.group(2).split(","):
            moment = parse_ics_datetime(piece.strip(), match.group(1) or "", offsets, fallback_tz)
            if moment:
                found.append(moment)
    return found


def parse_events(ics_text: str, fallback_tz: str = "UTC") -> list[dict[str, Any]]:
    text = unfold_ics(ics_text)
    offsets = _timezone_offsets(text)
    masters = []
    overrides: dict[tuple[str, str], dict[str, Any]] = {}
    for match in _VEVENT.finditer(text):
        block = match.group(1)
        start_params, start_raw = _line_parts(block, "DTSTART")
        end_params, end_raw = _line_parts(block, "DTEND")
        start = parse_ics_datetime(start_raw, start_params, offsets, fallback_tz)
        end = parse_ics_datetime(end_raw, end_params, offsets, fallback_tz)
        rec_params, rec_raw = _line_parts(block, "RECURRENCE-ID")
        recurrence = parse_ics_datetime(rec_raw, rec_params, offsets, fallback_tz)
        event = {
            "uid": _prop(block, "UID"),
            "summary": _unescape(_prop(block, "SUMMARY")) or "Event",
            "description": _unescape(_prop(block, "DESCRIPTION")),
            "location": _unescape(_prop(block, "LOCATION")),
            "start": start,
            "end": end,
            "all_day": "T" not in start_raw and bool(start_raw),
            "rrule": _prop(block, "RRULE"),
            "exdates": _parse_exdates(block, offsets, fallback_tz),
            "recurrence_id": recurrence,
            "raw": "BEGIN:VEVENT" + block + "END:VEVENT",
        }
        if recurrence is not None:
            overrides[(event["uid"], recurrence.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))] = event
        else:
            masters.append(event)
    for event in masters:
        event["overrides"] = {
            key: value for (uid, key), value in overrides.items() if uid == event["uid"]
        }
    return masters


def _unescape(value: str) -> str:
    return (
        value.replace("\\n", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
    )


def _rrule_parts(rrule: str) -> dict[str, str]:
    parts = {}
    for piece in (rrule or "").split(";"):
        if "=" in piece:
            key, val = piece.split("=", 1)
            parts[key.upper()] = val
    return parts


def expand_event(event: dict[str, Any], window_start: datetime, window_end: datetime, limit: int = 200) -> list[dict[str, Any]]:
    start = event.get("start")
    if start is None:
        return []
    duration = timedelta(0)
    if event.get("end") and event["end"] > start:
        duration = event["end"] - start
    rule = _rrule_parts(event.get("rrule") or "")
    freq = rule.get("FREQ", "").upper()
    if not freq:
        return [_copy_occurrence(event, start, start + duration)] if _overlaps(start, start + duration, window_start, window_end) else []

    interval = max(1, int(rule.get("INTERVAL") or 1))
    count = int(rule["COUNT"]) if rule.get("COUNT", "").isdigit() else None
    until = parse_ics_datetime(rule["UNTIL"]) if rule.get("UNTIL") else None
    byday = [day.strip()[-2:].upper() for day in rule.get("BYDAY", "").split(",") if day.strip()]
    if freq == "WEEKLY" and byday:
        return _expand_weekly(event, start, duration, interval, byday, window_start, window_end, count, until, limit)
    cursor = start
    produced = 0
    occurrences = []
    guard = 0
    while cursor <= window_end and produced < limit and guard < 2000:
        guard += 1
        if count is not None and produced >= count:
            break
        if until and cursor > until:
            break
        if (
            _day_allowed(cursor, byday)
            and not _is_exdate(cursor, event.get("exdates") or [])
            and _overlaps(cursor, cursor + duration, window_start, window_end)
        ):
            occurrences.append(_occurrence_with_override(event, cursor, cursor + duration))
        produced += 1
        cursor = _advance(cursor, freq, interval)
        if cursor is None:
            break
    return occurrences


def _expand_weekly(event, start, duration, interval, byday, window_start, window_end, count, until, limit):
    week0 = (start - timedelta(days=start.weekday())).replace(
        hour=start.hour, minute=start.minute, second=start.second, microsecond=0
    )
    occurrences = []
    produced = 0
    for week_index in range(0, 520):
        if week_index % interval != 0:
            continue
        week_start = week0 + timedelta(weeks=week_index)
        if week_start > window_end + timedelta(days=7):
            break
        for code in byday:
            if code not in _DAY_INDEX:
                continue
            candidate = (week_start + timedelta(days=_DAY_INDEX[code])).replace(
                hour=start.hour, minute=start.minute, second=start.second, microsecond=start.microsecond
            )
            if candidate < start:
                continue
            if until and candidate > until:
                return occurrences
            if count is not None and produced >= count:
                return occurrences
            produced += 1
            if _is_exdate(candidate, event.get("exdates") or []):
                continue
            if not _overlaps(candidate, candidate + duration, window_start, window_end):
                continue
            occurrences.append(_occurrence_with_override(event, candidate, candidate + duration))
            if len(occurrences) >= limit:
                return occurrences
    return occurrences


def _is_exdate(moment: datetime, exdates: list[datetime]) -> bool:
    stamp = moment.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    day = moment.astimezone(timezone.utc).strftime("%Y%m%d")
    for item in exdates:
        if item.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ") == stamp:
            return True
        if item.hour == 0 and item.minute == 0 and item.astimezone(timezone.utc).strftime("%Y%m%d") == day:
            return True
    return False


def _occurrence_with_override(event: dict[str, Any], start: datetime, end: datetime) -> dict[str, Any]:
    key = start.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    override = (event.get("overrides") or {}).get(key)
    source = override or event
    occ_start = override["start"] if override and override.get("start") else start
    occ_end = override["end"] if override and override.get("end") else end
    copied = _copy_occurrence(source, occ_start, occ_end)
    copied["isRecurring"] = bool(event.get("rrule"))
    copied["isAllDay"] = bool(event.get("all_day"))
    copied["isTimed"] = not copied["isAllDay"]
    return copied


def _day_allowed(moment: datetime, byday: list[str]) -> bool:
    if not byday:
        return True
    return list(_DAY_INDEX.keys())[moment.weekday()] in byday


def _advance(moment: datetime, freq: str, interval: int) -> datetime | None:
    if freq == "DAILY":
        return moment + timedelta(days=interval)
    if freq == "WEEKLY":
        return moment + timedelta(weeks=interval)
    if freq == "MONTHLY":
        month = moment.month - 1 + interval
        year = moment.year + month // 12
        month = month % 12 + 1
        day = min(moment.day, 28)
        return moment.replace(year=year, month=month, day=day)
    if freq == "YEARLY":
        return moment.replace(year=moment.year + interval)
    return None


def _overlaps(start: datetime, end: datetime, window_start: datetime, window_end: datetime) -> bool:
    return start < window_end and end >= window_start


def _copy_occurrence(event: dict[str, Any], start: datetime, end: datetime) -> dict[str, Any]:
    start_utc = start.astimezone(timezone.utc)
    end_utc = end.astimezone(timezone.utc)
    all_day = bool(event.get("all_day"))
    multi = (end_utc - start_utc) > timedelta(days=1) or (all_day and (end_utc.date() - start_utc.date()).days > 1)
    return {
        "uid": event.get("uid") or "",
        "summary": event.get("summary") or "Event",
        "description": event.get("description") or "",
        "location": event.get("location") or "",
        "start": start_utc.isoformat().replace("+00:00", "Z"),
        "end": end_utc.isoformat().replace("+00:00", "Z"),
        "isTimed": not all_day,
        "isAllDay": all_day,
        "isMultiDay": multi,
        "isRecurring": bool(event.get("rrule")),
        "calendarEventKind": "all_day" if all_day else "timed",
        "calendarEventBlock": event.get("summary") or "Event",
    }


def filter_events(
    ics_text: str,
    timeframe: str = "7d",
    max_events: int = 50,
    now: datetime | None = None,
    fallback_tz: str = "UTC",
) -> list[dict[str, Any]]:
    window_start, window_end = calendar_window(timeframe, now)
    found: list[dict[str, Any]] = []
    for event in parse_events(ics_text, fallback_tz):
        found.extend(expand_event(event, window_start, window_end))
        if max_events and len(found) >= max_events:
            break
    found.sort(key=lambda item: item["start"])
    if max_events:
        return found[:max_events]
    return found


def events_to_ics(events_raw: list[str]) -> str:
    body = "\r\n".join(block.strip() for block in events_raw if block.strip())
    return (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Dashboard Studio//Calendar//EN\r\n"
        f"{body}\r\n"
        "END:VCALENDAR\r\n"
    )


def assert_ics(ics: str, label: str) -> None:
    if not ics or not isinstance(ics, str):
        raise ValueError(f"{label} is empty.")
    if "\0" in ics:
        raise ValueError(f"{label} looks like binary, not a text .ics file.")
    if not _VCAL_OPEN.search(ics) or not _VCAL_CLOSE.search(ics):
        raise ValueError(f"{label} is not a valid iCalendar document.")


def merge_ics_documents(documents: list[str]) -> str:
    timezones: list[str] = []
    seen_tz: set[str] = set()
    events: list[str] = []
    seen_uid: set[str] = set()
    for index, document in enumerate(documents):
        if not document or not str(document).strip():
            continue
        text = unfold_ics(document)
        assert_ics(text, f"iCal data {index + 1}")
        for match in _VTIMEZONE.finditer(text):
            block = "BEGIN:VTIMEZONE" + match.group(1) + "END:VTIMEZONE"
            tzid = _prop(match.group(1), "TZID") or block
            if tzid in seen_tz:
                continue
            seen_tz.add(tzid)
            timezones.append(block)
        for match in _VEVENT.finditer(text):
            block = "BEGIN:VEVENT" + match.group(1) + "END:VEVENT"
            uid = _prop(match.group(1), "UID")
            if uid:
                if uid in seen_uid:
                    continue
                seen_uid.add(uid)
            events.append(block)
    return events_to_ics(timezones + events)


def occurrences_to_ics(events: list[dict[str, Any]]) -> str:
    blocks = []
    for event in events:
        start = _ics_stamp(str(event.get("start") or ""))
        end = _ics_stamp(str(event.get("end") or ""))
        lines = ["BEGIN:VEVENT", f"UID:{event.get('uid') or 'event'}", f"SUMMARY:{event.get('summary') or 'Event'}"]
        if start:
            lines.append(f"DTSTART:{start}")
        if end:
            lines.append(f"DTEND:{end}")
        if event.get("location"):
            lines.append(f"LOCATION:{event.get('location')}")
        lines.append("END:VEVENT")
        blocks.append("\r\n".join(lines))
    return events_to_ics(blocks)


def _ics_stamp(value: str) -> str:
    text = value.replace("-", "").replace(":", "")
    if text.endswith("+0000"):
        text = text[:-5] + "Z"
    return text[:16] if text.endswith("Z") else text[:15]


def coerce_calendar_source(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("{"):
        try:
            import json

            payload = json.loads(text)
        except json.JSONDecodeError:
            return text
        if isinstance(payload, dict) and isinstance(payload.get("events"), list):
            return occurrences_to_ics(payload["events"])
        if isinstance(payload, dict) and isinstance(payload.get("ical_data"), str):
            return coerce_calendar_source(payload["ical_data"])
    return text


def calendar_window(timeframe: str = "7d", now: datetime | None = None) -> tuple[datetime, datetime]:
    moment = now or datetime.now(timezone.utc)
    days = TIMEFRAME_DAYS.get(timeframe, 7)
    if timeframe == "today":
        window_start = moment.replace(hour=0, minute=0, second=0, microsecond=0)
        return window_start, window_start + timedelta(days=1)
    return moment, moment + timedelta(days=days)


def summary_text(events: list[dict[str, Any]]) -> str:
    lines = []
    for event in events:
        when = str(event.get("start") or "").replace("T", " ").replace("Z", " UTC")
        lines.append(f"{when} {event.get('summary') or 'Event'}".strip())
    return "\n".join(lines)
