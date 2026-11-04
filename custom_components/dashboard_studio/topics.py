"""Pure topic, capability, and command mapping. No Home Assistant imports."""

from __future__ import annotations

import json
import re
from typing import Any

from .const import (
    FLOW_DOMAINS,
    HELPER_DOMAINS,
    LIGHT_COMPOSITE_CAP_ID,
    LIGHT_SINGLE_CAPS,
    MOOD_DOMAINS,
)

BINARY_ON_OFF_DOMAINS = frozenset(
    {
        "light",
        "switch",
        "binary_sensor",
        "input_boolean",
        "fan",
        "humidifier",
        "automation",
        "script",
        "remote",
        "siren",
    }
)

SKIP_RAW_ATTRIBUTES = frozenset(
    {
        "friendly_name",
        "icon",
        "entity_picture",
        "supported_features",
        "supported_color_modes",
        "color_mode",
        "hs_color",
        "rgb_color",
        "xy_color",
        "rgbw_color",
        "rgbww_color",
        "min_color_temp_kelvin",
        "max_color_temp_kelvin",
        "min_mireds",
        "max_mireds",
        "effect_list",
        "options",
        "hvac_modes",
        "fan_modes",
        "swing_modes",
        "preset_modes",
        "source_list",
        "sound_mode_list",
        "attribution",
        "device_class",
        "state_class",
        "restored",
        "editable",
        "unit_of_measurement",
        "native_unit_of_measurement",
        "display_precision",
        "suggested_display_precision",
        "last_reset",
        "assumed_state",
        "initial",
        "has_date",
        "has_time",
        "mode",
        "min",
        "max",
        "step",
        "pattern",
        "entity_id",
        "id",
        "user_id",
        "auto_update",
        "state_color",
    }
)

SENSOR_DEVICE_CLASS_MAP = {
    "temperature": ("measure_temperature", "Temperature"),
    "humidity": ("measure_humidity", "Humidity"),
    "carbon_dioxide": ("measure_co2", "CO2"),
    "co2": ("measure_co2", "CO2"),
    "carbon_monoxide": ("measure_co", "CO"),
    "co": ("measure_co", "CO"),
    "pm25": ("measure_pm25", "PM2.5"),
    "pm2_5": ("measure_pm25", "PM2.5"),
    "pm10": ("measure_pm10", "PM10"),
    "pm1": ("measure_pm1", "PM1"),
    "volatile_organic_compounds": ("measure_voc", "VOC"),
    "volatile_organic_compounds_parts": ("measure_voc", "VOC"),
    "voc": ("measure_voc", "VOC"),
    "aqi": ("measure_aqi", "Air Quality Index"),
    "nitrogen_dioxide": ("measure_no2", "NO2"),
    "ozone": ("measure_o3", "Ozone"),
    "power": ("measure_power", "Power"),
    "apparent_power": ("measure_power", "Apparent Power"),
    "reactive_power": ("measure_power", "Reactive Power"),
    "energy": ("meter_power", "Energy"),
    "energy_storage": ("meter_power", "Stored Energy"),
    "gas": ("meter_gas", "Gas"),
    "water": ("meter_water", "Water"),
    "battery": ("measure_battery", "Battery"),
    "illuminance": ("measure_luminance", "Luminance"),
    "pressure": ("measure_pressure", "Pressure"),
    "atmospheric_pressure": ("measure_pressure", "Atmospheric Pressure"),
    "voltage": ("measure_voltage", "Voltage"),
    "current": ("measure_current", "Current"),
    "frequency": ("measure_frequency", "Frequency"),
    "signal_strength": ("measure_signal_strength", "Signal Strength"),
    "sound_pressure": ("measure_noise", "Noise"),
    "wind_speed": ("measure_wind_strength", "Wind Speed"),
    "wind_direction": ("measure_wind_angle", "Wind Direction"),
    "precipitation": ("measure_rain", "Precipitation"),
    "precipitation_intensity": ("measure_rain", "Rain Intensity"),
    "moisture": ("measure_moisture", "Moisture"),
}

BINARY_SENSOR_DEVICE_CLASS_MAP = {
    "motion": ("alarm_motion", "Motion"),
    "occupancy": ("alarm_presence", "Occupancy"),
    "presence": ("alarm_presence", "Presence"),
    "door": ("alarm_contact", "Door Contact"),
    "garage_door": ("alarm_contact", "Garage Door"),
    "window": ("alarm_contact", "Window Contact"),
    "opening": ("alarm_contact", "Opening"),
    "smoke": ("alarm_smoke", "Smoke Alarm"),
    "gas": ("alarm_gas", "Gas Alarm"),
    "carbon_monoxide": ("alarm_co", "CO Alarm"),
    "moisture": ("alarm_water", "Water Leak"),
    "tamper": ("alarm_tamper", "Tamper Alarm"),
    "battery": ("alarm_battery", "Low Battery"),
    "heat": ("alarm_heat", "Heat Alarm"),
    "cold": ("alarm_cold", "Cold Alarm"),
    "problem": ("alarm_generic", "Problem"),
    "safety": ("alarm_generic", "Safety"),
    "vibration": ("alarm_vibration", "Vibration"),
    "connectivity": ("alarm_connectivity", "Connectivity"),
    "plug": ("onoff", "Plugged In"),
    "power": ("onoff", "Power"),
    "light": ("alarm_light", "Light Detected"),
    "sound": ("alarm_noise", "Sound Detected"),
    "lock": ("locked", "Lock"),
}

