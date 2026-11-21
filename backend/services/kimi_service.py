import logging
import re
from typing import Optional, List, Dict, Any
import httpx

from config import settings

logger = logging.getLogger(__name__)

LANG_MAP = {
    "vi": {"name": "Tiếng Việt", "code": "vi", "en_name": "Vietnamese"},
    "en": {"name": "English", "code": "en", "en_name": "English"},
    "ja": {"name": "日本語 (Japanese)", "code": "ja", "en_name": "Japanese"},
    "ko": {"name": "한국어 (Korean)", "code": "ko", "en_name": "Korean"},
    "zh": {"name": "中文 (Chinese)", "code": "zh", "en_name": "Chinese"},
    "fr": {"name": "Français (French)", "code": "fr", "en_name": "French"},
    "es": {"name": "Español (Spanish)", "code": "es", "en_name": "Spanish"},
}

VOICE_GENDER_MAP = {
    "female": {"name": "Giọng Nữ", "en": "Female"},
    "male": {"name": "Giọng Nam", "en": "Male"},
    "none": {"name": "Chỉ Nhạc Nền (Không Lời)", "en": "No Voice / Instrumental"},
}

VOICE_TONE_MAP = {
    "youthful_energetic": {
        "name": "Trẻ trung, năng động, cuốn hút",
        "en": "Youthful, energetic, vibrant, punchy delivery",
    },
    "warm_inspiring": {
        "name": "Trầm ấm, truyền cảm hứng, uy tín",
        "en": "Deep, warm, inspiring, confident corporate tone",
    },
    "luxurious_soft": {
        "name": "Sang trọng, nhẹ nhàng, quý phái",
        "en": "Elegant, luxurious, soft, alluring aesthetic tone",
    },
    "dramatic_epic": {
        "name": "Hào hùng, kịch tính, dồn dập",
        "en": "Dramatic, epic, intense cinematic trailer narration",
    },
    "natural_story": {
        "name": "Gần gũi, đời thường, kể chuyện",
        "en": "Natural, friendly, casual conversational storytelling",
    },
}


def parse_user_intent(prompt: str) -> Dict[str, Any]:
    """
    Extracts clean product/subject, target audience, and domain from user prompt,
    stripping robotic command prefixes.
    """
    text = prompt.strip()
    audience_pattern = r"(đối tượng|khán giả|target audience|audience|dành cho|cho lứa tuổi|độ tuổi)[:\s]+([^\.\n,]+)"
    audience_match = re.search(audience_pattern, text, re.IGNORECASE)
    audience = audience_match.group(2).strip() if audience_match else ""

    clean_text = re.sub(audience_pattern, "", text, flags=re.IGNORECASE)
    prefixes = [
        r"^tạo\s+(một\s+)?video\s+(quảng\s+cáo\s+)?(về\s+)?",
        r"^làm\s+(một\s+)?video\s+(về\s+)?",
        r"^hãy\s+tạo\s+(video\s+)?(về\s+)?",
        r"^viết\s+kịch\s+bản\s+(cho\s+)?",
        r"^create\s+(a\s+)?video\s+(about\s+)?",
        r"^make\s+(a\s+)?video\s+(about\s+)?",
    ]
    for p in prefixes:
        clean_text = re.sub(p, "", clean_text, flags=re.IGNORECASE)
    clean_text = clean_text.strip(" .;,:-")
    clean_text = re.sub(r"\s+", " ", clean_text)

    lower = prompt.lower()
    if any(k in lower for k in ["giày", "sneaker", "shoe", "footwear", "sandal", "dép"]):
        domain = "shoes"
        subject_en = "stylish modern sneakers with cushioned soles"
        subject_vi = "mẫu giày thể thao thời thượng"
    elif any(k in lower for k in ["thời trang", "váy", "quần áo", "áo", "fashion", "outfit", "apparel", "hoodie", "túi xách"]):
        domain = "fashion"
        subject_en = "chic contemporary fashion outfit"
        subject_vi = "bộ sưu tập thời trang trendy"
    elif any(k in lower for k in ["mỹ phẩm", "son", "kem", "skincare", "làm đẹp", "serum", "nước hoa", "cosmetic", "beauty"]):
        domain = "beauty"
        subject_en = "premium beauty skincare cosmetic product"
        subject_vi = "dòng mỹ phẩm làm đẹp cao cấp"
    elif any(k in lower for k in ["công nghệ", "điện thoại", "máy tính", "laptop", "tai nghe", "gadget", "tech", "ai", "phone", "app"]):
        domain = "tech"
        subject_en = "cutting-edge futuristic high-tech device"
        subject_vi = "thiết bị công nghệ đột phá"
    elif any(k in lower for k in ["ẩm thực", "đồ ăn", "cà phê", "trà sữa", "món ăn", "food", "coffee", "cafe", "bánh"]):
        domain = "food"
        subject_en = "gourmet culinary masterpiece with steam and fresh ingredients"
        subject_vi = "món ẩm thực thơm ngon đặc sắc"
    elif any(k in lower for k in ["du lịch", "khách sạn", "resort", "biển", "núi", "travel", "vacation"]):
        domain = "travel"
        subject_en = "breathtaking exotic travel destination and luxury resort"
        subject_vi = "chuyến du lịch khám phá thiên nhiên tuyệt mỹ"
    else:
        domain = "general"
        subject_en = clean_text if clean_text else "cinematic artistic concept"
        subject_vi = clean_text if clean_text else "thước phim điện ảnh sáng tạo"

    return {
        "clean_text": clean_text or prompt,
        "audience": audience,
        "domain": domain,
        "subject_en": subject_en,
        "subject_vi": subject_vi,
    }


