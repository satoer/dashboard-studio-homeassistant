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
    filter_events,
    merge_ics_documents,
    occurrences_to_ics,
    summary_text,
)
from .calendar_markdown import event_blocks, events_to_markdown, select_merged_events, source_blocks
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
from .rss_markdown import feed_response, feeds_to_markdown, parse_feed
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


async def async_handle_load_filter_ical(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    raw = await _maybe_fetch_ics(call.hass, str(call.data.get("url") or ""))
    timeframe = str(call.data.get("timeframe") or "7d")
    events = filter_events(raw, timeframe, int(call.data.get("max_events") or 50), fallback_tz=_fallback_tz(call.hass))
    text = summary_text(events)
    window_start, window_end = calendar_window(timeframe)
    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, text, retain=True)
    return {
        "ical_data": occurrences_to_ics(events),
        "event_count": len(events),
        "summary_text": text,
        "filterStart": window_start.isoformat().replace("+00:00", "Z"),
        "filterEnd": window_end.isoformat().replace("+00:00", "Z"),
        "events": events,
    }


async def async_handle_webcal_to_markdown(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    timeframe = str(call.data.get("timeframe") or "7d")
    maximum = int(call.data.get("max_events") or 25)
    groups = []
    for index in range(1, 6):
        raw_value = call.data.get(f"url_{index}")
        if not raw_value:
            continue
        text = coerce_calendar_source(await _maybe_fetch_ics(call.hass, str(raw_value)))
        events = filter_events(text, timeframe, 0, fallback_tz=_fallback_tz(call.hass))
        label = str(call.data.get(f"label_{index}") or f"Calendar {index}")
        groups.append((label, events))
    merged, sources = select_merged_events(groups, maximum)
    markdown_settings = dict(runtime.settings)
    markdown_settings["timeZone"] = _fallback_tz(call.hass)
    markdown = events_to_markdown(merged, settings=markdown_settings)
    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, markdown, retain=True)
        await runtime.publish_custom(f"{topic}_blocks", event_blocks(merged), retain=True)
        await runtime.publish_custom(f"{topic}_sources", source_blocks(sources), retain=True)
    return {
        "markdown": markdown,
        "event_count": len(merged),
        "event_blocks_json": event_blocks(merged),
        "source_blocks_json": source_blocks(sources),
    }


async def async_handle_combine_ical(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    documents = []
    for index in range(1, 6):
        raw_value = call.data.get(f"ical_{index}")
        if not raw_value:
            continue
        documents.append(coerce_calendar_source(await _maybe_fetch_ics(call.hass, str(raw_value))))
    combined = merge_ics_documents(documents) if documents else ""
    timeframe = str(call.data.get("timeframe") or "30d")
    events = filter_events(combined, timeframe, 0, fallback_tz=_fallback_tz(call.hass)) if combined else []
    text = summary_text(events)
    topic = str(call.data.get("topic") or "").strip()
    if topic and combined:
        await runtime.publish_custom(topic, combined, retain=True)
    return {"ical_data": combined, "event_count": len(events), "summary_text": text}


async def async_handle_fetch_rss(call: ServiceCall) -> ServiceResponse:
    runtime = _runtime_or_error(call.hass)
    urls = []
    extra = str(call.data.get("urls") or "")
    for piece in extra.replace(",", "\n").splitlines():
        if piece.strip():
            urls.append(piece.strip())
    single = str(call.data.get("url") or "").strip()
    if single and single not in urls:
        urls.insert(0, single)
    feeds = []
    for url in urls:
        feeds.append(parse_feed(await _fetch_text(call.hass, url)))
    maximum = int(call.data.get("max_items") or 10)
    markdown = feeds_to_markdown(
        feeds,
        max_items=maximum,
        include_summary=call.data.get("include_summary", True) is not False,
        include_links=call.data.get("include_links", True) is not False,
        layout=str(call.data.get("layout") or "standard"),
        date_format=str(call.data.get("date_format") or ""),
        image_width=int(call.data.get("image_width") or 0),
    )
    topic = str(call.data.get("topic") or "").strip()
    if topic:
        await runtime.publish_custom(topic, markdown, retain=True)
    response = {"markdown": markdown}
    response.update(feed_response(feeds, maximum))
    return response


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
