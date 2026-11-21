import asyncio
import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.video import Video
from models.social_post import SocialPost
from services.facebook_service import FacebookService
from services.tiktok_service import TikTokService
from services.youtube_service import YouTubeService
from utils.helpers import validate_platform, parse_hashtags

router = APIRouter(prefix="/social", tags=["Social Media"])

facebook_service = FacebookService()
tiktok_service = TikTokService()
youtube_service = YouTubeService()


# ── Schemas ────────────────────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    video_id: int
    platforms: List[str] = Field(..., min_length=1)
    caption: Optional[str] = ""
    hashtags: Optional[str] = ""
    scheduled_at: Optional[datetime.datetime] = None


class PublishAllRequest(BaseModel):
    video_id: int
    caption: Optional[str] = ""
    hashtags: Optional[str] = ""


class SocialPostOut(BaseModel):
    id: int
    video_id: int
    platform: str
    status: str
    post_url: Optional[str]
    post_id_external: Optional[str]
    scheduled_at: Optional[datetime.datetime]
    published_at: Optional[datetime.datetime]
    error_message: Optional[str]
    caption: Optional[str]
    hashtags: Optional[str]
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class PaginatedPosts(BaseModel):
    items: List[SocialPostOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve_video_path(video: Video) -> str:
    """Convert a stored video_url to an absolute file path for upload."""
    from pathlib import Path
    from config import settings

    if not video.video_url:
        raise ValueError("Video has no file URL – generation may not be complete")

    # video_url is like /storage/videos/project_1/file.mp4
    relative = video.video_url.lstrip("/").removeprefix("storage/")
    storage_root = Path(settings.STORAGE_PATH).resolve()
    full_path = storage_root / relative

    if not full_path.exists():
        raise FileNotFoundError(f"Video file not found at {full_path}")

    return str(full_path)


async def _publish_to_platform(
    post: SocialPost,
    video_path: str,
    caption: str,
    video: Video,
) -> None:
    """Publish to one platform, updating the SocialPost record in-place."""
    from database import async_session_factory

    platform = post.platform
    result: dict = {}

    async with async_session_factory() as session:
        # Re-fetch to get a session-bound instance
        db_result = await session.execute(
            select(SocialPost).where(SocialPost.id == post.id)
        )
        db_post = db_result.scalar_one()
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
            tags = parse_hashtags(post.hashtags)
            result = await youtube_service.publish_video(
                video_path=video_path,
                title=video.title or caption[:100],
                description=caption,
                tags=[t.lstrip("#") for t in tags],
                privacy_status="private",
            )

        # Update with success
        async with async_session_factory() as session:
            db_result = await session.execute(
                select(SocialPost).where(SocialPost.id == post.id)
            )
            db_post = db_result.scalar_one()
            db_post.status = "published"
            db_post.post_id_external = result.get("post_id")
            db_post.post_url = result.get("post_url")
            db_post.published_at = datetime.datetime.utcnow()
            await session.commit()

    except Exception as exc:
        async with async_session_factory() as session:
            db_result = await session.execute(
                select(SocialPost).where(SocialPost.id == post.id)
            )
            db_post = db_result.scalar_one()
            db_post.status = "failed"
            db_post.error_message = f"{type(exc).__name__}: {exc}"
            await session.commit()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/publish", response_model=List[SocialPostOut], status_code=201)
async def publish_video(body: PublishRequest, db: AsyncSession = Depends(get_db)):
    """Publish a video to one or more social platforms."""
    # Validate platforms
    for p in body.platforms:
        if not validate_platform(p):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid platform: {p}. Must be facebook, tiktok, or youtube",
            )

    # Fetch video
    result = await db.execute(select(Video).where(Video.id == body.video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "completed":
        raise HTTPException(
            status_code=400, detail="Video must be completed before publishing"
        )

    video_path = _resolve_video_path(video)

    # Create SocialPost records
    posts: List[SocialPost] = []
    for platform in body.platforms:
        post = SocialPost(
            video_id=video.id,
            platform=platform.lower(),
            status="pending",
            caption=body.caption,
            hashtags=body.hashtags,
            scheduled_at=body.scheduled_at,
        )
        db.add(post)
        posts.append(post)

    await db.commit()
    for p in posts:
        await db.refresh(p)

    # Build combined caption with hashtags
    caption_text = body.caption or ""
    if body.hashtags:
        tags = parse_hashtags(body.hashtags)
        caption_text = f"{caption_text}\n\n{' '.join(tags)}".strip()

    # Launch publish tasks in background
    for post in posts:
        asyncio.create_task(
            _publish_to_platform(post, video_path, caption_text, video)
        )

    return posts


@router.post("/publish-all", response_model=List[SocialPostOut], status_code=201)
async def publish_to_all_platforms(
    body: PublishAllRequest, db: AsyncSession = Depends(get_db)
):
    """Convenience endpoint to publish to all three platforms at once."""
    publish_req = PublishRequest(
        video_id=body.video_id,
        platforms=["facebook", "tiktok", "youtube"],
        caption=body.caption,
        hashtags=body.hashtags,
    )
    return await publish_video(publish_req, db)


@router.get("/posts", response_model=PaginatedPosts)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    video_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(SocialPost)
    count_query = select(func.count(SocialPost.id))

    if platform:
        query = query.where(SocialPost.platform == platform.lower())
        count_query = count_query.where(SocialPost.platform == platform.lower())
    if status:
        query = query.where(SocialPost.status == status)
        count_query = count_query.where(SocialPost.status == status)
    if video_id is not None:
        query = query.where(SocialPost.video_id == video_id)
        count_query = count_query.where(SocialPost.video_id == video_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(SocialPost.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedPosts(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


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
    if post.status == "publishing":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a post that is currently being published",
        )
    await db.delete(post)
    await db.commit()
