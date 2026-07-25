import Link from "next/link";

export default function ArticlesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/aether-academy"
          className="mb-8 inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300"
        >
          ← Back to Aether Academy
        </Link>

        <h1 className="text-4xl font-bold">Articles</h1>
        <p className="mt-3 text-lg text-slate-300">
          Public articles about Aether.
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 p-8 shadow-xl shadow-black/20">
          <p className="text-slate-300 leading-7">
            As Aether grows, we'll publish articles covering major milestones,
            product announcements, customer stories, development insights, and
            other updates worth sharing.
          </p>

          <p className="mt-6 text-slate-300 leading-7">
            Today, there simply isn't anything we'd consider article-worthy—and
            we're okay with that.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Why isn't there anything here?</h2>

          <p className="mt-4 text-slate-300 leading-7">
            We're still building.
          </p>

          <p className="mt-4 text-slate-300 leading-7">
            Rather than publishing content simply to have a blog, we'd rather
            wait until we have something genuinely useful or interesting to
            share.
          </p>

          <p className="mt-4 text-slate-300 leading-7">
            When the time comes, this is where you'll find articles about:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-300">
            <li>Major platform updates</li>
            <li>New feature announcements</li>
            <li>Customer stories and campaign successes</li>
            <li>Development insights from Team Aether</li>
            <li>Industry observations</li>
            <li>Behind-the-scenes looks at how Aether is evolving</li>
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-[#10233e]/75 p-8 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-semibold">Quality over quantity.</h2>

          <p className="mt-4 text-slate-300 leading-7">
            We don't believe every software company needs to publish an article
            every week.
          </p>

          <p className="mt-4 text-slate-300 leading-7">
            When we have something meaningful to say, we'll say it.
          </p>

          <p className="mt-4 text-slate-300 leading-7">
            Until then, we'd rather spend our time building Aether than writing
            about it.
          </p>
        </section>
      </div>
    </main>
  );
}
