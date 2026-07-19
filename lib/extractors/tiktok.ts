import { ExtractorError, ExtractResult, decodeUnicode, dedupeByPath, normalizeUrl, UA } from "./types";
import { fetchHtml } from "./http";

function validate(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ExtractorError("Invalid URL", 400);
  }
  const host = url.hostname.toLowerCase();
  const ok =
    host.endsWith("tiktok.com") ||
    host.endsWith("vt.tiktok.com") ||
    host.endsWith("vm.tiktok.com");
  if (!ok) throw new ExtractorError("URL must be a TikTok link", 400);
  return url;
}

async function resolveShortLink(url: URL): Promise<URL> {
  if (!/(?:^|\.)v[mt]\.tiktok\.com$/.test(url.hostname)) return url;
  const res = await fetch(url.toString(), {
    method: "HEAD",
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  return new URL(res.url);
}

export async function extractTiktok(rawUrl: string): Promise<ExtractResult> {
  let url = validate(rawUrl);
  url = await resolveShortLink(url);
  const html = await fetchHtml(url.toString(), {
    cookie: process.env.TIKTOK_COOKIE,
    referer: "https://www.tiktok.com/",
  });

  const images = new Set<string>();
  const videos = new Set<string>();

  // TikTok injects a JSON blob with id="__UNIVERSAL_DATA_FOR_REHYDRATION__"
  const blobMatch = html.match(
    /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
  );
  const blob = blobMatch ? blobMatch[1] : html;

  const patterns: [RegExp, "video" | "image"][] = [
    [/"playAddr"\s*:\s*"([^"]+)"/g, "video"],
    [/"downloadAddr"\s*:\s*"([^"]+)"/g, "video"],
    [/"playApi"\s*:\s*"([^"]+)"/g, "video"],
    [/"cover"\s*:\s*"([^"]+)"/g, "image"],
    [/"originCover"\s*:\s*"([^"]+)"/g, "image"],
    [/"imageURL"\s*:\s*\{\s*"urlList"\s*:\s*\[\s*"([^"]+)"/g, "image"],
  ];
  for (const [re, kind] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(blob)) !== null) {
      const n = normalizeUrl(decodeUnicode(m[1]));
      if (!n) continue;
      if (kind === "video") videos.add(n);
      else images.add(n);
    }
  }

  // og fallbacks
  const ogImg = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  const ogVid = /<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = ogImg.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n) images.add(n);
  }
  while ((m = ogVid.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n) videos.add(n);
  }

  if (!images.size && !videos.size) {
    throw new ExtractorError("No media found on this TikTok post.", 404);
  }
  return {
    platform: "tiktok",
    images: dedupeByPath([...images]),
    videos: dedupeByPath([...videos]),
  };
}
