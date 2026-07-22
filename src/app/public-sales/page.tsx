import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ContactRound,
  Crown,
  Flag,
  Globe2,
  Layers3,
  Megaphone,
  Network,
  Printer,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";

const tierNavigation = [
  {
    tier: "T1",
    name: "Ground Campaign OS",
    promise: "Build",
    href: "#t1",
    description:
      "A lean operating system for local, volunteer-heavy campaigns that need structure without unnecessary complexity.",
    icon: Flag,
  },
  {
    tier: "T2",
    name: "Operational Campaign OS",
    promise: "Coordinate",
    href: "#t2",
    description:
      "Connected campaign operations for growing teams managing finance, digital, field, outreach, and integrations.",
    icon: Workflow,
  },
  {
    tier: "T3",
    name: "Command Campaign OS",
    promise: "Command",
    href: "#t3",
    description:
      "Strategic command infrastructure for high-scale campaigns where leadership visibility and coordination matter most.",
    icon: Crown,
  },
];

const t1Capabilities = [
  { label: "Contacts", icon: ContactRound },
  { label: "Lists", icon: Layers3 },
  { label: "Calling", icon: Megaphone },
  { label: "Field", icon: Route },
  { label: "Outreach", icon: Users },
  { label: "Print", icon: Printer },
  { label: "Dashboard", icon: BarChart3 },
];

const t2Capabilities = [
  { label: "Everything in T1", icon: CheckCircle2 },
  { label: "Finance", icon: CircleDollarSign },
  { label: "Digital", icon: Globe2 },
  { label: "Honest Abe", icon: Sparkles },
  { label: "Integrations", icon: Network },
  { label: "Campaign Analytics", icon: BarChart3 },
  { label: "Cross-Department Coordination", icon: Workflow },
];

const t3Capabilities = [
  { label: "Everything in T2", icon: CheckCircle2 },
  { label: "Command Infrastructure", icon: Crown },
  { label: "Executive Oversight", icon: Radar },
  { label: "Tools Workspace", icon: Layers3 },
  { label: "Execution Governance", icon: ShieldCheck },
  { label: "Advanced Visibility", icon: Target },
  { label: "High-Scale Support", icon: Building2 },
];

const t1BestFor = [
  "School board races",
  "Township campaigns",
  "City council campaigns",
  "County board campaigns",
  "Small mayoral races",
  "First-time candidates",
  "Volunteer-driven operations",
];

const t2BestFor = [
  "State representative races",
  "State senate races",
  "Countywide campaigns",
  "Serious mayoral campaigns",
  "Growing PACs",
  "Moderate campaign teams",
  "Campaigns with several active departments",
];

const t3BestFor = [
  "Congressional campaigns",
  "Statewide campaigns",
  "Governor campaigns",
  "U.S. Senate campaigns",
  "Large PACs",
  "National political organizations",
  "Healthy multi-department campaign teams",
];

function CapabilityGrid({
  items,
}: {
  items: { label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
            <Icon className="h-4 w-4 text-violet-200" />
          </div>
          <span className="text-sm font-semibold text-slate-100">{label}</span>
        </div>
      ))}
    </div>
  );
}

