"use client";

import { useMemo, useState } from "react";

type FAQItem = {
  question: string;
  answer: string[];
};

type FAQSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: "navy" | "purple" | "green" | "amber" | "rose" | "slate";
  items: FAQItem[];
};

const faqSections: FAQSection[] = [
  {
    id: "platform",
    eyebrow: "Platform",
    title: "What is Aether?",
    description:
      "Aether is a governed operational operating system for coordinated execution.",
    tone: "navy",
    items: [
      {
        question: "What is Aether?",
        answer: [
          "Aether is a governed operational operating system designed to help organizations coordinate execution, interpret operational pressure, and move work forward across interconnected departments.",
          "Unlike traditional CRMs or dashboard platforms, Aether is built around operational coordination, strategic interpretation, governed execution, organizational intelligence, and cross-domain awareness.",
          "Aether is designed to function as an operational coordination layer rather than a collection of disconnected tools.",
        ],
      },
      {
        question: "Is Aether a CRM?",
        answer: [
          "No. Aether includes contact and operational population management, but it is not designed as a traditional CRM.",
          "Most CRMs store records. Aether operationalizes them across Outreach, Finance, Field, Print, Volunteer coordination, and Focus execution systems.",
          "Contacts, lists, and operational universes are treated as deployable execution infrastructure rather than static database rows.",
        ],
      },
      {
        question: "What makes Aether different from normal campaign software?",
        answer: [
          "Aether is built around coordinated execution instead of isolated activity.",
          "The platform is designed to detect operational pressure, surface momentum shifts, identify coordination gaps, govern execution, preserve operational context, and route work intelligently across departments.",
          "Aether separates visibility, interpretation, execution, and governance into distinct operational layers.",
        ],
      },
    ],
  },
  {
    id: "honest-abe",
    eyebrow: "Strategic Intelligence",
    title: "Honest Abe",
    description:
      "Abe is Aether’s strategic interpretation layer, not a chatbot or campaign controller.",
    tone: "purple",
    items: [
      {
        question: "What is Honest Abe?",
        answer: [
          "Honest Abe is Aether’s strategic intelligence layer.",
          "Abe analyzes operational movement across the organization to identify pressure, opportunity, coordination risks, momentum shifts, follow-through decay, and cross-domain signals.",
          "Abe exists to help organizations understand operational reality.",
        ],
      },
      {
        question: "Is Honest Abe a chatbot?",
        answer: [
          "No. Honest Abe is not designed as a conversational chatbot or autonomous campaign manager.",
          "Abe does not replace staff or directly control operations.",
          "Instead, Abe provides strategic interpretation grounded in live organizational signal.",
        ],
      },
      {
        question: "What does Abe analyze?",
        answer: [
          "Abe can analyze outreach activity, fundraising movement, field performance, digital momentum, print readiness, execution behavior, follow-through quality, coordination patterns, organizational drift, and cross-domain relationships.",
          "Abe evaluates both analytics and operational behavior.",
        ],
      },
      {
        question: "What is cross-domain intelligence?",
        answer: [
          "Cross-domain intelligence refers to relationships between operational departments.",
          "For example, digital momentum may influence fundraising, print delays may affect field execution, or outreach performance may influence volunteer activation.",
          "Aether treats departments as interconnected operational systems rather than isolated software modules.",
        ],
      },
      {
        question: "What is Abe’s Brief?",
        answer: [
          "Abe’s Brief is Aether’s strategic morning read.",
          "It converts live operational data into a high-level campaign interpretation designed to help leadership understand pressure concentration, momentum, coordination risk, and execution priorities before execution begins.",
        ],
      },
      {
        question: "What is Explore Abe?",
        answer: [
          "Explore Abe is Aether’s expanded interpretation layer.",
          "It provides deeper organizational analysis, lane-by-lane operational reads, pattern monitoring, cross-domain interpretation, and strategic context.",
          "Explore Abe expands the intelligence surfaced inside Abe’s Brief.",
        ],
      },
    ],
  },
  {
    id: "dashboard-focus",
    eyebrow: "Awareness + Execution",
    title: "Dashboard + Focus",
    description:
      "The Dashboard creates awareness. Focus turns awareness into coordinated execution.",
    tone: "green",
    items: [
      {
        question: "What is the Campaign Hub?",
        answer: [
          "The Campaign Hub is Aether’s high-level operational awareness layer.",
          "It helps organizations understand campaign health, identify pressure points, monitor momentum, and coordinate execution across departments before moving into direct operational workflows.",
        ],
      },
      {
        question: "Why is the Dashboard analytics-first?",
        answer: [
          "Aether separates strategic awareness from direct execution.",
          "The Dashboard is designed for observation, prioritization, coordination, and organizational intelligence.",
          "Direct work happens inside Focus Mode.",
        ],
      },
      {
        question: "What is Focus Mode?",
        answer: [
          "Focus Mode is Aether’s execution environment.",
          "It translates operational pressure, strategic pushes, organizational movement, and execution priorities into guided execution queues designed to move the organization forward in a coordinated way.",
        ],
      },
      {
        question: "What are Focus queues?",
        answer: [
          "Focus queues organize operational work by urgency, coordination need, execution type, routing context, and operational pressure instead of displaying a flat task list.",
        ],
      },
      {
        question: "What is a Strategic Push?",
        answer: [
          "A Strategic Push is a coordinated operational movement generated from live organizational pressure, momentum, and execution opportunities.",
          "Strategic Pushes help teams coordinate around shared operational objectives instead of fragmented task activity.",
        ],
      },
    ],
  },
  {
    id: "lanes",
    eyebrow: "Operating Model",
    title: "Operational Lanes",
    description:
      "Aether models departments as connected lanes of execution, pressure, and opportunity.",
    tone: "slate",
    items: [
      {
        question: "What is an operational lane?",
        answer: [
          "An operational lane is a department-focused workflow environment inside Aether.",
          "Each lane contains operational signals, pressure points, analytics, execution surfaces, and Focus workflows while remaining connected to the broader organization.",
        ],
      },
      {
        question: "What departments does Aether support?",
        answer: [
          "Aether currently supports Outreach, Finance, Field, Digital, and Print.",
          "Additional operational systems may expand over time.",
        ],
      },
      {
        question: "What are Primary, Pressure, and Opportunity lanes?",
        answer: [
          "Primary Lane: the department currently shaping organizational direction most heavily.",
          "Pressure Lane: the department most likely to generate operational friction or execution risk.",
          "Opportunity Lane: the department currently positioned to create the strongest organizational upside or momentum opportunity.",
        ],
      },
    ],
  },
  {
    id: "contacts-lists",
    eyebrow: "Operational Population",
    title: "Contacts + Lists",
    description:
      "Contacts and lists are not static records. They are deployable operational infrastructure.",
    tone: "amber",
    items: [
      {
        question: "What is Contact Management?",
        answer: [
          "Contact Management is Aether’s operational population layer.",
          "It allows organizations to segment populations, assign ownership, enrich donor intelligence, route downstream execution, and build reusable operational universes across the platform.",
        ],
      },
      {
        question: "Are contacts just CRM records?",
        answer: [
          "No. Aether treats contacts as operational entities connected to execution, donor intelligence, routing, segmentation, ownership, Focus systems, and organizational workflows rather than static contact rows.",
        ],
      },
      {
        question: "What are Lists inside Aether?",
        answer: [
          "Lists are reusable operational universes that power downstream execution across Outreach, Finance, Field, Print, Volunteer coordination, and Focus systems.",
          "Lists preserve operational identity, routing context, and execution readiness.",
        ],
      },
      {
        question: "What is Strategic Segmentation?",
        answer: [
          "Strategic Segmentation is the process of organizing operational populations using donor behavior, geography, FEC intelligence, ownership, routing context, and operational signals to improve downstream execution quality.",
        ],
      },
      {
        question: "What are Execution Routes?",
        answer: [
          "Execution Routes determine which operational lane a list deploys into, including Outreach, Finance, Field, and Print routing environments.",
        ],
      },
    ],
  },
  {
    id: "governance",
    eyebrow: "Trust Layer",
    title: "Governance + Execution",
    description:
      "Aether is built around governed execution, not reckless automation.",
    tone: "rose",
    items: [
      {
        question: "What is Governed Operations?",
        answer: [
          "Governed Operations is Aether’s execution governance layer.",
          "It allows organizations to supervise automation, operational execution, policy enforcement, rollback systems, governance controls, and execution diagnostics while maintaining human oversight.",
        ],
      },
      {
        question: "What is Governed Execution?",
        answer: [
          "Governed Execution is Aether’s framework for determining whether operational actions should execute automatically, require approval, or remain blocked based on policy, confidence, and operational risk.",
        ],
      },
      {
        question: "What execution modes does Aether support?",
        answer: [
          "Aether currently supports Off, Suggest, Auto Safe, Hybrid, Manual, and Blocked execution states.",
          "These modes determine how aggressively the platform may operationalize actions.",
        ],
      },
      {
        question: "What is a Dry Run?",
        answer: [
          "A Dry Run allows organizations to simulate operational execution before live mutations occur.",
          "Dry Runs help teams inspect execution intent, validate governance behavior, review routing outcomes, and build trust in automation systems before changes are applied.",
        ],
      },
      {
        question: "Can Aether block actions?",
        answer: [
          "Yes. Aether can prevent execution when confidence is too low, governance rules fail, operational risk is elevated, policy restrictions apply, or manual review is required.",
          "Blocked execution is part of the governance system.",
        ],
      },
      {
        question: "What is a Fallback Task?",
        answer: [
          "A Fallback Task is operational work that could not be confidently routed, assigned, governed, or operationalized automatically.",
          "Instead of failing silently, the work enters a recovery workflow for review and correction.",
        ],
      },
      {
        question: "What is a Routing Rule Gap?",
        answer: [
          "A Routing Rule Gap occurs when Aether detects repeated operational patterns that are not yet covered by existing routing logic.",
          "Aether can recommend improved routing structures over time as organizational patterns emerge.",
        ],
      },
    ],
  },
  {
    id: "audit",
    eyebrow: "Transparency",
    title: "Audit + Accountability",
    description:
      "Aether is designed so operational actions can be inspected, reviewed, and understood.",
    tone: "navy",
    items: [
      {
        question: "What is the Action Audit Dashboard?",
        answer: [
          "The Action Audit Dashboard is Aether’s operational accountability layer.",
          "It records previews, governed executions, mutation summaries, execution outcomes, governance events, and operational history so organizations can inspect exactly what happened and why.",
        ],
      },
      {
        question: "Why does Aether keep audit logs?",
        answer: [
          "Aether is designed around transparency, traceability, operational accountability, and governance visibility.",
          "Audit systems help organizations maintain trust in governed operational execution.",
        ],
      },
      {
        question: "What is a Mutation Summary?",
        answer: [
          "A Mutation Summary records the operational changes Aether attempted to apply during execution, including affected entities, targets, source IDs, success results, and failure outcomes across governed operational workflows.",
        ],
      },
      {
        question: "Can organizations inspect what Aether attempted to do?",
        answer: [
          "Yes. Aether records execution previews, recommended actions, mutation attempts, governance outcomes, execution results, and failure states inside the audit layer.",
        ],
      },
    ],
  },
  {
    id: "ingestion",
    eyebrow: "Intake",
    title: "Data Ingestion",
    description:
      "Aether interprets incoming data before it becomes operational reality.",
    tone: "green",
    items: [
      {
        question: "What is Data Ingestion?",
        answer: [
          "Data Ingestion is Aether’s operational intake system.",
          "It transforms outside spreadsheets, analytics exports, donor records, and campaign data into structured operational intelligence capable of powering downstream execution.",
        ],
      },
      {
        question: "Does Aether simply import spreadsheets?",
        answer: [
          "No. Aether interprets uploaded data before import.",
          "The system can detect missing information, identify donor signals, surface duplicates, suggest routing structures, classify operational universes, and prepare downstream workflows before records enter the live system.",
        ],
      },
      {
        question: "What is a Signal Readout?",
        answer: [
          "A Signal Readout is Aether’s interpretation of uploaded data.",
          "It may identify missing contact information, donor likelihood, duplicates, sentiment signals, engagement movement, operational segmentation opportunities, and execution-relevant anomalies during ingestion.",
        ],
      },
      {
        question: "Can Aether handle messy campaign data?",
        answer: [
          "Yes. Aether is designed to normalize inconsistent spreadsheets, mixed exports, missing fields, imperfect campaign data, and fragmented operational records before they enter the live intelligence layer.",
        ],
      },
    ],
  },
  {
    id: "identity",
    eyebrow: "People + Context",
    title: "Organizational Identity",
    description:
      "Aether treats users as operators inside a living operational system.",
    tone: "purple",
    items: [
      {
        question: "What is the Operator Profile?",
        answer: [
          "The Operator Profile is Aether’s personal operational identity layer.",
          "It reflects role context, execution alignment, operational lanes, permissions, Focus positioning, organizational visibility, and execution momentum inside the system.",
        ],
      },
      {
        question: "What is Active Work Context?",
        answer: [
          "Active Work Context represents the operational lanes, execution surfaces, lists, and workflows currently shaping a user’s operational environment inside Aether.",
        ],
      },
      {
        question: "What are execution streaks?",
        answer: [
          "Execution streaks track consistent operational follow-through across Focus activity, outreach movement, execution cadence, and organizational responsiveness over time.",
        ],
      },
      {
        question: "What is Potato Status?",
        answer: [
          "Potato Status is a lightweight operator status system designed to humanize execution context and reflect real-world operational energy without introducing unnecessary friction.",
        ],
      },
      {
        question: "Can users belong to multiple departments?",
        answer: [
          "Yes. Aether supports multi-role, multi-lane, and multi-department organizational structures.",
          "Visibility and execution context adapt based on assigned operational responsibilities.",
        ],
      },
    ],
  },
];

