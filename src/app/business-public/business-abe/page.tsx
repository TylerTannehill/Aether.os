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
    title: "CRM",
    detail: "Customer relationships, interactions, follow-ups, and ownership.",
  },
  {
    title: "Finance",
    detail: "Outstanding receivables, incoming payments, and cash-flow pressure.",
  },
  {
    title: "Inventory",
    detail: "Stock availability, replenishment pressure, and operational readiness.",
  },
  {
    title: "Marketing",
    detail: "Campaign activity, customer engagement, and demand signals.",
  },
  {
    title: "Dispatch",
    detail: "Jobs, assignments, scheduling pressure, and work completion.",
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
      <section className="relative px-6 py-8 lg:px-8 lg:px-[18px] lg:py-6">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-[-12rem] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/30 blur-3xl" />
          <div className="absolute right-[-12rem] top-[22rem] h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
          <div className="absolute bottom-[-18rem] left-[30%] h-[36rem] w-[36rem] rounded-full bg-purple-700/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:gap-6">
          <Link
            href="/business-public"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 lg:px-3 lg:py-2.5 lg:text-[12px] lg:rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Back to Landing Page
          </Link>

          <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-6">
            <div className="space-y-8 lg:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-200 lg:px-3 lg:py-1.5 lg:text-[10px]">
                <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Business Abe&apos;s Brief
              </div>

              <div>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-4xl lg:text-4xl">
                  Running a business shouldn&apos;t mean guessing what needs attention next.
                </h1>

                <p className="mt-7 max-w-2xl text-xl leading-9 lg:text-lg lg:leading-7 text-slate-300 lg:mt-5 lg:text-lg">
                  The challenge is connecting information to the work that needs to happen.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:p-[18px]">
                <p className="text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-300 lg:text-[12px]">
                  Inventory sees demand building. Dispatch sees a growing queue. Finance sees unpaid invoices. Each team has part of the picture, but the business needs to see how those pressures connect.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl lg:p-4">
              <div className="rounded-[1.7rem] bg-[#efe7ff] p-7 text-[#32106b] shadow-xl lg:p-7 lg:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between lg:gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700 lg:text-[10px]">
                      <Bot className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                      A.B.E. Business
                    </div>
                    <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-violet-700 lg:mt-4 lg:text-[10px]">
                      Operational Interpretation
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-300 bg-violet-100 px-4 py-3 text-center text-sm font-black text-violet-800 lg:px-3 lg:py-2.5 lg:text-[12px] lg:rounded-xl">
                    Abe&apos;s
                    <br />
                    Brief
                  </div>
                </div>

                <h2 className="mt-7 text-3xl font-black leading-tight tracking-tight lg:text-4xl lg:mt-5 lg:text-2xl">
                  A.B.E. is not a chatbot. It interprets the operational reality of your business.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 lg:text-sm lg:leading-6 text-slate-700 lg:mt-4 lg:text-sm">
                  Using deterministic rules and real records from enabled departments, A.B.E. identifies operational pressure, coordination risks, financial exposure, and where attention is needed next. No generative AI is required.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-3 lg:mt-6">
                  {[
                    "Operational pressure",
                    "Outstanding receivables",
                    "Coordination risks",
                    "Execution priorities",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-violet-200 bg-white/75 p-4 text-sm font-bold text-slate-800 lg:p-3 lg:text-[12px] lg:rounded-xl"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-5 lg:gap-4">
            {departments.map((department) => (
              <div
                key={department.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-sm lg:p-4 lg:rounded-2xl"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200 lg:text-[10px]">
                  {department.title}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300 lg:mt-3 lg:text-[12px]">
                  {department.detail}
                </p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-7 lg:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 lg:h-10 lg:w-10 lg:rounded-xl">
                <Layers3 className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-200 lg:mt-4 lg:text-[10px]">
                What is Aether?
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white lg:mt-3 lg:text-3xl">
                Aether Business is an operating system for connected work.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-300 lg:space-y-3 lg:mt-4 lg:text-[12px]">
                <p>
                  Most business software organizes information by tool or department. Aether is designed to connect that information to execution.
                </p>
                <p>
                  CRM, Marketing, Inventory, Dispatch, and Finance can contribute to a shared operational picture, based on the modules each organization enables.
                </p>
                <p>
                  The goal isn&apos;t simply to know what&apos;s happening. The
                  goal is to know what should happen next.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl lg:p-7 lg:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 lg:text-[10px]">
                The Problem
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white lg:mt-3 lg:text-3xl">
                Businesses generate signals faster than teams can connect them.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-300 lg:space-y-3 lg:mt-4 lg:text-[12px]">
                <p>
                  Jobs pile up. Inventory runs short. Follow-ups slip. Invoices remain unpaid. Pressure can build in one department while the cause sits in another.
                </p>
                <p>
                  Aether exists to make those patterns visible and turn them
                  into coordinated action.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-7 lg:p-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200 lg:text-[10px]">
                Business Operations
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white lg:mt-3 lg:text-3xl">
                Each enabled department reveals part of the picture.
              </h2>

              <div className="mt-6 space-y-4 text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-300 lg:space-y-3 lg:mt-4 lg:text-[12px]">
                <p>
                  Customer follow-ups. Marketing activity. Inventory availability. Dispatch workload. Outstanding payments.
                </p>

                <p>
                  Individually, they're metrics. Together, they become operational
                  intelligence.
                </p>

                <p>
                  A.B.E. Business reads those signals, identifies emerging pressure,
                  and helps campaign leadership understand where attention
                  should be focused next.
                </p>
              </div>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:mt-7">
              <img
                src="/business-abe.png"
                alt="Aether Business Operations Dashboard"
                className="w-full"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-[#130b2f] via-[#0d1730] to-[#07111f] p-8 shadow-2xl lg:p-7 lg:p-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-violet-200 lg:px-3 lg:py-1.5 lg:text-[10px]">
                <Zap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                The Loop
              </div>

              <h2 className="mt-7 text-4xl font-black leading-tight tracking-tight text-white lg:text-4xl lg:mt-5 lg:text-3xl">
                Everything inside Aether follows an operational rhythm.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 lg:text-sm lg:leading-6 text-slate-300 lg:mt-4 lg:text-sm">
                Successful organizations aren&apos;t built from moments. They&apos;re
                built from loops.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-7 lg:gap-2 lg:mt-7">
              {loopSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center shadow-sm lg:p-4 lg:rounded-2xl"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200 lg:text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm font-black uppercase tracking-wide text-white lg:mt-2 lg:text-[12px]">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center lg:p-[18px] lg:mt-6 lg:rounded-2xl">
              <p className="text-xl font-black tracking-tight text-white lg:text-2xl lg:text-lg">
                Input → Interpret → Structure → Assign → Execute → Feedback → Repeat
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2 lg:gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-xl lg:p-7 lg:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 lg:h-10 lg:w-10 lg:rounded-xl">
                <Shield className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white lg:mt-4 lg:text-3xl">
                Governed execution, not reckless automation.
              </h2>
              <p className="mt-6 text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-300 lg:mt-4 lg:text-[12px]">
                Aether was never designed to automate everything. It was designed
                to help organizations execute with confidence.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 lg:mt-5">
                {executionModes.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 lg:text-[10px]"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#efe7ff] p-8 text-[#32106b] shadow-xl lg:p-7 lg:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#32106b] text-white lg:h-10 lg:w-10 lg:rounded-xl">
                <CheckCircle2 className="h-5 w-5 lg:h-4 lg:w-4" />
              </div>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight lg:mt-4 lg:text-3xl">
                Different departments. One operational picture.
              </h2>
              <p className="mt-6 text-sm leading-7 lg:text-[12px] lg:leading-6 text-slate-700 lg:mt-4 lg:text-[12px]">
                Outreach, Finance, Field, Digital, and Print all have their own
                work. Aether helps those teams operate as one coordinated system
                instead of a collection of disconnected tools.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-violet-400/20 bg-[#111827] p-8 text-center shadow-2xl lg:p-7 lg:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200 lg:text-[10px]">
              Why Aether Exists
            </p>
            <h2 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-white lg:text-4xl lg:mt-4 lg:text-4xl">
              Most software helps organizations track work.
            </h2>
            <h3 className="mx-auto mt-5 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-violet-200 lg:text-4xl lg:mt-4 lg:text-4xl">
              Aether helps organizations coordinate it.
            </h3>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 lg:text-sm lg:leading-6 text-slate-300 lg:mt-5 lg:text-sm">
              For businesses, coordinated work means fewer blind spots and clearer next steps.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:gap-2 lg:mt-7">
              <Link
                href="/business-public"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 lg:px-[18px] lg:py-3 lg:text-[12px] lg:rounded-xl"
              >
                Explore Aether Business
                <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              </Link>

              <Link
                href="/business-public"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10 lg:px-[18px] lg:py-3 lg:text-[12px] lg:rounded-xl"
              >
                Back to Landing Page
              </Link>
            </div>

            <p className="mt-12 text-sm font-semibold italic tracking-[0.16em] text-violet-200 lg:mt-9 lg:text-[12px]">
              ITS ALL ABOUT THE LOOPS.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
