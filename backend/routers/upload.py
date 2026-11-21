import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

from config import settings
from utils.helpers import get_storage_path

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Upload image, video, audio, or script file for multimodal generation."""
    storage_root = get_storage_path()
    uploads_dir = storage_root / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
    dest_path = uploads_dir / unique_name

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Determine media type
    media_type = "file"
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        media_type = "image"
    elif ext in [".mp4", ".mov", ".avi", ".webm", ".mkv"]:
        media_type = "video"
    elif ext in [".mp3", ".wav", ".aac", ".m4a", ".ogg"]:
        media_type = "audio"
    elif ext in [".txt", ".md", ".pdf", ".docx"]:
        media_type = "document"

    # If it's a text/md file, read content to prefill prompt if desired
    text_content = ""
    if ext in [".txt", ".md"]:
        try:
            text_content = dest_path.read_text(encoding="utf-8", errors="ignore")[:3000]
        except Exception:
            pass

    return {
        "success": True,
        "filename": file.filename,
        "saved_as": unique_name,
        "media_type": media_type,
        "url": f"/storage/uploads/{unique_name}",
        "text_content": text_content,
        "size_bytes": dest_path.stat().st_size,
    }
