import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Aether Ecosystem | Political, Business, Academy & Social",
  description:
    "Explore Aether Political, Aether Business, Aether Academy, Aether Social, and the future of the Aether ecosystem.",
  alternates: { canonical: "/ecosystem" },
};

const products = [
  {
    id: "political",
    eyebrow: "The Campaign Operating System",
    name: "Aether Political",
    number: "01",
    accent: "violet",
    paragraphs: [
      "Political campaigns are complicated organizations operating under extraordinary time pressure. Fundraising, voter outreach, field operations, digital communications, and printed materials all have to work together, yet these responsibilities are often managed through separate applications. Aether Political was built to bring those moving pieces into one coordinated operating environment.",
      "Aether connects five essential campaign departments: Finance, Field, Outreach, Digital, and Print. Through shared contacts, lists, operational records, dashboards, and departmental workflows, campaign teams can organize their work without constantly moving between disconnected systems. Focus Mode helps staff concentrate on actionable responsibilities, while Honest Abe interprets campaign activity to highlight priorities and operational pressure.",
      "The goal isn't to replace the people running a campaign. It's to give them the clarity and structure they need to do their jobs effectively. From organizing donor outreach to coordinating canvassing and reviewing campaign performance, Aether helps teams spend less time managing software and more time executing the work that moves a campaign forward.",
    ],
    href: "/political-public",
    cta: "Explore Aether Political",
    tags: ["Finance", "Field", "Outreach", "Digital", "Print"],
  },
  {
    id: "business",
    eyebrow: "The Business Operating System",
    name: "Aether Business",
    number: "02",
    accent: "blue",
    paragraphs: [
      "Running a business means keeping track of customers, employees, marketing, inventory, finances, and everyday responsibilities. As organizations grow, those activities often become scattered across different applications and disconnected workflows. Aether Business brings essential business operations into a shared environment designed to help teams stay organized, understand what's happening, and coordinate their work.",
      "Aether Business is modular, allowing organizations to use the departments that fit their needs: CRM, Marketing, Inventory, Dispatch, and Finance. Alongside those departments, Projects & Tasks provides a shared workspace for planning, assignments, and progress tracking. Departmental dashboards provide visibility into recorded activity, while Focus Mode helps employees work through responsibilities. A.B.E., the Aether Brain Engine, uses defined operational rules to interpret available business records and highlight conditions that may deserve attention.",
      "Whether an organization is managing customer follow-ups, coordinating service jobs, monitoring inventory, or tracking financial obligations, Aether Business is designed to connect information with action. Rather than requiring every business to operate the same way, it provides a flexible foundation that can grow alongside the organization, helping teams establish clearer priorities, improve coordination, and maintain accountability.",
    ],
    href: "/business-public",
    cta: "Explore Aether Business",
    tags: ["CRM", "Marketing", "Inventory", "Dispatch", "Finance"],
  },
];

const future = [
  {
    id: "personal",
    name: "Aether Personal",
    eyebrow: "Your Personal Operating System",
    description:
      "Aether Personal is envisioned as a place to organize personal responsibilities, priorities, goals, and everyday life. The vision is to bring clarity and continuity to individual work and life while keeping personal information and control in the individual's hands.",
  },
];

