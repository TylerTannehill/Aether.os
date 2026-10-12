import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

// Each Academy section has its own walkthrough slot; videos may be shared across sections.
const videos = [
  ["Welcome to Aether Business", "An introduction to the modular Business Operating System and getting your organization started.", "welcome", "umlhHtF2plg"],
  ["Documentation Scope", "Understand what the public Academy documents and how available modules shape each organization's experience.", "scope", "umlhHtF2plg"],
  ["Business Operating System", "Explore how business departments share a coordinated operational foundation.", "business-os", "umlhHtF2plg"],
  ["A.B.E. — Aether Brain Engine", "Learn how deterministic operational interpretation supports awareness without generative AI or autonomous decisions.", "abe", "buqThZbfXjQ"],
  ["Business Overview", "Explore the Business Hub, operational analytics, trends, and the A.B.E. Business Snapshot.", "overview", "buqThZbfXjQ"],
  ["Focus Mode", "See how departmental execution lanes help teams organize real work.", "focus", "DEysQOnZu2U"],
  ["CRM", "Learn about customer records, interactions, relationship pipelines, lists, and follow-ups.", "crm", "W4PL4emYVbU"],
  ["Marketing", "Explore recorded marketing analytics, content workflows, spend, and audience response.", "marketing", "ziUpEj7qsMg"],
  ["Inventory", "Understand stock availability, reorder watch, purchase orders, and incoming deliveries.", "inventory", "KXHeEQE0WBE"],
  ["Dispatch", "Learn how to coordinate jobs, assignments, scheduling, and service locations.", "dispatch", "44GIe0rXnNI"],
  ["Finance", "Explore transactions, outstanding obligations, financial trends, and payment workflows.", "finance", "UznWYxzVAhY"],
  ["Projects & Tasks", "Learn how to organize projects, nested tasks, Kanban statuses, team assignments, deadlines, progress, and My Tasks.", "projects-tasks", "f6ISVZECcU0"],
  ["Contacts", "Understand shared customer records and relationship information.", "contacts", "zcTDabuWiv4"],
  ["Lists", "See how organized lists support focused business workflows.", "lists", "zcTDabuWiv4"],
  ["Imports", "Learn how recorded and imported information contributes to operational visibility.", "imports", "zcTDabuWiv4"],
  ["Business Tools", "Explore internal coordination, team status, supported Google tools, and the Integrations Hub.", "tools", "3dOMM1aeO-w"],
  ["Integrations Hub — Connected Services", "Learn how to connect, verify, manage, and disconnect supported business integrations, including social platforms, website analytics, Google services, and routing.", "integrations-hub", "3dOMM1aeO-w"],
  ["Organizations & Team Management", "Learn about organization membership and departmental access.", "team", "FrsF5HFp8A4"],
  ["Roles & Permissions", "Understand how roles and enabled modules affect the working environment.", "roles", "FrsF5HFp8A4"],
  ["Help, FAQ & Policies", "Find educational resources, common questions, and platform policies.", "support", "HO3hd08NVmo"],
] as const;

export default function BusinessTrainingVideosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-12">
        <div className="flex flex-wrap gap-3">
          <Link href="/aether-academy/business-academy" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:border-violet-400/40 lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-xs">← Business Learning Library</Link>
        </div>

        <div className="mt-10 text-center lg:mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-violet-300 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-sm">
            <PlayCircle className="h-4 w-4 lg:h-3.5 lg:w-3.5" /> Training Videos — Business
          </div>
          <h1 className="mt-8 text-5xl font-black lg:mt-5 lg:text-5xl">Learn Aether Business from Team Aether.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 lg:mt-4 lg:text-base lg:leading-7">
            Watch guided walkthroughs of Aether Business, then explore the corresponding written guides in the Business Learning Library. Some topics share a walkthrough to keep related features together.
          </p>
        </div>

        <div className="mt-20 space-y-8 lg:mt-12 lg:space-y-6">
          {videos.map(([title, desc, anchor, videoId]) => (
            <section key={anchor} id={anchor} className="scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl lg:rounded-2xl lg:p-6">
              <h2 className="text-2xl font-bold lg:text-xl">{title}</h2>
              <p className="mt-4 leading-8 text-slate-300 lg:mt-3 lg:text-sm lg:leading-6">{desc}</p>
              <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black lg:mt-4">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${title} — Aether Business Training`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="mt-8 lg:mt-5">
                <Link href={`/aether-academy/business-academy#${anchor}`} className="inline-flex items-center gap-2 font-semibold text-violet-300 transition hover:text-violet-200 lg:gap-1.5 lg:text-sm">
                  View Related Guide <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                </Link>
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/business-public" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:border-violet-400/40">← Back to Business</Link>
          <Link href="/" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:border-violet-400/40">← Back to Political</Link>
        </div>
      </div>
    </main>
  );
}
