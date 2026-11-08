"""In-process service handlers for the eight Dashboard Studio actions."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .calendar_ical import (
    calendar_window,
    coerce_calendar_source,
    derive_calendar_id,
    filter_events,
    filter_events_range,
    merge_ics_documents,
    occurrences_to_ics,
    resolve_filter_range,
    summary_text,
)
from .calendar_markdown import (
    event_blocks,
    events_to_markdown,
    generate_calendar_markdown,
    select_merged_events,
    source_blocks,
)
from .const import (
    DOMAIN,
    SERVICE_COMBINE_ICAL_DATA,
    SERVICE_FETCH_RSS_MARKDOWN,
    SERVICE_LOAD_FILTER_ICAL,
    SERVICE_RELOAD,
    SERVICE_SEND,
    SERVICE_SEND_INSIGHTS,
    SERVICE_SEND_INSIGHTS_ADVANCED,
    SERVICE_WEBCAL_TO_MARKDOWN,
)
from .insights import resample_data, time_window, window_start
from .rss_markdown import build_rss_markdown, parse_feed, parse_feed_specs
from .runtime import get_runtime

_LOGGER = logging.getLogger(__name__)


def _runtime_or_error(hass: HomeAssistant):
    runtime = get_runtime(hass)
    if runtime is None:
        raise RuntimeError("Dashboard Studio is not running")
    return runtime


async def _fetch_text(hass: HomeAssistant, url: str) -> str:
    target = url.strip()
    if target.lower().startswith("webcal://"):
        target = "https://" + target[len("webcal://") :]
    session = async_get_clientsession(hass)
    async with session.get(target, timeout=25) as response:
        response.raise_for_status()
        return await response.text()


async def _maybe_fetch_ics(hass: HomeAssistant, value: str) -> str:
    text = (value or "").strip()
    if text.lower().startswith(("http://", "https://", "webcal://")):
        return await _fetch_text(hass, text)
    return text


async def _history_entries(
    hass: HomeAssistant, entity_id: str, timespan: str
) -> tuple[list[dict[str, Any]], datetime, datetime]:
    start, end = time_window(timespan, tz_name=_fallback_tz(hass))
    try:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.history import get_significant_states
    except ImportError:
        _LOGGER.debug("Recorder is not available")
        return [], start, end

    def _load():
        try:
            return get_significant_states(
                hass,
                start,
                end,
                [entity_id],
                include_start_time_state=True,
                significant_changes_only=False,
                minimal_response=True,
            )
        except TypeError:
            return get_significant_states(hass, start, end, [entity_id])

    try:
        result = await get_instance(hass).async_add_executor_job(_load)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Recorder history for %s failed: %s", entity_id, err)
        return [], start, end

    states = []
    if isinstance(result, dict):
        states = result.get(entity_id) or []
    entries = []
    for state in states or []:
        raw = getattr(state, "state", None)
        try:
            value = float(raw)
        except (TypeError, ValueError):
            continue
        changed = getattr(state, "last_changed", None) or getattr(state, "last_updated", None)
        if changed is None:
            continue
        stamp = changed.isoformat()
        entries.append({"t": stamp, "v": value})

    # Fall back to long-term statistics if recorder purged raw states for long periods
    if len(entries) < 2 and (end - start).total_seconds() > 7 * 86400:
        try:
            from homeassistant.components.recorder.statistics import statistics_during_period

            period = "hour" if (end - start).total_seconds() <= 31 * 86400 else "day"
            stats = await get_instance(hass).async_add_executor_job(
                statistics_during_period,
                hass,
                start,
                end,
                {entity_id},
                period,
                None,
                {"mean", "state"},
            )
            if stats and entity_id in stats:
                for row in stats[entity_id]:
                    v = row.get("mean") if row.get("mean") is not None else row.get("state")
                    if v is not None:
                        t_sec = row.get("start")
                        if t_sec:
                            ts = datetime.fromtimestamp(t_sec, timezone.utc).isoformat()
                            entries.append({"t": ts, "v": float(v)})
        except Exception as stat_err:  # noqa: BLE001
            _LOGGER.debug("Statistics fallback for %s: %s", entity_id, stat_err)

    return entries, start, end


async def async_handle_send(call: ServiceCall) -> None:
    runtime = _runtime_or_error(call.hass)
    topic = str(call.data.get("topic") or "").strip()
    if not topic:
        return
    retain = call.data.get("retain", True) is not False
    await runtime.publish_custom(topic, call.data.get("value"), retain=retain)


async def async_handle_reload(call: ServiceCall) -> None:
    runtime = _runtime_or_error(call.hass)
    await runtime.async_reload_viewers(call.data.get("dashboard"))


async def async_handle_send_insights(call: ServiceCall) -> None:
    runtime = _runtime_or_error(call.hass)
    entity_id = str(call.data.get("entity_id") or "")
    timespan = str(call.data.get("timespan") or "24h")
    topic = str(call.data.get("topic") or "").strip() or entity_id
    datapoints = call.data.get("datapoints")
    entries, start, end = await _history_entries(call.hass, entity_id, timespan)
    points = resample_data(entries, start, end, datapoints=datapoints, aggregation="mean")
    await runtime.async_publish_insight(topic, points)


async def async_handle_send_insights_advanced(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    entity_id = str(call.data.get("entity_id") or "")
    timespan = str(call.data.get("timespan") or "24h")
    topic = str(call.data.get("topic") or "").strip() or entity_id
    datapoints = call.data.get("datapoints")
    resolution = str(call.data.get("resolution") or "auto")
    aggregation = str(call.data.get("aggregation") or "mean")
    entries, start, end = await _history_entries(call.hass, entity_id, timespan)
    points = resample_data(
        entries,
        start,
        end,
        datapoints=datapoints,
        resolution=resolution,
        aggregation=aggregation,
    )
    await runtime.async_publish_insight(topic, points)

    numeric_values = [p["v"] for p in points if p.get("v") is not None]
    highest = round(max(numeric_values), 2) if numeric_values else None
    lowest = round(min(numeric_values), 2) if numeric_values else None
    average = round(sum(numeric_values) / len(numeric_values), 2) if numeric_values else None
    last_val = round(numeric_values[-1], 2) if numeric_values else None

    return {
        "highest": highest,
        "lowest": lowest,
        "average": average,
        "last": last_val,
        "points": len(points),
        "raw_json": json.dumps(points),
        "data": points,
    }


def _fallback_tz(hass: HomeAssistant) -> str:
    return str(getattr(hass.config, "time_zone", None) or "UTC")


async def _extract_calendar_events(
    hass: HomeAssistant,
    raw_input: Any,
    runtime,
    fallback_tz: str,
) -> tuple[list[dict[str, Any]], str | None, str | None]:
    if not raw_input:
        return [], None, None

    if isinstance(raw_input, dict):
        if "events" in raw_input and isinstance(raw_input["events"], list):
            return raw_input["events"], raw_input.get("filterStart"), raw_input.get("filterEnd")
        if "filtered_events_json" in raw_input:
            return await _extract_calendar_events(hass, raw_input["filtered_events_json"], runtime, fallback_tz)
        if "combined_events_json" in raw_input:
            return await _extract_calendar_events(hass, raw_input["combined_events_json"], runtime, fallback_tz)

    text = str(raw_input).strip()
    if text.startswith("{"):
        try:
            payload = json.loads(text)
            if isinstance(payload, dict):
                if isinstance(payload.get("events"), list):
                    return payload["events"], payload.get("filterStart"), payload.get("filterEnd")
                if "filtered_events_json" in payload:
                    return await _extract_calendar_events(hass, payload["filtered_events_json"], runtime, fallback_tz)
                if "combined_events_json" in payload:
                    return await _extract_calendar_events(hass, payload["combined_events_json"], runtime, fallback_tz)
        except Exception:  # noqa: BLE001
            pass

    ics_raw = await _maybe_fetch_ics(hass, text)
    cal_id = derive_calendar_id(text)
    start_dt, end_dt = resolve_filter_range("previous_current_next_month", settings=runtime.settings, tz_name=fallback_tz)
    events = filter_events_range(ics_raw, start_dt, end_dt, calendar_id=cal_id, fallback_tz=fallback_tz)
    return events, start_dt.isoformat().replace("+00:00", "Z"), end_dt.isoformat().replace("+00:00", "Z")


async def async_handle_load_filter_ical(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    url = str(call.data.get("url") or "").strip()
    if not url:
        raise ValueError("Please provide a valid iCal URL starting with http:// or https://")

    target_mode = str(call.data.get("target_mode") or call.data.get("timeframe") or "previous_current_next_month").strip()
    custom_start = str(call.data.get("custom_start") or "").strip()
    custom_end = str(call.data.get("custom_end") or "").strip()
    max_events = int(call.data.get("max_events") or 0)
    fallback_tz = _fallback_tz(call.hass)

    raw = await _maybe_fetch_ics(call.hass, url)
    start_dt, end_dt = resolve_filter_range(
        target_mode,
        custom_start,
        custom_end,
        settings=runtime.settings,
        tz_name=fallback_tz,
    )
    cal_id = derive_calendar_id(url)
    events = filter_events_range(
        raw,
        start_dt,
        end_dt,
        calendar_id=cal_id,
        fallback_tz=fallback_tz,
        max_events=max_events,
    )

    payload = {
        "filterStart": start_dt.isoformat().replace("+00:00", "Z"),
        "filterEnd": end_dt.isoformat().replace("+00:00", "Z"),
        "events": events,
    }
    filtered_events_json = json.dumps(payload)
    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, filtered_events_json, retain=True)

    text = summary_text(events)
    return {
        "filtered_events_json": filtered_events_json,
        "events": events,
        "filterStart": payload["filterStart"],
        "filterEnd": payload["filterEnd"],
        "event_count": len(events),
        "summary_text": text,
        "ical_data": occurrences_to_ics(events),
    }


async def async_handle_webcal_to_markdown(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    fallback_tz = _fallback_tz(call.hass)
    fmt = str(call.data.get("format") or "day_view").strip()

    droptoken = call.data.get("droptoken")
    if not droptoken and (call.data.get("url_1") or call.data.get("url")):
        droptoken = call.data.get("url_1") or call.data.get("url")

    events: list[dict[str, Any]] = []
    if droptoken:
        events, _, _ = await _extract_calendar_events(call.hass, droptoken, runtime, fallback_tz)
    else:
        groups = []
        timeframe = str(call.data.get("timeframe") or "7d")
        for index in range(1, 6):
            raw_value = call.data.get(f"url_{index}")
            if not raw_value:
                continue
            text = coerce_calendar_source(await _maybe_fetch_ics(call.hass, str(raw_value)))
            evs = filter_events(text, timeframe, 0, fallback_tz=fallback_tz)
            label = str(call.data.get(f"label_{index}") or f"Calendar {index}")
            groups.append((label, evs))
        merged, _ = select_merged_events(groups, int(call.data.get("max_events") or 25))
        events = merged

    markdown_opts = dict(runtime.settings)
    markdown_opts["timeZone"] = fallback_tz
    markdown_opts["viewFormat"] = fmt
    markdown = generate_calendar_markdown(events, options=markdown_opts)

    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, markdown, retain=True)
        await runtime.publish_custom(f"{topic}_blocks", event_blocks(events), retain=True)

    return {
        "markdown": markdown,
        "event_count": len(events),
        "event_blocks_json": event_blocks(events),
    }


async def async_handle_combine_ical(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    fallback_tz = _fallback_tz(call.hass)

    token_a = call.data.get("events_token_a") or call.data.get("ical_1")
    token_b = call.data.get("events_token_b") or call.data.get("ical_2")

    events_a, start_a, end_a = await _extract_calendar_events(call.hass, token_a, runtime, fallback_tz)
    events_b, start_b, end_b = await _extract_calendar_events(call.hass, token_b, runtime, fallback_tz)

    merged_events = list(events_a) + list(events_b)
    all_starts = [s for s in (start_a, start_b) if s]
    all_ends = [e for e in (end_a, end_b) if e]

    for index in range(3, 6):
        raw_val = call.data.get(f"ical_{index}")
        if raw_val:
            evs, st, en = await _extract_calendar_events(call.hass, raw_val, runtime, fallback_tz)
            merged_events.extend(evs)
            if st:
                all_starts.append(st)
            if en:
                all_ends.append(en)

    merged_events.sort(key=lambda item: item.get("startDate") or item.get("start") or "")
    filter_start = min(all_starts) if all_starts else None
    filter_end = max(all_ends) if all_ends else None

    payload = {
        "filterStart": filter_start,
        "filterEnd": filter_end,
        "events": merged_events,
    }
    combined_events_json = json.dumps(payload)
    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, combined_events_json, retain=True)

    text = summary_text(merged_events)
    return {
        "combined_events_json": combined_events_json,
        "events": merged_events,
        "filterStart": filter_start,
        "filterEnd": filter_end,
        "event_count": len(merged_events),
        "summary_text": text,
        "ical_data": occurrences_to_ics(merged_events),
    }


async def async_handle_fetch_rss(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    raw_urls = str(call.data.get("urls") or call.data.get("url") or "")
    feed_specs = parse_feed_specs(raw_urls)
    if not feed_specs:
        raise ValueError("Please provide at least one valid RSS or Atom feed URL starting with http:// or https://")

    parsed_feeds: list[dict[str, Any] | None] = []
    last_error: Exception | None = None
    for spec in feed_specs:
        try:
            xml_text = await _fetch_text(call.hass, spec["url"])
            parsed = parse_feed(xml_text)
            parsed_feeds.append(parsed)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not fetch RSS feed %s: %s", spec["url"], err)
            last_error = err
            parsed_feeds.append(None)

    if all(f is None for f in parsed_feeds):
        raise RuntimeError(f"Could not load RSS feed: {last_error or 'connection failed'}")

    max_items = int(call.data.get("max_items") or 10)
    layout = str(call.data.get("layout") or "standard")
    image_width = int(call.data.get("image_width") or 180)
    date_format = str(call.data.get("date_format") or "default")
    user_date_format = str(runtime.settings.get("calendarDateFormat") or "dd-mm-yyyy")
    tz_name = _fallback_tz(call.hass)

    result = build_rss_markdown(
        feed_specs=feed_specs,
        parsed_feeds=parsed_feeds,
        layout=layout,
        max_items=max_items,
        date_format_mode=date_format,
        user_date_format=user_date_format,
        image_width=image_width,
        tz_name=tz_name,
    )

    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, result["markdown"], retain=True)

    return result


def async_register_services(hass: HomeAssistant) -> None:
    if hass.services.has_service(DOMAIN, SERVICE_SEND):
        return
    hass.services.async_register(DOMAIN, SERVICE_SEND, async_handle_send)
    hass.services.async_register(DOMAIN, SERVICE_RELOAD, async_handle_reload)
    hass.services.async_register(DOMAIN, SERVICE_SEND_INSIGHTS, async_handle_send_insights)
    hass.services.async_register(
        DOMAIN,
        SERVICE_SEND_INSIGHTS_ADVANCED,
        async_handle_send_insights_advanced,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_LOAD_FILTER_ICAL,
        async_handle_load_filter_ical,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_WEBCAL_TO_MARKDOWN,
        async_handle_webcal_to_markdown,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COMBINE_ICAL_DATA,
        async_handle_combine_ical,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_FETCH_RSS_MARKDOWN,
        async_handle_fetch_rss,
        supports_response=SupportsResponse.OPTIONAL,
    )


def async_unregister_services(hass: HomeAssistant) -> None:
    for service in (
        SERVICE_SEND,
        SERVICE_RELOAD,
        SERVICE_SEND_INSIGHTS,
        SERVICE_SEND_INSIGHTS_ADVANCED,
        SERVICE_LOAD_FILTER_ICAL,
        SERVICE_WEBCAL_TO_MARKDOWN,
        SERVICE_COMBINE_ICAL_DATA,
        SERVICE_FETCH_RSS_MARKDOWN,
    ):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)
