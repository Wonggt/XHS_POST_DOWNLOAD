import {
  ExtractorError,
  ExtractResult,
  UA,
  decodeUnicode,
  dedupeByPath,
  normalizeUrl,
} from "./types";
import { fetchHtmlWithMeta } from "./http";

// Strip tracking / share-context params that make FB return 400
const STRIP_PARAMS = [
  "mibextid",
  "rdid",
  "share_url",
  "notif_id",
  "notif_t",
  "ref",
  "__cft__",
  "__tn__",
  "hrc",
  "_rdr",
];

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

function cleanParams(u: URL): URL {
  const out = new URL(u.toString());
  for (const p of STRIP_PARAMS) out.searchParams.delete(p);
  // Also drop any param starting with __
  for (const key of [...out.searchParams.keys()]) {
    if (key.startsWith("__")) out.searchParams.delete(key);
  }
  out.hash = "";
  return out;
}

// Resolve short/share URLs (fb.watch, fb.com/xxx, facebook.com/share/v|r|p/…)
// by following the redirect chain to the canonical /watch or /reel URL.
async function resolveShortLink(url: URL): Promise<URL> {
  const host = url.hostname.toLowerCase();
  const path = url.pathname;
  const isShort =
    /(?:^|\.)(fb\.watch|fb\.com)$/.test(host) ||
    /\/share\/(?:v|r|p|reel)\//i.test(path);
  if (!isShort) return url;

  // Prefer m. host for share redirects — mbasic/m sends us the plain final URL
  // fast without the interstitial "opening in the app" JS.
  const probe =
    host.endsWith("facebook.com") && /\/share\//i.test(path)
      ? url.toString().replace(host, "m.facebook.com")
      : url.toString();

  try {
    const res = await fetch(probe, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    // If FB responded but with a share-interstitial page, sniff the canonical URL
    // out of the HTML (og:url or a location.href in a redirect script).
    const finalUrl = new URL(res.url);
    if (/\/share\//i.test(finalUrl.pathname)) {
      const html = await res.text();
      const og = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i);
      const loc = html.match(/(?:location\.replace|location\.href\s*=)\s*["']([^"']+)/i);
      const target = og?.[1] || loc?.[1];
      if (target) {
        try {
          return new URL(target, finalUrl);
        } catch {
          /* fall through */
        }
      }
    }
    return finalUrl;
  } catch {
    return url;
  }
}

function toHost(url: URL, host: string): string {
  const u = new URL(url.toString());
  if (u.hostname.endsWith("facebook.com")) u.hostname = host;
  return u.toString();
}

const BROWSER_HEADERS: Record<string, string> = {
  "Accept-Encoding": "gzip, deflate, br",
  "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

// FB inlines emoji/icon/sticker PNGs into post text as <img>. Filter them so only
// real photo-content URLs (from scontent*.fbcdn.net) remain.
const NOISE_RE =
  /(?:\/rsrc\.php\/|emoji\.php|\/images\/emoji|\/emoji\/|static(?:-[a-z0-9]+)?\.[a-z0-9-]+\.fbcdn\.net|\/spacer\.gif|\/rsrc\/|\/safe_image\.php|_avatar|\/profile-)/i;
const IMAGE_HOST_RE = /(?:scontent|fna|external)[a-z0-9.-]*\.fbcdn\.net/i;

function isRealImage(u: string): boolean {
  if (NOISE_RE.test(u)) return false;
  // Prefer scontent CDN (actual user-uploaded media); allow other hosts only if
  // they clearly look like a photo file.
  if (IMAGE_HOST_RE.test(u)) return true;
  return /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u) && !/static/i.test(u);
}

function scanHtml(html: string, images: Set<string>, videos: Set<string>) {
  const patterns: [RegExp, "video" | "image"][] = [
    // Classic video posts
    [/"browser_native_hd_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"browser_native_sd_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"playable_url_quality_hd"\s*:\s*"([^"]+)"/g, "video"],
    [/"playable_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"hd_src"\s*:\s*"([^"]+)"/g, "video"],
    [/"sd_src"\s*:\s*"([^"]+)"/g, "video"],
    // Reels & modern video delivery
    [/"video_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"video_dash_manifest_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"progressive_url"\s*:\s*"([^"]+)"/g, "video"],
    [/"representative_thumbnail_uri"\s*:\s*"([^"]+)"/g, "image"],
    // Images
    [/"image"\s*:\s*\{\s*"uri"\s*:\s*"([^"]+)"/g, "image"],
    [/"src"\s*:\s*"(https?:\\?\/\\?\/[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"/gi, "image"],
    // Fallback HTML elements
    [/<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi, "video"],
    [/<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi, "video"],
    [/<img[^>]+src=["']([^"']+?\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi, "image"],
  ];
  for (const [re, kind] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = normalizeUrl(decodeUnicode(m[1]));
      if (!n) continue;
      if (kind === "video") videos.add(n);
      else if (isRealImage(n)) images.add(n);
    }
  }

  const ogImg = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  const ogVid = /<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = ogImg.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n && isRealImage(n)) images.add(n);
  }
  while ((m = ogVid.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (n) videos.add(n);
  }

  // Catch-all: any scontent CDN .mp4 URL anywhere in the HTML (Reels often
  // embed the video URL as a raw string inside base64-ish blobs or GraphQL
  // payloads under unpredictable JSON keys).
  const rawMp4 =
    /https?:(?:\\?\/){2}(?:scontent|video|fna|external)[a-z0-9.-]*\.(?:fbcdn|xx\.fbcdn)\.net\/[^"'\s\\<>]+?\.mp4[^"'\s\\<>]*/gi;
  while ((m = rawMp4.exec(html)) !== null) {
    const n = normalizeUrl(decodeUnicode(m[0]));
    if (n) videos.add(n);
  }
}

function looksLikeLoginWall(html: string): boolean {
  const t = html.toLowerCase();
  return (
    /you must log in/.test(t) ||
    /login to see/.test(t) ||
    /log in or sign up to view/.test(t) ||
    /<title>[^<]*log in[^<]*<\/title>/.test(t)
  );
}

async function tryFetch(
  url: string,
  cookie: string | undefined,
  referer: string,
  images: Set<string>,
  videos: Set<string>,
): Promise<{ ok: boolean; loginWall: boolean }> {
  try {
    const { html } = await fetchHtmlWithMeta(url, {
      cookie,
      referer,
      platform: "facebook",
      extraHeaders: BROWSER_HEADERS,
    });
    const wall = looksLikeLoginWall(html);
    scanHtml(html, images, videos);
    return { ok: true, loginWall: wall };
  } catch (e) {
    if (e instanceof ExtractorError && e.status === 401)
      return { ok: false, loginWall: true };
    return { ok: false, loginWall: false };
  }
}

function isVideoUrl(url: URL): boolean {
  return (
    /\/(?:reel|reels|watch|watchs|videos|video)\//i.test(url.pathname) ||
    /\/share\/(?:v|r)\//i.test(url.pathname) ||
    url.searchParams.has("v")
  );
}

export async function extractFacebook(rawUrl: string): Promise<ExtractResult> {
  const validated = validate(rawUrl);
  const resolved = await resolveShortLink(validated);
  const cleaned = cleanParams(resolved);
  const cookie = process.env.FB_COOKIE;
  const isVideo = isVideoUrl(cleaned);

  const images = new Set<string>();
  const videos = new Set<string>();
  let anyLoginWall = false;

  // Order of hosts to try — for Reels/videos we prefer www.facebook.com because
  // mbasic doesn't embed video URLs. For classic posts mbasic is more reliable.
  const wwwUrl = toHost(cleaned, "www.facebook.com");
  const mbasicUrl = toHost(cleaned, "mbasic.facebook.com");
  const mUrl = toHost(cleaned, "m.facebook.com");

  const attempts: [string, string][] = isVideo
    ? [
        [wwwUrl, "https://www.facebook.com/"],
        [mUrl, "https://m.facebook.com/"],
        [mbasicUrl, "https://mbasic.facebook.com/"],
      ]
    : [
        [mbasicUrl, "https://mbasic.facebook.com/"],
        [wwwUrl, "https://www.facebook.com/"],
        [mUrl, "https://m.facebook.com/"],
      ];

  for (const [u, ref] of attempts) {
    const r = await tryFetch(u, cookie, ref, images, videos);
    anyLoginWall = anyLoginWall || r.loginWall;
    // For Reels keep sweeping even after first hit — a single host might only
    // give us the poster image, not the mp4.
    if (!isVideo && videos.size + images.size > 0) break;
  }

  // Reels / videos: even if we scraped a poster image, if no video URL was
  // captured that means FB served us the login-wall version of the page.
  const wantedVideo = isVideo && videos.size === 0;

  if (images.size + videos.size === 0 || wantedVideo) {
    if (anyLoginWall || wantedVideo) {
      throw new ExtractorError(
        "Facebook is showing a login wall. Reels and non-public videos require a logged-in session cookie — set FB_COOKIE in .env.local (copy the Cookie header from a logged-in facebook.com tab).",
        401,
      );
    }
    throw new ExtractorError(
      "Facebook rejected the request or hid the media. Try a direct public post URL from the browser address bar.",
      404,
    );
  }

  return {
    platform: "facebook",
    images: dedupeByPath([...images]),
    videos: dedupeByPath([...videos]),
  };
}
