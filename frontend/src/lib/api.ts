import axios from "axios";
import type {
  Project,
  Video,
  SocialPost,
  PromptTemplate,
  Settings,
  GenerateVideoRequest,
  PublishRequest,
  DashboardStats,
  ActivityItem,
  ApiResponse,
  PaginatedResponse,
} from "./types";

// ============================================================
// Axios instance
// ============================================================
const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    console.error("[API Error]", message);
    return Promise.reject(error);
  }
);

// ============================================================
// Mock / sample data (used when API is unreachable)
// ============================================================
export const MOCK_STATS: DashboardStats = {
  total_videos: 48,
  published_posts: 127,
  active_projects: 6,
  ai_credits_used: 2340,
};

export const MOCK_VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Product Launch Teaser",
    prompt: "A cinematic product launch video with dynamic camera movements showcasing a sleek smartphone on a dark surface with dramatic lighting",
    model: "veo3",
    status: "completed",
    resolution: "1080p",
    duration: 15,
    aspect_ratio: "16:9",
    thumbnail_url: "",
    video_url: "",
    file_size: 25600000,
    project_id: "p1",
    project_name: "Q4 Marketing",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:35:00Z",
  },
  {
    id: "v2",
    title: "Ocean Sunset Cinematic",
    prompt: "Breathtaking aerial view of ocean waves crashing against rocky cliffs during golden hour sunset with cinematic color grading",
    model: "veo3",
    status: "completed",
    resolution: "4k",
    duration: 30,
    aspect_ratio: "16:9",
    thumbnail_url: "",
    video_url: "",
    file_size: 89000000,
    project_id: "p2",
    project_name: "Nature Series",
    created_at: "2025-01-14T08:20:00Z",
    updated_at: "2025-01-14T08:30:00Z",
  },
  {
    id: "v3",
    title: "TikTok Dance Promo",
    prompt: "Energetic vertical video of a stylized dancer with neon particle effects and fast-paced transitions",
    model: "google_flow",
    status: "processing",
    resolution: "1080p",
    duration: 15,
    aspect_ratio: "9:16",
    progress: 65,
    project_id: "p3",
    project_name: "Social Content",
    created_at: "2025-01-15T14:00:00Z",
    updated_at: "2025-01-15T14:05:00Z",
  },
  {
    id: "v4",
    title: "Coffee Brand Story",
    prompt: "Warm and inviting coffee shop scene with steam rising from a latte, shallow depth of field, morning light streaming through windows",
    model: "veo3",
    status: "completed",
    resolution: "1080p",
    duration: 10,
    aspect_ratio: "1:1",
    thumbnail_url: "",
    video_url: "",
    file_size: 15200000,
    project_id: "p1",
    project_name: "Q4 Marketing",
    created_at: "2025-01-13T16:45:00Z",
    updated_at: "2025-01-13T16:50:00Z",
  },
  {
    id: "v5",
    title: "Abstract Geometry Loop",
    prompt: "Mesmerizing abstract geometric shapes morphing and rotating in a dark space with iridescent reflections",
    model: "google_flow",
    status: "queued",
    resolution: "720p",
    duration: 5,
    aspect_ratio: "16:9",
    created_at: "2025-01-15T15:00:00Z",
    updated_at: "2025-01-15T15:00:00Z",
  },
  {
    id: "v6",
    title: "City Nightlife Montage",
    prompt: "Fast-paced urban nightlife montage with neon lights, rain-slicked streets, and cinematic transitions between scenes",
    model: "veo3",
    status: "failed",
    resolution: "1080p",
    duration: 30,
    aspect_ratio: "16:9",
    error_message: "Generation timed out after 10 minutes",
    created_at: "2025-01-12T22:10:00Z",
    updated_at: "2025-01-12T22:20:00Z",
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Q4 Marketing",
    description: "Marketing campaign videos for Q4 product launches and social media ads",
    status: "active",
    video_count: 12,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "p2",
    name: "Nature Series",
    description: "Collection of nature and landscape cinematic videos for YouTube channel",
    status: "active",
    video_count: 8,
    created_at: "2025-01-05T00:00:00Z",
    updated_at: "2025-01-14T08:00:00Z",
  },
  {
    id: "p3",
    name: "Social Content",
    description: "Short-form vertical videos for TikTok and Instagram Reels",
    status: "active",
    video_count: 24,
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-15T14:00:00Z",
  },
  {
    id: "p4",
    name: "Client: Acme Corp",
    description: "Video deliverables for Acme Corporation rebranding project",
    status: "completed",
    video_count: 6,
    created_at: "2024-12-01T00:00:00Z",
    updated_at: "2024-12-28T00:00:00Z",
  },
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: "sp1",
    video_id: "v1",
    video_title: "Product Launch Teaser",
    platform: "youtube",
    status: "published",
    title: "🚀 Introducing Our Latest Product! | Official Teaser",
    description: "Get ready for the future of tech! Our latest product launch teaser.",
    tags: ["product", "launch", "tech", "innovation"],
    privacy: "public",
    published_at: "2025-01-15T12:00:00Z",
    post_url: "https://youtube.com/watch?v=example1",
    created_at: "2025-01-15T11:50:00Z",
    updated_at: "2025-01-15T12:00:00Z",
  },
  {
    id: "sp2",
    video_id: "v1",
    video_title: "Product Launch Teaser",
    platform: "facebook",
    status: "published",
    caption: "🚀 Big things are coming! Check out our latest product teaser. #Innovation #Tech",
    privacy: "public",
    published_at: "2025-01-15T12:05:00Z",
    post_url: "https://facebook.com/post/example2",
    created_at: "2025-01-15T12:00:00Z",
    updated_at: "2025-01-15T12:05:00Z",
  },
  {
    id: "sp3",
    video_id: "v4",
    video_title: "Coffee Brand Story",
    platform: "tiktok",
    status: "scheduled",
    caption: "Morning vibes ☕ #coffee #morningroutine #aesthetic",
    hashtags: ["coffee", "morningroutine", "aesthetic", "fyp"],
    scheduled_at: "2025-01-16T08:00:00Z",
    created_at: "2025-01-15T16:00:00Z",
    updated_at: "2025-01-15T16:00:00Z",
  },
];

