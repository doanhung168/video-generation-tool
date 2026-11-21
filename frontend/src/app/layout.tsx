import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoVideo AI - Video Generation & Auto Social Publishing Studio",
  description:
    "Generate videos with Google Veo 3, Google Flow, Alibaba Wan 2.1, ByteDance Seedance and Moonshot Kimi. Auto-publish to Facebook, TikTok, and YouTube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased flex`}>
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {children}
        </main>
      </body>
    </html>
  );
}
