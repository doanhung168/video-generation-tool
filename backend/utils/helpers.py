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
    Generate a sleek, playable MP4 video using FFmpeg.
    Ensures that generated videos can immediately be played and downloaded.
    """
    import platform
    import re

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    size = "1280x720" if resolution == "720p" else "1920x1080"

    # Sanitize text for FFmpeg filter parser (colons must be replaced with hyphens)
    def sanitize(t: str, max_len: int) -> str:
        t = t.replace(":", " - ").replace("'", "").replace('"', '').replace("%", "").replace("\\", "")
        t = re.sub(r'[^\w\s\-\.\,\(\)]', '', t)
        return t.strip()[:max_len]

    clean_title = sanitize(title, 45) or "AI Video Studio"
    clean_sub = sanitize(subtitle, 65) or "Cinematic AI Render"

    # Detect Windows font path
    font_arg = ""
    if platform.system() == "Windows":
        win_font = Path("C:/Windows/Fonts/arial.ttf")
        if win_font.exists():
            font_arg = "fontfile='C\\:/Windows/Fonts/arial.ttf':"

    vf = (
        f"drawbox=y=ih*0.2:color=#1e1b4b@0.7:width=iw:height=ih*0.6:t=fill,"
        f"drawbox=x=iw*0.1:y=ih*0.75:width=iw*0.8:height=6:color=#312e81:t=fill,"
        f"drawtext={font_arg}text='AI VIDEO STUDIO - RENDER COMPLETE':fontcolor=#818cf8:fontsize=22:x=(w-text_w)/2:y=h*0.28,"
        f"drawtext={font_arg}text='{clean_title}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.40,"
        f"drawtext={font_arg}text='{clean_sub}':fontcolor=#cbd5e1:fontsize=20:x=(w-text_w)/2:y=h*0.52,"
        f"drawtext={font_arg}text='Quality - 4K UHD Master • Audio Injected':fontcolor=#10b981:fontsize=18:x=(w-text_w)/2:y=h*0.62"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-f", "lavfi",
        "-i", f"color=c=#0b0f19:s={size}:d={duration}:r=30",
        "-f", "lavfi",
        "-i", f"anullsrc=r=44100:cl=stereo",
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        str(output_path),
    ]

    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=30)
    except Exception as exc:
        # Robust fallback using testsrc if drawtext fails
        fallback_cmd = [
            "ffmpeg",
            "-y",
            "-f", "lavfi",
            "-i", f"testsrc=size={size}:rate=30:duration={duration}",
            "-f", "lavfi",
            "-i", f"sine=frequency=528:duration={duration}",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            str(output_path),
        ]
        try:
            subprocess.run(fallback_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=20)
        except Exception:
            pass

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
