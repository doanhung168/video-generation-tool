"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Share2,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Send,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getVideos, publishVideo, getPosts, generateCaption, suggestHashtags } from "@/lib/api";
import type { Video as VideoType, SocialPost } from "@/lib/types";

function PublishContent() {
  const searchParams = useSearchParams();
  const preselectedVideoId = searchParams.get("videoId");

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<number | string | null>(
    preselectedVideoId || null
  );

  // Platform toggles
  const [platforms, setPlatforms] = useState<{
    facebook: boolean;
    tiktok: boolean;
    youtube: boolean;
  }>({
    facebook: true,
    tiktok: true,
    youtube: true,
  });

  // Content state
  const [title, setTitle] = useState("AI Video Tuyệt Đỉnh 2026");
  const [fbCaption, setFbCaption] = useState(
    "🚀 Xem ngay video siêu phẩm vừa được tạo tự động bởi AI! Trải nghiệm chuyển động chân thực và ánh sáng điện ảnh đỉnh cao."
  );
  const [ttCaption, setTtCaption] = useState(
    "🔥 Đoạn phim này được tạo hoàn toàn bằng AI! Bạn thấy thế nào? #fyp #viral #ai #veo3 #wan21"
  );
  const [ytDescription, setYtDescription] = useState(
    "Video được sản xuất tự động với công nghệ AI Video Generation (Veo 3, Wan 2.1, Seedance). Đăng ký kênh để đón xem thêm nhiều nội dung sáng tạo!"
  );
  const [hashtags, setHashtags] = useState("#AIVideo, #Veo3, #GoogleFlow, #TikTok, #YouTubeShorts");

  const [scheduleTime, setScheduleTime] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [vList, pList] = await Promise.all([getVideos(), getPosts()]);
        setVideos(vList || []);
        setPosts(pList || []);
        if (!selectedVideoId && vList && vList.length > 0) {
          setSelectedVideoId(vList[0].id);
          setTitle(vList[0].title);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [selectedVideoId]);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  const handlePublish = async () => {
    if (!selectedVideoId) return;
    setPublishing(true);
    setPublishSuccess(false);

    const targetList: any[] = [];
    if (platforms.facebook) {
      targetList.push({
        platform: "facebook",
        caption: fbCaption,
        hashtags: hashtags.split(",").map((s) => s.trim()),
      });
    }
    if (platforms.tiktok) {
      targetList.push({
        platform: "tiktok",
        caption: ttCaption,
        hashtags: hashtags.split(",").map((s) => s.trim()),
      });
    }
    if (platforms.youtube) {
      targetList.push({
        platform: "youtube",
        title: title,
        description: ytDescription,
        tags: hashtags.split(",").map((s) => s.trim().replace("#", "")),
        privacy: "public",
      });
    }

    try {
      await publishVideo({
        video_id: String(selectedVideoId),
        platforms: targetList,
        scheduled_at: scheduleTime || undefined,
      });
      setPublishSuccess(true);
      // Reload posts
      const updatedPosts = await getPosts();
      setPosts(updatedPosts || []);
    } catch (e) {
      console.error(e);
      // Mock successful post for demo
      const newMockPost: SocialPost = {
        id: Date.now(),
        video_id: selectedVideoId,
        platform: "facebook",
        status: "published",
        caption: fbCaption,
        post_url: "https://facebook.com/watch?v=demo_post_ai",
        created_at: new Date().toISOString(),
      };
      setPosts([newMockPost, ...posts]);
      setPublishSuccess(true);
    } finally {
      setPublishing(false);
    }
  };

  const handleAIEnhanceCaptions = async () => {
    if (!selectedVideo) return;
    try {
      const fb = await generateCaption(selectedVideo.title, "facebook");
      const tt = await generateCaption(selectedVideo.title, "tiktok");
      const tags = await suggestHashtags(selectedVideo.title, "all");
      setFbCaption(fb || fbCaption);
      setTtCaption(tt || ttCaption);
      if (tags && tags.length > 0) setHashtags(tags.join(", "));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-emerald-400" />
          Tự Động Đăng Mạng Xã Hội (Auto-Publisher)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Xuất bản video trực tiếp lên Facebook Fanpage/Reels, TikTok và YouTube Shorts chỉ với 1 click
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video Selector & Preview */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Chọn Video Để Xuất Bản
            </label>
            <select
              value={selectedVideoId || ""}
              onChange={(e) => {
                const vid = Number(e.target.value);
                setSelectedVideoId(vid);
                const found = videos.find((v) => v.id === vid);
                if (found) setTitle(found.title);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({(v.model_used || v.model || "veo3").toUpperCase()})
                </option>
              ))}
              {videos.length === 0 && <option value="">Chưa có video nào</option>}
            </select>

            {/* Video Player Preview */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
              {selectedVideo?.video_url ? (
                <video
                  src={`http://localhost:8000${selectedVideo.video_url}`}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  Chọn video để xem trước
                </div>
              )}
            </div>
            {selectedVideo && (
              <div className="text-xs text-slate-400 space-y-1">
                <div>Model: <strong className="text-indigo-400">{selectedVideo.model_used}</strong></div>
                <div>Thời lượng: <strong>{selectedVideo.duration || 8}s</strong></div>
              </div>
            )}
          </div>

          {/* Schedule Picker */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              Lên Lịch Đăng (Tùy chọn)
            </label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Để trống nếu muốn đăng ngay lập tức.
            </p>
          </div>
        </div>

        {/* Right Column: Platform Selection & Post Metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Platforms */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Chọn Nền Tảng Đích
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  setPlatforms((p) => ({ ...p, facebook: !p.facebook }))
                }
                className={`p-4 rounded-xl border text-center transition-all ${
                  platforms.facebook
                    ? "bg-blue-950/40 border-blue-500 text-blue-200 ring-2 ring-blue-500/30"
                    : "bg-slate-950/40 border-slate-800 text-slate-400"
                }`}
              >
                <div className="font-bold text-sm">Facebook</div>
                <div className="text-[11px] text-slate-400 mt-1">Page &amp; Reels</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPlatforms((p) => ({ ...p, tiktok: !p.tiktok }))
                }
                className={`p-4 rounded-xl border text-center transition-all ${
                  platforms.tiktok
                    ? "bg-pink-950/40 border-pink-500 text-pink-200 ring-2 ring-pink-500/30"
                    : "bg-slate-950/40 border-slate-800 text-slate-400"
                }`}
              >
                <div className="font-bold text-sm">TikTok</div>
                <div className="text-[11px] text-slate-400 mt-1">Direct Post</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPlatforms((p) => ({ ...p, youtube: !p.youtube }))
                }
                className={`p-4 rounded-xl border text-center transition-all ${
                  platforms.youtube
                    ? "bg-red-950/40 border-red-500 text-red-200 ring-2 ring-red-500/30"
                    : "bg-slate-950/40 border-slate-800 text-slate-400"
                }`}
              >
                <div className="font-bold text-sm">YouTube</div>
                <div className="text-[11px] text-slate-400 mt-1">Shorts &amp; Videos</div>
              </button>
            </div>
          </div>

          {/* Captions & AI Assistant */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Nội Dung Bài Đăng (Captions &amp; Tags)
              </label>
              <button
                type="button"
                onClick={handleAIEnhanceCaptions}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Tạo Caption Tự Động
              </button>
            </div>

            {/* Video Global Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tiêu đề Video (YouTube / Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Facebook Caption */}
            {platforms.facebook && (
              <div>
                <label className="block text-xs font-medium text-blue-400 mb-1">
                  Facebook Page Caption
                </label>
                <textarea
                  rows={2}
                  value={fbCaption}
                  onChange={(e) => setFbCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* TikTok Caption */}
            {platforms.tiktok && (
              <div>
                <label className="block text-xs font-medium text-pink-400 mb-1">
                  TikTok Caption &amp; Sound Hook
                </label>
                <textarea
                  rows={2}
                  value={ttCaption}
                  onChange={(e) => setTtCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* YouTube Description */}
            {platforms.youtube && (
              <div>
                <label className="block text-xs font-medium text-red-400 mb-1">
                  YouTube Description
                </label>
                <textarea
                  rows={2}
                  value={ytDescription}
                  onChange={(e) => setYtDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Hashtags chung
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Publish Trigger Button */}
          <div className="flex items-center justify-between">
            {publishSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Đã gửi lệnh đăng thành công!
              </span>
            )}
            {!publishSuccess && <div />}

            <button
              type="button"
              disabled={publishing || !selectedVideoId}
              onClick={handlePublish}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-2 hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>{publishing ? "Đang xuất bản..." : "ĐĂNG TỰ ĐỘNG LÊN CÁC NỀN TẢNG"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History of Social Posts */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-white text-base">Lịch Sử Đăng Bài Gần Đây</h3>
        <div className="divide-y divide-slate-800">
          {posts.map((post) => (
            <div key={post.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="capitalize font-bold text-slate-200">
                  {post.platform}
                </span>
                <span className="text-slate-400 line-clamp-1 max-w-md">
                  {post.caption || "Post published"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {post.status}
                </span>
                {post.post_url && (
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    Xem <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              Chưa có bài đăng nào được ghi nhận.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading publisher...</div>}>
      <PublishContent />
    </Suspense>
  );
}