export const MOCK_TEMPLATES: PromptTemplate[] = [
  {
    id: "t1",
    name: "Product Showcase",
    description: "Create a cinematic product showcase video with dynamic lighting",
    category: "prompt",
    user_prompt: "A cinematic product showcase video of {{product_name}} with {{lighting_style}} lighting, {{camera_movement}} camera movements, on a {{background}} background. Style: {{style}}",
    variables: [
      { name: "product_name", type: "text", default_value: "smartphone", description: "The product to showcase" },
      { name: "lighting_style", type: "select", default_value: "dramatic", options: ["dramatic", "soft", "neon", "natural"], description: "Lighting mood" },
      { name: "camera_movement", type: "select", default_value: "orbiting", options: ["orbiting", "tracking", "static", "handheld"], description: "Camera movement style" },
      { name: "background", type: "select", default_value: "dark gradient", options: ["dark gradient", "white studio", "abstract", "natural"], description: "Background setting" },
      { name: "style", type: "select", default_value: "cinematic", options: ["cinematic", "minimal", "luxury", "tech"], description: "Overall visual style" },
    ],
    created_at: "2025-01-10T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "t2",
    name: "Social Media Hook",
    description: "Generate attention-grabbing social media video hooks",
    category: "script",
    user_prompt: "Write a {{duration}} second video script for {{platform}} about {{topic}}. The hook must grab attention in the first 2 seconds. Target audience: {{audience}}. Tone: {{tone}}.",
    variables: [
      { name: "duration", type: "select", default_value: "15", options: ["5", "15", "30", "60"], description: "Video duration in seconds" },
      { name: "platform", type: "select", default_value: "TikTok", options: ["TikTok", "Instagram", "YouTube Shorts", "Facebook"], description: "Target platform" },
      { name: "topic", type: "text", default_value: "", description: "Video topic" },
      { name: "audience", type: "text", default_value: "Gen Z", description: "Target audience" },
      { name: "tone", type: "select", default_value: "energetic", options: ["energetic", "calm", "humorous", "professional"], description: "Content tone" },
    ],
    created_at: "2025-01-08T00:00:00Z",
    updated_at: "2025-01-12T00:00:00Z",
  },
  {
    id: "t3",
    name: "AI Video Director",
    description: "AI agent that acts as a creative video director",
    category: "agent",
    system_prompt: "You are an experienced video director specializing in short-form content. You understand visual storytelling, pacing, and what makes content go viral. When given a topic or concept, you create detailed video prompts that specify camera angles, lighting, mood, pacing, and visual effects.",
    user_prompt: "Create a detailed video prompt for: {{concept}}. The video should be {{duration}} seconds long in {{aspect_ratio}} format. Target mood: {{mood}}.",
    variables: [
      { name: "concept", type: "text", default_value: "", description: "Video concept or idea" },
      { name: "duration", type: "select", default_value: "15", options: ["5", "10", "15", "30"], description: "Duration" },
      { name: "aspect_ratio", type: "select", default_value: "16:9", options: ["16:9", "9:16", "1:1"], description: "Aspect ratio" },
      { name: "mood", type: "select", default_value: "cinematic", options: ["cinematic", "energetic", "calm", "dark", "playful"], description: "Overall mood" },
    ],
    created_at: "2025-01-05T00:00:00Z",
    updated_at: "2025-01-11T00:00:00Z",
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "video_completed", message: "Video \"Product Launch Teaser\" generation completed", timestamp: "2025-01-15T10:35:00Z" },
  { id: "a2", type: "post_published", message: "Published \"Product Launch Teaser\" to YouTube", timestamp: "2025-01-15T12:00:00Z" },
  { id: "a3", type: "post_published", message: "Published \"Product Launch Teaser\" to Facebook", timestamp: "2025-01-15T12:05:00Z" },
  { id: "a4", type: "video_created", message: "Started generating \"TikTok Dance Promo\"", timestamp: "2025-01-15T14:00:00Z" },
  { id: "a5", type: "video_failed", message: "Video \"City Nightlife Montage\" generation failed", timestamp: "2025-01-12T22:20:00Z" },
  { id: "a6", type: "project_created", message: "Created project \"Social Content\"", timestamp: "2025-01-02T00:00:00Z" },
];

