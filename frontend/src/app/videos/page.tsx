"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Share2,
  Trash2,
  Clock,
  Play,
  Filter,
  Search,
  ExternalLink,
} from "lucide-react";
import { getVideos, deleteVideo } from "@/lib/api";
import type { Video } from "@/lib/types";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const fetchVideos = async () => {
    try {
      const data = await getVideos();
      setVideos(data || []);
    } catch (e) {
      console.error("Error fetching videos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa video này?")) return;
    try {
      await deleteVideo(String(id));
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activeVideo?.id === id) setActiveVideo(null);
    } catch (e) {
      alert("Xóa thất bại!");
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const modelStr = v.model_used || v.model || "";
    const matchModel =
      selectedModel === "all" ||
      modelStr.toLowerCase().includes(selectedModel.toLowerCase());
    return matchSearch && matchModel;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-indigo-400" />
            Thư Viện Video (Gallery)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý, phát lại và đăng tải các video đã sinh từ Veo3, Wan 2.1, Seedance
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Tạo Video Mới
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm video theo tiêu đề hoặc prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tất cả Models</option>
          <option value="veo3">Google Veo 3</option>
          <option value="flow">Google Flow</option>
          <option value="wan">Alibaba Wan 2.1</option>
          <option value="seedance">ByteDance Seedance</option>
        </select>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden hover:border-slate-700 transition-all flex flex-col group"
          >
            {/* Player Preview */}
            <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
              {video.video_url ? (
                <video
                  src={`http://localhost:8000${video.video_url}`}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Film className="w-8 h-8 opacity-40" />
                  <span className="text-xs">No media rendered yet</span>
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold uppercase border border-white/10">
                {video.model_used || "Veo3"}
              </div>
            </div>

            {/* Video Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {video.prompt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.duration || 8}s • {video.resolution || "720p"}
                </span>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/publish?videoId=${video.id}`}
                    className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                    title="Đăng mạng xã hội"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                    title="Xóa video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredVideos.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Chưa tìm thấy video nào</h3>
            <p className="text-xs text-slate-400 mt-1">
              Hãy tạo video đầu tiên của bạn bằng studio!
            </p>
            <Link
              href="/create"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tạo Video Ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
