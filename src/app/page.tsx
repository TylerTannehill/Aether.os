import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  Shield,
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
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
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

          <Link
            href="/login"
            className="inline-flex items-center gap-3 rounded-2xl border border-violet-400/70 bg-violet-700/20 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-violet-950/30 transition hover:bg-violet-600/30"
          >
            <span>Enter Aether</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid flex-1 gap-14 py-10 lg:grid-cols-[0.92fr_1fr] lg:items-start lg:py-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
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
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/login"
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

                <div className="flex flex-col gap-3">
                  <button className="rounded-2xl border border-amber-300 bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-200">
                    Abe&apos;s Brief
                  </button>

                  <button className="rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50">
                    Explore Abe
                  </button>
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