export const MOCK_SETTINGS: Settings = {
  google_ai: { api_key: "", connected: false },
  facebook: { access_token: "", page_id: "", connected: false },
  tiktok: { access_token: "", connected: false },
  youtube: { api_key: "", client_id: "", client_secret: "", refresh_token: "", connected: false },
};

// Helper: unwrap axios response supporting both { data: ... } or raw data or { items: ... }
function unwrap<T>(resData: any): T {
  if (resData === null || resData === undefined) return resData;
  if (resData.data !== undefined) return resData.data;
  if (Array.isArray(resData.items)) return resData.items as unknown as T;
  return resData as T;
}

// ============================================================
// Helper: wrap API calls with fallback to mock data
// ============================================================
async function withFallback<T>(call: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await call();
    if (result === undefined || result === null) return fallback;
    return result;
  } catch (err) {
    console.warn("API request failed, using fallback:", err);
    return fallback;
  }
}

// ============================================================
// Dashboard
// ============================================================
export async function getDashboardStats(): Promise<DashboardStats> {
  return withFallback(async () => {
    const { data } = await api.get("/dashboard/stats");
    return unwrap<DashboardStats>(data);
  }, MOCK_STATS);
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  return withFallback(async () => {
    const { data } = await api.get("/dashboard/activity");
    return unwrap<ActivityItem[]>(data);
  }, MOCK_ACTIVITY);
}

// ============================================================
// Projects
// ============================================================
export async function getProjects(): Promise<Project[]> {
  return withFallback(async () => {
    const { data } = await api.get("/projects");
    return unwrap<Project[]>(data);
  }, MOCK_PROJECTS);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return withFallback(async () => {
    const { data } = await api.get(`/projects/${id}`);
    return unwrap<Project>(data);
  }, MOCK_PROJECTS.find((p) => String(p.id) === String(id)));
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data } = await api.post("/projects", project);
  return unwrap<Project>(data);
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const { data } = await api.put(`/projects/${id}`, project);
  return unwrap<Project>(data);
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

// ============================================================
// Videos
// ============================================================
export async function getVideos(): Promise<Video[]> {
  return withFallback(async () => {
    const { data } = await api.get("/videos");
    return unwrap<Video[]>(data);
  }, MOCK_VIDEOS);
}

export async function getVideo(id: string): Promise<Video | undefined> {
  return withFallback(async () => {
    const { data } = await api.get(`/videos/${id}`);
    return unwrap<Video>(data);
  }, MOCK_VIDEOS.find((v) => String(v.id) === String(id)));
}

export async function generateVideo(request: GenerateVideoRequest): Promise<Video> {
  const { data } = await api.post("/videos/generate", request);
  return unwrap<Video>(data);
}

