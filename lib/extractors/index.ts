import { ExtractorError, ExtractResult, Platform } from "./types";
import { extractXhs } from "./xhs";
import { extractInstagram } from "./instagram";
import { extractTiktok } from "./tiktok";
import { extractFacebook } from "./facebook";

export { ExtractorError };
export type { ExtractResult, Platform };

export async function extractByPlatform(
  platform: Platform,
  url: string,
): Promise<ExtractResult> {
  switch (platform) {
    case "xhs":
      return extractXhs(url);
    case "instagram":
      return extractInstagram(url);
    case "tiktok":
      return extractTiktok(url);
    case "facebook":
      return extractFacebook(url);
    default:
      throw new ExtractorError(`Unknown platform: ${platform}`, 400);
  }
}

export const ALLOWED_HOSTS: Record<string, string> = {
  "xhscdn.com": "xhs",
  "xiaohongshu.com": "xhs",
  "cdninstagram.com": "instagram",
  "fbcdn.net": "instagram",
  "instagram.com": "instagram",
  "tiktokcdn.com": "tiktok",
  "tiktokcdn-us.com": "tiktok",
  "tiktok.com": "tiktok",
  "facebook.com": "facebook",
  "fb.watch": "facebook",
};

export function isAllowedMediaHost(host: string): boolean {
  const h = host.toLowerCase();
  return Object.keys(ALLOWED_HOSTS).some((allowed) => h === allowed || h.endsWith("." + allowed));
}