function BestForList({ items }: { items: string[] }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">
        Best for
      </p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-sm leading-6 text-slate-300">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoButton({ label = "Request a Demo" }: { label?: string }) {
  return (
    <Link
      href="/explore-abe"
      className="inline-flex items-center gap-3 rounded-2xl border border-violet-300/50 bg-gradient-to-b from-violet-500 to-violet-800 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl transition hover:-translate-y-0.5 hover:from-violet-400 hover:to-violet-700"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function PublicSalesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-14rem] top-[-16rem] h-[38rem] w-[38rem] rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute right-[-18rem] top-[26rem] h-[42rem] w-[42rem] rounded-full bg-blue-700/15 blur-3xl" />
        <div className="absolute bottom-[-20rem] left-[25%] h-[38rem] w-[38rem] rounded-full bg-fuchsia-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Landing Page</span>
        </Link>

        <section className="mt-8 rounded-[2.5rem] border border-white/10 bg-white/[0.045] px-6 py-12 shadow-2xl backdrop-blur-xl sm:px-10 lg:px-14 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
            <Layers3 className="h-4 w-4" />
            Aether Campaign Tiers
          </div>

          <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1fr_0.42fr]">
            <div>
              <h1 className="max-w-5xl text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                Choosing the Right Campaign Operating System
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
                Aether is not divided into good, better, and best. Each tier is
                designed for a different level of campaign maturity, staffing,
                operational complexity, and coordination pressure.
              </p>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Every campaign runs on the same core operating system. You begin
                with the structure your organization needs today, then unlock
                deeper coordination and command capabilities as the campaign grows.
              </p>
            </div>

            <div className="rounded-[2rem] border border-violet-300/20 bg-violet-500/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">
                The progression
              </p>
              <div className="mt-5 space-y-4">
                {[
                  ["T1", "Build"],
                  ["T2", "Coordinate"],
                  ["T3", "Command"],
                ].map(([tier, word]) => (
                  <div
                    key={tier}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#07111F]/50 px-4 py-3"
                  >
                    <span className="text-sm font-black text-violet-200">
                      {tier}
                    </span>
                    <span className="text-lg font-black">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <a
            href="#choose-tier"
            className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            Explore the tiers
            <ChevronDown className="h-4 w-4" />
          </a>
        </section>

        <section id="choose-tier" className="scroll-mt-8 py-20">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">
              Quick navigation
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Start with the campaign you are running.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Select a tier for a clear explanation of who it serves, what it
              solves, and how it changes the way a campaign operates.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {tierNavigation.map(
              ({ tier, name, promise, href, description, icon: Icon }) => (
                <a
                  key={tier}
                  href={href}
                  className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black tracking-[0.15em] text-violet-200">
                      {tier}
                    </span>
                    <Icon className="h-6 w-6 text-violet-300 transition group-hover:scale-110" />
                  </div>

                  <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                    {promise}
                  </p>
                  <h3 className="mt-3 text-3xl font-black">{name}</h3>
                  <p className="mt-5 leading-7 text-slate-300">{description}</p>

                  <div className="mt-8 flex items-center gap-2 text-sm font-black text-violet-200">
                    Explore {tier}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </a>
              ),
            )}
          </div>
        </section>

        <section
          id="t1"
          className="scroll-mt-8 rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="grid gap-10 xl:grid-cols-[1fr_0.34fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-violet-200">
                  T1
                </span>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                  Build
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Ground Campaign OS
              </h2>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
                For lean, underfunded, volunteer-heavy campaigns that need
                structure without unnecessary complexity.
              </p>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">
                    What it solves
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    Small campaigns often run on spreadsheets, text threads,
                    notebooks, and institutional memory. T1 gives the campaign one
                    operational home for organizing people, lists, outreach, field
                    work, print activity, and daily execution.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">
                    Why campaigns choose it
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    The challenge is not managing a complex organization. It is
                    making sure volunteers know what to do, campaign information
                    stays organized, and important work does not disappear between
                    disconnected tools.
                  </p>
                </div>
              </div>
            </div>

            <BestForList items={t1BestFor} />
          </div>

          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">
                  Core capabilities
                </p>
                <h3 className="mt-3 text-3xl font-black">
                  The structure to run the ground game.
                </h3>
                <p className="mt-4 leading-7 text-slate-300">
                  T1 brings the campaign's essential execution workflows into one
                  connected system.
                </p>
              </div>
              <CapabilityGrid items={t1Capabilities} />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-violet-300/20 bg-violet-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black">This campaign needs structure, not complexity.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                See how Ground Campaign OS can organize your daily operation.
              </p>
            </div>
            <DemoButton label="Explore T1" />
          </div>
        </section>

        <section
          id="t2"
          className="mt-10 scroll-mt-8 rounded-[2.5rem] border border-blue-400/25 bg-blue-500/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="grid gap-10 xl:grid-cols-[1fr_0.34fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-blue-200">
                  T2
                </span>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                  Coordinate
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Operational Campaign OS
              </h2>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
                For growing campaigns with real staff, consultants, finance
                activity, digital work, integrations, and several operational
                lanes moving at once.
              </p>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                    What it solves
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    As campaigns grow, the problem shifts from simple organization
                    to connected operations. Finance, field, outreach, digital,
                    print, and leadership need a shared view of what is happening
                    without forcing the campaign into enterprise overhead.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                    Why campaigns choose it
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    T2 connects active departments, adds campaign intelligence,
                    supports integrations, and helps leadership understand where
                    execution is moving, slowing, or creating operational pressure.
                  </p>
                </div>
              </div>
            </div>

            <BestForList items={t2BestFor} />
          </div>

          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                  Core capabilities
                </p>
                <h3 className="mt-3 text-3xl font-black">
                  Full campaign operations, connected.
                </h3>
                <p className="mt-4 leading-7 text-slate-300">
                  T2 expands the ground operating system into a shared operational
                  layer for the entire campaign.
                </p>
              </div>
              <CapabilityGrid items={t2Capabilities} />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-blue-300/20 bg-blue-400/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black">
                This campaign has multiple lanes moving at once.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                See how Operational Campaign OS connects the work across departments.
              </p>
            </div>
            <DemoButton label="Explore T2" />
          </div>
        </section>

        <section
          id="t3"
          className="mt-10 scroll-mt-8 rounded-[2.5rem] border border-amber-300/25 bg-amber-300/[0.055] p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="grid gap-10 xl:grid-cols-[1fr_0.34fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-amber-200">
                  T3
                </span>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                  Command
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Command Campaign OS
              </h2>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
                For high-scale campaigns where coordination complexity becomes the
                real operational risk and leadership needs visibility across the
                organization.
              </p>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                    What it solves
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    Large campaigns do not fail because one person forgot a task.
                    They struggle when departments, leadership layers, information,
                    approvals, and execution pressure stop moving in the same
                    direction.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111F]/45 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                    Why campaigns choose it
                  </p>
                  <p className="mt-4 leading-8 text-slate-300">
                    T3 adds the command infrastructure required to coordinate the
                    people, departments, signals, decisions, governance, and
                    executive visibility behind a complex political organization.
                  </p>
                </div>
              </div>
            </div>

            <BestForList items={t3BestFor} />
          </div>

          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Core capabilities
                </p>
                <h3 className="mt-3 text-3xl font-black">
                  Strategic command behind the operation.
                </h3>
                <p className="mt-4 leading-7 text-slate-300">
                  T3 extends connected campaign operations into leadership,
                  governance, and high-scale coordination.
                </p>
              </div>
              <CapabilityGrid items={t3Capabilities} />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black">
                This campaign has coordination complexity.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                See how Command Campaign OS gives leadership a complete operational view.
              </p>
            </div>
            <DemoButton label="Explore T3" />
          </div>
        </section>

        <section className="mt-20 rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
                <Network className="h-4 w-4" />
                One System
              </div>
              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                Every tier runs on the same foundation.
              </h2>
            </div>

            <div>
              <p className="text-lg leading-8 text-slate-300">
                Upgrading Aether never means rebuilding your campaign on a new
                platform. Your contacts, lists, workflows, dashboards, reporting,
                and campaign history stay with you.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                As the organization grows, Aether simply unlocks the next layer of
                operational capability—moving the campaign from structure, to
                coordination, to command.
              </p>
            </div>
          </div>
        </section>

        <section className="my-20 rounded-[2.5rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/15 via-white/[0.04] to-blue-500/10 p-8 text-center shadow-2xl lg:p-14">
          <Sparkles className="mx-auto h-10 w-10 text-violet-300" />
          <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Still not sure which tier fits?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Every campaign operates differently. We will walk through your staffing,
            departments, goals, timeline, and operational pressure, then recommend
            the tier that honestly fits your organization.
          </p>
          <div className="mt-9">
            <DemoButton />
          </div>
        </section>
      </div>
    </main>
  );
}
