"use client";

import { useState } from "react";

type Platform = "xhs" | "instagram" | "tiktok" | "facebook";
type Status = "idle" | "extracting" | "ready" | "downloading" | "error";
type BulkKind = "zip" | "pdf" | "long-image";

interface Tab {
  id: Platform;
  label: string;
  short: string;
  emoji: string;
  placeholder: string;
  supportsBulk: boolean;
  hint: string;
  accent: string;
  accentSoft: string;
  ring: string;
}

const TABS: Tab[] = [
  {
    id: "xhs",
    label: "Xiaohongshu",
    short: "小红书",
    emoji: "📕",
    placeholder: "https://www.xiaohongshu.com/explore/…",
    supportsBulk: true,
    hint: "Save photos and videos from any public Xiaohongshu post.",
    accent: "from-rose-500 to-pink-500",
    accentSoft: "bg-rose-50 text-rose-700 ring-rose-200",
    ring: "focus:ring-rose-300",
  },
  {
    id: "instagram",
    label: "Instagram",
    short: "IG",
    emoji: "📸",
    placeholder: "https://www.instagram.com/p/… or /reel/…",
    supportsBulk: true,
    hint: "Grab photos, Reels, and carousel posts in original quality.",
    accent: "from-fuchsia-500 via-pink-500 to-orange-400",
    accentSoft: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
    ring: "focus:ring-fuchsia-300",
  },
  {
    id: "tiktok",
    label: "TikTok",
    short: "TT",
    emoji: "🎵",
    placeholder: "https://www.tiktok.com/@user/video/…",
    supportsBulk: false,
    hint: "Download TikTok videos without watermark, plus the cover image.",
    accent: "from-slate-800 via-slate-700 to-cyan-500",
    accentSoft: "bg-slate-100 text-slate-800 ring-slate-300",
    ring: "focus:ring-cyan-300",
  },
  {
    id: "facebook",
    label: "Facebook",
    short: "FB",
    emoji: "👍",
    placeholder: "https://www.facebook.com/… or fb.watch/…",
    supportsBulk: true,
    hint: "Save photos and videos from public Facebook posts and Reels.",
    accent: "from-blue-600 to-sky-400",
    accentSoft: "bg-blue-50 text-blue-700 ring-blue-200",
    ring: "focus:ring-blue-300",
  },
];

const BULK_META: Record<BulkKind, { label: string; endpoint: string; filename: string; icon: string }> = {
  zip: { label: "ZIP", endpoint: "/api/zip", filename: "images.zip", icon: "🗂️" },
  pdf: { label: "PDF", endpoint: "/api/pdf", filename: "images.pdf", icon: "📄" },
  "long-image": {
    label: "Long Image",
    endpoint: "/api/long-image",
    filename: "long.jpg",
    icon: "🖼️",
  },
};

interface TabState {
  url: string;
  images: string[];
  videos: string[];
  status: Status;
  error: string;
  busyKind: BulkKind | null;
}

const initialTabState: TabState = {
  url: "",
  images: [],
  videos: [],
  status: "idle",
  error: "",
  busyKind: null,
};

function proxied(url: string, download = false, filename?: string) {
  const params = new URLSearchParams({ url });
  if (download) params.set("download", "1");
  if (filename) params.set("filename", filename);
  return `/api/proxy?${params.toString()}`;
}

