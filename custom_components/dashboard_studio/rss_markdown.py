"""RSS and Atom to Markdown processor with Homey Dashboard Studio parity."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import html
import re
from typing import Any
import xml.etree.ElementTree as ET

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # type: ignore

IMAGE_EXT_RE = re.compile(r"\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)", re.IGNORECASE)


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


def parse_feed_specs(raw_input: str) -> list[dict[str, str]]:
    """Parse multi-line feed specs into URL, label, icon, and color."""
    if not raw_input:
        return []
    lines = str(raw_input).splitlines()
    specs: list[dict[str, str]] = []
    seen: set[str] = set()

    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        parts = [p.strip() for p in cleaned.split("|")]
        url = ""
        non_url_parts: list[str] = []

        for p in parts:
            if not url and (p.startswith("http://") or p.startswith("https://") or p.startswith("webcal://")):
                url = p
            elif p:
                non_url_parts.append(p)

        if not url or url in seen:
            continue
        seen.add(url)

        custom_label = ""
        icon = ""
        color = ""

        for token in non_url_parts:
            if re.match(r"^ph-[a-z0-9-]+$", token, re.IGNORECASE):
                icon = token[3:].lower()
            elif re.match(r"^(?:#[0-9a-f]{3,8}|@[a-z0-9_-]+)$", token, re.IGNORECASE):
                color = token
            elif token.lower() == "none":
                icon = "none"
            elif not custom_label:
                custom_label = token

        specs.append({
            "url": url,
            "customLabel": custom_label,
            "icon": icon,
            "color": color,
        })

    return specs


def decode_html(text: str) -> str:
    return html.unescape(str(text or "")).replace("\xa0", " ")


def clean_plain_text(raw_text: str) -> str:
    """Convert raw markup/text into plain text without pipes, HTML, or URLs."""
    text = decode_html(raw_text)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]*>", " ", text)
    text = decode_html(text)
    text = re.sub(r"https?://[^\s<>\"']+", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"www\.[^\s<>\"']+", " ", text, flags=re.IGNORECASE)
    text = text.replace("|", ":").replace("\r", " ").replace("\n", " ")
    text = re.sub(r"[\[\]<>]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return re.sub(r"\s+([.,;:!?])", r"\1", text)


def truncate_at_word(text: str, max_length: int = 240) -> str:
    if not text or len(text) <= max_length:
        return text
    cut = text[:max_length]
    last_space = cut.rfind(" ")
    if last_space > int(max_length * 0.6):
        cut = cut[:last_space]
    cut = re.sub(r"[.,;:!?\-\s]+$", "", cut)
    return cut + "..."


def sanitize_url(raw_url: str) -> str:
    url = decode_html(raw_url).strip()
    if not re.match(r"^https?://", url, re.IGNORECASE):
        return ""
    return (
        url.replace(" ", "%20")
        .replace("(", "%28")
        .replace(")", "%29")
        .replace("|", "%7C")
    )


def _parse_date_string(date_str: str) -> datetime:
    if not date_str:
        return datetime(1970, 1, 1, tzinfo=timezone.utc)
    try:
        parsed = parsedate_to_datetime(date_str)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        pass
    try:
        clean = date_str.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(clean)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return datetime(1970, 1, 1, tzinfo=timezone.utc)


def _local_tag(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[-1]
    return tag


def _extract_cdata_or_text(node: ET.Element | None) -> str:
    if node is None or node.text is None:
        return ""
    return str(node.text).strip()


def parse_feed(xml_text: str) -> dict[str, Any]:
    """Parse RSS or Atom XML content into structured dictionary."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as err:
        raise ValueError(f"Feed is not valid XML: {err}") from err

    root_name = _local_tag(root.tag).lower()
    if root_name == "rss" or any(_local_tag(child.tag) == "channel" for child in root):
        return _parse_rss_root(root)
    if root_name == "feed":
        return _parse_atom_root(root)
    raise ValueError("Feed is neither RSS nor Atom.")


