"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Share2,
  FolderKanban,
  Settings,
  Sparkles,
  Bot,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

function SidebarNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Studio / Create",
      href: "/create",
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      badge: "AI Veo3/Wan",
    },
    {
      label: "Video Gallery",
      href: "/videos",
      icon: <Film className="w-5 h-5" />,
    },
    {
      label: "Social Publisher",
      href: "/publish",
      icon: <Share2 className="w-5 h-5 text-emerald-400" />,
      badge: "Auto",
    },
    {
      label: "Agents & Skills",
      href: "/templates",
      icon: <Bot className="w-5 h-5 text-purple-400" />,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: "API Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
        Menu
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-200"
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none">
            AutoVideo AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Veo3 • Flow • Wan • Kimi
          </p>
        </div>
      </div>

      {/* Navigation wrapped in Suspense */}
      <Suspense fallback={<div className="flex-1 p-4 text-xs text-slate-500">Loading menu...</div>}>
        <SidebarNav />
      </Suspense>

      {/* Model Engine Status Card */}
      <div className="p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>Active Engines</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60 text-slate-300">
            Veo 3 / Flow
          </div>
          <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60 text-slate-300">
            Alibaba Wan
          </div>
          <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60 text-slate-300">
            ByteDance Seed
          </div>
          <div className="bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60 text-slate-300">
            Kimi / Gemini
          </div>
        </div>
      </div>
    </aside>
  );
}
