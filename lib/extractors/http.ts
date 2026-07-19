import { ExtractorError, UA } from "./types";

export interface FetchOpts {
  cookie?: string;
  referer?: string;
  extraHeaders?: Record<string, string>;
}

export async function fetchHtml(url: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetch(url, {
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
  if (res.status === 401 || res.status === 403) {
    throw new ExtractorError(
      "Post requires authentication — set the platform's cookie env var.",
      401,
    );
  }
  if (res.status === 429) throw new ExtractorError("Rate limited by upstream", 429);
  if (res.status === 404) throw new ExtractorError("Post not found", 404);
  if (!res.ok) throw new ExtractorError(`Fetch failed (${res.status})`, 502);
  return res.text();
}
