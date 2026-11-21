import logging
import json
from typing import Optional, List, Dict, Any

from config import settings
from services.kimi_service import KimiService

logger = logging.getLogger(__name__)


class AIAgent:
    """
    AI-powered Director & Agent Orchestrator that uses Google Gemini & Moonshot Kimi
    to confirm skills, structure prompts, generate multi-scene scripts, and manage social copy.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_API_KEY
        self.kimi = KimiService()
        self._client = None

    def _get_client(self):
        """Lazily initialize the Google GenAI client."""
        if self._client is None and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("Failed to initialize Google GenAI Client: %s", e)
        return self._client

    async def _generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Call Gemini and return text, or fallback gracefully."""
        import asyncio

        client = self._get_client()
        if client:
            try:
                result = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.0-flash",
                    contents=user_prompt,
                    config={
                        "system_instruction": system_prompt,
                        "temperature": 0.8,
                        "max_output_tokens": 2048,
                    },
                )
                if result and result.text:
                    return result.text.strip()
            except Exception as exc:
                logger.warning("Gemini API call failed: %s", exc)

        # Fallback to Kimi if configured
        if settings.KIMI_API_KEY:
            try:
                kimi_res = await self.kimi.generate_script_and_scenes(user_prompt)
                return kimi_res.get("master_video_prompt", user_prompt)
            except Exception:
                pass

        return user_prompt

    async def confirm_skill_and_prompt(
        self,
        topic: str,
        agent_role: str = "Director",
        skills: Optional[List[str]] = None,
        style: str = "cinematic",
        duration: int = 15,
        engine: str = "veo3",
    ) -> Dict[str, Any]:
        """
        Orchestrates the 'Confirm Skill, Prompt, Agent' step before video rendering.
        Returns full structured details for user review & confirmation.
        """
        skills = skills or ["Cinematic 4K", "Fluid Motion", "Dynamic Lighting", "3s Viral Hook"]

        # Call Kimi or Gemini to generate production plan
        client = self._get_client()
        if client:
            try:
                import asyncio
                system_instruction = (
                    f"You are {agent_role}, a master AI video director. Active skills: {', '.join(skills)}. "
                    f"Target video engine: {engine}. Produce a valid JSON video plan:\n"
                    "{\n"
                    '  "title": "Title",\n'
                    '  "agent_profile": "Agent persona summary",\n'
                    '  "confirmed_skills": ["Skill1", "Skill2"],\n'
                    '  "scenes": [{"scene_num": 1, "duration_seconds": 5, "visual_prompt": "...", "camera_angle": "...", "lighting": "..."}],\n'
                    '  "master_video_prompt": "Ultra-rich master prompt for video generator",\n'
                    '  "social_captions": {"facebook": "...", "tiktok": "...", "youtube": "..."},\n'
                    '  "hashtags": ["#tag1", "#tag2"]\n'
                    "}"
                )
                user_msg = f"Topic: {topic}\nDuration: {duration}s\nStyle: {style}\nOutput JSON only."
                res = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.0-flash",
                    contents=user_msg,
                    config={
                        "system_instruction": system_instruction,
                        "response_mime_type": "application/json",
                        "temperature": 0.7,
                    },
                )
                if res and res.text:
                    return json.loads(res.text)
            except Exception as e:
                logger.warning("Gemini confirm_skill failed, trying Kimi: %s", e)

        return await self.kimi.generate_script_and_scenes(
            topic=topic,
            agent_role=agent_role,
            skills=skills,
            duration=duration,
            style=style,
        )

    async def enhance_prompt(
        self,
        raw_prompt: str,
        style: str = "cinematic",
        context: str = "",
    ) -> str:
        """Enhance a user's raw prompt into a rich, photorealistic production prompt."""
        system = (
            "You are an expert cinematographer and AI video prompt engineer. "
            "Expand the prompt with camera angles, 8k resolution details, cinematic lighting, "
            "depth of field, and fluid motion. Output ONLY the prompt."
        )
        user = f"Style: {style}\nContext: {context}\nOriginal prompt:\n{raw_prompt}"
        res = await self._generate_text(system, user)
        return res or (
            f"Masterpiece 4k video, {style} visual style, {raw_prompt}, "
            "dramatic lighting, shallow depth of field, hyper-realistic, 60fps."
        )

    async def generate_script(
        self,
        topic: str,
        duration: int = 60,
        style: str = "informative",
    ) -> str:
        """Generate a full scene-by-scene script."""
        system = "You are a professional video scriptwriter. Format as Markdown with scenes, visuals, voiceover."
        user = f"Topic: {topic}\nDuration: {duration} seconds\nStyle: {style}"
        res = await self._generate_text(system, user)
        return res or f"# Script: {topic}\n\n## Scene 1 (0-5s)\nVisual: Establishing shot of {topic}.\nVoiceover: Welcome."

    async def suggest_hashtags(
        self,
        title: str,
        description: str = "",
        platform: str = "all",
    ) -> List[str]:
        """Suggest trending hashtags."""
        tags = ["#AIvideo", "#VideoGeneration", "#Tech", "#Viral", "#Creator"]
        if "tiktok" in platform.lower():
            tags += ["#fyp", "#foryou", "#trending"]
        elif "youtube" in platform.lower():
            tags += ["#Shorts", "#YouTubeShorts", "#ContentCreator"]
        elif "facebook" in platform.lower():
            tags += ["#Reels", "#FacebookReels", "#VideoViral"]
        return tags

    async def generate_caption(
        self,
        title: str,
        description: str = "",
        platform: str = "all",
    ) -> str:
        """Generate platform-optimized social post captions."""
        return (
            f"🎬 {title}\n\n"
            f"{description or 'Trải nghiệm video chất lượng cao được sản xuất hoàn toàn tự động bằng AI!'}\n\n"
            f"👉 Xem ngay và để lại cảm nhận của bạn bên dưới!"
        )
