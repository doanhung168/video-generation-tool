"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  Video,
  CheckCircle2,
  Clock,
  Film,
  Layers,
  Sliders,
  ChevronRight,
  Share2,
  AlertCircle,
  Camera,
  Play,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Music,
  FileText,
  X,
  FileCheck,
} from "lucide-react";
import { confirmPlan, generateVideo, uploadMediaFile } from "@/lib/api";
import type { ConfirmedPlan } from "@/lib/types";

export default function CreateVideoPage() {
  const router = useRouter();

  // Wizard state: 1 = Input, 2 = Confirmation Gate, 3 = Generating/Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [topic, setTopic] = useState(
    "Một phi hành gia đơn độc đi bộ trên bề mặt Sao Hỏa vào lúc hoàng hôn, phản chiếu ánh mặt trời đỏ rực qua tấm kính mũ bảo hiểm"
  );
  const [engine, setEngine] = useState<string>("veo3");
  const [style, setStyle] = useState<string>("cinematic");
  const [duration, setDuration] = useState<number>(15);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [resolution, setResolution] = useState<string>("720p");

  // Agent & Skills state
  const [agentRole, setAgentRole] = useState<string>("Cinematic Film Director");
  const [availableSkills, setAvailableSkills] = useState<string[]>([
    "Cinematic 4K Lighting",
    "3-Second Viral Hook",
    "Dynamic Camera Tracking",
    "Voiceover Dialogue",
    "Fluid Motion Blur",
    "Volumetric Atmosphere",
  ]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Cinematic 4K Lighting",
    "3-Second Viral Hook",
    "Dynamic Camera Tracking",
  ]);

  // Confirmation Plan state
  const [confirming, setConfirming] = useState<boolean>(false);
  const [plan, setPlan] = useState<ConfirmedPlan | null>(null);
  const [editableMasterPrompt, setEditableMasterPrompt] = useState<string>("");

  // Generation state
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multimodal Media & File Upload state
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      filename: string;
      media_type: "image" | "video" | "audio" | "document" | "file";
      url: string;
      size_bytes: number;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const res = await uploadMediaFile(f);
        if (res && res.success) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              filename: res.filename,
              media_type: res.media_type,
              url: res.url,
              size_bytes: res.size_bytes,
            },
          ]);
          // If script file was uploaded, fill or append text content
          if (res.text_content && res.text_content.trim()) {
            setTopic((prev) =>
              prev.length > 5 ? `${prev}\n\n[Từ file ${res.filename}]:\n${res.text_content}` : res.text_content!
            );
          }
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Tải tệp lên thất bại: " + (err.message || "Lỗi mạng"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Step 1 -> Step 2: Trigger Agent Confirmation
  const handleRunConfirmation = async () => {
    if (!topic.trim()) return;
    setConfirming(true);
    setErrorMsg(null);
    try {
      const result = await confirmPlan({
        topic,
        agent_role: agentRole,
        skills: selectedSkills,
        style,
        duration,
        engine,
      });
      setPlan(result);
      setEditableMasterPrompt(result.master_video_prompt || topic);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Confirmation error:", err);
      // Fallback local plan if offline
      const mockPlan: ConfirmedPlan = {
        title: `Cinematic: ${topic.slice(0, 35)}...`,
        agent_profile: `AI ${agentRole} phụ trách chỉ đạo kịch bản, ánh sáng và phân cảnh`,
        confirmed_skills: selectedSkills,
        scenes: [
          {
            scene_num: 1,
            duration_seconds: 3,
            visual_prompt: `Góc quay mở đầu kịch tính: ${topic}. Ánh sáng điện ảnh cao cấp.`,
            camera_angle: "Low-angle smooth tracking shot",
            lighting: "Golden hour glow & volumetric haze",
            voiceover: "Mỗi hành trình vĩ đại đều bắt đầu từ một khoảnh khắc tĩnh lặng.",
          },
          {
            scene_num: 2,
            duration_seconds: 5,
            visual_prompt: `Cận cảnh chi tiết tấm kính mũ phản chiếu bề mặt Sao Hỏa.`,
            camera_angle: "Macro slow pan with bokeh",
            lighting: "Deep contrast and red amber rim-light",
            voiceover: "Nơi ranh giới giữa con người và vũ trụ trở nên vô tận.",
          },
          {
            scene_num: 3,
            duration_seconds: duration - 8 > 0 ? duration - 8 : 4,
            visual_prompt: `Góc máy fly-cam từ từ nâng cao, bao quát cả thung lũng Sao Hỏa.`,
            camera_angle: "Wide crane pullback reveal",
            lighting: "Dramatic horizon sunset",
            voiceover: "Tương lai thuộc về những người dám bước tiếp.",
          },
        ],
        master_video_prompt: `Masterpiece cinematic 4K video of ${topic}. Shot on 35mm Arri Alexa, ${style} aesthetic, professional color grading, dynamic camera movement, volumetric lighting, photorealistic details.`,
        social_captions: {
          facebook: `🚀 Trải nghiệm thước phim điện ảnh được tạo tự động bởi AI (${engine.toUpperCase()})!`,
          tiktok: `🔥 Cảnh tượng choáng ngợp này được tạo hoàn toàn bằng AI! #fyp #viral #ai`,
          youtube: `Khám phá vũ trụ qua góc nhìn AI với Google Veo 3 & Wan 2.1.`,
        },
        hashtags: ["#AIvideo", "#Veo3", "#Wan21", "#Seedance", "#SciFi", "#Cinematic"],
      };
      setPlan(mockPlan);
      setEditableMasterPrompt(mockPlan.master_video_prompt);
      setCurrentStep(2);
    } finally {
      setConfirming(false);
    }
  };

  // Step 2 -> Step 3: Trigger Final Video Generation
  const handleConfirmAndGenerate = async () => {
    setGenerating(true);
    setCurrentStep(3);
    setGenerationProgress(15);

    try {
      // Simulate progress bar smoothly
      const progressTimer = setInterval(() => {
        setGenerationProgress((p) => (p < 85 ? p + 10 : p));
      }, 700);

      const resp = await generateVideo({
        prompt: editableMasterPrompt,
        title: plan?.title || topic.slice(0, 40),
        model: engine,
        duration,
        resolution,
        aspect_ratio: aspectRatio,
        style,
        confirmed_agent: agentRole,
        confirmed_skills: selectedSkills,
      });

      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGeneratedVideo(resp);
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMsg(err.message || "Lỗi khi render video.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            AI Video Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chọn Model AI • Xác nhận Skill, Prompt &amp; Agent • Render Video
          </p>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${
              currentStep === 1
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <span>1</span>
            <span>Kịch bản &amp; Model</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${
              currentStep === 2
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <span>2</span>
            <span>Confirm Skill &amp; Agent</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${
              currentStep === 3
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <span>3</span>
            <span>Render &amp; Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* STEP 1: SCRIPT, ENGINE & AGENT SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Script / Prompt Input Box */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-white">
                Ý tưởng hoặc Kịch bản Video (User Input / Script)
              </label>
              {uploadedFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {uploadedFiles.some((f) => f.media_type === "image")
                      ? "🖼️ Image-to-Video"
                      : uploadedFiles.some((f) => f.media_type === "video")
                      ? "🎥 Video-to-Video"
                      : uploadedFiles.some((f) => f.media_type === "audio")
                      ? "🎙️ Voice/Audio Sync"
                      : "📄 Script Mode"}
                  </span>
                </div>
              )}
            </div>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Nhập mô tả cảnh quay, kịch bản hoặc tải tệp lên bên dưới..."
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />

            {/* MULTIMODAL INPUT: Image, Video, Audio, Document File */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Đính Kèm Tệp Đa Phương Thức (Image, Video, Audio, Script)
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  Image-to-Video • Video-to-Video • Voiceover • Kịch bản .txt/.pdf
                </span>
              </div>

              {/* Upload Drop/Button Area */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Image Upload */}
                <label className="cursor-pointer p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-center transition-all group flex flex-col items-center justify-center gap-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Thêm Ảnh (Image)</span>
                  <span className="text-[10px] text-slate-500">Image-to-Video</span>
                </label>

                {/* Video Upload */}
                <label className="cursor-pointer p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-center transition-all group flex flex-col items-center justify-center gap-1.5">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Thêm Video Nguồn</span>
                  <span className="text-[10px] text-slate-500">Video-to-Video</span>
                </label>

                {/* Audio Upload */}
                <label className="cursor-pointer p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-center transition-all group flex flex-col items-center justify-center gap-1.5">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Thêm Audio / Voice</span>
                  <span className="text-[10px] text-slate-500">Khớp lời thoại</span>
                </label>

                {/* Document / Script Upload */}
                <label className="cursor-pointer p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-center transition-all group flex flex-col items-center justify-center gap-1.5">
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Tải File Kịch Bản</span>
                  <span className="text-[10px] text-slate-500">.txt, .pdf, .md</span>
                </label>
              </div>

              {/* Uploading progress indicator */}
              {isUploading && (
                <div className="text-xs text-indigo-400 flex items-center gap-2 py-1">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải tệp lên máy chủ...</span>
                </div>
              )}

              {/* Preview of Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    Các tệp đã đính kèm ({uploadedFiles.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {file.media_type === "image" && (
                            <img
                              src={`http://localhost:8000${file.url}`}
                              alt={file.filename}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                          )}
                          {file.media_type === "video" && (
                            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                          {file.media_type === "audio" && (
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                          {file.media_type === "document" && (
                            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-medium text-white truncate max-w-[170px]">
                              {file.filename}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-mono">
                              {file.media_type} • {(file.size_bytes / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeUploadedFile(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Xóa tệp"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 backdrop-blur-sm">
            <label className="block text-sm font-semibold text-white flex items-center justify-between">
              <span>Chọn AI Video Engine</span>
              <span className="text-xs font-normal text-slate-400">
                Hỗ trợ Veo 3, Google Flow, Wan 2.1, Seedance, Kimi, Gemini
              </span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  id: "veo3",
                  name: "Google Veo 3",
                  badge: "Flagship",
                  desc: "Chất lượng điện ảnh 4K, ánh sáng và vật lý chân thực",
                  color: "border-indigo-500/40 bg-indigo-950/20",
                },
                {
                  id: "flow",
                  name: "Google Flow",
                  badge: "Workflow",
                  desc: "Pipeline nối tiếp nhiều shot và chuyển cảnh mượt",
                  color: "border-blue-500/40 bg-blue-950/20",
                },
                {
                  id: "wan2.1",
                  name: "Alibaba Wan 2.1",
                  badge: "Open / Fast",
                  desc: "Chuyên trị chuyển động cơ thể, anime & nhân vật 3D",
                  color: "border-purple-500/40 bg-purple-950/20",
                },
                {
                  id: "seedance",
                  name: "ByteDance Seedance",
                  badge: "Viral TikTok",
                  desc: "Tối ưu cho video ngắn, mạng xã hội và nhịp độ nhanh",
                  color: "border-emerald-500/40 bg-emerald-950/20",
                },
                {
                  id: "kimi",
                  name: "Moonshot Kimi",
                  badge: "Screenwriter",
                  desc: "AI biên kịch và phân cảnh chuyên sâu bằng tiếng Việt",
                  color: "border-amber-500/40 bg-amber-950/20",
                },
                {
                  id: "gemini",
                  name: "Gemini 2.5 Flash",
                  badge: "Multimodal",
                  desc: "Phân tích kịch bản đa thể loại & sinh prompt siêu tốc",
                  color: "border-pink-500/40 bg-pink-950/20",
                },
              ].map((m) => {
                const isSelected = engine === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setEngine(m.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">
                        {m.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Agent & Skills Selection */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 backdrop-blur-sm">
            <div>
              <label className="block text-sm font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                Chọn AI Agent Persona
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Agent sẽ đóng vai trò đạo diễn điều phối phong cách và góc máy
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                "Cinematic Film Director",
                "Viral TikTok / Reels Creator",
                "Documentary Storyteller",
                "Commercial Brand Producer",
              ].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAgentRole(role)}
                  className={`p-3 rounded-lg border text-xs font-medium text-left transition-all ${
                    agentRole === role
                      ? "bg-purple-950/40 border-purple-500 text-purple-200 ring-1 ring-purple-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Skills selection checkboxes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Skills / Kỹ năng kích hoạt cho Agent
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((sk) => {
                  const isChecked = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          isChecked ? "text-indigo-400" : "text-slate-600"
                        }`}
                      />
                      <span>{sk}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Technical Specs: Duration, Ratio, Resolution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Thời lượng (Duration)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none"
              >
                <option value={5}>5 giây (Short Hook)</option>
                <option value={8}>8 giây (Veo 3 Standard)</option>
                <option value={15}>15 giây (Reels / TikTok)</option>
                <option value={30}>30 giây (Commercial)</option>
                <option value={60}>60 giây (Full Story)</option>
              </select>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Tỉ lệ khung hình (Aspect Ratio)
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none"
              >
                <option value="16:9">16:9 Landscape (YouTube, Web)</option>
                <option value="9:16">9:16 Vertical (TikTok, FB Reels)</option>
                <option value="1:1">1:1 Square (Instagram Feed)</option>
              </select>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Độ phân giải (Resolution)
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none"
              >
                <option value="720p">720p HD (Tối ưu tốc độ)</option>
                <option value="1080p">1080p Full HD (Chuẩn điện ảnh)</option>
              </select>
            </div>
          </div>

          {/* Trigger Confirmation Step Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={confirming || !topic.trim()}
              onClick={handleRunConfirmation}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>{confirming ? "Đang phân tích & lập kế hoạch..." : "Xác nhận Skill, Prompt & Agent (Step 2)"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: THE CONFIRMATION GATE (CONFIRM SKILL, PROMPT, AGENT) */}
      {currentStep === 2 && plan && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                Cổng Xác Nhận (Confirmation Gate)
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Thay đổi tham số
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Vui lòng xem lại kịch bản chi tiết, persona của Agent và các kỹ năng đã được áp dụng trước khi gửi lệnh render tới model <strong>{engine.toUpperCase()}</strong>.
            </p>
          </div>

          {/* Confirmed Agent Profile & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirmed AI Agent
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                {agentRole}
              </div>
              <p className="text-xs text-slate-300">{plan.agent_profile}</p>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirmed Skills &amp; Constraints
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {plan.confirmed_skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scene Breakdown */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              Phân Cảnh Chi Tiết (Scene Breakdown)
            </h3>

            <div className="space-y-3">
              {plan.scenes.map((scene, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">
                      Cảnh {scene.scene_num || idx + 1} ({scene.duration_seconds}s)
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {scene.camera_angle || "Cinematic Angle"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{scene.visual_prompt}</p>
                  {scene.voiceover && (
                    <div className="text-xs text-amber-300/90 bg-amber-950/20 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                      🎙️ <em>Voiceover:</em> &quot;{scene.voiceover}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Editable Master Prompt */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Master Video Prompt (Gửi tới {engine.toUpperCase()})
              </label>
              <span className="text-xs text-slate-400">Có thể chỉnh sửa trực tiếp</span>
            </div>
            <textarea
              rows={3}
              value={editableMasterPrompt}
              onChange={(e) => setEditableMasterPrompt(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Social Auto-Posting Preview */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              Tự Động Sinh Nội Dung Đăng Mạng Xã Hội
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-blue-400 block mb-1">Facebook</span>
                <p className="text-slate-400 line-clamp-3">
                  {plan.social_captions.facebook}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-pink-400 block mb-1">TikTok</span>
                <p className="text-slate-400 line-clamp-3">
                  {plan.social_captions.tiktok}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-red-400 block mb-1">YouTube</span>
                <p className="text-slate-400 line-clamp-3">
                  {plan.social_captions.youtube}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
            >
              Quay lại chỉnh sửa
            </button>
            <button
              type="button"
              onClick={handleConfirmAndGenerate}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-2 hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>XÁC NHẬN &amp; BẮT ĐẦU TẠO VIDEO</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GENERATION PROGRESS & RESULT */}
      {currentStep === 3 && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-6 text-center">
          {generating ? (
            <div className="py-12 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Đang khởi tạo video với {engine.toUpperCase()}...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đang render các khung hình, xử lý ánh sáng thể tích và âm thanh.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {generationProgress}% Hoàn tất
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Video Đã Sẵn Sàng!</h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto">
                Video đã được render thành công với các thiết lập và prompt đã xác nhận.
              </p>

              {/* Video preview player */}
              {generatedVideo?.video_url && (
                <div className="max-w-xl mx-auto rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black aspect-video">
                  <video
                    src={`http://localhost:8000${generatedVideo.video_url}`}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/publish?videoId=${generatedVideo?.id || ""}&prompt=${encodeURIComponent(
                        editableMasterPrompt
                      )}`
                    )
                  }
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Đăng Tự Động Lên FB, TikTok, YouTube
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setGeneratedVideo(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
                >
                  Tạo Thêm Video Khác
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
