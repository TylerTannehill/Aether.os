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

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-4">
              <span>September 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8">
            <div className="space-y-6 text-slate-300 leading-8">
              <h1 className="text-5xl font-bold text-white">Today, Aether Launches.</h1>

              <p>
                And Team Aether is celebrating exactly how you might expect a software company to celebrate its first day in the world:
              </p>

              <p className="text-xl font-semibold text-white">We're getting breakfast.</p>

              <p>
                Three people. An architect, an operator, and a mystic, sitting around a table together after spending months turning an idea into something real.
              </p>

              <p>
                Getting here has been strange, exhausting, occasionally ridiculous, and one of the most rewarding things we've ever done together.
              </p>

              <h2 className="pt-6 text-3xl font-semibold text-white">Three Very Different People</h2>

              <p>
                Aether has always been the product of three very different ways of looking at a problem.
              </p>

              <p>
                <strong className="text-white">The Architect</strong> spent more than a few days disappearing into coding sprints that lasted somewhere between 12 and 32 hours—building, breaking, rebuilding, testing, deploying, staring at errors, occasionally questioning every decision that led to that particular moment, and then opening the laptop again.
              </p>

              <p>
                <strong className="text-white">The Mystic</strong> brought the creative insanity.
              </p>

              <p>
                Ideas became designs. Problems became possibilities. Conversations that probably sounded completely unreasonable at first somehow became features, workflows, language, and pieces of Aether's identity.
              </p>

              <p>
                And <strong className="text-white">the Operator</strong> helped make sure all of that chaos actually went somewhere.
              </p>

              <p>
                When ideas collided with reality, when decisions needed to be made, when paperwork, operations, logistics, or the thousand little headaches involved in building something from scratch threatened to pull attention away from the mission, the Operator helped keep the train on the tracks.
              </p>

              <p>
                None of those three approaches could have built Aether alone.
              </p>

              <p className="text-xl font-semibold text-white">Together, they did.</p>

              <h2 className="pt-6 text-3xl font-semibold text-white">Why We Built It</h2>

              <p>But today isn't really about us.</p>

              <p>Aether exists because campaign workers deserve better technology.</p>

              <p>
                Campaigns ask extraordinary things from ordinary people. Long days become longer nights. Spreadsheets multiply. Information gets scattered across systems. Staff members bounce between platforms, passwords, reports, lists, messages, and whatever emergency appeared five minutes ago.
              </p>

              <p>Somewhere along the way, complexity became normal.</p>

              <p className="text-xl font-semibold text-white">We don't think it has to be.</p>

              <p>
                We built Aether around a simple idea: campaign technology should make the lives of campaign workers easier.
              </p>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 text-lg font-semibold text-white">
                <p>Not more complicated.</p>
                <p>Not more fragmented.</p>
                <p>Not another system demanding attention.</p>
              </div>

              <p>Something that quietly helps people do their jobs.</p>

              <h2 className="pt-6 text-3xl font-semibold text-white">What We Hope Comes Next</h2>

              <p>We don't know what Aether becomes from here.</p>

              <p>Today is version one.</p>

              <p>
                There will be things we improve. Things campaigns teach us. Ideas we haven't had yet. Problems we haven't encountered yet.
              </p>

              <p>That's exciting.</p>

              <p>
                Because our hope for Aether has never simply been to build another successful piece of political software.
              </p>

              <p>
                We hope it helps change what campaign workers expect from their technology.
              </p>

              <p>We hope simpler systems mean fewer hours fighting spreadsheets.</p>

              <p>We hope better information means fewer frantic conversations trying to figure out what happened.</p>

              <p>
                We hope better coordination gives campaign teams a little more time to focus on the people and communities they're actually trying to serve.
              </p>

              <p>And maybe, eventually, the standard changes.</p>

              <p>Maybe campaign technology becomes simpler.</p>

              <p>Maybe the people working behind the campaign get tools designed with their lives in mind.</p>

              <p>Maybe we can contribute a small piece to that brighter future.</p>

              <h2 className="pt-6 text-3xl font-semibold text-white">Today</h2>

              <p>There will be plenty of time tomorrow to think about what comes next.</p>

              <p>
                Today, three people who spent months building something together are going to sit down, order breakfast, look at each other, and appreciate the fact that the thing we've been talking about for so long finally exists in the world.
              </p>

              <p>Then, knowing us, somebody will probably open a laptop.</p>

              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6">
                <p className="text-2xl font-black text-white">Aether is live.</p>
                <p className="mt-4 text-xl font-semibold text-white">Clarity. Focus. Execution.</p>
              </div>

              <p className="font-semibold text-white">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-4">
              <span>August 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8">
            <div className="space-y-6 text-slate-300 leading-8">
              <h1 className="text-5xl font-bold text-white">30 Days Until Launch</h1>
              <p className="text-xl text-slate-300">
                Thirty days from now, if everything goes according to plan, Aether will officially launch.
              </p>
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
          </div>
        </details>

      </div>
    </main>
  );
}
