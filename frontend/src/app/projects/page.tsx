"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Trash2,
  Video,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getProjects, createProject, deleteProject } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject({ name, description });
      setName("");
      setDescription("");
      setShowModal(false);
      loadProjects();
    } catch (e) {
      alert("Lỗi khi tạo project");
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này?")) return;
    try {
      await deleteProject(String(id));
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert("Lỗi khi xóa project");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-purple-400" />
            Dự Án Video (Projects)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gom nhóm các video chiến dịch, quản lý tài nguyên và chiến lược xuất bản
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo Dự Án Mới
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-base">{proj.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {proj.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {proj.description || "Không có mô tả chi tiết."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <Link
                href={`/videos?projectId=${proj.id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Video className="w-3.5 h-3.5" /> Xem Videos
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(proj.id)}
                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            Chưa có dự án nào. Bấm &quot;Tạo Dự Án Mới&quot; để bắt đầu gom nhóm video.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Tạo Dự Án Mới</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tên Dự Án</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chiến dịch TikTok Q4..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mục tiêu hoặc kế hoạch..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
