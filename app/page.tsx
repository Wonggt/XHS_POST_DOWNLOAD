"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONTACT, DICTS, LANGS, type Lang } from "@/lib/i18n";
import { LogoMark } from "@/components/Logo";

type Platform = "xhs" | "instagram" | "tiktok" | "facebook";
type Status = "idle" | "extracting" | "ready" | "downloading" | "error";
type BulkKind = "zip" | "pdf" | "long-image";

interface Tab {
  id: Platform;
  label: string;
  emoji: string;
  placeholder: string;
  supportsBulk: boolean;
  hintKey: "hint_xhs" | "hint_ig" | "hint_tt" | "hint_fb";
  accent: string;
  accentSoft: string;
  ring: string;
}

const TABS: Tab[] = [
  {
    id: "xhs",
    label: "Xiaohongshu",
    emoji: "📕",
    placeholder: "https://www.xiaohongshu.com/explore/…",
    supportsBulk: true,
    hintKey: "hint_xhs",
    accent: "from-rose-500 to-pink-500",
    accentSoft: "bg-rose-50 text-rose-700 ring-rose-200",
    ring: "focus:ring-rose-300",
  },
  {
    id: "tiktok",
    label: "TikTok",
    emoji: "🎵",
    placeholder: "https://www.tiktok.com/@user/video/…",
    supportsBulk: false,
    hintKey: "hint_tt",
    accent: "from-slate-800 via-slate-700 to-cyan-500",
    accentSoft: "bg-slate-100 text-slate-800 ring-slate-300",
    ring: "focus:ring-cyan-300",
  },
];

const BULK_META: Record<BulkKind, { endpoint: string; filename: string; icon: string; labelKey: "bulk_zip" | "bulk_pdf" | "bulk_long" }> = {
  zip: { endpoint: "/api/zip", filename: "images.zip", icon: "🗂️", labelKey: "bulk_zip" },
  pdf: { endpoint: "/api/pdf", filename: "images.pdf", icon: "📄", labelKey: "bulk_pdf" },
  "long-image": { endpoint: "/api/long-image", filename: "long.jpg", icon: "🖼️", labelKey: "bulk_long" },
};

interface TabState {
  url: string;
  images: string[];
  videos: string[];
  selected: Set<string>;
  status: Status;
  error: string;
  busyKind: BulkKind | null;
}

