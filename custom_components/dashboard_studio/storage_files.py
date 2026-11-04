"""Dashboard, snapshot, and gallery files under the Home Assistant config directory."""

from __future__ import annotations

import base64
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"}
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm", ".flac"}
HIDDEN_GALLERY_NAMES = {
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "responsive-mode.svg",
    "dashboardstudio_logo_darkmode.svg",
    "dashboardstudio_logo_lightmode.svg",
}
SNAPSHOT_STEM = re.compile(r"^(.+)_(\d{8})_(\d{6})(?:_(\d+))?$")

TYPE_DIRS = {
    "dashboards": "dashboards",
    "dashboard": "dashboards",
    "templates": "themes",
    "template": "themes",
    "themes": "themes",
    "widgetpresets": "presets",
    "widget-presets": "presets",
    "presets": "presets",
}


def ensure_dirs(root: Path) -> None:
    for name in ("dashboards", "snapshots", "images", "audio", "themes", "presets"):
        (root / name).mkdir(parents=True, exist_ok=True)


def normalize_type(storage_type: str) -> str:
    return TYPE_DIRS.get(str(storage_type or "dashboards"), "dashboards")


def sanitize_segment(name: Any) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "", re.sub(r"\.json$", "", str(name or ""), flags=re.IGNORECASE))


def sanitize_media_name(name: Any) -> str:
    base = Path(str(name or "").replace("\0", "")).name
    safe = re.sub(r'[#?&"\'\s]', "_", base)
    if not safe or safe in (".", "..") or "/" in safe or "\\" in safe:
        return ""
    return safe


def _dir_for(root: Path, storage_type: str) -> Path:
    return root / normalize_type(storage_type)


def list_json_files(root: Path, storage_type: str, factory_root: Path | None = None) -> list[dict[str, Any]]:
    kind = normalize_type(storage_type)
    found: dict[str, dict[str, Any]] = {}
    if kind == "presets":
        return _list_presets(root, factory_root)
    user_dir = root / kind
    if user_dir.is_dir():
        for path in user_dir.glob("*.json"):
            stem = path.stem
            if kind == "dashboards" and SNAPSHOT_STEM.match(stem):
                continue
            found[stem] = {
                "name": stem,
                "source": "user",
                "snapshotCount": _snapshot_count(root, stem) if kind == "dashboards" else 0,
            }
    if factory_root is not None:
        factory_dir = factory_root / ("dashboards" if kind == "dashboards" else kind)
        if factory_dir.is_dir():
            for path in factory_dir.glob("*.json"):
                found.setdefault(
                    path.stem,
                    {"name": path.stem, "source": "factory", "snapshotCount": 0},
                )
    return sorted(found.values(), key=lambda item: item["name"])


def _list_presets(root: Path, factory_root: Path | None) -> list[dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}

    def add(path: Path, source: str) -> None:
        if path.parent == root / "presets" or (factory_root and path.parent == factory_root / "widgets" / "presets"):
            return
        widget_type = path.parent.name
        preset_name = path.stem
        key = f"{widget_type}/{preset_name}"
        display = preset_name
        variants = 1
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                display = str(data.get("name") or data.get("displayName") or preset_name)
                if isinstance(data.get("variants"), list):
                    variants = len(data["variants"]) or 1
        except (OSError, json.JSONDecodeError):
            pass
        found[key] = {
            "name": key,
            "widgetType": widget_type,
            "presetName": preset_name,
            "fileId": preset_name,
            "displayName": display,
            "variantCount": variants,
            "source": source,
        }

    user_dir = root / "presets"
    if user_dir.is_dir():
        for path in user_dir.glob("*/*.json"):
            add(path, "user")
    if factory_root is not None:
        factory = factory_root / "widgets" / "presets"
        if factory.is_dir():
            for path in factory.glob("*/*.json"):
                key = f"{path.parent.name}/{path.stem}"
                if key not in found:
                    add(path, "factory")
    return sorted(found.values(), key=lambda item: item["name"])


def _snapshot_count(root: Path, base: str) -> int:
    return len(list_snapshots(root, base))