export default function EcosystemPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(112,65,208,0.18),transparent_65%)]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" aria-label="Aether homepage" className="inline-flex shrink-0 items-center">
            <Image src="/aether-logo-full.png" alt="Aether" width={175} height={100} className="h-auto w-28 sm:w-44" priority />
          </Link>
          <Link href="/social-public" aria-label="Explore Aether Social" className="inline-flex min-w-0 items-center transition hover:opacity-90">
            <Image src="/social-branding-transparent.png" alt="Aether Social" width={230} height={105} className="h-auto w-32 object-contain sm:w-52" />
          </Link>
        </div>
        <Link href="/" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-violet-400/50 hover:bg-white/10">← Back to Aether</Link>
      </header>

      <section className="relative mx-auto max-w-5xl px-5 pb-14 pt-12 text-center sm:px-8 sm:pb-20 sm:pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-violet-300">Aether Systems LLC</p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">One philosophy. <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">An expanding ecosystem.</span></h1>
        <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">Different products, built for different parts of work and life. A shared commitment to clarity, focus, and execution — without treating every product or its data as one and the same.</p>
        <nav aria-label="Explore ecosystem sections" className="mt-9 flex flex-wrap justify-center gap-2">
          {[["Political", "#political"], ["Business", "#business"], ["Academy", "#academy"], ["Social", "#social"], ["Personal", "#personal"]].map(([label, href]) => (
            <a key={href} href={href} className="rounded-full border border-white/15 bg-white/[0.055] px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400/50 hover:text-white">{label}</a>
          ))}
        </nav>
      </section>

      <div className="relative mx-auto max-w-6xl space-y-8 px-5 pb-20 sm:px-8">
        {products.map((product) => (
          <section key={product.id} id={product.id} className="scroll-mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.065] to-white/[0.025] p-6 shadow-xl shadow-black/20 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">{product.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h2>
              </div>
              <span aria-hidden="true" className="text-5xl font-black text-white/[0.07] sm:text-7xl">{product.number}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => <span key={tag} className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-medium text-violet-200">{tag}</span>)}
            </div>
            <div className="mt-8 max-w-4xl space-y-5 text-[15px] leading-8 text-slate-300 sm:text-base">
              {product.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <div className="mt-9 border-t border-white/10 pt-7">
              <Link href={product.href} className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-500/30">{product.cta} <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
          </section>
        ))}

        <section id="academy" className="scroll-mt-8 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-white/[0.035] to-blue-500/[0.06] p-6 shadow-xl shadow-black/20 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">The Official Learning Center</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Aether Academy</h2>
          <div className="mt-8 max-w-4xl space-y-5 text-[15px] leading-8 text-slate-300 sm:text-base">
            <p>Aether Academy is the educational home of Aether Political and Aether Business. It exists to help people understand what the platforms do, how their workflows fit together, and why they were designed the way they were. Whether someone is exploring Aether for the first time or learning to use it with a team, the Academy offers a place to begin.</p>
            <p>The Academy brings together learning libraries, official documentation, training videos, articles, blog updates, and patch notes. Political and Business have their own learning resources, so visitors can focus on the operating environment relevant to them. The material is intended to explain actual platform behavior and supported workflows, not substitute for hands-on work or promise features that are not available.</p>
            <p>Education is part of Aether's larger philosophy: technology should make work easier to understand and execute. The Academy helps turn unfamiliar features into practical knowledge, giving teams and curious visitors a clearer view of how Aether works today and how it continues to develop.</p>
          </div>
          <div className="mt-9 border-t border-white/10 pt-7">
            <Link href="/aether-academy" className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-500/20 px-6 py-3 font-bold transition hover:-translate-y-0.5 hover:bg-violet-500/30">Visit Aether Academy <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
        </section>

        <section id="social" className="scroll-mt-8 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-white/[0.035] to-blue-500/[0.07] p-6 shadow-xl shadow-black/20 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Connections, Community & Opportunity</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Aether Social</h2>
            </div>
            <span aria-hidden="true" className="text-5xl font-black text-white/[0.07] sm:text-7xl">04</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Professional Profiles", "Personal Spaces", "Networking", "Jobs", "Employers"].map((tag) => (
              <span key={tag} className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1 text-xs font-medium text-violet-200">{tag}</span>
            ))}
          </div>
          <div className="mt-8 max-w-4xl space-y-5 text-[15px] leading-8 text-slate-300 sm:text-base">
            <p>Aether Social is being built around a simple idea: the people behind the work matter just as much as the work itself. Professional relationships, personal connections, and new opportunities should have room to grow without being buried under noise. Social brings those experiences into a dedicated part of the Aether ecosystem, with an emphasis on meaningful connections and useful participation.</p>
            <p>For individuals, Aether Social brings professional profiles, experience and skills, connections, and opportunities together. Its Professional and Personal experiences are designed to give people distinct ways to present themselves and connect with others. The professional side makes it easier to show what you have done, discover people and organizations, and explore job opportunities without reducing every interaction to a résumé or a feed.</p>
            <p>For employers, Aether Social provides a place to establish an organizational presence, publish openings, and connect those opportunities with professionals. Employer profiles and job listings are part of a broader approach to bringing people and organizations closer together. Social is still under active development, and the public overview explains the direction of the product as it takes shape.</p>
          </div>
          <div className="mt-9 border-t border-white/10 pt-7">
            <Link href="/social-public" className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-500/30">Explore Aether Social <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
        </section>

        <section aria-labelledby="future-title" className="pt-5">
          <div className="mb-7 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Looking Ahead</p>
            <h2 id="future-title" className="mt-3 text-3xl font-black sm:text-4xl">The ecosystem is still growing.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Aether Personal remains a future part of our ecosystem vision. It is not available to use today.</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-5">
            {future.map((item) => (
              <article key={item.id} id={item.id} className="scroll-mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-8">
                <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">In Development</span>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black">{item.name}</h3>
                <p className="mt-5 leading-8 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 px-5 py-9 text-center text-sm text-slate-400">
        <p className="font-semibold text-slate-200">Clarity. Focus. Execution.</p>
        <p className="mt-2">© {new Date().getFullYear()} Aether Systems LLC</p>
        <Link href="/" className="mt-4 inline-block text-violet-300 underline-offset-4 hover:underline">Return to the Aether homepage</Link>
      </footer>
    </main>
  );
}
