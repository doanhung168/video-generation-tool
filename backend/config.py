from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_URL = f"sqlite+aiosqlite:///{BASE_DIR / 'video_gen.db'}"
DEFAULT_STORAGE = str((BASE_DIR.parent / "storage").resolve())


class Settings(BaseSettings):
    # App & Database
    DATABASE_URL: str = DEFAULT_DB_URL
    STORAGE_PATH: str = DEFAULT_STORAGE
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Video & AI Models
    GOOGLE_API_KEY: str = ""        # Google AI Studio: Gemini, Veo 3, Google Flow
    KIMI_API_KEY: str = ""          # Moonshot AI (Kimi) for scripting, screenplay & agents
    WAN_API_KEY: str = ""           # Alibaba Wan 2.1 / DashScope text-to-video
    SEEDANCE_API_KEY: str = ""      # ByteDance Doubao / Seaweed / Seedance video gen
    KLING_API_KEY: str = ""         # Kling AI video API
    MINIMAX_API_KEY: str = ""       # MiniMax Hailuo video API
    OPENAI_API_KEY: str = ""        # OpenAI Sora / GPT-4o fallback

    # Social Media Platforms
    FACEBOOK_ACCESS_TOKEN: str = ""
    FACEBOOK_PAGE_ID: str = ""
    TIKTOK_ACCESS_TOKEN: str = ""
    YOUTUBE_API_KEY: str = ""
    YOUTUBE_REFRESH_TOKEN: str = ""
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
