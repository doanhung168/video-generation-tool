import os
import uuid
import hashlib
import datetime
from pathlib import Path
from typing import Optional

from config import settings


def get_storage_path() -> Path:
    """Return the absolute path to the storage directory, creating it if needed."""
    storage = Path(settings.STORAGE_PATH).resolve()
    storage.mkdir(parents=True, exist_ok=True)
    return storage


def generate_unique_filename(prefix: str = "video", extension: str = ".mp4") -> str:
    """Generate a unique filename with timestamp and UUID."""
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    short_id = uuid.uuid4().hex[:8]
    return f"{prefix}_{timestamp}_{short_id}{extension}"


def get_video_storage_dir(project_id: Optional[int] = None) -> Path:
    """Return and create the directory where videos should be stored."""
    base = get_storage_path() / "videos"
    if project_id:
        base = base / f"project_{project_id}"
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_thumbnail_storage_dir() -> Path:
    """Return and create the directory for thumbnails."""
    path = get_storage_path() / "thumbnails"
    path.mkdir(parents=True, exist_ok=True)
    return path


def file_to_url(file_path: str) -> str:
    """Convert an absolute file path to a relative URL for serving via static files."""
    storage_root = get_storage_path()
    try:
        relative = Path(file_path).resolve().relative_to(storage_root)
        return f"/storage/{relative.as_posix()}"
    except ValueError:
        return file_path


def mask_api_key(key: str) -> str:
    """Mask an API key, showing only first 4 and last 4 characters."""
    if not key or len(key) <= 8:
        return "****" if key else ""
    return f"{key[:4]}...{key[-4:]}"


def validate_platform(platform: str) -> bool:
    """Check if a platform name is valid."""
    return platform.lower() in ("facebook", "tiktok", "youtube")


def parse_hashtags(hashtags_str: Optional[str]) -> list[str]:
    """Parse a comma- or space-separated hashtag string into a list."""
    if not hashtags_str:
        return []
    tags = []
    for part in hashtags_str.replace(",", " ").split():
        tag = part.strip().lstrip("#")
        if tag:
            tags.append(f"#{tag}")
    return tags


def format_duration(seconds: Optional[float]) -> str:
    """Format seconds into a human-readable duration string."""
    if seconds is None:
        return "N/A"
    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m {secs}s"
    if minutes:
        return f"{minutes}m {secs}s"
    return f"{secs}s"
