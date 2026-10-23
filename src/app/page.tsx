"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, GraduationCap, Landmark, Sparkles, Users, UserRound, X, ArrowRight } from "lucide-react";

const footerGroups = [
  { title: "Aether Political", links: [
    ["Political Overview", "/political-public"],
    ["Pricing & Sales", "/political-public/sales"],
    ["Explore Abe", "/political-public/explore-abe"],
    ["Abe's Brief", "/political-public/political-abe"],
    ["Political FAQ", "/political-public/faq"],
    ["Team Aether", "/political-public/team-aether"],
    ["Campaign Directory", "/campaign-directory"],
  ] },
  { title: "Aether Business", links: [
    ["Business Overview", "/business-public"],
    ["Pricing & Sales", "/business-public/sales"],
    ["Explore Abe", "/business-public/explore-abe"],
    ["Abe's Brief", "/business-public/business-abe"],
    ["Business FAQ", "/business-public/faq"],
    ["Team Aether", "/business-public/team-aether"],
  ] },
  { title: "Aether Social", links: [
    ["Social Overview", "/social-public"],
    ["Individual Sign In & Sign Up", "/login-social"],
    ["Employer Sign In & Sign Up", "/login-social/employer-login"],
    ["Advertising", "/login-social/ad-purchasing"],
  ] },
  { title: "Aether Academy", links: [
    ["Academy Home", "/aether-academy"],
    ["Political Academy", "/aether-academy/political-academy"],
    ["Business Academy", "/aether-academy/business-academy"],
    ["Articles", "/aether-academy/articles"],
    ["Blog", "/aether-academy/blog"],
    ["Patch Notes", "/aether-academy/patch-notes"],
  ] },
  { title: "Aether Resources", links: [
    ["Enter Aether", "/login"],
    ["Contact & Support", "/support"],
    ["Security", "/security"],
    ["Privacy Policy", "/privacy"],
    ["Terms of Service", "/terms"],
    ["Data Deletion", "/aether-academy/data-deletion"],
  ] },
];

