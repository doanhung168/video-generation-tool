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
        self.api_key = api_key
        self.kimi = KimiService()
        self._client = None
        self._last_key = None

    @property
    def active_key(self) -> str:
        if self.api_key and not self.api_key.startswith("****"):
            return self.api_key
        try:
            from routers.settings import _get
            k = _get("google_api_key")
            if k and not k.startswith("****"):
                return k
        except Exception:
            pass
        return getattr(settings, "GOOGLE_API_KEY", "")

    def _get_client(self):
        """Lazily initialize or refresh the Google GenAI client."""
        key = self.active_key
        if not key or key.startswith("****"):
            return None
        if self._client is None or self._last_key != key:
            try:
                from google import genai
                self._client = genai.Client(api_key=key)
                self._last_key = key
            except Exception as e:
                logger.warning("Failed to initialize Google GenAI Client: %s", e)
                return None
        return self._client

    async def _generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Call Gemini and return text, or fallback gracefully."""
        import asyncio

        client = self._get_client()
        if client:
            for model_name in ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"]:
                try:
                    result = await asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=user_prompt,
                        config={
                            "system_instruction": system_prompt,
                            "temperature": 0.7,
                            "max_output_tokens": 2048,
                        },
                    )
                    if result and result.text:
                        return result.text.strip()
                except Exception as exc:
                    logger.warning("Gemini model %s call failed: %s", model_name, exc)

        # Fallback to Kimi if configured
        if self.kimi.active_key:
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
        language: str = "vi",
        voice_gender: str = "female",
        voice_tone: str = "youthful_energetic",
    ) -> Dict[str, Any]:
        """
        Orchestrates the 'Confirm Skill, Prompt, Agent' step before video rendering.
        Injects chosen language and voice gender/tone directly into the prompt and screenplay.
        """
        skills = skills or ["Cinematic 4K", "Fluid Motion", "Dynamic Lighting", "3s Viral Hook"]

        from services.kimi_service import LANG_MAP, VOICE_GENDER_MAP, VOICE_TONE_MAP
        lang_info = LANG_MAP.get(language, LANG_MAP["vi"])
        gender_info = VOICE_GENDER_MAP.get(voice_gender, VOICE_GENDER_MAP["female"])
        tone_info = VOICE_TONE_MAP.get(voice_tone, VOICE_TONE_MAP["youthful_energetic"])

        client = self._get_client()
        if client:
            try:
                import asyncio
                system_instruction = (
                    f"Bạn là {agent_role}, một đạo diễn video AI và chuyên gia sáng tạo kịch bản hàng đầu thế giới. "
                    f"Kỹ năng đang kích hoạt: {', '.join(skills)}. Model video đích: {engine}.\n"
                    f"CẤU HÌNH NGÔN NGỮ & GIỌNG ĐỌC BẮT BUỘC:\n"
                    f"- Ngôn ngữ kịch bản & Voiceover: {lang_info['name']} ({lang_info['en_name']})\n"
                    f"- Giọng đọc: {gender_info['name']} ({gender_info['en']})\n"
                    f"- Sắc thái giọng (Tone): {tone_info['name']} ({tone_info['en']})\n\n"
                    "QUY TẮC BẮT BUỘC:\n"
                    "1. Đọc kỹ yêu cầu và đối tượng mục tiêu của người dùng. Tự động chuyển thể thành kịch bản chuyên nghiệp, phù hợp với sản phẩm/nội dung.\n"
                    "2. TUYỆT ĐỐI KHÔNG lặp lại các câu lệnh thô (như 'Tạo một video quảng cáo...', 'Đối tượng: ...') vào lời thoại voiceover hay tiêu đề!\n"
                    f"3. 'title', 'scenes[].voiceover', và 'social_captions' PHẢI viết chuẩn bằng {lang_info['name']}. Lời voiceover phải thể hiện đúng sắc thái ({tone_info['name']}) và giới tính giọng đọc ({gender_info['name']}).\n"
                    "4. 'scenes[].visual_prompt' và 'master_video_prompt' PHẢI viết bằng TIẾNG ANH chi tiết chuẩn điện ảnh 4K (ánh sáng, chuyển động máy quay, góc máy, chi tiết vật liệu) để đưa vào model video.\n"
                    f"5. Cuối 'master_video_prompt' PHẢI chèn chỉ thị âm thanh: '[Audio Directive: {gender_info['en']} voiceover in {lang_info['en_name']}, tone: {tone_info['en']}, professional studio acoustic, synced pacing]'.\n"
                    "Xuất định dạng JSON hợp lệ:\n"
                    "{\n"
                    '  "title": "Tên video hấp dẫn",\n'
                    '  "agent_profile": "Tóm tắt vai trò đạo diễn và chiến lược phân cảnh",\n'
                    '  "language": "' + language + '",\n'
                    '  "voice_gender": "' + voice_gender + '",\n'
                    '  "voice_tone": "' + voice_tone + '",\n'
                    '  "confirmed_skills": ["Skill 1", "Skill 2"],\n'
                    '  "scenes": [\n'
                    '    {\n'
                    '      "scene_num": 1,\n'
                    '      "duration_seconds": 3,\n'
                    '      "visual_prompt": "Ultra-detailed visual description in English",\n'
                    '      "camera_angle": "Low-angle dynamic tracking shot",\n'
                    '      "lighting": "Golden hour glow",\n'
                    '      "voiceover": "Lời thoại thu hút theo đúng ngôn ngữ và sắc thái giọng đã chọn",\n'
                    '      "voice_tag": "[' + gender_info['name'] + ' - ' + tone_info['name'].split(',')[0] + ' | ' + lang_info['name'] + ']"\n'
                    '    }\n'
                    '  ],\n'
                    '  "master_video_prompt": "High-fidelity English video prompt with [Audio Directive: ...]",\n'
                    '  "social_captions": {"facebook": "...", "tiktok": "...", "youtube": "..."},\n'
                    '  "hashtags": ["#tag1", "#tag2"]\n'
                    "}"
                )
                user_msg = (
                    f"Yêu cầu kịch bản: {topic}\n"
                    f"Thời lượng: {duration} giây\n"
                    f"Phong cách hình ảnh: {style}\n"
                    f"Ngôn ngữ: {lang_info['name']}\n"
                    f"Giọng đọc: {gender_info['name']} - Sắc thái: {tone_info['name']}\n"
                    "Hãy phân tích và xuất JSON kế hoạch sản xuất video hoàn chỉnh."
                )
                for model_name in ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"]:
                    try:
                        res = await asyncio.to_thread(
                            client.models.generate_content,
                            model=model_name,
                            contents=user_msg,
                            config={
                                "system_instruction": system_instruction,
                                "response_mime_type": "application/json",
                                "temperature": 0.7,
                            },
                        )
                        if res and res.text:
                            return json.loads(res.text)
                    except Exception as model_err:
                        logger.warning("Gemini model %s failed: %s", model_name, model_err)
            except Exception as e:
                logger.warning("Gemini confirm_skill failed, falling back to smart synthesis: %s", e)

        # Fallback to Kimi or Smart Semantic Synthesizer
        return await self.kimi.generate_script_and_scenes(
            topic=topic,
            agent_role=agent_role,
            skills=skills,
            duration=duration,
            style=style,
            language=language,
            voice_gender=voice_gender,
            voice_tone=voice_tone,
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
            "depth of field, and fluid motion. Output ONLY the prompt in English."
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
        system = "Bạn là biên kịch video chuyên nghiệp. Hãy viết kịch bản phân cảnh tiếng Việt chi tiết gồm hình ảnh, lời thoại và ghi chú âm thanh."
        user = f"Chủ đề: {topic}\nThời lượng: {duration} giây\nPhong cách: {style}"
        res = await self._generate_text(system, user)
        return res or f"# Kịch bản: {topic}\n\n## Cảnh 1 (0-5s)\nHình ảnh: Giới thiệu ấn tượng về {topic}.\nLời bình: Chào mừng bạn đến với trải nghiệm mới."

    async def suggest_hashtags(
        self,
        title: str,
        description: str = "",
        platform: str = "all",
    ) -> List[str]:
        """Suggest trending hashtags."""
        tags = ["#AIvideo", "#VideoGeneration", "#Trending", "#Viral", "#Xuhuong"]
        if "tiktok" in platform.lower():
            tags += ["#fyp", "#foryou", "#tiktokviral"]
        elif "youtube" in platform.lower():
            tags += ["#Shorts", "#YouTubeShorts", "#Review"]
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
            f"👉 Xem ngay và để lại cảm nhận của bạn bên dưới! #xuhuong #aivideo"
        )
