import { ExtractorError, UA } from "./types";

export interface FetchOpts {
  cookie?: string;
  referer?: string;
  extraHeaders?: Record<string, string>;
  platform?: string;
}

export interface FetchResult {
  html: string;
  finalUrl: string;
}

export async function fetchHtml(url: string, opts: FetchOpts = {}): Promise<string> {
  const r = await fetchHtmlWithMeta(url, opts);
  return r.html;
}

export async function fetchHtmlWithMeta(
  url: string,
  opts: FetchOpts = {},
): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
        ...(opts.cookie ? { Cookie: opts.cookie } : {}),
        ...(opts.referer ? { Referer: opts.referer } : {}),
        ...(opts.extraHeaders ?? {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[extractor:${opts.platform ?? "?"}] network error`, msg);
    throw new ExtractorError(`Network error reaching upstream: ${msg}`, 502);
  }

  const finalUrl = res.url || url;

  if (res.status === 401 || res.status === 403) {
    throw new ExtractorError(
      "Post requires authentication — try again after setting the platform's cookie env var.",
      401,
    );
  }
  if (res.status === 429) throw new ExtractorError("Rate limited by upstream", 429);
  if (res.status === 404) throw new ExtractorError("Post not found", 404);
  if (!res.ok) {
    const snippet = (await res.text().catch(() => "")).slice(0, 200);
    console.error(
      `[extractor:${opts.platform ?? "?"}] upstream ${res.status} for ${url} → ${finalUrl}`,
      snippet,
    );
    throw new ExtractorError(
      `Upstream returned ${res.status}. The post may be private, deleted, or geo-blocked.`,
      502,
    );
  }
  const html = await res.text();
  return { html, finalUrl };
}
