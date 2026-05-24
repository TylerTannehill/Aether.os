"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Crown,
  Flag,
  HelpCircle,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

type TierCard = {
  tier: "T1" | "T2" | "T3";
  name: string;
  headline: string;
  bestFor: string[];
  coreIdea: string;
  caresAbout: string[];
  salesLine: string;
  tone: string;
  icon: any;
};

const tiers: TierCard[] = [
  {
    tier: "T1",
    name: "Ground Campaign OS",
    headline:
      "For lean, underfunded, volunteer-heavy campaigns that need structure without complexity.",
    bestFor: [
      "School board races",
      "Township campaigns",
      "City council campaigns",
      "County board campaigns",
      "Small mayoral races",
      "First-time candidates",
      "Volunteer-driven operations",
    ],
    coreIdea: "This campaign needs structure, not complexity.",
    caresAbout: [
      "Contacts",
      "Lists",
      "Calls",
      "Field work",
      "Volunteers",
      "Print inventory",
      "Signs and literature",
      "Basic execution",
    ],
    salesLine:
      "T1 gives a lean campaign the operating structure of a much more organized team without overwhelming volunteers or forcing them into finance and digital systems they are not ready to use.",
    tone: "border-slate-200 bg-white",
    icon: Flag,
  },
  {
    tier: "T2",
    name: "Operational Campaign OS",
    headline:
      "For growing campaigns with real staff, consultants, finance activity, digital work, and integrations needs.",
    bestFor: [
      "State representative races",
      "State senate races",
      "Countywide campaigns",
      "Serious mayoral campaigns",
      "Growing PACs",
      "Moderate campaign teams",
      "Campaigns with a few people wearing multiple hats",
    ],
    coreIdea:
      "This campaign has multiple lanes moving at once and needs connected operations.",
    caresAbout: [
      "Field",
      "Outreach",
      "Finance",
      "Digital",
      "Integrations",
      "Dashboard intelligence",
      "Contacts and lists",
      "Campaign-wide coordination",
    ],
    salesLine:
      "T2 is for campaigns that have real staff or serious consultants involved. It connects finance, digital, field, outreach, and integrations without forcing them into the heavier enterprise command layer.",
    tone: "border-blue-200 bg-blue-50",
    icon: Building2,
  },
  {
    tier: "T3",
    name: "Command Campaign OS",
    headline:
      "For high-scale campaigns where coordination complexity becomes the real operational risk.",
    bestFor: [
      "Congressional campaigns",
      "Statewide campaigns",
      "Governor campaigns",
      "U.S. Senate campaigns",
      "Large PACs",
      "National political organizations",
      "Healthy multi-department campaign teams",
    ],
    coreIdea: "This campaign has coordination complexity.",
    caresAbout: [
      "Department-level intelligence",
      "Leadership visibility",
      "Tools workspace",
      "Integrations",
      "Strategic coordination",
      "Execution governance",
      "Cross-team pressure detection",
      "Multi-department operating rhythm",
    ],
    salesLine:
      "T3 is for campaigns where the problem is no longer just doing the work — it is coordinating the people, departments, signals, and decisions behind the work.",
    tone: "border-amber-200 bg-amber-50",
    icon: Crown,
  },
];

const qualificationQuestions = [
  "Is this mostly candidate plus volunteers, or do they have real staff?",
  "Are finance and digital being run seriously, or are they still informal?",
  "Do they need integrations now, or just contacts, lists, outreach, field, and print?",
  "Is the campaign struggling with execution, or with coordination?",
  "Do they have departments that need separate operating lanes?",
];

const salesShortcuts = [
  {
    signal: "Mostly field, calling, print, and volunteer driven",
    tier: "T1",
  },
  {
    signal: "Finance, digital, and integrations are active needs",
    tier: "T2",
  },
  {
    signal: "Multiple departments, leadership layers, and coordination pressure",
    tier: "T3",
  },
];

const dontSay = [
  {
    wrong: "T1 is basic or cheap.",
    right: "T1 is a lean ground-game operating system.",
  },
  {
    wrong: "T2 is missing features.",
    right: "T2 is full campaign operations without enterprise command overhead.",
  },
  {
    wrong: "T3 is only for rich campaigns.",
    right:
      "T3 is built for campaigns where coordination complexity becomes the risk.",
  },
];

export default function SalesHelpPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Team Aether Sales Help
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-5xl">
                Aether Political Tier Guide
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 lg:text-base">
                Use this page to help sales staff understand which Aether Political
                tier fits which campaign, how to explain the difference, and what
                language to use during sales conversations.
              </p>
            </div>

            <Link
              href="/team-aether"
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Team Aether
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Layers3 className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">One System</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Aether Political is not priced as less software versus more
              software. Every tier runs on the same underlying operating system.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Users className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Campaign Maturity
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The tiers are based on campaign maturity, staffing level,
              operational complexity, and coordination pressure.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Sparkles className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Upgrade Path
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              As a campaign grows, Aether unlocks more visibility and
              coordination layers without forcing them to rebuild their workflow.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Positioning
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              How to position Aether Political
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
              Aether Political is tiered by operational maturity. The question is
              not, “What features do they deserve?” The question is, “How complex
              is their campaign operation?”
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">
              Sales framing:
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              “Aether scales with the campaign. A small campaign gets a clean
              ground-game operating system. A growing campaign gets full campaign
              operations. A large campaign gets strategic command infrastructure.”
            </p>
          </div>
        </section>

        <section className="grid gap-6">
          {tiers.map((item) => {
            const Icon = item.icon;

            return (
              <section
                key={item.tier}
                className={`rounded-[2rem] border p-6 shadow-sm lg:p-8 ${item.tone}`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      <Icon className="h-3.5 w-3.5" />
                      {item.tier}
                    </div>

                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                      {item.name}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 lg:text-base">
                      {item.headline}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:max-w-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Best For
                    </p>

                    <div className="mt-3 space-y-2">
                      {item.bestFor.map((text) => (
                        <div key={text} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      Core idea
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.coreIdea}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      What they care about
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.caresAbout.map((value) => (
                        <span
                          key={value}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      Sales line
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      “{item.salesLine}”
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <HelpCircle className="h-3.5 w-3.5" />
              Qualification
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Quick qualification questions
            </h2>

            <div className="mt-5 space-y-3">
              {qualificationQuestions.map((question) => (
                <div
                  key={question}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                >
                  {question}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Shortcut
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Fast tier recommendation
            </h2>

            <div className="mt-5 space-y-3">
              {salesShortcuts.map((item) => (
                <div
                  key={item.signal}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {item.signal}
                  </p>

                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {item.tier}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm lg:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">
            Language Guardrails
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            What not to say
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {dontSay.map((item) => (
              <div
                key={item.wrong}
                className="rounded-3xl border border-rose-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-rose-700">
                  Do not say:
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.wrong}
                </p>

                <p className="mt-4 text-sm font-semibold text-emerald-700">
                  Say instead:
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.right}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
