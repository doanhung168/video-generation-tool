import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db
from models import Project, Video, SocialPost, PromptTemplate
from routers import (
    projects_router,
    videos_router,
    social_router,
    templates_router,
    settings_router,
)
from utils.helpers import get_storage_path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("video_gen_tool")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure storage dir exists and initialize DB tables
    storage_path = get_storage_path()
    logger.info("Initializing Video Generation Tool. Storage at: %s", storage_path)
    await init_db()
    logger.info("Database schema verified and initialized.")

    # Seed initial default templates if empty
    from database import async_session_factory
    from sqlalchemy import select
    async with async_session_factory() as session:
        result = await session.execute(select(PromptTemplate))
        existing = result.scalars().first()
        if not existing:
            default_templates = [
                PromptTemplate(
                    name="Viral TikTok Hook",
                    category="script",
                    description="High retention 3-second hook with fast-paced visual storytelling",
                    user_prompt_template="Create a viral TikTok video about {{topic}}. Style: energetic, jump cuts, bold captions.",
                    variables={"topic": "AI tools for creators"},
                ),
                PromptTemplate(
                    name="Cinematic Masterpiece (Veo 3 / Wan 2.1)",
                    category="prompt",
                    description="Hyper-realistic cinematic camera motions, Arri 35mm lens, volumetric light",
                    user_prompt_template="Cinematic 4K shot of {{subject}}, {{environment}}, golden hour lighting, 35mm lens, shallow depth of field, photorealistic, 60fps.",
                    variables={"subject": "Futuristic cyberpunk cityscape", "environment": "rain-soaked neon streets"},
                ),
                PromptTemplate(
                    name="AI Director Agent",
                    category="agent",
                    description="Autonomous director agent that analyzes scripts, coordinates scenes, and enforces pacing",
                    system_prompt="You are an award-winning Film Director and Visual Storyteller. You ensure continuity, lighting cohesion, and emotional resonance across all scene generations.",
                    user_prompt_template="Direct a cohesive video sequence for {{title}} focusing on {{mood}}.",
                    variables={"title": "The Dawn of Intelligent Agents", "mood": "awe-inspiring, epic"},
                ),
            ]
            session.add_all(default_templates)
            await session.commit()
            logger.info("Seeded default prompt & agent templates.")

    yield
    logger.info("Shutting down Video Generation Tool.")


app = FastAPI(
    title="🎬 AI Video Generation & Social Publishing Engine",
    description="Multi-model video creation (Veo 3, Google Flow, Wan 2.1, Seedance, Kimi) with agent confirmation and automated multi-platform social publishing.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (permits Next.js frontend on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
API_V1 = "/api/v1"
app.include_router(videos_router, prefix=API_V1)
app.include_router(projects_router, prefix=API_V1)
app.include_router(social_router, prefix=API_V1)
app.include_router(templates_router, prefix=API_V1)
app.include_router(settings_router, prefix=API_V1)

# Serve generated videos and thumbnails statically
storage_dir = Path(settings.STORAGE_PATH).resolve()
storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "AI Video Generation Tool",
        "version": "1.0.0",
        "models_supported": [
            "Google Veo 3",
            "Google Flow",
            "Google Gemini 2.5/2.0",
            "Moonshot AI (Kimi)",
            "Alibaba Wan 2.1",
            "ByteDance Seedance / Seaweed",
        ],
        "social_platforms": ["Facebook", "TikTok", "YouTube"],
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
