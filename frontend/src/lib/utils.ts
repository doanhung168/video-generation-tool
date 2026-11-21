import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "published":
    case "success":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "processing":
    case "generating":
    case "uploading":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "pending":
    case "queued":
    case "scheduled":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "failed":
    case "error":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "draft":
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    default:
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
