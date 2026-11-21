import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.video import Video
from models.social_post import SocialPost
from models.project import Project

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Total videos
    v_res = await db.execute(select(func.count(Video.id)))
    total_videos = v_res.scalar() or 0

    # Published posts
    p_res = await db.execute(select(func.count(SocialPost.id)).where(SocialPost.status == "published"))
    published_posts = p_res.scalar() or 0

    # Active projects
    prj_res = await db.execute(select(func.count(Project.id)))
    active_projects = prj_res.scalar() or 0

    # Credits calculated from video duration
    d_res = await db.execute(select(func.sum(Video.duration)))
    total_sec = d_res.scalar() or 0
    ai_credits = int(total_sec * 10) + 120

    return {
        "data": {
            "total_videos": total_videos,
            "published_posts": published_posts,
            "active_projects": active_projects,
            "ai_credits_used": ai_credits,
        },
        "success": True,
    }


@router.get("/activity")
async def get_activity_feed(db: AsyncSession = Depends(get_db)):
    # Get recent videos and posts
    v_res = await db.execute(select(Video).order_by(desc(Video.created_at)).limit(5))
    recent_videos = list(v_res.scalars().all())

    activities = []
    for v in recent_videos:
        activities.append({
            "id": f"v_{v.id}",
            "type": "video_completed" if v.status == "completed" else "video_created",
            "message": f"Video '{v.title}' status is {v.status}",
            "timestamp": v.created_at.isoformat() if v.created_at else datetime.datetime.utcnow().isoformat(),
        })

    return {"data": activities, "success": True}
