"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Boxes, Brain, Building2, CheckCircle2, ClipboardList, Megaphone, Truck, Users } from "lucide-react";

const features = [
  { title: "Business Overview", description: "A central view of work, activity, and priorities across your organization.", icon: BarChart3 },
  { title: "Customer Relationships", description: "Keep customer information and follow-up work connected to daily operations.", icon: Users },
  { title: "Marketing", description: "Bring marketing activity into the same operational picture as the rest of your business.", icon: Megaphone },
  { title: "Inventory", description: "Keep track of inventory and the work that depends on it.", icon: Boxes },
  { title: "Dispatch", description: "Organize assignments, jobs, and the next actions your team needs to take.", icon: Truck },
  { title: "Focus Mode", description: "Move from an overview into actionable work without losing context.", icon: ClipboardList },
];

export default function BusinessPublicPage() {
  const aiPrompt = `I'm evaluating business management software and found a SaaS called Aether Business.
URL: aetheros.pro/business-public
URL: aetheros.pro/aether-academy/business-comprehensive-guide

Please take a deep dive on aetheros.pro/business-public & aetheros.pro/aether-academy/business-comprehensive-guide and all of the public Business pages and give me your feedback.`;
  const [promptCopied, setPromptCopied] = useState(false);

  const copyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 1800);
    } catch {
      // Clipboard permissions vary by browser.
    }
  };

  const openAiWithCopiedPrompt = async (url: string) => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
    } catch {
      // The AI platform still opens if clipboard access is unavailable.
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [easterEggOpen, setEasterEggOpen] = useState(false);

  const handleEasterEggClick = () => {
    const nextClicks = easterEggClicks + 1;
    if (nextClicks >= 3) {
      setEasterEggClicks(0);
      setEasterEggOpen(true);
      return;
    }
    setEasterEggClicks(nextClicks);
  };

  return (
    <main id="top" className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-160px] top-[-160px] h-[520px] w-[520px] rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[560px] w-[560px] rounded-full bg-blue-600/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
        <header className="relative flex flex-col items-center gap-4 lg:min-h-[220px] lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <Link href="/business-public" aria-label="Aether Business home" className="inline-flex w-full shrink-0 justify-center lg:w-auto lg:justify-start">
            <img src="/aether-logo-full.png" alt="Aether OS" className="h-auto w-full max-w-[280px] object-contain drop-shadow-[0_0_45px_rgba(139,92,246,0.45)] lg:h-[275px] lg:w-auto lg:max-w-none lg:-my-[27.5px]" />
          </Link>

          <nav aria-label="Aether products" className="inline-flex w-fit max-w-full items-center rounded-2xl border border-violet-400/40 bg-white/[0.04] p-1 text-sm font-black uppercase tracking-[0.08em] shadow-xl shadow-violet-950/20 lg:absolute lg:left-1/2 lg:top-0 lg:-translate-x-1/2">
            <Link href="/" className="rounded-xl px-5 py-3 text-slate-300 transition hover:bg-violet-600/20 hover:text-white">Political</Link>
            <span aria-current="page" className="rounded-xl bg-violet-600 px-5 py-3 text-white">Business</span>
          </nav>

          <div className="flex w-full flex-col items-center gap-3 lg:w-auto lg:items-end">
            <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-violet-400/70 bg-violet-700/20 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-violet-950/30 transition hover:bg-violet-600/30">Enter Aether</Link>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
              <a href="https://apps.apple.com/us/app/aether-mobile/id6814591434" target="_blank" rel="noopener noreferrer" aria-label="Download Aether Mobile on the App Store" className="inline-flex transition hover:scale-[1.03] hover:opacity-90"><img src="/apple-appstore.png" alt="Download on the App Store" className="h-[44px] w-auto object-contain" /></a>
              <a href="https://play.google.com/store/apps/details?id=pro.aetheros.mobile" target="_blank" rel="noopener noreferrer" aria-label="Get Aether Mobile on Google Play" className="inline-flex transition hover:scale-[1.03] hover:opacity-90"><img src="/google-play.png" alt="Get it on Google Play" className="h-[44px] w-auto object-contain" /></a>
            </div>
          </div>
        </header>

        <section className="grid gap-14 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-10 lg:py-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"><Building2 className="h-4 w-4" /> Business Operating System</div>
            <h1 className="mt-8 max-w-3xl text-6xl font-black leading-[0.96] tracking-[-0.06em] lg:mt-6 lg:text-[72px] xl:text-[78px] 2xl:text-[84px]">Run your business<br />from one place.</h1>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300 lg:mt-6 lg:text-lg lg:leading-8 2xl:text-xl 2xl:leading-9">Aether Business brings customer relationships, marketing, inventory, dispatch, and day-to-day execution into one connected workspace.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="inline-flex min-w-[210px] items-center justify-center rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-sm font-black uppercase tracking-[0.08em] transition hover:from-violet-400 hover:to-violet-700">Enter Aether</Link>
              <Link href="/business-public/explore-abe" className="inline-flex min-w-[210px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-8 py-5 text-sm font-black uppercase tracking-[0.08em] transition hover:bg-white/[0.08]">Request Demo</Link>
            </div>
          </div>
          <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:p-5 2xl:p-6">
            <div className="rounded-[1.75rem] border border-violet-200 bg-[#F5EEFF] p-6 text-slate-950 shadow-2xl lg:p-6 2xl:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-800">
                    <Brain className="h-3.5 w-3.5" /> A.B.E. — Business Intelligence
                  </div>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 lg:mt-4">Operational Preview</p>
                  <h2 className="mt-4 text-2xl font-semibold leading-tight text-violet-950 lg:text-[28px] lg:leading-[1.18] xl:text-[30px] 2xl:text-[32px]">
                    Inventory demand is increasing while <span className="font-bold">dispatch capacity</span> is falling behind.
                  </h2>
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 lg:mt-4 lg:leading-6 2xl:text-base 2xl:leading-7">
                    A.B.E. connects operational signals across enabled departments to identify where attention is needed.
                  </p>
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-200/70 bg-white/50 px-4 py-3 text-sm leading-6 text-slate-600">
                    <Boxes className="mt-1 h-4 w-4 shrink-0 text-violet-700" />
                    <p><span className="font-bold uppercase tracking-wide text-violet-700">Financial Watch:</span>{" "}<span className="font-bold text-violet-950">$18,750</span> in outstanding client invoices remains uncollected, creating additional cash-flow pressure.</p>
                  </div>
                </div>
                <nav aria-label="A.B.E. preview links" className="flex shrink-0 flex-col gap-3">
                  <Link href="/business-public/business-abe" className="w-full rounded-2xl border border-amber-300 bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-200 lg:w-[160px] lg:py-2.5 2xl:w-[170px]">Abe&apos;s Brief</Link>
                  <Link href="/business-public/explore-abe" className="w-full rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50 lg:w-[160px] lg:py-2.5 2xl:w-[170px]">Explore Abe</Link>
                  <Link href="/business-public/team-aether" className="w-full rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50 lg:w-[160px] lg:py-2.5 2xl:w-[170px]">Team Aether</Link>
                  <Link href="/aether-academy/business-academy" className="w-full rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50 lg:w-[160px] lg:py-2.5 2xl:w-[170px]">Aether Academy</Link>
                  <Link href="/business-public/faq" className="w-full rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50 lg:w-[160px] lg:py-2.5 2xl:w-[170px]">FAQ</Link>
                </nav>
              </div>
              <div className="mt-8 grid gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-3">
                <div className="rounded-2xl border border-violet-200 bg-white p-5 lg:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Cross-Department Signal</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Inventory pressure may affect dispatch readiness.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operational Health</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Available capacity is trailing incoming work.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommended Focus</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Review assignments before taking on more work.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">One system. Connected work.</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl">Built around how businesses actually operate.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => { const Icon = feature.icon; return <div key={feature.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-black/10"><div className="w-fit rounded-2xl bg-white/5 p-3"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-xl font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p></div>; })}
          </div>
        </section>

        {/* Business pricing lanes — see the full Business sales page for module details. */}
        <section className="pb-24" aria-labelledby="business-pricing-title">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Business pricing</p>
          <h2 id="business-pricing-title" className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight lg:text-5xl">Built for businesses at every scale.</h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">Choose the modules your team needs, or work with Team Aether on an organization-wide solution.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-black/10">
              <span className="w-fit rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-violet-200">SMB · Modular</span>
              <h3 className="mt-6 text-2xl font-bold">Build Your Own Aether</h3>
              <p className="mt-3 min-h-[28px] text-sm leading-7 text-slate-300">Choose the modules you need. Expand as you grow.</p>
              <div className="mt-6 rounded-2xl border border-violet-400/25 bg-violet-500/[0.07] px-5 py-4">
                <p className="text-3xl font-black">$500 <span className="text-base font-semibold text-slate-300">/ module / month</span></p>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { name: "CRM", detail: "Manage customer relationships" },
                  { name: "Marketing", detail: "Connect campaigns to daily work" },
                  { name: "Inventory", detail: "Know what’s in stock" },
                  { name: "Dispatch", detail: "Coordinate jobs and assignments" },
                  { name: "Finance", detail: "Watch money move" },
                ].map(({ name, detail }) => (
                  <div key={name} className="flex items-start gap-3 text-sm leading-6 text-slate-200"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-violet-300" /><span><span className="font-semibold text-white">{name}</span> — {detail}</span></div>
                ))}
                <div className="flex items-start gap-3 pt-2 text-sm leading-6 text-slate-300"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /><span>Business Overview, Projects & Tasks, Tools, and FAQ included as standard.</span></div>
              </div>
              <Link href="/business-public/sales" className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-violet-300/50 bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:bg-violet-500/15">Learn More</Link>
            </article>
            <article className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-black/10">
              <span className="w-fit rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-violet-200">Enterprise · Tailored</span>
              <h3 className="mt-6 text-2xl font-bold">Built Around Your Organization</h3>
              <p className="mt-3 min-h-[28px] text-sm leading-7 text-slate-300">One connected system, tailored to your organization.</p>
              <div className="mt-6 rounded-2xl border border-violet-400/25 bg-violet-500/[0.07] px-5 py-4">
                <p className="text-3xl font-black">Custom <span className="text-base font-semibold text-slate-300">monthly pricing</span></p>
              </div>
              <div className="mt-6 space-y-3">
                {["Headcount and team structure", "Departments and workflows", "Data volume and integration needs", "Operational complexity"].map((name) => (
                  <div key={name} className="flex items-center gap-3 text-sm text-slate-200"><CheckCircle2 className="h-4 w-4 shrink-0 text-violet-300" />{name}</div>
                ))}
                <p className="pt-2 text-sm leading-6 text-slate-300">Team Aether reviews your requirements and provides a tailored quote.</p>
              </div>
              <Link href="/business-public/sales" className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-violet-300/50 bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:bg-violet-500/15">Learn More</Link>
            </article>
          </div>
        </section>

        <section className="pb-24">
          <div className="min-h-[360px] rounded-[2.25rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center shadow-xl shadow-black/10 backdrop-blur-xl lg:px-16 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Founding Business Stories</p>
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
              Your business could be one of our first testimonials.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              We would rather leave this space open than fill it with generic quotes or pretend Aether has customer stories it has not earned yet. Every testimonial published here will come from a real business using the platform.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="rounded-[2.25rem] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-blue-500/10 px-8 py-14 text-center shadow-xl shadow-black/10 backdrop-blur-xl lg:px-16 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Independent Perspective</p>
            <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">Ask your favorite AI about us.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Don&apos;t take our word for it. Ask your favorite AI to explore Aether Business&apos;s public landing page and comprehensive guide, then give you its feedback.
            </p>
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="https://chatgpt.com/?q=I%27m%20evaluating%20business%20management%20software%20and%20found%20a%20SaaS%20called%20Aether%20Business.%0AURL%3A%20aetheros.pro%2Fbusiness-public%0AURL%3A%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro%2Fbusiness-public%20%26%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%20and%20all%20of%20the%20public%20Business%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask ChatGPT
              </a>

              <button
                type="button"
                onClick={() => openAiWithCopiedPrompt("https://gemini.google.com/app")}
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Gemini
              </button>

              <a
                href="https://claude.ai/new?q=I%27m%20evaluating%20business%20management%20software%20and%20found%20a%20SaaS%20called%20Aether%20Business.%0AURL%3A%20aetheros.pro%2Fbusiness-public%0AURL%3A%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro%2Fbusiness-public%20%26%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%20and%20all%20of%20the%20public%20Business%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Claude
              </a>

              <a
                href="https://grok.com/?q=I%27m%20evaluating%20business%20management%20software%20and%20found%20a%20SaaS%20called%20Aether%20Business.%0AURL%3A%20aetheros.pro%2Fbusiness-public%0AURL%3A%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro%2Fbusiness-public%20%26%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%20and%20all%20of%20the%20public%20Business%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Grok
              </a>

              <a
                href="https://www.perplexity.ai/search?q=I%27m%20evaluating%20business%20management%20software%20and%20found%20a%20SaaS%20called%20Aether%20Business.%0AURL%3A%20aetheros.pro%2Fbusiness-public%0AURL%3A%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro%2Fbusiness-public%20%26%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%20and%20all%20of%20the%20public%20Business%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Perplexity
              </a>

              <a
                href="https://copilot.microsoft.com/?q=I%27m%20evaluating%20business%20management%20software%20and%20found%20a%20SaaS%20called%20Aether%20Business.%0AURL%3A%20aetheros.pro%2Fbusiness-public%0AURL%3A%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro%2Fbusiness-public%20%26%20aetheros.pro%2Faether-academy%2Fbusiness-comprehensive-guide%20and%20all%20of%20the%20public%20Business%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Copilot
              </a>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={copyAiPrompt}
                className="inline-flex min-w-[260px] items-center justify-center rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                {promptCopied ? "Prompt Copied!" : "Copy Prompt"}
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold text-white">Explore</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/business-public">Business Landing</Link>
                <Link href="/">Aether Political</Link>
                <Link href="/business-public/explore-abe">Explore Abe</Link>
                <a href="https://apps.apple.com/us/app/aether-mobile/id6814591434" target="_blank" rel="noopener noreferrer">Apple App Store</a>
                <a href="https://play.google.com/store/apps/details?id=pro.aetheros.mobile" target="_blank" rel="noopener noreferrer">Google Play Store</a>
                <Link href="/aether-academy/business-academy">Aether Academy</Link>
                <Link href="/aether-academy/business-comprehensive-guide">Documentation</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Product</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/business-public/business-abe">Abe&apos;s Brief</Link>
                <Link href="/business-public/sales">Pricing</Link>
                <Link href="/business-public/faq">FAQ</Link>
                <Link href="/login">Login</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Explore Team Aether</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/business-public/team-aether">About Team Aether</Link>
                <Link href="/support">Support</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Legal Hub</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/security">Security</Link>
                <Link href="/aether-academy/data-deletion">Data Deletion</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-10">
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

          <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
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
      {easterEggOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm" onClick={() => setEasterEggOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="aether-easter-egg-title" className="w-full max-w-lg rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.65)]" onClick={(event) => event.stopPropagation()}>
            <h2 id="aether-easter-egg-title" className="text-2xl font-black tracking-tight text-white">Congrats on finding one of our many Easter eggs!</h2>
            <p className="mt-4 text-base font-semibold text-violet-200">Happy hunting!</p>
            <p className="mt-6 text-sm leading-7 text-slate-300">We started Aether with <span className="font-bold text-white">$333</span>, between 3 founders.</p>
            <audio className="mx-auto mt-8 w-full" controls preload="metadata" src="/audio/333.m4a">Your browser does not support audio playback.</audio>
            <button type="button" onClick={() => setEasterEggOpen(false)} className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
