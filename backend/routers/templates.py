import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.prompt_template import PromptTemplate

router = APIRouter(prefix="/templates", tags=["Prompt Templates"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(default="prompt", pattern="^(script|prompt|agent)$")
    system_prompt: Optional[str] = None
    user_prompt_template: str = Field(..., min_length=1)
    variables: Optional[Dict[str, Any]] = None
    is_active: bool = True


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(script|prompt|agent)$")
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    system_prompt: Optional[str]
    user_prompt_template: str
    variables: Optional[Dict[str, Any]]
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class TemplatePreviewRequest(BaseModel):
    template_id: int
    variables: Dict[str, str] = Field(default_factory=dict)


class TemplatePreviewResponse(BaseModel):
    rendered_prompt: str
    system_prompt: Optional[str]


class PaginatedTemplates(BaseModel):
    items: List[TemplateOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class CategoryOut(BaseModel):
    name: str
    count: int


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("", response_model=TemplateOut, status_code=201)
async def create_template(body: TemplateCreate, db: AsyncSession = Depends(get_db)):
    template = PromptTemplate(**body.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("", response_model=PaginatedTemplates)
async def list_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, pattern="^(script|prompt|agent)$"),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(PromptTemplate)
    count_query = select(func.count(PromptTemplate.id))

    if category:
        query = query.where(PromptTemplate.category == category)
        count_query = count_query.where(PromptTemplate.category == category)
    if is_active is not None:
        query = query.where(PromptTemplate.is_active == is_active)
        count_query = count_query.where(PromptTemplate.is_active == is_active)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(PromptTemplate.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedTemplates(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all template categories with counts."""
    result = await db.execute(
        select(PromptTemplate.category, func.count(PromptTemplate.id))
        .group_by(PromptTemplate.category)
    )
    rows = result.all()
    return [CategoryOut(name=row[0], count=row[1]) for row in rows]


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: int,
    body: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    template.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()


@router.post("/preview", response_model=TemplatePreviewResponse)
async def preview_template(
    body: TemplatePreviewRequest, db: AsyncSession = Depends(get_db)
):
    """Render a template with the provided variables."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == body.template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    rendered = template.user_prompt_template
    for key, value in body.variables.items():
        rendered = rendered.replace("{{" + key + "}}", value)

    return TemplatePreviewResponse(
        rendered_prompt=rendered,
        system_prompt=template.system_prompt,
    )
