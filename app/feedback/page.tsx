"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DICTS, type FeedbackCategory, type Lang } from "@/lib/i18n";
import { LogoMark } from "@/components/Logo";

type Status = "idle" | "sending" | "success" | "error";

const CATEGORIES: FeedbackCategory[] = ["collaboration", "feature", "bug", "other"];

const CATEGORY_ICONS: Record<FeedbackCategory, string> = {
  collaboration: "🤝",
  feature: "✨",
  bug: "🐞",
  other: "💬",
};

export default function FeedbackPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "collaboration" as FeedbackCategory,
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (saved === "en" || saved === "ms" || saved === "zh") setLang(saved);
  }, []);

  const t = DICTS[lang];

  const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
    collaboration: t.fb_cat_collab,
    feature: t.fb_cat_feature,
    bug: t.fb_cat_bug,
    other: t.fb_cat_other,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t.fb_error);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.fb_error);
    }
  }

  function reset() {
    setForm({
      name: "",
      email: "",
      category: "collaboration",
      subject: "",
      message: "",
    });
    setStatus("idle");
    setError("");
  }

  return (
    <div onClick={() => dropdownOpen && setDropdownOpen(false)}>
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 backdrop-blur transition hover:bg-white"
        >
          {t.fb_back}
        </Link>
        <div className="flex items-center gap-2">
          <LogoMark size={36} />
          <span className="text-lg font-semibold tracking-tight">{t.brand}</span>
        </div>
      </nav>

      <header className="mx-auto max-w-3xl px-4 pb-4 pt-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 shadow-soft ring-1 ring-emerald-100 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t.fb_page_title}
        </span>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {t.fb_page_title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
          {t.fb_page_subtitle}
        </p>
      </header>

      <section className="mx-auto max-w-2xl px-4 pb-16">
        {status === "success" ? (
          <div className="glass rounded-3xl p-8 text-center shadow-soft ring-1 ring-white/60">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl text-white shadow-pop">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-semibold">{t.fb_success_title}</h2>
            <p className="mt-2 text-sm text-slate-600">{t.fb_success_body}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-soft ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {t.fb_success_again}
              </button>
              <Link
                href="/"
                className="rounded-full bg-gradient-to-br from-rose-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-pop"
              >
                {t.fb_back.replace("← ", "")}
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="glass space-y-5 rounded-3xl p-6 shadow-soft ring-1 ring-white/60 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.fb_name}>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t.fb_name_ph}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-4 focus:ring-rose-200"
                />
              </Field>
              <Field label={t.fb_email}>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t.fb_email_ph}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-4 focus:ring-rose-200"
                />
              </Field>
            </div>

            <Field label={t.fb_category}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[form.category]}</span>
                    <span className="font-medium text-slate-900">
                      {CATEGORY_LABEL[form.category]}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={"text-slate-400 transition " + (dropdownOpen ? "rotate-180" : "")}
                  >
                    ▾
                  </span>
                </button>
                {dropdownOpen && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200"
                  >
                    {CATEGORIES.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={form.category === c}
                          onClick={() => {
                            setForm({ ...form, category: c });
                            setDropdownOpen(false);
                          }}
                          className={
                            "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 " +
                            (form.category === c
                              ? "bg-rose-50/60 font-semibold text-rose-700"
                              : "text-slate-700")
                          }
                        >
                          <span className="text-lg">{CATEGORY_ICONS[c]}</span>
                          <span className="flex-1">{CATEGORY_LABEL[c]}</span>
                          {form.category === c && <span aria-hidden>✓</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>

            <Field label={t.fb_subject}>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={t.fb_subject_ph}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-4 focus:ring-rose-200"
              />
            </Field>

            <Field label={t.fb_message}>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t.fb_message_ph}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-transparent focus:ring-4 focus:ring-rose-200"
              />
            </Field>

            {status === "error" && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                <span>⚠️</span>
                <span>{error || t.fb_error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 px-6 py-3.5 text-sm font-semibold text-white shadow-pop transition hover:brightness-110 disabled:opacity-50"
            >
              {status === "sending" ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner /> {t.fb_sending}
                </span>
              ) : (
                t.fb_submit
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
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
