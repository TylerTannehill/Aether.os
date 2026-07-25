import Link from "next/link";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/aether-academy"
          className="mb-8 inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300"
        >
          ← Back to Aether Academy
        </Link>

        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">July 2026</p>
        <h1 className="mt-2 text-5xl font-bold">30 Days Until Launch</h1>
        <p className="mt-4 text-xl text-slate-300">
          Thirty days from now, if everything goes according to plan, Aether will officially launch.
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 p-10 shadow-xl shadow-black/20">
          <div className="space-y-6 text-slate-300 leading-8">
            <p>That's exciting.</p>

            <p>It's also a little surreal.</p>

            <p>
              For a long time, Aether has been little more than conversations,
              notebooks, whiteboards, late nights, redesigns, and the occasional
              moment where we stared at the screen wondering if we'd finally broken
              everything.
            </p>

            <p>
              Some features have been rewritten multiple times. Entire pages have
              disappeared overnight because there was a better way to build them.
              Ideas we thought were brilliant turned out to be unnecessary. Others
              started as tiny quality-of-life improvements and quietly became some
              of our favorite parts of the platform.
            </p>

            <p>
              That process has never really been about chasing features. It's been
              about trying to make campaigns just a little easier to run.
            </p>

            <h2 className="pt-6 text-3xl font-semibold text-white">What Happens Next?</h2>

            <p>
              The next thirty days won't be spent adding dozens of new features.
              Instead, they'll be spent polishing what's already here: fixing rough
              edges, improving documentation, recording training videos, testing
              workflows, and making sure the experience is something we're proud to
              hand to a real campaign on Day One.
            </p>

            <p>
              There will still be bugs. There will still be things we want to
              improve. Software is never truly finished—but we want version one to
              feel stable, thoughtful, and honest.
            </p>

            <h2 className="pt-6 text-3xl font-semibold text-white">Building in Public</h2>

            <p>
              One decision we've made is to avoid pretending we're bigger than we
              are. There isn't a massive engineering department behind Aether.
              There isn't a marketing agency writing these posts. It's just Team
              Aether.
            </p>

            <p>
              If something is worth sharing, we'll write about it. If it isn't,
              we'll keep building instead.
            </p>

            <h2 className="pt-6 text-3xl font-semibold text-white">Thank You</h2>

            <p>
              Whether you're reading this because you're curious, considering
              Aether for your campaign, or simply stumbled across the Academy
              while exploring the site—thank you.
            </p>

            <p>
              Every visit reminds us that someone out there believes this idea is
              worth a few minutes of their time. We don't take that for granted.
            </p>

            <p>Thirty days from now we'll officially open the doors.</p>

            <p>Until then... we'll keep building.</p>

            <p className="font-semibold text-white">— Team Aether</p>
          </div>
        </section>

      </div>
    </main>
  );
}
