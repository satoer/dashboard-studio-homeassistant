"""Pure-Python checks for topic mapping, lights, whitelist filtering, and history buckets."""

import sys
import types
import unittest
from datetime import datetime, timezone
from pathlib import Path

_PACKAGE_DIR = Path(__file__).resolve().parents[1]
if "dashboard_studio" not in sys.modules:
    _pkg = types.ModuleType("dashboard_studio")
    _pkg.__path__ = [str(_PACKAGE_DIR)]
    sys.modules["dashboard_studio"] = _pkg
sys.path.insert(0, str(_PACKAGE_DIR.parent))

from dashboard_studio.calendar_ical import filter_events, merge_ics_documents, occurrences_to_ics
from dashboard_studio.calendar_markdown import events_to_markdown, select_merged_events
from dashboard_studio.insights import resample_data
from dashboard_studio.rss_markdown import feed_to_markdown, feeds_to_markdown, parse_feed
from dashboard_studio.topics import (
    build_catalog,
    build_light_composite,
    enabled_payloads_for_state,
    normalize_topic_prefix,
    plan_service_calls,
    plan_topic_command,
)


class TopicTests(unittest.TestCase):
    def test_prefix_normalization(self):
        self.assertEqual(normalize_topic_prefix("homeassistant/living/onoff"), "living/onoff")
        self.assertEqual(normalize_topic_prefix("homey/living/onoff"), "living/onoff")
        self.assertEqual(normalize_topic_prefix("/homeassistant/sensor.temp/measure_temperature"), "sensor.temp/measure_temperature")

    def test_helper_flow_and_scene_topics(self):
        catalog = build_catalog(
            [
                {"entity_id": "input_boolean.guest", "state": "on", "attributes": {"friendly_name": "Guest"}},
                {"entity_id": "automation.morning", "state": "on", "attributes": {"friendly_name": "Morning"}},
                {"entity_id": "scene.movie", "state": "unknown", "attributes": {"friendly_name": "Movie"}},
            ]
        )
        by_id = {item["id"]: item for item in catalog["devices"]}
        self.assertEqual(by_id["input_boolean.guest"]["capabilities"][0]["topic"], "homeassistant/variables/input_boolean.guest/value")
        self.assertEqual(by_id["automation.morning"]["zoneName"], "Flows")
        self.assertEqual(by_id["automation.morning"]["capabilities"][0]["topic"], "homeassistant/flows/automation.morning/start")
        self.assertEqual(by_id["scene.movie"]["capabilities"][0]["topic"], "homeassistant/moods/scene.movie/set")

    def test_light_composite_and_whitelist(self):
        state = {
            "entity_id": "light.lamp",
            "state": "on",
            "attributes": {"friendly_name": "Lamp", "brightness": 255, "hs_color": [180, 50], "color_mode": "hs"},
        }
        light = build_light_composite(state)
        self.assertEqual(light["dim"], 1)
        self.assertEqual(light["onoff"], True)
        self.assertAlmostEqual(light["hue"], 0.5)
        catalog = build_catalog([state])
        enabled = {"light.lamp": ["onoff", "dim"]}
        payloads = enabled_payloads_for_state(state, catalog, enabled)
        topics = sorted(item["topic"] for item in payloads)
        self.assertEqual(topics, ["homeassistant/light.lamp/dim", "homeassistant/light.lamp/onoff"])
        blocked = enabled_payloads_for_state(state, catalog, {})
        self.assertEqual(blocked, [])

    def test_turn_on_plan_and_topic_kinds(self):
        calls = plan_service_calls("light.lamp", "onoff", True, {})
        self.assertEqual(calls[0]["service"], "turn_on")
        self.assertEqual(plan_topic_command("homey/variables/input_boolean.guest/value", True)["kind"], "helper")
        self.assertEqual(plan_topic_command("homeassistant/flows/script.bed/start", True)["kind"], "flow")
        self.assertEqual(plan_topic_command("homeassistant/moods/scene.movie/set", True)["kind"], "scene")


