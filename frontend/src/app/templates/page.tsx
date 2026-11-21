"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { getTemplates, createTemplate, deleteTemplate } from "@/lib/api";
import type { PromptTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"agent" | "prompt" | "script">("agent");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New template form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"agent" | "prompt" | "script">("agent");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate({
        name,
        category,
        description,
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        is_active: true,
      });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setSystemPrompt("");
      setUserPromptTemplate("");
      loadTemplates();
    } catch (e) {
      alert("Lỗi khi tạo template");
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Bạn có chắc muốn xóa template này?")) return;
    try {
      await deleteTemplate(String(id));
      setTemplates((p) => p.filter((t) => t.id !== id));
    } catch (e) {
      alert("Lỗi khi xóa template");
    }
  };

  const filtered = templates.filter((t) => t.category === activeTab);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            AI Agents, Skills &amp; Prompt Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý các Agent nhân vật, kịch bản mẫu và kỹ năng xác nhận trước khi render video
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo Template Mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("agent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "agent"
              ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bot className="w-4 h-4" /> AI Agents ({templates.filter((t) => t.category === "agent").length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prompt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "prompt"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Prompts &amp; Styles ({templates.filter((t) => t.category === "prompt").length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("script")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "script"
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" /> Scripts &amp; Hooks ({templates.filter((t) => t.category === "script").length})
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">{item.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-400">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{item.description}</p>

              {item.system_prompt && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-purple-300 font-mono mb-2 line-clamp-3">
                  <strong>System Persona:</strong> {item.system_prompt}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 font-mono line-clamp-3">
                <strong>Prompt Template:</strong> {item.user_prompt_template}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            Chưa có template nào trong mục này. Bấm &quot;Tạo Template Mới&quot; để thêm.
          </div>
        )}
      </div>

      {/* Modal create template */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Thêm Template Mới</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tên Template</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phân loại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="agent">AI Agent Persona</option>
                  <option value="prompt">Prompt Style</option>
                  <option value="script">Script Hook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {category === "agent" && (
                <div>
                  <label className="block text-xs font-medium text-purple-400 mb-1">System Prompt (Persona)</label>
                  <textarea
                    rows={2}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">User Prompt Template (Hỗ trợ {"{{topic}}"})</label>
                <textarea
                  rows={3}
                  required
                  value={userPromptTemplate}
                  onChange={(e) => setUserPromptTemplate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                >
                  Lưu Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
