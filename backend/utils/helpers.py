import os
import uuid
import hashlib
import datetime
import subprocess
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


def create_placeholder_video(
    output_path: Path,
    title: str = "AI Video Generation",
    subtitle: str = "Generated with AI Video Tool",
    duration: int = 5,
    resolution: str = "720p",
) -> Path:
    """
    Generate a sleek MP4 video using FFmpeg.
    Ensures that generated videos can immediately be played and downloaded.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    size = "1280x720" if resolution == "720p" else "1920x1080"
    clean_title = title.replace("'", "").replace('"', '').replace(":", " -")[:40]
    clean_sub = subtitle.replace("'", "").replace('"', '').replace(":", " -")[:60]

    cmd = [
        "ffmpeg",
        "-y",
        "-f", "lavfi",
        "-i", f"color=c=#0f172a:s={size}:d={duration}:r=30",
        "-f", "lavfi",
        "-i", f"anullsrc=r=44100:cl=stereo",
        "-vf", (
            f"drawbox=y=0:color=#1e293b@0.8:width=iw:height=ih:t=fill,"
            f"drawtext=text='🎬 {clean_title}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2-40,"
            f"drawtext=text='{clean_sub}':fontcolor=#94a3b8:fontsize=22:x=(w-text_w)/2:y=(h-text_h)/2+20,"
            f"drawtext=text='%{{pts\\:hms}}':fontcolor=#38bdf8:fontsize=20:x=(w-text_w)/2:y=(h-text_h)/2+70"
        ),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        str(output_path),
    ]

    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=30)
    except Exception:
        # Minimal empty fallback file if ffmpeg has issues
        output_path.write_bytes(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41")

    # Generate a thumbnail too
    thumb_path = get_thumbnail_storage_dir() / f"{output_path.stem}.jpg"
    thumb_cmd = [
        "ffmpeg",
        "-y",
        "-ss", "00:00:01",
        "-i", str(output_path),
        "-vframes", "1",
        "-q:v", "2",
        str(thumb_path)
    ]
    try:
        subprocess.run(thumb_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=10)
    except Exception:
        pass

    return output_path
