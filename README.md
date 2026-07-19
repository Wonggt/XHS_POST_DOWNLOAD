# Social Post Downloader

Paste a post URL from **Xiaohongshu, Instagram, TikTok, or Facebook** to preview and
download its images and videos. Xiaohongshu / Instagram / Facebook image sets can also
be exported as a ZIP, PDF, or single vertical long image.

## Stack

- Next.js 15 (App Router, Route Handlers)
- TypeScript, Tailwind CSS
- Sharp, pdf-lib, JSZip

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Cookies (optional but recommended)

Instagram and Facebook almost always require a logged-in session. TikTok and Xiaohongshu
sometimes do. Copy the full `Cookie` request header value from a logged-in browser tab
into `.env.local`:

```
XHS_COOKIE=...
IG_COOKIE=...
TIKTOK_COOKIE=...
FB_COOKIE=...
```

## Project structure

```
app/
  page.tsx                    # Tabbed UI
  layout.tsx
  api/
    extract/route.ts          # POST { url, platform } → { images, videos }
    zip/route.ts              # POST { images } → application/zip
    pdf/route.ts              # POST { images } → application/pdf
    long-image/route.ts       # POST { images } → image/jpeg
    proxy/route.ts            # GET  ?url=…&download=1 → stream media
lib/
  extractors/
    types.ts
    http.ts
    xhs.ts
    instagram.ts
    tiktok.ts
    facebook.ts
    index.ts                  # dispatcher + allowed hosts
  image.ts                    # download / merge (Sharp)
  pdf.ts                      # PDF composition (pdf-lib)
  zip.ts                      # ZIP composition (JSZip)
```

## Notes

Extraction is HTML/JSON scraping — platforms change markup frequently and heavily gate
non-public content. If a link returns no media, log in via the relevant `*_COOKIE`
variable. Respect each platform's Terms of Service and only download content you have
the right to save.