def resolve_json_path(root: Path, storage_type: str, name: str, factory_root: Path | None = None) -> Path | None:
    kind = normalize_type(storage_type)
    if kind == "presets" and "/" in str(name):
        widget_type, preset = str(name).split("/", 1)
        widget_type = sanitize_segment(widget_type)
        preset = sanitize_segment(preset)
        user = root / "presets" / widget_type / f"{preset}.json"
        if user.is_file():
            return user
        if factory_root is not None:
            factory = factory_root / "widgets" / "presets" / widget_type / f"{preset}.json"
            if factory.is_file():
                return factory
        return None
    stem = sanitize_segment(name)
    if not stem:
        return None
    user = root / kind / f"{stem}.json"
    if user.is_file():
        return user
    if kind == "dashboards":
        snap = root / "snapshots" / f"{stem}.json"
        if snap.is_file():
            return snap
    if factory_root is not None:
        factory_kind = "dashboards" if kind == "dashboards" else kind
        factory = factory_root / factory_kind / f"{stem}.json"
        if factory.is_file():
            return factory
    return None


def read_json(root: Path, storage_type: str, name: str, factory_root: Path | None = None) -> Any:
    path = resolve_json_path(root, storage_type, name, factory_root)
    if path is None:
        raise FileNotFoundError(f"File not found: {name}")
    return json.loads(path.read_text(encoding="utf-8"))


def peek_version(root: Path, name: str, factory_root: Path | None = None) -> str:
    path = resolve_json_path(root, "dashboards", name, factory_root)
    if path is None:
        raise FileNotFoundError("File not found")
    raw = path.read_text(encoding="utf-8")[:1024]
    match = re.search(r'"version"\s*:\s*"([^"]+)"', raw)
    return match.group(1).strip() if match else "1.0.0"


def save_json(
    root: Path,
    storage_type: str,
    name: str,
    content: Any,
    keep_history: bool = True,
    history_max: int = 10,
) -> str:
    ensure_dirs(root)
    kind = normalize_type(storage_type)
    if kind == "presets" and "/" in str(name):
        widget_type, preset = str(name).split("/", 1)
        widget_type = sanitize_segment(widget_type)
        preset = sanitize_segment(preset)
        if not widget_type or not preset:
            raise ValueError("Invalid preset name")
        folder = root / "presets" / widget_type
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / f"{preset}.json"
        _write_json(target, content)
        return f"{widget_type}/{preset}"
    stem = sanitize_segment(name)
    if not stem:
        raise ValueError("Invalid file name")
    target = root / kind / f"{stem}.json"
    if kind == "dashboards" and keep_history and target.is_file():
        _archive_snapshot(root, stem, target.read_bytes(), history_max)
    target.parent.mkdir(parents=True, exist_ok=True)
    _write_json(target, content)
    return stem


def _write_json(path: Path, content: Any) -> None:
    if isinstance(content, str):
        text = content
    else:
        text = json.dumps(content, ensure_ascii=False)
    path.write_text(text, encoding="utf-8")


def _archive_snapshot(root: Path, stem: str, raw: bytes, history_max: int) -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    dest = root / "snapshots" / f"{stem}_{stamp}.json"
    seq = 1
    while dest.exists():
        dest = root / "snapshots" / f"{stem}_{stamp}_{seq}.json"
        seq += 1
    dest.write_bytes(raw)
    prune_snapshots(root, stem, history_max)


def list_all_snapshots(root: Path) -> list[dict[str, Any]]:
    folder = root / "snapshots"
    if not folder.is_dir():
        return []
    items = []
    for path in folder.glob("*.json"):
        stat = path.stat()
        items.append({"name": path.stem, "mtimeMs": int(stat.st_mtime * 1000)})
    items.sort(key=lambda item: item["mtimeMs"], reverse=True)
    return items


def list_snapshots(root: Path, base_name: str) -> list[dict[str, Any]]:
    safe = sanitize_segment(base_name)
    folder = root / "snapshots"
    if not safe or not folder.is_dir():
        return []
    items = []
    for path in folder.glob("*.json"):
        match = SNAPSHOT_STEM.match(path.stem)
        if not match or match.group(1) != safe:
            continue
        stat = path.stat()
        items.append({"name": path.stem, "mtimeMs": int(stat.st_mtime * 1000)})
    items.sort(key=lambda item: item["mtimeMs"], reverse=True)
    return items


def prune_snapshots(root: Path, base_name: str, history_max: int) -> None:
    keep = max(1, min(50, int(history_max or 10)))
    items = list_snapshots(root, base_name)
    for item in items[keep:]:
        path = root / "snapshots" / f"{item['name']}.json"
        if path.is_file():
            path.unlink()


