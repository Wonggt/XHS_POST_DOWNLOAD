import { NextRequest, NextResponse } from "next/server";
import { extractByPlatform, ExtractorError, Platform } from "@/lib/extractors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS: Platform[] = ["xhs", "instagram", "tiktok", "facebook"];

export async function POST(req: NextRequest) {
  try {
    const { url, platform } = await req.json();
    if (typeof url !== "string" || !url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "Missing or invalid platform" }, { status: 400 });
    }
    const result = await extractByPlatform(platform as Platform, url);
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ExtractorError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
