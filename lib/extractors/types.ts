export type Platform = "xhs" | "instagram" | "tiktok" | "facebook";

export interface ExtractResult {
  platform: Platform;
  images: string[];
  videos: string[];
  title?: string;
  source?: string;
}

export class ExtractorError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export function decodeUnicode(s: string): string {
  return s
    .replace(/\\u002F/gi, "/")
    .replace(/\\u([\dA-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

export function normalizeUrl(raw: string): string | null {
  let u = decodeUnicode(raw).trim();
  if (!u) return null;
  if (u.startsWith("//")) u = "https:" + u;
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    const parsed = new URL(u);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
