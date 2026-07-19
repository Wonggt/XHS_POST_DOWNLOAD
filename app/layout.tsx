import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xiaohongshu Post Image Export",
  description: "Extract images from Xiaohongshu posts as ZIP, PDF, or long image.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
