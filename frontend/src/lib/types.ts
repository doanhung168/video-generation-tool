// ============================================================
// TypeScript interfaces for the Video Generation Tool
// ============================================================

export type VideoModel = "veo3" | "flow" | "wan2.1" | "seedance" | "gemini" | "kimi" | "kling" | "minimax" | "google_flow";

export interface Project {
  id: number | string;
  name: string;
  description?: string;
  status: "draft" | "active" | "completed" | "archived";
  video_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number | string;
  title: string;
  description?: string;
  prompt: string;
  model_used?: VideoModel;
  model?: VideoModel;
  status: "pending" | "generating" | "completed" | "failed" | "processing" | "queued";
  resolution?: string;
  duration?: number;
  aspect_ratio?: string;
  thumbnail_url?: string;
  video_url?: string;
  file_size?: number;
  progress?: number;
  project_id?: number | string;
  project_name?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: number | string;
  video_id: number | string;
  video_title?: string;
  platform: "facebook" | "tiktok" | "youtube";
  status: "pending" | "publishing" | "published" | "failed" | "draft" | "scheduled";
  caption?: string;
  title?: string;
  description?: string;
  tags?: string[];
  hashtags?: string | string[];
  category?: string;
  privacy?: "public" | "private" | "unlisted" | "friends";
  post_url?: string;
  post_id_external?: string;
  scheduled_at?: string;
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "select";
  default_value?: string;
  options?: string[];
  description?: string;
}

export interface PromptTemplate {
  id: number | string;
  name: string;
  description?: string;
  category: "script" | "prompt" | "agent";
  system_prompt?: string;
  user_prompt_template?: string;
  user_prompt?: string;
  variables?: any;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SceneItem {
  scene_num: number;
  duration_seconds: number;
  visual_prompt: string;
  camera_angle?: string;
  lighting?: string;
  voiceover?: string;
}

export interface ConfirmedPlan {
  title: string;
  agent_profile: string;
  confirmed_skills: string[];
  scenes: SceneItem[];
  master_video_prompt: string;
  social_captions: {
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  hashtags: string[];
}

export interface Settings {
  google_ai?: { api_key: string; connected: boolean };
  facebook?: { access_token: string; page_id: string; connected: boolean };
  tiktok?: { access_token: string; connected: boolean };
  youtube?: { api_key: string; client_id: string; client_secret: string; refresh_token: string; connected: boolean };
  google_api_key?: string;
  kimi_api_key?: string;
  wan_api_key?: string;
  seedance_api_key?: string;
  kling_api_key?: string;
  minimax_api_key?: string;
  facebook_access_token?: string;
  facebook_page_id?: string;
  tiktok_access_token?: string;
  youtube_api_key?: string;
  youtube_refresh_token?: string;
  youtube_client_id?: string;
  youtube_client_secret?: string;
  storage_path?: string;
}

export type SettingsData = Settings;

export interface ConnectionTestResult {
  platform: string;
  connected: boolean;
  message?: string;
  details?: Record<string, any>;
  error?: string;
}

export interface GenerateVideoRequest {
  prompt: string;
  title?: string;
  model: string;
  resolution?: string;
  duration?: number;
  aspect_ratio?: string;
  style?: string;
  project_id?: number | string;
  template_id?: number | string;
  variables?: Record<string, string>;
  enhance_prompt?: boolean;
  confirmed_agent?: string;
  confirmed_skills?: string[];
}

export type GenerateVideoPayload = GenerateVideoRequest;

export interface PlatformConfig {
  platform: "facebook" | "tiktok" | "youtube";
  caption?: string;
  title?: string;
  description?: string;
  tags?: string[];
  hashtags?: string[];
  category?: string;
  privacy?: "public" | "private" | "unlisted" | "friends";
}

export interface PublishRequest {
  video_id: string | number;
  platforms: PlatformConfig[] | any[];
  scheduled_at?: string;
}

export interface DashboardStats {
  total_videos: number;
  published_posts: number;
  active_projects: number;
  ai_credits_used: number;
}

export interface ActivityItem {
  id: string;
  type: "video_created" | "video_completed" | "post_published" | "project_created" | "video_failed";
  message: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
