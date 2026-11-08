"""Markdown and JSON event table generator for Dashboard Studio calendar widgets."""

from __future__ import annotations

import json
import re
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
RRULE_DAY_TO_JS = {"SU": 0, "MO": 1, "TU": 2, "WE": 3, "TH": 4, "FR": 5, "SA": 6}

DEFAULT_ICON_BINDINGS_TEXT = (
    "ph-cake: birthday, bday, cake, anniversary, celebration\n"
    "ph-trash: trash, garbage, recycle, recycling, bin, dump, waste, disposal, rubbish"
)

CALENDAR_EVENT_ORDER_SEQUENCES = {
    "icon_time_title": ["icon", "time", "title"],
    "icon_title_time": ["icon", "title", "time"],
    "time_title_icon": ["time", "title", "icon"],
    "time_icon_title": ["time", "icon", "title"],
    "title_time_icon": ["title", "time", "icon"],
    "title_icon_time": ["title", "icon", "time"],
}

CALENDAR_VIEW_ALIASES = {
    "tomorrow_day_view": {"format": "day_view", "days": 1},
    "yesterday_day_view": {"format": "day_view", "days": -1},
    "next_week_view": {"format": "week_view", "days": 7},
    "previous_week_view": {"format": "week_view", "days": -7},
    "next_workweek_view": {"format": "workweek_view", "days": 7},
    "previous_workweek_view": {"format": "workweek_view", "days": -7},
    "next_weekend_view": {"format": "weekend_view", "days": 7},
    "next_month_view": {"format": "month_view", "months": 1},
    "previous_month_view": {"format": "month_view", "months": -1},
    "next_month_workweek_view": {"format": "month_workweek_view", "months": 1},
    "next_month_weekend_view": {"format": "month_weekend_view", "months": 1},
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


def parse_icon_bindings(text: str | None) -> list[dict[str, Any]]:
    raw = text if text is not None else DEFAULT_ICON_BINDINGS_TEXT
    bindings: list[dict[str, Any]] = []
    seen: set[str] = set()
    for line in str(raw).splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
        m = re.match(r"^\s*(ph-[a-z0-9-]+)\s*:\s*(.+?)\s*$", trimmed, re.IGNORECASE)
        if not m:
            continue
        icon = m.group(1).lower()
        if icon in seen:
            continue
        seen.add(icon)
        keywords = [k.strip().lower() for k in m.group(2).split(",") if k.strip()]
        bindings.append({"icon": icon, "keywords": keywords})
    return bindings


def icon_to_token(slug: str) -> str:
    t = str(slug or "ph-calendar").strip().lower()
    core = t[3:] if t.startswith("ph-") else t
    return f":ph-{core}:"


def build_icon_resolver(default_icon: str, bindings: list[dict[str, Any]]):
    def resolve(event: dict[str, Any]) -> str:
        title = str(event.get("title") or event.get("summary") or "").lower()
        for b in bindings:
            icon = b.get("icon") or ""
            for kw in b.get("keywords") or []:
                if kw and kw in title:
                    return icon_to_token(icon)
        if default_icon:
            d = default_icon.strip().lower()
            if d == "ph-spacer":
                return ""
            return icon_to_token(default_icon)
        return ""

    return resolve


def format_user_date(d: date, fmt: str) -> str:
    m = f"{d.month:02d}"
    day = f"{d.day:02d}"
    y = f"{d.year}"
    if fmt == "mm-dd-yyyy":
        return f"{m}-{day}-{y}"
    if fmt == "yyyy-mm-dd":
        return f"{y}-{m}-{day}"
    return f"{day}-{m}-{y}"


def format_time_str(dt: datetime, tz_name: str, i18n: dict[str, str]) -> str:
    tz = _resolve_zone(tz_name)
    local_dt = dt.astimezone(tz)
    formatted = local_dt.strftime("%H:%M")
    if formatted in ("00:00", "24:00"):
        return i18n.get("AllDay", "All Day")
    return formatted


def sanitize_block_inner(text: str) -> str:
    return str(text or "").replace("]", "\u203a")


def wrap_block(block_idx: int, inner: str) -> str:
    idx = block_idx if 1 <= block_idx <= 4 else 1
    return f"[block{idx}:{sanitize_block_inner(inner)}]"


def is_block_line(line: str) -> bool:
    return bool(re.match(r"^\[block[1-4]:", str(line or "").strip(), re.IGNORECASE))


def join_cell_parts(lines: list[str], use_blocks: bool) -> str:
    if not lines:
        return ""
    out = [lines[0]]
    for i in range(1, len(lines)):
        prev = lines[i - 1]
        curr = lines[i]
        no_break = use_blocks and is_block_line(prev) and is_block_line(curr)
        out.append(("" if no_break else "<br>") + curr)
    return "".join(out)


def parse_event_dt(val: Any) -> datetime | None:
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str) and val.strip():
        text = val.strip()
        try:
            if text.endswith("Z"):
                return datetime.strptime(text[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
            if "T" in text:
                return datetime.fromisoformat(text.replace("Z", "+00:00"))
            return datetime.strptime(text[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:  # noqa: BLE001
            pass
    return None


def is_all_day_event(event: dict[str, Any], tz_name: str) -> bool:
    if event.get("allDay") or event.get("isAllDay"):
        return True
    start = parse_event_dt(event.get("startDate") or event.get("start"))
    if not start:
        return False
    tz = _resolve_zone(tz_name)
    local_dt = start.astimezone(tz)
    return local_dt.hour == 0 and local_dt.minute == 0 and local_dt.second == 0


def get_timed_daypart(hour: int, i18n: dict[str, str]) -> tuple[int, str]:
    if hour < 6:
        return 0, i18n.get("Night", "Night")
    if hour < 12:
        return 1, i18n.get("Morning", "Morning")
    if hour < 18:
        return 2, i18n.get("Afternoon", "Afternoon")
    return 3, i18n.get("Evening", "Evening")


def resolve_event_block(event: dict[str, Any], color_mode: str, source_block_map: dict[str, int] | None) -> int:
    if color_mode == "calendar_source" and source_block_map:
        cid = str(event.get("calendarId") or "").strip()
        if cid in source_block_map:
            val = source_block_map[cid]
            if 1 <= val <= 4:
                return val
    raw = event.get("calendarEventBlock")
    try:
        num = int(raw)
        if 1 <= num <= 4:
            return num
    except (TypeError, ValueError):
        pass
    if event.get("isRecurring"):
        return 4
    if not event.get("isAllDay") and not event.get("allDay"):
        return 2
    if event.get("isMultiDay"):
        return 3
    return 1


def sort_events_for_display(events: list[dict[str, Any]], tz_name: str) -> list[dict[str, Any]]:
    tz = _resolve_zone(tz_name)

    def rank(ev: dict[str, Any]):
        all_day = is_all_day_event(ev, tz_name)
        rec = bool(ev.get("isRecurring"))
        multi = bool(ev.get("isMultiDay"))
        if multi and all_day:
            return 0
        if all_day and rec:
            return 1
        if all_day:
            return 2
        return 3

    def sort_key(ev: dict[str, Any]):
        r = rank(ev)
        start = parse_event_dt(ev.get("startDate") or ev.get("start"))
        sec = 0
        ms = 0
        if start:
            loc = start.astimezone(tz)
            sec = loc.hour * 3600 + loc.minute * 60 + loc.second
            ms = int(loc.timestamp() * 1000)
        title = str(ev.get("title") or ev.get("summary") or "")
        return (r, sec if r == 3 else 0, ms, title)

    return sorted(events, key=sort_key)


def join_segments(order: str, parts: dict[str, str], skip_time: bool = False) -> str:
    seq = CALENDAR_EVENT_ORDER_SEQUENCES.get(order, ["icon", "time", "title"])
    items = []
    for k in seq:
        if k == "time" and skip_time:
            continue
        v = str(parts.get(k) or "").strip()
        if v:
            items.append(v)
    return " ".join(items)


def build_day_markdown(
    events: list[dict[str, Any]],
    tz_name: str,
    get_icon,
    options: dict[str, Any],
    i18n: dict[str, str],
) -> str:
    if not events:
        return "*No events scheduled.*"
    sorted_evs = sort_events_for_display(events, tz_name)
    use_blocks = options.get("useBlocks", True)
    order = options.get("eventOrder", "icon_time_title")
    color_mode = options.get("calendarColorBlockMode", "event_type")
    source_map = options.get("calendarSourceBlockMap")

    time_lbl = i18n.get("Time", "Time")
    ev_lbl = i18n.get("Event", "Event")
    all_day_lbl = i18n.get("AllDay", "All Day")

    lines = [f"| {time_lbl} | {ev_lbl} |", "| :--- | :--- |"]
    for ev in sorted_evs:
        icon = get_icon(ev)
        start = parse_event_dt(ev.get("startDate") or ev.get("start"))
        all_day = is_all_day_event(ev, tz_name)
        time_text = f"**{all_day_lbl}**" if all_day or not start else f"**{format_time_str(start, tz_name, i18n)}**"
        title = str(ev.get("title") or ev.get("summary") or "Event")
        inner = join_segments(order, {"icon": icon, "time": "", "title": title}, skip_time=True)
        block_idx = resolve_event_block(ev, color_mode, source_map)
        ev_cell = wrap_block(block_idx, inner) if use_blocks else sanitize_block_inner(inner)
        lines.append(f"| {time_text} | {ev_cell} |")
    return "\n".join(lines)


def build_today_tomorrow_list_markdown(
    events: list[dict[str, Any]],
    today_date: date,
    tz_name: str,
    get_icon,
    options: dict[str, Any],
    i18n: dict[str, str],
) -> str:
    use_blocks = options.get("useBlocks", True)
    show_sections = options.get("showDaySections", True)
    order = options.get("eventOrder", "icon_time_title")
    color_mode = options.get("calendarColorBlockMode", "event_type")
    source_map = options.get("calendarSourceBlockMap")

    today_str = today_date.strftime("%Y-%m-%d")
    tom_str = (today_date + timedelta(days=1)).strftime("%Y-%m-%d")

    by_date: dict[str, list[dict[str, Any]]] = {today_str: [], tom_str: []}
    tz = _resolve_zone(tz_name)
    for ev in events:
        start = parse_event_dt(ev.get("startDate") or ev.get("start"))
        if not start:
            continue
        k = start.astimezone(tz).strftime("%Y-%m-%d")
        if k in by_date:
            by_date[k].append(ev)

    time_lbl = i18n.get("Time", "Time")
    ev_lbl = i18n.get("Event", "Event")
    all_day_lbl = i18n.get("AllDay", "All Day")
    table_head = f"| {time_lbl} | {ev_lbl} |\n| :--- | :--- |\n"

    def render_rows(ev_list: list[dict[str, Any]]) -> str:
        if not ev_list:
            return "|  | *No events scheduled.* |\n"
        sorted_list = sort_events_for_display(ev_list, tz_name)
        all_day_evs = [e for e in sorted_list if is_all_day_event(e, tz_name)]
        timed_evs = [e for e in sorted_list if not is_all_day_event(e, tz_name)]

        rows = []
        has_all_day_head = False
        for ev in all_day_evs:
            icon = get_icon(ev)
            title = str(ev.get("title") or ev.get("summary") or "Event")
            inner = join_segments(order, {"icon": icon, "time": "", "title": title}, skip_time=True)
            if show_sections and not has_all_day_head:
                rows.append(f"|  | **{all_day_lbl}** |\n")
                has_all_day_head = True
            b_idx = resolve_event_block(ev, color_mode, source_map)
            c_line = wrap_block(b_idx, inner) if use_blocks else sanitize_block_inner(inner)
            rows.append(f"| **{all_day_lbl.lower()}** | {c_line} |\n")

        last_part = None
        for ev in timed_evs:
            icon = get_icon(ev)
            start = parse_event_dt(ev.get("startDate") or ev.get("start"))
            time_part = format_time_str(start, tz_name, i18n) if start else ""
            title = str(ev.get("title") or ev.get("summary") or "Event")
            inner = join_segments(order, {"icon": icon, "time": "", "title": title}, skip_time=True)
            loc = start.astimezone(tz) if start else None
            h = loc.hour if loc else 0
            part_id, part_lbl = get_timed_daypart(h, i18n)
            if show_sections and last_part != part_id:
                rows.append(f"|  | **{part_lbl}** |\n")
                last_part = part_id
            b_idx = resolve_event_block(ev, color_mode, source_map)
            c_line = wrap_block(b_idx, inner) if use_blocks else sanitize_block_inner(inner)
            rows.append(f"| **{time_part}** | {c_line} |\n")
        return "".join(rows)

    today_title = i18n.get("Today", "Today")
    tom_title = i18n.get("Tomorrow", "Tomorrow")
    return (
        f"## {today_title}\n\n{table_head}{render_rows(by_date[today_str])}\n\n"
        f"## {tom_title}\n\n{table_head}{render_rows(by_date[tom_str])}"
    )


def build_week_markdown(
    events: list[dict[str, Any]],
    start_date: date,
    days: int,
    date_format: str,
    tz_name: str,
    get_icon,
    options: dict[str, Any],
    i18n: dict[str, str],
) -> str:
    use_blocks = options.get("useBlocks", True)
    show_sections = options.get("showDaySections", True)
    order = options.get("eventOrder", "icon_time_title")
    color_mode = options.get("calendarColorBlockMode", "event_type")
    source_map = options.get("calendarSourceBlockMap")
    tz = _resolve_zone(tz_name)

    by_date: dict[str, list[dict[str, Any]]] = {}
    for ev in events:
        start = parse_event_dt(ev.get("startDate") or ev.get("start"))
        if not start:
            continue
        k = start.astimezone(tz).strftime("%Y-%m-%d")
        by_date.setdefault(k, []).append(ev)

    header_cols = []
    align_cols = []
    cell_cols = []

    for i in range(days):
        cur_d = start_date + timedelta(days=i)
        cur_k = cur_d.strftime("%Y-%m-%d")
        js_dow = (cur_d.weekday() + 1) % 7
        day_name = i18n.get(DAY_NAMES[js_dow], DAY_NAMES[js_dow])
        d_str = format_user_date(cur_d, date_format)
        header_cols.append(f"{day_name}<br>{d_str}")
        align_cols.append(":---")

        day_evs = by_date.get(cur_k, [])
        if not day_evs:
            cell_cols.append(" ")
            continue

        sorted_evs = sort_events_for_display(day_evs, tz_name)
        lines: list[str] = []
        all_day_evs = [e for e in sorted_evs if is_all_day_event(e, tz_name)]
        timed_evs = [e for e in sorted_evs if not is_all_day_event(e, tz_name)]

        has_all_day_head = False
        for ev in all_day_evs:
            icon = get_icon(ev)
            title = str(ev.get("title") or ev.get("summary") or "Event")
            inner = join_segments(order, {"icon": icon, "time": "", "title": title})
            if show_sections and not has_all_day_head:
                lines.append(f"**{i18n.get('AllDay', 'All Day')}**")
                has_all_day_head = True
            b_idx = resolve_event_block(ev, color_mode, source_map)
            lines.append(wrap_block(b_idx, inner) if use_blocks else sanitize_block_inner(inner))

        last_part = None
        for ev in timed_evs:
            icon = get_icon(ev)
            start = parse_event_dt(ev.get("startDate") or ev.get("start"))
            time_inline = f"**{format_time_str(start, tz_name, i18n)}**" if start else ""
            title = str(ev.get("title") or ev.get("summary") or "Event")
            inner = join_segments(order, {"icon": icon, "time": time_inline, "title": title})
            loc = start.astimezone(tz) if start else None
            h = loc.hour if loc else 0
            part_id, part_lbl = get_timed_daypart(h, i18n)
            if show_sections and last_part != part_id:
                lines.append(f"**{part_lbl}**")
                last_part = part_id
            b_idx = resolve_event_block(ev, color_mode, source_map)
            lines.append(wrap_block(b_idx, inner) if use_blocks else sanitize_block_inner(inner))

        joined = join_cell_parts(lines, use_blocks)
        cell_cols.append(joined if joined else " ")

    return (
        f"| {' | '.join(header_cols)} |\n"
        f"| {' | '.join(align_cols)} |\n"
        f"| {' | '.join(cell_cols)} |\n"
    )


def build_month_markdown(
    events: list[dict[str, Any]],
    target_year: int,
    target_month: int,
    week_start_js: int,
    allowed_dows: list[int],
    tz_name: str,
    get_icon,
    options: dict[str, Any],
    i18n: dict[str, str],
) -> str:
    use_blocks = options.get("useBlocks", True)
    order = options.get("eventOrder", "icon_time_title")
    color_mode = options.get("calendarColorBlockMode", "event_type")
    source_map = options.get("calendarSourceBlockMap")
    tz = _resolve_zone(tz_name)

    by_date: dict[str, list[dict[str, Any]]] = {}
    for ev in events:
        start = parse_event_dt(ev.get("startDate") or ev.get("start"))
        if not start:
            continue
        k = start.astimezone(tz).strftime("%Y-%m-%d")
        by_date.setdefault(k, []).append(ev)

    columns = [(week_start_js + i) % 7 for i in range(7) if (week_start_js + i) % 7 in allowed_dows]
    headers = [i18n.get(DAY_NAMES[d], DAY_NAMES[d]) for d in columns]
    aligns = [":---" for _ in columns]

    md_lines = [f"| {' | '.join(headers)} |", f"| {' | '.join(aligns)} |"]

    nm = (target_month % 12) + 1
    ny = target_year if target_month < 12 else target_year + 1
    days_in_month = (date(ny, nm, 1) - timedelta(days=1)).day

    curr_row: list[str] = []
    for day in range(1, days_in_month + 1):
        cur_d = date(target_year, target_month, day)
        dow = (cur_d.weekday() + 1) % 7
        if dow not in allowed_dows:
            continue
        col_idx = columns.index(dow)
        if not curr_row:
            for j in range(col_idx):
                curr_row.append("&nbsp;<br>&nbsp;<br>&nbsp;" if not curr_row else "")

        cell = str(day)
        date_k = cur_d.strftime("%Y-%m-%d")
        if date_k in by_date:
            sorted_evs = sort_events_for_display(by_date[date_k], tz_name)
            first_mo = True
            for ev in sorted_evs:
                icon = get_icon(ev)
                start = parse_event_dt(ev.get("startDate") or ev.get("start"))
                all_day = is_all_day_event(ev, tz_name)
                time_inline = "" if all_day or not start else f"**{format_time_str(start, tz_name, i18n)}**"
                title = str(ev.get("title") or ev.get("summary") or "Event")
                inner = join_segments(order, {"icon": icon, "time": time_inline, "title": title})
                b_idx = resolve_event_block(ev, color_mode, source_map)
                wrapped = wrap_block(b_idx, inner) if use_blocks else sanitize_block_inner(inner)
                sep = "<br>" if first_mo else ("" if use_blocks else "<br>")
                cell += sep + wrapped
                first_mo = False

        if len(curr_row) == 0:
            br_count = cell.count("<br>")
            if br_count == 0:
                cell += "<br>&nbsp;<br>&nbsp;"
            elif br_count == 1:
                cell += "<br>&nbsp;"

        curr_row.append(cell)
        if len(curr_row) == len(columns):
            md_lines.append(f"| {' | '.join(curr_row)} |")
            curr_row = []

    if curr_row:
        while len(curr_row) < len(columns):
            curr_row.append("")
        md_lines.append(f"| {' | '.join(curr_row)} |")

    return "\n".join(md_lines) + "\n"


def generate_calendar_markdown(events: list[dict[str, Any]], options: dict[str, Any] | None = None) -> str:
    opts = options or {}
    tz_name = str(opts.get("timeZone") or "UTC")
    tz = _resolve_zone(tz_name)
    now_local = datetime.now(tz)
    today = now_local.date()

    fmt_raw = str(opts.get("viewFormat") or opts.get("format") or "day_view").strip().lower()
    view = CALENDAR_VIEW_ALIASES.get(fmt_raw, {"format": fmt_raw})
    view_fmt = view["format"]

    week_start_cfg = str(opts.get("weekStart") or "monday").strip().lower()
    week_start_js = 0 if week_start_cfg == "sunday" else (6 if week_start_cfg == "saturday" else 1)
    date_fmt = str(opts.get("dateFormat") or "dd-mm-yyyy").strip().lower()

    use_blocks = opts.get("useBlocks") is not False
    show_day_sections = opts.get("showDaySections") is not False
    color_mode = "calendar_source" if opts.get("calendarColorBlockMode") == "calendar_source" else "event_type"
    source_map = opts.get("calendarSourceBlockMap")
    event_order = str(opts.get("calendarEventOrder") or "icon_time_title")

    icon_bindings = parse_icon_bindings(opts.get("calendarIconBindingsText"))
    default_icon = str(opts.get("defaultIcon") or opts.get("calendarDefaultIcon") or "")
    get_icon = build_icon_resolver(default_icon, icon_bindings)

    i18n: dict[str, str] = {
        "Sun": "Sun",
        "Mon": "Mon",
        "Tue": "Tue",
        "Wed": "Wed",
        "Thu": "Thu",
        "Fri": "Fri",
        "Sat": "Sat",
        "Night": "Night",
        "Morning": "Morning",
        "Afternoon": "Afternoon",
        "Evening": "Evening",
        "AllDay": "All Day",
        "Today": "Today",
        "Tomorrow": "Tomorrow",
        "Time": "Time",
        "Event": "Event",
    }
    if isinstance(opts.get("i18n"), dict):
        i18n.update(opts["i18n"])

    render_opts = {
        "useBlocks": use_blocks,
        "showDaySections": show_day_sections,
        "eventOrder": event_order,
        "calendarColorBlockMode": color_mode,
        "calendarSourceBlockMap": source_map,
    }

    if view_fmt == "day_view":
        shift_days = int(view.get("days", 0))
        target_d = today + timedelta(days=shift_days)
        target_k = target_d.strftime("%Y-%m-%d")
        day_events = [
            e
            for e in events
            if parse_event_dt(e.get("startDate") or e.get("start"))
            and parse_event_dt(e.get("startDate") or e.get("start")).astimezone(tz).strftime("%Y-%m-%d") == target_k
        ]
        return build_day_markdown(day_events, tz_name, get_icon, render_opts, i18n)

    if view_fmt == "today_tomorrow_list":
        return build_today_tomorrow_list_markdown(events, today, tz_name, get_icon, render_opts, i18n)

    if view_fmt in ("week_view", "workweek_view", "weekend_view") or view_fmt.startswith("days_from_date_"):
        shift_days = int(view.get("days", 0))
        if view_fmt.startswith("days_from_date_"):
            n_days = int(view_fmt.split("_")[3])
            start_d = today
        elif view_fmt == "workweek_view":
            w_idx = 0  # Monday
            back = (today.weekday() - w_idx + 7) % 7
            start_d = today - timedelta(days=back) + timedelta(days=shift_days)
            n_days = 5
        elif view_fmt == "weekend_view":
            w_idx = 5  # Saturday
            back = (today.weekday() - w_idx + 7) % 7
            start_d = today - timedelta(days=back) + timedelta(days=shift_days)
            n_days = 2
        else:
            w_idx = 6 if week_start_js == 0 else (5 if week_start_js == 6 else 0)
            back = (today.weekday() - w_idx + 7) % 7
            start_d = today - timedelta(days=back) + timedelta(days=shift_days)
            n_days = 7
        return build_week_markdown(events, start_d, n_days, date_fmt, tz_name, get_icon, render_opts, i18n)

    if view_fmt in ("month_view", "month_workweek_view", "month_weekend_view"):
        shift_months = int(view.get("months", 0))
        m = today.month + shift_months
        y = today.year
        while m < 1:
            m += 12
            y -= 1
        while m > 12:
            m -= 12
            y += 1
        allowed = [0, 1, 2, 3, 4, 5, 6]
        if view_fmt == "month_workweek_view":
            allowed = [1, 2, 3, 4, 5]
        elif view_fmt == "month_weekend_view":
            allowed = [6, 0]
        return build_month_markdown(events, y, m, week_start_js, allowed, tz_name, get_icon, render_opts, i18n)

    return build_day_markdown(events, tz_name, get_icon, render_opts, i18n)


def events_to_markdown(events: list[dict[str, Any]], title: str = "Calendar", settings: dict[str, Any] | None = None) -> str:
    opts = dict(settings or {})
    return generate_calendar_markdown(events, opts)


def select_merged_events(groups: list[tuple[str, list[dict[str, Any]]]], maximum: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    merged: list[dict[str, Any]] = []
    order: list[str] = []
    for label, events in groups:
        order.append(label)
        for event in events:
            copied = dict(event)
            copied["source"] = label
            merged.append(copied)
    merged.sort(key=lambda item: item.get("startDate") or item.get("start") or "")
    if maximum:
        merged = merged[:maximum]
    counts: dict[str, int] = {}
    for event in merged:
        src = str(event.get("source") or "Calendar")
        counts[src] = counts.get(src, 0) + 1
    sources = [{"name": name, "count": counts.get(name, 0)} for name in order if counts.get(name, 0) > 0]
    return merged, sources


def event_blocks(events: list[dict[str, Any]]) -> str:
    payload = [
        {
            "summary": event.get("title") or event.get("summary") or "",
            "start": event.get("startDate") or event.get("start") or "",
            "end": event.get("endDate") or event.get("end") or "",
            "location": event.get("location") or "",
            "description": event.get("description") or "",
            "isTimed": event.get("isTimed"),
            "isAllDay": event.get("isAllDay"),
            "isMultiDay": event.get("isMultiDay"),
            "isRecurring": event.get("isRecurring"),
            "calendarEventKind": event.get("calendarEventKind") or "",
            "calendarEventBlock": event.get("calendarEventBlock") or 1,
            "source": event.get("source") or "",
        }
        for event in events
    ]
    return json.dumps(payload)


def source_blocks(sources: list[dict[str, Any]]) -> str:
    return json.dumps(sources)
