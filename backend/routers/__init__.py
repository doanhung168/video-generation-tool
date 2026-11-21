from routers.projects import router as projects_router
from routers.videos import router as videos_router
from routers.social import router as social_router
from routers.templates import router as templates_router
from routers.settings import router as settings_router

__all__ = [
    "projects_router",
    "videos_router",
    "social_router",
    "templates_router",
    "settings_router",
]
