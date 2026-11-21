// ============================================================
// TypeScript interfaces for the Video Generation Tool
// ============================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived" | "completed";
  video_count: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  prompt: string;
  model: "veo3" | "google_flow";
  status: "queued" | "processing" | "generating" | "completed" | "failed";
  resolution: "720p" | "1080p" | "4k";
  duration: number;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  thumbnail_url?: string;
  video_url?: string;
  file_size?: number;
  project_id?: string;
  project_name?: string;
  progress?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  video_id: string;
  video_title: string;
  platform: "facebook" | "tiktok" | "youtube";
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  caption?: string;
  title?: string;
  description?: string;
  tags?: string[];
  hashtags?: string[];
  category?: string;
  privacy?: "public" | "private" | "unlisted" | "friends";
  scheduled_at?: string;
  published_at?: string;
  post_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "script" | "prompt" | "agent";
  system_prompt?: string;
  user_prompt: string;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "select";
  default_value?: string;
  options?: string[];
  description?: string;
}

export interface Settings {
  google_ai: {
    api_key: string;
    connected: boolean;
  };
  facebook: {
    access_token: string;
    page_id: string;
    connected: boolean;
  };
  tiktok: {
    access_token: string;
    connected: boolean;
  };
  youtube: {
    api_key: string;
    client_id: string;
    client_secret: string;
    refresh_token: string;
    connected: boolean;
  };
}

export interface GenerateVideoRequest {
  prompt: string;
  model: "veo3" | "google_flow";
  resolution: "720p" | "1080p" | "4k";
  duration: number;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  project_id?: string;
  template_id?: string;
  variables?: Record<string, string>;
}

export interface PublishRequest {
  video_id: string;
  platforms: PlatformConfig[];
  scheduled_at?: string;
}

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
