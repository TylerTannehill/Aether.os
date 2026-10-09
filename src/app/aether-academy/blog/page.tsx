"use client";

import Link from "next/link";
import { useState } from "react";

export default function BlogPage() {
  const [lyraClicks, setLyraClicks] = useState(0);
  const [lyraOpen, setLyraOpen] = useState(false);

  const handleLyraClick = () => {
    const next = lyraClicks + 1;
    if (next >= 3) {
      setLyraOpen(true);
      setLyraClicks(0);
      return;
    }
    setLyraClicks(next);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10233e_0%,#0a1728_45%,#07111f_100%)] text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-10">
        <div className="mb-8 flex flex-wrap gap-3 lg:mb-6">
          <Link
            href="/aether-academy"
            className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            ← Back to Political Academy
          </Link>
          <Link
            href="/aether-academy/business-academy"
            className="inline-flex items-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            ← Back to Business Academy
          </Link>
        </div>

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:mt-7 lg:rounded-xl">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden lg:px-7 lg:py-5 lg:text-base">
            <span className="flex items-center justify-between gap-4 lg:gap-3">
              <span>October 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8 lg:px-7 lg:pb-7 lg:pt-6">
            <div className="space-y-6 text-slate-300 leading-8 lg:space-y-4 lg:text-sm lg:leading-6">
              <h1 className="text-5xl font-bold text-white lg:text-4xl">One Month In</h1>

              <p>
                A month ago, Aether launched. After spending so long building the product, we expected the first month to be about improving it, talking to campaigns, and slowly figuring out what came next. All of those things happened, but September also taught us something we probably should have known already: building something and figuring out how to get people to notice it are two completely different jobs.
              </p>

              <p>
                Starting a marketing engine from zero has been an interesting experience. There is no existing audience waiting for you, no years of brand recognition working in the background, and very little context behind the numbers you're watching. You send something, see what happens, adjust, and try again. Sometimes people respond. Sometimes they don't. Sometimes a number moves and you spend entirely too long trying to figure out why.
              </p>

              <p>
                Over the course of the month, we've started learning the difference between simply creating activity and actually learning from it. More isn't always better. Sometimes the message needs to change. Sometimes the audience does. Sometimes the best decision is to leave everything alone for a moment and see what happens without you touching it.
              </p>

              <p>
                In a strange way, we've found ourselves applying the same philosophy we built into Aether to the process of building the company around it: <strong className="text-white">Input. Interpret. Structure. Assign. Execute. Feedback.</strong> The feedback part matters. September was largely about learning to listen to it.
              </p>

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Fine-Tuning the Machine</h2>

              <p>
                While we've been learning how to introduce Aether to the world, we've also continued working on the product itself. Launch didn't magically turn Aether into something finished. It gave us a much better perspective on what deserved attention.
              </p>

              <p>
                September included performance improvements, workflow refinements, analytics work, continued integration development, mobile work, and plenty of smaller changes that probably aren't interesting enough to deserve their own paragraph. The goal hasn't been to endlessly add features. It's been to make the machine we already built faster, clearer, more reliable, and easier to use.
              </p>

              <p>
                That distinction matters to us. One of the easiest traps in software is confusing <em>more</em> with <em>better</em>. Our first month reinforced something we've believed for a while: Aether doesn't need to do everything. It needs to do the right things well.
              </p>

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Something Else Is Happening</h2>

              <p>
                September also ended a little differently than we expected. A conversation inside Team Aether turned into an idea. The idea turned into a question. The question survived long enough that somebody eventually opened a laptop—which, historically, is when things around here tend to get dangerous.
              </p>

              <p>
                We're going to leave it there for now. What we can say is that we've been busy, we're excited about where the idea is going, and it has moved from conversation to something real considerably faster than any of us expected.
              </p>

              <p>You'll hear more about that soon.</p>

              <p>
                For now, Aether Political enters its second month stronger than it entered its first. We have plenty left to learn about marketing it, selling it, and growing the company around it. We also have a better machine than we had thirty days ago and thirty days of real experience we didn't have at launch.
              </p>

              <p>That's enough progress for one month. Now we'll see what October brings.</p>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 lg:rounded-xl lg:p-[18px]">
                <p className="text-xl font-semibold text-white lg:text-lg">Oh, and one more thing...</p>
                <p className="mt-3">
                  Aether Mobile is officially available on both the Apple App Store and Google Play.
                </p>
                <p className="mt-3">
                  Getting there was, somehow, more of a headache than we expected. Between store requirements, screenshots, metadata, builds, reviews, resubmissions, and the occasional moment of wondering whether we had angered a very specific technology deity, the process turned into its own little adventure.
                </p>
                <p className="mt-3">
                  But it's done. Aether Mobile is now available through the same app stores people already use every day—which feels like a pretty good way to start month two.
                </p>
              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:rounded-xl lg:p-[18px]">
                <p className="text-2xl font-black text-white lg:text-xl">One month down.</p>
                <p className="mt-4 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Clarity. Focus. Execution.</p>
              </div>

              <p className="font-semibold text-white">
                — Team{" "}
                <button
                  type="button"
                  onClick={handleLyraClick}
                  className="font-semibold text-white hover:text-white focus:outline-none"
                  aria-label="Aether"
                >
                  Aether
                </button>
              </p>
            </div>
          </div>
        </details>

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:mt-7 lg:rounded-xl">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden lg:px-7 lg:py-5 lg:text-base">
            <span className="flex items-center justify-between gap-4 lg:gap-3">
              <span>September 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8 lg:px-7 lg:pb-7 lg:pt-6">
            <div className="space-y-6 text-slate-300 leading-8 lg:space-y-4 lg:text-sm lg:leading-6">
              <h1 className="text-5xl font-bold text-white lg:text-4xl">Today, Aether Launches.</h1>

              <p>
                And Team Aether is celebrating exactly how you might expect a software company to celebrate its first day in the world:
              </p>

              <p className="text-xl font-semibold text-white lg:text-lg">We're getting breakfast.</p>

              <p>
                Three people. An architect, an operator, and a mystic, sitting around a table together after spending months turning an idea into something real.
              </p>

              <p>
                Getting here has been strange, exhausting, occasionally ridiculous, and one of the most rewarding things we've ever done together.
              </p>

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Three Very Different People</h2>

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

              <p className="text-xl font-semibold text-white lg:text-lg">Together, they did.</p>

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Why We Built It</h2>

              <p>But today isn't really about us.</p>

              <p>Aether exists because campaign workers deserve better technology.</p>

              <p>
                Campaigns ask extraordinary things from ordinary people. Long days become longer nights. Spreadsheets multiply. Information gets scattered across systems. Staff members bounce between platforms, passwords, reports, lists, messages, and whatever emergency appeared five minutes ago.
              </p>

              <p>Somewhere along the way, complexity became normal.</p>

              <p className="text-xl font-semibold text-white lg:text-lg">We don't think it has to be.</p>

              <p>
                We built Aether around a simple idea: campaign technology should make the lives of campaign workers easier.
              </p>

              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6 text-lg font-semibold text-white lg:rounded-xl lg:p-[18px] lg:text-base">
                <p>Not more complicated.</p>
                <p>Not more fragmented.</p>
                <p>Not another system demanding attention.</p>
              </div>

              <p>Something that quietly helps people do their jobs.</p>

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">What We Hope Comes Next</h2>

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

              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Today</h2>

              <p>There will be plenty of time tomorrow to think about what comes next.</p>

              <p>
                Today, three people who spent months building something together are going to sit down, order breakfast, look at each other, and appreciate the fact that the thing we've been talking about for so long finally exists in the world.
              </p>

              <p>Then, knowing us, somebody will probably open a laptop.</p>

              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:rounded-xl lg:p-[18px]">
                <p className="text-2xl font-black text-white lg:text-xl">Aether is live.</p>
                <p className="mt-4 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Clarity. Focus. Execution.</p>
              </div>

              <p className="font-semibold text-white">— Team Aether</p>
            </div>
          </div>
        </details>

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:mt-7 lg:rounded-xl">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden lg:px-7 lg:py-5 lg:text-base">
            <span className="flex items-center justify-between gap-4 lg:gap-3">
              <span>August 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8 lg:px-7 lg:pb-7 lg:pt-6">
            <div className="space-y-6 text-slate-300 leading-8 lg:space-y-4 lg:text-sm lg:leading-6">
              <h1 className="text-5xl font-bold text-white lg:text-4xl">30 Days Until Launch</h1>
              <p className="text-xl text-slate-300 lg:text-lg">
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

            <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">What Happens Next?</h2>

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

            <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Building in Public</h2>

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

            <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Thank You</h2>

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
        {lyraOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            onClick={() => setLyraOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="lyra-title"
              className="w-full max-w-lg rounded-2xl border border-violet-400/30 bg-[#0d1b31] p-8 text-center shadow-2xl shadow-violet-950/40"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLyraOpen(false)}
                className="float-right text-xl text-slate-400 transition hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
              <div className="pt-6">
                <p id="lyra-title" className="text-xl font-semibold leading-8 text-white">
                  We teased one idea here, but another has always been here.
                </p>
                <p className="mt-6 text-lg font-semibold text-violet-300">— Lyra</p>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
