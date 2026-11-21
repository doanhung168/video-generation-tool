import asyncio
import logging
from pathlib import Path
from typing import Optional

from config import settings
from utils.helpers import get_video_storage_dir, generate_unique_filename

logger = logging.getLogger(__name__)


class FlowService:
    """Service for generating videos using Google Flow model via the google-genai library."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_API_KEY
        self._client = None

    def _get_client(self):
        """Lazily initialize the Google GenAI client."""
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def generate_video(
        self,
        prompt: str,
        duration: int = 8,
        style: str = "cinematic",
        project_id: Optional[int] = None,
    ) -> dict:
        """
        Generate a video using Google Flow model.

        Args:
            prompt: Text prompt describing the desired video.
            duration: Desired video duration in seconds.
            style: Visual style hint (cinematic, animated, realistic, etc.).
            project_id: Optional project ID for organizing storage.

        Returns:
            dict with keys: file_path, video_url, duration, resolution, model.
        """
        client = self._get_client()
        storage_dir = get_video_storage_dir(project_id)
        filename = generate_unique_filename(prefix="flow", extension=".mp4")
        output_path = storage_dir / filename

        # Enhance prompt with style hint
        styled_prompt = f"[Style: {style}] {prompt}"

        logger.info(
            "Starting Flow video generation – prompt='%s', duration=%d, style=%s",
            prompt[:80],
            duration,
            style,
        )

        try:
            operation = await asyncio.to_thread(
                client.models.generate_videos,
                model="google/flow",
                prompt=styled_prompt,
                config={
                    "person_generation": "allow_all",
                    "aspect_ratio": "16:9",
                    "number_of_videos": 1,
                },
            )

            # Poll until the operation completes
            max_polls = 120
            poll_interval = 10
            for i in range(max_polls):
                result = await asyncio.to_thread(
                    client.operations.get, operation=operation
                )
                if result.done:
                    break
                logger.debug("Flow poll %d/%d – still generating...", i + 1, max_polls)
                await asyncio.sleep(poll_interval)
            else:
                raise TimeoutError(
                    "Flow video generation timed out after "
                    f"{max_polls * poll_interval}s"
                )

            if not result.response or not result.response.generated_videos:
                raise RuntimeError(
                    "Flow returned no generated videos. "
                    f"Error: {getattr(result, 'error', 'unknown')}"
                )

            generated_video = result.response.generated_videos[0]
            video_data = generated_video.video

            # Download the video bytes
            if hasattr(video_data, "uri") and video_data.uri:
                import httpx

                async with httpx.AsyncClient() as http_client:
                    resp = await http_client.get(video_data.uri)
                    resp.raise_for_status()
                    output_path.write_bytes(resp.content)
            elif hasattr(video_data, "video_bytes") and video_data.video_bytes:
                output_path.write_bytes(video_data.video_bytes)
            else:
                raise RuntimeError("Flow response contained no downloadable video data")

            logger.info("Flow video saved to %s", output_path)

            return {
                "file_path": str(output_path),
                "video_url": f"/storage/videos/{'project_' + str(project_id) + '/' if project_id else ''}{filename}",
                "duration": duration,
                "resolution": "1080p",
                "model": "flow",
            }

        except Exception as exc:
            logger.error("Flow generation failed: %s", exc, exc_info=True)
            raise

    async def check_availability(self) -> bool:
        """Test whether the Flow model is reachable with the configured key."""
        if not self.api_key:
            return False
        try:
            client = self._get_client()
            await asyncio.to_thread(client.models.get, model="google/flow")
            return True
        except Exception as exc:
            logger.warning("Flow availability check failed: %s", exc)
            return False
