import asyncio
import logging
import datetime
from typing import Optional

from sqlalchemy import select

from database import async_session_factory
from models.video import Video
from services.veo3_service import Veo3Service
from services.flow_service import FlowService
from services.wan_service import WanService
from services.seedance_service import SeedanceService

logger = logging.getLogger(__name__)


class VideoGenerator:
    """Orchestrator that dispatches to the requested video engine (Veo3, Flow, Wan, Seedance) and tracks DB state."""

    def __init__(self):
        self.veo3 = Veo3Service()
        self.flow = FlowService()
        self.wan = WanService()
        self.seedance = SeedanceService()

    async def _update_video_status(
        self,
        video_id: int,
        status: str,
        *,
        video_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        duration: Optional[float] = None,
        resolution: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """Persist a status change to the video record."""
        async with async_session_factory() as session:
            result = await session.execute(select(Video).where(Video.id == video_id))
            video = result.scalar_one_or_none()
            if video is None:
                logger.error("Video id=%d not found during status update", video_id)
                return
            video.status = status
            video.updated_at = datetime.datetime.utcnow()
            if video_url is not None:
                video.video_url = video_url
            if thumbnail_url is not None:
                video.thumbnail_url = thumbnail_url
            if duration is not None:
                video.duration = duration
            if resolution is not None:
                video.resolution = resolution
            if error_message is not None:
                video.error_message = error_message
            await session.commit()

    async def create_video(
        self,
        video_id: int,
        prompt: str,
        model: str = "veo3",
        duration: int = 8,
        resolution: str = "720p",
        aspect_ratio: str = "16:9",
        style: str = "cinematic",
        project_id: Optional[int] = None,
    ) -> None:
        """Run the video generation pipeline in the background and update database state."""
        await self._update_video_status(video_id, "generating")

        try:
            m = model.lower()
            if "flow" in m:
                result = await self.flow.generate_video(
                    prompt=prompt,
                    duration=duration,
                    style=style,
                    project_id=project_id,
                )
            elif "wan" in m:
                result = await self.wan.generate_video(
                    prompt=prompt,
                    duration=duration,
                    resolution=resolution,
                    aspect_ratio=aspect_ratio,
                    project_id=project_id,
                )
            elif "seedance" in m or "seaweed" in m or "doubao" in m:
                result = await self.seedance.generate_video(
                    prompt=prompt,
                    duration=duration,
                    resolution=resolution,
                    aspect_ratio=aspect_ratio,
                    project_id=project_id,
                )
            else:
                # Default to Veo 3
                result = await self.veo3.generate_video(
                    prompt=prompt,
                    duration=duration,
                    resolution=resolution,
                    aspect_ratio=aspect_ratio,
                    project_id=project_id,
                )

            # Look for thumbnail
            from utils.helpers import get_thumbnail_storage_dir
            thumb_file = get_thumbnail_storage_dir() / f"{video_id}.jpg"
            thumb_url = f"/storage/thumbnails/{video_id}.jpg" if thumb_file.exists() else None

            await self._update_video_status(
                video_id,
                "completed",
                video_url=result.get("video_url"),
                thumbnail_url=thumb_url,
                duration=result.get("duration", duration),
                resolution=result.get("resolution", resolution),
            )
            logger.info("Video generation completed for id=%d", video_id)

        except Exception as exc:
            logger.exception("Video generation failed for id=%d: %s", video_id, exc)
            await self._update_video_status(
                video_id,
                "failed",
                error_message=str(exc),
            )
