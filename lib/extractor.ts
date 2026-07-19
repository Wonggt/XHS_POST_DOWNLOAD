const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export class ExtractorError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function validateXhsUrl(input: string): URL {
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
    host.endsWith("redbook.com") ||
    host.endsWith("xhscdn.com");
  if (!ok) throw new ExtractorError("URL must be a Xiaohongshu link", 400);
  return url;
}

async function fetchHtml(url: string): Promise<string> {
  const cookie = process.env.XHS_COOKIE ?? "";
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    throw new ExtractorError(
      "Post requires authentication. Set XHS_COOKIE environment variable.",
      401,
    );
  }
  if (res.status === 429) throw new ExtractorError("Rate limited by Xiaohongshu", 429);
  if (!res.ok) throw new ExtractorError(`Failed to fetch post (${res.status})`, 502);
  return res.text();
}

function decodeUnicode(s: string): string {
  return s.replace(/\\u([\dA-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function normalizeImageUrl(raw: string): string | null {
  let u = raw.trim().replace(/&amp;/g, "&");
  if (!u) return null;
  if (u.startsWith("//")) u = "https:" + u;
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    const parsed = new URL(u);
    // strip query for stable dedupe; xhs uses signed params sometimes needed for CDN
    // keep query but drop hash
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractFromInitialState(html: string): string[] {
  const found = new Set<string>();
  const scriptMatch = html.match(
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/,
  );
  const blob = scriptMatch ? scriptMatch[1] : html;
  // xhs image objects usually contain urlDefault / url_default / url fields
  const patterns = [
    /"urlDefault"\s*:\s*"([^"]+)"/g,
    /"url_default"\s*:\s*"([^"]+)"/g,
    /"url"\s*:\s*"(https?:[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(blob)) !== null) {
      const normalized = normalizeImageUrl(decodeUnicode(m[1]));
      if (normalized) found.add(normalized);
    }
  }
  return [...found];
}

function extractFromMeta(html: string): string[] {
  const found = new Set<string>();
  const re = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const n = normalizeImageUrl(m[1]);
    if (n) found.add(n);
  }
  return [...found];
}

export interface ExtractResult {
  images: string[];
  source: "initial-state" | "meta" | "mixed";
}

export async function extractImages(rawUrl: string): Promise<ExtractResult> {
  const url = validateXhsUrl(rawUrl);
  const html = await fetchHtml(url.toString());

  const stateImgs = extractFromInitialState(html);
  const metaImgs = extractFromMeta(html);

  const all = new Set<string>([...stateImgs, ...metaImgs]);
  const images = [...all].filter((u) =>
    /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u) || /xhscdn\.com/.test(u),
  );

  if (images.length === 0) {
    throw new ExtractorError(
      "No images found. Post may be private, require login, or use an unsupported format.",
      404,
    );
  }

  const source: ExtractResult["source"] =
    stateImgs.length && metaImgs.length ? "mixed" : stateImgs.length ? "initial-state" : "meta";
  return { images, source };
}