class KimiService:
    """Service for scripting, storytelling and agent prompt confirmation using Moonshot AI (Kimi)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.api_url = "https://api.moonshot.cn/v1/chat/completions"
        self.model = "moonshot-v1-8k"

    @property
    def active_key(self) -> str:
        if self.api_key and not self.api_key.startswith("****"):
            return self.api_key
        try:
            from routers.settings import _get
            k = _get("kimi_api_key")
            if k and not k.startswith("****"):
                return k
        except Exception:
            pass
        return getattr(settings, "KIMI_API_KEY", "")

    async def generate_script_and_scenes(
        self,
        topic: str,
        agent_role: str = "Director",
        skills: Optional[List[str]] = None,
        duration: int = 30,
        style: str = "cinematic",
        language: str = "vi",
        voice_gender: str = "female",
        voice_tone: str = "youthful_energetic",
    ) -> Dict[str, Any]:
        """
        Uses Kimi or smart semantic synthesis to write an end-to-end screenplay with visual cues,
        camera instructions, voiceover, and prompt confirmation checklist.
        """
        skills_str = ", ".join(skills) if skills else "Cinematic 4K, Smooth Transitions, Dynamic Lighting"
        lang_info = LANG_MAP.get(language, LANG_MAP["vi"])
        gender_info = VOICE_GENDER_MAP.get(voice_gender, VOICE_GENDER_MAP["female"])
        tone_info = VOICE_TONE_MAP.get(voice_tone, VOICE_TONE_MAP["youthful_energetic"])

        key = self.active_key

        if key:
            system_prompt = (
                f"Bạn là {agent_role}, một đạo diễn video AI và biên kịch hàng đầu thế giới. Kỹ năng đang kích hoạt: {skills_str}.\n"
                f"CẤU HÌNH NGÔN NGỮ & GIỌNG ĐỌC BẮT BUỘC:\n"
                f"- Ngôn ngữ kịch bản & Voiceover: {lang_info['name']} ({lang_info['en_name']})\n"
                f"- Giọng đọc: {gender_info['name']} ({gender_info['en']})\n"
                f"- Sắc thái giọng (Tone): {tone_info['name']} ({tone_info['en']})\n\n"
                "QUY TẮC BẮT BUỘC:\n"
                "1. Tự động phân tích sản phẩm, chủ đề và đối tượng mục tiêu từ yêu cầu để viết kịch bản chuyên nghiệp.\n"
                "2. TUYỆT ĐỐI KHÔNG lặp lại các câu lệnh thô (như 'Tạo một video quảng cáo...', 'Đối tượng: ...') vào lời thoại voiceover hay tiêu đề!\n"
                f"3. 'title', 'scenes[].voiceover', và 'social_captions' PHẢI viết chuẩn bằng {lang_info['name']}. Lời voiceover phải tự nhiên, cảm xúc, đúng tone {tone_info['name']}.\n"
                "4. 'scenes[].visual_prompt' và 'master_video_prompt' PHẢI viết bằng TIẾNG ANH chi tiết chuẩn điện ảnh 4K (ánh sáng, chuyển động máy quay, góc máy, chi tiết vật liệu) để đưa vào model video.\n"
                f"5. Cuối 'master_video_prompt' PHẢI chèn chỉ thị âm thanh: '[Audio Directive: {gender_info['en']} voiceover in {lang_info['en_name']}, tone: {tone_info['en']}, crystal clear studio recording, synchronized pacing]'.\n"
                "Xuất định dạng JSON hợp lệ:\n"
                "{\n"
                '  "title": "Tiêu đề video cuốn hút",\n'
                '  "agent_profile": "Tóm tắt vai trò đạo diễn",\n'
                '  "language": "' + language + '",\n'
                '  "voice_gender": "' + voice_gender + '",\n'
                '  "voice_tone": "' + voice_tone + '",\n'
                '  "confirmed_skills": ["Skill 1", "Skill 2"],\n'
                '  "scenes": [\n'
                '    {\n'
                '      "scene_num": 1,\n'
                '      "duration_seconds": 3,\n'
                '      "visual_prompt": "Cinematic visual description in English",\n'
                '      "camera_angle": "Low-angle smooth tracking shot",\n'
                '      "lighting": "Golden hour glow",\n'
                '      "voiceover": "Lời thoại theo ngôn ngữ và giọng đọc đã chọn",\n'
                '      "voice_tag": "[' + gender_info['name'] + ' - ' + tone_info['name'].split(',')[0] + ' | ' + lang_info['name'] + ']"\n'
                '    }\n'
                '  ],\n'
                '  "master_video_prompt": "Masterpiece English video prompt with [Audio Directive: ...]",\n'
                '  "social_captions": {"facebook": "...", "tiktok": "...", "youtube": "..."},\n'
                '  "hashtags": ["#tag1", "#tag2"]\n'
                "}"
            )

            user_content = (
                f"Yêu cầu nội dung: {topic}\n"
                f"Thời lượng mong muốn: {duration} giây\n"
                f"Phong cách hình ảnh: {style}\n"
                "Hãy tạo kế hoạch phân cảnh chi tiết định dạng JSON."
            )

            try:
                headers = {
                    "Authorization": f"Bearer {key}",
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
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(self.api_url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        import json
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return json.loads(content)
            except Exception as e:
                logger.warning("Kimi API call error: %s. Using smart semantic fallback.", e)

        # Smart Semantic Synthesis Fallback
        return self._generate_smart_fallback(
            topic=topic,
            agent_role=agent_role,
            skills=skills,
            duration=duration,
            style=style,
            language=language,
            voice_gender=voice_gender,
            voice_tone=voice_tone,
        )

    def _generate_smart_fallback(
        self,
        topic: str,
        agent_role: str,
        skills: Optional[List[str]],
        duration: int,
        style: str,
        language: str,
        voice_gender: str,
        voice_tone: str,
    ) -> Dict[str, Any]:
        """
        High-fidelity semantic fallback when external LLM keys are absent.
        Tailors scripts, visual prompts, and voiceover to specific domain, target language, and voice gender.
        """
        parsed = parse_user_intent(topic)
        domain = parsed["domain"]
        subj_en = parsed["subject_en"]
        subj_vi = parsed["subject_vi"]
        audience = parsed["audience"]

        lang_info = LANG_MAP.get(language, LANG_MAP["vi"])
        gender_info = VOICE_GENDER_MAP.get(voice_gender, VOICE_GENDER_MAP["female"])
        tone_info = VOICE_TONE_MAP.get(voice_tone, VOICE_TONE_MAP["youthful_energetic"])
        tag = f"[{gender_info['name']} - {tone_info['name'].split(',')[0]} | {lang_info['name']}]"

        # Audience context addition for visual prompt
        aud_cue = f" targeted at {audience}" if audience else ""

        # Domain specific visual and voice scripts
        if domain == "shoes":
            title = f"Quảng Cáo Thời Thượng: {subj_vi}" if language == "vi" else f"Fashion Spotlight: {subj_en.title()}"
            v_prompt_1 = f"Dynamic low-angle macro tracking shot of {subj_en}{aud_cue} stepping gracefully onto wet city asphalt, vibrant neon reflection, 35mm lens, shallow depth of field, fluid motion blur."
            v_prompt_2 = f"Extreme close-up 360-degree orbit shot showcasing breathable textile mesh, responsive cushioned sole, pristine stitching, warm ambient rim light, 8k resolution."
            v_prompt_3 = f"Confident hero wide shot of a stylish young model striding into modern metropolis golden hour, sleek outfit complementing {subj_en}, epic cinematic pullback."

            if voice_gender == "none":
                vo1 = "[Nhạc nền upbeat sôi động - không lời thoại]"
                vo2 = "[Nhịp điệu dồn dập, tiếng chuyển động nhịp nhàng]"
                vo3 = "[Giai điệu cao trào - Hiển thị logo thương hiệu]"
            elif language == "vi":
                if voice_gender == "male":
                    vo1 = "Mỗi bước chân là một lời khẳng định bản lĩnh. Bạn đã sẵn sàng bứt phá?"
                    vo2 = "Đệm êm vượt trội, công nghệ đỉnh cao đồng hành cùng bạn suốt cả ngày dài."
                    vo3 = "Định hình phong cách riêng. Khám phá ngay hôm nay!"
                else:
                    vo1 = "Một đôi giày, vạn ánh nhìn. Tự tin sải bước dẫn đầu xu hướng mới!"
                    vo2 = "Thiết kế trendy, êm ái tuyệt đối ôm trọn từng chuyển động của bạn."
                    vo3 = "Tự tin tỏa sáng chất riêng. Sở hữu ngay hôm nay!"
            else: # English or other
                vo1 = "Step into confidence and make every movement your personal statement."
                vo2 = "Unrivaled cushioning engineered for all-day elegance and performance."
                vo3 = "Redefine your stride. Discover the new collection today!"

        elif domain == "fashion":
            title = f"Bộ Sưu Tập Xu Hướng: {subj_vi}" if language == "vi" else f"Trend Runway: {subj_en.title()}"
            v_prompt_1 = f"Slow motion fashion runway entrance, graceful fabric flow of {subj_en}{aud_cue}, soft diffusion studio lighting, high fashion editorial aesthetic."
            v_prompt_2 = f"Detailed macro pan highlighting tailored texture, organic silhouette, and delicate button accents under softbox lighting."
            v_prompt_3 = f"Vibrant urban street hero shot, confident model posing against architectural skyline at dusk, magazine cover composition."

            if voice_gender == "none":
                vo1 = "[Nhạc nền lofi acoustic tinh tế]"
                vo2 = "[Giai điệu du dương, thanh lịch]"
                vo3 = "[Outro nhẹ nhàng, sang trọng]"
            elif language == "vi":
                vo1 = "Thời trang không chỉ là trang phục, đó là cách bạn kể câu chuyện của chính mình."
                vo2 = "Tỉ mỉ trong từng đường kim mũi chỉ, tôn vinh nét đẹp thanh lịch độc bản."
                vo3 = "Đánh thức vẻ đẹp tự tin trong bạn. Trải nghiệm ngay hôm nay!"
            else:
                vo1 = "Fashion is more than clothing—it's how you tell your unique story."
                vo2 = "Exquisite craftsmanship tailored for timeless elegance and distinction."
                vo3 = "Embrace your signature look. Explore the new collection today!"

        elif domain == "beauty":
            title = f"Bí Quyết Rạng Rỡ: {subj_vi}" if language == "vi" else f"Radiant Glow: {subj_en.title()}"
            v_prompt_1 = f"Ethereal slow motion water droplet landing on shimmering serum surface of {subj_en}, soft pastel studio lighting, pristine clean aesthetic."
            v_prompt_2 = f"Macro close-up of smooth dewy skin with healthy radiant glow, glowing warm sunlight through sheer curtains, ultra-realistic texture."
            v_prompt_3 = f"Hero display of the cosmetic bottle with golden particles floating in soft bokeh background, elegant luxury commercial finish."

            if voice_gender == "none":
                vo1 = "[Nhạc không lời spa thư giãn, tiếng nước trong trẻo]"
                vo2 = "[Giai điệu êm dịu, sảng khoái]"
                vo3 = "[Hiển thị tên thương hiệu sang trọng]"
            elif language == "vi":
                vo1 = "Cảm nhận làn da bừng sáng tự nhiên ngay từ giọt dưỡng chất đầu tiên."
                vo2 = "Công thức nuôi dưỡng chuyên sâu, mang lại vẻ rạng rỡ căng tràn sức sống."
                vo3 = "Đánh thức thanh xuân cùng làn da hoàn mỹ. Trải nghiệm ngay hôm nay!"
            else:
                vo1 = "Reveal your most radiant self with the very first drop."
                vo2 = "Intensive nourishing formula designed to awaken natural luminosity."
                vo3 = "Glow with confidence. Experience pure elegance today."

        elif domain == "tech":
            title = f"Đột Phá Công Nghệ: {subj_vi}" if language == "vi" else f"Next-Gen Tech: {subj_en.title()}"
            v_prompt_1 = f"Futuristic dark studio lighting revealing sleek aerodynamic curves and glowing edge displays of {subj_en}, holographic light beams, 4k 60fps."
            v_prompt_2 = f"Hyper-detailed macro fly-through of micro-engineered components, neon cyan circuits, and titanium finish."
            v_prompt_3 = f"User interacting effortlessly with the device in a modern minimalist workspace, camera rotating upward into an inspiring reveal."

            if voice_gender == "none":
                vo1 = "[Âm thanh điện tử synthwave công nghệ cao dồn dập]"
                vo2 = "[Hiệu ứng laser và âm thanh mạch điện tử]"
                vo3 = "[Tiếng bass drop mạnh mẽ kết thúc ấn tượng]"
            elif language == "vi":
                vo1 = "Tương lai công nghệ đã ở ngay trong tầm tay của bạn."
                vo2 = "Hiệu năng bứt phá, thiết kế siêu mỏng nhẹ tái định nghĩa sự tiện nghi."
                vo3 = "Khai mở tiềm năng không giới hạn. Khám phá ngay hôm nay!"
            else:
                vo1 = "The next leap in technology is officially here."
                vo2 = "Unprecedented performance engineered inside a breathtaking ultra-sleek form."
                vo3 = "Unlock boundless possibilities today."

        else: # general cinematic
            title = f"Thước Phim Điện Ảnh: {subj_vi}" if language == "vi" else f"Cinematic Journey: {subj_en.title()}"
            v_prompt_1 = f"Atmospheric cinematic wide opening shot of {subj_en}, volumetric golden morning rays penetrating subtle mist, Arri Alexa 35mm composition."
            v_prompt_2 = f"Intense emotionally charged medium shot, gentle camera glide around subject, hyper-detailed textures and subtle motion blur."
            v_prompt_3 = f"Breathtaking epic crane ascent revealing vast horizon and dramatic sunset reflections, award-winning cinematography."

            if voice_gender == "none":
                vo1 = "[Bản giao hưởng điện ảnh sâu lắng, tiếng vĩ cầm trầm]"
                vo2 = "[Giai điệu cao trào đầy cảm xúc]"
                vo3 = "[Đoạn kết bùng nổ, truyền cảm hứng vô tận]"
            elif language == "vi":
                vo1 = "Mọi hành trình vĩ đại đều bắt đầu từ một khoảnh khắc tĩnh lặng."
                vo2 = "Nơi đam mê giao thoa cùng khát vọng bứt phá mọi giới hạn."
                vo3 = "Tương lai thuộc về những người dám kiến tạo dấu ấn riêng."
            else:
                vo1 = "Every great journey begins with a single silent moment."
                vo2 = "Where relentless passion meets the courage to break every boundary."
                vo3 = "The future belongs to those who dare to create."

        scenes = [
            {
                "scene_num": 1,
                "duration_seconds": 3,
                "visual_prompt": v_prompt_1,
                "camera_angle": "Low-angle smooth tracking shot",
                "lighting": "Volumetric sunlight and subtle haze",
                "voiceover": vo1,
                "voice_tag": tag,
            },
            {
                "scene_num": 2,
                "duration_seconds": 5,
                "visual_prompt": v_prompt_2,
                "camera_angle": "Macro focus with shallow depth of field",
                "lighting": "High contrast studio rim highlights",
                "voiceover": vo2,
                "voice_tag": tag,
            },
            {
                "scene_num": 3,
                "duration_seconds": max(2, duration - 8),
                "visual_prompt": v_prompt_3,
                "camera_angle": "Smooth crane pullback to reveal complete scene",
                "lighting": "Golden hour glow with dramatic reflections",
                "voiceover": vo3,
                "voice_tag": tag,
            },
        ]

        # Explicit Audio Directive for Video Generation Prompt
        if voice_gender == "none":
            audio_directive = "Background music: upbeat modern cinematic track, no spoken voiceover."
        else:
            audio_directive = (
                f"Audio Track: {gender_info['en']} voiceover in {lang_info['en_name']}, "
                f"tone: {tone_info['en']}, crystal-clear studio acoustic recording, perfectly synced with visual rhythm."
            )

        master_video_prompt = (
            f"Masterpiece 4K commercial video showcasing {subj_en}{aud_cue}. Shot on Arri Alexa 35mm, "
            f"{style} aesthetic, professional color grading, dynamic camera movement, "
            f"volumetric lighting, photorealistic details. [{audio_directive}]"
        )

        return {
            "title": title,
            "agent_profile": f"AI {agent_role} phụ trách chỉ đạo kịch bản, âm thanh và phân cảnh điện ảnh",
            "language": language,
            "voice_gender": voice_gender,
            "voice_tone": voice_tone,
            "confirmed_skills": skills or ["Cinematic 4K", "3s Viral Hook", "Fluid Motion", "Dynamic Lighting"],
            "scenes": scenes,
            "master_video_prompt": master_video_prompt,
            "social_captions": {
                "facebook": (
                    f"🚀 Nâng tầm phong cách cùng {subj_vi}! Xem ngay video được sản xuất tự động với AI điện ảnh."
                    if language == "vi"
                    else f"🚀 Experience {subj_en.title()} like never before! Generated automatically by AI."
                ),
                "tiktok": (
                    f"🔥 Thiết kế đỉnh chóp này đã chính thức ra mắt! Bạn đã sở hữu chưa? #fyp #viral #{domain} #xuhuong"
                    if language == "vi"
                    else f"🔥 Next-level perfection is here! Drop a comment if you love this #fyp #viral #{domain}"
                ),
                "youtube": (
                    f"Chi tiết video quảng cáo {subj_vi} - Sản xuất tự động bởi AutoVideo AI (Google Veo 3 & Wan 2.1)."
                    if language == "vi"
                    else f"Official cinematic commercial for {subj_en.title()} - Produced by AutoVideo AI."
                ),
            },
            "hashtags": ["#AIvideo", "#Veo3", "#Wan21", "#Seedance", f"#{domain.title()}", "#ViralVideo", "#Xuhuong"],
        }
