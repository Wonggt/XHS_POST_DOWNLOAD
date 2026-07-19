import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["collaboration", "feature", "bug", "other"] as const;

const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  collaboration: "🤝 Collaboration",
  feature: "✨ Feature request",
  bug: "🐞 Bug report",
  other: "💬 Other",
};

interface Cleaned {
  name: string;
  email: string;
  category: (typeof CATEGORIES)[number];
  subject: string;
  message: string;
  receivedAt: string;
  ip: string;
}

async function sendEmail(data: Cleaned): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL;
  const from = process.env.FEEDBACK_FROM_EMAIL ?? "GrabIt <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.log("[feedback] (email not configured — logged only)", data);
    return;
  }

  const subject = `[GrabIt · ${CATEGORY_LABEL[data.category]}] ${data.subject}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#fff;border-radius:16px;border:1px solid #eee">
      <h2 style="margin:0 0 12px;color:#f43f5e">New GrabIt feedback</h2>
      <table style="width:100%;font-size:14px;color:#111">
        <tr><td style="padding:4px 0;color:#666">From</td><td>${escape(data.name)} &lt;${escape(data.email)}&gt;</td></tr>
        <tr><td style="padding:4px 0;color:#666">Category</td><td>${CATEGORY_LABEL[data.category]}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Subject</td><td>${escape(data.subject)}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Received</td><td>${data.receivedAt}</td></tr>
        <tr><td style="padding:4px 0;color:#666">IP</td><td>${escape(data.ip)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <div style="white-space:pre-wrap;line-height:1.6;font-size:14px;color:#111">${escape(data.message)}</div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, category, subject, message } = body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string" ||
      typeof category !== "string" ||
      !CATEGORIES.includes(category as (typeof CATEGORIES)[number])
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const trim = (s: string) => s.trim();
    const cleaned: Cleaned = {
      name: trim(name).slice(0, 200),
      email: trim(email).slice(0, 200),
      category: category as Cleaned["category"],
      subject: trim(subject).slice(0, 300),
      message: trim(message).slice(0, 5000),
      receivedAt: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    };

    if (!cleaned.name || !cleaned.email || !cleaned.subject || !cleaned.message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    try {
      await sendEmail(cleaned);
    } catch (err) {
      console.error("[feedback] email failed", err);
      return NextResponse.json(
        { error: "Failed to send feedback. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
