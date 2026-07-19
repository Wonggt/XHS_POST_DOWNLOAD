import sharp from "sharp";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export interface DownloadedImage {
  url: string;
  buffer: Buffer;
  contentType: string;
  ext: string;
}

export async function downloadImage(url: string): Promise<DownloadedImage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: "https://www.xiaohongshu.com/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Image download failed (${res.status}) for ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = extFromType(contentType, url);
  return { url, buffer, contentType, ext };
}

export async function downloadAll(urls: string[]): Promise<DownloadedImage[]> {
  const settled = await Promise.allSettled(urls.map(downloadImage));
  const ok = settled
    .filter((r): r is PromiseFulfilledResult<DownloadedImage> => r.status === "fulfilled")
    .map((r) => r.value);
  if (ok.length === 0) throw new Error("All image downloads failed");
  return ok;
}

function extFromType(ct: string, url: string): string {
  if (/png/i.test(ct)) return "png";
  if (/webp/i.test(ct)) return "webp";
  if (/gif/i.test(ct)) return "gif";
  if (/jpeg|jpg/i.test(ct)) return "jpg";
  const m = url.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

export async function toJpegBuffers(
  images: DownloadedImage[],
): Promise<{ buffer: Buffer; width: number; height: number }[]> {
  return Promise.all(
    images.map(async (img) => {
      const pipe = sharp(img.buffer).rotate();
      const meta = await pipe.metadata();
      const buffer = await pipe.jpeg({ quality: 92 }).toBuffer();
      return { buffer, width: meta.width ?? 0, height: meta.height ?? 0 };
    }),
  );
}

export async function mergeVertical(images: DownloadedImage[]): Promise<Buffer> {
  const prepared = await Promise.all(
    images.map(async (img) => {
      const meta = await sharp(img.buffer).metadata();
      return { buffer: img.buffer, width: meta.width ?? 0, height: meta.height ?? 0 };
    }),
  );

  const targetWidth = Math.max(...prepared.map((p) => p.width || 0));
  if (!targetWidth) throw new Error("Could not read image dimensions");

  const resized = await Promise.all(
    prepared.map(async (p) => {
      const scale = targetWidth / p.width;
      const height = Math.round(p.height * scale);
      const buffer = await sharp(p.buffer)
        .rotate()
        .resize({ width: targetWidth })
        .toBuffer();
      return { buffer, width: targetWidth, height };
    }),
  );

  const totalHeight = resized.reduce((s, r) => s + r.height, 0);
  const composites: sharp.OverlayOptions[] = [];
  let y = 0;
  for (const r of resized) {
    composites.push({ input: r.buffer, top: y, left: 0 });
    y += r.height;
  }

  return sharp({
    create: {
      width: targetWidth,
      height: totalHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}
