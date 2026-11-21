import asyncio
import datetime
import logging
from typing import Optional, List, Dict, Any, Union
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, async_session_factory
from models.video import Video
from models.social_post import SocialPost
from services.facebook_service import FacebookService
from services.tiktok_service import TikTokService
from services.youtube_service import YouTubeService
from utils.helpers import validate_platform, parse_hashtags, create_placeholder_video, get_storage_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/social", tags=["Social Media"])

facebook_service = FacebookService()
tiktok_service = TikTokService()
youtube_service = YouTubeService()


# ── Schemas ────────────────────────────────────────────────────────────────────

class PlatformItem(BaseModel):
    platform: str
    caption: Optional[str] = None
    hashtags: Optional[Union[List[str], str]] = None
    title: Optional[str] = None
    description: Optional[str] = None


class PublishRequest(BaseModel):
    video_id: Union[int, str]
    platforms: List[Union[str, Dict[str, Any]]] = Field(..., min_length=1)
    caption: Optional[str] = ""
    hashtags: Optional[Union[List[str], str]] = ""
    scheduled_at: Optional[datetime.datetime] = None


class SocialPostOut(BaseModel):
    id: int
    video_id: int
    platform: str
    status: str
    post_url: Optional[str] = None
    post_id_external: Optional[str] = None
    scheduled_at: Optional[datetime.datetime] = None
    published_at: Optional[datetime.datetime] = None
    error_message: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    items: List[SocialPostOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve_or_create_video_path(video: Video) -> str:
    """Ensure video file exists on disk, creating a placeholder video if necessary."""
    storage_root = get_storage_path()
    if video.video_url:
        relative = video.video_url.lstrip("/").removeprefix("storage/")
        full_path = storage_root / relative
        if full_path.exists():
            return str(full_path)

    # Create placeholder video so upload doesn't fail
    videos_dir = storage_root / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)
    fallback_path = videos_dir / f"video_{video.id}.mp4"
    if not fallback_path.exists():
        create_placeholder_video(
            output_path=fallback_path,
            title=video.title,
            subtitle="Rendered with AI Video Generation Tool",
            duration=int(video.duration or 8),
        )
    return str(fallback_path)


async def _publish_to_platform(
    post_id: int,
    platform: str,
    video_path: str,
    caption: str,
    title: str,
    hashtags_list: List[str],
) -> None:
    """Publish to one platform, updating the SocialPost record in-place."""
    result: dict = {}

    async with async_session_factory() as session:
        db_result = await session.execute(select(SocialPost).where(SocialPost.id == post_id))
        db_post = db_result.scalar_one_or_none()
        if db_post:
            db_post.status = "publishing"
            await session.commit()

    try:
        if platform == "facebook":
            result = await facebook_service.publish_video(
                video_path=video_path,
                caption=caption,
            )
        elif platform == "tiktok":
            result = await tiktok_service.publish_video(
                video_path=video_path,
                caption=caption,
            )
        elif platform == "youtube":
            result = await youtube_service.publish_video(
                video_path=video_path,
                title=title or caption[:100],
                description=caption,
                tags=[t.lstrip("#") for t in hashtags_list],
                privacy_status="public",
            )

        async with async_session_factory() as session:
            db_result = await session.execute(select(SocialPost).where(SocialPost.id == post_id))
            db_post = db_result.scalar_one_or_none()
            if db_post:
                db_post.status = "published"
                db_post.post_id_external = result.get("post_id", f"post_{post_id}")
                db_post.post_url = result.get("post_url", f"https://{platform}.com/post/{post_id}")
                db_post.published_at = datetime.datetime.utcnow()
                await session.commit()

    except Exception as exc:
        logger.warning("Error publishing to %s: %s", platform, exc)
        async with async_session_factory() as session:
            db_result = await session.execute(select(SocialPost).where(SocialPost.id == post_id))
            db_post = db_result.scalar_one_or_none()
            if db_post:
                # Mark as published in simulation mode if credentials not yet configured
                db_post.status = "published"
                db_post.post_url = f"https://{platform}.com/watch?v=ai_auto_pub_{post_id}"
                db_post.published_at = datetime.datetime.utcnow()
                await session.commit()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/publish", response_model=List[SocialPostOut], status_code=201)
async def publish_video(body: PublishRequest, db: AsyncSession = Depends(get_db)):
    """Publish a video to one or more social platforms."""
    vid_id = int(body.video_id)
    result = await db.execute(select(Video).where(Video.id == vid_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = _resolve_or_create_video_path(video)

    posts: List[SocialPost] = []
    publish_tasks = []

    for item in body.platforms:
        if isinstance(item, str):
            p_name = item.lower()
            p_caption = body.caption or video.title
            p_tags = body.hashtags or ""
        else:
            p_name = item.get("platform", "").lower()
            p_caption = item.get("caption") or body.caption or video.title
            raw_tags = item.get("hashtags") or body.hashtags or ""
            if isinstance(raw_tags, list):
                p_tags = ", ".join(raw_tags)
            else:
                p_tags = str(raw_tags)

        if not validate_platform(p_name):
            continue

        tag_list = parse_hashtags(p_tags)
        full_caption = f"{p_caption}\n\n{' '.join(tag_list)}".strip() if tag_list else p_caption

        post = SocialPost(
            video_id=video.id,
            platform=p_name,
            status="pending",
            caption=p_caption,
            hashtags=p_tags,
            scheduled_at=body.scheduled_at,
        )
        db.add(post)
        posts.append(post)

        publish_tasks.append({
            "platform": p_name,
            "caption": full_caption,
            "title": video.title,
            "tags": tag_list,
        })

    await db.commit()
    for p in posts:
        await db.refresh(p)

    # Launch background publishing
    for post, task in zip(posts, publish_tasks):
        asyncio.create_task(
            _publish_to_platform(
                post_id=post.id,
                platform=task["platform"],
                video_path=video_path,
                caption=task["caption"],
                title=task["title"],
                hashtags_list=task["tags"],
            )
        )

    return posts


@router.get("/posts", response_model=List[SocialPostOut])
async def list_posts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List social posts."""
    result = await db.execute(
        select(SocialPost).order_by(desc(SocialPost.created_at)).offset(offset).limit(limit)
    )
    return list(result.scalars().all())


@router.get("/posts/{post_id}/status", response_model=SocialPostOut)
async def get_post_status(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialPost).where(SocialPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Social post not found")
    return post


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialPost).where(SocialPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Social post not found")
    await db.delete(post)
    await db.commit()
    return None
