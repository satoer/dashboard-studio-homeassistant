"""Small RFC 5545 reader and event filter for Dashboard Studio calendar services."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from urllib.parse import urlparse

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


def _resolve_zone(name: str | None) -> timezone:
    tz_str = str(name or "UTC").strip()
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo(tz_str)
    except Exception:  # noqa: BLE001
        pass
    try:
        from homeassistant.util.dt import get_time_zone

        tz = get_time_zone(tz_str)
        if tz is not None:
            return tz
    except Exception:  # noqa: BLE001
        pass
    return timezone.utc


def unfold_ics(text: str) -> str:
    return re.sub(r"\r?\n[ \t]", "", text or "")


def _prop(block: str, name: str) -> str:
    match = re.search(rf"^{name}(?:;[^:]*)?:(.*)$", block, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else ""


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


def parse_ics_datetime(
    raw: str,
    params: str = "",
    offsets: dict[str, timedelta] | None = None,
    fallback_tz: str = "UTC",
) -> datetime | None:
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
    tzid = tzid_match.group(1).strip('"\'') if tzid_match else ""
    if tzid and offsets and tzid in offsets and not all_day:
        return (parsed.replace(tzinfo=timezone.utc) - offsets[tzid]).replace(tzinfo=timezone.utc)
    if tzid and not all_day:
        try:
            return parsed.replace(tzinfo=_resolve_zone(tzid)).astimezone(timezone.utc)
        except Exception:  # noqa: BLE001
            pass
    if all_day:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.replace(tzinfo=_resolve_zone(fallback_tz)).astimezone(timezone.utc)


def _parse_exdates(block: str, offsets: dict[str, timedelta], fallback_tz: str) -> list[datetime]:
    found = []
    for match in re.finditer(r"^EXDATE((?:;[^:]*)?):(.*)$", block, re.IGNORECASE | re.MULTILINE):
        for piece in match.group(2).split(","):
            moment = parse_ics_datetime(piece.strip(), match.group(1) or "", offsets, fallback_tz)
            if moment:
                found.append(moment)
    return found


def normalize_url_for_calendar_id(url_str: str) -> str:
    s = str(url_str or "").strip()
    if s.lower().startswith("webcal://"):
        s = "https://" + s[len("webcal://") :]
    try:
        parsed = urlparse(s)
        netloc = (parsed.hostname or "").lower()
        if parsed.port:
            netloc += f":{parsed.port}"
        return f"{parsed.scheme}://{netloc}{parsed.path}" + (f"?{parsed.query}" if parsed.query else "")
    except Exception:  # noqa: BLE001
        return s


def derive_calendar_id(url_str: str) -> str:
    base = normalize_url_for_calendar_id(url_str)
    return hashlib.sha256((base or "anonymous").encode("utf-8")).hexdigest()[:12]


def _unescape(value: str) -> str:
    return (
        value.replace("\\n", "\n")
        .replace("\\N", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
    )


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
        raw_summary = _prop(block, "SUMMARY")
        clean_summary = _unescape(raw_summary) if raw_summary else "Event"
        clean_summary = clean_summary.replace("|", "\u2223")
        event = {
            "uid": _prop(block, "UID"),
            "summary": clean_summary,
            "title": clean_summary,
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


def _rrule_parts(rrule: str) -> dict[str, str]:
    parts = {}
    for piece in (rrule or "").split(";"):
        if "=" in piece:
            key, val = piece.split("=", 1)
            parts[key.upper()] = val
    return parts


def expand_event(
    event: dict[str, Any],
    window_start: datetime,
    window_end: datetime,
    limit: int = 200,
    calendar_id: str = "",
) -> list[dict[str, Any]]:
    start = event.get("start")
    if start is None:
        return []
    duration = timedelta(0)
    if event.get("end") and event["end"] > start:
        duration = event["end"] - start
    rule = _rrule_parts(event.get("rrule") or "")
    freq = rule.get("FREQ", "").upper()
    if not freq:
        if _overlaps(start, start + duration, window_start, window_end):
            return [_copy_occurrence(event, start, start + duration, calendar_id=calendar_id)]
        return []

    interval = max(1, int(rule.get("INTERVAL") or 1))
    count = int(rule["COUNT"]) if rule.get("COUNT", "").isdigit() else None
    until = parse_ics_datetime(rule["UNTIL"]) if rule.get("UNTIL") else None
    byday = [day.strip()[-2:].upper() for day in rule.get("BYDAY", "").split(",") if day.strip()]
    if freq == "WEEKLY" and byday:
        return _expand_weekly(event, start, duration, interval, byday, window_start, window_end, count, until, limit, calendar_id)
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
            occurrences.append(_occurrence_with_override(event, cursor, cursor + duration, calendar_id=calendar_id))
        produced += 1
        cursor = _advance(cursor, freq, interval)
        if cursor is None:
            break
    return occurrences


def _expand_weekly(event, start, duration, interval, byday, window_start, window_end, count, until, limit, calendar_id):
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
            occurrences.append(_occurrence_with_override(event, candidate, candidate + duration, calendar_id=calendar_id))
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


def _occurrence_with_override(event: dict[str, Any], start: datetime, end: datetime, calendar_id: str = "") -> dict[str, Any]:
    key = start.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    override = (event.get("overrides") or {}).get(key)
    source = override or event
    occ_start = override["start"] if override and override.get("start") else start
    occ_end = override["end"] if override and override.get("end") else end
    copied = _copy_occurrence(source, occ_start, occ_end, calendar_id=calendar_id)
    copied["isRecurring"] = True
    copied["calendarEventBlock"] = 4
    copied["calendarEventKind"] = "recurring"
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


def _copy_occurrence(event: dict[str, Any], start: datetime, end: datetime, calendar_id: str = "") -> dict[str, Any]:
    start_utc = start.astimezone(timezone.utc)
    end_utc = end.astimezone(timezone.utc)
    all_day = bool(event.get("all_day"))
    diff_days = (end_utc.date() - start_utc.date()).days
    multi = (end_utc - start_utc) > timedelta(days=1) or (all_day and diff_days > 1)
    is_recurring = bool(event.get("rrule")) or bool(event.get("isRecurring"))
    
    if is_recurring:
        block_num = 4
        kind = "recurring"
    elif not all_day:
        block_num = 2
        kind = "timed"
    elif multi:
        block_num = 3
        kind = "multi_day"
    else:
        block_num = 1
        kind = "all_day"

    iso_start = start_utc.isoformat().replace("+00:00", "Z")
    iso_end = end_utc.isoformat().replace("+00:00", "Z")
    summary = event.get("summary") or event.get("title") or "Event"

    return {
        "uid": event.get("uid") or "",
        "title": summary,
        "summary": summary,
        "description": event.get("description") or "",
        "location": event.get("location") or "",
        "startDate": iso_start,
        "endDate": iso_end,
        "start": iso_start,
        "end": iso_end,
        "allDay": all_day,
        "isTimed": not all_day,
        "isAllDay": all_day,
        "isMultiDay": multi,
        "isRecurring": is_recurring,
        "calendarEventBlock": block_num,
        "calendarEventKind": kind,
        "calendarId": calendar_id or event.get("calendarId") or "",
    }


def parse_civil_date(text: str, date_format: str = "dd-mm-yyyy") -> date | None:
    raw = (text or "").strip()
    if not raw:
        return None
    for fmt_str in ("%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw, fmt_str).date()
        except ValueError:
            continue
    m_dm = re.match(r"^(\d{1,2})[/-](\d{1,2})$", raw)
    if m_dm:
        now_year = datetime.now(timezone.utc).year
        d0, m0 = int(m_dm.group(1)), int(m_dm.group(2))
        try:
            return date(now_year, m0, d0)
        except ValueError:
            pass
    return None


def resolve_filter_range(
    mode_id: str,
    custom_start: str = "",
    custom_end: str = "",
    settings: dict[str, Any] | None = None,
    tz_name: str = "UTC",
) -> tuple[datetime, datetime]:
    tz = _resolve_zone(tz_name)
    now_local = datetime.now(tz)
    now_date = now_local.date()
    cfg = settings or {}
    mode = (mode_id or "previous_current_next_month").strip().lower()

    if mode == "custom":
        fmt = cfg.get("calendarDateFormat") or "dd-mm-yyyy"
        d_start = parse_civil_date(custom_start, fmt)
        d_end = parse_civil_date(custom_end, fmt)
        if not d_start or not d_end:
            raise ValueError('Please provide valid Custom Start Date and Custom End Date when using "custom" range.')
        start_dt = datetime.combine(d_start, time.min, tzinfo=tz).astimezone(timezone.utc)
        end_dt = datetime.combine(d_end, time.max, tzinfo=tz).astimezone(timezone.utc)
        return start_dt, end_dt

    if mode == "previous_current_next_month":
        first_cur = date(now_date.year, now_date.month, 1)
        prev_m = first_cur.month - 1 or 12
        prev_y = first_cur.year if first_cur.month > 1 else first_cur.year - 1
        d_start = date(prev_y, prev_m, 1)
        next_m = (first_cur.month % 12) + 1
        next_y = first_cur.year if first_cur.month < 12 else first_cur.year + 1
        next_next_m = (next_m % 12) + 1
        next_next_y = next_y if next_m < 12 else next_y + 1
        d_end = date(next_next_y, next_next_m, 1) - timedelta(days=1)
    elif mode == "yesterday":
        d_start = now_date - timedelta(days=1)
        d_end = d_start + timedelta(days=7)
    elif mode == "tomorrow":
        d_start = now_date + timedelta(days=1)
        d_end = d_start + timedelta(days=7)
    elif mode == "today":
        d_start = now_date
        d_end = d_start + timedelta(days=7)
    elif mode == "day_after_tomorrow":
        d_start = now_date + timedelta(days=2)
        d_end = d_start
    elif mode in ("start_this_week", "start_previous_week", "start_next_week"):
        week_start_cfg = (cfg.get("calendarWeekStart") or "monday").lower()
        w_idx = 6 if week_start_cfg == "sunday" else (5 if week_start_cfg == "saturday" else 0)
        back = (now_date.weekday() - w_idx + 7) % 7
        d_start = now_date - timedelta(days=back)
        if mode == "start_previous_week":
            d_start -= timedelta(days=7)
        elif mode == "start_next_week":
            d_start += timedelta(days=7)
        d_end = d_start + timedelta(days=6)
    elif mode in ("start_this_month", "start_previous_month", "start_next_month"):
        month_offset = -1 if mode == "start_previous_month" else (1 if mode == "start_next_month" else 0)
        m = now_date.month + month_offset
        y = now_date.year
        if m < 1:
            m += 12
            y -= 1
        elif m > 12:
            m -= 12
            y += 1
        d_start = date(y, m, 1)
        nm = (m % 12) + 1
        ny = y if m < 12 else y + 1
        d_end = date(ny, nm, 1) - timedelta(days=1)
    else:
        days = TIMEFRAME_DAYS.get(mode, 7)
        d_start = now_date
        d_end = now_date + timedelta(days=days)

    start_dt = datetime.combine(d_start, time.min, tzinfo=tz).astimezone(timezone.utc)
    end_dt = datetime.combine(d_end, time.max, tzinfo=tz).astimezone(timezone.utc)
    return start_dt, end_dt


def filter_events_range(
    ics_text: str,
    start: datetime,
    end: datetime,
    calendar_id: str = "",
    fallback_tz: str = "UTC",
    max_events: int = 0,
) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    for event in parse_events(ics_text, fallback_tz):
        found.extend(expand_event(event, start, end, calendar_id=calendar_id))
        if max_events and len(found) >= max_events:
            break
    found.sort(key=lambda item: item["startDate"])
    if max_events:
        return found[:max_events]
    return found


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
    found.sort(key=lambda item: item["startDate"] if "startDate" in item else item["start"])
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
        start = _ics_stamp(str(event.get("startDate") or event.get("start") or ""))
        end = _ics_stamp(str(event.get("endDate") or event.get("end") or ""))
        lines = [
            "BEGIN:VEVENT",
            f"UID:{event.get('uid') or 'event'}",
            f"SUMMARY:{event.get('title') or event.get('summary') or 'Event'}",
        ]
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
        when = str(event.get("startDate") or event.get("start") or "").replace("T", " ").replace("Z", " UTC")
        lines.append(f"{when} {event.get('title') or event.get('summary') or 'Event'}".strip())
    return "\n".join(lines)
