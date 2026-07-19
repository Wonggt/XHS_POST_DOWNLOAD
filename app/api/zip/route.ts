import { NextRequest, NextResponse } from "next/server";
import { buildZip } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "images array required" }, { status: 400 });
    }
    const buf = await buildZip(images);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="xhs-images.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build ZIP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
