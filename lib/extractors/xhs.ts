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
    host.endsWith("xiaohongshu.com") ||
    host.endsWith("xhslink.com") ||
    host.endsWith("redbook.com");
  if (!ok) throw new ExtractorError("URL must be a Xiaohongshu link", 400);
  return url;
}

function extractImages(html: string): string[] {
  const found = new Set<string>();
  const scriptMatch = html.match(
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/,
  );
  const blob = scriptMatch ? scriptMatch[1] : html;
  const patterns = [
    /"urlDefault"\s*:\s*"([^"]+)"/g,
    /"url_default"\s*:\s*"([^"]+)"/g,
    /"url"\s*:\s*"(https?:[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(blob)) !== null) {
      const n = normalizeUrl(decodeUnicode(m[1]));
      if (n) found.add(n);
    }
  }
  const metaRe = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n) found.add(n);
  }
  return [...found].filter(
    (u) => /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u) || /xhscdn\.com/.test(u),
  );
}

function extractVideos(html: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /"masterUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
    /"backupUrls"\s*:\s*\[\s*"([^"]+\.mp4[^"]*)"/g,
    /"url"\s*:\s*"(https?:[^"]+?\.mp4[^"]*)"/gi,
    /<meta[^>]+property=["']og:video(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = normalizeUrl(decodeUnicode(m[1]));
      if (n) found.add(n);
    }
  }
  return [...found];
}

export async function extractXhs(rawUrl: string): Promise<ExtractResult> {
  const url = validate(rawUrl);
  const html = await fetchHtml(url.toString(), { cookie: process.env.XHS_COOKIE });
  const images = extractImages(html);
  const videos = extractVideos(html);
  if (!images.length && !videos.length) {
    throw new ExtractorError(
      "No media found. Post may be private or require login (set XHS_COOKIE).",
      404,
    );
  }
  return { platform: "xhs", images, videos };
}