function getToneClasses(tone: FAQSection["tone"]) {
  switch (tone) {
    case "purple":
      return {
        chip: "bg-purple-50 text-purple-700 border-purple-200",
        card: "border-purple-100 bg-purple-50/40",
        accent: "from-purple-500 to-indigo-500",
      };
    case "green":
      return {
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        card: "border-emerald-100 bg-emerald-50/40",
        accent: "from-emerald-500 to-teal-500",
      };
    case "amber":
      return {
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        card: "border-amber-100 bg-amber-50/40",
        accent: "from-amber-500 to-orange-500",
      };
    case "rose":
      return {
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        card: "border-rose-100 bg-rose-50/40",
        accent: "from-rose-500 to-red-500",
      };
    case "slate":
      return {
        chip: "bg-slate-50 text-slate-700 border-slate-200",
        card: "border-slate-200 bg-slate-50/70",
        accent: "from-slate-500 to-slate-700",
      };
    case "navy":
    default:
      return {
        chip: "bg-blue-50 text-blue-800 border-blue-200",
        card: "border-blue-100 bg-blue-50/40",
        accent: "from-blue-700 to-slate-900",
      };
  }
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearch(query);

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return faqSections;

    return faqSections
      .map((section) => {
        const sectionMatch =
          section.title.toLowerCase().includes(normalizedQuery) ||
          section.eyebrow.toLowerCase().includes(normalizedQuery) ||
          section.description.toLowerCase().includes(normalizedQuery);

        const items = section.items.filter((item) => {
          return (
            sectionMatch ||
            item.question.toLowerCase().includes(normalizedQuery) ||
            item.answer.some((line) =>
              line.toLowerCase().includes(normalizedQuery)
            )
          );
        });

        return {
          ...section,
          items,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const totalQuestions = faqSections.reduce(
    (sum, section) => sum + section.items.length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-6 py-12 text-white sm:px-8 lg:px-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[-10%] top-[-40%] h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-[-35%] right-[-10%] h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
              Aether Mission FAQ
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              The Operating System for Coordinated Execution
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Aether is a governed operational intelligence platform designed
              to coordinate execution, interpret organizational pressure, and
              move work forward across interconnected lanes.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-3xl font-black">{faqSections.length}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Sections
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-3xl font-black">{totalQuestions}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Questions
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-3xl font-black">OS</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Doctrine
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Search FAQ
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Aether..."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-5 space-y-2">
                {faqSections.map((section) => {
                  const tone = getToneClasses(section.tone);

                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span>{section.title}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${tone.chip}`}
                      >
                        {section.items.length}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Doctrine
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950">
                  Coordination over isolated activity.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Aether is built to help organizations understand what should
                  move together, not just what exists in separate tools.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Trust
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950">
                  Governed autonomy, not blind automation.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Execution can be reviewed, blocked, previewed, audited, and
                  governed before operational changes occur.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Identity
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950">
                  Operators inside a living system.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Aether treats people, lanes, lists, and execution context as
                  connected parts of one operational environment.
                </p>
              </div>
            </section>

            {filteredSections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h2 className="text-2xl font-black text-slate-950">
                  No FAQ results found.
                </h2>
                <p className="mt-2 text-slate-600">
                  Try searching for Abe, Focus, governance, contacts, lists, or
                  ingestion.
                </p>
              </div>
            ) : (
              filteredSections.map((section) => {
                const tone = getToneClasses(section.tone);

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-8 rounded-3xl border p-5 shadow-sm sm:p-6 ${tone.card}`}
                  >
                    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${tone.chip}`}
                        >
                          {section.eyebrow}
                        </div>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                          {section.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          {section.description}
                        </p>
                      </div>

                      <div
                        className={`h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br ${tone.accent} shadow-sm`}
                      />
                    </div>

                    <div className="space-y-4">
                      {section.items.map((item) => (
                        <details
                          key={item.question}
                          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300"
                        >
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                            <h3 className="text-base font-black text-slate-950 sm:text-lg">
                              {item.question}
                            </h3>
                            <span className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">
                              +
                            </span>
                          </summary>

                          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                            {item.answer.map((line) => (
                              <p
                                key={line}
                                className="text-sm leading-7 text-slate-700"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}