class InsightTests(unittest.TestCase):
    def test_mean_buckets(self):
        entries = [
            {"t": "2026-01-01T00:00:00Z", "v": 10},
            {"t": "2026-01-01T00:30:00Z", "v": 30},
        ]
        now = datetime(2026, 1, 1, 1, 0, tzinfo=timezone.utc)
        points = resample_data(entries, "1h", "1h", "mean", now_ms=int(now.timestamp() * 1000))
        self.assertEqual(len(points), 1)
        self.assertEqual(points[0]["v"], 20)


class CalendarAndRssTests(unittest.TestCase):
    def test_filter_and_merge(self):
        ics = (
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"
            "BEGIN:VEVENT\r\nUID:a@x\r\nSUMMARY:Dentist\r\n"
            "DTSTART:20260101T090000Z\r\nDTEND:20260101T100000Z\r\n"
            "END:VEVENT\r\nEND:VCALENDAR\r\n"
        )
        other = (
            "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:a@x\r\nSUMMARY:Duplicate\r\n"
            "DTSTART:20260102T090000Z\r\nEND:VEVENT\r\n"
            "BEGIN:VEVENT\r\nUID:b@x\r\nSUMMARY:Second\r\n"
            "DTSTART:20260102T110000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
        )
        merged = merge_ics_documents([ics, other])
        self.assertEqual(merged.count("UID:a@x"), 1)
        self.assertIn("UID:b@x", merged)
        events = filter_events(ics, "90d", 10, now=datetime(2026, 1, 1, tzinfo=timezone.utc))
        self.assertEqual(events[0]["summary"], "Dentist")
        filtered = occurrences_to_ics(events)
        self.assertIn("BEGIN:VCALENDAR", filtered)
        self.assertIn("SUMMARY:Dentist", filtered)

    def test_weekly_byday_and_exdate(self):
        ics = (
            "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:gym@x\r\nSUMMARY:Gym\r\n"
            "DTSTART:20260105T090000Z\r\nDTEND:20260105T100000Z\r\n"
            "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\r\n"
            "EXDATE:20260107T090000Z\r\n"
            "END:VEVENT\r\nEND:VCALENDAR\r\n"
        )
        events = filter_events(ics, "7d", 10, now=datetime(2026, 1, 5, tzinfo=timezone.utc))
        days = [item["start"][:10] for item in events]
        self.assertEqual(days, ["2026-01-05", "2026-01-09"])

    def test_markdown_local_time_and_cross_feed_limit(self):
        text = events_to_markdown(
            [{"summary": "Breakfast", "start": "2026-07-01T23:00:00Z", "location": ""}],
            settings={
                "timeZone": "Europe/Amsterdam",
                "calendarDateFormat": "dd-mm-yyyy",
                "calendarShowIcons": False,
                "calendarWrapEventsInBlocks": False,
                "calendarGroupByTimeOfDay": True,
            },
        )
        self.assertIn("02-07-2026 01:00", text)
        self.assertIn("Morning", text)
        merged, sources = select_merged_events(
            [
                ("Late", [{"summary": "A", "start": "2026-01-02T10:00:00Z"}, {"summary": "B", "start": "2026-01-03T10:00:00Z"}]),
                ("Early", [{"summary": "C", "start": "2026-01-01T10:00:00Z"}]),
            ],
            2,
        )
        self.assertEqual([item["summary"] for item in merged], ["C", "A"])
        self.assertEqual(sorted(item["label"] for item in sources), ["Early", "Late"])

    def test_rss_markdown(self):
        xml = (
            "<?xml version='1.0'?><rss version='2.0'><channel><title>News</title>"
            "<item><title>Hello</title><link>https://example.com</link><description>Body</description></item>"
            "</channel></rss>"
        )
        feed = parse_feed(xml)
        text = feed_to_markdown(feed, max_items=5)
        self.assertIn("[Hello](https://example.com)", text)
        second = (
            "<?xml version='1.0'?><rss version='2.0'><channel><title>Other</title>"
            "<item><title>World</title><link>https://example.org</link><description>More</description></item>"
            "</channel></rss>"
        )
        combined = feeds_to_markdown([feed, parse_feed(second)], max_items=5, layout="headlines")
        self.assertIn("Hello", combined)
        self.assertIn("World", combined)


if __name__ == "__main__":
    unittest.main()
