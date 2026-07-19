import { NextRequest, NextResponse } from "next/server";
import { extractImages, ExtractorError } from "@/lib/extractor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    const result = await extractImages(url);
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ExtractorError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
