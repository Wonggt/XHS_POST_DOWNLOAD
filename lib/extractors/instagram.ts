import { ExtractorError, ExtractResult, decodeUnicode, normalizeUrl } from "./types";
import { fetchHtml } from "./http";

function validate(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ExtractorError("Invalid URL", 400);
  }
  if (!/(^|\.)instagram\.com$/.test(url.hostname.toLowerCase())) {
    throw new ExtractorError("URL must be an Instagram link", 400);
  }
  return url;
}

export async function extractInstagram(rawUrl: string): Promise<ExtractResult> {
  const url = validate(rawUrl);
  const html = await fetchHtml(url.toString(), {
    cookie: process.env.IG_COOKIE,
    referer: "https://www.instagram.com/",
  });

  const images = new Set<string>();
  const videos = new Set<string>();

  // og tags — always present, safest baseline
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

  // Best-effort JSON scraping (works when logged in via IG_COOKIE)
  const jsonPatterns = [
    /"display_url"\s*:\s*"([^"]+)"/g,
    /"video_url"\s*:\s*"([^"]+)"/g,
    /"src"\s*:\s*"(https?:\\?\/\\?\/[^"]+\.(?:jpg|jpeg|png|webp|mp4)[^"]*)"/gi,
  ];
  for (const re of jsonPatterns) {
    while ((m = re.exec(html)) !== null) {
      const raw = decodeUnicode(m[1]);
      const n = normalizeUrl(raw);
      if (!n) continue;
      if (/\.mp4(?:\?|$)/i.test(n)) videos.add(n);
      else images.add(n);
    }
  }

  if (!images.size && !videos.size) {
    throw new ExtractorError(
      "No media found. Instagram usually requires login — set IG_COOKIE.",
      401,
    );
  }
  return { platform: "instagram", images: [...images], videos: [...videos] };
}
