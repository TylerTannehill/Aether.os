import Link from "next/link";

const interviewUrl =
  "https://medium.com/@team_71369/an-interview-with-the-ceo-of-aether-systems-llc-036f42e70c6d";

export default function ArticlesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3 lg:mb-6">
          <Link
            href="/aether-academy"
            className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            ← Back to Aether Academy
          </Link>
        </div>

        <h1 className="text-4xl font-bold lg:text-3xl">Articles</h1>
        <p className="mt-3 text-lg text-slate-300 lg:mt-2 lg:text-base">
          Conversations, ideas, and stories from the Aether ecosystem.
        </p>

        <section className="mt-10 lg:mt-7">
          <h2 className="mb-5 text-2xl font-semibold lg:mb-4 lg:text-xl">
            Featured Article
          </h2>

          <article className="rounded-2xl border border-violet-400/25 bg-[#10233e]/75 p-8 shadow-xl shadow-black/20 lg:rounded-xl lg:p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-300">
              Founder Interview · Medium
            </p>
            <h3 className="mt-4 text-3xl font-bold leading-tight text-white lg:text-2xl">
              An Interview With the CEO of Aether Systems LLC
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              November 2026 · Tyler Tannehill, Founder &amp; CEO
            </p>
            <p className="mt-6 leading-8 text-slate-300 lg:mt-4 lg:text-sm lg:leading-6">
              What connects Aether Political, Business, Social, Academy, and the
              vision for Aether Personal? In a candid conversation about building
              software, navigating life, and the role of artificial intelligence,
              Aether&apos;s founder explores how an idea became an ecosystem.
            </p>
            <p className="mt-4 leading-8 text-slate-300 lg:text-sm lg:leading-6">
              And there&apos;s something unusual about the interviewer.
            </p>
            <a
              href={interviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-400/15 lg:mt-5 lg:px-5 lg:py-2.5 lg:text-sm"
            >
              Read the Interview on Medium ↗
            </a>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 p-8 shadow-xl shadow-black/20 lg:mt-7 lg:rounded-xl lg:p-6">
          <h2 className="text-2xl font-semibold lg:text-xl">More to Come</h2>
          <p className="mt-4 leading-8 text-slate-300 lg:mt-3 lg:text-sm lg:leading-6">
            As Aether grows, we&apos;ll share thoughtful articles about our
            products, development, the people behind the work, and the ideas
            shaping what comes next.
          </p>
          <p className="mt-4 leading-8 text-slate-300 lg:mt-3 lg:text-sm lg:leading-6">
            We believe in quality over quantity. When we have something
            meaningful to say, you&apos;ll find it here.
          </p>
        </section>
      </div>
    </main>
  );
}