READ_ONLY_DOMAINS = frozenset(
    {"sensor", "binary_sensor", "weather", "sun", "person", "zone", "device_tracker"}
)


def clamp_num(value: Any, low: float, high: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return low
    if number != number or number in (float("inf"), float("-inf")):
        return low
    return min(high, max(low, number))


def round_to(value: Any, decimals: int) -> float:
    factor = 10 ** decimals
    return round(float(value) * factor) / factor


def slugify_entity_part(raw: Any) -> str:
    text = str(raw or "default").strip().lower()
    text = re.sub(r"\.json$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[^a-z0-9_]+", "_", text).strip("_")
    return text or "default"


def normalize_dashboard_id(value: Any) -> str:
    if not value:
        return ""
    return re.sub(r"\.json$", "", str(value).strip().lower(), flags=re.IGNORECASE)


def normalize_page_id(value: Any) -> str:
    if value is None or value == "":
        return ""
    return str(value).strip().lower()


def normalize_topic_prefix(topic: Any) -> str:
    if not isinstance(topic, str):
        return ""
    trimmed = topic.strip().lstrip("/")
    if trimmed.startswith("homeassistant/"):
        return trimmed[len("homeassistant/") :]
    if trimmed.startswith("homey/"):
        return trimmed[len("homey/") :]
    return trimmed


def domain_of(entity_id: str) -> str:
    return str(entity_id or "").split(".", 1)[0]


def is_read_only_domain(domain: str) -> bool:
    return domain in READ_ONLY_DOMAINS


def _finite(value: Any) -> bool:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False
    return number == number and number not in (float("inf"), float("-inf"))


def build_light_composite(state_obj: dict[str, Any] | None) -> dict[str, Any] | None:
    """Synthesize Homey-style light capabilities from a Home Assistant light state."""
    if not state_obj:
        return None
    attrs = state_obj.get("attributes") or {}
    is_on = state_obj.get("state") == "on"
    if _finite(attrs.get("brightness")):
        brightness = round_to(clamp_num(float(attrs["brightness"]) / 255, 0, 1), 2)
    else:
        brightness = 1 if is_on else 0

    hue = 0.0
    saturation = 0.0
    hs = attrs.get("hs_color")
    if isinstance(hs, (list, tuple)) and len(hs) >= 2 and _finite(hs[0]) and _finite(hs[1]):
        hue = round_to(clamp_num(float(hs[0]) / 360, 0, 1), 3)
        saturation = round_to(clamp_num(float(hs[1]) / 100, 0, 1), 3)

    temperature = 0.5
    if _finite(attrs.get("color_temp_kelvin")):
        min_k = float(attrs.get("min_color_temp_kelvin") or 2000)
        max_k = float(attrs.get("max_color_temp_kelvin") or 6535)
        span = max(1.0, max_k - min_k)
        temperature = round_to(clamp_num((max_k - float(attrs["color_temp_kelvin"])) / span, 0, 1), 3)
    elif _finite(attrs.get("color_temp")):
        min_m = float(attrs.get("min_mireds") or 153)
        max_m = float(attrs.get("max_mireds") or 500)
        span = max(1.0, max_m - min_m)
        temperature = round_to(clamp_num((float(attrs["color_temp"]) - min_m) / span, 0, 1), 3)

    color_mode = str(attrs.get("color_mode") or "").lower()
    mode = "color" if color_mode in ("hs", "rgb", "rgbw", "rgbww", "xy") else "temperature"
    composite = {
        "state": "ON" if is_on else "OFF",
        "brightness": int(round(brightness * 255)),
        "color_mode": "color_temp" if mode == "temperature" else "hs",
        "color": {"h": int(round(hue * 360)), "s": int(round(saturation * 100))},
        "color_temp": int(round(153 + (temperature * (500 - 153)))),
        "onoff": is_on,
        "dim": brightness,
        "mode": mode,
        "hue": hue,
        "saturation": saturation,
        "temperature": temperature,
    }
    return {
        "onoff": is_on,
        "dim": brightness,
        "mode": mode,
        "hue": hue,
        "saturation": saturation,
        "temperature": temperature,
        "compositeObject": composite,
        "compositeString": composite,
    }


def strip_device_prefix(friendly_name: str, device_name: str) -> str:
    fn = str(friendly_name or "").strip()
    dn = str(device_name or "").strip()
    if not fn or not dn:
        return fn
    if fn.lower().startswith(dn.lower()):
        stripped = re.sub(r"^[\s\-:·_]+", "", fn[len(dn) :]).strip()
        if stripped:
            return stripped
    return fn


def derive_entity_object_suffix(entity_id: str, device_slug: str) -> str:
    obj_id = ".".join(str(entity_id or "").split(".")[1:]) or str(entity_id or "")
    slug = slugify_entity_part(obj_id)
    prefix = f"{device_slug}_"
    if device_slug and slug.startswith(prefix):
        rest = slug[len(prefix) :].strip("_")
        if rest:
            return rest
    return slug


def resolve_primary_capability_meta(state_obj: dict[str, Any], options: dict[str, Any] | None = None) -> dict[str, Any]:
    options = options or {}
    entity_id = state_obj.get("entity_id") or ""
    domain = domain_of(entity_id)
    attrs = state_obj.get("attributes") or {}
    device_class = str(attrs.get("device_class") or "").strip().lower()
    unit = ""
    if attrs.get("unit_of_measurement") is not None:
        unit = str(attrs.get("unit_of_measurement")).strip()
    friendly = attrs.get("friendly_name") or entity_id
    device_name = options.get("deviceName") or ""
    device_slug = options.get("deviceSlug") or ""
    suffix = derive_entity_object_suffix(entity_id, device_slug)
    short_title = strip_device_prefix(str(friendly), device_name)

    def with_unit(label: str) -> str:
        base = str(label or "Value").strip()
        if not unit or base.endswith(f"({unit})"):
            return base
        return f"{base} ({unit})"

    if domain == "sensor":
        mapped = SENSOR_DEVICE_CLASS_MAP.get(device_class)
        if mapped:
            base_label = short_title if device_name and short_title != friendly else (short_title or mapped[1])
            return {"id": mapped[0], "title": with_unit(base_label), "units": unit or None}
        if suffix in ("carbon_dioxide", "co2") or suffix.endswith("_co2") or unit == "ppm":
            return {"id": "measure_co2", "title": with_unit(short_title or "CO2"), "units": unit or None}
        if suffix in ("temperature",) or suffix.endswith("_temperature") or unit in ("°C", "°F"):
            return {"id": "measure_temperature", "title": with_unit(short_title or "Temperature"), "units": unit or None}
        if suffix in ("humidity",) or suffix.endswith("_humidity"):
            return {"id": "measure_humidity", "title": with_unit(short_title or "Humidity"), "units": unit or None}
        if suffix in ("power",) or suffix.endswith("_power") or unit == "W":
            return {"id": "measure_power", "title": with_unit(short_title or "Power"), "units": unit or None}
        fallback = suffix or "state"
        return {"id": fallback, "title": with_unit(short_title or fallback.replace("_", " ")), "units": unit or None}

    if domain == "binary_sensor":
        mapped = BINARY_SENSOR_DEVICE_CLASS_MAP.get(device_class)
        if mapped:
            base_label = short_title if device_name and short_title != friendly else (short_title or mapped[1])
            return {"id": mapped[0], "title": base_label, "units": None}
        if suffix and (suffix.startswith("alarm_") or suffix == "onoff"):
            fallback = suffix
        elif suffix:
            fallback = f"alarm_{suffix}"
        else:
            fallback = "alarm_generic"
        return {"id": fallback, "title": short_title or "Binary Sensor", "units": None}

    if domain in ("number", "select", "text", "button"):
        fallback = suffix or "state"
        return {"id": fallback, "title": with_unit(short_title or "State"), "units": unit or None}

    return {
        "id": "state",
        "title": with_unit(short_title if device_name and short_title != friendly else "State"),
        "units": unit or None,
    }


def _parsed_state(domain: str, raw_state: Any, attrs: dict[str, Any]) -> Any:
    if domain in BINARY_ON_OFF_DOMAINS:
        return raw_state == "on"
    if raw_state not in ("unavailable", "unknown", "", None):
        if _finite(raw_state) and (
            attrs.get("unit_of_measurement") is not None or domain in ("number", "input_number", "counter", "sensor")
        ):
            return float(raw_state)
    return raw_state


def extract_capabilities(state_obj: dict[str, Any] | None, options: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
    caps: dict[str, dict[str, Any]] = {}
    if not state_obj or not state_obj.get("entity_id"):
        return caps
    options = options or {}
    entity_id = state_obj["entity_id"]
    domain = domain_of(entity_id)
    raw_state = state_obj.get("state")
    attrs = state_obj.get("attributes") or {}
    unit = None
    if attrs.get("unit_of_measurement") is not None:
        unit = str(attrs.get("unit_of_measurement")).strip()
    parsed = _parsed_state(domain, raw_state, attrs)

    if domain == "light":
        light = build_light_composite(state_obj)
        if light:
            caps["onoff"] = {"value": light["onoff"], "title": "On / Off", "type": "boolean", "units": None}
            caps["dim"] = {"value": light["dim"], "title": "Dim level (0-1)", "type": "number", "units": None}
            caps["light_hue"] = {"value": light["hue"], "title": "Light Hue (0-1)", "type": "number", "units": None}
            caps["light_saturation"] = {
                "value": light["saturation"],
                "title": "Light Saturation (0-1)",
                "type": "number",
                "units": None,
            }
            caps["light_temperature"] = {
                "value": light["temperature"],
                "title": "Color Temperature (0-1)",
                "type": "number",
                "units": None,
            }
            caps["light_mode"] = {"value": light["mode"], "title": "Light Mode", "type": "string", "units": None}
            caps[LIGHT_COMPOSITE_CAP_ID] = {
                "value": light["compositeString"],
                "title": "Light Controller (Composite JSON)",
                "type": "string",
                "units": None,
            }
    elif domain in ("sensor", "binary_sensor", "number", "select", "text", "button"):
        meta = resolve_primary_capability_meta(state_obj, options)
        caps[meta["id"]] = {
            "value": parsed,
            "title": meta["title"],
            "type": type(parsed).__name__,
            "units": meta["units"],
            "isPrimary": True,
        }
    elif domain in BINARY_ON_OFF_DOMAINS:
        short = ""
        if options.get("deviceName"):
            short = strip_device_prefix(str(attrs.get("friendly_name") or entity_id), options["deviceName"])
        title = "On / Off"
        friendly = str(attrs.get("friendly_name") or entity_id)
        if short and short != friendly:
            title = f"{short} · On / Off"
        caps["onoff"] = {"value": raw_state == "on", "title": title, "type": "boolean", "units": None, "isPrimary": True}
    elif domain == "cover":
        if _finite(attrs.get("current_position")):
            pos = round_to(clamp_num(float(attrs["current_position"]) / 100, 0, 1), 2)
        else:
            pos = 1 if raw_state == "open" else 0
        motion = "up" if raw_state == "opening" else ("down" if raw_state == "closing" else "idle")
        caps["windowcoverings_set"] = {
            "value": pos,
            "title": "Position (0-1)",
            "type": "number",
            "units": None,
            "isPrimary": True,
        }
        caps["windowcoverings_state"] = {"value": motion, "title": "Cover State", "type": "string", "units": None}
    elif domain == "climate":
        if attrs.get("temperature") is not None and _finite(attrs.get("temperature")):
            caps["target_temperature"] = {
                "value": float(attrs["temperature"]),
                "title": "Target Temperature",
                "type": "number",
                "units": unit or "°C",
                "isPrimary": True,
            }
        if attrs.get("current_temperature") is not None and _finite(attrs.get("current_temperature")):
            caps["measure_temperature"] = {
                "value": float(attrs["current_temperature"]),
                "title": "Current Temperature",
                "type": "number",
                "units": unit or "°C",
            }
        caps["hvac_mode"] = {"value": str(raw_state or ""), "title": "HVAC Mode", "type": "string", "units": None}
    elif domain == "lock":
        caps["locked"] = {"value": raw_state == "locked", "title": "Locked", "type": "boolean", "units": None, "isPrimary": True}
    else:
        meta = resolve_primary_capability_meta(state_obj, options)
        caps[meta["id"]] = {
            "value": parsed,
            "title": meta["title"],
            "type": type(parsed).__name__,
            "units": meta["units"],
            "isPrimary": True,
        }

    for attr_key, attr_val in attrs.items():
        if attr_key in SKIP_RAW_ATTRIBUTES or attr_key in caps:
            continue
        if attr_val is None or isinstance(attr_val, (dict, list)):
            continue
        caps[attr_key] = {
            "value": attr_val,
            "title": attr_key.replace("_", " ").title(),
            "type": type(attr_val).__name__,
            "units": None,
        }
    return caps


def extract_helper_value(state_obj: dict[str, Any] | None) -> Any:
    if not state_obj:
        return None
    domain = domain_of(state_obj.get("entity_id") or "")
    raw = state_obj.get("state")
    if domain == "input_boolean":
        return raw == "on"
    if domain in ("input_number", "counter"):
        return float(raw) if _finite(raw) else 0
    return raw


def _area_name(entity_id: str, entities: dict, devices: dict, areas: dict) -> str:
    ent = entities.get(entity_id) or {}
    area_id = ent.get("area_id")
    if area_id and area_id in areas:
        return areas[area_id]
    device_id = ent.get("device_id")
    device = devices.get(device_id) if device_id else None
    if device and device.get("area_id") and device["area_id"] in areas:
        return areas[device["area_id"]]
    return "Default"


def build_catalog(
    states: list[dict[str, Any]],
    entities: dict[str, dict[str, Any]] | None = None,
    devices: dict[str, dict[str, Any]] | None = None,
    areas: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Group entities into the admin catalog and capability lookup maps."""
    entities = entities or {}
    devices = devices or {}
    areas = areas or {}
    result: list[dict[str, Any]] = []
    by_key: dict[str, dict[str, Any]] = {}
    by_entity: dict[str, list[dict[str, Any]]] = {}

    def register(mapping: dict[str, Any]) -> None:
        by_key[f"{mapping['deviceId']}/{mapping['capId']}"] = mapping
        by_entity.setdefault(mapping["entityId"], []).append(mapping)

    ordered = sorted(
        [st for st in states if st and st.get("entity_id")],
        key=lambda st: str((st.get("attributes") or {}).get("friendly_name") or st["entity_id"]),
    )
    buckets: dict[str, list[dict[str, Any]]] = {}
    standalone: list[dict[str, Any]] = []

    for st in ordered:
        entity_id = st["entity_id"]
        if entity_id.startswith("binary_sensor.dashboard_studio_"):
            continue
        domain = domain_of(entity_id)
        friendly = (st.get("attributes") or {}).get("friendly_name") or entity_id
        if domain in FLOW_DOMAINS:
            result.append(
                {
                    "id": entity_id,
                    "name": friendly,
                    "zoneName": "Flows",
                    "capabilities": [
                        {
                            "id": "start",
                            "title": "Run Script" if domain == "script" else "Trigger Automation",
                            "type": "boolean",
                            "getable": False,
                            "setable": True,
                            "topic": f"homeassistant/flows/{entity_id}/start",
                        },
                        {
                            "id": "enabled",
                            "title": "Enabled",
                            "type": "boolean",
                            "getable": True,
                            "setable": domain == "automation",
                            "topic": f"homeassistant/flows/{entity_id}/enabled",
                        },
                    ],
                }
            )
            continue
        if domain in MOOD_DOMAINS:
            result.append(
                {
                    "id": entity_id,
                    "name": friendly,
                    "zoneName": "Moods",
                    "isMood": True,
                    "moodZone": _area_name(entity_id, entities, devices, areas),
                    "capabilities": [
                        {
                            "id": "set",
                            "title": "Activate Scene",
                            "type": "boolean",
                            "getable": False,
                            "setable": True,
                            "topic": f"homeassistant/moods/{entity_id}/set",
                        }
                    ],
                }
            )
            continue
        if domain in HELPER_DOMAINS:
            helper_val = extract_helper_value(st)
            result.append(
                {
                    "id": entity_id,
                    "name": friendly,
                    "zoneName": "Variables",
                    "capabilities": [
                        {
                            "id": "value",
                            "title": f"{friendly} ({type(helper_val).__name__})",
                            "type": type(helper_val).__name__,
                            "getable": True,
                            "setable": True,
                            "topic": f"homeassistant/variables/{entity_id}/value",
                        }
                    ],
                }
            )
            continue
        ent = entities.get(entity_id) or {}
        device_id = ent.get("device_id")
        if device_id and device_id in devices:
            buckets.setdefault(device_id, []).append(st)
        else:
            standalone.append(st)

    used_slugs: set[str] = set()
    for device_id, children in buckets.items():
        device = devices.get(device_id) or {}
        first_friendly = (children[0].get("attributes") or {}).get("friendly_name") or device_id
        device_name = str(device.get("name_by_user") or device.get("name") or first_friendly).strip()
        device_slug = slugify_entity_part(device_name)
        if not device_slug or device_slug in used_slugs:
            device_slug = f"{device_slug or 'device'}_{slugify_entity_part(device_id)[:6]}"
        used_slugs.add(device_slug)
        zone_name = "Default"
        if device.get("area_id") and device["area_id"] in areas:
            zone_name = areas[device["area_id"]]
        else:
            for child in children:
                candidate = _area_name(child["entity_id"], entities, devices, areas)
                if candidate and candidate != "Default":
                    zone_name = candidate
                    break
        raw_entries = []
        base_count: dict[str, int] = {}
        for child in children:
            extracted = extract_capabilities(child, {"deviceName": device_name, "deviceSlug": device_slug})
            suffix = derive_entity_object_suffix(child["entity_id"], device_slug)
            short_label = strip_device_prefix(
                str((child.get("attributes") or {}).get("friendly_name") or child["entity_id"]),
                device_name,
            )
            for cap_id, cap_meta in extracted.items():
                base_count[cap_id] = base_count.get(cap_id, 0) + 1
                raw_entries.append(
                    {
                        "entityId": child["entity_id"],
                        "domain": domain_of(child["entity_id"]),
                        "entityCapId": cap_id,
                        "capMeta": cap_meta,
                        "suffixSlug": suffix,
                        "shortEntityLabel": short_label,
                    }
                )
        capabilities = []
        seen: set[str] = set()
        for item in raw_entries:
            final_id = item["entityCapId"]
            final_title = item["capMeta"].get("title") or final_id
            if base_count.get(item["entityCapId"], 0) > 1:
                if item["suffixSlug"] and item["suffixSlug"] != item["entityCapId"]:
                    final_id = f"{item['entityCapId']}_{item['suffixSlug']}"
                label = item["shortEntityLabel"]
                if label and label.lower() not in final_title.lower():
                    final_title = f"{label} · {final_title}"
            if final_id in seen:
                final_id = f"{final_id}_{slugify_entity_part(item['entityId'])}"
            seen.add(final_id)
            setable = not is_read_only_domain(item["domain"])
            topic = f"homeassistant/{device_slug}/{final_id}"
            capabilities.append(
                {
                    "id": final_id,
                    "title": final_title,
                    "type": item["capMeta"].get("type") or "string",
                    "units": item["capMeta"].get("units"),
                    "getable": True,
                    "setable": setable,
                    "topic": topic,
                    "entityId": item["entityId"],
                }
            )
            register(
                {
                    "deviceId": device_slug,
                    "deviceName": device_name,
                    "zoneName": zone_name,
                    "capId": final_id,
                    "title": f"{device_name} · {final_title}",
                    "type": item["capMeta"].get("type") or "string",
                    "units": item["capMeta"].get("units"),
                    "getable": True,
                    "setable": setable,
                    "topic": topic,
                    "entityId": item["entityId"],
                    "entityCapId": item["entityCapId"],
                }
            )
        if capabilities:
            result.append({"id": device_slug, "name": device_name, "zoneName": zone_name, "capabilities": capabilities})

    for st in standalone:
        entity_id = st["entity_id"]
        domain = domain_of(entity_id)
        friendly = (st.get("attributes") or {}).get("friendly_name") or entity_id
        zone_name = _area_name(entity_id, entities, devices, areas)
        extracted = extract_capabilities(st)
        capabilities = []
        for cap_id, cap_meta in extracted.items():
            setable = not is_read_only_domain(domain)
            topic = f"homeassistant/{entity_id}/{cap_id}"
            capabilities.append(
                {
                    "id": cap_id,
                    "title": cap_meta.get("title") or cap_id,
                    "type": cap_meta.get("type") or "string",
                    "units": cap_meta.get("units"),
                    "getable": True,
                    "setable": setable,
                    "topic": topic,
                    "entityId": entity_id,
                }
            )
            register(
                {
                    "deviceId": entity_id,
                    "deviceName": friendly,
                    "zoneName": zone_name,
                    "capId": cap_id,
                    "title": f"{friendly} · {cap_meta.get('title') or cap_id}",
                    "type": cap_meta.get("type") or "string",
                    "units": cap_meta.get("units"),
                    "getable": True,
                    "setable": setable,
                    "topic": topic,
                    "entityId": entity_id,
                    "entityCapId": cap_id,
                }
            )
        result.append(
            {"id": entity_id, "name": friendly, "zoneName": zone_name, "capabilities": capabilities}
        )

    return {"devices": result, "by_key": by_key, "by_entity": by_entity}


def enabled_payloads_for_state(
    state_obj: dict[str, Any],
    catalog: dict[str, Any],
    enabled: dict[str, list[str]],
) -> list[dict[str, Any]]:
    """Return mqtt-style payloads for one state if its capabilities are whitelisted."""
    entity_id = state_obj.get("entity_id") or ""
    if not entity_id:
        return []
    payloads: list[dict[str, Any]] = []
    mappings = (catalog.get("by_entity") or {}).get(entity_id) or []
    for mapping in mappings:
        allowed = enabled.get(mapping["deviceId"])
        if isinstance(allowed, list) and mapping["capId"] in allowed:
            extracted = extract_capabilities(
                state_obj,
                {"deviceName": mapping.get("deviceName"), "deviceSlug": mapping.get("deviceId")},
            )
            cap_meta = extracted.get(mapping.get("entityCapId"))
            if cap_meta is None:
                continue
            payloads.append(
                {
                    "topic": mapping["topic"],
                    "value": cap_meta.get("value"),
                    "deviceId": mapping["deviceId"],
                    "capabilityId": mapping["capId"],
                    "setable": mapping.get("setable", True),
                    "getable": mapping.get("getable", True),
                    "title": mapping.get("title"),
                    "units": cap_meta.get("units") or mapping.get("units"),
                    "isVariable": False,
                    "isFlow": False,
                    "isMood": False,
                    "zoneName": mapping.get("zoneName"),
                    "domain": domain_of(entity_id),
                    "entityId": entity_id,
                }
            )

    direct = enabled.get(entity_id)
    domain = domain_of(entity_id)
    if isinstance(direct, list) and direct and (
        domain in FLOW_DOMAINS or domain in MOOD_DOMAINS or domain in HELPER_DOMAINS or not mappings
    ):
        payloads.extend(_direct_entity_payloads(state_obj, direct))
    return payloads


def _direct_entity_payloads(state_obj: dict[str, Any], enabled_caps: list[str]) -> list[dict[str, Any]]:
    entity_id = state_obj["entity_id"]
    domain = domain_of(entity_id)
    attrs = state_obj.get("attributes") or {}
    friendly = attrs.get("friendly_name") or entity_id
    out: list[dict[str, Any]] = []
    if domain in HELPER_DOMAINS and ("value" in enabled_caps or "state" in enabled_caps):
        val = extract_helper_value(state_obj)
        out.append(
            {
                "topic": f"homeassistant/variables/{entity_id}/value",
                "value": val,
                "deviceId": entity_id,
                "capabilityId": "value",
                "setable": True,
                "getable": True,
                "title": friendly,
                "isVariable": True,
                "domain": domain,
                "entityId": entity_id,
            }
        )
        return out
    if domain in FLOW_DOMAINS:
        if "start" in enabled_caps:
            out.append(
                {
                    "topic": f"homeassistant/flows/{entity_id}/start",
                    "value": False,
                    "deviceId": entity_id,
                    "capabilityId": "start",
                    "setable": True,
                    "getable": False,
                    "title": f"{friendly} · Start",
                    "isFlow": True,
                    "domain": domain,
                    "entityId": entity_id,
                }
            )
        if "enabled" in enabled_caps:
            out.append(
                {
                    "topic": f"homeassistant/flows/{entity_id}/enabled",
                    "value": state_obj.get("state") == "on",
                    "deviceId": entity_id,
                    "capabilityId": "enabled",
                    "setable": domain == "automation",
                    "getable": True,
                    "title": f"{friendly} · Enabled",
                    "isFlow": True,
                    "domain": domain,
                    "entityId": entity_id,
                }
            )
        return out
    if domain in MOOD_DOMAINS and "set" in enabled_caps:
        out.append(
            {
                "topic": f"homeassistant/moods/{entity_id}/set",
                "value": False,
                "deviceId": entity_id,
                "capabilityId": "set",
                "setable": True,
                "getable": False,
                "title": friendly,
                "isMood": True,
                "domain": domain,
                "entityId": entity_id,
            }
        )
        return out
    extracted = extract_capabilities(state_obj)
    primary = next((key for key, meta in extracted.items() if meta.get("isPrimary")), None)
    for cap_id in enabled_caps:
        cap_meta = extracted.get(cap_id) or (extracted.get(primary) if cap_id == "state" and primary else None)
        if not cap_meta:
            continue
        out.append(
            {
                "topic": f"homeassistant/{entity_id}/{cap_id}",
                "value": cap_meta.get("value"),
                "deviceId": entity_id,
                "capabilityId": cap_id,
                "setable": not is_read_only_domain(domain),
                "getable": True,
                "title": f"{friendly} · {cap_meta.get('title') or cap_id}",
                "units": cap_meta.get("units"),
                "domain": domain,
                "entityId": entity_id,
            }
        )
    return out


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value == 1 or value > 0 and value == 1
    text = str(value).strip().lower()
    return text in ("true", "1", "on", "yes")


def plan_service_calls(entity_id: str, cap_id: str, value: Any, attrs: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Translate a capability write into one or more Home Assistant service calls."""
    attrs = attrs or {}
    domain = domain_of(entity_id)
    calls: list[dict[str, Any]] = []

    def add(service_domain: str, service: str, data: dict[str, Any]) -> None:
        calls.append({"domain": service_domain, "service": service, "data": data})

    if domain == "light":
        if cap_id == LIGHT_COMPOSITE_CAP_ID:
            parsed = value
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                except json.JSONDecodeError:
                    return calls
            if not isinstance(parsed, dict):
                return calls
            if parsed.get("onoff") is False or parsed.get("state") in ("OFF", False):
                add("light", "turn_off", {"entity_id": entity_id})
                return calls
            data: dict[str, Any] = {"entity_id": entity_id}
            if parsed.get("brightness") is not None and _finite(parsed.get("brightness")):
                data["brightness"] = int(round(clamp_num(parsed["brightness"], 0, 255)))
            elif parsed.get("dim") is not None and _finite(parsed.get("dim")):
                data["brightness"] = int(round(clamp_num(parsed["dim"], 0, 1) * 255))
            if isinstance(parsed.get("color"), dict) and (
                parsed.get("color_mode") == "hs" or parsed.get("color") is not None
            ):
                current = attrs.get("hs_color") if isinstance(attrs.get("hs_color"), (list, tuple)) else [0, 100]
                hue = clamp_num(parsed["color"].get("h", current[0]), 0, 360)
                sat = clamp_num(parsed["color"].get("s", current[1]), 0, 100)
                data["hs_color"] = [round_to(hue, 1), round_to(sat, 1)]
            elif parsed.get("temperature") is not None and _finite(parsed.get("temperature")):
                min_k = float(attrs.get("min_color_temp_kelvin") or 2000)
                max_k = float(attrs.get("max_color_temp_kelvin") or 6535)
                temp = clamp_num(parsed["temperature"], 0, 1)
                data["color_temp_kelvin"] = int(round(max_k - temp * (max_k - min_k)))
            add("light", "turn_on", data)
            return calls
        if cap_id in ("onoff", "state"):
            add("light", "turn_on" if _truthy(value) else "turn_off", {"entity_id": entity_id})
            return calls
        if cap_id == "dim" and _finite(value):
            num = clamp_num(value, 0, 1)
            if num <= 0:
                add("light", "turn_off", {"entity_id": entity_id})
            else:
                add("light", "turn_on", {"entity_id": entity_id, "brightness": int(round(num * 255))})
            return calls
        if cap_id in ("light_hue", "light_saturation"):
            current = attrs.get("hs_color") if isinstance(attrs.get("hs_color"), (list, tuple)) else [0, 100]
            hue = clamp_num(value, 0, 1) * 360 if cap_id == "light_hue" else float(current[0] or 0)
            sat = clamp_num(value, 0, 1) * 100 if cap_id == "light_saturation" else float(current[1] or 100)
            add("light", "turn_on", {"entity_id": entity_id, "hs_color": [round_to(hue, 1), round_to(sat, 1)]})
            return calls
        if cap_id == "light_temperature" and _finite(value):
            min_k = float(attrs.get("min_color_temp_kelvin") or 2000)
            max_k = float(attrs.get("max_color_temp_kelvin") or 6535)
            temp = clamp_num(value, 0, 1)
            add(
                "light",
                "turn_on",
                {"entity_id": entity_id, "color_temp_kelvin": int(round(max_k - temp * (max_k - min_k)))},
            )
            return calls

    if domain in BINARY_ON_OFF_DOMAINS and cap_id in ("onoff", "state"):
        add(domain, "turn_on" if _truthy(value) else "turn_off", {"entity_id": entity_id})
        return calls
    if domain == "cover":
        if cap_id in ("windowcoverings_set", "current_position") and _finite(value):
            num = float(value)
            pos = int(round(clamp_num(num, 0, 1) * 100)) if num <= 1 and cap_id == "windowcoverings_set" else int(round(clamp_num(num, 0, 100)))
            add("cover", "set_cover_position", {"entity_id": entity_id, "position": pos})
        else:
            text = str(value).lower()
            if text in ("up", "open") or value is True:
                add("cover", "open_cover", {"entity_id": entity_id})
            elif text in ("down", "close", "closed") or value is False:
                add("cover", "close_cover", {"entity_id": entity_id})
            else:
                add("cover", "stop_cover", {"entity_id": entity_id})
        return calls
    if domain == "climate":
        if cap_id in ("target_temperature", "temperature") and _finite(value):
            add("climate", "set_temperature", {"entity_id": entity_id, "temperature": float(value)})
        elif cap_id in ("state", "hvac_mode"):
            add("climate", "set_hvac_mode", {"entity_id": entity_id, "hvac_mode": str(value)})
        return calls
    if domain == "lock":
        add("lock", "lock" if _truthy(value) or str(value).lower() == "locked" else "unlock", {"entity_id": entity_id})
        return calls
    if domain in ("button", "input_button"):
        add(domain, "press", {"entity_id": entity_id})
        return calls
    if domain in HELPER_DOMAINS or domain in ("number", "select", "text"):
        calls.extend(plan_helper_call(entity_id, value))
    return calls


def plan_helper_call(entity_id: str, value: Any) -> list[dict[str, Any]]:
    domain = domain_of(entity_id)
    if domain == "input_boolean":
        return [
            {
                "domain": "input_boolean",
                "service": "turn_on" if _truthy(value) else "turn_off",
                "data": {"entity_id": entity_id},
            }
        ]
    if domain == "input_number":
        return [{"domain": "input_number", "service": "set_value", "data": {"entity_id": entity_id, "value": float(value)}}]
    if domain == "number":
        return [{"domain": "number", "service": "set_value", "data": {"entity_id": entity_id, "value": float(value)}}]
    if domain == "input_text":
        return [{"domain": "input_text", "service": "set_value", "data": {"entity_id": entity_id, "value": "" if value is None else str(value)}}]
    if domain == "text":
        return [{"domain": "text", "service": "set_value", "data": {"entity_id": entity_id, "value": "" if value is None else str(value)}}]
    if domain == "input_select":
        return [{"domain": "input_select", "service": "select_option", "data": {"entity_id": entity_id, "option": str(value)}}]
    if domain == "select":
        return [{"domain": "select", "service": "select_option", "data": {"entity_id": entity_id, "option": str(value)}}]
    if domain == "counter":
        return [{"domain": "counter", "service": "set_value", "data": {"entity_id": entity_id, "value": int(round(float(value)))}}]
    if domain == "input_datetime":
        return [{"domain": "input_datetime", "service": "set_datetime", "data": {"entity_id": entity_id, "datetime": str(value)}}]
    if domain == "timer":
        return [{"domain": "timer", "service": "start", "data": {"entity_id": entity_id}}]
    return []


def plan_topic_command(topic: str, value: Any) -> dict[str, Any]:
    """Classify an inbound topic before a service call is chosen."""
    clean = normalize_topic_prefix(topic)
    parts = [part for part in clean.split("/") if part]
    if len(parts) < 2:
        return {"kind": "ignore"}
    if parts[0] in ("variable", "variables"):
        if parts[0] == "variables" and parts[-1] == "value" and len(parts) >= 3:
            identifier = "/".join(parts[1:-1])
        else:
            identifier = "/".join(parts[1:])
        return {"kind": "helper", "entity_id": identifier, "value": value}
    if parts[0] in ("flow", "flows") and len(parts) >= 3:
        return {"kind": "flow", "entity_id": parts[1], "action": parts[2], "value": value}
    if parts[0] in ("mood", "moods"):
        return {"kind": "scene", "entity_id": parts[1], "value": value}
    return {"kind": "capability", "device_or_entity": parts[0], "cap_id": "/".join(parts[1:]), "value": value}


def trigger_tokens(value: Any) -> dict[str, Any]:
    val_str = "" if value is None else str(value)
    val_num = float(value) if _finite(value) else 0
    if isinstance(value, bool):
        val_bool = value
    elif isinstance(value, (int, float)):
        val_bool = value > 0
    else:
        val_bool = str(value).strip().lower() in ("true", "1", "on", "yes")
    return {"val_str": val_str, "val_num": val_num, "val_bool": val_bool, "value": value}


def collect_referenced_strings(node: Any, out: set[str] | None = None, depth: int = 0) -> set[str]:
    found = out if out is not None else set()
    if node is None or depth > 40:
        return found
    if isinstance(node, str):
        text = node.strip()
        if not text:
            return found
        found.add(text)
        for match in re.finditer(r"\{\{\s*([^{}]+?)\s*\}\}", text):
            found.add(match.group(1).strip())
        return found
    if isinstance(node, list):
        for item in node:
            collect_referenced_strings(item, found, depth + 1)
        return found
    if isinstance(node, dict):
        for key, val in node.items():
            found.add(str(key).strip())
            collect_referenced_strings(val, found, depth + 1)
    return found


def unused_enabled_topics(
    enabled: dict[str, list[str]],
    devices: list[dict[str, Any]],
    referenced: set[str],
) -> list[dict[str, Any]]:
    blob = "\n".join(referenced)
    device_map = {item["id"]: item for item in devices}
    unused = []
    for dev_id, caps in enabled.items():
        if not isinstance(caps, list):
            continue
        meta = device_map.get(dev_id)
        zone = meta.get("zoneName") if meta else "Unknown"
        name = meta.get("name") if meta else f"Removed Entity ({dev_id})"
        for cap_id in caps:
            cap_obj = None
            if meta:
                cap_obj = next((cap for cap in meta.get("capabilities") or [] if cap.get("id") == cap_id), None)
            topic = (cap_obj or {}).get("topic") or f"homeassistant/{dev_id}/{cap_id}"
            if not cap_obj:
                if zone == "Variables":
                    topic = f"homeassistant/variables/{dev_id}/value"
                elif zone == "Flows":
                    topic = f"homeassistant/flows/{dev_id}/{cap_id}"
                elif zone == "Moods":
                    topic = f"homeassistant/moods/{dev_id}/{cap_id}"
            sub = normalize_topic_prefix(topic)
            used = (
                topic in blob
                or f"homey/{sub}" in blob
                or sub in blob
                or f"{dev_id}/{cap_id}" in blob
            )
            if not used and str(dev_id).startswith("light.") and (
                cap_id == LIGHT_COMPOSITE_CAP_ID or cap_id in LIGHT_SINGLE_CAPS
            ):
                used = f"{dev_id}/{LIGHT_COMPOSITE_CAP_ID}" in blob
            if not used:
                unused.append(
                    {
                        "deviceId": dev_id,
                        "deviceName": name,
                        "zoneName": zone,
                        "capId": cap_id,
                        "capTitle": (cap_obj or {}).get("title") or cap_id,
                        "topic": topic,
                        "deviceExists": bool(meta),
                    }
                )
    return unused
