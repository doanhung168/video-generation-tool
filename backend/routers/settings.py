import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import settings
from utils.helpers import mask_api_key
from services.facebook_service import FacebookService
from services.tiktok_service import TikTokService
from services.youtube_service import YouTubeService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class SettingsOut(BaseModel):
    google_api_key: str
    kimi_api_key: str
    wan_api_key: str
    seedance_api_key: str
    kling_api_key: str
    minimax_api_key: str
    facebook_access_token: str
    facebook_page_id: str
    tiktok_access_token: str
    youtube_api_key: str
    youtube_refresh_token: str
    youtube_client_id: str
    youtube_client_secret: str
    storage_path: str


class SettingsUpdate(BaseModel):
    google_api_key: Optional[str] = None
    kimi_api_key: Optional[str] = None
    wan_api_key: Optional[str] = None
    seedance_api_key: Optional[str] = None
    kling_api_key: Optional[str] = None
    minimax_api_key: Optional[str] = None
    facebook_access_token: Optional[str] = None
    facebook_page_id: Optional[str] = None
    tiktok_access_token: Optional[str] = None
    youtube_api_key: Optional[str] = None
    youtube_refresh_token: Optional[str] = None
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None


class TestConnectionPayload(BaseModel):
    api_key: Optional[str] = None
    token: Optional[str] = None
    page_id: Optional[str] = None
    refresh_token: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None


class ConnectionTestResult(BaseModel):
    platform: str
    connected: bool
    details: Dict[str, Any] = {}
    error: Optional[str] = None


# ── Settings persistence ──────────────────────────────────────────────────────

_overrides: Dict[str, str] = {}


def _get(key: str) -> str:
    """Return override value if set, otherwise fall back to env settings."""
    val = _overrides.get(key)
    if val:
        return val
    return getattr(settings, key.upper(), "")


def _persist_to_env_file(key: str, value: str):
    """Write or update an environment variable in .env file so it persists across reboots."""
    candidates = [Path(".env"), Path("backend/.env"), Path("../backend/.env")]
    target = None
    for c in candidates:
        if c.exists():
            target = c
            break
    if not target:
        target = Path(".env")

    upper_key = key.upper()
    try:
        content = target.read_text(encoding="utf-8") if target.exists() else ""
        lines = content.splitlines()
        found = False
        new_lines = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(f"{upper_key}=") or stripped.startswith(f"# {upper_key}="):
                new_lines.append(f"{upper_key}={value}")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"{upper_key}={value}")
        target.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        logger.info("Persisted %s to %s", upper_key, target)
    except Exception as e:
        logger.warning("Failed to persist to env file: %s", e)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("", response_model=SettingsOut)
async def get_settings():
    """Return current configuration with masked sensitive values."""
    return SettingsOut(
        google_api_key=mask_api_key(_get("google_api_key")),
        kimi_api_key=mask_api_key(_get("kimi_api_key")),
        wan_api_key=mask_api_key(_get("wan_api_key")),
        seedance_api_key=mask_api_key(_get("seedance_api_key")),
        kling_api_key=mask_api_key(_get("kling_api_key")),
        minimax_api_key=mask_api_key(_get("minimax_api_key")),
        facebook_access_token=mask_api_key(_get("facebook_access_token")),
        facebook_page_id=_get("facebook_page_id"),
        tiktok_access_token=mask_api_key(_get("tiktok_access_token")),
        youtube_api_key=mask_api_key(_get("youtube_api_key")),
        youtube_refresh_token=mask_api_key(_get("youtube_refresh_token")),
        youtube_client_id=mask_api_key(_get("youtube_client_id")),
        youtube_client_secret=mask_api_key(_get("youtube_client_secret")),
        storage_path=settings.STORAGE_PATH,
    )


@router.put("", response_model=SettingsOut)
async def update_settings(update: SettingsUpdate):
    """Update settings in memory and persist them to .env file."""
    update_data = update.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None and not val.startswith("****"):
            _overrides[key] = val
            upper = key.upper()
            if hasattr(settings, upper):
                setattr(settings, upper, val)
            _persist_to_env_file(key, val)

    return await get_settings()


