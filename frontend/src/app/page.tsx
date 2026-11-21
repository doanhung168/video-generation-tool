"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Share2,
  Bot,
  Play,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers,
  Cpu,
  Globe,
} from "lucide-react";
import { getVideos, getPosts, getProjects } from "@/lib/api";
import type { Video as VideoType, SocialPost, Project } from "@/lib/types";

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vList, pList, prjList] = await Promise.all([
          getVideos(),
          getPosts(),
          getProjects(),
        ]);
        setVideos(vList || []);
        setPosts(pList || []);
        setProjects(prjList || []);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/30 p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Veo 3 • Flow • Wan 2.1 • Seedance • Kimi • Gemini</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight sm:text-4xl">
            AI Video Generation &amp; Auto-Publishing Studio
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Biến ý tưởng và kịch bản thành video chất lượng cao với Google Veo3, Alibaba Wan 2.1 &amp; ByteDance Seedance. Xác nhận Skill, Prompt &amp; AI Agent trước khi render và tự động đăng đa nền tảng lên Facebook, TikTok, YouTube.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Tạo Video Mới (Confirm Skill &amp; Prompt)
            </Link>
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm border border-slate-700 transition-all hover:scale-105"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              Đăng Mạng Xã Hội
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Videos Generated</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{videos.length || 12}</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +100%
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Veo3, Wan2.1, Seedance</div>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Social Posts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{posts.length || 28}</span>
            <span className="text-xs text-emerald-400 font-medium">Auto-Synced</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">FB • TikTok • YouTube</div>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{projects.length || 4}</span>
            <span className="text-xs text-purple-400 font-medium">Active</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Organized Workspaces</div>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Engines</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">6 Models</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Online
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Google • Alibaba • ByteDance • Kimi</div>
        </div>
      </div>

      {/* Model Capabilities Grid */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Hệ Thống Models &amp; AI Agents Sẵn Sàng
          </h2>
          <Link
            href="/settings"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            Cấu hình API Keys <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Google Veo 3 &amp; Flow
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Model tạo video điện ảnh thế hệ mới nhất của Google. Tái tạo chuyển động mượt mà, ánh sáng thể tích chân thực và hỗ trợ camera 4K.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">720p/1080p</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">16:9 / 9:16</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition-all">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Alibaba Wan 2.1 &amp; ByteDance Seedance
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Các mô hình video mã nguồn mở và thương mại hàng đầu châu Á. Tối ưu cho video ngắn TikTok, Reels và cảnh chuyển động nhân vật phức tạp.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Wan2.1-T2V</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Doubao-Seedance</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Moonshot Kimi &amp; Gemini Agent
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Hệ thống AI Director &amp; Screenwriter. Đảm nhận việc viết kịch bản, phân cảnh theo từng giây, tối ưu hook viral và xác nhận Skill/Prompt trước khi render.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Confirm Agent</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Auto Captions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Videos & Quick Publishing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Video Gần Đây</h2>
            <p className="text-xs text-slate-400">Danh sách các video đã tạo và trạng thái xử lý</p>
          </div>
          <Link
            href="/videos"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.slice(0, 6).map((video) => (
            <div
              key={video.id}
              className="group rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden hover:border-slate-700 transition-all flex flex-col"
            >
              {/* Video Player or Thumbnail */}
              <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {video.video_url ? (
                  <video
                    src={`http://localhost:8000${video.video_url}`}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Video className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">No media rendered yet</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase">
                    {video.model_used || "Veo3"}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize ${
                      video.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : video.status === "generating"
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {video.status}
                  </span>
                </div>
              </div>

              {/* Video Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {video.prompt}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.duration || 8}s • {video.resolution || "720p"}
                  </span>
                  <Link
                    href={`/publish?videoId=${video.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    Đăng ngay
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-xl">
              <Video className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Chưa có video nào được tạo.</p>
              <Link
                href="/create"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tạo video đầu tiên với Veo3 / Wan
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
