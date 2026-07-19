import { NextRequest, NextResponse } from "next/server";
import { downloadAll, mergeVertical } from "@/lib/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "images array required" }, { status: 400 });
    }
    const downloaded = await downloadAll(images);
    const buf = await mergeVertical(downloaded);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="xhs-long.jpg"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build long image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