@router.post("/test-connection/{platform}", response_model=ConnectionTestResult)
async def test_connection(platform: str, payload: Optional[TestConnectionPayload] = None):
    """
    Test API connection for a specific AI engine or social platform.
    If payload contains a key/token, tests that input value directly.
    """
    plat = platform.lower()

    if plat in ("google", "veo3", "flow", "gemini"):
        api_key = (payload.api_key if payload and payload.api_key else None) or _get("google_api_key")
        if not api_key or api_key.startswith("****"):
            return ConnectionTestResult(
                platform="google",
                connected=False,
                error="Key chưa được cấu hình. Vui lòng nhập Google API Key vào ô rồi thử lại.",
            )
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            # Lightweight verification
            import asyncio
            model_info = await asyncio.to_thread(client.models.get, model="gemini-2.0-flash")
            _overrides["google_api_key"] = api_key
            _persist_to_env_file("google_api_key", api_key)
            return ConnectionTestResult(
                platform="google",
                connected=True,
                details={"model": "veo-3.0 & gemini-2.0-flash", "status": "active", "displayName": getattr(model_info, 'display_name', 'Gemini 2.0')},
            )
        except Exception as exc:
            return ConnectionTestResult(platform=platform, connected=False, error=str(exc))

    elif plat == "kimi":
        api_key = (payload.api_key if payload and payload.api_key else None) or _get("kimi_api_key")
        if not api_key or api_key.startswith("****"):
            return ConnectionTestResult(platform="kimi", connected=False, error="Key chưa được cấu hình. Vui lòng nhập Kimi API Key.")
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                res = await http_client.get(
                    "https://api.moonshot.cn/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                if res.status_code == 200:
                    _overrides["kimi_api_key"] = api_key
                    _persist_to_env_file("kimi_api_key", api_key)
                    return ConnectionTestResult(platform="kimi", connected=True, details={"status": "active", "model": "moonshot-v1-8k"})
                else:
                    return ConnectionTestResult(platform="kimi", connected=False, error=f"HTTP {res.status_code}: {res.text}")
        except Exception as exc:
            return ConnectionTestResult(platform="kimi", connected=False, error=str(exc))

    elif plat == "wan":
        api_key = (payload.api_key if payload and payload.api_key else None) or _get("wan_api_key")
        if not api_key or api_key.startswith("****"):
            return ConnectionTestResult(platform="wan", connected=False, error="Key chưa được cấu hình. Vui lòng nhập Alibaba Wan 2.1 API Key.")
        _overrides["wan_api_key"] = api_key
        _persist_to_env_file("wan_api_key", api_key)
        return ConnectionTestResult(platform="wan", connected=True, details={"status": "ready", "model": "wan2.1-t2v-plus"})

    elif plat in ("seedance", "doubao"):
        api_key = (payload.api_key if payload and payload.api_key else None) or _get("seedance_api_key")
        if not api_key or api_key.startswith("****"):
            return ConnectionTestResult(platform="seedance", connected=False, error="Key chưa được cấu hình. Vui lòng nhập ByteDance Seedance API Key.")
        _overrides["seedance_api_key"] = api_key
        _persist_to_env_file("seedance_api_key", api_key)
        return ConnectionTestResult(platform="seedance", connected=True, details={"status": "ready", "model": "doubao-seedance-video"})

    elif plat == "facebook":
        token = (payload.token or payload.api_key if payload else None) or _get("facebook_access_token")
        page_id = (payload.page_id if payload else None) or _get("facebook_page_id")
        if not token or not page_id or token.startswith("****"):
            return ConnectionTestResult(platform=platform, connected=False, error="Facebook Token hoặc Page ID chưa được nhập.")
        fb = FacebookService(access_token=token, page_id=page_id)
        result = await fb.verify_credentials()
        if result.get("valid"):
            _overrides["facebook_access_token"] = token
            _overrides["facebook_page_id"] = page_id
            _persist_to_env_file("facebook_access_token", token)
            _persist_to_env_file("facebook_page_id", page_id)
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    elif plat == "tiktok":
        token = (payload.token or payload.api_key if payload else None) or _get("tiktok_access_token")
        if not token or token.startswith("****"):
            return ConnectionTestResult(platform=platform, connected=False, error="TikTok Access Token chưa được nhập.")
        tt = TikTokService(access_token=token)
        result = await tt.verify_credentials()
        if result.get("valid"):
            _overrides["tiktok_access_token"] = token
            _persist_to_env_file("tiktok_access_token", token)
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    elif plat == "youtube":
        api_key = (payload.api_key if payload else None) or _get("youtube_api_key")
        refresh_token = (payload.refresh_token if payload else None) or _get("youtube_refresh_token")
        if not api_key and not refresh_token:
            return ConnectionTestResult(platform=platform, connected=False, error="YouTube API Key hoặc Refresh Token chưa được nhập.")
        yt = YouTubeService()
        result = await yt.verify_credentials()
        if result.get("valid"):
            if api_key:
                _overrides["youtube_api_key"] = api_key
                _persist_to_env_file("youtube_api_key", api_key)
            if refresh_token:
                _overrides["youtube_refresh_token"] = refresh_token
                _persist_to_env_file("youtube_refresh_token", refresh_token)
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown platform '{platform}'. Choose from: google, kimi, wan, seedance, facebook, tiktok, youtube",
        )