def _parse_rss_root(root: ET.Element) -> dict[str, Any]:
    channel = None
    for child in root:
        if _local_tag(child.tag) == "channel":
            channel = child
            break
    if channel is None:
        channel = root

    channel_title = ""
    for child in channel:
        if _local_tag(child.tag) == "title":
            channel_title = clean_plain_text(_extract_cdata_or_text(child))
            break

    items: list[dict[str, Any]] = []
    for node in channel:
        if _local_tag(node.tag) != "item":
            continue

        raw_title = ""
        link = ""
        date_str = ""
        raw_desc = ""
        image_url = ""

        for child in node:
            name = _local_tag(child.tag)
            if name == "title":
                raw_title = _extract_cdata_or_text(child)
            elif name == "link":
                link = sanitize_url(_extract_cdata_or_text(child))
            elif name in ("pubDate", "date"):
                date_str = _extract_cdata_or_text(child)
            elif name in ("description", "encoded"):
                desc_text = _extract_cdata_or_text(child)
                if desc_text and not raw_desc:
                    raw_desc = desc_text
            elif name == "enclosure":
                url_attr = child.attrib.get("url") or ""
                type_attr = str(child.attrib.get("type") or "").lower()
                if type_attr.startswith("image/") or IMAGE_EXT_RE.search(url_attr):
                    image_url = sanitize_url(url_attr)
            elif name in ("content", "thumbnail") and not image_url:
                url_attr = child.attrib.get("url") or ""
                if url_attr:
                    image_url = sanitize_url(url_attr)

        if not image_url and raw_desc:
            img_match = re.search(r"""<img[^>]+src=["']([^"']+)["']""", raw_desc, re.IGNORECASE)
            if img_match:
                image_url = sanitize_url(img_match.group(1))

        clean_title = clean_plain_text(raw_title)
        if clean_title:
            items.append({
                "title": clean_title,
                "link": link,
                "date": _parse_date_string(date_str),
                "excerpt": truncate_at_word(clean_plain_text(raw_desc), 240),
                "image": image_url or None,
            })

    return {"title": channel_title or "News", "items": items}


def _parse_atom_root(root: ET.Element) -> dict[str, Any]:
    channel_title = ""
    for child in root:
        if _local_tag(child.tag) == "title":
            channel_title = clean_plain_text(_extract_cdata_or_text(child))
            break

    items: list[dict[str, Any]] = []
    for node in root:
        if _local_tag(node.tag) != "entry":
            continue

        raw_title = ""
        link = ""
        date_str = ""
        raw_desc = ""
        image_url = ""

        for child in node:
            name = _local_tag(child.tag)
            if name == "title":
                raw_title = _extract_cdata_or_text(child)
            elif name == "link":
                rel = child.attrib.get("rel")
                if rel in (None, "alternate") and not link:
                    link = sanitize_url(child.attrib.get("href") or "")
            elif name in ("updated", "published") and not date_str:
                date_str = _extract_cdata_or_text(child)
            elif name in ("summary", "content") and not raw_desc:
                raw_desc = _extract_cdata_or_text(child)
            elif name in ("content", "thumbnail") and not image_url:
                url_attr = child.attrib.get("url") or ""
                if url_attr:
                    image_url = sanitize_url(url_attr)

        if not image_url and raw_desc:
            img_match = re.search(r"""<img[^>]+src=["']([^"']+)["']""", raw_desc, re.IGNORECASE)
            if img_match:
                image_url = sanitize_url(img_match.group(1))

        clean_title = clean_plain_text(raw_title)
        if clean_title:
            items.append({
                "title": clean_title,
                "link": link,
                "date": _parse_date_string(date_str),
                "excerpt": truncate_at_word(clean_plain_text(raw_desc), 240),
                "image": image_url or None,
            })

    return {"title": channel_title or "News", "items": items}


def format_article_date(
    dt: datetime,
    date_format_mode: str,
    user_date_format: str = "dd-mm-yyyy",
    tz_name: str | None = None,
    now: datetime | None = None,
) -> str:
    """Format article date with relative today/yesterday matching Homey."""
    if not dt or dt.year <= 1970 or date_format_mode == "hidden":
        return ""

    zone = _resolve_zone(tz_name)
    local_dt = dt.astimezone(zone)
    clock_time = local_dt.strftime("%H:%M")

    if date_format_mode == "time_only":
        return clock_time

    now_utc = now or datetime.now(timezone.utc)
    local_now = now_utc.astimezone(zone)

    target_key = local_dt.strftime("%Y-%m-%d")
    today_key = local_now.strftime("%Y-%m-%d")
    yesterday_key = (local_now - timedelta(days=1)).strftime("%Y-%m-%d")

    d_str = local_dt.strftime("%d")
    m_str = local_dt.strftime("%m")
    y_str = local_dt.strftime("%Y")

    if user_date_format == "mm-dd-yyyy":
        date_str = f"{m_str}-{d_str}-{y_str}"
    elif user_date_format == "yyyy-mm-dd":
        date_str = target_key
    else:
        date_str = f"{d_str}-{m_str}-{y_str}"

    if date_format_mode == "date_time":
        return f"{date_str}<br>{clock_time}"

    # Default / relative
    if target_key == today_key:
        return f"Today<br>{clock_time}"
    if target_key == yesterday_key:
        return f"Yesterday<br>{clock_time}"
    return f"{date_str}<br>{clock_time}"


