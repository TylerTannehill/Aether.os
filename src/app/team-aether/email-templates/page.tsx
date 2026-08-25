"use client";

import Link from "next/link";
import { useState } from "react";

const LOGO = "https://aetheros.pro/aether-email-logo.jpg";

const templates = [
  {
    title: "Email 1 - Introduction",
    subject: "Campaign work is complicated. Your operating system shouldn't be.",
    headline: "Campaign work is complicated. Your operating system shouldn't be.",
    body: `Hi {{First Name}},

I'm {{Your Name}} with Team Aether.

We built Aether because campaign teams deserve better than spending long days bouncing between spreadsheets, disconnected software, and information scattered across platforms.

Aether brings Finance, Field, Outreach, Digital, Print, Contacts, Lists, and the tools campaign staff use every day into one Campaign Operating System.

If you're curious, take a look around. If you'd rather see it in action, just reply and we'd be happy to schedule a demo.

Thanks for your time!

— Team Aether`,
    cta: "Explore Aether",
    url: "https://aetheros.pro",
  },
  {
    title: "Email 2 - Follow Up",
    subject: "Following up on Aether",
    headline: "A simpler way to run the work behind the campaign.",
    body: `Hi {{First Name}},

Just checking back in to see if you've had a chance to look at Aether.

Aether was built for the people doing the work behind the campaign — bringing the moving pieces of campaign operations into one place without adding another complicated system to manage.

Aether Academy walks through the platform if you'd like to explore on your own. Or just reply and we'd be happy to schedule a quick demo.

Thanks again!

— Team Aether`,
    cta: "Visit Aether Academy",
    url: "https://aetheros.pro/aether-academy",
  },
  {
    title: "Email 3 - Final Follow Up",
    subject: "One last note about Aether",
    headline: "Built by campaign people. Built for campaign people.",
    body: `Hi {{First Name}},

I wanted to reach out one last time.

Aether was built specifically for campaign teams to simplify day-to-day operations across Finance, Field, Outreach, Digital, Print, Contacts, and Lists.

If you'd like to see what Aether could look like for {{Campaign}}, we'd love to schedule a demo.

Either way, best of luck this campaign season.

— Team Aether`,
    cta: "Explore Aether",
    url: "https://aetheros.pro",
  },
  {
    title: "Demo Scheduling",
    subject: "Let's schedule your Aether demo",
    headline: "Let's get Aether on the calendar.",
    body: `Hi {{First Name}},

Thanks for your interest in Aether.

Send us a few dates and times that work best for you and we'll get a demo on the calendar.

We'll keep it straightforward, show you how Aether works, and leave plenty of time for questions about how it could fit {{Campaign}}.

Looking forward to meeting you!

— Team Aether`,
    cta: "Explore Aether Before Your Demo",
    url: "https://aetheros.pro",
  },
  {
    title: "Provisioned",
    subject: "Welcome to Aether!",
    headline: "Your Aether organization is ready.",
    body: `Hi {{First Name}},

Your organization has been provisioned successfully.

Organization:
{{Organization}}

Username:
{{Username}}

Temporary Password:
{{Password}}

Login:
https://aetheros.pro

Welcome to Team Aether!

— Team Aether`,
    cta: "Log In to Aether",
    url: "https://aetheros.pro",
  },
];

function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function emailHtml(t: typeof templates[number]) {
  const paragraphs = t.body.split(/\n\s*\n/).map(p =>
    `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#334155;">${esc(p).replace(/\n/g,"<br>")}</p>`
  ).join("");

  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:20px;overflow:hidden;">
    <tr><td align="center" style="background:#050505;padding:28px 24px;"><img src="${LOGO}" alt="Aether" width="280" style="display:block;width:280px;max-width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:36px 38px 28px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:#7c3aed;">TEAM AETHER</div>
      <h1 style="margin:10px 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;color:#0f172a;">${esc(t.headline)}</h1>
      ${paragraphs}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:#0f172a;border-radius:12px;"><a href="${t.url}" style="display:inline-block;padding:13px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">${esc(t.cta)}</a></td></tr></table>
    </td></tr>
    <tr><td style="padding:22px 38px 30px;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#64748b;">Clarity. Focus. Execution.<br>Aether Systems LLC · <a href="https://aetheros.pro" style="color:#64748b;">aetheros.pro</a></td></tr>
  </table></td></tr></table></body></html>`;
}

function plainText(t: typeof templates[number]) {
  return `${t.body}\n\n${t.cta}: ${t.url}\n\nClarity. Focus. Execution.\nAether Systems LLC\nhttps://aetheros.pro`;
}

export default function EmailTemplatesPage() {
  const [preview, setPreview] = useState<number | null>(null);
  const [copied, setCopied] = useState("");

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1600);
  }

  async function copyEmail(t: typeof templates[number]) {
    const html = emailHtml(t);
    const text = plainText(t);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopied(t.title);
    setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Team Aether</div>
              <h1 className="mt-4 text-5xl font-bold">Email Templates</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Copy polished, Aether-branded outreach directly into Gmail.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-[430px]">
              <Link href="/team-aether/dashboard" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Dashboard</Link>
              <Link href="/team-aether" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Provisioning</Link>
              <Link href="/team-aether/sales-pipeline" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Sales Pipeline</Link>
              <Link href="/team-aether/support" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Support</Link>
              <Link href="/logout" className="col-span-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">Logout</Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Available Variables</h2>
          <p className="mt-2 text-sm text-slate-500">Replace these values after pasting into Gmail.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["{{First Name}}","{{Your Name}}","{{Campaign}}","{{Organization}}","{{Username}}","{{Password}}","{{Demo Date}}","{{Demo Time}}"].map(v =>
              <span key={v} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">{v}</span>
            )}
          </div>
        </section>

        {templates.map((t, i) => (
          <section key={t.title} className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{t.title}</h2>
                <p className="mt-2 text-sm text-slate-500">Rich HTML with a plain-text fallback.</p>
              </div>
              <button onClick={() => copyEmail(t)} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
                {copied === t.title ? "Copied!" : "Copy Branded Email"}
              </button>
            </div>

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-slate-500">Subject</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{t.subject}</div>
              <button onClick={() => copyText(t.subject, `${t.title}-subject`)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold">
                {copied === `${t.title}-subject` ? "Copied!" : "Copy Subject"}
              </button>
            </div>

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-slate-500">Plain Text</label>
            <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{plainText(t)}</div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => setPreview(preview === i ? null : i)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">
                {preview === i ? "Hide Preview" : "Preview Branded Email"}
              </button>
              <button onClick={() => copyText(plainText(t), `${t.title}-plain`)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">
                {copied === `${t.title}-plain` ? "Copied!" : "Copy Plain Text"}
              </button>
            </div>

            {preview === i && (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 p-3 sm:p-6">
                <iframe title={`${t.title} preview`} srcDoc={emailHtml(t)} className="h-[760px] w-full rounded-2xl bg-white" />
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
