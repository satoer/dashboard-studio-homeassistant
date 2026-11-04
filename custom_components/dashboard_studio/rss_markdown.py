"""RSS and Atom to Markdown. No Home Assistant imports."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any


def _text(node: ET.Element | None) -> str:
    if node is None or node.text is None:
        return ""
    return re.sub(r"\s+", " ", node.text).strip()


def _local(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[-1]
    return tag


def _find(parent: ET.Element, name: str) -> ET.Element | None:
    for child in parent:
        if _local(child.tag) == name:
            return child
    return None


def _find_text(parent: ET.Element, name: str) -> str:
    return _text(_find(parent, name))


def parse_feed(xml_text: str) -> dict[str, Any]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as err:
        raise ValueError(f"Feed is not valid XML: {err}") from err
    root_name = _local(root.tag).lower()
    if root_name == "rss" or _find(root, "channel") is not None:
        return _parse_rss(root)
    if root_name == "feed":
        return _parse_atom(root)
    raise ValueError("Feed is neither RSS nor Atom.")


def _parse_rss(root: ET.Element) -> dict[str, Any]:
    channel = _find(root, "channel")
    if channel is None:
        channel = root
    items = []
    for node in channel:
        if _local(node.tag) != "item":
            continue
        items.append(
            {
                "title": _find_text(node, "title") or "Untitled",
                "link": _find_text(node, "link"),
                "summary": _strip(_find_text(node, "description")),
                "published": _find_text(node, "pubDate"),
                "image": _item_image(node),
            }
        )
    return {"title": _find_text(channel, "title") or "Feed", "items": items}


def _parse_atom(root: ET.Element) -> dict[str, Any]:
    items = []
    for node in root:
        if _local(node.tag) != "entry":
            continue
        link = ""
        for child in node:
            if _local(child.tag) == "link" and (child.attrib.get("rel") in (None, "alternate")):
                link = child.attrib.get("href") or ""
                break
        summary = _strip(_find_text(node, "summary") or _find_text(node, "content"))
        items.append(
            {
                "title": _find_text(node, "title") or "Untitled",
                "link": link,
                "summary": summary,
                "published": _find_text(node, "updated") or _find_text(node, "published"),
                "image": _item_image(node),
            }
        )
    return {"title": _find_text(root, "title") or "Feed", "items": items}


def _strip(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", text).strip()


def _item_image(node: ET.Element) -> str:
    for child in node.iter():
        name = _local(child.tag)
        if name == "enclosure" and "image" in str(child.attrib.get("type") or ""):
            return child.attrib.get("url") or ""
        if name in ("content", "thumbnail") and child.attrib.get("url"):
            return child.attrib.get("url") or ""
    description = _find_text(node, "description") or _find_text(node, "content") or _find_text(node, "summary")
    match = re.search(r"""<img[^>]+src=["']([^"']+)["']""", description or "", re.IGNORECASE)
    return match.group(1) if match else ""


def feed_to_markdown(
    feed: dict[str, Any],
    max_items: int = 10,
    include_summary: bool = True,
    include_links: bool = True,
    layout: str = "standard",
    date_format: str = "",
    image_width: int = 0,
) -> str:
    return feeds_to_markdown(
        [feed],
        max_items=max_items,
        include_summary=include_summary,
        include_links=include_links,
        layout=layout,
        date_format=date_format,
        image_width=image_width,
    )


def feeds_to_markdown(
    feeds: list[dict[str, Any]],
    max_items: int = 10,
    include_summary: bool = True,
    include_links: bool = True,
    layout: str = "standard",
    date_format: str = "",
    image_width: int = 0,
) -> str:
    items = []
    for feed in feeds:
        for item in feed.get("items") or []:
            copied = dict(item)
            copied["feed"] = feed.get("title") or "Feed"
            items.append(copied)
    chosen = items[: max(1, int(max_items or 10))]
    if not chosen:
        return "No items."
    lines = []
    mode = layout if layout in ("standard", "full", "compact", "headlines") else "standard"
    for item in chosen:
        headline = str(item.get("title") or "Untitled")
        link = str(item.get("link") or "")
        when = _format_date(str(item.get("published") or ""), date_format)
        image = str(item.get("image") or "")
        if mode == "headlines":
            lines.append(headline)
            continue
        title = f"[{headline}]({link})" if include_links and link else headline
        if mode == "compact":
            lines.append(f"- {title}" + (f" ({when})" if when else ""))
            continue
        prefix = "## " if mode == "full" else "- "
        lines.append(f"{prefix}{title}")
        if when:
            lines.append(when if mode == "full" else f"  {when}")
        if image and image_width:
            lines.append(f'<img src="{image}" width="{int(image_width)}" alt="">')
        elif image and mode == "full":
            lines.append(f"![{headline}]({image})")
        if include_summary and item.get("summary") and mode != "headlines":
            lines.append(str(item["summary"]) if mode == "full" else f"  {item['summary']}")
        if mode == "full":
            lines.append("")
    return "\n".join(lines).strip()


def _format_date(value: str, date_format: str) -> str:
    if not value or not date_format:
        return value
    try:
        from email.utils import parsedate_to_datetime

        moment = parsedate_to_datetime(value)
    except (TypeError, ValueError, IndexError):
        return value
    pattern = date_format.replace("yyyy", "%Y").replace("dd", "%d").replace("mm", "%m")
    try:
        return moment.strftime(pattern)
    except ValueError:
        return value


def feed_response(feeds: list[dict[str, Any]], max_items: int) -> dict[str, Any]:
    items = []
    for feed in feeds:
        items.extend(feed.get("items") or [])
    limited = items[: max(0, int(max_items or 0))]
    first = limited[0] if limited else {}
    return {
        "item_count": len(limited),
        "article_count": len(limited),
        "latest_headline": first.get("title") or "",
        "latest_link": first.get("link") or "",
    }
