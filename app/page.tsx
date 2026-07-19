"use client";

import { useState } from "react";

type Status = "idle" | "extracting" | "ready" | "downloading" | "error";
type DownloadKind = "zip" | "pdf" | "long-image";

const DOWNLOAD_META: Record<
  DownloadKind,
  { label: string; endpoint: string; filename: string }
> = {
  zip: { label: "Download ZIP", endpoint: "/api/zip", filename: "xhs-images.zip" },
  pdf: { label: "Download PDF", endpoint: "/api/pdf", filename: "xhs-images.pdf" },
  "long-image": {
    label: "Download Long Image",
    endpoint: "/api/long-image",
    filename: "xhs-long.jpg",
  },
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [busyKind, setBusyKind] = useState<DownloadKind | null>(null);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setStatus("extracting");
    setError("");
    setImages([]);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract");
      setImages(data.images);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleDownload(kind: DownloadKind) {
    if (!images.length) return;
    const meta = DOWNLOAD_META[kind];
    setBusyKind(kind);
    setStatus("downloading");
    setError("");
    try {
      const res = await fetch(meta.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = meta.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyKind(null);
    }
  }

  const busy = status === "extracting" || status === "downloading";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Xiaohongshu Post Image Export
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Paste a Xiaohongshu (RED) post link to preview and export its images.
        </p>
      </header>

      <form onSubmit={handleExtract} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.xiaohongshu.com/explore/..."
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-200"
        />
        <button
          type="submit"
          disabled={busy || !url}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {status === "extracting" ? "Extracting…" : "Extract"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <>
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {images.length} image{images.length === 1 ? "" : "s"} found
              </h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DOWNLOAD_META) as DownloadKind[]).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => handleDownload(kind)}
                    disabled={busy}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    {busyKind === kind ? "Preparing…" : DOWNLOAD_META[kind].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((src, i) => (
                <a
                  key={src + i}
                  href={`/api/proxy?url=${encodeURIComponent(src)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(src)}`}
                    alt={`Image ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    {i + 1}
                  </span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500 dark:border-neutral-800">
        Comply with Xiaohongshu's Terms of Service. Only export content you have the right
        to save.
      </footer>
    </main>
  );
}
