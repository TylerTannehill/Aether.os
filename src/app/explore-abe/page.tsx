import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";

export default function ExploreAbePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Landing Page
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
            <div className="p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles className="h-4 w-4" />
                Explore Abe
              </div>

              <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-tight text-white lg:text-6xl">
                Request a demo of Aether Political.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 lg:text-lg">
                Demo scheduling is currently being finalized. Leave your
                information here for now, and we&apos;ll use this page as the
                holding point for campaign teams interested in seeing Aether in
                action.
              </p>

              <div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5 text-amber-100">
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                  Coming Soon
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-50/90">
                  The live demo request flow will be connected once the Aether
                  Systems email and scheduling setup are ready.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Demo Interest</p>
                    <p className="text-sm text-slate-500">
                      Temporary contact placeholder
                    </p>
                  </div>
                </div>

                <form className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Name
                    </label>
                    <input
                      disabled
                      placeholder="Coming soon"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Email
                    </label>
                    <input
                      disabled
                      placeholder="Email capture coming soon"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Campaign / Organization
                    </label>
                    <input
                      disabled
                      placeholder="Coming soon"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Message
                    </label>
                    <textarea
                      disabled
                      placeholder="Tell us what you're trying to run."
                      rows={4}
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white opacity-70"
                  >
                    Demo Requests Coming Soon
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
