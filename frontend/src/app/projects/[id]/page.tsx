"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ArrowLeft, Video, Film, Plus } from "lucide-react";
import { getProject, getProjectVideos } from "@/lib/api";
import type { Project, Video as VideoType } from "@/lib/types";

function ProjectDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (id) {
          const prj = await getProject(id);
          const vids = await getProjectVideos(id);
          if (prj) setProject(prj);
          if (vids) setVideos(vids);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách dự án
      </Link>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-purple-400" />
            {project?.name || `Dự án #${id}`}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {project?.description || "Quản lý các video thuộc dự án này"}
          </p>
        </div>

        <Link
          href={`/create?projectId=${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Tạo Video Trong Dự Án
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Videos trong dự án ({videos.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div
              key={v.id}
              className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3"
            >
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {v.video_url ? (
                  <video src={`http://localhost:8000${v.video_url}`} controls className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <h3 className="font-semibold text-white text-xs line-clamp-1">{v.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">{v.prompt}</p>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Chưa có video nào trong dự án này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading project details...</div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}
