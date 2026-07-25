import Link from "next/link";

export default function PatchNotesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/aether-academy"
          className="mb-8 inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300"
        >
          ← Back to Aether Academy
        </Link>

        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
          Product Changelog
        </p>

        <h1 className="mt-2 text-5xl font-bold">
          Patch Notes
        </h1>

        <p className="mt-4 text-xl text-slate-300">
          Every improvement, documented.
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 p-10 shadow-xl shadow-black/20">
          <div className="space-y-6 text-slate-300 leading-8">
            <h2 className="text-3xl font-semibold text-white">
              Nothing to See Here... Yet.
            </h2>

            <p>
              Aether hasn't launched yet, which means there aren't any public
              releases to document.
            </p>

            <p>
              Once Version{" "}
              <span className="font-semibold text-white">1.0.0</span> is
              released, this page will become the official changelog for the
              platform. Every new feature, improvement, bug fix, security
              enhancement, and performance update will be documented here.
            </p>

            <p>
              We could have filled this page with placeholder release notes, but
              that wouldn't reflect how we build software. We'd rather wait
              until there's something real to share.
            </p>

            <p>
              When that day comes, this page will tell the story of Aether's
              evolution—one release at a time.
            </p>

            <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-6">
              <p className="text-lg font-semibold text-white">
                Current Public Version
              </p>

              <p className="mt-2 text-slate-300">
                Not Released
              </p>
            </div>

            <p className="pt-2 font-semibold text-white">
              Until then... we're still building.
            </p>

            <p className="font-semibold text-white">
              — Team Aether
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}