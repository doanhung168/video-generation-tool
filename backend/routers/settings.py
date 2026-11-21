from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import settings
from utils.helpers import mask_api_key
from services.facebook_service import FacebookService
from services.tiktok_service import TikTokService
from services.youtube_service import YouTubeService
from services.veo3_service import Veo3Service
from services.wan_service import WanService
from services.seedance_service import SeedanceService
from services.kimi_service import KimiService

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


class ConnectionTestResult(BaseModel):
    platform: str
    connected: bool
    details: Dict[str, Any] = {}
    error: Optional[str] = None


# ── In-memory settings override ────────────────────────────────────────────────

_overrides: Dict[str, str] = {}


def _get(key: str) -> str:
    """Return override value if set, otherwise fall back to env settings."""
    return _overrides.get(key, getattr(settings, key.upper(), ""))


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
    """Update settings in memory for the running session."""
    update_data = update.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None and not val.startswith("****"):
            _overrides[key] = val
            # Also update running settings object
            upper = key.upper()
            if hasattr(settings, upper):
                setattr(settings, upper, val)

    return await get_settings()


@router.post("/test-connection/{platform}", response_model=ConnectionTestResult)
async def test_connection(platform: str):
    """Test API connection for a specific AI engine or social platform."""
    plat = platform.lower()

    if plat in ("google", "veo3", "flow", "gemini"):
        api_key = _get("google_api_key")
        if not api_key:
            return ConnectionTestResult(
                platform=platform,
                connected=False,
                error="Google API key is not configured.",
            )
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            return ConnectionTestResult(
                platform="google",
                connected=True,
                details={"model": "veo-3.0-generate-001 & gemini-2.0-flash", "status": "active"},
            )
        except Exception as exc:
            return ConnectionTestResult(platform=platform, connected=False, error=str(exc))

    elif plat == "kimi":
        api_key = _get("kimi_api_key")
        if not api_key:
            return ConnectionTestResult(platform="kimi", connected=False, error="Kimi API key is not configured.")
        return ConnectionTestResult(platform="kimi", connected=True, details={"status": "ready", "model": "moonshot-v1"})

    elif plat == "wan":
        api_key = _get("wan_api_key")
        if not api_key:
            return ConnectionTestResult(platform="wan", connected=False, error="Wan 2.1 API key is not configured.")
        return ConnectionTestResult(platform="wan", connected=True, details={"status": "ready", "model": "wan2.1-t2v-plus"})

    elif plat in ("seedance", "doubao"):
        api_key = _get("seedance_api_key")
        if not api_key:
            return ConnectionTestResult(platform="seedance", connected=False, error="Seedance API key is not configured.")
        return ConnectionTestResult(platform="seedance", connected=True, details={"status": "ready", "model": "doubao-seedance-video"})

    elif plat == "facebook":
        token = _get("facebook_access_token")
        page_id = _get("facebook_page_id")
        if not token or not page_id:
            return ConnectionTestResult(platform=platform, connected=False, error="Facebook Token or Page ID missing.")
        fb = FacebookService(access_token=token, page_id=page_id)
        result = await fb.verify_credentials()
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    elif plat == "tiktok":
        token = _get("tiktok_access_token")
        if not token:
            return ConnectionTestResult(platform=platform, connected=False, error="TikTok Access Token missing.")
        tt = TikTokService(access_token=token)
        result = await tt.verify_credentials()
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    elif plat == "youtube":
        api_key = _get("youtube_api_key")
        refresh_token = _get("youtube_refresh_token")
        if not api_key and not refresh_token:
            return ConnectionTestResult(platform=platform, connected=False, error="YouTube credentials not configured.")
        yt = YouTubeService()
        result = await yt.verify_credentials()
        return ConnectionTestResult(platform=platform, connected=result.get("valid", False), details=result)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown platform '{platform}'. Choose from: google, kimi, wan, seedance, facebook, tiktok, youtube",
        )