def clear_snapshots(root: Path, base_name: str) -> int:
    removed = 0
    for item in list_snapshots(root, base_name):
        path = root / "snapshots" / f"{item['name']}.json"
        if path.is_file():
            path.unlink()
            removed += 1
    return removed


def delete_json(root: Path, storage_type: str, name: str) -> None:
    path = resolve_json_path(root, storage_type, name, None)
    if path is None or not str(path).startswith(str(root)):
        raise FileNotFoundError(f"File not found: {name}")
    if path.is_file():
        path.unlink()


def _gallery_visible(path: Path, exts: set[str]) -> bool:
    return path.is_file() and path.suffix.lower() in exts and path.name.lower() not in HIDDEN_GALLERY_NAMES


def list_media(root: Path, kind: str, factory_root: Path | None = None) -> list[dict[str, Any]]:
    folder_name = "audio" if kind == "audio" else "images"
    exts = AUDIO_EXTS if kind == "audio" else IMAGE_EXTS
    found: dict[str, dict[str, Any]] = {}
    if factory_root is not None:
        factory = factory_root / folder_name
        if factory.is_dir():
            for path in factory.iterdir():
                if _gallery_visible(path, exts):
                    stat = path.stat()
                    found[path.name] = {
                        "name": path.name,
                        "url": f"{folder_name}/{path.name}",
                        "size": stat.st_size,
                        "mtime": int(stat.st_mtime * 1000),
                        "source": "factory",
                    }
    user = root / folder_name
    if user.is_dir():
        for path in user.iterdir():
            if _gallery_visible(path, exts):
                stat = path.stat()
                found[path.name] = {
                    "name": path.name,
                    "url": f"{folder_name}/{path.name}",
                    "size": stat.st_size,
                    "mtime": int(stat.st_mtime * 1000),
                    "source": "user",
                }
    return sorted(found.values(), key=lambda item: item["name"])


def decode_upload(content: Any) -> bytes:
    if isinstance(content, bytes):
        return content
    text = str(content or "")
    if "," in text and text.strip().lower().startswith("data:"):
        text = text.split(",", 1)[1]
    return base64.b64decode(text)


def save_media(root: Path, kind: str, name: str, content: Any) -> str:
    ensure_dirs(root)
    safe = sanitize_media_name(name)
    folder_name = "audio" if kind == "audio" else "images"
    exts = AUDIO_EXTS if kind == "audio" else IMAGE_EXTS
    if not safe or Path(safe).suffix.lower() not in exts:
        raise ValueError("Unsupported file type")
    target = root / folder_name / safe
    target.write_bytes(decode_upload(content))
    return safe


def delete_media(root: Path, kind: str, names: list[str]) -> None:
    folder_name = "audio" if kind == "audio" else "images"
    for name in names:
        safe = sanitize_media_name(name)
        if not safe:
            continue
        path = root / folder_name / safe
        if path.is_file():
            path.unlink()


def rename_media(root: Path, kind: str, source: str, dest: str) -> str:
    folder_name = "audio" if kind == "audio" else "images"
    src = sanitize_media_name(source)
    dst = sanitize_media_name(dest)
    exts = AUDIO_EXTS if kind == "audio" else IMAGE_EXTS
    if not src or not dst or Path(dst).suffix.lower() not in exts:
        raise ValueError("Invalid media name")
    if Path(src).suffix.lower() != Path(dst).suffix.lower():
        raise ValueError("Keep the same file extension")
    src_path = root / folder_name / src
    dst_path = root / folder_name / dst
    if not src_path.is_file():
        raise FileNotFoundError("File not found")
    if dst_path.exists():
        raise ValueError("A file with that name already exists")
    src_path.rename(dst_path)
    return dst


def read_dashboard_documents(root: Path) -> list[Any]:
    docs = []
    folder = root / "dashboards"
    if not folder.is_dir():
        return docs
    for path in folder.glob("*.json"):
        if SNAPSHOT_STEM.match(path.stem):
            continue
        try:
            docs.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError):
            continue
    return docs


def media_file(root: Path, kind: str, name: str, factory_root: Path | None = None) -> Path | None:
    safe = sanitize_media_name(name)
    if not safe:
        return None
    user = root / kind / safe
    if user.is_file():
        return user
    if factory_root is not None:
        factory = factory_root / kind / safe
        if factory.is_file():
            return factory
    return None
