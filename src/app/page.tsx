"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Campaign Dashboard",
    description:
      "See campaign pressure, execution health, and operational momentum from one command surface.",
    icon: BarChart3,
  },
  {
    title: "Honest Abe Intelligence",
    description:
      "Strategic campaign intelligence that identifies pressure before departments break down.",
    icon: Brain,
  },
  {
    title: "Cross-Team Coordination",
    description:
      "Field, outreach, finance, digital, and print operate from one shared system.",
    icon: Users,
  },
  {
    title: "Operational Infrastructure",
    description:
      "Built for real campaign execution, not disconnected spreadsheets and siloed tools.",
    icon: Shield,
  },
];

const tiers = [
  {
    title: "T1",
    subtitle: "Ground Campaign OS",
    description:
      "Lean field-first operating system for underfunded local races and volunteer-heavy campaigns.",
    originalPrice: "$5,000/year",
    launchPrice: "$2,500/year",
    monthlyPrice: "$500/month",
    bullets: [
      "Field + Outreach infrastructure",
      "Contacts, Lists, and Calling",
      "Print inventory + deployment",
      "Volunteer coordination",
      "Campaign Dashboard access",
    ],
  },
  {
    title: "T2",
    subtitle: "Operational Campaign OS",
    description:
      "Full campaign operations with finance, digital, dashboard intelligence, and integrations.",
    originalPrice: "$10,000/year",
    launchPrice: "$5,000/year",
    monthlyPrice: "$916.50/month",
    bullets: [
      "Finance + Digital departments",
      "Honest Abe intelligence layer",
      "Integrations infrastructure",
      "Cross-department coordination",
      "Operational analytics + reporting",
    ],
  },
  {
    title: "T3",
    subtitle: "Command Campaign OS",
    description:
      "Strategic command infrastructure for high-scale campaigns and complex organizations.",
    originalPrice: "$20,000/year",
    launchPrice: "$10,000/year",
    monthlyPrice: "$1,750/month",
    bullets: [
      "Full command infrastructure",
      "Tools + coordination layer",
      "Executive campaign oversight",
      "Advanced operational visibility",
      "High-scale organization support",
    ],
  },
];

