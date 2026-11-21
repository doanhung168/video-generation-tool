import logging
from typing import Optional, List, Dict, Any
import httpx

from config import settings

logger = logging.getLogger(__name__)


class KimiService:
    """Service for scripting, storytelling and agent prompt confirmation using Moonshot AI (Kimi)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.KIMI_API_KEY
        self.api_url = "https://api.moonshot.cn/v1/chat/completions"
        self.model = "moonshot-v1-8k"

    async def generate_script_and_scenes(
        self,
        topic: str,
        agent_role: str = "Director",
        skills: Optional[List[str]] = None,
        duration: int = 30,
        style: str = "cinematic",
    ) -> Dict[str, Any]:
        """
        Uses Kimi to write an end-to-end screenplay with visual cues, camera instructions,
        voiceover, and prompt confirmation checklist.
        """
        skills_str = ", ".join(skills) if skills else "Cinematic 4K, Smooth Transitions, Dynamic Lighting"

        system_prompt = (
            f"You are {agent_role}, a world-class AI video director and screenwriter. "
            f"Your active skills are: {skills_str}. "
            "Your mission is to craft a compelling video plan that can be directly confirmed and rendered. "
            "Output valid JSON with the following structure:\n"
            "{\n"
            '  "title": "Compelling video title",\n'
            '  "agent_profile": "Summary of agent persona and strategic direction",\n'
            '  "confirmed_skills": ["Skill 1", "Skill 2"],\n'
            '  "scenes": [\n'
            '     {"scene_num": 1, "duration_seconds": 5, "visual_prompt": "detailed visual prompt", "camera_angle": "drone aerial", "lighting": "golden hour", "voiceover": "optional voiceover text"}\n'
            '  ],\n'
            '  "master_video_prompt": "Dense, vivid prompt optimized for Veo3/Wan2.1/Seedance text-to-video",\n'
            '  "social_captions": {"facebook": "...", "tiktok": "...", "youtube": "..."},\n'
            '  "hashtags": ["#tag1", "#tag2", "#tag3"]\n'
            "}"
        )

        user_content = (
            f"Topic/Script idea: {topic}\n"
            f"Target duration: {duration} seconds\n"
            f"Visual style: {style}\n"
            "Generate the comprehensive video production breakdown in JSON."
        )

        if self.api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7,
                }
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(self.api_url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        import json
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return json.loads(content)
            except Exception as e:
                logger.warning("Kimi API call error or fallback: %s", e)

        # Built-in structured response when Kimi key is not yet configured
        return {
            "title": f"Cinematic {topic[:30]}",
            "agent_profile": f"AI {agent_role} specializing in {skills_str}",
            "confirmed_skills": skills or ["Cinematic 4K", "Ultra-Detailed Composition", "Fluid Motion", "Viral Hook"],
            "scenes": [
                {
                    "scene_num": 1,
                    "duration_seconds": 3,
                    "visual_prompt": f"Dramatic opening shot of {topic}, cinematic lighting, wide lens",
                    "camera_angle": "Low-angle dynamic tracking shot",
                    "lighting": "Volumetric sunlight and subtle haze",
                    "voiceover": f"Have you ever wondered about {topic}?",
                },
                {
                    "scene_num": 2,
                    "duration_seconds": 5,
                    "visual_prompt": f"Close-up intense detail of {topic}, hyper-realistic textures and motion blur",
                    "camera_angle": "Macro focus with shallow depth of field",
                    "lighting": "High contrast neon and warm amber highlights",
                    "voiceover": "Every detail tells an unforgettable story.",
                },
                {
                    "scene_num": 3,
                    "duration_seconds": max(2, duration - 8),
                    "visual_prompt": f"Epic climactic view of {topic}, seamless camera sweep towards the horizon",
                    "camera_angle": "Smooth crane pullback to reveal massive scale",
                    "lighting": "Golden hour glow with lens flare",
                    "voiceover": "Experience the next generation of AI creativity.",
                },
            ],
            "master_video_prompt": (
                f"Masterpiece, cinematic 4K video of {topic}. Shot on 35mm Arri Alexa, "
                f"{style} aesthetic, professional color grading, dynamic camera movement, "
                f"volumetric lighting, award-winning cinematography, photorealistic details."
            ),
            "social_captions": {
                "facebook": f"🚀 Khám phá {topic} với chất lượng điện ảnh đỉnh cao! Xem ngay video được tạo tự động bởi AI.",
                "tiktok": f"🔥 {topic} sẽ thay đổi cách bạn nhìn nhận mọi thứ! #fyp #viral #ai",
                "youtube": f"Chi tiết hành trình khám phá {topic} - Video AI thế hệ mới với Google Veo 3 & Flow.",
            },
            "hashtags": ["#AIvideo", "#Veo3", "#GoogleFlow", "#Wan21", "#Seedance", "#Cinematic", "#ViralVideo"],
        }
