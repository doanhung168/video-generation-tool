import asyncio
import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.video import Video
from models.prompt_template import PromptTemplate
from services.video_generator import VideoGenerator
from services.ai_agent import AIAgent

router = APIRouter(prefix="/videos", tags=["Videos"])

video_generator = VideoGenerator()
ai_agent = AIAgent()


# ── Schemas ────────────────────────────────────────────────────────────────────

class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    title: Optional[str] = None
    model: str = Field(default="veo3")  # veo3, flow, wan2.1, seedance, kling, minimax
    resolution: str = Field(default="720p")
    duration: int = Field(default=8, ge=1, le=120)
    aspect_ratio: str = Field(default="16:9")
    style: str = Field(default="cinematic")
    project_id: Optional[int] = None
    template_id: Optional[int] = None
    enhance_prompt: bool = Field(default=False)
    confirmed_agent: Optional[str] = None
    confirmed_skills: Optional[List[str]] = None


class ConfirmPlanRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    agent_role: str = Field(default="Cinematic Director")
    skills: List[str] = Field(default_factory=lambda: ["Cinematic 4K", "Fluid Motion", "3s Viral Hook"])
    style: str = Field(default="cinematic")
    duration: int = Field(default=15)
    engine: str = Field(default="veo3")


class VideoOut(BaseModel):
    id: int
    project_id: Optional[int]
    title: str
    description: Optional[str]
    prompt: str
    model_used: str
    status: str
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    duration: Optional[float]
    resolution: Optional[str]
    error_message: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class VideoStatusOut(BaseModel):
    id: int
    status: str
    video_url: Optional[str]
    error_message: Optional[str]
    updated_at: datetime.datetime


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/confirm-plan")
async def confirm_plan(request: ConfirmPlanRequest):
    """
    Agent confirmation endpoint:
    Processes user input with selected AI Agent persona & Skills, producing:
    - Confirmed Agent Profile
    - Confirmed Skills & Constraints
    - Scene breakdown with visual & voiceover cues
    - Final Master Video Prompt ready for rendering
    - Social Media Captions & Hashtags
    """
    plan = await ai_agent.confirm_skill_and_prompt(
        topic=request.topic,
        agent_role=request.agent_role,
        skills=request.skills,
        style=request.style,
        duration=request.duration,
        engine=request.engine,
    )
    return plan


@router.post("/generate", response_model=VideoOut, status_code=202)
async def generate_video(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Initiate an asynchronous video generation task using chosen model (Veo3, Flow, Wan, Seedance)."""
    final_prompt = request.prompt

    # Optionally enhance prompt if requested
    if request.enhance_prompt:
        final_prompt = await ai_agent.enhance_prompt(
            raw_prompt=request.prompt,
            style=request.style,
        )

    title = request.title or (
        request.prompt[:60] + "..." if len(request.prompt) > 60 else request.prompt
    )

    video = Video(
        project_id=request.project_id,
        title=title,
        description=f"Generated with {request.model.upper()} ({request.style} style)",
        prompt=final_prompt,
        model_used=request.model,
        status="pending",
        duration=float(request.duration),
        resolution=request.resolution,
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)

    # Schedule background generation task
    background_tasks.add_task(
        video_generator.create_video,
        video_id=video.id,
        prompt=final_prompt,
        model=request.model,
        duration=request.duration,
        resolution=request.resolution,
        aspect_ratio=request.aspect_ratio,
        style=request.style,
        project_id=request.project_id,
    )

    return video


@router.get("/list", response_model=List[VideoOut])
async def list_videos(
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List videos with optional filters for project, status, and model."""
    stmt = select(Video).order_by(desc(Video.created_at)).offset(offset).limit(limit)

    if project_id is not None:
        stmt = stmt.where(Video.project_id == project_id)
    if status is not None:
        stmt = stmt.where(Video.status == status)
    if model is not None:
        stmt = stmt.where(Video.model_used == model)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{video_id}", response_model=VideoOut)
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details for a single video."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}/status", response_model=VideoStatusOut)
async def get_video_status(
    video_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Poll video generation progress and status."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoStatusOut(
        id=video.id,
        status=video.status,
        video_url=video.video_url,
        error_message=video.error_message,
        updated_at=video.updated_at,
    )


@router.delete("/{video_id}", status_code=204)
async def delete_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a video record and its associated social posts."""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=404, detail="Video not found")

    await db.delete(video)
    await db.commit()
    return None