export default function HomePage() {
  const aiPrompt = `I'm considering running for office and I found a SaaS called...
URL: aetheros.pro 
URL: aetheros.pro/aether-academy/comprehensive-guide

Please take a deep dive on aetheros.pro/aether-academy/comprehensive-guide & all of the public pages and give me your feedback.`;

  const openAiWithCopiedPrompt = async (url: string) => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
    } catch {
      // The AI platform still opens if clipboard access is unavailable.
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const launchDate = new Date("2026-09-01T00:00:00-05:00").getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = launchDate - now;

    if (difference <= 0) {
      return {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      };
    }

    return {
      days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, "0"),
      hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
      minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, "0"),
      seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, "0"),
    };
  };

  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [promptCopied, setPromptCopied] = useState(false);
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

  const copyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 1800);
    } catch {
      // Leave the button usable even if clipboard access is unavailable.
    }
  };


  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center transition hover:opacity-90"
          >
            <img
              src="/aether-logo-full.png"
              alt="Aether OS"
              className="h-[220px] w-auto object-contain drop-shadow-[0_0_45px_rgba(139,92,246,0.45)]"
            />
          </Link>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 rounded-2xl border border-violet-400/70 bg-violet-700/20 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-violet-950/30 transition hover:bg-violet-600/30"
            >
              <span>Enter Aether</span>
            </Link>

            <a
              href="https://github.com/TylerTannehill/Aether.os/releases/download/v1.0.0/aether-mobile.apk"
              download
              className="inline-flex w-[250px] items-center justify-center gap-2 rounded-2xl border border-violet-400/40 bg-violet-700/10 px-5 py-4 text-xs font-black uppercase tracking-[0.05em] text-white transition hover:border-violet-300/70 hover:bg-violet-600/20"
            >
              <Smartphone className="h-4 w-4" />
              <span>Download Aether Mobile</span>
            </a>

            <div className="max-w-[300px] text-center text-[11px] leading-5 text-slate-300">
              <p>Android available now • iOS coming soon</p>
              <p>Built for Finance &amp; Field teams.</p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-14 py-10 lg:grid-cols-[0.92fr_1fr] lg:items-start lg:py-8">
          <div className="max-w-4xl">

            <div className="mt-2 inline-flex flex-col rounded-[1.75rem] border border-violet-400/20 bg-white/[0.03] px-6 py-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">
                Launch Countdown • September 1st 2026
              </div>

              <div className="mt-4 flex items-center gap-3">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Minutes", value: timeLeft.minutes },
                  { label: "Seconds", value: timeLeft.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex min-w-[72px] flex-col items-center rounded-2xl border border-white/10 bg-[#0B1629] px-4 py-3"
                  >
                    <span className="text-2xl font-black tracking-tight text-white">
                      {item.value}
                    </span>

                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>


            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Building2 className="h-3.5 w-3.5" />
              Campaign Operating System
            </div>

            <h1 className="mt-8 max-w-4xl text-6xl font-black leading-[0.96] tracking-[-0.06em] text-white lg:text-[92px]">
              Run your campaign
              <br />
              from one place.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
              Aether Political connects field, outreach, finance, digital,
              print, contacts, lists, and execution queues into one operational
              command system.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-w-[240px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                <span>Enter Aether</span>
              </Link>

              <Link
                href="/explore-abe"
                className="inline-flex min-w-[240px] items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.03] px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-black/20 transition hover:bg-white/[0.08]"
              >
                <span>Request Demo</span>
              </Link>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:p-8">
            <div className="rounded-[1.75rem] border border-violet-200 bg-[#F5EEFF] p-6 text-slate-950 shadow-2xl lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-800">
                    <Brain className="h-3.5 w-3.5" />
                    Honest Abe
                  </div>

                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                    Admin Preview
                  </p>

                  <h2 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-violet-950 lg:text-4xl">
                    Outreach is shaping the campaign&apos;s pressure picture
                    right now, while{" "}
                    <span className="font-bold">Field execution</span> is
                    lagging behind and needs reinforcement.
                  </h2>

                  <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 lg:text-base">
                    Cross-domain signals indicate print deployment is affecting
                    field readiness and volunteer coordination.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <Link
                    href="/abes-brief"
                    className="w-[180px] rounded-2xl border border-amber-300 bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-200"
                  >
                    Abe&apos;s Brief
                  </Link>

                  <Link
                    href="/explore-abe"
                    className="w-[180px] rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                  >
                    Explore Abe
                  </Link>

                  <Link
                    href="/public-team-aether"
                    className="w-[180px] rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                  >
                    Team Aether
                  </Link>

                  <Link
                    href="/aether-academy"
                    className="w-[180px] rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                  >
                    Aether Academy
                  </Link>

                  <Link
                    href="/public-faq"
                    className="w-[180px] rounded-2xl border border-violet-200 bg-white px-5 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                  >
                    FAQ
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-violet-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                    Cross-Domain Signal
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Print is affecting field through delayed deployment and
                    volunteer coordination pressure.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Operational Health
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Outreach performance is exceeding execution targets while
                    field completion has slowed.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Strategic Recommendation
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Prioritize field reinforcement before increasing additional
                    outreach pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-black/10 backdrop-blur-xl min-h-[250px]"
                >
                  <div className="w-fit rounded-2xl bg-white/5 p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pb-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Campaign Tiers
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white lg:text-6xl">
              Built for campaigns at every scale.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-xl shadow-black/10 backdrop-blur-xl min-h-[250px]"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  {tier.title}
                </div>

                <h3 className="mt-5 text-2xl font-semibold text-white">
                  {tier.subtitle}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {tier.description}
                </p>

                <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                    90-Day Launch Special • Ends 11/30/2026
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
                    <span className="text-lg font-medium text-slate-500 line-through">
                      {tier.originalPrice}
                    </span>

                    <span className="text-3xl font-black tracking-tight text-white">
                      {tier.launchPrice}
                    </span>

                    <span className="text-sm font-semibold text-slate-400">
                      or
                    </span>

                    <span className="text-xl font-black tracking-tight text-white">
                      {tier.monthlyPrice}
                    </span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {tier.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-3 text-sm font-medium text-slate-200"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Unified infrastructure
                </div>

                <Link
                  href="/public-sales"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/40 bg-white/[0.03] px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-violet-200 transition hover:border-violet-300/70 hover:bg-violet-500/10 hover:text-white"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-white/[0.03] to-blue-500/10 px-8 py-8 shadow-xl shadow-black/10 backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-10">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                Between Campaigns
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white lg:text-3xl">
                Your campaign may end. Your data doesn&apos;t have to.
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                When your Aether subscription ends, you can keep your campaign&apos;s data
                safely stored with Team Aether for $5/month. When it&apos;s time for the next
                campaign, your operational history is ready to come with you.
              </p>
            </div>

            <div className="mt-6 shrink-0 rounded-2xl border border-violet-300/30 bg-violet-500/10 px-6 py-5 text-center lg:mt-0">
              <div className="text-3xl font-black tracking-tight text-white">$5/month</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">
                Secure Data Storage
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Full Data Export available
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="min-h-[360px] rounded-[2.25rem] border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center shadow-xl shadow-black/10 backdrop-blur-xl lg:px-16 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Founding Campaign Stories
            </p>

            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
              Your campaign could be one of our first testimonials.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              We would rather leave this space open than fill it with generic
              quotes or pretend Aether has stories it has not earned yet. Every
              testimonial published here will come from a real campaign using
              the platform.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="rounded-[2.25rem] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-blue-500/10 px-8 py-14 text-center shadow-xl shadow-black/10 backdrop-blur-xl lg:px-16 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Independent Perspective
            </p>

            <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
              Ask your favorite AI about us.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Don&apos;t take our word for it. Ask ChatGPT to explore Aether&apos;s
              public site and comprehensive guide, then give you its feedback.
            </p>

            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="https://chatgpt.com/?q=I%27m%20considering%20running%20for%20office%20and%20I%20found%20a%20SaaS%20called...%0AURL%3A%20aetheros.pro%20%0AURL%3A%20aetheros.pro/aether-academy/comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro/aether-academy/comprehensive-guide%20%26%20all%20of%20the%20public%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask ChatGPT
              </a>

              <button
                type="button"
                onClick={() => openAiWithCopiedPrompt("https://gemini.google.com/app")}
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Gemini
              </button>

              <a
                href="https://claude.ai/new?q=I%27m%20considering%20running%20for%20office%20and%20I%20found%20a%20SaaS%20called...%0AURL%3A%20aetheros.pro%20%0AURL%3A%20aetheros.pro/aether-academy/comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro/aether-academy/comprehensive-guide%20%26%20all%20of%20the%20public%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Claude
              </a>

              <a
                href="https://grok.com/?q=I%27m%20considering%20running%20for%20office%20and%20I%20found%20a%20SaaS%20called...%0AURL%3A%20aetheros.pro%20%0AURL%3A%20aetheros.pro/aether-academy/comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro/aether-academy/comprehensive-guide%20%26%20all%20of%20the%20public%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Grok
              </a>

              <a
                href="https://www.perplexity.ai/search?q=I%27m%20considering%20running%20for%20office%20and%20I%20found%20a%20SaaS%20called...%0AURL%3A%20aetheros.pro%20%0AURL%3A%20aetheros.pro/aether-academy/comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro/aether-academy/comprehensive-guide%20%26%20all%20of%20the%20public%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Perplexity
              </a>

              <a
                href="https://copilot.microsoft.com/?q=I%27m%20considering%20running%20for%20office%20and%20I%20found%20a%20SaaS%20called...%0AURL%3A%20aetheros.pro%20%0AURL%3A%20aetheros.pro/aether-academy/comprehensive-guide%0A%0APlease%20take%20a%20deep%20dive%20on%20aetheros.pro/aether-academy/comprehensive-guide%20%26%20all%20of%20the%20public%20pages%20and%20give%20me%20your%20feedback."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-base font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
              >
                Ask Copilot
              </a>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={copyAiPrompt}
                className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700"
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
                <Link href="/#top">Landing Page</Link>
                <Link href="/explore-abe">Explore Abe</Link>
                <a href="https://github.com/TylerTannehill/Aether.os/releases/download/v1.0.0/aether-mobile.apk" download>Download Aether Mobile</a>
                <Link href="/aether-academy">Aether Academy</Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Product</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/abes-brief">Abe's Brief</Link>
                <Link href="/public-sales">Pricing</Link>
                <Link href="/public-faq">FAQ</Link>
                <Link href="/aether-academy/comprehensive-guide">Documentation</Link>
                <Link href="/login">Login</Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Explore Team Aether</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/public-team-aether">About Team Aether</Link>
                <Link href="/support">Support</Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Legal Hub</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/security">Security</Link>
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