export default function HomePage() {
  const [infographicClicks, setInfographicClicks] = useState(0);
  const [personalPreviewOpen, setPersonalPreviewOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<"Social" | "Personal" | null>(null);
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  const handleInfographicClick = () => {
    const nextClicks = infographicClicks + 1;
    if (nextClicks >= 3) {
      setInfographicClicks(0);
      setPersonalPreviewOpen(true);
      return;
    }
    setInfographicClicks(nextClicks);
  };

  const handleEasterEggClick = () => {
    const nextClicks = easterEggClicks + 1;
    if (nextClicks >= 3) {
      setEasterEggClicks(0);
      setEasterEggOpen(true);
      return;
    }
    setEasterEggClicks(nextClicks);
  };

  const liveButton = "group flex min-h-[66px] items-center justify-center gap-4 rounded-[1.15rem] border border-violet-400/40 bg-gradient-to-br from-violet-600/35 via-violet-600/15 to-blue-600/15 px-4 py-2.5 text-center shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-300/70 hover:bg-violet-500/25 sm:px-5";
  const dormantButton = "flex min-h-[66px] w-full items-center justify-center gap-4 rounded-[1.15rem] border border-white/10 bg-white/[0.025] px-4 py-2.5 text-center text-slate-500 transition hover:border-white/20 sm:px-5";
  const infoCard = "relative rounded-[1.1rem] border border-white/10 bg-white/[0.035] p-3 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-4";
  const clickableInfoCard = infoCard + " group cursor-pointer border-violet-400/50 bg-gradient-to-br from-violet-700/35 via-violet-800/20 to-blue-700/20 shadow-[0_12px_32px_rgba(76,29,149,0.18)] transition-all duration-200 hover:-translate-y-1 hover:border-violet-300/80 hover:from-violet-600/45 hover:via-violet-700/30 hover:to-blue-600/30 hover:shadow-[0_18px_45px_rgba(109,40,217,0.28)] focus-within:border-violet-300";

  return (
    <main id="top" className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-160px] top-[-160px] h-[520px] w-[520px] rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[560px] w-[560px] rounded-full bg-blue-600/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col px-5 py-5 lg:px-9">
        <header className="relative flex flex-col items-center pb-7 pt-0 lg:pb-9">
          <div className="relative flex w-full min-h-[190px] items-start justify-center sm:min-h-[215px] lg:min-h-[235px]">
            {/* Desktop branding: unchanged. */}
            <div className="absolute left-1/2 top-0 hidden w-[min(62vw,650px)] -translate-x-1/2 items-center justify-center gap-2 sm:gap-5 lg:flex lg:gap-8">
              <Link href="/" aria-label="Aether Systems homepage" className="block w-[46%] shrink-0 transition hover:opacity-95">
                <img src="/aether-logo-full.png" alt="Aether Systems" className="h-auto w-full origin-center scale-[1.30] translate-y-[10px] object-contain drop-shadow-[0_0_35px_rgba(139,92,246,0.4)]" />
              </Link>
              <div className="flex w-[46%] shrink-0 items-center justify-center" aria-label="Aether Social branding">
                <img src="/social-branding-transparent.png" alt="Aether Social" className="h-auto w-full -translate-y-[12px] object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.25)]" />
              </div>
            </div>
            {/* Mobile/tablet branding: below the store badges and Enter Aether,
                centered side by side without overlapping either control. */}
            <div className="absolute inset-x-0 top-[88px] flex items-center justify-center gap-3 px-1 sm:top-[92px] sm:gap-6 lg:hidden">
              <Link href="/" aria-label="Aether Systems homepage" className="flex w-[45%] max-w-[180px] items-center justify-center transition hover:opacity-95">
                <img src="/aether-logo-full.png" alt="Aether Systems" className="h-[82px] w-full origin-center scale-[1.85] object-contain drop-shadow-[0_0_25px_rgba(139,92,246,0.4)] sm:h-[100px] sm:scale-[1.65]" />
              </Link>
              <div className="flex w-[45%] max-w-[180px] items-center justify-center" aria-label="Aether Social branding">
                <img src="/social-branding-transparent.png" alt="Aether Social" className="h-[82px] w-full object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.25)] sm:h-[100px]" />
              </div>
            </div>
            <div className="absolute left-0 top-0 flex flex-col items-start gap-2.5">
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-200 sm:text-xs">Aether for Work</span>
                <div className="flex items-center gap-2">
                  <a href="https://apps.apple.com/us/app/aether-mobile/id6814591434" target="_blank" rel="noopener noreferrer" aria-label="Download Aether for Work on the App Store" className="transition hover:opacity-85"><img src="/apple-appstore.png" alt="Download on the App Store" className="h-[25px] w-auto object-contain sm:h-[32px] lg:h-[36px]" /></a>
                  <a href="https://play.google.com/store/apps/details?id=pro.aetheros.mobile" target="_blank" rel="noopener noreferrer" aria-label="Get Aether for Work on Google Play" className="transition hover:opacity-85"><img src="/google-play.png" alt="Get it on Google Play" className="h-[25px] w-auto object-contain sm:h-[32px] lg:h-[36px]" /></a>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs">
                <span className="font-extrabold uppercase tracking-[0.14em] text-violet-200">Aether Social</span>
                <span className="text-slate-400">Coming Soon</span>
              </div>
            </div>
            <Link href="/login" className="absolute right-0 top-0 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/70 bg-violet-700/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.06em] text-white transition hover:bg-violet-600/35 sm:px-4 sm:py-2.5 sm:text-xs">
              Enter Aether
            </Link>
          </div>
          <div className="max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300 sm:text-xs">Aether Systems LLC</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">One philosophy. One expanding ecosystem</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">Clarity. Focus. Execution. For every aspect of life.</p>
          </div>
        </header>

        <section aria-label="Explore Aether products" className="mx-auto w-full max-w-5xl pb-10">
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/political-public" className={liveButton}>
              <span className="flex items-center justify-center gap-4"><img src="/aether-logo-full.png" alt="Aether.OS" className="h-[54px] w-[92px] shrink-0 scale-[2.05] translate-y-[6px] object-contain" /><span className="text-left"><span className="block text-base font-black sm:text-lg">Political</span><span className="mt-1 block text-sm text-violet-100">Explore the Political OS</span></span></span>
            </Link>
            <Link href="/business-public" className={liveButton}>
              <span className="flex items-center justify-center gap-4"><img src="/aether-logo-full.png" alt="Aether.OS" className="h-[54px] w-[92px] shrink-0 scale-[2.05] translate-y-[6px] object-contain" /><span className="text-left"><span className="block text-base font-black sm:text-lg">Business</span><span className="mt-1 block text-sm text-violet-100">Explore the Business OS</span></span></span>
            </Link>
            <Link href="/social-public" aria-label="Explore Aether Social" className={liveButton}>
              <img src="/social-branding-transparent.png" alt="Aether Social" className="h-[58px] w-auto max-w-[75%] scale-[1.45] object-contain" />
            </Link>
            <button type="button" onClick={() => setComingSoon("Personal")} aria-label="Aether Personal, in development" aria-disabled="true" className={dormantButton}>
              <span className="flex items-center justify-center gap-4"><UserRound className="h-6 w-6 shrink-0" /><span><span className="block text-base font-black sm:text-lg">In Development</span><span className="mt-1 block text-sm">Aether Personal · Coming Soon</span></span></span>
            </button>
            <Link href="/aether-academy" className="group mx-auto flex min-h-[66px] w-full max-w-[560px] items-center justify-center gap-4 rounded-[1.15rem] border border-violet-300/50 bg-gradient-to-r from-violet-600/30 via-violet-500/20 to-blue-600/25 px-6 py-2.5 text-center text-lg font-black transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-500/25 sm:text-xl md:col-span-2">
              <img src="/aether-logo-full.png" alt="Aether.OS" className="h-[54px] w-[92px] shrink-0 scale-[2.05] translate-y-[6px] object-contain" /><span>Academy</span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="ecosystem-heading" className="mx-auto w-full max-w-5xl pb-8">
          <div className="mb-3 text-center"><p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">The Aether Ecosystem</p><h2 id="ecosystem-heading" className="mt-2 text-2xl font-black sm:text-3xl">Built for the way you work.</h2></div>
          <div className="grid gap-3 md:grid-cols-2">
            <article className={clickableInfoCard}><Link href="/ecosystem#political" aria-label="Learn more about Aether Political" className="absolute inset-0 z-10 rounded-[1.1rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" /><div className="flex items-start justify-between gap-3"><Landmark className="h-6 w-6 text-white" /><Link href="/political-public" className="relative z-20 inline-flex items-center gap-2 rounded-lg border border-white/85 bg-white/10 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:border-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore Political <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><h3 className="mt-2 text-base font-bold">Aether Political</h3><p className="mt-1.5 text-sm leading-5 text-slate-300">A connected operating environment for campaigns, bringing fundraising, field, outreach, digital, print, contacts, and execution together. Built to help teams see what matters and act on it.</p></article>
            <article className={clickableInfoCard}><Link href="/ecosystem#business" aria-label="Learn more about Aether Business" className="absolute inset-0 z-10 rounded-[1.1rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" /><div className="flex items-start justify-between gap-3"><Building2 className="h-6 w-6 text-white" /><Link href="/business-public" className="relative z-20 inline-flex items-center gap-2 rounded-lg border border-white/85 bg-white/10 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:border-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore Business <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><h3 className="mt-2 text-base font-bold">Aether Business</h3><p className="mt-1.5 text-sm leading-5 text-slate-300">A practical operational home for businesses to connect customer relationships, marketing, finance, inventory, and dispatch. One workspace for clearer priorities and coordinated daily work.</p></article>
            <article className={clickableInfoCard}><Link href="/ecosystem#social" aria-label="Learn more about Aether Social" className="absolute inset-0 z-10 rounded-[1.1rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" /><div className="flex items-start justify-between gap-3"><Users className="h-6 w-6 text-white" /><Link href="/social-public" className="relative z-20 inline-flex items-center gap-2 rounded-lg border border-white/85 bg-white/10 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:border-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore Social <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><h3 className="mt-2 text-base font-bold">Aether Social</h3><p className="mt-1.5 text-sm leading-5 text-slate-300">Connect, share, and express yourself through two experiences: Professional and Personal. Build your professional presence and stay connected with the people who matter.</p></article>
            <article className={infoCard + " opacity-65"}><UserRound className="h-6 w-6 text-slate-400" /><h3 className="mt-2 text-base font-bold">Aether Personal</h3><p className="mt-1.5 text-sm leading-5 text-slate-400">Under Development — Coming Soon.</p></article>
            <article className={clickableInfoCard + " text-center md:col-span-2"}><Link href="/ecosystem#academy" aria-label="Learn more about Aether Academy" className="absolute inset-0 z-10 rounded-[1.1rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" /><GraduationCap className="mx-auto h-7 w-7 text-white" /><h3 className="mt-2 text-base font-bold">Aether Academy</h3><p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-slate-300">Explore documentation, guides, and walkthroughs designed to help you understand the Aether platform and make confident use of its tools. Learning belongs alongside execution.</p><Link href="/aether-academy" className="relative z-20 mt-3 inline-flex items-center gap-2 rounded-lg border border-white/85 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore the Academy <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>
          </div>
        </section>

        {/* The ecosystem vision is contained in the transparent infographic. */}
        <section aria-label="Aether ecosystem vision" className="mx-auto w-full max-w-5xl pb-12">
          <div className="rounded-[1.6rem] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-blue-500/10 px-5 py-7 shadow-xl shadow-black/10 backdrop-blur-xl sm:px-9 sm:py-9">
            <img
              onClick={handleInfographicClick}
              src="/infographic.png"
              alt="The Aether Ecosystem: Political, Business, Social, Personal, and Academy connected around Aether OS, with the vision and what it means for people and organizations."
              className="block h-auto w-full object-contain"
            />
          </div>
        </section>

        <footer className="border-t border-white/10 py-10">
          <div className="grid gap-x-5 gap-y-7 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-bold text-white">{group.title}</h3>
                <div className="mt-3 flex flex-col gap-2 text-[13px] leading-5 text-slate-300">
                  {group.links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-violet-200">{label}</Link>)}
                </div>
              </div>
            ))}
            <div className="opacity-55"><h3 className="text-sm font-bold text-white">Aether Personal</h3><p className="mt-3 text-[13px] text-slate-400">Coming Soon</p></div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                  Follow Team Aether
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Find Aether across our official social channels.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href="https://x.com/AetherOSPro" target="_blank" rel="noopener noreferrer" aria-label="Aether on X" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10 hover:scale-105">
                  <span className="text-xl font-black">X</span>
                </a>

                <a href="https://www.facebook.com/profile.php?id=61593622714798" target="_blank" rel="noopener noreferrer" aria-label="Aether on Facebook" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10 hover:scale-105">
                  <span className="text-2xl font-black lowercase">f</span>
                </a>

                <a href="https://www.instagram.com/team_aetheros/" target="_blank" rel="noopener noreferrer" aria-label="Aether on Instagram" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10 hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>

                <a href="https://www.tiktok.com/@team.aetheros" target="_blank" rel="noopener noreferrer" aria-label="Aether on TikTok" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10 hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M15.5 3c.35 2.35 1.65 3.8 4 4.25v3.1c-1.55-.05-2.9-.5-4-1.25v6.15a5.25 5.25 0 1 1-4.5-5.2v3.2a2.15 2.15 0 1 0 1.35 2V3h3.15Z" />
                  </svg>
                </a>

                <a href="https://www.youtube.com/@AetherOSPro" target="_blank" rel="noopener noreferrer" aria-label="Aether on YouTube" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/50 hover:bg-violet-500/10 hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
                    <path d="M21.6 7.2a2.9 2.9 0 0 0-2.05-2.05C17.75 4.65 12 4.65 12 4.65s-5.75 0-7.55.5A2.9 2.9 0 0 0 2.4 7.2 30 30 0 0 0 1.9 12a30 30 0 0 0 .5 4.8 2.9 2.9 0 0 0 2.05 2.05c1.8.5 7.55.5 7.55.5s5.75 0 7.55-.5a2.9 2.9 0 0 0 2.05-2.05 30 30 0 0 0 .5-4.8 30 30 0 0 0-.5-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
            <button
              type="button"
              onClick={handleEasterEggClick}
              className="appearance-none border-0 bg-transparent p-0 font-inherit text-inherit"
              aria-label="Copyright notice"
            >
              © 2026 Aether Systems LLC. All rights reserved.
            </button>
          </div>
        </footer>
      </div>

      {personalPreviewOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm" onClick={() => setPersonalPreviewOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="personal-preview-title" className="relative w-full max-w-md rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-10 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close" onClick={() => setPersonalPreviewOpen(false)} className="absolute right-5 top-5 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button>
            <Sparkles className="mx-auto h-9 w-9 text-violet-300" />
            <h2 id="personal-preview-title" className="mt-5 text-3xl font-black">Aether Personal is on the way...</h2>
            <p className="mt-4 leading-7 text-slate-300">The next chapter of the Aether ecosystem is taking shape. Stay tuned.</p>
            <button type="button" onClick={() => setPersonalPreviewOpen(false)} className="mt-7 rounded-xl bg-violet-600 px-6 py-3 font-bold transition hover:bg-violet-500">Close</button>
          </div>
        </div>
      )}
      {comingSoon && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm" onClick={() => setComingSoon(null)}><div role="dialog" aria-modal="true" aria-labelledby="coming-soon-title" className="relative w-full max-w-md rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-10 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close" onClick={() => setComingSoon(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button><Sparkles className="mx-auto h-8 w-8 text-violet-300" /><h2 id="coming-soon-title" className="mt-5 text-3xl font-black">{comingSoon} Coming Soon</h2><p className="mt-4 leading-7 text-slate-300">This part of the Aether ecosystem is still in development. Stay tuned.</p><button type="button" onClick={() => setComingSoon(null)} className="mt-7 rounded-xl bg-violet-600 px-6 py-3 font-bold hover:bg-violet-500">Close</button></div></div>}
      {easterEggOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
          onClick={() => setEasterEggOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="aether-easter-egg-title"
            className="w-full max-w-lg rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="aether-easter-egg-title" className="text-2xl font-black tracking-tight text-white">
              Congrats on finding one of our many Easter eggs!
            </h2>

            <p className="mt-4 text-base font-semibold text-violet-200">
              Happy hunting!
            </p>

            <p className="mt-6 text-sm leading-7 text-slate-300">
              We started Aether with <span className="font-bold text-white">$333</span>, between 3 founders.
            </p>

            <audio className="mx-auto mt-8 w-full" controls preload="metadata" src="/audio/333.m4a">
              Your browser does not support audio playback.
            </audio>

            <button
              type="button"
              onClick={() => setEasterEggOpen(false)}
              className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
