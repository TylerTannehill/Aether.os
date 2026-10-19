import Link from 'next/link'
import { ArrowRight, BookOpen, BriefcaseBusiness, Megaphone, UserRound, ExternalLink } from 'lucide-react'

const utilities = [
  {
    title: 'Employer Access',
    description: 'Find talent, publish opportunities, and grow your team.',
    href: '/login-social/employer-login',
    action: 'Post jobs & sign in',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Advertise on Aether Social',
    description: 'Put your organization in front of the people who matter.',
    href: '/login-social/ad-purchasing',
    action: 'Explore advertising',
    icon: Megaphone,
  },
  {
    title: 'Aether Academy',
    description: 'Explore the guides and resources behind the Aether ecosystem.',
    href: '/aether-academy',
    action: 'Visit the academy',
    icon: BookOpen,
  },
]

export default function SocialPublicLandingPage() {
  return (
    <main className="relative isolate min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white lg:h-[100svh] lg:overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_13%_25%,rgba(112,47,203,0.35),transparent_43%),radial-gradient(ellipse_at_89%_85%,rgba(46,75,172,0.22),transparent_48%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1550px] flex-col px-5 py-5 sm:px-8 lg:h-full lg:px-10 lg:py-6">
        <header className="flex shrink-0 justify-end">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25" aria-label="Back to Aether landing page">
            Back to Aether
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-4 py-3 lg:min-h-0 lg:grid-cols-[1.07fr_0.93fr] lg:gap-6 lg:py-2">
          <section className="flex min-h-0 flex-col px-2 py-2 sm:px-4 lg:h-full lg:py-0">
            <div className="flex h-[42vh] min-h-[280px] shrink-0 items-center justify-center sm:h-[48vh] lg:h-auto lg:min-h-0 lg:flex-1 lg:-translate-y-5">
              <img src="/social-branding-transparent.png" alt="Aether Social branding" className="h-full w-full object-contain drop-shadow-[0_0_32px_rgba(139,92,246,0.22)]" />
            </div>
            <div className="mt-3 shrink-0 lg:mt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-300">Your network. Your opportunities. Your space.</p>
              <h1 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl xl:text-2xl">The people and opportunities that move you forward.</h1>
              <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm sm:leading-5">Aether Social is a place to build your professional presence, connect with people, and discover opportunities that fit where you want to go. Your experience starts with you—not an algorithm telling you who to be.</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300 sm:text-sm sm:leading-5">Keep your professional life moving, share what matters, and make room for real connections. Your personal side stays yours to share on your terms.</p>
              <Link href="/login-social" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-5 py-3 text-sm font-black shadow-lg shadow-violet-950/40 transition hover:brightness-110 sm:w-auto">
                <UserRound className="h-5 w-5" /> Individual Sign In / Sign Up
              </Link>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col justify-center gap-3 lg:h-full">
            <div className="px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-violet-300">The Aether Social ecosystem</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">More ways to connect.</h2>
              <p className="mt-1 text-xs text-slate-400">Find the right door for what you want to do.</p>
            </div>
            <div className="grid gap-2.5">
              {utilities.map(({ title, description, href, action, icon: Icon }) => (
                <Link key={href} href={href} className="group flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.055] p-4 shadow-xl backdrop-blur-lg transition hover:border-violet-400/55 hover:bg-violet-500/[0.12] sm:p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-300 sm:h-12 sm:w-12"><Icon className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black sm:text-lg">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-300 sm:text-sm">{description}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-violet-300">{action} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                  </span>
                  <ExternalLink className="hidden h-4 w-4 shrink-0 text-slate-500 sm:block" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
        <footer className="shrink-0 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Aether Systems LLC · Aether Social</footer>
      </div>
    </main>
  )
}
