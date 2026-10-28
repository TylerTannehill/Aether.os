"use client";

import { useState } from "react";
import { Download, Mail, Phone, Share2, Globe2 } from "lucide-react";

const CARD_URL = "https://aetheros.pro/tyler";

export default function TylerCardPage() {
  const [copied, setCopied] = useState(false);

  function saveContact() {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Tannehill;Tyler;;;",
      "FN:Tyler Tannehill",
      "ORG:Aether Systems LLC",
      "TITLE:Founder & CEO - The Architect",
      "TEL;TYPE=CELL:+13312232374",
      "EMAIL;TYPE=WORK:team@aetheros.pro",
      `URL:${CARD_URL}`,
      "END:VCARD",
    ].join("\r\n") + "\r\n";
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Tyler-Tannehill.vcf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareCard() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tyler Tannehill | Aether Systems", url: CARD_URL });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(CARD_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", CARD_URL);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111F] px-3 py-5 text-white sm:px-5 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-700/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-28 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[440px]">
        <div className="overflow-hidden rounded-[1.6rem] sm:rounded-[2rem] border border-violet-400/35 bg-gradient-to-b from-[#211348] via-[#11162F] to-[#0A1425] shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center border-b border-white/10 px-3 py-4 sm:px-5">
            <div className="flex h-24 min-w-0 items-center justify-center overflow-hidden">
              <img src="/aether-logo-full.png" alt="Aether.OS" className="h-full w-full translate-y-[9px] scale-[1.75] object-contain drop-shadow-[0_0_16px_rgba(139,92,246,0.35)]" />
            </div>
            <div className="h-12 w-px bg-white/15" />
            <div className="flex h-24 min-w-0 items-center justify-center overflow-hidden">
              <img src="/social-branding-transparent.png" alt="Aether Social" className="h-full w-full scale-[1.008] object-contain drop-shadow-[0_0_16px_rgba(139,92,246,0.35)]" />
            </div>
          </div>

          <div className="px-5 pb-6 pt-6 text-center sm:px-9 sm:pb-7 sm:pt-7">
            <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-violet-300">Aether Systems LLC</p>
            <h1 className="mt-2 text-[clamp(1.65rem,7vw,2.25rem)] font-black tracking-tight">Tyler Tannehill</h1>
            <p className="mt-2 text-base font-medium text-slate-200">Founder &amp; CEO - The Architect</p>
            <p className="mt-4 text-sm text-slate-400">Clarity. Focus. Execution.</p>

            <div className="mt-7 space-y-3 text-left">
              <a href="tel:+13312232374" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm transition hover:border-violet-400/60 hover:bg-white/10"><Phone className="h-5 w-5 text-violet-300" /><span>(331) 223-2374</span></a>
              <a href="mailto:team@aetheros.pro" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm transition hover:border-violet-400/60 hover:bg-white/10"><Mail className="h-5 w-5 text-violet-300" /><span>team@aetheros.pro</span></a>
              <a href="https://aetheros.pro" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm transition hover:border-violet-400/60 hover:bg-white/10"><Globe2 className="h-5 w-5 text-violet-300" /><span>aetheros.pro</span></a>
            </div>

            <button type="button" onClick={saveContact} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 text-base font-extrabold shadow-lg shadow-violet-950/40 transition hover:brightness-110"><Download className="h-5 w-5" />Save Contact</button>
            <button type="button" onClick={shareCard} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/40 bg-white/[0.05] px-5 py-3.5 text-sm font-bold transition hover:bg-white/10"><Share2 className="h-4 w-4" />{copied ? "Link copied!" : "Share Card"}</button>

            <div className="mt-8 border-t border-white/10 pt-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Scan to connect</p>
              <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3">
                <img src="/tyler-qr.png" alt="QR code linking to aetheros.pro/tyler" className="block h-44 w-44 max-w-full" />
              </div>
              <p className="mt-4 text-xs text-slate-400">aetheros.pro/tyler</p>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">© 2026 Aether Systems LLC</p>
      </div>
    </main>
  );
}
