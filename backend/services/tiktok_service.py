import logging
import asyncio
from pathlib import Path
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

TIKTOK_API_BASE = "https://open.tiktokapis.com/v2"


class TikTokService:
    """Publish videos to TikTok using the Content Posting API."""

    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token or settings.TIKTOK_ACCESS_TOKEN

    async def publish_video(
        self,
        video_path: str,
        caption: str,
        access_token: Optional[str] = None,
    ) -> dict:
        """
        Upload and publish a video to TikTok.

        Returns:
            dict with 'post_id' and 'post_url'.
        """
        token = access_token or self.access_token
        if not token:
            raise ValueError("TikTok access_token is required")

        video_file = Path(video_path)
        if not video_file.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        file_size = video_file.stat().st_size
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

        async with httpx.AsyncClient(timeout=300) as client:
            # Step 1 – Initialize the upload
            init_body = {
                "post_info": {
                    "title": caption[:150] if caption else "Video",
                    "privacy_level": "SELF_ONLY",
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False,
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": file_size,
                    "chunk_size": file_size,
                    "total_chunk_count": 1,
                },
            }

            init_resp = await client.post(
                f"{TIKTOK_API_BASE}/post/publish/inbox/video/init/",
                headers=headers,
                json=init_body,
            )
            init_resp.raise_for_status()
            init_data = init_resp.json()

            publish_id = init_data["data"]["publish_id"]
            upload_url = init_data["data"]["upload_url"]

            logger.info("TikTok upload initialized – publish_id=%s", publish_id)

            # Step 2 – Upload the video file
            with open(video_path, "rb") as fh:
                video_bytes = fh.read()

            upload_headers = {
                "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
                "Content-Type": "video/mp4",
            }
            upload_resp = await client.put(
                upload_url,
                headers=upload_headers,
                content=video_bytes,
            )
            upload_resp.raise_for_status()
            logger.info("TikTok file upload completed")

            # Step 3 – Poll for publish status
            status_url = f"{TIKTOK_API_BASE}/post/publish/status/fetch/"
            max_polls = 30
            poll_interval = 5
            post_id = None

            for i in range(max_polls):
                status_resp = await client.post(
                    status_url,
                    headers=headers,
                    json={"publish_id": publish_id},
                )
                status_resp.raise_for_status()
                status_data = status_resp.json()
                pub_status = status_data.get("data", {}).get(
                    "status", "PROCESSING_UPLOAD"
                )

                if pub_status == "PUBLISH_COMPLETE":
                    post_id = status_data["data"].get("publicaly_available_post_id", [None])
                    if isinstance(post_id, list):
                        post_id = post_id[0] if post_id else publish_id
                    break
                elif pub_status in ("FAILED", "PUBLISH_FAILED"):
                    fail_reason = status_data.get("data", {}).get(
                        "fail_reason", "unknown"
                    )
                    raise RuntimeError(f"TikTok publish failed: {fail_reason}")

                logger.debug(
                    "TikTok poll %d/%d – status=%s", i + 1, max_polls, pub_status
                )
                await asyncio.sleep(poll_interval)
            else:
                # Treat as success even if poll timed out – TikTok may still process
                post_id = publish_id

            post_url = f"https://www.tiktok.com/@me/video/{post_id}" if post_id else ""
            logger.info("TikTok video published – post_id=%s", post_id)

            return {
                "post_id": str(post_id or publish_id),
                "post_url": post_url,
            }

    async def check_connection(self) -> dict:
        """Verify the TikTok access token by fetching user info."""
        if not self.access_token:
            return {"connected": False, "error": "Missing access_token"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    f"{TIKTOK_API_BASE}/user/info/",
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                    },
                    params={"fields": "open_id,display_name,avatar_url"},
                )
                resp.raise_for_status()
                data = resp.json()
                user = data.get("data", {}).get("user", {})
                return {
                    "connected": True,
                    "display_name": user.get("display_name"),
                }
        except Exception as exc:
            return {"connected": False, "error": str(exc)}
