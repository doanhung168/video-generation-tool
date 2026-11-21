import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.project import Project
from models.video import Video

router = APIRouter(prefix="/projects", tags=["Projects"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="draft", pattern="^(draft|active|completed)$")


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|active|completed)$")


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class ProjectStats(BaseModel):
    id: int
    name: str
    status: str
    total_videos: int
    completed_videos: int
    failed_videos: int
    pending_videos: int


class PaginatedProjects(BaseModel):
    items: List[ProjectOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("", response_model=PaginatedProjects)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(draft|active|completed)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project)
    count_query = select(func.count(Project.id))

    if status:
        query = query.where(Project.status == status)
        count_query = count_query.where(Project.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Project.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedProjects(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    project.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()


@router.get("/{project_id}/stats", response_model=ProjectStats)
async def get_project_stats(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Count videos by status
    total_q = await db.execute(
        select(func.count(Video.id)).where(Video.project_id == project_id)
    )
    total_videos = total_q.scalar() or 0

    completed_q = await db.execute(
        select(func.count(Video.id)).where(
            Video.project_id == project_id, Video.status == "completed"
        )
    )
    completed_videos = completed_q.scalar() or 0

    failed_q = await db.execute(
        select(func.count(Video.id)).where(
            Video.project_id == project_id, Video.status == "failed"
        )
    )
    failed_videos = failed_q.scalar() or 0

    pending_q = await db.execute(
        select(func.count(Video.id)).where(
            Video.project_id == project_id, Video.status.in_(["pending", "generating"])
        )
    )
    pending_videos = pending_q.scalar() or 0

    return ProjectStats(
        id=project.id,
        name=project.name,
        status=project.status,
        total_videos=total_videos,
        completed_videos=completed_videos,
        failed_videos=failed_videos,
        pending_videos=pending_videos,
    )
