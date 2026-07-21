import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Layers3,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

const departments = [
  {
    title: "Outreach",
    detail: "Contacts, conversations, follow-up, and voter movement.",
  },
  {
    title: "Finance",
    detail: "Donor signals, pledge movement, compliance, and fundraising rhythm.",
  },
  {
    title: "Field",
    detail: "Turf, volunteers, canvassing, coverage, and ground execution.",
  },
  {
    title: "Digital",
    detail: "Content, momentum, engagement, and public signal.",
  },
  {
    title: "Print",
    detail: "Mail, literature, door hangers, inventory, and deployment readiness.",
  },
];

const loopSteps = [
  "Input",
  "Interpret",
  "Structure",
  "Assign",
  "Execute",
  "Feedback",
  "Repeat",
];

const executionModes = [
  "Suggested",
  "Reviewed",
  "Approved",
  "Automated",
  "Blocked",
];

export default function AbesBriefPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <section className="relative px-6 py-8 lg:px-10">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-[-12rem] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/30 blur-3xl" />
          <div className="absolute right-[-12rem] top-[22rem] h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
          <div className="absolute bottom-[-18rem] left-[30%] h-[36rem] w-[36rem] rounded-full bg-purple-700/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Landing Page
          </Link>

          <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                <Sparkles className="h-4 w-4" />
                Abe&apos;s Brief
              </div>

              <div>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Most campaigns don&apos;t fail because people aren&apos;t working.
                </h1>

                <p className="mt-7 max-w-2xl text-xl leading-9 text-slate-300">
                  They fail because information becomes disconnected from
                  execution.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm leading-7 text-slate-300">
                  The field team is seeing one thing. The finance team is seeing
                  another. Digital is chasing momentum. Outreach is trying to
                  keep up. Everyone is working, but nobody is moving together.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
              <div className="rounded-[1.7rem] bg-[#efe7ff] p-7 text-[#32106b] shadow-xl lg:p-9">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                      <Bot className="h-4 w-4" />
                      Honest Abe
                    </div>
                    <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-violet-700">
                      Strategic Interpretation
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-black text-amber-800">
                    Abe&apos;s
                    <br />
                    Brief
                  </div>
                </div>

                <h2 className="mt-7 text-3xl font-black leading-tight tracking-tight lg:text-5xl">
                  Abe is not a chatbot. Abe is how Aether reads operational
                  reality.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700">
                  Abe watches for pressure, momentum shifts, coordination risks,
                  execution priorities, and the places where departments start
                  pulling apart.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {[
                    "Operational pressure",
                    "Momentum shifts",
                    "Coordination risks",
                    "Execution priorities",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-violet-200 bg-white/75 p-4 text-sm font-bold text-slate-800"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-5">
            {departments.map((department) => (
              <div
                key={department.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                  {department.title}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {department.detail}
                </p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
                <Layers3 className="h-5 w-5" />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                What is Aether?
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
                Aether is a Political Operating System.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Most campaign software stores information. Aether is designed
                  to coordinate execution.
                </p>
                <p>
                  Instead of treating departments as separate tools, Aether
                  connects Outreach, Finance, Field, Digital, and Print into a
                  shared operational environment.
                </p>
                <p>
                  The goal isn&apos;t simply to know what&apos;s happening. The
                  goal is to know what should happen next.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl lg:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                The Problem
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
                Campaigns generate information faster than teams can coordinate
                it.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Momentum gets lost. Priorities drift. Opportunities disappear.
                  Pressure builds silently.
                </p>
                <p>
                  Aether exists to make those patterns visible and turn them
                  into coordinated action.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                Campaign Analytics
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
                Every department tells part of the story.
              </h2>

              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Fundraising. Field activity. Digital engagement. Print readiness.
                  Volunteer progress.
                </p>

                <p>
                  Individually, they're metrics. Together, they become operational
                  intelligence.
                </p>

                <p>
                  Honest Abe reads those signals, identifies emerging pressure,
                  and helps campaign leadership understand where attention
                  should be focused next.
                </p>
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
              <img
                src="/campaign-dashboard.png"
                alt="Aether Campaign Analytics Dashboard"
                className="w-full"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-[#130b2f] via-[#0d1730] to-[#07111f] p-8 shadow-2xl lg:p-12">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-violet-200">
                <Zap className="h-4 w-4" />
                The Loop
              </div>

              <h2 className="mt-7 text-4xl font-black leading-tight tracking-tight text-white lg:text-6xl">
                Everything inside Aether follows an operational rhythm.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Successful organizations aren&apos;t built from moments. They&apos;re
                built from loops.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-7">
              {loopSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm font-black uppercase tracking-wide text-white">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="text-xl font-black tracking-tight text-white lg:text-2xl">
                Input → Interpret → Structure → Assign → Execute → Feedback → Repeat
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white">
                Governed execution, not reckless automation.
              </h2>
              <p className="mt-6 text-sm leading-7 text-slate-300">
                Aether was never designed to automate everything. It was designed
                to help organizations execute with confidence.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {executionModes.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#efe7ff] p-8 text-[#32106b] shadow-xl lg:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#32106b] text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight">
                Separate teams. Shared mission. One system.
              </h2>
              <p className="mt-6 text-sm leading-7 text-slate-700">
                Outreach, Finance, Field, Digital, and Print all have their own
                work. Aether helps those teams operate as one coordinated system
                instead of a collection of disconnected tools.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-amber-300/20 bg-[#111827] p-8 text-center shadow-2xl lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Why Aether Exists
            </p>
            <h2 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-white lg:text-7xl">
              Most software helps organizations track work.
            </h2>
            <h3 className="mx-auto mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-violet-200 lg:text-7xl">
              Aether helps organizations coordinate it.
            </h3>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300">
              And in campaigns, coordination changes everything.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/explore-abe"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
              >
                Request Demo
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                Back to Landing Page
              </Link>
            </div>

            <p className="mt-12 text-sm font-semibold italic tracking-[0.16em] text-amber-100">
              ITS ALL ABOUT THE LOOPS.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