def build_rss_markdown(
    feed_specs: list[dict[str, str]],
    parsed_feeds: list[dict[str, Any]],
    layout: str = "standard",
    max_items: int = 10,
    date_format_mode: str = "default",
    user_date_format: str = "dd-mm-yyyy",
    image_width: int = 180,
    tz_name: str | None = None,
) -> dict[str, Any]:
    """Merge, sort, and render RSS feeds into Dashboard Studio Markdown Table."""
    limit = max(1, min(50, int(max_items or 10)))
    img_w = max(40, min(800, int(image_width or 180)))
    mode = str(layout or "standard").lower()
    df_mode = str(date_format_mode or "default").lower()

    all_items: list[dict[str, Any]] = []

    for i, spec in enumerate(feed_specs):
        if i >= len(parsed_feeds) or parsed_feeds[i] is None:
            continue
        feed_data = parsed_feeds[i]
        label = spec.get("customLabel") or feed_data.get("title") or "News"
        spec_icon = spec.get("icon")
        icon = "" if spec_icon == "none" else (spec_icon or "newspaper")
        color = spec.get("color") or f"@markerTint{(i % 4) + 1}"

        for item in feed_data.get("items") or []:
            all_items.append({
                "title": item["title"],
                "link": item["link"],
                "date": item["date"],
                "excerpt": item.get("excerpt") or "",
                "image": item.get("image"),
                "feedLabel": label,
                "feedIcon": icon,
                "feedColor": color,
            })

    # Sort chronologically descending
    all_items.sort(key=lambda x: x["date"].timestamp(), reverse=True)
    all_items = all_items[:limit]

    show_source = len(feed_specs) > 1
    show_image = mode == "full"
    show_timestamp = df_mode != "hidden"
    show_excerpt = mode in ("standard", "full")

    cols: list[dict[str, str]] = []
    if show_source:
        cols.append({"id": "source", "title": "Source", "align": ":---"})
    if show_image:
        cols.append({"id": "image", "title": "Image", "align": ":---:"})
    cols.append({"id": "headline", "title": "Headline", "align": ":---"})
    if show_timestamp:
        cols.append({"id": "timestamp", "title": "Published", "align": ":---:"})

    markdown = ""
    if all_items:
        markdown += "| " + " | ".join(c["title"] for c in cols) + " |\n"
        markdown += "| " + " | ".join(c["align"] for c in cols) + " |\n"

        for item in all_items:
            cells = []
            for c in cols:
                cid = c["id"]
                if cid == "source":
                    bg = f"[cell {item['feedColor']}] " if item["feedColor"] else ""
                    ico = f":ph-{item['feedIcon']}|18: " if item["feedIcon"] else ""
                    cells.append(f"{bg}{ico}{item['feedLabel']}".strip())
                elif cid == "image":
                    cells.append(f"![|{img_w}]({item['image']})" if item.get("image") else "")
                elif cid == "headline":
                    link = item.get("link")
                    title = item["title"]
                    link_title = f"### [{title}]({link} ^)" if link else f"### {title}"
                    if show_excerpt and item.get("excerpt"):
                        link_title += f"<br>[color @textMuted]{item['excerpt']}[/color]"
                    cells.append(link_title)
                elif cid == "timestamp":
                    cells.append(format_article_date(item["date"], df_mode, user_date_format, tz_name))
                else:
                    cells.append("")
            markdown += "| " + " | ".join(cells) + " |\n"

    first = all_items[0] if all_items else {}
    return {
        "markdown": markdown,
        "article_count": len(all_items),
        "latest_headline": first.get("title") or "",
        "latest_link": first.get("link") or "",
        "latest_summary": first.get("excerpt") or "",
        "latest_image_url": first.get("image") or "",
    }
