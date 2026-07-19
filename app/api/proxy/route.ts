import { NextRequest, NextResponse } from "next/server";
import { isAllowedMediaHost } from "@/lib/extractors";
import { UA } from "@/lib/extractors/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlatformCfg {
  referer: string;
  cookieEnv?: string;
  origin?: string;
}

function pickPlatform(host: string): PlatformCfg {
  const h = host.toLowerCase();
  if (h.includes("xhscdn") || h.includes("xiaohongshu")) {
    return { referer: "https://www.xiaohongshu.com/", cookieEnv: "XHS_COOKIE" };
  }
  if (h.includes("cdninstagram") || h.includes("instagram") || h.includes("fbcdn")) {
    return {
      referer: "https://www.instagram.com/",
      cookieEnv: "IG_COOKIE",
      origin: "https://www.instagram.com",
    };
  }
  if (h.includes("tiktok")) {
    return {
      referer: "https://www.tiktok.com/",
      cookieEnv: "TIKTOK_COOKIE",
      origin: "https://www.tiktok.com",
    };
  }
  if (h.includes("facebook") || h.includes("fb.watch")) {
    return { referer: "https://www.facebook.com/", cookieEnv: "FB_COOKIE" };
  }
  return { referer: "" };
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("url");
  const download = req.nextUrl.searchParams.get("download");
  const filename = req.nextUrl.searchParams.get("filename") ?? "media";
  if (!src) return NextResponse.json({ error: "url required" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!isAllowedMediaHost(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  const cfg = pickPlatform(target.hostname);
  const cookie = cfg.cookieEnv ? process.env[cfg.cookieEnv] : undefined;
  const range = req.headers.get("range");

  const upstreamHeaders: Record<string, string> = {
    "User-Agent": UA,
    Referer: cfg.referer,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (cfg.origin) upstreamHeaders.Origin = cfg.origin;
  if (cookie) upstreamHeaders.Cookie = cookie;
  if (range) upstreamHeaders.Range = range;

  const upstream = await fetch(target, {
    headers: upstreamHeaders,
    cache: "no-store",
    redirect: "follow",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `upstream ${upstream.status}`, url: target.toString() },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": download === "1" ? "no-store" : "public, max-age=3600",
    "Accept-Ranges": "bytes",
  };
  if (download === "1") {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }
  const passthrough = ["content-length", "content-range", "etag", "last-modified"];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) headers[h.replace(/(^|-)([a-z])/g, (_, p, c) => p + c.toUpperCase())] = v;
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
