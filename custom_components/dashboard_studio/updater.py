"""Automated GitHub release checker and single-click updater for Dashboard Studio."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import shutil
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

_LOGGER = logging.getLogger(__name__)

GITHUB_REPO = "satoer/dashboard-studio-homeassistant"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
CACHE_TTL_SECONDS = 900  # 15 minutes cache for rate limit safety

_RELEASE_CACHE: dict[str, Any] = {
    "timestamp": 0.0,
    "data": None,
}


def parse_version_tuple(version_str: str) -> tuple[int, ...]:
    """Parse a semantic/build version string into an integer tuple for comparison."""
    if not version_str:
        return (0, 0, 0, 0)
    clean = re.sub(r"^[vV]", "", str(version_str).strip())
    parts = [int(p) for p in re.findall(r"\d+", clean)]
    while len(parts) < 4:
        parts.append(0)
    return tuple(parts)


def format_display_version(version_str: str) -> str:
    """Format version like '2.4.0 build 1' if 4 parts, or '2.4.0' if 3 parts."""
    clean = re.sub(r"^[vV]", "", str(version_str or "").strip())
    parts = clean.split(".")
    if len(parts) >= 4:
        return f"{'.'.join(parts[:3])} build {parts[3]}"
    return clean


def get_installed_version(component_dir: Path) -> str:
    """Read the installed version from manifest.json."""
    manifest_file = component_dir / "manifest.json"
    if manifest_file.is_file():
        try:
            with manifest_file.open("r", encoding="utf-8") as f:
                data = json.load(f)
                return str(data.get("version") or "0.0.0")
        except Exception as err:
            _LOGGER.warning("Could not read installed version from manifest.json: %s", err)
    return "0.0.0"


async def async_check_latest_version(
    hass: HomeAssistant, force: bool = False
) -> dict[str, Any]:
    """Query GitHub for the latest release and determine if an update is available."""
    component_dir = Path(__file__).parent
    current_version = get_installed_version(component_dir)
    now = time.time()

    cached_data = _RELEASE_CACHE.get("data")
    if not force and cached_data and (now - _RELEASE_CACHE.get("timestamp", 0.0) < CACHE_TTL_SECONDS):
        cached_result = dict(cached_data)
        cached_result["current_version"] = current_version
        cached_result["update_available"] = (
            parse_version_tuple(cached_result.get("latest_version", "0"))
            > parse_version_tuple(current_version)
        )
        return cached_result

    session = async_get_clientsession(hass)
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Dashboard-Studio-HA-Updater",
    }

    try:
        timeout = aiohttp.ClientTimeout(total=12)
        async with session.get(GITHUB_API_URL, headers=headers, timeout=timeout) as resp:
            if resp.status == 200:
                release = await resp.json()
            elif resp.status == 404:
                return {
                    "current_version": current_version,
                    "latest_version": current_version,
                    "update_available": False,
                    "message": "No releases found on GitHub repository.",
                }
            elif resp.status == 403:
                _LOGGER.warning("GitHub API rate limit exceeded when checking for updates.")
                return {
                    "current_version": current_version,
                    "latest_version": current_version,
                    "update_available": False,
                    "error": "rate_limited",
                    "message": "GitHub API rate limit reached. Please try again later.",
                }
            else:
                return {
                    "current_version": current_version,
                    "latest_version": current_version,
                    "update_available": False,
                    "error": f"http_{resp.status}",
                    "message": f"GitHub returned HTTP status {resp.status}.",
                }
    except Exception as err:
        _LOGGER.warning("Failed to query GitHub for Dashboard Studio updates: %s", err)
        return {
            "current_version": current_version,
            "latest_version": current_version,
            "update_available": False,
            "error": "connection_error",
            "message": str(err),
        }

    raw_tag = str(release.get("tag_name") or "")
    latest_version = re.sub(r"^[vV]", "", raw_tag)
    title = str(release.get("name") or raw_tag)
    notes = str(release.get("body") or "")
    published_at = str(release.get("published_at") or "")

    download_url = ""
    size_bytes = 0
    assets = release.get("assets") or []
    for asset in assets:
        if asset.get("name") == "dashboard_studio.zip":
            download_url = str(asset.get("browser_download_url") or "")
            size_bytes = int(asset.get("size") or 0)
            break

    if not download_url and assets:
        for asset in assets:
            if str(asset.get("name") or "").endswith(".zip"):
                download_url = str(asset.get("browser_download_url") or "")
                size_bytes = int(asset.get("size") or 0)
                break

    if not download_url:
        download_url = str(release.get("zipball_url") or "")

    update_available = parse_version_tuple(latest_version) > parse_version_tuple(current_version)

    result_data = {
        "current_version": current_version,
        "latest_version": latest_version,
        "current_display": format_display_version(current_version),
        "latest_display": format_display_version(latest_version),
        "tag_name": raw_tag,
        "update_available": update_available,
        "title": title,
        "notes": notes,
        "download_url": download_url,
        "size_bytes": size_bytes,
        "published_at": published_at,
    }

    _RELEASE_CACHE["timestamp"] = now
    _RELEASE_CACHE["data"] = result_data
    return result_data


class ComponentUpdateManager:
    """Manages the background download, extraction, and installation of component updates."""

    def __init__(self) -> None:
        self.status: str = "idle"  # idle | downloading | extracting | completed | error
        self.progress: int = 0  # 0 to 100
        self.message: str = ""
        self.error: str | None = None
        self.target_version: str = ""
        self.restart_required: bool = False
        self.backend_changed: bool = False
        self._task: asyncio.Task | None = None

    def get_progress(self) -> dict[str, Any]:
        """Return the current update progress state."""
        return {
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "error": self.error,
            "target_version": self.target_version,
            "restart_required": self.restart_required,
            "backend_changed": self.backend_changed,
        }

    def start_update(
        self, hass: HomeAssistant, download_url: str, target_version: str
    ) -> dict[str, Any]:
        """Initiate background update task if not already in progress."""
        if self.status in ("downloading", "extracting"):
            return self.get_progress()

        self.status = "downloading"
        self.progress = 0
        self.message = "Initializing download..."
        self.error = None
        self.target_version = target_version
        self.restart_required = False
        self.backend_changed = False

        self._task = hass.async_create_task(
            self._async_run_update(hass, download_url, target_version)
        )
        return self.get_progress()

    async def _async_run_update(
        self, hass: HomeAssistant, download_url: str, target_version: str
    ) -> None:
        """Download the release zip and safely replace the component files."""
        component_dir = Path(__file__).parent
        temp_dir = Path(tempfile.mkdtemp(prefix="dashboard_studio_update_"))
        temp_zip = temp_dir / "release.zip"

        try:
            session = async_get_clientsession(hass)
            self.message = "Connecting to download server..."
            self.progress = 5

            timeout = aiohttp.ClientTimeout(total=600)
            async with session.get(download_url, timeout=timeout) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"Download failed with HTTP status {resp.status}")

                total_size = resp.content_length or 0
                downloaded = 0

                with temp_zip.open("wb") as zip_out:
                    async for chunk in resp.content.iter_chunked(65536):
                        if chunk:
                            zip_out.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                pct = min(68, int(5 + (downloaded / total_size) * 63))
                                mb_done = downloaded / (1024 * 1024)
                                mb_total = total_size / (1024 * 1024)
                                self.progress = pct
                                self.message = (
                                    f"Downloading update... {mb_done:.1f} MB / {mb_total:.1f} MB ({int((downloaded / total_size) * 100)}%)"
                                )
                            else:
                                mb_done = downloaded / (1024 * 1024)
                                self.progress = 40
                                self.message = f"Downloading update... {mb_done:.1f} MB"

            self.status = "extracting"
            self.progress = 72
            self.message = "Verifying downloaded archive..."

            backend_changed = await hass.async_add_executor_job(
                self._extract_and_install, temp_zip, component_dir
            )
            self.backend_changed = backend_changed
            self.restart_required = backend_changed

            self.progress = 100
            self.status = "completed"
            display_ver = format_display_version(target_version)
            if backend_changed:
                self.message = (
                    f"Successfully updated to {display_ver}! Python backend changes detected — Home Assistant restart recommended."
                )
            else:
                self.message = (
                    f"Successfully updated to {display_ver}! Only frontend files were updated — reload the page to apply changes."
                )
            _LOGGER.info(
                "Dashboard Studio successfully updated to %s in %s (backend_changed=%s)",
                display_ver,
                component_dir,
                backend_changed,
            )

        except Exception as err:
            _LOGGER.exception("Dashboard Studio update failed: %s", err)
            self.status = "error"
            self.error = str(err)
            self.message = f"Update failed: {err}"
        finally:
            try:
                if temp_dir.exists():
                    shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

    def _extract_and_install(self, zip_path: Path, dest_dir: Path) -> bool:
        """Verify archive contents, detect backend modifications, and extract files safely."""
        if not zipfile.is_zipfile(zip_path):
            raise ValueError("Downloaded file is not a valid zip archive.")

        backend_changed = False

        with zipfile.ZipFile(zip_path, "r") as archive:
            names = archive.namelist()
            # Determine if files are packed at the root or under a subfolder
            has_root_manifest = "manifest.json" in names
            subfolder_prefix = ""
            if not has_root_manifest:
                for name in names:
                    if name.endswith("manifest.json") and "/" in name:
                        subfolder_prefix = name[: name.rfind("manifest.json")]
                        break

            self.progress = 74
            self.message = "Checking for code changes..."

            # Detect whether any Python backend files or services were modified
            archive_py_files: set[str] = set()
            for member in archive.infolist():
                if member.is_dir():
                    continue

                rel_name = member.filename
                if subfolder_prefix and rel_name.startswith(subfolder_prefix):
                    rel_name = rel_name[len(subfolder_prefix) :]

                clean_path = os.path.normpath(rel_name).lstrip("/\\")
                if ".." in clean_path.split(os.sep):
                    continue

                if clean_path.endswith(".py") or clean_path == "services.yaml":
                    archive_py_files.add(clean_path)
                    target_file = dest_dir / clean_path
                    if not target_file.is_file():
                        backend_changed = True
                    else:
                        try:
                            archive_bytes = archive.read(member)
                            existing_bytes = target_file.read_bytes()
                            if archive_bytes != existing_bytes:
                                backend_changed = True
                        except Exception:
                            backend_changed = True

            # Check if any existing root .py files were removed
            for existing_py in dest_dir.glob("*.py"):
                if existing_py.is_file() and existing_py.name not in archive_py_files:
                    backend_changed = True
                    break

            self.progress = 80
            self.message = "Extracting files..."

            # Extract files safely
            for member in archive.infolist():
                if member.is_dir():
                    continue

                rel_name = member.filename
                if subfolder_prefix and rel_name.startswith(subfolder_prefix):
                    rel_name = rel_name[len(subfolder_prefix) :]

                # Security check: prevent directory traversal
                clean_path = os.path.normpath(rel_name).lstrip("/\\")
                if ".." in clean_path.split(os.sep):
                    continue

                target_file = dest_dir / clean_path
                target_file.parent.mkdir(parents=True, exist_ok=True)

                with archive.open(member) as source, target_file.open("wb") as target:
                    shutil.copyfileobj(source, target)

        self.progress = 94
        self.message = "Cleaning Python cache..."
        # Clean any stale pycache directories
        for pycache in dest_dir.rglob("__pycache__"):
            if pycache.is_dir():
                shutil.rmtree(pycache, ignore_errors=True)

        return backend_changed


GLOBAL_UPDATER = ComponentUpdateManager()
