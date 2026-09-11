"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const libraryGroups = [
  {
    title: "Getting Started",
    eyebrow: "Start here",
    links: [
      ["welcome-to-aether", "Welcome to Aether!"],
      ["documentation-scope", "Documentation Scope"],
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
  { label: "Training Videos", status: "active", href: "/aether-academy/training-videos" },
  { label: "Articles", status: "active", href: "/aether-academy/articles" },
  { label: "Blog", status: "active", href: "/aether-academy/blog" },
  { label: "Patch Notes", status: "active", href: "/aether-academy/patch-notes" },
];

export default function AetherAcademyPage() {
  const [backToTopClicks, setBackToTopClicks] = useState(0);
  const [showPotatoModal, setShowPotatoModal] = useState(false);

  const handleBackToTopClick = () => {
    setBackToTopClicks((current) => {
      const next = current + 1;
      if (next >= 33) {
        setShowPotatoModal(true);
        return 0;
      }
      return next;
    });
  };

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

        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-28 lg:py-20 lg:px-[18px] lg:py-16">
          <div className="mb-8 flex items-center justify-center lg:mb-5">
            <Image
              src="/aether-logo-full.png"
              alt="Aether"
              width={260}
              height={72}
              priority
              className="h-auto w-64 drop-shadow-[0_0_24px_rgba(139,92,246,0.35)] lg:w-52"
            />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-violet-300 lg:px-3 lg:py-1.5 lg:mb-3 lg:text-[10px]">
            Official Learning Center
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-5xl lg:text-4xl">
            Aether Academy
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 lg:text-base lg:leading-7 text-slate-300 sm:text-xl lg:mt-5 lg:text-base">
            The official reference for understanding Aether Political. Explore
            how the platform works, why it was built, and how each part of the
            Campaign Operating System fits together.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:gap-3 lg:mt-7">
            <a
              href="#library"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-7 py-3.5 font-bold text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-400 lg:px-5"
            >
              Enter the Learning Library
            </a>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-7 py-3.5 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5"
            >
              Enter Aether
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10 lg:px-5"
            >
              Back to Landing Page
            </Link>
          </div>
        </div>
      </section>

      {/* Academy Navigation */}
      <section className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-3 lg:py-3">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-2">
            {academyTabs.map((tab) => {
              const isActive = tab.status === "active";
              const label =
                tab.status === "post-launch"
                  ? "Post Launch"
                  : tab.status === "soon"
                    ? "Coming Soon"
                    : null;

              return tab.href ? (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="min-w-max rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-3 text-violet-300 shadow-[0_10px_30px_rgba(139,92,246,0.08)] transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-3 lg:py-2.5"
                >
                  <div className="text-sm font-bold lg:text-[12px]">{tab.label}</div>
                </Link>
              ) : (
                <div
                  key={tab.label}
                  className={[
                    "min-w-max rounded-xl border px-4 py-3 transition",
                    isActive
                      ? "border-violet-400/40 bg-violet-400/10 text-violet-300 shadow-[0_10px_30px_rgba(139,92,246,0.08)]"
                      : "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500",
                  ].join(" ")}
                >
                  <div className="text-sm font-bold lg:text-[12px]">{tab.label}</div>
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
      <section className="mx-auto max-w-7xl px-6 pt-16 sm:pt-20 lg:px-[18px] lg:pt-10">
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[0.10] via-white/[0.04] to-blue-400/[0.06] p-8 shadow-2xl shadow-black/20 sm:p-10 lg:p-6 lg:rounded-2xl">
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400 lg:text-[12px]">
              Welcome to the Academy
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:mt-3 lg:text-2xl">
              Learn Aether from the people building it.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-300 lg:text-sm lg:leading-6 sm:text-lg lg:mt-3">
              Aether Academy is not campaign consulting and it is not a sales
              brochure. It is the official place to understand how Aether is
              structured, what each feature is intended to do, and how campaign
              teams can use the platform in real operational workflows.
            </p>
          </div>
        </div>
      </section>


      {/* Documentation Scope */}
      <section className="mx-auto max-w-7xl px-6 pt-10 lg:px-[18px] lg:pt-7">
        <article id="documentation-scope" className="scroll-mt-32 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] p-8 shadow-xl shadow-black/10 sm:p-10 lg:p-6 lg:rounded-2xl">
          <div className="relative max-w-4xl space-y-6 text-slate-300 lg:space-y-4">
            <div className="flex flex-wrap items-center gap-3 lg:gap-2">
              <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 lg:px-2.5 lg:text-[10px]">Getting Started</span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:text-[10px]">Official Guide</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-2xl">Documentation Scope</h2>
            <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Aether Academy serves as the official public reference for the Aether Campaign Operating System. It explains the platform's architecture, workflows, operational philosophy, and intended behavior while intentionally omitting proprietary implementation details that help differentiate and protect the platform.</p>
            <p className="leading-8 lg:text-sm lg:leading-6">Certain implementation details—including proprietary scoring models, prioritization logic, internal decision engines, and security architecture—are intentionally omitted. Those systems represent intellectual property and continue to evolve alongside the platform.</p>
            <p className="leading-8 lg:text-sm lg:leading-6">As Aether grows, Aether Academy will continue expanding with new features, workflows, and best practices, ensuring campaigns always have access to the most current public information about the platform.</p>
          </div>
        </article>
      </section>

      {/* Learning Library */}
      <section
        id="library"
        className="scroll-mt-28 mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-[18px] lg:py-10"
      >
        <div className="mb-10 lg:mb-7">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400 lg:text-[12px]">
            Start Here
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:mt-2 lg:text-3xl">
            Learning Library
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-8 lg:text-base lg:leading-7 text-slate-300 lg:mt-3 lg:text-base">
            Use the library below to jump directly to any section. Each guide
            will become part of Aether&apos;s public source of truth as the
            Academy grows.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {libraryGroups.map((group) => (
            <section
              key={group.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.055] lg:p-[18px] lg:rounded-xl"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                {group.eyebrow}
              </p>

              <h3 className="mt-2 text-xl font-black text-white lg:mt-1.5 lg:text-lg">
                {group.title}
              </h3>

              <div className="mt-5 space-y-2 lg:mt-3">
                {group.links.map(([id, title]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-violet-400/20 hover:bg-violet-400/[0.07] hover:text-violet-300 lg:px-2.5 lg:text-[12px]"
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
      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-[18px] lg:pb-16">
        <div className="grid gap-6 lg:gap-4">
          {academySections.map(([id, title, category], index) => (
            <article
              key={id}
              id={id}
              className="scroll-mt-32 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] p-8 shadow-xl shadow-black/10 sm:p-10 lg:p-6 lg:rounded-2xl"
            >
              <div className="absolute right-6 top-6 text-7xl font-black text-white/[0.025] lg:text-5xl">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="relative">
                <div className="flex flex-wrap items-center gap-3 lg:gap-2">
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 lg:px-2.5 lg:text-[10px]">
                    {category}
                  </span>

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:text-[10px]">
                    Official Guide
                  </span>

                  <Link href={`/aether-academy/training-videos#${id}`} className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 transition hover:border-violet-300 lg:px-2.5 lg:text-[10px]">Training Video →</Link>
                </div>

                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:mt-3 lg:text-2xl">
                  {title}
                </h2>

                {id === "welcome-to-aether" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">
                      Welcome to the Aether Campaign Operating System. Whether you're launching a campaign for the first time or transitioning from another platform, we're excited to be part of your team.
                    </p>
                    <p className="leading-8 lg:text-sm lg:leading-6">
                      Aether was built to help campaigns stay organized, work together more effectively, and spend less time managing software so they can spend more time connecting with voters and supporters.
                    </p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-xl font-bold text-white lg:text-lg">Getting Started</h3>
                      <p className="mt-3 lg:mt-2">If you're just getting started, we recommend following these steps:</p>
                      <ol className="mt-4 list-decimal space-y-2 pl-6 lg:mt-3">
                        <li>Invite your team members.</li>
                        <li>Assign roles and departments.</li>
                        <li>Import your contacts and campaign data.</li>
                        <li>Connect your campaign's integrations.</li>
                        <li>Begin executing your campaign.</li>
                      </ol>
                      <p className="mt-4 lg:mt-3">Completing these steps will give your organization a strong foundation and ensure everyone is working from the same information.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Continue Learning</h3>
                      <p className="mt-3 leading-8 lg:mt-2">The Aether Academy is designed to grow alongside the platform.</p>
                      <p className="mt-3 leading-8 lg:mt-2">As new features are introduced and existing workflows evolve, the Academy will continue expanding with updated guides, best practices, and operational resources to help your campaign get the most out of Aether.</p>
                      <p className="mt-3 leading-8 lg:mt-2">If you ever have a quick question, don't forget to visit the Frequently Asked Questions section for fast answers to common topics.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">We're Here to Help</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Running a campaign is challenging, and we believe your software should be backed by a team that's invested in your success.</p>
                      <p className="mt-3 leading-8 lg:mt-2">If you have questions, ideas, or feedback, Team Aether would love to hear from you. Whether you've found an opportunity to improve Aether, have a feature you'd like to see, or simply need assistance getting the most out of the platform, we're always happy to help.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Your feedback plays an important role in shaping Aether's future, and many of the improvements made to the platform come directly from the campaigns that use it every day.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <p className="text-2xl font-black text-white lg:text-xl">Clarity. Focus. Execution.</p>
                      <p className="mt-4 leading-8 lg:mt-3">Thank you for choosing Aether.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We're honored to be part of your campaign, and we look forward to helping your team stay organized, focused, and ready to execute every step of the way.</p>
                    </div>
                  </div>
                ) : id === "what-is-aether" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Most campaign software is designed to solve a single problem.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">One application helps you raise money. Another helps you knock doors. Another manages volunteers. Another tracks digital advertising. Another stores contacts.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Each platform often comes with its own subscription, implementation, training, and operational cost. As campaigns grow, those costs add up—not just financially, but in the time spent switching between systems, reconciling data, and keeping departments aligned.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Campaigns are among the most complex temporary organizations in the world. Finance teams, field operations, digital communications, outreach, volunteer coordination, compliance, and leadership must all move in sync under constant time pressure. Yet most campaigns still rely on disconnected software that was never designed to operate as a unified system.</p>
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Aether was built to solve a different problem.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Rather than creating another campaign tool, Aether was designed as a Campaign Operating System—a single platform where every major department can operate together.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Finance, Field, Outreach, Digital, and Print all work from the same foundation. Contacts, lists, tasks, operational metrics, and campaign intelligence exist in one shared environment instead of being scattered across multiple applications.</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Shared Operating Picture</h3>
                      <p className="mt-3 leading-8 lg:mt-2">This creates a campaign where information moves naturally between departments instead of becoming trapped inside them.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6 lg:mt-3">
                        <li>A finance director can understand how fundraising affects field operations.</li>
                        <li>A field director can see how volunteer activity impacts campaign priorities.</li>
                        <li>Leadership gains a single operational picture instead of trying to combine reports from five different systems.</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The goal is not simply to organize information. The goal is to improve execution.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Campaigns succeed because people consistently execute the right work at the right time. Aether exists to make that execution easier by reducing operational friction, improving coordination, and giving campaign teams a common operating picture.</p>
                      <p className="mt-4 text-lg font-semibold text-white lg:mt-3 lg:text-base">In short, Aether is not a collection of campaign tools. It is the operating system that brings them together.</p>
                    </div>
                  </div>
                ) : id === "campaign-os" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">A campaign is more than a collection of departments. It is a living organization made up of people, information, priorities, and constant decision-making.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Every day, finance teams raise money, field organizers knock doors, digital teams publish content, outreach teams build relationships, print teams prepare campaign materials, and leadership makes strategic decisions that affect every part of the organization.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Traditionally, each department operates inside its own software. Every additional platform introduces another subscription, another login, another dataset, and another operational cost. As campaigns grow, those costs compound—not only financially, but operationally.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">A Campaign Operating System approaches that challenge differently.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Rather than treating every department as its own isolated workflow, a Campaign Operating System provides a shared operational foundation where the entire campaign works together inside a single environment.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Contacts exist once. Lists exist once. Tasks, operational metrics, campaign activity, and organizational knowledge are shared across every department instead of being duplicated between multiple platforms.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Connected Organization</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Finance, Field, Outreach, Digital, and Print operate independently while remaining connected to the same operational picture.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6 lg:mt-3">
                        <li>Finance can conduct donor call time while Field builds walking lists.</li>
                        <li>Print can prepare literature before volunteers reach the doors.</li>
                        <li>Digital contributes campaign activity without operating in isolation.</li>
                        <li>Leadership sees one campaign operating together instead of combining reports from multiple systems.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">The Operational Loop</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6 lg:mt-3">
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
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Honest Abe</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Because every department operates from the same foundation, Honest Abe can interpret information across the entire campaign rather than within isolated departments. Abe identifies operational pressure, highlights dependencies, and helps leadership understand what matters most next.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">The Philosophy Behind Aether</h3>
                      <p className="mt-4 leading-8 lg:mt-3">A Campaign Operating System is not defined by the number of features it contains. It is defined by how effectively it helps an organization operate as one connected team.</p>
                      <p className="mt-4 text-lg font-semibold text-white lg:mt-3 lg:text-base">It is not simply a place where campaign work is recorded. It is the operating system that helps a campaign execute as one connected organization.</p>
                    </div>
                  </div>
                ) : id === "design-philosophy" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every piece of software reflects the priorities of the people who build it. Every workflow, page, and system inside Aether was designed around a single question:</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <p className="text-2xl font-black text-white lg:text-xl">How can we make campaigns easier to execute?</p>
                    </div>

                    <p className="leading-8 lg:text-sm lg:leading-6">Campaigns are fast-moving organizations. Software should reduce that complexity—not add to it. That belief became the foundation of Aether's design philosophy.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <h4 className="mt-5 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Clarity</h4>
                      <p className="mt-2 leading-8 lg:mt-1.5">Campaign teams need accurate, connected information that is easy to find.</p>
                      <h4 className="mt-5 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Focus</h4>
                      <p className="mt-2 leading-8 lg:mt-1.5">Reduce noise and help every department identify its highest priorities.</p>
                      <h4 className="mt-5 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Execution</h4>
                      <p className="mt-2 leading-8 lg:mt-1.5">Software exists to make campaign work easier—not replace it.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Everything Is a Loop</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6 lg:mt-3">
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
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Campaign, Not Five Departments</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Departments remain specialized. The campaign remains unified. Finance, Field, Outreach, Digital, Print, and Leadership all contribute to a single operational picture instead of operating in isolation.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity Through Context</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Aether does not remove complexity—it contextualizes it. Different users, roles, and subscription tiers see the tools they need when they need them, reducing cognitive load while preserving capability.</p>
                      <p className="mt-4 leading-8 lg:mt-3">Clarity is achieved not by removing features. It is achieved by providing the right context.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Technology Should Support People</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Technology should remove friction, simplify coordination, and help campaign staff spend less time managing software and more time accomplishing meaningful work. Honest Abe, execution loops, contextual interfaces, and cross-department visibility all exist to help campaigns make better decisions and execute with greater confidence.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Software Should Adapt to the Campaign</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every campaign is different. Features are introduced when they create value, complexity is revealed only when it becomes useful, and information flows between departments instead of becoming isolated.</p>
                      <p className="mt-4 text-lg font-semibold text-white lg:mt-3 lg:text-base">The software serves the campaign. The campaign should never have to serve the software.</p>
                    </div>
                  </div>
                ) : id === "honest-abe" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">A Strategy Engine, Not an AI Assistant</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Despite its name, Honest Abe was never designed to be an artificial intelligence assistant. At its core, Honest Abe is a campaign strategy engine built to continuously interpret campaign operations, identify opportunities, recognize operational pressure, and help keep work moving throughout the organization.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Campaign Strategy</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Rather than answering questions like a chatbot, Abe continuously evaluates how the campaign is operating and helps ensure the right work reaches the right people at the right time. Its purpose is not conversation. Its purpose is execution.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because Aether operates as one connected Campaign Operating System, Abe can interpret performance metrics and operational activity across Finance, Field, Outreach, Digital, Print, and the organization as a whole. That broader picture helps Abe understand not simply whether an individual metric is rising or falling, but how activity across the campaign may affect its current priorities.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Campaign Stage Changes What Matters</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaign priorities are not static. What deserves attention early in a campaign may be very different from what matters as Election Day approaches.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Organization Administrators control Honest Abe&apos;s campaign stage and can move the organization between <strong className="text-white">Early Campaign, Mid Campaign, and Late Campaign</strong> as the campaign progresses.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign stage changes the strategic context Abe applies when interpreting campaign performance. As the campaign moves through the election cycle, the relative importance of different operational areas shifts with it, allowing Abe&apos;s guidance to reflect what matters to the campaign <strong className="text-white">now</strong> rather than applying one static definition of success throughout the entire race.</p>
                      <p className="mt-3 leading-8 lg:mt-2">The underlying weighting systems, thresholds, prioritization methods, and decision logic used by Honest Abe are proprietary to Aether.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Quietly Keeping Work Moving</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Most of the time, Abe works quietly behind the scenes—routing work, keeping information flowing between departments, and reducing unnecessary coordination so campaign teams can focus on execution instead of administration.</p>
                      <p className="mt-3 leading-8 lg:mt-2">As campaign performance changes, Abe&apos;s priorities can change with it. Strong performance in one area, emerging pressure in another, or changing relationships between departments can affect what Abe believes deserves leadership&apos;s attention next.</p>
                      <p className="mt-3 leading-8 lg:mt-2">A shift in priority does not necessarily mean something is wrong. It means Abe is continuously interpreting the campaign&apos;s current operational picture within the strategic context established by campaign leadership.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Finding Opportunities Hidden in the Data</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Honest Abe connects imported contacts, voter files, contribution history, department activity, and campaign metrics to surface relationships that might otherwise go unnoticed.</p>
                      <p className="mt-3 leading-8 lg:mt-2">That can mean identifying operational pressure, recognizing relationships between departments, surfacing opportunities that deserve additional attention, or helping leadership understand where campaign resources may have greater strategic value.</p>
                      <p className="mt-3 leading-8 lg:mt-2">The campaign remains in control—Abe helps make those opportunities easier to discover and understand.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Human Judgment Always Comes First</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign professionals remain responsible for setting priorities and making strategic decisions. Honest Abe provides operational awareness and strategic guidance, not autonomous campaign strategy.</p>
                      <p className="mt-3 leading-8 lg:mt-2">That human control exists at multiple levels. Organization Administrators establish the campaign stage that provides Abe&apos;s strategic context, and campaign leadership determines whether Abe&apos;s recommendations make sense within the political, organizational, and human realities of the campaign.</p>
                      <p className="mt-3 leading-8 font-semibold text-white lg:mt-2">Abe can identify what deserves attention. The campaign decides what to do about it.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Why “Honest Abe”?</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaign leaders need software that helps them understand what they need to know—not simply what they want to hear.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Honest Abe was designed to think about the operational health of the campaign, recognize when the campaign&apos;s needs are changing, and help leadership understand what deserves attention next—so campaign teams can spend more time leading and executing.</p>
                    </div>
                  </div>
                ) : id === "dashboard" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign generates information. The purpose of a dashboard is not simply to display those numbers. Its purpose is to transform campaign activity into operational awareness.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Department Intelligence</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every major department inside Aether has its own dashboard designed around its responsibilities. Finance, Field, Outreach, Digital, and Print each receive analytics focused on helping that department make better operational decisions.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Cross-Domain Intelligence</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Because every department operates inside the same Campaign Operating System, Aether surfaces operational relationships that traditional reporting tools often miss.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6 lg:mt-3">
                        <li>Print production affecting upcoming field operations.</li>
                        <li>Volunteer capacity influencing outreach efforts.</li>
                        <li>Campaign activity contributing to fundraising momentum.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Honest Abe Across the Platform</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every department dashboard includes department-specific strategic observations, while the Overview Dashboard expands to interpret the health of the campaign as a whole.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">The Overview Dashboard</h3>
                      <p className="mt-3 leading-8 lg:mt-2">The Overview Dashboard provides leadership with a unified view of campaign health through summary cards and campaign-wide analytics spanning Finance, Field, Outreach, Digital, and Print.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Designed for Better Decisions</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every visualization, metric, and operational indicator exists for one reason: to support better decisions. Together, Aether's dashboards transform campaign activity into operational awareness so every level of the organization can execute with confidence.</p>
                    </div>
                  </div>
                ) : id === "focus-mode" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign has work that needs to be completed. Focus Mode was designed around a simple question:</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <p className="text-2xl font-black text-white lg:text-xl">What should you be working on right now?</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Task at a Time</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Rather than presenting hundreds of records, lists, and competing priorities, Focus Mode narrows attention to the work immediately in front of the user.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6 lg:mt-3">
                        <li>One donor.</li>
                        <li>One voter.</li>
                        <li>One conversation.</li>
                        <li>One task.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Execution</h3>
                      <ol className="mt-4 list-decimal space-y-2 pl-6 lg:mt-3">
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
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Focused at Every Level</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every department has its own Focus Mode experience, while campaign leadership receives a version built around coordination, prioritization, delegation, and organizational execution.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Context Without Distraction</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Focus Mode does not hide information—it prioritizes it. Relevant history and context remain available while navigation, analytics, and administrative tools step into the background to reduce cognitive load.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Guided, Not Controlled</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign professionals remain in control. Focus Mode guides work, removes the friction of deciding what comes next, and allows staff to spend more time executing meaningful work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every completed task immediately strengthens the campaign's operational picture. Dashboards update, analytics evolve, Honest Abe gains additional context, and leadership gains greater visibility.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Focus Mode reduces complexity without reducing capability, provides context without distraction, and guides execution without replacing human judgment.</p>
                    </div>
                  </div>
                ) : id === "aether-mobile" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaign work doesn't stop when you leave the office. Aether Mobile extends the Campaign Operating System beyond the desktop, allowing campaign teams to stay connected and execute work wherever it happens.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Execution</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The desktop experience is designed for planning and strategy. Aether Mobile is designed for execution, streamlining daily campaign work instead of recreating every desktop feature on a smaller screen.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Search and Manage Contacts</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Quickly search existing contacts, review information, update records, and add new contacts from fundraisers, parades, community events, or wherever valuable information is collected.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Finance, Outreach, and Field</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Assigned Finance, Outreach, and Field lists are organized for rapid execution, allowing campaign staff to record dispositions, notes, and activity while moving efficiently from one conversation to the next.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Connected in Real Time</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Notes, dispositions, new contacts, and completed work synchronize immediately with the campaign, ensuring every authorized team member operates from the same source of truth.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaigns aren't won from behind a computer. They're won through conversations, relationships, and consistent execution in the real world. Aether Mobile brings the Campaign Operating System into the field so your team can stay organized, capture important information, and keep the campaign moving wherever the work takes them.</p>
                    </div>
                  </div>
                ) : id === "finance" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign is built on relationships. Donors provide the resources that allow campaigns to communicate, organize, and compete. Aether's Finance department was built to strengthen those relationships while helping fundraising teams execute with confidence.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">More Than Donor Records</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every contribution represents a relationship. Every pledge represents a future opportunity. Every conversation helps campaign teams better understand the people investing in the campaign's success.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organized for Call Time</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Donor lists can be built around fundraising goals, giving history, campaign priorities, or custom criteria. Focus Mode then guides finance staff through donor outreach one conversation at a time.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Understanding the Entire Donor Journey</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Contribution history, pledge tracking, running notes, previous interactions, contact information, and campaign activity are brought together into a single donor profile so every conversation begins with context.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">The Jackpot Engine</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Using campaign activity, donor history, and current FEC contribution data, Honest Abe helps score and prioritize fundraising opportunities. The resulting Jackpot Calling List complements—not replaces—the custom lists created by campaign staff.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Intelligence That Supports Fundraising</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Finance dashboards provide fundraising analytics, pledge trends, operational intelligence, and department-specific observations from Honest Abe while maintaining visibility into how fundraising connects with the rest of the campaign.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Compliance</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Contribution records are collected as part of everyday workflow. Before export, Aether validates required reporting information and converts missing data into actionable Focus Mode tasks instead of producing incomplete exports.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built to Work Alongside Your Campaign</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Whether your organization emphasizes call time, events, major donors, digital fundraising, or community outreach, Aether adapts to your fundraising strategy rather than forcing a single workflow.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Aether's Finance department combines relationship management, focused execution, opportunity discovery, operational intelligence, and compliance readiness into one connected workflow designed to help campaigns build the financial foundation needed to achieve their goals.</p>
                    </div>
                  </div>
                ) : id === "field" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns are built one conversation at a time. The Field department helps campaigns organize canvassing efforts, execute them efficiently, and ensure every voter interaction strengthens the campaign as a whole.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organizing the Work</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Field lists can be created around geography, voter characteristics, campaign priorities, or custom criteria. Focus Mode then turns that plan into action—one address, one conversation, and one voter at a time.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Every Conversation Matters</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Supporters, volunteers, yard sign requests, and voter issues all become part of the campaign's shared operational knowledge, helping every department better understand the communities they serve.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Campaign. One Platform.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Field teams operate within the same Campaign Operating System as Finance, Outreach, Digital, Print, and Leadership. Every conversation immediately becomes available to the rest of the campaign, creating one connected operational picture.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for the Real World</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Whether knocking doors or attending community events, Aether Mobile allows campaign staff to search contacts, work assigned lists, record conversations, and update voter information directly from the field.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Intelligence That Improves Every Pass</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every round of canvassing creates new information. Honest Abe and the Campaign Operating System transform those insights into better lists, improved strategy, and stronger execution on every future pass.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Aether doesn't change the fundamentals of canvassing. It ensures every conversation contributes to something larger, helping every interaction strengthen the entire campaign.</p>
                    </div>
                  </div>
                ) : id === "outreach" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign creates opportunities. The Outreach department helps campaigns maintain that momentum by ensuring every conversation has the opportunity to become something more.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Every Conversation Deserves a Response</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Whether someone requested information, attended an event, expressed interest in volunteering, or simply needs a follow-up call, Outreach organizes ongoing relationships so opportunities aren't forgotten.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organized Around Momentum</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Lists can be built around volunteer recruitment, event follow-up, supporter engagement, community outreach, or any campaign objective. Focus Mode then guides staff through each interaction one conversation at a time.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Connecting Every Department</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Finance, Field, Digital, and events all create opportunities that Outreach carries forward. Because every department shares the same contact database, information flows naturally without disconnected systems or duplicate work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Relationships</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Running notes, previous interactions, contact history, and campaign activity remain connected to every contact, allowing conversations to continue where they last ended instead of starting over.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Intelligence That Keeps Campaigns Moving</h3>
                      <p className="mt-3 leading-8 lg:mt-2">The Outreach Dashboard monitors engagement, follow-up progress, and operational health while Honest Abe highlights relationships and opportunities that deserve additional attention.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The value of every campaign interaction is created through thoughtful follow-up. Outreach ensures those opportunities don't disappear, helping campaigns build stronger relationships through consistent communication and purposeful execution.</p>
                    </div>
                  </div>
                ) : id === "digital" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">
                      Modern campaigns are no longer fought only on front porches and at fundraising events.
                    </p>
                    <p className="leading-8 lg:text-sm lg:leading-6">
                      Every day, campaigns compete for attention across social media, websites, digital advertising, email, text messaging, and online communities.
                    </p>
                    <p className="leading-8 lg:text-sm lg:leading-6">
                      Every post. Every advertisement. Every video. Every email. Every message contributes to the story a campaign tells.
                    </p>
                    <p className="leading-8 lg:text-sm lg:leading-6">
                      The Digital department was designed to help campaigns organize that work, understand its impact, and communicate more effectively across every platform they use.
                    </p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Every Platform Tells Part of the Story</h3>
                      <p className="mt-4 leading-8 lg:mt-3">
                        Campaigns rarely communicate through a single channel. Supporters may discover the campaign through Facebook, watch a speech on YouTube, visit the campaign website, respond to an email, see a digital advertisement, or read a social media post.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        No single platform tells the entire story.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Rather than replacing those platforms, Aether helps campaigns understand how they work together. By bringing analytics from supported integrations into one Campaign Operating System, Digital directors gain a clearer picture of how their online efforts contribute to the campaign&apos;s overall strategy.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organized Around Execution</h3>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Great digital campaigns aren&apos;t built one post at a time. They&apos;re built through planning, coordination, and consistent execution.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        The Digital department gives campaign teams a centralized place to organize upcoming work, manage content schedules, assign responsibilities, and track deliverables from creation through completion.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Whether preparing graphics for an endorsement, coordinating a fundraising campaign, planning Election Day messaging, or organizing content around an upcoming event, Digital teams can manage their workload alongside every other department in the campaign.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Helping Campaigns Stay Engaged</h3>
                      <p className="mt-4 leading-8 lg:mt-3">
                        Publishing content is only one part of digital communication. Responding to supporters is just as important.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Aether doesn&apos;t publish social media posts, and it doesn&apos;t respond to comments on a campaign&apos;s behalf. Instead, supported integrations can identify new audience interactions and provide response templates for common situations.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Every response remains under the campaign&apos;s control. Nothing is posted automatically. Campaign staff can personalize a suggested response, copy it into the appropriate platform, and continue engaging with their community.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        The result isn&apos;t automated communication. It&apos;s faster, more consistent communication.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Intelligence Beyond Individual Platforms</h3>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Every digital platform provides analytics: likes, views, comments, reach, engagement, website traffic, and advertising performance.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        The challenge isn&apos;t finding data. It&apos;s understanding what that data means for the campaign.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Rather than asking campaign staff to jump between multiple dashboards, Aether brings those insights together into one operational view. Campaign leadership can better understand how digital efforts contribute to fundraising, volunteer engagement, voter outreach, and overall campaign performance, while Honest Abe helps identify meaningful trends and emerging opportunities.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Digital doesn&apos;t exist in isolation. A successful fundraising appeal may generate increased online engagement. A field event may drive website traffic. An endorsement may increase volunteer interest. An important announcement may influence fundraising, field operations, and outreach simultaneously.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Because the Digital department operates alongside Finance, Field, Outreach, Print, and campaign leadership, those connections become visible.
                      </p>
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:p-4 lg:mt-3">
                        <p className="font-semibold text-white">Instead of asking:</p>
                        <p className="mt-2 italic leading-8 lg:mt-1.5">&ldquo;How did this post perform?&rdquo;</p>
                        <p className="mt-4 font-semibold text-white lg:mt-3">Campaigns can begin asking:</p>
                        <p className="mt-2 italic leading-8 lg:mt-1.5">&ldquo;What impact did this have across the campaign?&rdquo;</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">
                        Digital campaigns generate an extraordinary amount of information. The challenge has never been collecting data. The challenge has always been turning that information into meaningful action.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        Aether helps campaigns organize their digital work, understand their performance, and engage more consistently with the communities they serve.
                      </p>
                      <p className="mt-3 leading-8 lg:mt-2">
                        It doesn&apos;t replace the platforms campaigns already rely on. It brings them together into one operational picture, helping campaign teams communicate with greater purpose and execute with greater confidence.
                      </p>
                      <p className="mt-4 text-lg font-semibold text-white lg:mt-3 lg:text-base">
                        Because successful digital strategy isn&apos;t measured by likes or impressions alone. It&apos;s measured by the real-world impact those efforts have on the campaign.
                      </p>
                    </div>
                  </div>
                ) : id === "print" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns don't exist only online. They exist in neighborhoods, at community events, on front lawns, in mailboxes, and in the hands of volunteers. The Print department helps ensure campaigns always have the materials they need to execute.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Equipping the Campaign</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Walk literature, palm cards, direct mail, yard signs, volunteer apparel, banners, event signage, and campaign resources are organized from planning through distribution so they're available before they're needed.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organized Around Execution</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every print project moves through planning, design, review, approval, production, delivery, and distribution. Focus Mode keeps every step visible and moving toward completion.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Inventory That Works for You</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Aether tracks inventory across campaign materials and alerts leadership before shortages become operational problems, making reorders proactive instead of reactive.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Planning Beyond Today</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Production timelines, expected deliveries, and inventory forecasts help campaign leadership identify risks early and coordinate upcoming events with confidence.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Connected to the Entire Campaign</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Print works alongside Finance, Field, Outreach, Digital, and Leadership. Requests, approvals, inventory, and project progress become part of one shared operational picture instead of isolated production work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Intelligence That Keeps Campaigns Ready</h3>
                      <p className="mt-3 leading-8 lg:mt-2">The Print Dashboard and Honest Abe monitor inventory, production timelines, delivery schedules, and resource readiness so campaigns can prepare for what's coming next rather than simply reacting.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every printed piece is an opportunity to strengthen the campaign. The Print department ensures campaign materials are organized, available, and delivered when they're needed most—because successful campaigns are equipped through planning, coordination, and consistent execution.</p>
                    </div>
                  </div>
                ) : id === "contacts" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign is built around people. Voters, donors, volunteers, supporters, community leaders, event attendees, campaign staff—every conversation, contribution, volunteer shift, and relationship begins with a person. The Contacts section serves as the foundation of Aether, bringing those relationships together into one shared operational view that every department can build upon.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Campaign. One Contact Database.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every department works from the same contact database. Finance, Field, Digital, Outreach, and Leadership all contribute to a single campaign record, creating one shared understanding of every person connected to the campaign.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Building Smarter Contact Records</h3>
                      <p className="mt-3 leading-8 lg:mt-2">With supported integrations, Aether enriches contact records by associating publicly available FEC contribution history directly with contact profiles, giving campaign teams immediate context without manual research.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">A Living Campaign Record</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Donations, pledges, canvassing conversations, running notes, volunteer activity, list assignments, and campaign history remain connected to a single record, allowing every interaction to strengthen the campaign's understanding of that relationship.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Organizing Campaign Work</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Lists transform contacts into actionable work for fundraising, volunteer recruitment, canvassing, outreach, events, follow-up, and countless other campaign objectives, allowing every department to execute from the same foundation.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Protecting Data Quality</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every contact is validated using the phone number as its unique identifier. Duplicate records are prevented before they're created, helping maintain one complete history for every individual.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Finding Information Quickly</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Powerful search allows campaign staff to locate contacts by name, phone number, address, and other identifying information, ensuring every department can quickly access the information relevant to their work.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Collaboration</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Because contacts belong to the campaign—not individual departments—every team contributes to a richer understanding of each relationship, improving collaboration and reducing duplicate work across the organization.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every campaign begins with people. The Contacts section keeps those relationships connected throughout every stage of the campaign, providing one shared operational foundation that supports every department—because campaigns aren't built around software. They're built around people.</p>
                    </div>
                  </div>
                ) : id === "lists" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign begins with a goal. Raise money. Knock doors. Recruit volunteers. Invite supporters to an event. Follow up with undecided voters. Prepare for Election Day. Those goals become reality through organized work. The Lists section transforms campaign priorities into actionable objectives, giving every department a clear starting point while keeping the entire campaign aligned around shared goals.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">More Than a Collection of Contacts</h3>
                      <p className="mt-4 leading-8 lg:mt-3">A list isn't simply a group of names. It's a campaign objective. Fundraising, canvassing, volunteer recruitment, event invitations, direct mail, and follow-up campaigns all begin as organized lists that become actionable work throughout the Campaign Operating System.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Campaign. Shared Objectives.</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Because every department works from the same contact database, lists become shared campaign assets rather than isolated departmental projects. Each interaction strengthens the campaign's shared understanding of every relationship.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Execution</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Once work begins, Focus Mode guides staff through contacts one at a time, ensuring every completed conversation, pledge, canvassing result, or outreach effort immediately strengthens the campaign's shared knowledge.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Designed to Adapt</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign priorities change as Election Day approaches. Teams can create new lists, refine existing ones, and reorganize priorities as circumstances evolve without losing momentum.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Getting Started Faster</h3>
                      <p className="mt-3 leading-8 lg:mt-2">When contacts are imported, Honest Abe can recommend which department a list best supports, helping reduce setup time while leaving every decision in the hands of campaign staff.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Smarter Prioritization</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Honest Abe highlights contacts that may deserve additional attention based on campaign activity, fundraising history, engagement, and operational signals, helping teams focus their efforts where they may have the greatest impact.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Building Institutional Knowledge</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Every completed list leaves the campaign stronger. Contacts become more complete, relationships become clearer, campaign history grows richer, and future lists become more informed.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The Lists section connects strategy with execution, ensuring campaign priorities become organized, measurable, and actionable. Campaigns don't move forward one contact at a time—they move forward one organized objective at a time.</p>
                    </div>
                  </div>
                ) : id === "imports" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign already has data. Whether it's voter contacts, donor records, volunteer information, or campaign analytics, getting that information into Aether should be simple. The Imports section allows campaigns to quickly bring existing data into the Campaign Operating System, reducing manual work and helping teams begin executing sooner.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Contact Imports</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Upload contact information from a CSV file and migrate existing campaign data into Aether. During the import process, Aether analyzes your data and can recommend which department a list is best suited for before it's imported, helping organize your campaign from the very beginning.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Analytics Imports</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaigns that prefer manual reporting can upload CSV exports from supported platforms, allowing Digital and Print analytics to be imported directly into Aether while keeping reporting current.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Flexibility</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Some campaigns prefer live integrations while others upload information on their own schedule. Aether supports both approaches, allowing every organization to choose the workflow that best fits its operation.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Data only becomes valuable when it's organized and actionable. The Imports section transforms existing campaign information into meaningful work, bringing contacts and analytics into Aether so teams can spend less time preparing data and more time executing the campaign.</p>
                    </div>
                  </div>
                ) : id === "tools" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns communicate constantly. Meetings are scheduled. Documents are shared. Emails are sent. Questions are answered. The Tools section brings those everyday activities together, allowing campaign teams to coordinate from within Aether instead of constantly switching between multiple applications.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Everyday Campaign Work</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Successful campaigns depend on communication. Whether you're reviewing strategy documents, coordinating meetings, sending emails, or discussing the next event, the Tools section provides a central place for teams to stay connected throughout the campaign.</p>
                      <p className="mt-3 leading-8 lg:mt-2">By bringing these workflows together, Aether helps reduce context switching and keeps campaign operations moving forward.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Google Workspace Integration</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Aether is built around Google Workspace. Campaigns can connect a shared Google Workspace account to access Gmail, Google Calendar, and Google Drive directly within Aether.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We recommend using a dedicated campaign email such as info@yourcampaign.com or team@yourcampaign.com so authorized team members share the same inbox, documents, and calendar as a single source of truth.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Emails sent through Aether remain visible within Aether, allowing authorized staff to review conversations, maintain continuity, and keep communication organized.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We intentionally focused on Google Workspace because it's affordable, widely adopted by campaigns, and provides a reliable foundation for campaign operations.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Aether Group Chat</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Not every conversation belongs in an email. Aether Group Chat gives campaign teams a dedicated space to coordinate work, ask questions, share updates, and collaborate without leaving the Campaign Operating System.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Full Data Export</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Your campaign data is your campaign data. Campaign leadership can use the Full Data Export option in Tools to download a copy of campaign-owned operational data from Aether.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We recommend keeping an up-to-date export as part of your campaign's normal data practices and completing a final export before your post-subscription retention period expires.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built to Grow</h3>
                      <p className="mt-3 leading-8 lg:mt-2">The Tools section will continue evolving alongside Aether. As campaigns identify new opportunities to improve communication and collaboration, additional capabilities may be introduced to further simplify day-to-day campaign operations.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Our goal isn't to integrate every productivity platform on the market. It's to provide the tools campaigns use every day in a way that's simple, reliable, and keeps teams working together.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaigns move quickly. The fewer applications your team has to jump between, the more time they can spend executing the work that matters. The Tools section brings communication, collaboration, and coordination together—helping your campaign stay connected while remaining focused on execution.</p>
                    </div>
                  </div>
                ) : id === "integrations-hub" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Connecting your campaign's tools should be simple. The Integrations Hub provides a centralized location where Organization Administrators, Campaign Managers, and Department Directors can connect, manage, and monitor the external services that power your campaign.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">A Centralized Management Hub</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Rather than configuring integrations throughout multiple areas of the platform, Aether brings them together in one streamlined interface.</p>
                      <ul className="mt-4 list-disc space-y-2 pl-6 lg:mt-3">
                        <li>Connect new services</li>
                        <li>Review existing connections</li>
                        <li>Reauthorize expired connections</li>
                        <li>Monitor integration status</li>
                        <li>Disconnect services when they're no longer needed</li>
                      </ul>
                      <p className="mt-4 leading-8 lg:mt-3">Keeping integrations in a single location makes it easy to manage your campaign's connected tools while maintaining visibility into what's currently active.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Director-Level Access</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Because integrations affect the entire campaign, access to the Integrations Hub is limited to Organization Administrators, Campaign Managers, and Department Directors.</p>
                      <p className="mt-3 leading-8 lg:mt-2">This ensures campaign-wide services are managed by trusted leadership while allowing General Users to remain focused on day-to-day execution.</p>
                      <p className="mt-3 leading-8 lg:mt-2">The Integrations Hub can be accessed directly from the Tools section of Aether.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The easier it is to manage your campaign's connected services, the easier it is to keep your team moving.</p>
                      <p className="mt-3 leading-8 lg:mt-2">The Integrations Hub provides a single place to configure and maintain the external tools your campaign depends on—keeping setup simple, organized, and ready for execution.</p>
                    </div>
                  </div>
                ) : id === "integrations" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">No campaign operates with a single piece of software. Fundraising platforms. Social media. Calendars. Email. Cloud storage. Analytics. Modern campaigns rely on dozens of tools to accomplish their goals.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Aether connects the services campaigns already rely on so campaign teams can work from one operational picture instead of constantly switching between disconnected platforms.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Live Integrations</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The following integrations are live and currently supported within Aether:</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-2 lg:mt-3">
                        {[
                          "Google Drive",
                          "Gmail",
                          "Google Calendar",
                          "Google Routes",
                          "ActBlue",
                          "WinRed",
                          "YouTube",
                          "Meta",
                          "Instagram",
                          "TikTok",
                          "Campaign Websites",
                        ].map((integration) => (
                          <div
                            key={integration}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-semibold text-white lg:px-3 lg:py-2.5"
                          >
                            {integration}
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 leading-8 lg:mt-3">Integration availability can depend on third-party platform access, API permissions, provider requirements, and the capabilities made available by each connected service.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Google Routes in the Field</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Google Routes is live within Aether and Aether Mobile, supporting field execution alongside shared contact data, lists, dispositions, and running notes. This keeps route planning and field activity connected to the same operational picture used by the rest of the campaign.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">CSV Imports and Manual Workflows</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Live integrations are not the only way to bring campaign information into Aether. CSV import functionality is available today for campaigns that prefer manual workflows or need to bring data in from systems without a direct connection.</p>
                      <p className="mt-3 leading-8 lg:mt-2">This gives campaigns flexibility to use live connections where available while continuing to import structured campaign data on their own schedule when that workflow makes more sense.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">How Connected Services Access Data</h3>
                      <p className="mt-4 leading-8 lg:mt-3">When campaign leadership connects a supported third-party service, Aether accesses only the information and capabilities authorized through that provider connection and uses that access to provide the integration features requested by the campaign.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Each connected service remains subject to the permissions, security practices, and policies of its provider. Campaign leadership controls which supported integrations are connected to the organization.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Disconnecting a supported service stops future connection activity where supported, but does not necessarily remove information that was previously imported into Aether as part of the campaign’s operational data.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built with Purpose</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Not every outside service belongs inside a Campaign Operating System. Aether prioritizes integrations that help campaigns reduce duplicate work, improve visibility, enrich campaign data, or strengthen operational awareness while allowing campaigns to continue using the tools they already trust.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">The best campaign software doesn't exist in isolation. It works alongside the tools campaigns already depend on. Connect what matters. Reduce unnecessary work. Keep information flowing. Help every department operate from the same shared understanding of the campaign.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Great integrations are not measured by how many logos appear on a page. They are measured by how effectively they help campaigns execute.</p>
                    </div>
                  </div>
                ) : id === "organizations" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every campaign is different. Different priorities. Different strategies. Different teams. Different political parties. Aether was built to support campaigns across the political spectrum, providing the same Campaign Operating System regardless of party affiliation.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Our goal is simple. Build great campaign software. Let campaigns decide how to use it.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Designed for Every Campaign</h3>
                      <p className="mt-4 leading-8 lg:mt-3">When creating an organization, campaigns can identify themselves as Democratic, Republican, or choose Aether's default organization type. That selection helps personalize the experience without changing how the platform operates.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Every organization receives the same core features, the same tools, and the same commitment to helping campaigns execute more effectively.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Your Organization</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Certain parts of Aether automatically adapt based on your organization's configuration. Integration recommendations are context-aware, ensuring Democratic campaigns aren't presented with Republican fundraising platforms, and Republican campaigns aren't presented with Democratic ones.</p>
                      <p className="mt-3 leading-8 lg:mt-2">The interface also adjusts to reflect your organization, using blue for Democratic organizations, red for Republican organizations, or Aether's default navy theme. As Aether continues to grow, we look forward to expanding personalization options with additional themes and organization preferences.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">One Platform. Equal Support.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Aether doesn't believe great campaign technology should belong to one party. Our mission is to build the best Campaign Operating System possible and make it available to every campaign that's working to engage voters, organize supporters, and serve their communities.</p>
                      <p className="mt-3 text-lg font-semibold text-white lg:mt-2 lg:text-base">Politics may differ. Good operations don't.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every campaign deserves tools that help it succeed. Regardless of party affiliation, Aether provides the same operational foundation, allowing organizations to focus less on managing software and more on running their campaigns.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because better organization benefits every campaign.</p>
                    </div>
                  </div>
                                ) : id === "team-management" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns are built by people working together.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">From volunteers and department directors to campaign leadership, every team member plays a different role in helping the campaign succeed.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">The Team Management section gives Organization Administrators a simple way to build and manage that team while ensuring every user has access to the tools they need.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built for Organization Administrators</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Managing a campaign team shouldn't require technical expertise.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Organization Administrators can quickly add new members, remove users when necessary, and manage access from a single location.</p>
                      <p className="mt-3 leading-8 lg:mt-2">As campaigns grow and responsibilities change, Team Management makes it easy to keep the organization's structure up to date without disrupting day-to-day operations.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Flexible Roles and Departments</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaigns aren't always organized the same way.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Some staff wear multiple hats.</p>
                      <p className="mt-3 leading-8 lg:mt-2">A Finance Director may also oversee Outreach.</p>
                      <p className="mt-3 leading-8 lg:mt-2">A Field Director may assist with Digital.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign leadership often spans several departments at once.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because of that, Aether allows Organization Administrators to assign multiple roles and multiple departments to individual users, ensuring every team member has access to the areas they need while supporting the way real campaigns operate.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Those assignments also help shape each user's experience within Aether. The roles and departments assigned to a user determine what they can access, the tools available to them, and the actions they're permitted to perform—helping every team member stay focused on their responsibilities while maintaining an organized and secure campaign environment.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We'll explore roles and permissions in greater detail in the next section.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built to Grow with Your Campaign</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaign teams change throughout the election cycle.</p>
                      <p className="mt-3 leading-8 lg:mt-2">New volunteers become staff.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Consultants join for specific projects.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Departments expand as Election Day approaches.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Team Management makes those transitions simple, allowing Organization Administrators to adapt the organization as the campaign evolves.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Strong campaigns depend on strong teams.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Team Management provides Organization Administrators with the tools to organize staff, manage access, and support collaboration across every department.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because when every person has the right access to the right tools, the entire campaign operates more effectively.</p>
                    </div>
                  </div>
 ) : id === "roles" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Every member of a campaign contributes differently.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">A Campaign Manager doesn't perform the same work as a Finance Director.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">A Finance Director doesn't perform the same work as a volunteer making donor calls.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Because of that, every user doesn't need the same view of Aether.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Roles and permissions ensure each team member has access to the tools, information, and actions appropriate for their responsibilities, helping every user stay focused on the work that matters most.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Built Around Responsibility</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Roles and permissions aren't designed to restrict users.</p>
                      <p className="mt-3 leading-8 lg:mt-2">They're designed to reduce unnecessary complexity.</p>
                      <p className="mt-3 leading-8 lg:mt-2">By tailoring each user's experience to their responsibilities, Aether creates a cleaner workspace, minimizes distractions, and helps every department operate more efficiently.</p>
                      <p className="mt-3 leading-8 lg:mt-2">As responsibilities change throughout a campaign, Organization Administrators can update roles and permissions at any time.</p>
                    </div>

                    <div><h3 className="text-2xl font-bold text-white lg:text-xl">Administrative Access</h3><p className="mt-3 leading-8 lg:mt-2">Organization Administrators and Campaign Managers have full visibility across the Campaign Operating System.</p><p className="mt-3 leading-8 lg:mt-2">They can view every department, monitor campaign activity, manage users, and oversee campaign operations from a complete organizational perspective.</p><p className="mt-3 leading-8 lg:mt-2">This level of access helps leadership understand how every department is performing while ensuring they can support the campaign wherever needed.</p></div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl"><h3 className="text-2xl font-bold text-white lg:text-xl">Department Leadership</h3><p className="mt-4 leading-8 lg:mt-3">Department Directors have full access within the departments they lead.</p><p className="mt-3 leading-8 lg:mt-2">In addition to managing their department's work, Directors also have access to the campaign's Overview Dashboard, allowing them to understand how their department contributes to the campaign's broader objectives.</p><p className="mt-3 leading-8 lg:mt-2">This balance provides department leaders with the visibility they need while keeping their daily focus on the teams they manage.</p></div>

                    <div><h3 className="text-2xl font-bold text-white lg:text-xl">General Users</h3><p className="mt-3 leading-8 lg:mt-2">General Users receive a streamlined experience centered around their assigned department.</p><p className="mt-3 leading-8 lg:mt-2">Rather than exposing every tool and administrative function, Aether presents the features, workflows, and information most relevant to their day-to-day responsibilities.</p><p className="mt-3 leading-8 lg:mt-2">General Users also have access to the Overview Dashboard, providing high-level visibility into campaign progress while keeping their primary focus on executing the work assigned to them.</p></div>

                    <div><h3 className="text-2xl font-bold text-white lg:text-xl">Focus Through Simplicity</h3><p className="mt-3 leading-8 lg:mt-2">The goal of roles and permissions isn't simply controlling access.</p><p className="mt-3 leading-8 lg:mt-2">It's helping every member of the campaign stay in their operating lane.</p><p className="mt-3 leading-8 lg:mt-2">When every user sees the right information, has the right tools, and focuses on the responsibilities assigned to them, the entire campaign becomes more organized, more efficient, and easier to manage.</p></div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl"><h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3><p className="mt-4 leading-8 lg:mt-3">The best campaigns aren't built by giving everyone access to everything.</p><p className="mt-3 leading-8 lg:mt-2">They're built by giving every team member exactly what they need to succeed.</p><p className="mt-3 leading-8 lg:mt-2">Roles and permissions ensure every user can contribute effectively while leadership maintains the visibility needed to guide the campaign forward.</p></div>
                  </div>
                                ) : id === "security" ? (
                  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
                    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns trust Aether with information that’s essential to their daily operations.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Contacts.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Donor history.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Campaign strategy.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Operational data.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">That trust isn’t something we take lightly.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">Security isn’t a feature added after the platform was built.</p>
                    <p className="leading-8 lg:text-sm lg:leading-6">It’s a responsibility that influences every decision we make.</p>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Protecting Your Campaign</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Every campaign deserves confidence that its information is being handled responsibly.</p>
                      <p className="mt-3 leading-8 lg:mt-2">From encrypted connections and protected data storage to organization-level access controls, Aether is designed to help protect campaign information while ensuring authorized team members can access the information they need to do their jobs. Campaign data remains isolated within its own organization, and Organization Administrators control who can join the campaign, what roles they hold, and what information they can access. Data is encrypted both in transit and at rest, helping protect information throughout its lifecycle.</p>
                      <p className="mt-3 leading-8 lg:mt-2">As the platform continues to evolve, so will our security practices.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Protecting campaign data will always remain one of our highest priorities.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Security Through Organization</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Good security isn’t only about technology.</p>
                      <p className="mt-3 leading-8 lg:mt-2">It’s also about making sure the right people have access to the right information.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Aether’s role and permission system helps campaigns organize access based on responsibility, allowing team members to focus on their work while reducing unnecessary exposure to information outside their role.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Strong organization is an important part of strong security.</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Your Data Remains Yours</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Aether exists to help campaigns organize, understand, and execute—not to claim ownership of the information entrusted to the platform. Campaign leadership can use Full Data Export in Tools to retain a copy of campaign-owned operational data.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Following cancellation or completion of yearly usage, Aether may retain campaign data for up to 60 days. Campaigns should export their full data set before that grace period expires.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Campaigns that want to preserve their Aether data between campaign cycles may keep their data stored in Aether for $5 per month until the next campaign rather than allowing the post-subscription retention period to expire.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">A Commitment to Trust</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Technology changes.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Security threats evolve.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Campaigns deserve software that evolves alongside them.</p>
                      <p className="mt-3 leading-8 lg:mt-2">We’ll continue investing in the security of the platform, improving protections, and adopting best practices as Aether grows.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because earning a campaign’s trust doesn’t happen once.</p>
                      <p className="mt-3 leading-8 lg:mt-2">It happens every day.</p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
                      <p className="mt-4 leading-8 lg:mt-3">Campaigns have enough to worry about.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Your software shouldn’t be one of them.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Our commitment is simple:</p>
                      <p className="mt-3 leading-8 lg:mt-2">Protect your information.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Respect your trust.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Continue improving.</p>
                      <p className="mt-3 leading-8 lg:mt-2">Because a Campaign Operating System should provide confidence as well as capability.</p>
                    <h3 className="text-2xl font-bold text-white lg:text-xl">Security Philosophy</h3>
                      <p className="mt-3 leading-8 lg:mt-2">Campaign data should only be accessible to authorized users. Aether uses authenticated access, role-based permissions, encrypted communications, protected stored data, organization isolation, audit history, and ongoing platform maintenance to help safeguard campaign information.</p>
                      <h3 className="text-2xl font-bold text-white lg:text-xl">Responsible Disclosure</h3>
                      <p className="mt-3 leading-8 lg:mt-2">If you believe you have identified a security issue, Team Aether encourages responsible disclosure so the issue can be investigated and addressed appropriately.</p>
                    </div>
                  </div>

) : id === "privacy" ? (
  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Campaigns trust Aether with information that matters.</p>
    <p className="leading-8 lg:text-sm lg:leading-6">That information belongs to your organization—not to us.</p>
    <p className="leading-8 lg:text-sm lg:leading-6">Our role is to provide the tools that help campaigns organize, execute, and succeed while respecting the privacy of the information entrusted to the platform.</p>

    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
      <h3 className="text-2xl font-bold text-white lg:text-xl">Your Data Stays Yours</h3>
      <p className="mt-4 leading-8 lg:mt-3">Aether exists to help campaigns manage their operations.</p>
      <p className="mt-3 leading-8 lg:mt-2">We don’t build the platform to own your campaign data or use it for purposes outside of supporting your organization’s experience within Aether.</p>
      <p className="mt-3 leading-8 lg:mt-2">Your campaign’s contacts, operational data, and organizational information remain your campaign’s information.</p>
      <p className="mt-3 leading-8 lg:mt-2">Aether does not sell campaign data or treat campaign contacts, donor information, supporter information, volunteer records, or operational data as an advertising product.</p>
    </div>

    <div>
      <h3 className="text-2xl font-bold text-white lg:text-xl">Built on Respect</h3>
      <p className="mt-3 leading-8 lg:mt-2">Privacy is about more than policies.</p>
      <p className="mt-3 leading-8 lg:mt-2">It’s about treating campaign information with the same level of respect we’d expect for our own.</p>
      <p className="mt-3 leading-8 lg:mt-2">Every feature we build considers how information is accessed, who should be able to see it, and how organizations maintain control over their own data.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-black/20 p-6 lg:p-[18px] lg:rounded-xl">
      <h3 className="text-2xl font-bold text-white lg:text-xl">Transparency Matters</h3>
      <p className="mt-4 leading-8 lg:mt-3">We believe campaigns should understand how their information is handled.</p>
      <p className="mt-3 leading-8 lg:mt-2">Our Privacy Policy provides the complete legal details regarding data collection, storage, and platform usage, and we’ll continue updating those policies as Aether evolves.</p>
      <p className="mt-3 leading-8 lg:mt-2">Our goal is to be transparent—not confusing.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
      <p className="mt-4 leading-8 lg:mt-3">Campaigns choose Aether to help manage their operations.</p>
      <p className="mt-3 leading-8 lg:mt-2">That relationship is built on trust.</p>
      <p className="mt-3 leading-8 lg:mt-2">We’re committed to respecting your organization’s privacy, protecting your information, and being transparent about how the platform works.</p>
      <p className="mt-3 leading-8 lg:mt-2">Because your campaign should always remain in control of its own data.</p>
    </div>
  </div>

) : id === "faq" ? (
  <div className="mt-8 max-w-4xl space-y-8 text-slate-300 lg:space-y-5 lg:mt-5">
    <p className="text-lg leading-8 lg:text-base lg:leading-7 lg:text-base">Questions are a natural part of learning any new platform.</p>
    <p className="leading-8 lg:text-sm lg:leading-6">The Frequently Asked Questions section provides quick answers to common questions about using Aether, helping users find information without interrupting their workflow.</p>
    <p className="leading-8 lg:text-sm lg:leading-6">As Aether continues to grow, the FAQ will continue growing alongside it.</p>

    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:p-[18px] lg:rounded-xl">
      <h3 className="text-2xl font-bold text-white lg:text-xl">Always Evolving</h3>
      <p className="mt-4 leading-8 lg:mt-3">No software remains exactly the same.</p>
      <p className="mt-3 leading-8 lg:mt-2">New features are introduced.</p>
      <p className="mt-3 leading-8 lg:mt-2">Existing workflows improve.</p>
      <p className="mt-3 leading-8 lg:mt-2">Questions change over time.</p>
      <p className="mt-3 leading-8 lg:mt-2">Because of that, our FAQ is continuously updated to reflect the current version of Aether, ensuring answers remain accurate as the platform evolves.</p>
    </div>

    <div>
      <h3 className="text-2xl font-bold text-white lg:text-xl">When You Need More Than an Answer</h3>
      <p className="mt-3 leading-8 lg:mt-2">Sometimes a simple answer isn’t enough.</p>
      <p className="mt-3 leading-8 lg:mt-2">Some topics deserve additional explanation, real-world examples, or a deeper understanding of why Aether works the way it does.</p>
      <p className="mt-3 leading-8 lg:mt-2">That’s exactly why we created the Aether Academy.</p>
      <p className="mt-3 leading-8 lg:mt-2">While the FAQ provides quick answers, the Academy provides the context behind those answers—explaining not only how to use Aether, but also the campaign operations and philosophies that shaped it.</p>
      <p className="mt-3 leading-8 lg:mt-2">Together, they help campaigns move from simply using the platform to fully understanding it.</p>
    </div>

    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:p-[18px] lg:rounded-xl">
      <h3 className="text-2xl font-bold text-white lg:text-xl">Clarity. Focus. Execution.</h3>
      <p className="mt-4 leading-8 lg:mt-3">Questions will always exist.</p>
      <p className="mt-3 leading-8 lg:mt-2">Our goal isn’t simply to answer them.</p>
      <p className="mt-3 leading-8 lg:mt-2">Our goal is to give campaigns the knowledge and confidence to use Aether effectively, today and as it continues to evolve.</p>
      <p className="mt-3 leading-8 lg:mt-2">Because great software isn’t just easy to use.</p>
      <p className="mt-3 leading-8 lg:mt-2">It’s easy to understand.</p>
    </div>
  </div>
) : (
                  <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-white/15 bg-black/10 px-5 py-5 lg:px-4 lg:mt-5 lg:rounded-xl">
                    <p className="font-semibold text-slate-300">This guide is being prepared.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 lg:mt-1.5 lg:text-[12px]">Content will be added as the Aether Learning Library is developed section by section.</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer Return */}
      <section className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 text-center sm:flex-row sm:text-left lg:gap-4 lg:px-[18px] lg:py-7">
          <div>
            <p className="font-black text-white">Aether Academy</p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[12px]">
              The official learning center for Aether Political.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10 px-6 py-3 font-bold text-violet-300 transition hover:-translate-y-0.5 hover:bg-violet-400/15 lg:px-[18px] lg:py-2.5"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </section>

      {/* Potato Easter Egg */}
      {showPotatoModal && (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-[#07111f]/95 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 120 }).map((_, index) => (
              <span
                key={index}
                className="absolute select-none"
                style={{
                  left: `${(index * 37) % 103 - 3}%`,
                  top: `${(index * 61) % 107 - 4}%`,
                  fontSize: `${34 + ((index * 17) % 70)}px`,
                  transform: `rotate(${(index * 47) % 360}deg)`,
                  opacity: 0.72 + ((index % 4) * 0.07),
                }}
              >
                🥔
              </span>
            ))}
          </div>

          <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-3xl border border-violet-300/40 bg-[#0b1729]/95 p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-10">
              <div className="text-6xl" aria-hidden="true">🥔</div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Please go do your job...
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                We know you clicked this 33 times to keep your computer from falling asleep.
              </p>
              <button
                type="button"
                onClick={() => setShowPotatoModal(false)}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-violet-600 px-7 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top */}
      <a
        href="#top"
        aria-label="Back to top"
        onClick={handleBackToTopClick}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-violet-300/40 bg-violet-600 font-black text-slate-950 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:bg-violet-400"
      >
        ↑
      </a>
    </main>
  );
}
