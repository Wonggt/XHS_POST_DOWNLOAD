import { PDFDocument } from "pdf-lib";
import { downloadAll, toJpegBuffers } from "./image";

export async function buildPdf(urls: string[]): Promise<Buffer> {
  const images = await downloadAll(urls);
  const jpegs = await toJpegBuffers(images);

  const pdf = await PDFDocument.create();
  for (const img of jpegs) {
    const embedded = await pdf.embedJpg(img.buffer);
    const w = embedded.width || img.width || 1080;
    const h = embedded.height || img.height || 1440;
    const page = pdf.addPage([w, h]);
    page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
  }
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
