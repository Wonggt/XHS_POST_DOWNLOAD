# Xiaohongshu Post Image Export

Paste a Xiaohongshu (RED) post URL and export its images as ZIP, PDF, or a merged long image.

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

For posts that require login, copy your `xiaohongshu.com` `Cookie` header value into `.env.local`:

```
XHS_COOKIE=your_cookie_here
```

## Deploy

Deploy to Vercel. Set `XHS_COOKIE` in the project environment variables if authentication is needed.

## Project structure

```
app/
  page.tsx
  layout.tsx
  api/
    extract/route.ts
    zip/route.ts
    pdf/route.ts
    long-image/route.ts
    proxy/route.ts
lib/
  extractor.ts
  image.ts
  pdf.ts
  zip.ts
```

## Notes

Respect Xiaohongshu's Terms of Service. Only export content you have the right to save.
