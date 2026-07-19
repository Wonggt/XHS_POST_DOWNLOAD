import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrabIt · Save posts from Xiaohongshu, Instagram, TikTok & Facebook",
  description:
    "Paste any post link to preview and download photos and videos — no watermark, no login required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
