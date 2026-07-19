import JSZip from "jszip";
import { downloadAll } from "./image";

export async function buildZip(urls: string[]): Promise<Buffer> {
  const images = await downloadAll(urls);
  const zip = new JSZip();
  const pad = String(images.length).length;
  images.forEach((img, i) => {
    const name = `image-${String(i + 1).padStart(pad, "0")}.${img.ext}`;
    zip.file(name, img.buffer);
  });
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