export async function getVideoStatus(id: string): Promise<Video> {
  return withFallback(async () => {
    const { data } = await api.get(`/videos/${id}/status`);
    return unwrap<Video>(data);
  }, MOCK_VIDEOS.find((v) => String(v.id) === String(id))!);
}

export async function deleteVideo(id: string): Promise<void> {
  await api.delete(`/videos/${id}`);
}

// ============================================================
// Social / Publish
// ============================================================
export async function publishVideo(request: PublishRequest): Promise<SocialPost[]> {
  const { data } = await api.post("/social/publish", request);
  return unwrap<SocialPost[]>(data);
}

export async function getPosts(): Promise<SocialPost[]> {
  return withFallback(async () => {
    const { data } = await api.get("/social/posts");
    return unwrap<SocialPost[]>(data);
  }, MOCK_POSTS);
}

export async function getPostStatus(id: string): Promise<SocialPost> {
  const { data } = await api.get(`/social/posts/${id}/status`);
  return unwrap<SocialPost>(data);
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/social/posts/${id}`);
}

// ============================================================
// Templates
// ============================================================
export async function getTemplates(): Promise<PromptTemplate[]> {
  return withFallback(async () => {
    const { data } = await api.get("/templates");
    return unwrap<PromptTemplate[]>(data);
  }, MOCK_TEMPLATES);
}

export async function createTemplate(template: Partial<PromptTemplate>): Promise<PromptTemplate> {
  const { data } = await api.post("/templates", template);
  return unwrap<PromptTemplate>(data);
}

export async function updateTemplate(id: string, template: Partial<PromptTemplate>): Promise<PromptTemplate> {
  const { data } = await api.put(`/templates/${id}`, template);
  return unwrap<PromptTemplate>(data);
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

export async function previewTemplate(id: string, variables: Record<string, string>): Promise<string> {
  const { data } = await api.post(`/templates/${id}/preview`, { variables });
  return unwrap<string>(data);
}

// ============================================================
// Settings
// ============================================================
export async function getSettings(): Promise<Settings> {
  return withFallback(async () => {
    const { data } = await api.get("/settings");
    return unwrap<Settings>(data);
  }, MOCK_SETTINGS);
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put("/settings", settings);
  return unwrap<Settings>(data);
}

export async function testConnection(
  platform: string,
  payload?: {
    api_key?: string;
    token?: string;
    page_id?: string;
    refresh_token?: string;
  }
): Promise<{ connected: boolean; message?: string; error?: string; details?: any }> {
  try {
    const { data } = await api.post(`/settings/test-connection/${platform}`, payload || {});
    return unwrap(data);
  } catch (err: any) {
    return { connected: false, error: err.response?.data?.detail || err.message };
  }
}

// ============================================================
// Confirm Plan (Skill, Prompt, Agent)
// ============================================================
export async function confirmPlan(payload: {
  topic: string;
  agent_role?: string;
  skills?: string[];
  style?: string;
  duration?: number;
  engine?: string;
}): Promise<any> {
  const { data } = await api.post("/videos/confirm-plan", payload);
  return data;
}

// ============================================================
// AI helpers
// ============================================================
export async function enhancePrompt(prompt: string): Promise<string> {
  const { data } = await api.post("/ai/enhance-prompt", { prompt });
  return unwrap<string>(data);
}

export async function generateScript(topic: string, duration?: number): Promise<string> {
  const { data } = await api.post("/ai/generate-script", { topic, duration });
  return unwrap<string>(data);
}

export async function suggestHashtags(caption: string, platform: string): Promise<string[]> {
  const { data } = await api.post("/ai/suggest-hashtags", { caption, platform });
  return unwrap<string[]>(data);
}

export async function generateCaption(videoTitle: string, platform: string): Promise<string> {
  const { data } = await api.post("/ai/generate-caption", { video_title: videoTitle, platform });
  return unwrap<string>(data);
}

export async function getProjectVideos(projectId: string): Promise<Video[]> {
  return withFallback(async () => {
    const { data } = await api.get(`/projects/${projectId}/videos`);
    return unwrap<Video[]>(data);
  }, MOCK_VIDEOS.filter((v) => String(v.project_id) === String(projectId)));
}

export async function uploadMediaFile(file: File): Promise<{
  success: boolean;
  filename: string;
  saved_as: string;
  media_type: "image" | "video" | "audio" | "document" | "file";
  url: string;
  text_content?: string;
  size_bytes: number;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
}

export default api;
