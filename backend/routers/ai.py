import logging
from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.ai_agent import AIAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Helpers"])

ai_agent = AIAgent()


class EnhancePromptReq(BaseModel):
    prompt: str = Field(..., min_length=1)
    style: Optional[str] = "cinematic"
    context: Optional[str] = ""


class GenerateScriptReq(BaseModel):
    topic: str = Field(..., min_length=1)
    duration: Optional[int] = 60
    style: Optional[str] = "informative"


class SuggestHashtagsReq(BaseModel):
    caption: str = ""
    platform: Optional[str] = "all"


class GenerateCaptionReq(BaseModel):
    video_title: str = Field(..., min_length=1)
    platform: Optional[str] = "all"


@router.post("/enhance-prompt")
async def enhance_prompt_endpoint(req: EnhancePromptReq):
    enhanced = await ai_agent.enhance_prompt(
        raw_prompt=req.prompt,
        style=req.style or "cinematic",
        context=req.context or "",
    )
    return {"data": enhanced, "success": True}


@router.post("/generate-script")
async def generate_script_endpoint(req: GenerateScriptReq):
    script = await ai_agent.generate_script(
        topic=req.topic,
        duration=req.duration or 60,
        style=req.style or "informative",
    )
    return {"data": script, "success": True}


@router.post("/suggest-hashtags")
async def suggest_hashtags_endpoint(req: SuggestHashtagsReq):
    tags = await ai_agent.suggest_hashtags(
        title=req.caption,
        platform=req.platform or "all",
    )
    return {"data": tags, "success": True}


@router.post("/generate-caption")
async def generate_caption_endpoint(req: GenerateCaptionReq):
    caption = await ai_agent.generate_caption(
        title=req.video_title,
        platform=req.platform or "all",
    )
    return {"data": caption, "success": True}
