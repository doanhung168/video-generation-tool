import logging
import asyncio
from pathlib import Path
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v18.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class FacebookService:
    """Publish videos to a Facebook Page via the Graph API (resumable upload)."""

    def __init__(
        self,
        access_token: Optional[str] = None,
        page_id: Optional[str] = None,
    ):
        self.access_token = access_token or settings.FACEBOOK_ACCESS_TOKEN
        self.page_id = page_id or settings.FACEBOOK_PAGE_ID

    async def publish_video(
        self,
        video_path: str,
        caption: str,
        page_id: Optional[str] = None,
        access_token: Optional[str] = None,
    ) -> dict:
        """
        Upload and publish a video to a Facebook Page.

        Returns:
            dict with 'post_id' and 'post_url'.
        """
        token = access_token or self.access_token
        pid = page_id or self.page_id

        if not token or not pid:
            raise ValueError("Facebook access_token and page_id are required")

        video_file = Path(video_path)
        if not video_file.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        file_size = video_file.stat().st_size

        async with httpx.AsyncClient(timeout=300) as client:
            # Step 1 – Start resumable upload session
            start_resp = await client.post(
                f"{GRAPH_API_BASE}/{pid}/videos",
                params={"access_token": token},
                data={
                    "upload_phase": "start",
                    "file_size": str(file_size),
                },
            )
            start_resp.raise_for_status()
            start_data = start_resp.json()
            upload_session_id = start_data["upload_session_id"]
            video_id = start_data.get("video_id")
            logger.info(
                "Facebook upload session started – session=%s video_id=%s",
                upload_session_id,
                video_id,
            )

            # Step 2 – Transfer the file
            with open(video_path, "rb") as fh:
                transfer_resp = await client.post(
                    f"{GRAPH_API_BASE}/{pid}/videos",
                    params={"access_token": token},
                    data={
                        "upload_phase": "transfer",
                        "upload_session_id": upload_session_id,
                        "start_offset": "0",
                    },
                    files={"video_file_chunk": ("video.mp4", fh, "video/mp4")},
                )
            transfer_resp.raise_for_status()
            logger.info("Facebook file transfer completed")

            # Step 3 – Finish the upload
            finish_resp = await client.post(
                f"{GRAPH_API_BASE}/{pid}/videos",
                params={"access_token": token},
                data={
                    "upload_phase": "finish",
                    "upload_session_id": upload_session_id,
                    "title": caption[:100] if caption else "Video",
                    "description": caption or "",
                },
            )
            finish_resp.raise_for_status()
            finish_data = finish_resp.json()

            post_id = finish_data.get("id") or video_id
            post_url = f"https://www.facebook.com/{pid}/videos/{post_id}"

            logger.info("Facebook video published – post_id=%s", post_id)

            return {
                "post_id": str(post_id),
                "post_url": post_url,
            }

    async def check_connection(self) -> dict:
        """Verify the access token is valid and the page is accessible."""
        if not self.access_token or not self.page_id:
            return {"connected": False, "error": "Missing access_token or page_id"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{GRAPH_API_BASE}/{self.page_id}",
                    params={
                        "access_token": self.access_token,
                        "fields": "id,name",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "connected": True,
                    "page_name": data.get("name"),
                    "page_id": data.get("id"),
                }
        except Exception as exc:
            return {"connected": False, "error": str(exc)}
