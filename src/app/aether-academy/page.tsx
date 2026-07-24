import Image from "next/image";
import Link from "next/link";

const libraryGroups = [
  {
    title: "Getting Started",
    eyebrow: "Start here",
    links: [
      ["welcome-to-aether", "Welcome to Aether!"],
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
      ["aether-mobile", "Aether Mobile"],
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
      ["imports", "Imports"],
      ["tools", "Tools"],
      ["integrations-hub", "Integrations Hub"],
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
  ["welcome-to-aether", "Welcome to Aether!", "Getting Started"],
  ["what-is-aether", "What is Aether?", "Getting Started"],
  ["campaign-os", "What is a Campaign Operating System?", "Getting Started"],
  ["design-philosophy", "Design Philosophy", "Getting Started"],
  ["honest-abe", "Honest Abe", "Platform"],
  ["dashboard", "Dashboard", "Platform"],
  ["focus-mode", "Focus Mode", "Platform"],
  ["aether-mobile", "Aether Mobile", "Platform"],
  ["finance", "Finance", "Departments"],
  ["field", "Field", "Departments"],
  ["outreach", "Outreach", "Departments"],
  ["digital", "Digital", "Departments"],
  ["print", "Print", "Departments"],
  ["contacts", "Contacts", "Core Features"],
  ["lists", "Lists", "Core Features"],
  ["imports", "Imports", "Core Features"],
  ["tools", "Tools", "Core Features"],
  ["integrations-hub", "Integrations Hub", "Core Features"],
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
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,#10233e_0%,#0a1728_52%,#07111f_100%)]" />
        <div className="absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute -left-28 top-44 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-28 lg:py-32">
          <div className="mb-8 flex items-center justify-center">
            <Image
              src="/aether-logo-full.png"
              alt="Aether"
              width={260}
              height={72}
              priority
              className="h-auto w-64 drop-shadow-[0_0_24px_rgba(139,92,246,0.35)]"
            />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-violet-300">
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
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-7 py-3.5 font-bold text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-400"
            >
              Enter the Learning Library
            </a>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
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
                      ? "border-violet-400/40 bg-violet-400/10 text-violet-300 shadow-[0_10px_30px_rgba(139,92,246,0.08)]"
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
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[0.10] via-white/[0.04] to-blue-400/[0.06] p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
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
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
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
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.055]"
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
                    className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-violet-400/20 hover:bg-violet-400/[0.07] hover:text-violet-300"
                  >
                    <span>{title}</span>
                    <span aria-hidden="true" className="text-violet-400/60">
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
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                    {category}
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Official Guide
                  </span>
                </div>

                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>

                {id === "welcome-to-aether" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">
                      Welcome to the Aether Campaign Operating System. Whether you're launching a campaign for the first time or transitioning from another platform, we're excited to be part of your team.
                    </p>
                    <p className="leading-8">
                      Aether was built to help campaigns stay organized, work together more effectively, and spend less time managing software so they can spend more time connecting with voters and supporters.
                    </p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-xl font-bold text-white">Getting Started</h3>
                      <p className="mt-3">If you're just getting started, we recommend following these steps:</p>
                      <ol className="mt-4 list-decimal space-y-2 pl-6">
                        <li>Invite your team members.</li>
                        <li>Assign roles and departments.</li>
                        <li>Import your contacts and campaign data.</li>
                        <li>Connect your campaign's integrations.</li>
                        <li>Begin executing your campaign.</li>
                      </ol>
                      <p className="mt-4">Completing these steps will give your organization a strong foundation and ensure everyone is working from the same information.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Continue Learning</h3>
                      <p className="mt-3 leading-8">The Aether Academy is designed to grow alongside the platform.</p>
                      <p className="mt-3 leading-8">As new features are introduced and existing workflows evolve, the Academy will continue expanding with updated guides, best practices, and operational resources to help your campaign get the most out of Aether.</p>
                      <p className="mt-3 leading-8">If you ever have a quick question, don't forget to visit the Frequently Asked Questions section for fast answers to common topics.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">We're Here to Help</h3>
                      <p className="mt-3 leading-8">Running a campaign is challenging, and we believe your software should be backed by a team that's invested in your success.</p>
                      <p className="mt-3 leading-8">If you have questions, ideas, or feedback, Team Aether would love to hear from you. Whether you've found an opportunity to improve Aether, have a feature you'd like to see, or simply need assistance getting the most out of the platform, we're always happy to help.</p>
                      <p className="mt-3 leading-8">Your feedback plays an important role in shaping Aether's future, and many of the improvements made to the platform come directly from the campaigns that use it every day.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <p className="text-2xl font-black text-white">Clarity. Focus. Execution.</p>
                      <p className="mt-4 leading-8">Thank you for choosing Aether.</p>
                      <p className="mt-3 leading-8">We're honored to be part of your campaign, and we look forward to helping your team stay organized, focused, and ready to execute every step of the way.</p>
                    </div>
                  </div>
                ) : id === "what-is-aether" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Most campaign software is designed to solve a single problem.</p>
                    <p className="leading-8">One application helps you raise money. Another helps you knock doors. Another manages volunteers. Another tracks digital advertising. Another stores contacts.</p>
                    <p className="leading-8">Each platform often comes with its own subscription, implementation, training, and operational cost. As campaigns grow, those costs add up—not just financially, but in the time spent switching between systems, reconciling data, and keeping departments aligned.</p>
                    <p className="leading-8">Campaigns are among the most complex temporary organizations in the world. Finance teams, field operations, digital communications, outreach, volunteer coordination, compliance, and leadership must all move in sync under constant time pressure. Yet most campaigns still rely on disconnected software that was never designed to operate as a unified system.</p>
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Aether was built to solve a different problem.</h3>
                      <p className="mt-4 leading-8">Rather than creating another campaign tool, Aether was designed as a Campaign Operating System—a single platform where every major department can operate together.</p>
                      <p className="mt-3 leading-8">Finance, Field, Outreach, Digital, and Print all work from the same foundation. Contacts, lists, tasks, operational metrics, and campaign intelligence exist in one shared environment instead of being scattered across multiple applications.</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">One Shared Operating Picture</h3>
                      <p className="mt-3 leading-8">This creates a campaign where information moves naturally between departments instead of becoming trapped inside them.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>A finance director can understand how fundraising affects field operations.</li>
                        <li>A field director can see how volunteer activity impacts campaign priorities.</li>
                        <li>Leadership gains a single operational picture instead of trying to combine reports from five different systems.</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">The goal is not simply to organize information. The goal is to improve execution.</p>
                      <p className="mt-3 leading-8">Campaigns succeed because people consistently execute the right work at the right time. Aether exists to make that execution easier by reducing operational friction, improving coordination, and giving campaign teams a common operating picture.</p>
                      <p className="mt-4 text-lg font-semibold text-white">In short, Aether is not a collection of campaign tools. It is the operating system that brings them together.</p>
                    </div>
                  </div>
                ) : id === "campaign-os" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">A campaign is more than a collection of departments. It is a living organization made up of people, information, priorities, and constant decision-making.</p>
                    <p className="leading-8">Every day, finance teams raise money, field organizers knock doors, digital teams publish content, outreach teams build relationships, print teams prepare campaign materials, and leadership makes strategic decisions that affect every part of the organization.</p>
                    <p className="leading-8">Traditionally, each department operates inside its own software. Every additional platform introduces another subscription, another login, another dataset, and another operational cost. As campaigns grow, those costs compound—not only financially, but operationally.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">A Campaign Operating System approaches that challenge differently.</h3>
                      <p className="mt-4 leading-8">Rather than treating every department as its own isolated workflow, a Campaign Operating System provides a shared operational foundation where the entire campaign works together inside a single environment.</p>
                      <p className="mt-3 leading-8">Contacts exist once. Lists exist once. Tasks, operational metrics, campaign activity, and organizational knowledge are shared across every department instead of being duplicated between multiple platforms.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">One Connected Organization</h3>
                      <p className="mt-3 leading-8">Finance, Field, Outreach, Digital, and Print operate independently while remaining connected to the same operational picture.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>Finance can conduct donor call time while Field builds walking lists.</li>
                        <li>Print can prepare literature before volunteers reach the doors.</li>
                        <li>Digital contributes campaign activity without operating in isolation.</li>
                        <li>Leadership sees one campaign operating together instead of combining reports from multiple systems.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">The Operational Loop</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6">
                        <li>Information enters the system.</li>
                        <li>It is organized.</li>
                        <li>Work is assigned.</li>
                        <li>Teams execute.</li>
                        <li>Results are measured.</li>
                        <li>New priorities are identified.</li>
                        <li>The campaign learns, and the process begins again.</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Honest Abe</h3>
                      <p className="mt-3 leading-8">Because every department operates from the same foundation, Honest Abe can interpret information across the entire campaign rather than within isolated departments. Abe identifies operational pressure, highlights dependencies, and helps leadership understand what matters most next.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">The Philosophy Behind Aether</h3>
                      <p className="mt-4 leading-8">A Campaign Operating System is not defined by the number of features it contains. It is defined by how effectively it helps an organization operate as one connected team.</p>
                      <p className="mt-4 text-lg font-semibold text-white">It is not simply a place where campaign work is recorded. It is the operating system that helps a campaign execute as one connected organization.</p>
                    </div>
                  </div>
                ) : id === "design-philosophy" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every piece of software reflects the priorities of the people who build it. Every workflow, page, and system inside Aether was designed around a single question:</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <p className="text-2xl font-black text-white">How can we make campaigns easier to execute?</p>
                    </div>

                    <p className="leading-8">Campaigns are fast-moving organizations. Software should reduce that complexity—not add to it. That belief became the foundation of Aether's design philosophy.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <h4 className="mt-5 text-xl font-semibold text-white">Clarity</h4>
                      <p className="mt-2 leading-8">Campaign teams need accurate, connected information that is easy to find.</p>
                      <h4 className="mt-5 text-xl font-semibold text-white">Focus</h4>
                      <p className="mt-2 leading-8">Reduce noise and help every department identify its highest priorities.</p>
                      <h4 className="mt-5 text-xl font-semibold text-white">Execution</h4>
                      <p className="mt-2 leading-8">Software exists to make campaign work easier—not replace it.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Everything Is a Loop</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6">
                        <li>Information enters the system.</li>
                        <li>It is interpreted.</li>
                        <li>It is organized.</li>
                        <li>Work is assigned.</li>
                        <li>Teams execute.</li>
                        <li>Results are measured.</li>
                        <li>The process begins again.</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">One Campaign, Not Five Departments</h3>
                      <p className="mt-3 leading-8">Departments remain specialized. The campaign remains unified. Finance, Field, Outreach, Digital, Print, and Leadership all contribute to a single operational picture instead of operating in isolation.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity Through Context</h3>
                      <p className="mt-4 leading-8">Aether does not remove complexity—it contextualizes it. Different users, roles, and subscription tiers see the tools they need when they need them, reducing cognitive load while preserving capability.</p>
                      <p className="mt-4 leading-8">Clarity is achieved not by removing features. It is achieved by providing the right context.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Technology Should Support People</h3>
                      <p className="mt-3 leading-8">Technology should remove friction, simplify coordination, and help campaign staff spend less time managing software and more time accomplishing meaningful work. Honest Abe, execution loops, contextual interfaces, and cross-department visibility all exist to help campaigns make better decisions and execute with greater confidence.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Software Should Adapt to the Campaign</h3>
                      <p className="mt-4 leading-8">Every campaign is different. Features are introduced when they create value, complexity is revealed only when it becomes useful, and information flows between departments instead of becoming isolated.</p>
                      <p className="mt-4 text-lg font-semibold text-white">The software serves the campaign. The campaign should never have to serve the software.</p>
                    </div>
                  </div>
                ) : id === "honest-abe" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">A Strategy Engine, Not an AI Assistant</h3>
                      <p className="mt-4 leading-8">Despite its name, Honest Abe was never designed to be an artificial intelligence assistant. At its core, Honest Abe is a campaign strategy engine built to continuously interpret campaign operations, identify opportunities, recognize operational pressure, and help keep work moving throughout the organization.</p>
                      <p className="mt-3 leading-8">Artificial intelligence may enhance those capabilities in the future, but it is not what makes Honest Abe valuable. The operational model behind it does.</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Built Around Campaign Strategy</h3>
                      <p className="mt-3 leading-8">Rather than answering questions like a chatbot, Abe continuously evaluates how the campaign is operating and helps ensure the right work reaches the right people at the right time. Its purpose is not conversation. Its purpose is execution.</p>
                      <p className="mt-3 leading-8">As campaign priorities shift throughout the election cycle, Honest Abe adapts its interpretation so recommendations reflect where the campaign is today—not where it was months ago.</p>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Quietly Keeping Work Moving</h3>
                      <p className="mt-4 leading-8">Most of the time, Abe works quietly behind the scenes—routing work, keeping information flowing between departments, and reducing unnecessary coordination so campaign teams can focus on execution instead of administration.</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Finding Opportunities Hidden in the Data</h3>
                      <p className="mt-3 leading-8">Honest Abe connects imported contacts, voter files, contribution history, department activity, and campaign metrics to surface relationships that might otherwise go unnoticed. The campaign remains in control—Abe simply helps make valuable opportunities easier to discover.</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Human Judgment Always Comes First</h3>
                      <p className="mt-3 leading-8">Campaign professionals remain responsible for setting priorities and making strategic decisions. Honest Abe provides operational awareness, not automated campaign strategy.</p>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built for Today. Ready for Tomorrow.</h3>
                      <p className="mt-4 leading-8">Honest Abe is not dependent on any single AI model. As artificial intelligence evolves, Aether can incorporate it where it genuinely improves campaign operations. The intelligence comes from understanding how campaigns work—not from relying on a particular technology.</p>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Why “Honest Abe”?</h3>
                      <p className="mt-4 leading-8">Campaign leaders need software that helps them understand what they need to know—not simply what they want to hear. Honest Abe was designed to think about the operational health of the campaign so campaign teams can spend more time leading it.</p>
                    </div>
                  </div>
                ) : id === "dashboard" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign generates information. The purpose of a dashboard is not simply to display those numbers. Its purpose is to transform campaign activity into operational awareness.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Department Intelligence</h3>
                      <p className="mt-4 leading-8">Every major department inside Aether has its own dashboard designed around its responsibilities. Finance, Field, Outreach, Digital, and Print each receive analytics focused on helping that department make better operational decisions.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Cross-Domain Intelligence</h3>
                      <p className="mt-3 leading-8">Because every department operates inside the same Campaign Operating System, Aether surfaces operational relationships that traditional reporting tools often miss.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>Print production affecting upcoming field operations.</li>
                        <li>Volunteer capacity influencing outreach efforts.</li>
                        <li>Campaign activity contributing to fundraising momentum.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Honest Abe Across the Platform</h3>
                      <p className="mt-4 leading-8">Every department dashboard includes department-specific strategic observations, while the Overview Dashboard expands to interpret the health of the campaign as a whole.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">The Overview Dashboard</h3>
                      <p className="mt-3 leading-8">The Overview Dashboard provides leadership with a unified view of campaign health through summary cards and campaign-wide analytics spanning Finance, Field, Outreach, Digital, and Print.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Designed for Better Decisions</h3>
                      <p className="mt-4 leading-8">Every visualization, metric, and operational indicator exists for one reason: to support better decisions. Together, Aether's dashboards transform campaign activity into operational awareness so every level of the organization can execute with confidence.</p>
                    </div>
                  </div>
                ) : id === "focus-mode" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign has work that needs to be completed. Focus Mode was designed around a simple question:</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <p className="text-2xl font-black text-white">What should you be working on right now?</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">One Task at a Time</h3>
                      <p className="mt-3 leading-8">Rather than presenting hundreds of records, lists, and competing priorities, Focus Mode narrows attention to the work immediately in front of the user.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>One donor.</li>
                        <li>One voter.</li>
                        <li>One conversation.</li>
                        <li>One task.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built Around Execution</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6">
                        <li>Information is collected.</li>
                        <li>Work is interpreted.</li>
                        <li>Tasks are organized.</li>
                        <li>Assignments are prepared.</li>
                        <li>Execution begins.</li>
                        <li>Progress is measured.</li>
                        <li>The campaign moves forward.</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Focused at Every Level</h3>
                      <p className="mt-3 leading-8">Every department has its own Focus Mode experience, while campaign leadership receives a version built around coordination, prioritization, delegation, and organizational execution.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Context Without Distraction</h3>
                      <p className="mt-4 leading-8">Focus Mode does not hide information—it prioritizes it. Relevant history and context remain available while navigation, analytics, and administrative tools step into the background to reduce cognitive load.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Guided, Not Controlled</h3>
                      <p className="mt-3 leading-8">Campaign professionals remain in control. Focus Mode guides work, removes the friction of deciding what comes next, and allows staff to spend more time executing meaningful work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8">Every completed task immediately strengthens the campaign's operational picture. Dashboards update, analytics evolve, Honest Abe gains additional context, and leadership gains greater visibility.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Focus Mode reduces complexity without reducing capability, provides context without distraction, and guides execution without replacing human judgment.</p>
                    </div>
                  </div>
                ) : id === "aether-mobile" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaign work doesn't stop when you leave the office. Aether Mobile extends the Campaign Operating System beyond the desktop, allowing campaign teams to stay connected and execute work wherever it happens.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built for Execution</h3>
                      <p className="mt-4 leading-8">The desktop experience is designed for planning and strategy. Aether Mobile is designed for execution, streamlining daily campaign work instead of recreating every desktop feature on a smaller screen.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Search and Manage Contacts</h3>
                      <p className="mt-3 leading-8">Quickly search existing contacts, review information, update records, and add new contacts from fundraisers, parades, community events, or wherever valuable information is collected.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Finance, Outreach, and Field</h3>
                      <p className="mt-3 leading-8">Assigned Finance, Outreach, and Field lists are organized for rapid execution, allowing campaign staff to record dispositions, notes, and activity while moving efficiently from one conversation to the next.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Connected in Real Time</h3>
                      <p className="mt-4 leading-8">Notes, dispositions, new contacts, and completed work synchronize immediately with the campaign, ensuring every authorized team member operates from the same source of truth.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Campaigns aren't won from behind a computer. They're won through conversations, relationships, and consistent execution in the real world. Aether Mobile brings the Campaign Operating System into the field so your team can stay organized, capture important information, and keep the campaign moving wherever the work takes them.</p>
                    </div>
                  </div>
                ) : id === "finance" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign is built on relationships. Donors provide the resources that allow campaigns to communicate, organize, and compete. Aether's Finance department was built to strengthen those relationships while helping fundraising teams execute with confidence.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">More Than Donor Records</h3>
                      <p className="mt-4 leading-8">Every contribution represents a relationship. Every pledge represents a future opportunity. Every conversation helps campaign teams better understand the people investing in the campaign's success.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Organized for Call Time</h3>
                      <p className="mt-3 leading-8">Donor lists can be built around fundraising goals, giving history, campaign priorities, or custom criteria. Focus Mode then guides finance staff through donor outreach one conversation at a time.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Understanding the Entire Donor Journey</h3>
                      <p className="mt-3 leading-8">Contribution history, pledge tracking, running notes, previous interactions, contact information, and campaign activity are brought together into a single donor profile so every conversation begins with context.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">The Jackpot Engine</h3>
                      <p className="mt-4 leading-8">Using campaign activity, donor history, and current FEC contribution data, Honest Abe helps score and prioritize fundraising opportunities. The resulting Jackpot Calling List complements—not replaces—the custom lists created by campaign staff.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Intelligence That Supports Fundraising</h3>
                      <p className="mt-3 leading-8">Finance dashboards provide fundraising analytics, pledge trends, operational intelligence, and department-specific observations from Honest Abe while maintaining visibility into how fundraising connects with the rest of the campaign.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built for Compliance</h3>
                      <p className="mt-3 leading-8">Contribution records are collected as part of everyday workflow. Before export, Aether validates required reporting information and converts missing data into actionable Focus Mode tasks instead of producing incomplete exports.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built to Work Alongside Your Campaign</h3>
                      <p className="mt-3 leading-8">Whether your organization emphasizes call time, events, major donors, digital fundraising, or community outreach, Aether adapts to your fundraising strategy rather than forcing a single workflow.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Aether's Finance department combines relationship management, focused execution, opportunity discovery, operational intelligence, and compliance readiness into one connected workflow designed to help campaigns build the financial foundation needed to achieve their goals.</p>
                    </div>
                  </div>
                ) : id === "field" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaigns are built one conversation at a time. The Field department helps campaigns organize canvassing efforts, execute them efficiently, and ensure every voter interaction strengthens the campaign as a whole.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Organizing the Work</h3>
                      <p className="mt-4 leading-8">Field lists can be created around geography, voter characteristics, campaign priorities, or custom criteria. Focus Mode then turns that plan into action—one address, one conversation, and one voter at a time.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Every Conversation Matters</h3>
                      <p className="mt-3 leading-8">Supporters, volunteers, yard sign requests, and voter issues all become part of the campaign's shared operational knowledge, helping every department better understand the communities they serve.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">One Campaign. One Platform.</h3>
                      <p className="mt-4 leading-8">Field teams operate within the same Campaign Operating System as Finance, Outreach, Digital, Print, and Leadership. Every conversation immediately becomes available to the rest of the campaign, creating one connected operational picture.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built for the Real World</h3>
                      <p className="mt-3 leading-8">Whether knocking doors or attending community events, Aether Mobile allows campaign staff to search contacts, work assigned lists, record conversations, and update voter information directly from the field.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Intelligence That Improves Every Pass</h3>
                      <p className="mt-3 leading-8">Every round of canvassing creates new information. Honest Abe and the Campaign Operating System transform those insights into better lists, improved strategy, and stronger execution on every future pass.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Aether doesn't change the fundamentals of canvassing. It ensures every conversation contributes to something larger, helping every interaction strengthen the entire campaign.</p>
                    </div>
                  </div>
                ) : id === "outreach" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign creates opportunities. The Outreach department helps campaigns maintain that momentum by ensuring every conversation has the opportunity to become something more.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Every Conversation Deserves a Response</h3>
                      <p className="mt-4 leading-8">Whether someone requested information, attended an event, expressed interest in volunteering, or simply needs a follow-up call, Outreach organizes ongoing relationships so opportunities aren't forgotten.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Organized Around Momentum</h3>
                      <p className="mt-3 leading-8">Lists can be built around volunteer recruitment, event follow-up, supporter engagement, community outreach, or any campaign objective. Focus Mode then guides staff through each interaction one conversation at a time.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Connecting Every Department</h3>
                      <p className="mt-4 leading-8">Finance, Field, Digital, and events all create opportunities that Outreach carries forward. Because every department shares the same contact database, information flows naturally without disconnected systems or duplicate work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built Around Relationships</h3>
                      <p className="mt-3 leading-8">Running notes, previous interactions, contact history, and campaign activity remain connected to every contact, allowing conversations to continue where they last ended instead of starting over.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Intelligence That Keeps Campaigns Moving</h3>
                      <p className="mt-3 leading-8">The Outreach Dashboard monitors engagement, follow-up progress, and operational health while Honest Abe highlights relationships and opportunities that deserve additional attention.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">The value of every campaign interaction is created through thoughtful follow-up. Outreach ensures those opportunities don't disappear, helping campaigns build stronger relationships through consistent communication and purposeful execution.</p>
                    </div>
                  </div>
                ) : id === "digital" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">
                      Modern campaigns are no longer fought only on front porches and at fundraising events.
                    </p>
                    <p className="leading-8">
                      Every day, campaigns compete for attention across social media, websites, digital advertising, email, text messaging, and online communities.
                    </p>
                    <p className="leading-8">
                      Every post. Every advertisement. Every video. Every email. Every message contributes to the story a campaign tells.
                    </p>
                    <p className="leading-8">
                      The Digital department was designed to help campaigns organize that work, understand its impact, and communicate more effectively across every platform they use.
                    </p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Every Platform Tells Part of the Story</h3>
                      <p className="mt-4 leading-8">
                        Campaigns rarely communicate through a single channel. Supporters may discover the campaign through Facebook, watch a speech on YouTube, visit the campaign website, respond to an email, see a digital advertisement, or read a social media post.
                      </p>
                      <p className="mt-3 leading-8">
                        No single platform tells the entire story.
                      </p>
                      <p className="mt-3 leading-8">
                        Rather than replacing those platforms, Aether helps campaigns understand how they work together. By bringing analytics from supported integrations into one Campaign Operating System, Digital directors gain a clearer picture of how their online efforts contribute to the campaign&apos;s overall strategy.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Organized Around Execution</h3>
                      <p className="mt-3 leading-8">
                        Great digital campaigns aren&apos;t built one post at a time. They&apos;re built through planning, coordination, and consistent execution.
                      </p>
                      <p className="mt-3 leading-8">
                        The Digital department gives campaign teams a centralized place to organize upcoming work, manage content schedules, assign responsibilities, and track deliverables from creation through completion.
                      </p>
                      <p className="mt-3 leading-8">
                        Whether preparing graphics for an endorsement, coordinating a fundraising campaign, planning Election Day messaging, or organizing content around an upcoming event, Digital teams can manage their workload alongside every other department in the campaign.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Helping Campaigns Stay Engaged</h3>
                      <p className="mt-4 leading-8">
                        Publishing content is only one part of digital communication. Responding to supporters is just as important.
                      </p>
                      <p className="mt-3 leading-8">
                        Aether doesn&apos;t publish social media posts, and it doesn&apos;t respond to comments on a campaign&apos;s behalf. Instead, supported integrations can identify new audience interactions and provide response templates for common situations.
                      </p>
                      <p className="mt-3 leading-8">
                        Every response remains under the campaign&apos;s control. Nothing is posted automatically. Campaign staff can personalize a suggested response, copy it into the appropriate platform, and continue engaging with their community.
                      </p>
                      <p className="mt-3 leading-8">
                        The result isn&apos;t automated communication. It&apos;s faster, more consistent communication.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Intelligence Beyond Individual Platforms</h3>
                      <p className="mt-3 leading-8">
                        Every digital platform provides analytics: likes, views, comments, reach, engagement, website traffic, and advertising performance.
                      </p>
                      <p className="mt-3 leading-8">
                        The challenge isn&apos;t finding data. It&apos;s understanding what that data means for the campaign.
                      </p>
                      <p className="mt-3 leading-8">
                        Rather than asking campaign staff to jump between multiple dashboards, Aether brings those insights together into one operational view. Campaign leadership can better understand how digital efforts contribute to fundraising, volunteer engagement, voter outreach, and overall campaign performance, while Honest Abe helps identify meaningful trends and emerging opportunities.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8">
                        Digital doesn&apos;t exist in isolation. A successful fundraising appeal may generate increased online engagement. A field event may drive website traffic. An endorsement may increase volunteer interest. An important announcement may influence fundraising, field operations, and outreach simultaneously.
                      </p>
                      <p className="mt-3 leading-8">
                        Because the Digital department operates alongside Finance, Field, Outreach, Print, and campaign leadership, those connections become visible.
                      </p>
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="font-semibold text-white">Instead of asking:</p>
                        <p className="mt-2 italic leading-8">&ldquo;How did this post perform?&rdquo;</p>
                        <p className="mt-4 font-semibold text-white">Campaigns can begin asking:</p>
                        <p className="mt-2 italic leading-8">&ldquo;What impact did this have across the campaign?&rdquo;</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">
                        Digital campaigns generate an extraordinary amount of information. The challenge has never been collecting data. The challenge has always been turning that information into meaningful action.
                      </p>
                      <p className="mt-3 leading-8">
                        Aether helps campaigns organize their digital work, understand their performance, and engage more consistently with the communities they serve.
                      </p>
                      <p className="mt-3 leading-8">
                        It doesn&apos;t replace the platforms campaigns already rely on. It brings them together into one operational picture, helping campaign teams communicate with greater purpose and execute with greater confidence.
                      </p>
                      <p className="mt-4 text-lg font-semibold text-white">
                        Because successful digital strategy isn&apos;t measured by likes or impressions alone. It&apos;s measured by the real-world impact those efforts have on the campaign.
                      </p>
                    </div>
                  </div>
                ) : id === "print" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaigns don't exist only online. They exist in neighborhoods, at community events, on front lawns, in mailboxes, and in the hands of volunteers. The Print department helps ensure campaigns always have the materials they need to execute.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Equipping the Campaign</h3>
                      <p className="mt-4 leading-8">Walk literature, palm cards, direct mail, yard signs, volunteer apparel, banners, event signage, and campaign resources are organized from planning through distribution so they're available before they're needed.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Organized Around Execution</h3>
                      <p className="mt-3 leading-8">Every print project moves through planning, design, review, approval, production, delivery, and distribution. Focus Mode keeps every step visible and moving toward completion.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Inventory That Works for You</h3>
                      <p className="mt-4 leading-8">Aether tracks inventory across campaign materials and alerts leadership before shortages become operational problems, making reorders proactive instead of reactive.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Planning Beyond Today</h3>
                      <p className="mt-3 leading-8">Production timelines, expected deliveries, and inventory forecasts help campaign leadership identify risks early and coordinate upcoming events with confidence.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8">Print works alongside Finance, Field, Outreach, Digital, and Leadership. Requests, approvals, inventory, and project progress become part of one shared operational picture instead of isolated production work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Intelligence That Keeps Campaigns Ready</h3>
                      <p className="mt-3 leading-8">The Print Dashboard and Honest Abe monitor inventory, production timelines, delivery schedules, and resource readiness so campaigns can prepare for what's coming next rather than simply reacting.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Every printed piece is an opportunity to strengthen the campaign. The Print department ensures campaign materials are organized, available, and delivered when they're needed most—because successful campaigns are equipped through planning, coordination, and consistent execution.</p>
                    </div>
                  </div>
                ) : id === "contacts" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign is built around people. Voters, donors, volunteers, supporters, community leaders, event attendees, campaign staff—every conversation, contribution, volunteer shift, and relationship begins with a person. The Contacts section serves as the foundation of Aether, bringing those relationships together into one shared operational view that every department can build upon.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">One Campaign. One Contact Database.</h3>
                      <p className="mt-4 leading-8">Every department works from the same contact database. Finance, Field, Digital, Outreach, and Leadership all contribute to a single campaign record, creating one shared understanding of every person connected to the campaign.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Building Smarter Contact Records</h3>
                      <p className="mt-3 leading-8">With supported integrations, Aether enriches contact records by associating publicly available FEC contribution history directly with contact profiles, giving campaign teams immediate context without manual research.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">A Living Campaign Record</h3>
                      <p className="mt-4 leading-8">Donations, pledges, canvassing conversations, running notes, volunteer activity, list assignments, and campaign history remain connected to a single record, allowing every interaction to strengthen the campaign's understanding of that relationship.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Organizing Campaign Work</h3>
                      <p className="mt-3 leading-8">Lists transform contacts into actionable work for fundraising, volunteer recruitment, canvassing, outreach, events, follow-up, and countless other campaign objectives, allowing every department to execute from the same foundation.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Protecting Data Quality</h3>
                      <p className="mt-3 leading-8">Every contact is validated using the phone number as its unique identifier. Duplicate records are prevented before they're created, helping maintain one complete history for every individual.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Finding Information Quickly</h3>
                      <p className="mt-3 leading-8">Powerful search allows campaign staff to locate contacts by name, phone number, address, and other identifying information, ensuring every department can quickly access the information relevant to their work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built for Collaboration</h3>
                      <p className="mt-3 leading-8">Because contacts belong to the campaign—not individual departments—every team contributes to a richer understanding of each relationship, improving collaboration and reducing duplicate work across the organization.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Every campaign begins with people. The Contacts section keeps those relationships connected throughout every stage of the campaign, providing one shared operational foundation that supports every department—because campaigns aren't built around software. They're built around people.</p>
                    </div>
                  </div>
                ) : id === "lists" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign begins with a goal. Raise money. Knock doors. Recruit volunteers. Invite supporters to an event. Follow up with undecided voters. Prepare for Election Day. Those goals become reality through organized work. The Lists section transforms campaign priorities into actionable objectives, giving every department a clear starting point while keeping the entire campaign aligned around shared goals.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">More Than a Collection of Contacts</h3>
                      <p className="mt-4 leading-8">A list isn't simply a group of names. It's a campaign objective. Fundraising, canvassing, volunteer recruitment, event invitations, direct mail, and follow-up campaigns all begin as organized lists that become actionable work throughout the Campaign Operating System.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">One Campaign. Shared Objectives.</h3>
                      <p className="mt-3 leading-8">Because every department works from the same contact database, lists become shared campaign assets rather than isolated departmental projects. Each interaction strengthens the campaign's shared understanding of every relationship.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Built for Execution</h3>
                      <p className="mt-4 leading-8">Once work begins, Focus Mode guides staff through contacts one at a time, ensuring every completed conversation, pledge, canvassing result, or outreach effort immediately strengthens the campaign's shared knowledge.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Designed to Adapt</h3>
                      <p className="mt-3 leading-8">Campaign priorities change as Election Day approaches. Teams can create new lists, refine existing ones, and reorganize priorities as circumstances evolve without losing momentum.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Getting Started Faster</h3>
                      <p className="mt-3 leading-8">When contacts are imported, Honest Abe can recommend which department a list best supports, helping reduce setup time while leaving every decision in the hands of campaign staff.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Smarter Prioritization</h3>
                      <p className="mt-3 leading-8">Honest Abe highlights contacts that may deserve additional attention based on campaign activity, fundraising history, engagement, and operational signals, helping teams focus their efforts where they may have the greatest impact.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Building Institutional Knowledge</h3>
                      <p className="mt-3 leading-8">Every completed list leaves the campaign stronger. Contacts become more complete, relationships become clearer, campaign history grows richer, and future lists become more informed.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">The Lists section connects strategy with execution, ensuring campaign priorities become organized, measurable, and actionable. Campaigns don't move forward one contact at a time—they move forward one organized objective at a time.</p>
                    </div>
                  </div>
                ) : id === "imports" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign already has data. Whether it's voter contacts, donor records, volunteer information, or campaign analytics, getting that information into Aether should be simple. The Imports section allows campaigns to quickly bring existing data into the Campaign Operating System, reducing manual work and helping teams begin executing sooner.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Contact Imports</h3>
                      <p className="mt-4 leading-8">Upload contact information from a CSV file and migrate existing campaign data into Aether. During the import process, Aether analyzes your data and can recommend which department a list is best suited for before it's imported, helping organize your campaign from the very beginning.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Analytics Imports</h3>
                      <p className="mt-3 leading-8">Campaigns that prefer manual reporting can upload CSV exports from supported platforms, allowing Digital and Print analytics to be imported directly into Aether while keeping reporting current.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Built for Flexibility</h3>
                      <p className="mt-4 leading-8">Some campaigns prefer live integrations while others upload information on their own schedule. Aether supports both approaches, allowing every organization to choose the workflow that best fits its operation.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Data only becomes valuable when it's organized and actionable. The Imports section transforms existing campaign information into meaningful work, bringing contacts and analytics into Aether so teams can spend less time preparing data and more time executing the campaign.</p>
                    </div>
                  </div>
                ) : id === "tools" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaigns communicate constantly. Meetings are scheduled. Documents are shared. Emails are sent. Questions are answered. The Tools section brings those everyday activities together, allowing campaign teams to coordinate from within Aether instead of constantly switching between multiple applications.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built Around Everyday Campaign Work</h3>
                      <p className="mt-4 leading-8">Successful campaigns depend on communication. Whether you're reviewing strategy documents, coordinating meetings, sending emails, or discussing the next event, the Tools section provides a central place for teams to stay connected throughout the campaign.</p>
                      <p className="mt-3 leading-8">By bringing these workflows together, Aether helps reduce context switching and keeps campaign operations moving forward.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Google Workspace Integration</h3>
                      <p className="mt-3 leading-8">Aether is built around Google Workspace. Campaigns can connect a shared Google Workspace account to access Gmail, Google Calendar, and Google Drive directly within Aether.</p>
                      <p className="mt-3 leading-8">We recommend using a dedicated campaign email such as info@yourcampaign.com or team@yourcampaign.com so authorized team members share the same inbox, documents, and calendar as a single source of truth.</p>
                      <p className="mt-3 leading-8">Emails sent through Aether remain visible within Aether, allowing authorized staff to review conversations, maintain continuity, and keep communication organized.</p>
                      <p className="mt-3 leading-8">We intentionally focused on Google Workspace because it's affordable, widely adopted by campaigns, and provides a reliable foundation for campaign operations.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Aether Group Chat</h3>
                      <p className="mt-4 leading-8">Not every conversation belongs in an email. Aether Group Chat gives campaign teams a dedicated space to coordinate work, ask questions, share updates, and collaborate without leaving the Campaign Operating System.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built to Grow</h3>
                      <p className="mt-3 leading-8">The Tools section will continue evolving alongside Aether. As campaigns identify new opportunities to improve communication and collaboration, additional capabilities may be introduced to further simplify day-to-day campaign operations.</p>
                      <p className="mt-3 leading-8">Our goal isn't to integrate every productivity platform on the market. It's to provide the tools campaigns use every day in a way that's simple, reliable, and keeps teams working together.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Campaigns move quickly. The fewer applications your team has to jump between, the more time they can spend executing the work that matters. The Tools section brings communication, collaboration, and coordination together—helping your campaign stay connected while remaining focused on execution.</p>
                    </div>
                  </div>
                ) : id === "integrations-hub" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Connecting your campaign's tools should be simple. The Integrations Hub provides a centralized location where Organization Administrators, Campaign Managers, and Department Directors can connect, manage, and monitor the external services that power your campaign.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">A Centralized Management Hub</h3>
                      <p className="mt-4 leading-8">Rather than configuring integrations throughout multiple areas of the platform, Aether brings them together in one streamlined interface.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6">
                        <li>Connect new services</li>
                        <li>Review existing connections</li>
                        <li>Reauthorize expired connections</li>
                        <li>Monitor integration status</li>
                        <li>Disconnect services when they're no longer needed</li>
                      </ul>
                      <p className="mt-4 leading-8">Keeping integrations in a single location makes it easy to manage your campaign's connected tools while maintaining visibility into what's currently active.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Director-Level Access</h3>
                      <p className="mt-3 leading-8">Because integrations affect the entire campaign, access to the Integrations Hub is limited to Organization Administrators, Campaign Managers, and Department Directors.</p>
                      <p className="mt-3 leading-8">This ensures campaign-wide services are managed by trusted leadership while allowing General Users to remain focused on day-to-day execution.</p>
                      <p className="mt-3 leading-8">The Integrations Hub can be accessed directly from the Tools section of Aether.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">The easier it is to manage your campaign's connected services, the easier it is to keep your team moving.</p>
                      <p className="mt-3 leading-8">The Integrations Hub provides a single place to configure and maintain the external tools your campaign depends on—keeping setup simple, organized, and ready for execution.</p>
                    </div>
                  </div>
                ) : id === "integrations" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">No campaign operates with a single piece of software. Fundraising platforms. Social media. Calendars. Email. Cloud storage. Analytics. Modern campaigns rely on dozens of tools to accomplish their goals.</p>
                    <p className="leading-8">Aether was built to become the Campaign Operating System that connects those tools together, allowing campaign teams to work from one operational picture instead of constantly switching between disconnected platforms.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">An Ongoing Commitment</h3>
                      <p className="mt-4 leading-8">Integrations are never truly finished. Campaign technology evolves. New platforms emerge. Campaign workflows change. Because of that, integrations will always remain an active area of development within Aether. Rather than treating integrations as a one-time feature, we view them as an ongoing commitment to helping campaigns connect the tools they rely on every day.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Our Initial Focus</h3>
                      <p className="mt-3 leading-8">Every integration we build is intended to strengthen Aether as the Campaign Operating System. Our launch roadmap focuses on connecting the systems campaign teams interact with most frequently, bringing fundraising activity, digital engagement, and operational workflows into one shared operational picture.</p>
                      <p className="mt-3 leading-8">By establishing that foundation first, campaigns can immediately reduce manual work, improve visibility across departments, and begin experiencing the benefits of a connected Campaign Operating System from day one. As Aether grows, so will the ecosystem around it.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">A Note About Field</h3>
                      <p className="mt-4 leading-8">Field integrations are intentionally not part of the initial launch roadmap. Field operations are one of the most critical components of any campaign, and we want to approach those integrations with the same level of care applied throughout the rest of Aether.</p>
                      <p className="mt-3 leading-8">Our immediate priority is establishing Aether as the operational center through fundraising, digital, and productivity integrations. Once that foundation is in place, expanding field integrations becomes one of our highest priorities after launch. And if we're able to get there sooner, we absolutely will.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built with Purpose</h3>
                      <p className="mt-3 leading-8">Not every integration belongs inside a Campaign Operating System. Every integration is designed to reduce duplicate work, improve visibility, enrich campaign data, and help departments coordinate more effectively.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Growing Alongside Campaigns</h3>
                      <p className="mt-3 leading-8">The list of supported integrations will continue to grow over time as campaigns evolve and new technologies emerge. Our goal isn't to replace every tool campaigns already trust. It's to bring those tools together into one place where campaign teams can operate with greater clarity, focus, and confidence.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">The best campaign software doesn't exist in isolation. It works alongside the tools campaigns already depend on. Connect what matters. Reduce unnecessary work. Keep information flowing. Help every department operate from the same shared understanding of the campaign.</p>
                      <p className="mt-3 leading-8">Because great software isn't measured by how many integrations it has. It's measured by how effectively those integrations help campaigns execute.</p>
                    </div>
                  </div>
                ) : id === "organizations" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every campaign is different. Different priorities. Different strategies. Different teams. Different political parties. Aether was built to support campaigns across the political spectrum, providing the same Campaign Operating System regardless of party affiliation.</p>
                    <p className="leading-8">Our goal is simple. Build great campaign software. Let campaigns decide how to use it.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Designed for Every Campaign</h3>
                      <p className="mt-4 leading-8">When creating an organization, campaigns can identify themselves as Democratic, Republican, or choose Aether's default organization type. That selection helps personalize the experience without changing how the platform operates.</p>
                      <p className="mt-3 leading-8">Every organization receives the same core features, the same tools, and the same commitment to helping campaigns execute more effectively.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Built Around Your Organization</h3>
                      <p className="mt-3 leading-8">Certain parts of Aether automatically adapt based on your organization's configuration. Integration recommendations are context-aware, ensuring Democratic campaigns aren't presented with Republican fundraising platforms, and Republican campaigns aren't presented with Democratic ones.</p>
                      <p className="mt-3 leading-8">The interface also adjusts to reflect your organization, using blue for Democratic organizations, red for Republican organizations, or Aether's default navy theme. As Aether continues to grow, we look forward to expanding personalization options with additional themes and organization preferences.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">One Platform. Equal Support.</h3>
                      <p className="mt-4 leading-8">Aether doesn't believe great campaign technology should belong to one party. Our mission is to build the best Campaign Operating System possible and make it available to every campaign that's working to engage voters, organize supporters, and serve their communities.</p>
                      <p className="mt-3 text-lg font-semibold text-white">Politics may differ. Good operations don't.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Every campaign deserves tools that help it succeed. Regardless of party affiliation, Aether provides the same operational foundation, allowing organizations to focus less on managing software and more on running their campaigns.</p>
                      <p className="mt-3 leading-8">Because better organization benefits every campaign.</p>
                    </div>
                  </div>
                                ) : id === "team-management" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaigns are built by people working together.</p>
                    <p className="leading-8">From volunteers and department directors to campaign leadership, every team member plays a different role in helping the campaign succeed.</p>
                    <p className="leading-8">The Team Management section gives Organization Administrators a simple way to build and manage that team while ensuring every user has access to the tools they need.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built for Organization Administrators</h3>
                      <p className="mt-4 leading-8">Managing a campaign team shouldn't require technical expertise.</p>
                      <p className="mt-3 leading-8">Organization Administrators can quickly add new members, remove users when necessary, and manage access from a single location.</p>
                      <p className="mt-3 leading-8">As campaigns grow and responsibilities change, Team Management makes it easy to keep the organization's structure up to date without disrupting day-to-day operations.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Flexible Roles and Departments</h3>
                      <p className="mt-3 leading-8">Campaigns aren't always organized the same way.</p>
                      <p className="mt-3 leading-8">Some staff wear multiple hats.</p>
                      <p className="mt-3 leading-8">A Finance Director may also oversee Outreach.</p>
                      <p className="mt-3 leading-8">A Field Director may assist with Digital.</p>
                      <p className="mt-3 leading-8">Campaign leadership often spans several departments at once.</p>
                      <p className="mt-3 leading-8">Because of that, Aether allows Organization Administrators to assign multiple roles and multiple departments to individual users, ensuring every team member has access to the areas they need while supporting the way real campaigns operate.</p>
                      <p className="mt-3 leading-8">Those assignments also help shape each user's experience within Aether. The roles and departments assigned to a user determine what they can access, the tools available to them, and the actions they're permitted to perform—helping every team member stay focused on their responsibilities while maintaining an organized and secure campaign environment.</p>
                      <p className="mt-3 leading-8">We'll explore roles and permissions in greater detail in the next section.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">Built to Grow with Your Campaign</h3>
                      <p className="mt-4 leading-8">Campaign teams change throughout the election cycle.</p>
                      <p className="mt-3 leading-8">New volunteers become staff.</p>
                      <p className="mt-3 leading-8">Consultants join for specific projects.</p>
                      <p className="mt-3 leading-8">Departments expand as Election Day approaches.</p>
                      <p className="mt-3 leading-8">Team Management makes those transitions simple, allowing Organization Administrators to adapt the organization as the campaign evolves.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Strong campaigns depend on strong teams.</p>
                      <p className="mt-3 leading-8">Team Management provides Organization Administrators with the tools to organize staff, manage access, and support collaboration across every department.</p>
                      <p className="mt-3 leading-8">Because when every person has the right access to the right tools, the entire campaign operates more effectively.</p>
                    </div>
                  </div>
 ) : id === "roles" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Every member of a campaign contributes differently.</p>
                    <p className="leading-8">A Campaign Manager doesn't perform the same work as a Finance Director.</p>
                    <p className="leading-8">A Finance Director doesn't perform the same work as a volunteer making donor calls.</p>
                    <p className="leading-8">Because of that, every user doesn't need the same view of Aether.</p>
                    <p className="leading-8">Roles and permissions ensure each team member has access to the tools, information, and actions appropriate for their responsibilities, helping every user stay focused on the work that matters most.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Built Around Responsibility</h3>
                      <p className="mt-4 leading-8">Roles and permissions aren't designed to restrict users.</p>
                      <p className="mt-3 leading-8">They're designed to reduce unnecessary complexity.</p>
                      <p className="mt-3 leading-8">By tailoring each user's experience to their responsibilities, Aether creates a cleaner workspace, minimizes distractions, and helps every department operate more efficiently.</p>
                      <p className="mt-3 leading-8">As responsibilities change throughout a campaign, Organization Administrators can update roles and permissions at any time.</p>
                    </div>

                    <div><h3 className="text-2xl font-bold text-white">Administrative Access</h3><p className="mt-3 leading-8">Organization Administrators and Campaign Managers have full visibility across the Campaign Operating System.</p><p className="mt-3 leading-8">They can view every department, monitor campaign activity, manage users, and oversee campaign operations from a complete organizational perspective.</p><p className="mt-3 leading-8">This level of access helps leadership understand how every department is performing while ensuring they can support the campaign wherever needed.</p></div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6"><h3 className="text-2xl font-bold text-white">Department Leadership</h3><p className="mt-4 leading-8">Department Directors have full access within the departments they lead.</p><p className="mt-3 leading-8">In addition to managing their department's work, Directors also have access to the campaign's Overview Dashboard, allowing them to understand how their department contributes to the campaign's broader objectives.</p><p className="mt-3 leading-8">This balance provides department leaders with the visibility they need while keeping their daily focus on the teams they manage.</p></div>

                    <div><h3 className="text-2xl font-bold text-white">General Users</h3><p className="mt-3 leading-8">General Users receive a streamlined experience centered around their assigned department.</p><p className="mt-3 leading-8">Rather than exposing every tool and administrative function, Aether presents the features, workflows, and information most relevant to their day-to-day responsibilities.</p><p className="mt-3 leading-8">General Users also have access to the Overview Dashboard, providing high-level visibility into campaign progress while keeping their primary focus on executing the work assigned to them.</p></div>

                    <div><h3 className="text-2xl font-bold text-white">Focus Through Simplicity</h3><p className="mt-3 leading-8">The goal of roles and permissions isn't simply controlling access.</p><p className="mt-3 leading-8">It's helping every member of the campaign stay in their operating lane.</p><p className="mt-3 leading-8">When every user sees the right information, has the right tools, and focuses on the responsibilities assigned to them, the entire campaign becomes more organized, more efficient, and easier to manage.</p></div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6"><h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3><p className="mt-4 leading-8">The best campaigns aren't built by giving everyone access to everything.</p><p className="mt-3 leading-8">They're built by giving every team member exactly what they need to succeed.</p><p className="mt-3 leading-8">Roles and permissions ensure every user can contribute effectively while leadership maintains the visibility needed to guide the campaign forward.</p></div>
                  </div>
                                ) : id === "security" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
                    <p className="text-lg leading-8">Campaigns trust Aether with information that’s essential to their daily operations.</p>
                    <p className="leading-8">Contacts.</p>
                    <p className="leading-8">Donor history.</p>
                    <p className="leading-8">Campaign strategy.</p>
                    <p className="leading-8">Operational data.</p>
                    <p className="leading-8">That trust isn’t something we take lightly.</p>
                    <p className="leading-8">Security isn’t a feature added after the platform was built.</p>
                    <p className="leading-8">It’s a responsibility that influences every decision we make.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                      <h3 className="text-2xl font-bold text-white">Protecting Your Campaign</h3>
                      <p className="mt-4 leading-8">Every campaign deserves confidence that its information is being handled responsibly.</p>
                      <p className="mt-3 leading-8">From user authentication and role-based access to secure cloud infrastructure, Aether is designed to help protect campaign data while ensuring authorized team members can access the information they need to do their jobs.</p>
                      <p className="mt-3 leading-8">As the platform continues to evolve, so will our security practices.</p>
                      <p className="mt-3 leading-8">Protecting campaign data will always remain one of our highest priorities.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">Security Through Organization</h3>
                      <p className="mt-3 leading-8">Good security isn’t only about technology.</p>
                      <p className="mt-3 leading-8">It’s also about making sure the right people have access to the right information.</p>
                      <p className="mt-3 leading-8">Aether’s role and permission system helps campaigns organize access based on responsibility, allowing team members to focus on their work while reducing unnecessary exposure to information outside their role.</p>
                      <p className="mt-3 leading-8">Strong organization is an important part of strong security.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
                      <h3 className="text-2xl font-bold text-white">A Commitment to Trust</h3>
                      <p className="mt-4 leading-8">Technology changes.</p>
                      <p className="mt-3 leading-8">Security threats evolve.</p>
                      <p className="mt-3 leading-8">Campaigns deserve software that evolves alongside them.</p>
                      <p className="mt-3 leading-8">We’ll continue investing in the security of the platform, improving protections, and adopting best practices as Aether grows.</p>
                      <p className="mt-3 leading-8">Because earning a campaign’s trust doesn’t happen once.</p>
                      <p className="mt-3 leading-8">It happens every day.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8">Campaigns have enough to worry about.</p>
                      <p className="mt-3 leading-8">Your software shouldn’t be one of them.</p>
                      <p className="mt-3 leading-8">Our commitment is simple:</p>
                      <p className="mt-3 leading-8">Protect your information.</p>
                      <p className="mt-3 leading-8">Respect your trust.</p>
                      <p className="mt-3 leading-8">Continue improving.</p>
                      <p className="mt-3 leading-8">Because a Campaign Operating System should provide confidence as well as capability.</p>
                    </div>
                  </div>

) : id === "privacy" ? (
  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
    <p className="text-lg leading-8">Campaigns trust Aether with information that matters.</p>
    <p className="leading-8">That information belongs to your organization—not to us.</p>
    <p className="leading-8">Our role is to provide the tools that help campaigns organize, execute, and succeed while respecting the privacy of the information entrusted to the platform.</p>

    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
      <h3 className="text-2xl font-bold text-white">Your Data Stays Yours</h3>
      <p className="mt-4 leading-8">Aether exists to help campaigns manage their operations.</p>
      <p className="mt-3 leading-8">We don’t build the platform to own your campaign data or use it for purposes outside of supporting your organization’s experience within Aether.</p>
      <p className="mt-3 leading-8">Your campaign’s contacts, operational data, and organizational information remain your campaign’s information.</p>
    </div>

    <div>
      <h3 className="text-2xl font-bold text-white">Built on Respect</h3>
      <p className="mt-3 leading-8">Privacy is about more than policies.</p>
      <p className="mt-3 leading-8">It’s about treating campaign information with the same level of respect we’d expect for our own.</p>
      <p className="mt-3 leading-8">Every feature we build considers how information is accessed, who should be able to see it, and how organizations maintain control over their own data.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6">
      <h3 className="text-2xl font-bold text-white">Transparency Matters</h3>
      <p className="mt-4 leading-8">We believe campaigns should understand how their information is handled.</p>
      <p className="mt-3 leading-8">Our Privacy Policy provides the complete legal details regarding data collection, storage, and platform usage, and we’ll continue updating those policies as Aether evolves.</p>
      <p className="mt-3 leading-8">Our goal is to be transparent—not confusing.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
      <p className="mt-4 leading-8">Campaigns choose Aether to help manage their operations.</p>
      <p className="mt-3 leading-8">That relationship is built on trust.</p>
      <p className="mt-3 leading-8">We’re committed to respecting your organization’s privacy, protecting your information, and being transparent about how the platform works.</p>
      <p className="mt-3 leading-8">Because your campaign should always remain in control of its own data.</p>
    </div>
  </div>

) : id === "faq" ? (
  <div className="mt-8 max-w-4xl space-y-8 text-slate-300">
    <p className="text-lg leading-8">Questions are a natural part of learning any new platform.</p>
    <p className="leading-8">The Frequently Asked Questions section provides quick answers to common questions about using Aether, helping users find information without interrupting their workflow.</p>
    <p className="leading-8">As Aether continues to grow, the FAQ will continue growing alongside it.</p>

    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
      <h3 className="text-2xl font-bold text-white">Always Evolving</h3>
      <p className="mt-4 leading-8">No software remains exactly the same.</p>
      <p className="mt-3 leading-8">New features are introduced.</p>
      <p className="mt-3 leading-8">Existing workflows improve.</p>
      <p className="mt-3 leading-8">Questions change over time.</p>
      <p className="mt-3 leading-8">Because of that, our FAQ is continuously updated to reflect the current version of Aether, ensuring answers remain accurate as the platform evolves.</p>
    </div>

    <div>
      <h3 className="text-2xl font-bold text-white">When You Need More Than an Answer</h3>
      <p className="mt-3 leading-8">Sometimes a simple answer isn’t enough.</p>
      <p className="mt-3 leading-8">Some topics deserve additional explanation, real-world examples, or a deeper understanding of why Aether works the way it does.</p>
      <p className="mt-3 leading-8">That’s exactly why we created the Aether Academy.</p>
      <p className="mt-3 leading-8">While the FAQ provides quick answers, the Academy provides the context behind those answers—explaining not only how to use Aether, but also the campaign operations and philosophies that shaped it.</p>
      <p className="mt-3 leading-8">Together, they help campaigns move from simply using the platform to fully understanding it.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
      <h3 className="text-2xl font-bold text-white">Clarity. Focus. Execution.</h3>
      <p className="mt-4 leading-8">Questions will always exist.</p>
      <p className="mt-3 leading-8">Our goal isn’t simply to answer them.</p>
      <p className="mt-3 leading-8">Our goal is to give campaigns the knowledge and confidence to use Aether effectively, today and as it continues to evolve.</p>
      <p className="mt-3 leading-8">Because great software isn’t just easy to use.</p>
      <p className="mt-3 leading-8">It’s easy to understand.</p>
    </div>
  </div>
) : (
                  <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-white/15 bg-black/10 px-5 py-5">
                    <p className="font-semibold text-slate-300">This guide is being prepared.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Content will be added as the Aether Learning Library is developed section by section.</p>
                  </div>
                )}
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
            className="inline-flex items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10 px-6 py-3 font-bold text-violet-300 transition hover:-translate-y-0.5 hover:bg-violet-400/15"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </section>

      {/* Back to Top */}
      <a
        href="#top"
        aria-label="Back to top"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-violet-300/40 bg-violet-600 font-black text-slate-950 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:bg-violet-400"
      >
        ↑
      </a>
    </main>
  );
}
