import Link from "next/link";

const libraryGroups = [
  {
    title: "Getting Started",
    eyebrow: "Start here",
    links: [
      ["what-is-aether", "What is Aether?"],
      ["campaign-os", "What is a Campaign Operating System?"],
      ["design-philosophy", "Design Philosophy"],
    ],
  },
  {
    title: "Platform",
    eyebrow: "How Aether thinks",
    links: [
      ["honest-abe", "Honest Abe"],
      ["dashboard", "Dashboard"],
      ["focus-mode", "Focus Mode"],
    ],
  },
  {
    title: "Departments",
    eyebrow: "Where work happens",
    links: [
      ["finance", "Finance"],
      ["field", "Field"],
      ["outreach", "Outreach"],
      ["digital", "Digital"],
      ["print", "Print"],
    ],
  },
  {
    title: "Core Features",
    eyebrow: "Shared foundations",
    links: [
      ["contacts", "Contacts"],
      ["lists", "Lists"],
      ["integrations", "Integrations"],
    ],
  },
  {
    title: "Administration",
    eyebrow: "Control and access",
    links: [
      ["organizations", "Organizations"],
      ["team-management", "Team Management"],
      ["roles", "Roles & Permissions"],
    ],
  },
  {
    title: "Platform Resources",
    eyebrow: "Trust and support",
    links: [
      ["security", "Security"],
      ["privacy", "Privacy"],
      ["faq", "Frequently Asked Questions"],
    ],
  },
];

const academySections = [
  ["what-is-aether", "What is Aether?", "Getting Started"],
  ["campaign-os", "What is a Campaign Operating System?", "Getting Started"],
  ["design-philosophy", "Design Philosophy", "Getting Started"],
  ["honest-abe", "Honest Abe", "Platform"],
  ["dashboard", "Dashboard", "Platform"],
  ["focus-mode", "Focus Mode", "Platform"],
  ["finance", "Finance", "Departments"],
  ["field", "Field", "Departments"],
  ["outreach", "Outreach", "Departments"],
  ["digital", "Digital", "Departments"],
  ["print", "Print", "Departments"],
  ["contacts", "Contacts", "Core Features"],
  ["lists", "Lists", "Core Features"],
  ["integrations", "Integrations", "Core Features"],
  ["organizations", "Organizations", "Administration"],
  ["team-management", "Team Management", "Administration"],
  ["roles", "Roles & Permissions", "Administration"],
  ["security", "Security", "Platform Resources"],
  ["privacy", "Privacy", "Platform Resources"],
  ["faq", "Frequently Asked Questions", "Platform Resources"],
];

const academyTabs = [
  { label: "Learning Library", status: "active" },
  { label: "Training Videos", status: "soon" },
  { label: "Articles", status: "post-launch" },
  { label: "Blog", status: "post-launch" },
  { label: "Patch Notes", status: "soon" },
];

export default function AetherAcademyPage() {
  return (
    <main
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#07111f] text-white"
    >
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(245,191,66,0.12),transparent_34%),linear-gradient(180deg,#10233e_0%,#0a1728_52%,#07111f_100%)]" />
        <div className="absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute -left-28 top-44 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-28 lg:py-32">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-300/35 bg-amber-300/10 shadow-[0_0_60px_rgba(245,191,66,0.16)]">
            <span className="text-4xl font-black tracking-[-0.08em] text-amber-300">
              A
            </span>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-200">
            Official Learning Center
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Aether Academy
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            The official reference for understanding Aether Political. Explore
            how the platform works, why it was built, and how each part of the
            Campaign Operating System fits together.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#library"
              className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-7 py-3.5 font-bold text-slate-950 shadow-[0_14px_40px_rgba(245,191,66,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-300"
            >
              Enter the Learning Library
            </a>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/10"
            >
              ← Back to Landing Page
            </Link>
          </div>
        </div>
      </section>

      {/* Academy Navigation */}
      <section className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {academyTabs.map((tab) => {
              const isActive = tab.status === "active";
              const label =
                tab.status === "post-launch"
                  ? "Post Launch"
                  : tab.status === "soon"
                    ? "Coming Soon"
                    : null;

              return (
                <div
                  key={tab.label}
                  className={[
                    "min-w-max rounded-xl border px-4 py-3 transition",
                    isActive
                      ? "border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-[0_10px_30px_rgba(245,191,66,0.08)]"
                      : "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500",
                  ].join(" ")}
                >
                  <div className="text-sm font-bold">{tab.label}</div>
                  {label && (
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academy Intro */}
      <section className="mx-auto max-w-7xl px-6 pt-16 sm:pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.10] via-white/[0.04] to-blue-400/[0.06] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-300">
              Welcome to the Academy
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Learn Aether from the people building it.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Aether Academy is not campaign consulting and it is not a sales
              brochure. It is the official place to understand how Aether is
              structured, what each feature is intended to do, and how campaign
              teams can use the platform in real operational workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Learning Library */}
      <section
        id="library"
        className="scroll-mt-28 mx-auto max-w-7xl px-6 py-16 sm:py-20"
      >
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-300">
            Start Here
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Learning Library
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">
            Use the library below to jump directly to any section. Each guide
            will become part of Aether&apos;s public source of truth as the
            Academy grows.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {libraryGroups.map((group) => (
            <section
              key={group.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-amber-300/30 hover:bg-white/[0.055]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                {group.eyebrow}
              </p>

              <h3 className="mt-2 text-xl font-black text-white">
                {group.title}
              </h3>

              <div className="mt-5 space-y-2">
                {group.links.map(([id, title]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-amber-300/20 hover:bg-amber-300/[0.07] hover:text-amber-200"
                  >
                    <span>{title}</span>
                    <span aria-hidden="true" className="text-amber-300/60">
                      →
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Placeholder Sections */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <div className="grid gap-6">
          {academySections.map(([id, title, category], index) => (
            <article
              key={id}
              id={id}
              className="scroll-mt-32 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] p-8 shadow-xl shadow-black/10 sm:p-10"
            >
              <div className="absolute right-6 top-6 text-7xl font-black text-white/[0.025]">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                    {category}
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Official Guide
                  </span>
                </div>

                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>

                <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-white/15 bg-black/10 px-5 py-5">
                  <p className="font-semibold text-slate-300">
                    This guide is being prepared.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Content will be added as the Aether Learning Library is
                    developed section by section.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer Return */}
      <section className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-black text-white">Aether Academy</p>
            <p className="mt-1 text-sm text-slate-500">
              The official learning center for Aether Political.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 px-6 py-3 font-bold text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-300/15"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </section>

      {/* Back to Top */}
      <a
        href="#top"
        aria-label="Back to top"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200/40 bg-amber-400 font-black text-slate-950 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:bg-amber-300"
      >
        ↑
      </a>
    </main>
  );
}