const initialTabState: TabState = {
  url: "",
  images: [],
  videos: [],
  selected: new Set(),
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
  const [lang, setLang] = useState<Lang>("en");
  const [langOpen, setLangOpen] = useState(false);
  const [active, setActive] = useState<Platform>("xhs");
  const [tabs, setTabs] = useState<Record<Platform, TabState>>({
    xhs: { ...initialTabState, selected: new Set() },
    instagram: { ...initialTabState, selected: new Set() },
    tiktok: { ...initialTabState, selected: new Set() },
    facebook: { ...initialTabState, selected: new Set() },
  } as Record<Platform, TabState>);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (saved === "en" || saved === "ms" || saved === "zh") setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = DICTS[lang];
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
    update({
      status: "extracting",
      error: "",
      images: [],
      videos: [],
      selected: new Set(),
    });
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.url, platform: active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract");
      const images: string[] = data.images ?? [];
      update({
        images,
        videos: data.videos ?? [],
        selected: new Set(images),
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
    const chosen = state.images.filter((i) => state.selected.has(i));
    if (!chosen.length) return;
    const meta = BULK_META[kind];
    update({ status: "downloading", error: "", busyKind: kind });
    try {
      const res = await fetch(meta.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: chosen }),
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

  async function handleDownloadAll() {
    const chosen = state.images.filter((i) => state.selected.has(i));
    if (!chosen.length) return;
    for (let i = 0; i < chosen.length; i++) {
      const src = chosen[i];
      const filename = `${active}-image-${i + 1}.jpg`;
      const a = document.createElement("a");
      a.href = `/api/proxy?url=${encodeURIComponent(src)}&download=1&filename=${encodeURIComponent(filename)}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Small stagger so browsers don't collapse the downloads
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  function toggleSelected(src: string) {
    const next = new Set(state.selected);
    if (next.has(src)) next.delete(src);
    else next.add(src);
    update({ selected: next });
  }

  function selectAll() {
    update({ selected: new Set(state.images) });
  }

  function clearSelection() {
    update({ selected: new Set() });
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
  const currentLang = LANGS.find((l) => l.code === lang)!;

  return (
    <div onClick={() => langOpen && setLangOpen(false)}>
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2">
          <LogoMark size={36} />
          <span className="text-lg font-semibold tracking-tight">{t.brand}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#how"
            className="hidden rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 backdrop-blur transition hover:bg-white sm:inline"
          >
            {t.nav_how}
          </a>
          <a
            href="#contact"
            className="hidden rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 backdrop-blur transition hover:bg-white sm:inline"
          >
            {t.nav_contact}
          </a>

          {/* Language switcher */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={t.lang_label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 backdrop-blur transition hover:bg-white"
            >
              <span aria-hidden>🌐</span>
              <span>{currentLang.short}</span>
              <span aria-hidden className={"text-xs transition " + (langOpen ? "rotate-180" : "")}>
                ▾
              </span>
            </button>
            {langOpen && (
              <ul
                role="menu"
                className="absolute right-0 top-full z-10 mt-2 w-40 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200"
              >
                {LANGS.map((l) => (
                  <li key={l.code}>
                    <button
                      role="menuitemradio"
                      aria-checked={l.code === lang}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={
                        "flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-slate-50 " +
                        (l.code === lang ? "font-semibold text-rose-600" : "text-slate-700")
                      }
                    >
                      <span>{l.label}</span>
                      {l.code === lang && <span aria-hidden>✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-4xl px-4 pb-6 pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-rose-600 shadow-soft ring-1 ring-rose-100 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {t.hero_badge}
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {t.hero_title_a}
          <span
            className={
              "text-gradient" + (lang === "zh" ? " whitespace-nowrap" : "")
            }
          >
            {t.hero_title_highlight}
          </span>
          {t.hero_title_b}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          {t.hero_subtitle}
        </p>
      </header>

      {/* Card */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="glass rounded-3xl p-4 shadow-soft ring-1 ring-white/60 sm:p-6">
          <div
            role="tablist"
            className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/70 p-1.5"
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
            {t[tabMeta.hintKey]}
          </p>

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
                    aria-label={t.clear}
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  {t.paste}
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
                  <Spinner /> {t.grabbing}
                </span>
              ) : (
                t.grab
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
              <SectionHeader icon="🎬" title={t.results_videos(state.videos.length)} />
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
                          {t.video_label(i + 1)}
                        </span>
                        <a
                          href={proxied(src, true, filename)}
                          download={filename}
                          className={
                            "rounded-lg bg-gradient-to-br px-3 py-1.5 text-xs font-semibold text-white shadow-pop " +
                            tabMeta.accent
                          }
                        >
                          {t.save_mp4}
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
                <div className="flex items-center gap-3">
                  <SectionHeader icon="🖼️" title={t.results_images(state.images.length)} inline />
                  {tabMeta.supportsBulk && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {t.selected_count(state.selected.size, state.images.length)}
                    </span>
                  )}
                </div>
                {tabMeta.supportsBulk && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={selectAll}
                      disabled={state.selected.size === state.images.length}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {t.select_all}
                    </button>
                    <button
                      onClick={clearSelection}
                      disabled={state.selected.size === 0}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {t.select_none}
                    </button>
                    <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
                    {state.selected.size >= 2 && (
                      <button
                        onClick={handleDownloadAll}
                        disabled={busy}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-4 py-2 text-sm font-semibold text-white shadow-pop transition hover:brightness-110 disabled:opacity-40 " +
                          tabMeta.accent
                        }
                      >
                        <span>⬇️</span>
                        {t.download_all}
                      </button>
                    )}
                    {(Object.keys(BULK_META) as BulkKind[]).map((kind) => (
                      <button
                        key={kind}
                        onClick={() => handleBulkDownload(kind)}
                        disabled={busy || state.selected.size === 0}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-soft ring-1 transition disabled:opacity-40 " +
                          (state.selected.size === 0
                            ? "bg-white text-slate-400 ring-slate-200"
                            : `bg-gradient-to-br text-white ring-transparent ${tabMeta.accent}`)
                        }
                      >
                        <span>{BULK_META[kind].icon}</span>
                        {state.busyKind === kind ? t.preparing : t[BULK_META[kind].labelKey]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tabMeta.supportsBulk && (
                <p className="mb-3 text-xs text-slate-500">{t.select_hint}</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {state.images.map((src, i) => {
                  const filename = `${active}-image-${i + 1}.jpg`;
                  const isSelected = state.selected.has(src);
                  return (
                    <div
                      key={src + i}
                      onClick={() => tabMeta.supportsBulk && toggleSelected(src)}
                      className={
                        "group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-soft ring-1 transition " +
                        (tabMeta.supportsBulk ? "cursor-pointer " : "") +
                        (isSelected || !tabMeta.supportsBulk
                          ? "ring-slate-200"
                          : "opacity-60 ring-slate-200 hover:opacity-80")
                      }
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
                      {tabMeta.supportsBulk && (
                        <span
                          className={
                            "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold shadow-sm ring-2 transition " +
                            (isSelected
                              ? `bg-gradient-to-br text-white ring-white ${tabMeta.accent}`
                              : "bg-white/90 text-transparent ring-white")
                          }
                        >
                          ✓
                        </span>
                      )}
                      <a
                        href={proxied(src, true, filename)}
                        download={filename}
                        onClick={(e) => e.stopPropagation()}
                        className={
                          "absolute bottom-2 right-2 translate-y-1 rounded-full bg-gradient-to-br px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-pop transition group-hover:translate-y-0 group-hover:opacity-100 " +
                          tabMeta.accent
                        }
                      >
                        {t.save}
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
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">{t.how_title}</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600">
          {t.how_subtitle}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: t.step1_title, body: t.step1_body, tint: "from-rose-100 to-orange-100" },
            { step: "02", title: t.step2_title, body: t.step2_body, tint: "from-fuchsia-100 to-sky-100" },
            { step: "03", title: t.step3_title, body: t.step3_body, tint: "from-amber-100 to-emerald-100" },
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
            { icon: "⚡", title: t.feat_fast_t, body: t.feat_fast_b },
            { icon: "🔓", title: t.feat_login_t, body: t.feat_login_b },
            { icon: "🖼️", title: t.feat_hd_t, body: t.feat_hd_b },
            { icon: "📦", title: t.feat_bulk_t, body: t.feat_bulk_b },
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

      {/* Contact */}
      <section id="contact" className="mx-auto mt-20 max-w-5xl px-4">
        <h2 className="text-2xl font-semibold sm:text-3xl">{t.contact_title}</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">{t.contact_subtitle}</p>

        <div className="mt-6 grid gap-4 rounded-3xl bg-white/70 p-4 shadow-soft ring-1 ring-white/60 backdrop-blur sm:p-6">
          <a
            href={CONTACT.telegram}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-4 rounded-2xl p-4 transition hover:bg-sky-50/70"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600">
              <TelegramIcon />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{t.contact_tg_title}</div>
              <div className="text-sm text-slate-600">{t.contact_tg_body}</div>
              <div className="mt-1 text-sm font-medium text-sky-600 group-hover:underline">
                {CONTACT.telegram}
              </div>
            </div>
          </a>

          <Link
            href={CONTACT.feedbackUrl}
            className="group flex items-start gap-4 rounded-2xl p-4 transition hover:bg-emerald-50/70"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <ChatIcon />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{t.contact_fb_title}</div>
              <div className="text-sm text-slate-600">{t.contact_fb_body}</div>
              <div className="mt-1 text-sm font-medium text-emerald-600 group-hover:underline">
                {t.contact_fb_cta}
              </div>
            </div>
          </Link>

          <a
            href={`mailto:${CONTACT.email}`}
            className="group flex items-start gap-4 rounded-2xl p-4 transition hover:bg-violet-50/70"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600">
              <MailIcon />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{t.contact_email_title}</div>
              <div className="text-sm text-slate-600">{t.contact_email_body}</div>
              <div className="mt-1 text-sm font-medium text-violet-600 group-hover:underline">
                {CONTACT.email}
              </div>
            </div>
          </a>
        </div>
      </section>

      <footer className="mx-auto mt-20 max-w-5xl px-4 pb-10 pt-8 text-center text-xs text-slate-500">
        {t.footer}
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

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1L18.5 6c.4-.4-.1-.6-.6-.2L7.4 12.5l-4.9-1.5c-1.1-.3-1.1-1 .2-1.5L20.6 3.1c.9-.3 1.7.2 1.3 1.2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
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