export default function Home() {
  const [active, setActive] = useState<Platform>("xhs");
  const [tabs, setTabs] = useState<Record<Platform, TabState>>({
    xhs: { ...initialTabState },
    instagram: { ...initialTabState },
    tiktok: { ...initialTabState },
    facebook: { ...initialTabState },
  });

  const state = tabs[active];
  const tabMeta = TABS.find((t) => t.id === active)!;
  const busy = state.status === "extracting" || state.status === "downloading";

  function update(patch: Partial<TabState>) {
    setTabs((prev) => ({ ...prev, [active]: { ...prev[active], ...patch } }));
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) update({ url: text.trim() });
    } catch {
      /* ignore */
    }
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    update({ status: "extracting", error: "", images: [], videos: [] });
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.url, platform: active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract");
      update({
        images: data.images ?? [],
        videos: data.videos ?? [],
        status: "ready",
      });
    } catch (err) {
      update({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleBulkDownload(kind: BulkKind) {
    if (!state.images.length) return;
    const meta = BULK_META[kind];
    update({ status: "downloading", error: "", busyKind: kind });
    try {
      const res = await fetch(meta.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: state.images }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      triggerDownload(blob, `${active}-${meta.filename}`);
      update({ status: "ready", busyKind: null });
    } catch (err) {
      update({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        busyKind: null,
      });
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  const hasResults = state.images.length > 0 || state.videos.length > 0;

  return (
    <div>
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 text-lg text-white shadow-pop">
            ✦
          </div>
          <span className="text-lg font-semibold tracking-tight">GrabIt</span>
        </div>
        <a
          href="#how"
          className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 backdrop-blur transition hover:bg-white"
        >
          How it works
        </a>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-4 pb-6 pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-rose-600 shadow-soft ring-1 ring-rose-100 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> No login · No watermark · Free
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Save any post as <span className="text-gradient">photos or video</span>
          <br className="hidden sm:block" /> in one click.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Paste a link from Xiaohongshu, Instagram, TikTok, or Facebook — preview, then
          download as ZIP, PDF, long image, or MP4.
        </p>
      </header>

      {/* Card */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="glass rounded-3xl p-4 shadow-soft ring-1 ring-white/60 sm:p-6">
          {/* Tabs */}
          <div
            role="tablist"
            className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/70 p-1.5 sm:grid-cols-4"
          >
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(tab.id)}
                  className={
                    "relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                    (isActive
                      ? `bg-gradient-to-br ${tab.accent} text-white shadow-pop`
                      : "text-slate-600 hover:bg-white")
                  }
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <p className={"mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium ring-1 " + tabMeta.accentSoft}>
            {tabMeta.hint}
          </p>

          {/* Input */}
          <form onSubmit={handleExtract} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="url"
                required
                value={state.url}
                onChange={(e) => update({ url: e.target.value })}
                placeholder={tabMeta.placeholder}
                className={
                  "w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 pr-24 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-4 " +
                  tabMeta.ring
                }
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                {state.url && (
                  <button
                    type="button"
                    onClick={() => update({ url: "" })}
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Paste
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy || !state.url}
              className={
                "rounded-2xl bg-gradient-to-br px-6 py-3.5 text-sm font-semibold text-white shadow-pop transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 " +
                tabMeta.accent
              }
            >
              {state.status === "extracting" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Extracting…
                </span>
              ) : (
                "Grab it →"
              )}
            </button>
          </form>

          {state.error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {hasResults && (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          {state.videos.length > 0 && (
            <div className="mb-8">
              <SectionHeader
                icon="🎬"
                title={`${state.videos.length} video${state.videos.length === 1 ? "" : "s"}`}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {state.videos.map((src, i) => {
                  const filename = `${active}-video-${i + 1}.mp4`;
                  return (
                    <div
                      key={src + i}
                      className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200"
                    >
                      <video
                        controls
                        preload="metadata"
                        src={proxied(src)}
                        className="aspect-video w-full bg-black"
                      />
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <span className="text-xs font-medium text-slate-500">
                          Video {i + 1}
                        </span>
                        <a
                          href={proxied(src, true, filename)}
                          download={filename}
                          className={
                            "rounded-lg bg-gradient-to-br px-3 py-1.5 text-xs font-semibold text-white shadow-pop " +
                            tabMeta.accent
                          }
                        >
                          ↓ MP4
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {state.images.length > 0 && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <SectionHeader
                  icon="🖼️"
                  title={`${state.images.length} image${state.images.length === 1 ? "" : "s"}`}
                  inline
                />
                {tabMeta.supportsBulk && (
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(BULK_META) as BulkKind[]).map((kind) => (
                      <button
                        key={kind}
                        onClick={() => handleBulkDownload(kind)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <span>{BULK_META[kind].icon}</span>
                        {state.busyKind === kind ? "Preparing…" : BULK_META[kind].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {state.images.map((src, i) => {
                  const filename = `${active}-image-${i + 1}.jpg`;
                  return (
                    <div
                      key={src + i}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proxied(src)}
                        alt={`Image ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                        {i + 1}
                      </span>
                      <a
                        href={proxied(src, true, filename)}
                        download={filename}
                        className={
                          "absolute bottom-2 right-2 translate-y-1 rounded-full bg-gradient-to-br px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-pop transition group-hover:translate-y-0 group-hover:opacity-100 " +
                          tabMeta.accent
                        }
                      >
                        ↓ Save
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mx-auto mt-20 max-w-5xl px-4">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          Three steps. That's it.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600">
          Every platform, same simple flow.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Copy the link",
              body: "Tap Share on any post and copy its link.",
              tint: "from-rose-100 to-orange-100",
            },
            {
              step: "02",
              title: "Paste & parse",
              body: "Pick the platform, paste the URL, hit Grab it.",
              tint: "from-fuchsia-100 to-sky-100",
            },
            {
              step: "03",
              title: "Download",
              body: "Save individual media, ZIP, PDF, or a long image.",
              tint: "from-amber-100 to-emerald-100",
            },
          ].map((s) => (
            <div
              key={s.step}
              className={
                "rounded-3xl bg-gradient-to-br p-6 shadow-soft ring-1 ring-white/60 " + s.tint
              }
            >
              <div className="text-xs font-semibold text-slate-500">{s.step}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{s.title}</div>
              <div className="mt-1 text-sm text-slate-700">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "⚡", title: "Fast", body: "Direct CDN streaming, no queue." },
            { icon: "🔓", title: "No login", body: "Works out-of-the-box for public posts." },
            { icon: "🖼️", title: "HD quality", body: "Original files, not screenshots." },
            { icon: "📦", title: "Bulk export", body: "ZIP, PDF, or one long image." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white/70 p-4 shadow-soft ring-1 ring-slate-200 backdrop-blur"
            >
              <div className="text-2xl">{f.icon}</div>
              <div className="mt-2 font-semibold">{f.title}</div>
              <div className="text-sm text-slate-600">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-20 max-w-5xl px-4 pb-10 pt-8 text-center text-xs text-slate-500">
        Please respect each platform's Terms of Service. Only download content you have
        the right to save.
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({
  icon,
  title,
  inline = false,
}: {
  icon: string;
  title: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "mb-3"}>
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span>{icon}</span> {title}
      </h2>
    </div>
  );
}
