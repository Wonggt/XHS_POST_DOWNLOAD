import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("url");
  if (!src) return NextResponse.json({ error: "url required" }, { status: 400 });
  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!/xhscdn\.com$|xiaohongshu\.com$/.test(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }
  const upstream = await fetch(target, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.xiaohongshu.com/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
