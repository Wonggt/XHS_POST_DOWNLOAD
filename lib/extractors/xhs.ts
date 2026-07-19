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

// XHS brand/logo/share-cover images we never want in the results
const LOGO_RE =
  /(?:sns-webpic-qc\.xhscdn\.com\/.*share_cover|xhs-logo|logo\.xiaohongshu|red_logo|app_?icon|share_icon|watermark)/i;

// Strip query params for dedupe — same media re-encoded with different signed tokens
function pathKey(u: string): string {
  try {
    const p = new URL(u);
    p.search = "";
    p.hash = "";
    return p.toString();
  } catch {
    return u;
  }
}

function extractStateImages(html: string): string[] {
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
  return [...found];
}

function extractMetaImages(html: string): string[] {
  const found = new Set<string>();
  const re = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n) found.add(n);
  }
  return [...found];
}

function extractImages(html: string): string[] {
  const state = extractStateImages(html);
  // Only fall back to og:image (which is often the share-cover / brand logo) when
  // the state parser found nothing.
  const raw = state.length ? state : extractMetaImages(html);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of raw) {
    if (LOGO_RE.test(u)) continue;
    if (!/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u) && !/xhscdn\.com/.test(u)) continue;
    const key = pathKey(u);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(u);
  }
  return result;
}

function extractVideos(html: string): string[] {
  // Order matters: prefer the highest-quality URL for a given video.
  const candidates: string[] = [];
  const push = (raw: string) => {
    const n = normalizeUrl(decodeUnicode(raw));
    if (n) candidates.push(n);
  };
  const patterns = [
    /"masterUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
    /"url"\s*:\s*"(https?:[^"]+?\.mp4[^"]*)"/gi,
    /"backupUrls"\s*:\s*\[\s*"([^"]+\.mp4[^"]*)"/g,
    /<meta[^>]+property=["']og:video(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) push(m[1]);
  }

  // Dedupe by path (ignoring query/signature) so the same clip at different
  // qualities / signed tokens collapses to one entry.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of candidates) {
    const key = pathKey(u);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(u);
  }
  return result;
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
