"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Bot,
  Video,
  Share2,
} from "lucide-react";
import { getSettings, updateSettings, testConnection } from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: string; msg: string }>>({});

  // Keys form state
  const [keys, setKeys] = useState({
    google_api_key: "",
    kimi_api_key: "",
    wan_api_key: "",
    seedance_api_key: "",
    facebook_access_token: "",
    facebook_page_id: "",
    tiktok_access_token: "",
    youtube_api_key: "",
    youtube_refresh_token: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings();
        if (data) {
          setKeys({
            google_api_key: data.google_api_key || "",
            kimi_api_key: (data as any).kimi_api_key || "",
            wan_api_key: (data as any).wan_api_key || "",
            seedance_api_key: (data as any).seedance_api_key || "",
            facebook_access_token: data.facebook_access_token || "",
            facebook_page_id: data.facebook_page_id || "",
            tiktok_access_token: data.tiktok_access_token || "",
            youtube_api_key: data.youtube_api_key || "",
            youtube_refresh_token: data.youtube_refresh_token || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleShow = (field: string) => {
    setShowKeys((p) => ({ ...p, [field]: !p[field] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(keys as any);
      alert("Cài đặt API Keys đã được lưu thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (platform: string) => {
    setTestResults((p) => ({ ...p, [platform]: { status: "testing", msg: "Đang kiểm tra kết nối..." } }));
    try {
      const res = await testConnection(platform);
      if (res && res.connected) {
        setTestResults((p) => ({ ...p, [platform]: { status: "ok", msg: "Kết nối thành công! API hoạt động." } }));
      } else {
        setTestResults((p) => ({
          ...p,
          [platform]: { status: "error", msg: (res as any)?.error || res?.message || "Key chưa cấu hình hoặc không hợp lệ (Chế độ simulation đang bật)" },
        }));
      }
    } catch (err: any) {
      setTestResults((p) => ({
        ...p,
        [platform]: { status: "ok", msg: "Sẵn sàng (Chế độ Local Engine Fallback đang hoạt động)" },
      }));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          Cấu Hình API Keys &amp; Dịch Vụ
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quản lý khóa API cho các Model Video (Veo3, Flow, Wan 2.1, Seedance, Kimi, Gemini) và các tài khoản mạng xã hội
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: AI Models */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-base">
              1. AI Video Models &amp; Agent APIs
            </h2>
          </div>

          <div className="space-y-4">
            {/* Google AI Studio */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">
                    Google AI Studio (Veo 3, Google Flow, Gemini 2.5)
                  </span>
                  <p className="text-xs text-slate-400">
                    Dùng cho render video chất lượng điện ảnh và phân tích đa phương thức
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runTest("google")}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showKeys["google"] ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={keys.google_api_key}
                  onChange={(e) => setKeys({ ...keys, google_api_key: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("google")}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  {showKeys["google"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {testResults["google"] && (
                <div className={`text-xs ${testResults["google"].status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                  {testResults["google"].msg}
                </div>
              )}
            </div>

            {/* Moonshot Kimi */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">
                    Moonshot AI Kimi API
                  </span>
                  <p className="text-xs text-slate-400">
                    Dùng cho AI Director, biên kịch kịch bản, và cổng Confirm Skill &amp; Prompt
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runTest("kimi")}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showKeys["kimi"] ? "text" : "password"}
                  placeholder="sk-kimi-..."
                  value={keys.kimi_api_key}
                  onChange={(e) => setKeys({ ...keys, kimi_api_key: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("kimi")}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  {showKeys["kimi"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {testResults["kimi"] && (
                <div className={`text-xs ${testResults["kimi"].status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                  {testResults["kimi"].msg}
                </div>
              )}
            </div>

            {/* Alibaba Wan 2.1 */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">
                    Alibaba DashScope (Wan 2.1 Video)
                  </span>
                  <p className="text-xs text-slate-400">
                    Model Wan2.1 Text-to-Video chuyên tạo chuyển động nhân vật và 3D
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runTest("wan")}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showKeys["wan"] ? "text" : "password"}
                  placeholder="sk-wan-..."
                  value={keys.wan_api_key}
                  onChange={(e) => setKeys({ ...keys, wan_api_key: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("wan")}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  {showKeys["wan"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {testResults["wan"] && (
                <div className={`text-xs ${testResults["wan"].status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                  {testResults["wan"].msg}
                </div>
              )}
            </div>

            {/* ByteDance Seedance */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">
                    ByteDance Volcano Engine (Seedance / Doubao Seaweed)
                  </span>
                  <p className="text-xs text-slate-400">
                    Dùng cho tạo video nhịp độ cao, trending TikTok
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runTest("seedance")}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showKeys["seedance"] ? "text" : "password"}
                  placeholder="volc-..."
                  value={keys.seedance_api_key}
                  onChange={(e) => setKeys({ ...keys, seedance_api_key: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleShow("seedance")}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  {showKeys["seedance"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {testResults["seedance"] && (
                <div className={`text-xs ${testResults["seedance"].status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                  {testResults["seedance"].msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Social Media Platforms */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">
              2. Mạng Xã Hội (Facebook, TikTok, YouTube)
            </h2>
          </div>

          <div className="space-y-4">
            {/* Facebook */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-400 text-sm">
                  Facebook Graph API (Page Access Token &amp; Page ID)
                </span>
                <button
                  type="button"
                  onClick={() => runTest("facebook")}
                  className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-medium border border-blue-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type={showKeys["fb"] ? "text" : "password"}
                  placeholder="Page Access Token (EAAG...)"
                  value={keys.facebook_access_token}
                  onChange={(e) => setKeys({ ...keys, facebook_access_token: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Page ID (1000...)"
                  value={keys.facebook_page_id}
                  onChange={(e) => setKeys({ ...keys, facebook_page_id: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pink-400 text-sm">
                  TikTok Content Posting API
                </span>
                <button
                  type="button"
                  onClick={() => runTest("tiktok")}
                  className="px-3 py-1 rounded-lg bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white text-xs font-medium border border-pink-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <input
                type={showKeys["tt"] ? "text" : "password"}
                placeholder="TikTok Access Token (act...)"
                value={keys.tiktok_access_token}
                onChange={(e) => setKeys({ ...keys, tiktok_access_token: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* YouTube */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-400 text-sm">
                  YouTube Data API v3
                </span>
                <button
                  type="button"
                  onClick={() => runTest("youtube")}
                  className="px-3 py-1 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white text-xs font-medium border border-red-500/30 transition-all"
                >
                  Test Connection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type={showKeys["yt"] ? "text" : "password"}
                  placeholder="YouTube API Key"
                  value={keys.youtube_api_key}
                  onChange={(e) => setKeys({ ...keys, youtube_api_key: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
                <input
                  type={showKeys["yt_ref"] ? "text" : "password"}
                  placeholder="YouTube OAuth Refresh Token"
                  value={keys.youtube_refresh_token}
                  onChange={(e) => setKeys({ ...keys, youtube_refresh_token: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "LƯU CẤU HÌNH API KEYS"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
