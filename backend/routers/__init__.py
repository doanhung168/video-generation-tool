from routers.projects import router as projects_router
from routers.videos import router as videos_router
from routers.social import router as social_router
from routers.templates import router as templates_router
from routers.settings import router as settings_router
from routers.ai import router as ai_router
from routers.dashboard import router as dashboard_router
from routers.upload import router as upload_router

__all__ = [
    "projects_router",
    "videos_router",
    "social_router",
    "templates_router",
    "settings_router",
    "ai_router",
    "dashboard_router",
    "upload_router",
]
