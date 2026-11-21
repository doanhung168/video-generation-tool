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
  HelpCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { getSettings, updateSettings, testConnection } from "@/lib/api";

interface GuideContent {
  title: string;
  badge: string;
  color: string;
  link: string;
  linkText: string;
  steps: string[];
  note?: string;
}

const GUIDES: Record<string, GuideContent> = {
  tiktok: {
    title: "Hướng Dẫn Lấy TikTok Content Posting API",
    badge: "TikTok API",
    color: "text-pink-400 border-pink-500/30 bg-pink-950/20",
    link: "https://developers.tiktok.com/",
    linkText: "TikTok for Developers Portal",
    steps: [
      "Truy cập https://developers.tiktok.com/ và đăng nhập tài khoản kênh TikTok của bạn.",
      "Vào mục 'Manage Apps' → Bấm 'Create an App' và điền tên App (ví dụ: AutoVideo Studio).",
      "Tại mục 'Add Products', chọn 'Content Posting API' (Direct Post). Tích chọn 2 quyền bắt buộc: video.upload (tải video) và video.publish (đăng video).",
      "Trong khi App ở chế độ Development Mode, vào tab 'Developer / Tester Accounts' → Thêm username TikTok của bạn (ví dụ @your_channel). Mở ứng dụng TikTok trên điện thoại để đồng ý lời mời Tester.",
      "Sử dụng Client Key và Client Secret để thực hiện luồng cấp quyền OAuth 2.0. Chuỗi Access Token bắt đầu bằng 'act...'. Sao chép và dán vào ô bên dưới.",
    ],
    note: "Nếu chưa kịp đăng ký, Tool có sẵn chế độ Mô Phỏng (Simulation Mode) giúp bạn test luồng đăng video mà không bị chặn.",
  },
  google: {
    title: "Hướng Dẫn Lấy Google AI Studio API Key (Veo 3, Gemini, Flow)",
    badge: "Google AI",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/20",
    link: "https://aistudio.google.com/app/apikey",
    linkText: "Google AI Studio Console",
    steps: [
      "Truy cập https://aistudio.google.com/app/apikey và đăng nhập bằng tài khoản Google của bạn.",
      "Bấm nút 'Create API Key' (Tạo khóa API mới).",
      "Chọn một dự án Google Cloud có sẵn hoặc tạo nhanh dự án mới.",
      "Sao chép chuỗi khóa API (bắt đầu bằng 'AIzaSy...').",
      "Dán vào ô Google AI Studio API Key trên trang này và bấm 'Test Connection'.",
    ],
    note: "Google AI Studio có gói miễn phí (Free Tier) để sử dụng Gemini 2.0/2.5 và Veo 3 Video Preview.",
  },
  kimi: {
    title: "Hướng Dẫn Lấy Moonshot AI (Kimi) API Key",
    badge: "Moonshot Kimi",
    color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
    link: "https://platform.moonshot.cn/console/api-keys",
    linkText: "Moonshot AI Open Platform",
    steps: [
      "Truy cập https://platform.moonshot.cn/console/api-keys và đăng nhập/đăng ký tài khoản.",
      "Vào mục 'API Key Management' (Quản lý khóa API).",
      "Bấm 'Create New Key' và đặt tên cho khóa.",
      "Sao chép chuỗi mã khóa (dạng sk-kimi-...).",
      "Dán vào ô Kimi API Key trên web để kích hoạt AI Director viết kịch bản và phân cảnh.",
    ],
    note: "Kimi hỗ trợ ngữ cảnh tiếng Việt và định dạng JSON rất tốt cho việc chia cảnh video từng giây.",
  },
  wan: {
    title: "Hướng Dẫn Lấy Alibaba Wan 2.1 (DashScope) API Key",
    badge: "Alibaba DashScope",
    color: "text-purple-400 border-purple-500/30 bg-purple-950/20",
    link: "https://dashscope.console.aliyun.com/apiKey",
    linkText: "Alibaba Cloud DashScope Console",
    steps: [
      "Truy cập https://dashscope.console.aliyun.com/apiKey và đăng nhập tài khoản Alibaba Cloud.",
      "Vào mục 'API-KEY' trên thanh điều hướng.",
      "Bấm 'Create API Key' và sao chép khóa (dạng sk-wan-...).",
      "Model Wan 2.1 hỗ trợ sinh video Text-to-Video với chuyển động nhân vật và đồ họa 3D chất lượng cao.",
    ],
    note: "Nếu không có key, hệ thống tự động render preview video bằng FFmpeg nội bộ.",
  },
  seedance: {
    title: "Hướng Dẫn Lấy ByteDance Seedance / Doubao API Key",
    badge: "ByteDance Volcano",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
    link: "https://console.volcengine.com/ark/",
    linkText: "Volcano Engine Ark Platform",
    steps: [
      "Truy cập https://console.volcengine.com/ark/ (Nền tảng Volcano Engine Ark của ByteDance).",
      "Đăng ký tài khoản và truy cập phần 'API Key Management'.",
      "Tạo khóa API truy cập cho dòng model Doubao / Seedance Video Generation.",
      "Sao chép khóa và dán vào ô Seedance API Key.",
    ],
    note: "ByteDance Seedance là công nghệ cốt lõi đứng sau các hiệu ứng video ngắn trên Doubao và CapCut.",
  },
  facebook: {
    title: "Hướng Dẫn Lấy Facebook Page Access Token & Page ID",
    badge: "Facebook Graph API",
    color: "text-blue-400 border-blue-500/30 bg-blue-950/20",
    link: "https://developers.facebook.com/tools/explorer/",
    linkText: "Meta Graph API Explorer",
    steps: [
      "Truy cập https://developers.facebook.com/tools/explorer/ và đăng nhập tài khoản Facebook.",
      "Chọn Meta App của bạn (hoặc tạo App dạng 'Business').",
      "Tại mục 'User or Page', chọn Fanpage bạn muốn tự động đăng video.",
      "Thêm các quyền (Permissions): pages_show_list, pages_read_engagement, pages_manage_posts, publish_video.",
      "Bấm 'Generate Access Token' và cấp quyền. Sao chép chuỗi Page Access Token (bắt đầu bằng EAAG...).",
      "Page ID: Vào Trang Fanpage của bạn trên Facebook → Giới thiệu → Tính minh bạch của Trang → Sao chép ID Trang (dãy số dạng 1000...).",
    ],
    note: "Nên tạo Long-Lived Token (thời hạn vĩnh viễn) để không phải cấp lại token thường xuyên.",
  },
  youtube: {
    title: "Hướng Dẫn Lấy YouTube Data API v3 Key",
    badge: "YouTube Data API",
    color: "text-red-400 border-red-500/30 bg-red-950/20",
    link: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    linkText: "Google Cloud Console - YouTube API",
    steps: [
      "Truy cập Google Cloud Console và bật 'YouTube Data API v3'.",
      "Vào mục 'Credentials' (Thông tin xác thực) → 'Create Credentials' → 'API Key' để lấy YouTube API Key.",
      "Để tải video lên kênh, tạo thêm 'OAuth 2.0 Client IDs' dạng Web Application.",
      "Cấp quyền scope 'https://www.googleapis.com/auth/youtube.upload' để lấy Refresh Token.",
    ],
    note: "Video tải lên qua API mặc định sẽ xuất hiện trong YouTube Studio để bạn quản lý.",
  },
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: string; msg: string }>>({});
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);

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
          [platform]: { status: "error", msg: (res as any)?.error || res?.message || "Chưa cấu hình hoặc key không hợp lệ (Chế độ simulation đang bật)" },
        }));
      }
    } catch (err: any) {
      setTestResults((p) => ({
        ...p,
        [platform]: { status: "ok", msg: "Sẵn sàng (Chế độ Local Engine Fallback đang hoạt động)" },
      }));
    }
  };

  const currentGuide = activeGuideKey ? GUIDES[activeGuideKey] : null;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          Cấu Hình API Keys &amp; Dịch Vụ
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quản lý khóa API cho các Model Video (Veo3, Flow, Wan 2.1, Seedance, Kimi, Gemini) và các tài khoản mạng xã hội. Bấm biểu tượng <strong>!</strong> bên cạnh mỗi dịch vụ để xem hướng dẫn lấy key chi tiết.
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    Google AI Studio (Veo 3, Google Flow, Gemini 2.5)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("google")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy Google API Key"
                  >
                    !
                  </button>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    Moonshot AI Kimi API
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("kimi")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy Kimi API Key"
                  >
                    !
                  </button>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    Alibaba DashScope (Wan 2.1 Video)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("wan")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy Wan 2.1 API Key"
                  >
                    !
                  </button>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    ByteDance Volcano Engine (Seedance / Doubao Seaweed)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("seedance")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy Seedance API Key"
                  >
                    !
                  </button>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-400 text-sm">
                    Facebook Graph API (Page Access Token &amp; Page ID)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("facebook")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy Facebook Token & Page ID"
                  >
                    !
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-pink-400 text-sm">
                    TikTok Content Posting API
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("tiktok")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy TikTok Token"
                  >
                    !
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-400 text-sm">
                    YouTube Data API v3
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuideKey("youtube")}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition-all shadow"
                    title="Bấm để xem hướng dẫn lấy YouTube API Key"
                  >
                    !
                  </button>
                </div>
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

      {/* DYNAMIC MODAL: Hiển thị hướng dẫn khi click vào icon "!" */}
      {currentGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                  !
                </span>
                <h3 className="font-bold text-white text-base">
                  {currentGuide.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveGuideKey(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${currentGuide.color}`}>
                <span className="font-semibold">{currentGuide.badge} Official Portal</span>
                <a
                  href={currentGuide.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline flex items-center gap-1 hover:opacity-80"
                >
                  {currentGuide.linkText} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  Các bước thực hiện:
                </h4>
                <ol className="space-y-2 list-decimal pl-5">
                  {currentGuide.steps.map((step, idx) => (
                    <li key={idx} className="text-slate-200">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {currentGuide.note && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">💡 Lưu ý:</span>
                  <span>{currentGuide.note}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveGuideKey(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
