# Xiaohongshu Post Image Export Tool

## Overview

Build a web application hosted on Vercel where a user pastes a
Xiaohongshu (RED) post URL. The application extracts all images from the
post and lets the user:

-   Download all images as a ZIP archive.
-   Merge all images into one long vertical image.
-   Export all images into a PDF.
-   Preview the extracted images.

> Note: Accessing Xiaohongshu content may require authentication and
> must comply with Xiaohongshu's Terms of Service.

## Tech Stack

### Frontend

-   Next.js 15
-   React
-   Tailwind CSS

### Backend

-   Next.js Route Handlers
-   TypeScript

### Libraries

-   Sharp (image processing)
-   pdf-lib (PDF generation)
-   JSZip (ZIP creation)
-   Puppeteer (optional, browser automation)
-   Playwright (optional alternative)

## Architecture

``` text
User
 │
 ▼
Paste Xiaohongshu URL
 │
 ▼
Next.js Frontend
 │
 ▼
API Route
 │
 ▼
Extract image URLs
 │
 ▼
Download images
 │
 ├── ZIP
 ├── Long Image
 └── PDF
```

## Implementation Steps

1.  Create a Next.js project and deploy it to Vercel.
2.  Build a page with:
    -   URL input
    -   "Extract" button
    -   Image preview grid
    -   Download buttons (ZIP, PDF, Long Image)
3.  Implement an API endpoint:
    -   Validate the URL.
    -   Retrieve the post page (or use browser automation if required).
    -   Extract image URLs.
4.  Download images into memory.
5.  Generate outputs:
    -   ZIP using JSZip.
    -   Long image by vertically compositing with Sharp.
    -   PDF using pdf-lib (one image per page or a continuous layout).
6.  Return the generated file for download.

## Suggested Project Structure

``` text
/app
  page.tsx
  api/
    extract/route.ts
/components
/lib
  extractor.ts
  image.ts
  pdf.ts
  zip.ts
/public
```

## Error Handling

-   Invalid URL
-   Post not accessible
-   Authentication required
-   Rate limiting
-   Image download failure

## Future Enhancements

-   Batch processing
-   Drag-and-drop URL list
-   Custom PDF page size
-   Watermark removal (only where legally permitted)
-   OCR and searchable PDF
-   Cloud storage integration

## Notes for Claude Code

Please implement: - Clean, modular TypeScript code. - Reusable utility
functions. - Proper error handling. - Responsive UI. - Progress
indicator. - Download streaming where appropriate. - Environment
variable support for cookies or authentication if needed. - Follow
Next.js best practices and keep the codebase production-ready.
