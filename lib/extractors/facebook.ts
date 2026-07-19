import { ExtractorError, ExtractResult, decodeUnicode, normalizeUrl } from "./types";
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
    host.endsWith("facebook.com") ||
    host.endsWith("fb.watch") ||
    host.endsWith("fb.com");
  if (!ok) throw new ExtractorError("URL must be a Facebook link", 400);
  return url;
}

export async function extractFacebook(rawUrl: string): Promise<ExtractResult> {
  const url = validate(rawUrl);
  const html = await fetchHtml(url.toString(), {
    cookie: process.env.FB_COOKIE,
    referer: "https://www.facebook.com/",
  });

  const images = new Set<string>();
  const videos = new Set<string>();

  const patterns: [RegExp, "video" | "image"][] = [
    [/"browser_native_hd_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"browser_native_sd_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"playable_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"playable_url_quality_hd"\s*:\s*"([^"]+)"/g, "video"],
    [/"hd_src"\s*:\s*"([^"]+)"/g, "video"],
    [/"sd_src"\s*:\s*"([^"]+)"/g, "video"],
    [/"image"\s*:\s*\{\s*"uri"\s*:\s*"([^"]+)"/g, "image"],
    [/"src"\s*:\s*"(https?:\\?\/\\?\/[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"/gi, "image"],
  ];
  for (const [re, kind] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = normalizeUrl(decodeUnicode(m[1]));
      if (!n) continue;
      if (kind === "video") videos.add(n);
      else images.add(n);
    }
  }

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
    throw new ExtractorError(
      "No media found. Facebook often requires login — set FB_COOKIE.",
      401,
    );
  }
  return { platform: "facebook", images: [...images], videos: [...videos] };
}
