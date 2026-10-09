"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const guides = [
  {
    "category": "Getting Started",
    "id": "welcome",
    "title": "Welcome to Aether Business",
    "intro": "Aether Business brings an organization’s essential operational functions into a coordinated environment. Start with the modules your organization actually uses, establish team access, and build reliable records before expecting meaningful trends or operational interpretation.",
    "subhead": "A practical starting sequence",
    "details": [
      "Confirm your organization and enabled modules",
      "Invite team members and assign appropriate roles",
      "Create or import relevant business records",
      "Review departmental dashboards and Focus workflows",
      "Connect only the integrations supported for your organization"
    ]
  },
  {
    "category": "Getting Started",
    "id": "scope",
    "title": "Documentation Scope",
    "intro": "This Academy explains the public-facing behavior and operating philosophy of Aether Business. It is an educational reference, not a promise that every integration or capability is enabled for every organization. Availability depends on provisioned modules, configured connections, and recorded data.",
    "subhead": "What this guide does not expose",
    "details": [
      "Private implementation details, security internals, and proprietary interpretation rules are not published here."
    ]
  },
  {
    "category": "Getting Started",
    "id": "business-os",
    "title": "What is a Business Operating System?",
    "intro": "Aether Business is a modular operating environment. Rather than treating customer relationships, marketing, inventory, dispatch, and finance as unrelated applications, it provides a shared foundation for visibility and coordinated work. A small business can begin with a subset of modules; a larger organization can provision additional departments.",
    "subhead": "The operating principle",
    "details": [
      "Information is recorded in the relevant department, reviewed through dashboards, interpreted where supported by A.B.E., and acted on by employees using departmental workflows."
    ]
  },
  {
    "category": "Platform",
    "id": "abe",
    "title": "A.B.E. — Aether Brain Engine",
    "intro": "A.B.E. is a deterministic operational interpretation layer. It evaluates recorded activity against defined business rules to highlight conditions and potential pressure points. It does not use generative AI or large language models, and it does not invent business activity.",
    "subhead": "People remain responsible",
    "details": [
      "A.B.E. does not autonomously make business decisions or perform departmental work. Its visibility is limited to the modules enabled for the organization and the records available within them."
    ]
  },
  {
    "category": "Platform",
    "id": "overview",
    "title": "Business Overview",
    "intro": "The Business Hub is the organization’s central awareness environment. It brings together the A.B.E. Business Snapshot, Business Trends, and Operational Analytics. Trends vary by enabled department and use recorded activity rather than fabricated history.",
    "subhead": "Three complementary views",
    "details": [
      "A.B.E. Business Snapshot: written interpretation of supported operational conditions",
      "Business Trends: department-specific activity over time",
      "Operational Analytics: concise indicators from enabled departments"
    ]
  },
  {
    "category": "Platform",
    "id": "focus",
    "title": "Focus Mode",
    "intro": "Focus Mode organizes actionable departmental responsibilities into structured execution lanes. It complements the full department pages: dashboards provide broad visibility, while Focus Mode helps employees work through qualifying records and responsibilities. Empty lanes are legitimate; Aether does not generate fake tasks.",
    "subhead": "Execution by department",
    "details": [
      "CRM: customer lists and follow-ups",
      "Marketing: content, spend, audience response, and history",
      "Inventory: reorder, purchasing, and delivery",
      "Dispatch: assignment, routing, and execution",
      "Finance: receive, pay, and review"
    ]
  },
  {
    "category": "Departments",
    "id": "crm",
    "title": "CRM — Customer Relationships",
    "intro": "Business CRM combines customer records, recorded interactions, follow-up responsibilities, CRM lists, and a Relationship Pipeline. Its dashboard highlights Total Contacts, CRM Lists, Contacted, and Requires Follow-Up. Search supports names, emails, phone numbers, and companies.",
    "subhead": "Working a relationship",
    "details": [
      "Use the Relationship Pipeline to review recent activity, ownership, and next actions. Recorded interaction types include calls, emails, texts, and responses. Filters help surface scheduled follow-ups and contacts awaiting a response."
    ]
  },
  {
    "category": "Departments",
    "id": "marketing",
    "title": "Marketing — Performance & Content",
    "intro": "Business Marketing combines recorded impressions, engagement, spend, sentiment, platform performance, and content workflows. Its Performance Trend chart visualizes available records. Recognized data sources include Meta/Facebook, Instagram, X, TikTok, YouTube, and website analytics; recognition does not mean an integration is connected.",
    "subhead": "Content is a workflow, not autopilot",
    "details": [
      "Marketing Focus Mode includes Content, Spend, Audience Response, and History. A published content record reflects a saved workflow status, not proof that Aether automatically posted to a social network."
    ]
  },
  {
    "category": "Departments",
    "id": "inventory",
    "title": "Inventory — Stock & Purchasing",
    "intro": "Inventory tracks items, quantities on hand, reserved quantities, availability, reorder points, purchase orders, and incoming deliveries. Available stock reflects unreserved on-hand quantity. Teams can define custom fields using text, number, date, or Yes/No values.",
    "subhead": "From low stock to receipt",
    "details": [
      "Reorder Watch highlights items at or below their configured threshold",
      "Purchase orders move through Draft, Ordered, Partially Received, Received, and Cancelled",
      "Deliveries can record partial receipts and tracking information",
      "Recording a receipt updates on-hand stock; finishing a delivery is a separate action"
    ]
  },
  {
    "category": "Departments",
    "id": "dispatch",
    "title": "Dispatch — Jobs & Coordination",
    "intro": "Dispatch organizes jobs, service locations, scheduling, assignments, and operational progress. Jobs can be associated with customers, Dispatch lists, or manually entered addresses. The Command Center shows Active Jobs, Unassigned, In Progress, Route Ready, and Completed.",
    "subhead": "Understand job status",
    "details": [
      "Jobs move through Unassigned, Assigned, Scheduled, In Progress, and Completed. Route Ready means an active job has a recorded service address; it does not mean a route was generated or optimized."
    ]
  },
  {
    "category": "Departments",
    "id": "finance",
    "title": "Finance — Operational Cash Visibility",
    "intro": "Business Finance distinguishes completed transactions from expected incoming and outgoing obligations. The Command Center shows Money In, Money Out, Net, and Outstanding. Financial Flow uses recorded transactions; Financial Attention surfaces open and overdue obligations.",
    "subhead": "Finance is not a replacement accounting ledger",
    "details": [
      "Employees can create obligations through Manual Entry, import supported CSV records, and review recent transactions. Finance Focus Mode organizes Receive, Pay, and Review. Accounting and payment platforms remain systems of record for their respective functions."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "contacts",
    "title": "Contacts & Customer Records",
    "intro": "Customer records provide a common foundation for relationship management and supported operational workflows. CRM supports searching and reviewing contact profiles; Dispatch can associate jobs with existing customers and their saved service addresses.",
    "subhead": "Keep records meaningful",
    "details": [
      "Record accurate customer information and interactions so other workflows can use the same organizational context without recreating it."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "lists",
    "title": "Lists & Organized Work",
    "intro": "Lists help employees focus on selected groups of records. CRM uses lists for relationship work; Dispatch can use a Dispatch list when creating jobs for multiple customers. The available workflow depends on the department and its permissions.",
    "subhead": "From broad visibility to focused work",
    "details": [
      "Use departmental lists to organize existing records for a specific purpose rather than treating lists as a separate source of truth."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "imports",
    "title": "Imports & Recorded Data",
    "intro": "Aether Business relies on actual organizational records. Business Finance supports CSV import of financial activity; Marketing supports importing analytics records. Dashboards and A.B.E. only interpret data that is available and supported.",
    "subhead": "No manufactured history",
    "details": [
      "When there is insufficient recorded information, the relevant chart or interpretation can show an empty or limited-data state."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "tools",
    "title": "Business Tools",
    "intro": "Business Tools is a shared workspace for internal coordination and everyday utilities. The FAQ describes Business Coordination messaging, Team Status, Google email, calendar and file access, and a route into the Integrations Hub.",
    "subhead": "Connections are conditional",
    "details": [
      "Available connected services depend on the organization’s configuration and supported integrations. A visible platform label does not prove an active connection."
    ]
  },
  {
    "category": "Administration",
    "id": "team",
    "title": "Organizations & Team Management",
    "intro": "Aether Business is organized around an active organization and its provisioned departments. Team membership, roles, departments, titles, and profile statuses help describe who participates in the workspace and how work is distributed.",
    "subhead": "A modular environment",
    "details": [
      "Enabled modules determine which departments appear in organizational analytics and which operational information A.B.E. can interpret."
    ]
  },
  {
    "category": "Administration",
    "id": "roles",
    "title": "Roles & Permissions",
    "intro": "Team access and departmental responsibilities should reflect the organization’s actual structure. Administrators manage membership and configuration; employees work in the departmental environments available to them.",
    "subhead": "Use appropriate access",
    "details": [
      "Assign access according to each person’s responsibilities and review it as teams and departments change."
    ]
  },
  {
    "category": "Resources",
    "id": "support",
    "title": "Help, FAQ & Policies",
    "intro": "The Business FAQ provides quick answers; this learning library provides the surrounding operational context. Shared legal and security pages cover both Aether Political and Aether Business.",
    "subhead": "Continue learning",
    "details": [
      "Visit the Business FAQ for specific questions, or the shared Academy for articles, blog updates, and patch notes."
    ]
  }
];

const tabs = [
  { label: "Learning Library — Political", href: "/aether-academy#library" },
  { label: "Learning Library — Business", href: "#library" },
  { label: "Training Videos — Political", href: "/aether-academy/training-videos" },
  { label: "Training Videos — Business", href: "/aether-academy/business-training-videos" },
  { label: "Articles", href: "/aether-academy/articles" },
  { label: "Blog", href: "/aether-academy/blog" },
  { label: "Patch Notes", href: "/aether-academy/patch-notes" },
];

export default function BusinessAcademyPage() {
  const [clicks, setClicks] = useState(0);
  const [showPotato, setShowPotato] = useState(false);
  const backToTop = () => setClicks((previous) => { const next = previous + 1; if (next >= 33) { setShowPotato(true); return 0; } return next; });
  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-[#07111f] text-white">
      {/* Hero — matched to the shared Aether Academy */}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,#10233e_0%,#0a1728_52%,#07111f_100%)]" />
        <div className="absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute -left-28 top-44 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-28 lg:px-[18px] lg:py-16">
          <div className="mb-8 flex items-center justify-center lg:mb-5">
            <Image src="/aether-logo-full.png" alt="Aether" width={260} height={72} priority className="h-auto w-64 drop-shadow-[0_0_24px_rgba(139,92,246,0.35)] lg:w-52" />
          </div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-violet-300 lg:mb-3 lg:px-3 lg:py-1.5 lg:text-[10px]">
            Official Learning Center · Business
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-4xl">
            Aether Business Academy
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl lg:mt-5 lg:text-base lg:leading-7">
            Understand the Business Operating System, the modules your organization uses, and the workflows that connect operational awareness to execution.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:mt-7 lg:gap-3">
            <a href="#library" className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-7 py-3.5 font-bold text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.22)] transition hover:-translate-y-0.5 hover:bg-violet-400 lg:px-5">
              Learning Library — Business
            </a>
            <Link href="/aether-academy#library" className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-7 py-3.5 font-bold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5">
              Learning Library — Political
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-7 py-3.5 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5">
              Enter Aether
            </Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10 lg:px-5">
              Back to Political
            </Link>
            <Link href="/business-public" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10 lg:px-5">
              Back to Business
            </Link>
          </div>
        </div>
      </section>
      {/* Academy navigation — same dimensions and layout as Political */}
      <nav aria-label="Academy sections" className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-3 lg:py-3">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-2">
            {tabs.map((tab) => (
              <Link key={tab.label} href={tab.href} className="min-w-max rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-3 text-violet-300 shadow-[0_10px_30px_rgba(139,92,246,0.08)] transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-3 lg:py-2.5">
                <div className="text-sm font-bold lg:text-[12px]">{tab.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/10 via-white/[0.04] to-blue-400/[0.06] p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Welcome to the Business Academy</p>
          <h2 className="mt-4 text-3xl font-black">Clarity. Focus. Execution.</h2>
          <p className="mt-4 max-w-4xl leading-8 text-slate-300">Aether Business is built around a simple idea: the people responsible for running an organization should be able to see what is happening, understand what needs attention, and act without constantly reconciling disconnected systems. This library explains the real workflows behind that idea.</p>
          <p className="mt-4 max-w-4xl leading-8 text-slate-300">This is educational documentation, not a sales brochure. It describes supported concepts from the Business FAQ and distinguishes recorded operational activity from automated actions or capabilities that depend on configuration.</p>
        </div>
      </section>
      <section id="library" className="scroll-mt-28 mx-auto max-w-7xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">Start here</p>
        <h2 className="mt-3 text-4xl font-black">Learning Library — Business</h2>
        <p className="mt-4 max-w-3xl leading-8 text-slate-300">Choose a subject below. Each guide is part of this page, so you can jump straight to the information you need.</p>
        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Start here</p><h3 className="mt-2 text-xl font-black">Getting Started</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Getting Started").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">How Aether works</p><h3 className="mt-2 text-xl font-black">Platform</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Platform").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Where work happens</p><h3 className="mt-2 text-xl font-black">Departments</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Departments").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Connected records</p><h3 className="mt-2 text-xl font-black">Shared Foundations</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Shared Foundations").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Control & access</p><h3 className="mt-2 text-xl font-black">Administration</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Administration").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Trust & support</p><h3 className="mt-2 text-xl font-black">Resources</h3><div className="mt-5 space-y-1">
            {guides.filter((guide) => guide.category === "Resources").map((guide) => <a key={guide.id} href={`#${guide.id}`} className="flex justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-violet-400/10 hover:text-violet-300"><span>{guide.title}</span><span aria-hidden="true">→</span></a>)}
          </div></section>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-5 px-6 pb-24">
        {guides.map((guide, index) => <article key={guide.id} id={guide.id} className="scroll-mt-32 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] p-8 sm:p-10">
          <div className="absolute right-6 top-6 text-6xl font-black text-white/[0.025]">{String(index + 1).padStart(2, "0")}</div>
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">{guide.category}</span><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Official Guide</span></div>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{guide.title}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">{guide.intro}</p>
            <div className="mt-7 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6"><h3 className="text-xl font-bold">{guide.subhead}</h3>{guide.details.length > 1 ? <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">{guide.details.map((detail) => <li key={detail} className="leading-7">{detail}</li>)}</ul> : <p className="mt-4 leading-8 text-slate-300">{guide.details[0]}</p>}</div>
          </div>
        </article>)}
      </section>
      <footer className="border-t border-white/10 bg-black/10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-9">
        <div><p className="font-black">Aether Business Academy</p><p className="mt-1 text-sm text-slate-500">Part of the shared Aether Academy.</p></div>
        <div className="flex flex-wrap gap-3 sm:mr-20"><Link href="/aether-academy" className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 font-bold text-violet-300">Shared Academy</Link><Link href="/" className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 font-bold text-violet-300">← Back to Political</Link><Link href="/business-public" className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 font-bold text-violet-300">← Back to Business</Link></div>
      </div></footer>
      {showPotato && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/95 p-6 backdrop-blur-md"><div className="w-full max-w-xl rounded-3xl border border-violet-300/40 bg-[#0b1729] p-10 text-center"><div className="text-6xl">🥔</div><h2 className="mt-5 text-3xl font-black">Please go do your job...</h2><p className="mt-5 text-lg leading-8 text-slate-300">We know you clicked this 33 times to keep your computer from falling asleep.</p><button type="button" onClick={() => setShowPotato(false)} className="mt-8 rounded-xl bg-violet-600 px-7 py-3 font-black">Close</button></div></div>}
      <a href="#top" aria-label="Back to top" onClick={backToTop} className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-violet-300/40 bg-violet-600 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-violet-500">↑</a>
    </main>
  );
}
