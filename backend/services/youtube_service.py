import logging
import asyncio
import io
from pathlib import Path
from typing import Optional, List

import httpx

from config import settings

logger = logging.getLogger(__name__)

YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


class YouTubeService:
    """Publish videos to YouTube using the Data API v3 with resumable uploads."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        refresh_token: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        self.api_key = api_key or settings.YOUTUBE_API_KEY
        self.refresh_token = refresh_token or settings.YOUTUBE_REFRESH_TOKEN
        self.client_id = client_id or settings.YOUTUBE_CLIENT_ID
        self.client_secret = client_secret or settings.YOUTUBE_CLIENT_SECRET
        self._access_token: Optional[str] = None

    async def _get_access_token(self) -> str:
        """Exchange the refresh token for a fresh access token."""
        if not all([self.refresh_token, self.client_id, self.client_secret]):
            raise ValueError(
                "YouTube OAuth credentials (refresh_token, client_id, client_secret) are required"
            )

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data["access_token"]
            return self._access_token

    async def publish_video(
        self,
        video_path: str,
        title: str,
        description: str = "",
        tags: Optional[List[str]] = None,
        category_id: str = "22",
        privacy_status: str = "private",
    ) -> dict:
        """
        Upload and publish a video to YouTube via resumable upload.

        Args:
            video_path: Local path to the video file.
            title: Video title.
            description: Video description.
            tags: List of tags.
            category_id: YouTube category ID (default '22' – People & Blogs).
            privacy_status: 'private', 'unlisted', or 'public'.

        Returns:
            dict with 'post_id' (YouTube video ID) and 'post_url'.
        """
        access_token = await self._get_access_token()

        video_file = Path(video_path)
        if not video_file.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        file_size = video_file.stat().st_size

        # Metadata body
        body = {
            "snippet": {
                "title": title[:100],
                "description": description[:5000],
                "tags": tags or [],
                "categoryId": category_id,
            },
            "status": {
                "privacyStatus": privacy_status,
                "selfDeclaredMadeForKids": False,
            },
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(file_size),
            "X-Upload-Content-Type": "video/mp4",
        }

        async with httpx.AsyncClient(timeout=600) as client:
            # Step 1 – Initiate resumable upload
            init_resp = await client.post(
                YOUTUBE_UPLOAD_URL,
                params={
                    "uploadType": "resumable",
                    "part": "snippet,status",
                },
                headers=headers,
                json=body,
            )
            init_resp.raise_for_status()
            upload_url = init_resp.headers["location"]
            logger.info("YouTube resumable upload initiated")

            # Step 2 – Upload the file in a single PUT (suitable for <64 MB)
            # For larger files a chunked strategy should be added.
            with open(video_path, "rb") as fh:
                video_bytes = fh.read()

            upload_resp = await client.put(
                upload_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "video/mp4",
                    "Content-Length": str(file_size),
                },
                content=video_bytes,
            )
            upload_resp.raise_for_status()
            upload_data = upload_resp.json()

            video_id = upload_data["id"]
            post_url = f"https://www.youtube.com/watch?v={video_id}"

            logger.info("YouTube video uploaded – video_id=%s", video_id)

            return {
                "post_id": video_id,
                "post_url": post_url,
            }

    async def check_connection(self) -> dict:
        """Verify YouTube credentials by fetching the authenticated channel."""
        if not self.refresh_token:
            return {"connected": False, "error": "Missing refresh_token"}
        try:
            access_token = await self._get_access_token()
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{YOUTUBE_API_BASE}/channels",
                    params={
                        "part": "snippet",
                        "mine": "true",
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                resp.raise_for_status()
                data = resp.json()
                items = data.get("items", [])
                if not items:
                    return {"connected": False, "error": "No channel found"}
                channel = items[0]["snippet"]
                return {
                    "connected": True,
                    "channel_name": channel.get("title"),
                    "channel_id": items[0].get("id"),
                }
        except Exception as exc:
            return {"connected": False, "error": str(exc)}
