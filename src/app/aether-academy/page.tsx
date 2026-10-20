import Image from "next/image";
import Link from "next/link";

const academies = [
  { title: "Aether Political", description: "Campaign Operating System", href: "/aether-academy/political-academy", active: true },
  { title: "Aether Business", description: "Business Operating System", href: "/aether-academy/business-academy", active: true },
  { title: "Aether Social", description: "Learning resources coming soon", active: false },
  { title: "Aether Personal", description: "Learning resources coming soon", active: false },
] as const;

const resources = [
  { label: "Articles", href: "/aether-academy/articles" },
  { label: "Blog", href: "/aether-academy/blog" },
  { label: "Patch Notes", href: "/aether-academy/patch-notes" },
] as const;

export default function AetherAcademyPage() {
  return (
    <main className="relative isolate flex min-h-[100svh] flex-col overflow-x-hidden bg-[#07111f] text-white ">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_12%,rgba(109,45,198,0.25),transparent_48%),radial-gradient(ellipse_at_8%_75%,rgba(37,99,235,0.12),transparent_45%),linear-gradient(180deg,#10213a_0%,#07111f_75%)]" />

      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-8 lg:pt-6">
        <Link href="/" className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-center text-xs font-bold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20 sm:text-sm">Back to Ecosystem</Link>
        <nav aria-label="Application sign in" className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <Link href="/login" className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-center text-xs font-bold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20 sm:text-sm">Enter Political / Business</Link>
          <Link href="/login-social/employer-login" className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-center text-xs font-bold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20 sm:text-sm">Enter Employer Social</Link>
          <Link href="/login-social" className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-center text-xs font-bold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20 sm:text-sm">Enter Social</Link>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col px-5 pb-8 pt-2 sm:px-8 lg:pb-8 lg:pt-0">
        <section className="mb-4 text-center lg:mb-4">
          <Image src="/aether-logo-full.png" alt="Aether.os" width={300} height={110} priority className="mx-auto -mb-10 h-auto w-80 drop-shadow-[0_0_22px_rgba(139,92,246,0.35)] sm:-mb-16 sm:w-[28rem] lg:-mb-24 lg:w-[34rem]" />
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-violet-300 sm:text-xs">Official Learning Center</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-[3.25rem]">Aether Academy</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Learn. Explore. Expand your horizons.</p>
        </section>

        <section aria-label="Academy learning paths" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
          {academies.map((academy) => {
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold sm:text-xl">{academy.title}</h2>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">{academy.description}</p>
                </div>
                {!academy.active && <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Soon</span>}
              </>
            );
            const className = "flex min-h-16 items-center gap-3 rounded-2xl border px-5 py-3 text-left transition sm:min-h-18 lg:min-h-18 " + (academy.active ? "border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-blue-500/[0.07] hover:-translate-y-0.5 hover:border-violet-300/70 hover:bg-violet-500/20" : "border-white/10 bg-white/[0.025] text-slate-400");
            return academy.active ? (
              <Link key={academy.title} href={academy.href} className={className}>{content}</Link>
            ) : (
              <div key={academy.title} aria-disabled="true" className={className}>{content}</div>
            );
          })}
        </section>

        <section className="mt-5 border-t border-white/10 pt-4 text-center lg:mt-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-violet-300">General Resources</h2>
          <nav aria-label="General Academy resources" className="grid grid-cols-3 gap-2 sm:gap-4">
            {resources.map((resource) => (
              <Link key={resource.label} href={resource.href} className="rounded-xl border border-violet-400/30 bg-violet-400/[0.08] px-2 py-3 text-xs font-bold text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20 sm:text-sm">{resource.label}</Link>
            ))}
          </nav>
        </section>
      </div>
    </main>
  );
}
