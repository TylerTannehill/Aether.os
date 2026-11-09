import Link from 'next/link'
import { Brain, Compass, Network, Target, UserRound } from 'lucide-react'

const highlights = [
  {
    title: 'Find your focus',
    description: 'Keep your goals, everyday priorities, and bigger ambitions together in a space built around you.',
    icon: Target,
  },
  {
    title: 'Think things through',
    description: 'Explore ideas, work through decisions, and find clarity through conversations with AI.',
    icon: Brain,
  },
  {
    title: 'Move forward your way',
    description: 'Turn what matters to you into practical next steps, without someone else deciding your direction.',
    icon: Compass,
  },
  {
    title: 'Clarity through connection',
    description: 'Bring the context that matters to you together across Aether Business, Political, and Social—helping you see more of your world in one place.',
    icon: Network,
  },
]

export default function PersonalPublicLandingPage() {
  return (
    <main className="relative isolate min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white lg:h-[100svh] lg:overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_13%_25%,rgba(63,98,235,0.22),transparent_43%),radial-gradient(ellipse_at_87%_80%,rgba(174,42,204,0.18),transparent_48%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1550px] flex-col px-5 py-5 sm:px-8 lg:h-full lg:px-10 lg:py-4">
        <header className="flex shrink-0 justify-end">
          <Link href="/" className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25">
            Back to Aether
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-6 py-3 lg:min-h-0 lg:grid-cols-[1.07fr_0.93fr] lg:gap-7 lg:py-2">
          <section className="flex min-h-0 flex-col px-2 sm:px-4 lg:h-full">
            <div className="flex h-[32vh] min-h-[220px] items-center justify-center sm:h-[38vh] lg:h-auto lg:min-h-0 lg:flex-1">
              <img src="/aether-personal-logo.png" alt="Aether Personal — Clarity. Focus. Understanding." className="h-full w-full object-contain drop-shadow-[0_0_32px_rgba(139,92,246,0.22)]" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-300">Your life. Your goals. Your direction.</p>
              <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">A little more clarity for whatever comes next.</h1>
              <p className="mt-2 text-sm leading-5 text-slate-300">Life doesn’t come with an instruction manual. Aether Personal gives you a place to organize what matters, talk through what’s on your mind, and make progress toward the life you want to build.</p>
              <p className="mt-2 text-sm leading-5 text-slate-300">Whether you’re planning your next big move or simply figuring out tomorrow, start where you are. Your direction is yours to choose.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href="/login-personal" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-5 py-3 text-sm font-black shadow-lg shadow-violet-950/40 transition hover:brightness-110">
                  <UserRound className="h-5 w-5" /> Enter Personal
                </Link>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col justify-center gap-2 lg:h-full">
            <div className="px-1">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-300">Made for real life</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">A space that starts with you.</h2>
            </div>
            <div className="grid gap-2">
              {highlights.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.055] p-3.5 shadow-xl backdrop-blur-lg">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black sm:text-lg">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-300">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <footer className="shrink-0 py-1 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Aether Systems LLC · Aether Personal</footer>
      </div>
    </main>
  )
}
