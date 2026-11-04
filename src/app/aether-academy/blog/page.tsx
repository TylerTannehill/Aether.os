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
            ← Back to Aether Academy
          </Link>
        </div>

        <details className="group mt-10 rounded-2xl border border-white/10 bg-[#10233e]/75 shadow-xl shadow-black/20 lg:mt-7 lg:rounded-xl">
          <summary className="cursor-pointer list-none px-10 py-7 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden lg:px-7 lg:py-5 lg:text-base">
            <span className="flex items-center justify-between gap-4 lg:gap-3">
              <span>November 1st 2026 - Note from Team Aether</span>
              <span aria-hidden="true" className="text-violet-300 transition group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="border-t border-white/10 px-10 pb-10 pt-8 lg:px-7 lg:pb-7 lg:pt-6">
            <div className="space-y-6 text-slate-300 leading-8 lg:space-y-4 lg:text-sm lg:leading-6">
              <h1 className="text-5xl font-bold text-white lg:text-4xl">Two Months In (Welcome to the Circus)</h1>
              <p>Two months ago, Aether launched as a political campaign operating system.</p>
              <p>Thirty days later, we wrote about the challenges of building a company around a product, learning how to market something from scratch, and discovering that getting people to notice your work can be considerably harder than building it in the first place.</p>
              <p>We ended that article wondering what October might bring.</p>
              <p>Well.</p>
              <p>Apparently, October brought an entire circus.</p>
              <p>And somewhere along the way, we decided to build a few more tents.</p>
              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">One Idea, Several New Directions</h2>
              <p>When we launched Aether Political in September, our mission was straightforward: make campaign operations simpler, more organized, and more effective.</p>
              <p>That mission hasn't changed.</p>
              <p>What changed was our understanding of where the underlying technology could go.</p>
              <p>Early in October, we began building Aether Business, taking many of the principles behind our political platform and applying them to the everyday challenges of running a business.</p>
              <p>Customer relationships, inventory, dispatch, marketing, finance, and the countless moving pieces that business owners and their teams manage every day. Different industries, different workflows, but a familiar problem: too much information scattered across too many places.</p>
              <p>We saw an opportunity to bring some clarity to that chaos.</p>
              <p>And so, Aether Business became real.</p>
              <p>Then, because apparently we hadn't given ourselves enough to do, we started building Aether Social.</p>
              <p>Social represents a different side of the ecosystem. Rather than helping organizations manage operations, it's about helping people connect, share, and build relationships through personal and professional networks.</p>
              <p>Two very different products, built during the same thirty-day stretch, both connected by the same underlying philosophy.</p>
              <p>Technology should make life easier.</p>
              <p>Not more complicated.</p>
              <p>And somewhere between building these new platforms, improving Aether Political, expanding Aether Academy, and keeping everything running, we started to realize something.</p>
              <p className="text-xl font-semibold text-white lg:text-lg">Aether was becoming considerably bigger than the product we originally set out to build.</p>
              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">The Second Thirty Days</h2>
              <p>Here's something October taught us.</p>
              <p>Marketing does not magically get easier after your first month.</p>
              <p>We checked.</p>
              <p>In September, we were learning how to introduce one product to the world.</p>
              <p>In October, we found ourselves with several different audiences, several different conversations to start, and several different reasons someone might want to explore what we’re building.</p>
              <p>On paper, that sounds like an improvement.</p>
              <p>And in many ways, it is.</p>
              <p>Aether Business opens the door to an entirely different market. Aether Social gives us another way to introduce people to the ecosystem. Aether Political continues to serve the mission that started all of this.</p>
              <p>We've created more opportunities for the company to grow and, eventually, generate revenue.</p>
              <p>But opportunity and execution are two different things.</p>
              <p>Building a product doesn't automatically create an audience for it. Opening another market doesn't mean customers suddenly appear. And having more things to talk about doesn't necessarily make it easier to figure out what to say, who to say it to, or how to get their attention.</p>
              <p>If anything, October reminded us that growth requires more than simply creating something worth using.</p>
              <p>It requires consistency.</p>
              <p>It requires patience.</p>
              <p>And it requires the discipline to spend time building the company, not just building the software.</p>
              <p>We're still learning that balance.</p>
              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Building the Ecosystem</h2>
              <p>While Political, Business, and Social were taking shape, another part of Aether was evolving alongside them.</p>
              <p className="text-xl font-semibold text-white lg:text-lg">Aether Academy.</p>
              <p>What began as a place to help people understand our political platform is growing into a broader educational resource for the entire ecosystem.</p>
              <p>Training materials, documentation, articles, updates, and resources intended to help people understand not only how to use Aether, but why we've designed it the way we have.</p>
              <p>We don't want someone to need a technical background to understand our products.</p>
              <p>We don't want a business owner to feel overwhelmed by software that's supposed to make their work easier.</p>
              <p>And we certainly don't want campaign staff spending more time learning their tools than using them.</p>
              <p>As the ecosystem grows, Academy will grow with it.</p>
              <p>Because building software is only part of the job.</p>
              <p>Helping people feel comfortable using it matters just as much.</p>
              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">What's on the Horizon?</h2>
              <p>If September was about launching and October was about expanding, November needs to be about something equally important.</p>
              <p className="text-xl font-semibold text-white lg:text-lg">Getting organized about how we grow.</p>
              <p>We're working toward a more consistent, deliberate marketing approach across Aether Political and Aether Business.</p>
              <p>Different audiences need different conversations. Campaign teams and business owners face different challenges, even when the philosophy behind our solutions is similar.</p>
              <p>We want to do a better job of reaching both.</p>
              <p>We also want to introduce more people to Aether Social, explain what makes it different, and begin building the community that will ultimately give the platform its purpose.</p>
              <p>And we're not finished expanding.</p>
              <p>Aether Personal is in development, bringing the ideas behind the ecosystem closer to the individual.</p>
              <p>We've spent months thinking about how technology can help organizations make sense of information, coordinate activity, and focus on what matters.</p>
              <p>Personal asks what happens when we begin applying that same thinking to everyday life.</p>
              <p>There's plenty more to share about that as development continues.</p>
              <p>And because apparently three people building an entire software ecosystem still isn't quite enough excitement...</p>
              <p className="text-xl font-semibold text-white lg:text-lg">There's one more surprise coming to Aether.</p>
              <p>We're keeping that one to ourselves for now.</p>
              <p>But it represents another piece of the larger vision we've been working toward, and we're looking forward to sharing it when the time is right.</p>
              <h2 className="pt-6 text-3xl font-semibold text-white lg:pt-4 lg:text-2xl">Two Months Down</h2>
              <p>Looking back, October was a strange month.</p>
              <p>We built more than we expected. We expanded into markets we hadn't originally planned to enter this quickly. We continued improving the product that started everything.</p>
              <p>We also discovered that having more opportunities doesn't automatically make the difficult parts of running a company any easier.</p>
              <p>There are still people we need to reach.</p>
              <p>Still lessons we need to learn.</p>
              <p>Still products we need to refine.</p>
              <p>But two months into this adventure, one thing has become increasingly clear.</p>
              <p>We're not simply building a campaign platform anymore.</p>
              <p className="text-xl font-semibold text-white lg:text-lg">We're building an ecosystem.</p>
              <p>One that we hope can make organizations more effective, help people connect, make knowledge more accessible, and eventually bring that same clarity into everyday life.</p>
              <p>It's ambitious.</p>
              <p>It's occasionally ridiculous.</p>
              <p>And we're still three people trying to figure out how to do all of it.</p>
              <p>But we're enjoying the ride.</p>
              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-400/10 to-transparent p-6 lg:rounded-xl lg:p-[18px]">
                <p className="text-2xl font-black text-white lg:text-xl">Welcome to the circus.</p>
                <p className="mt-3 text-xl font-semibold text-white lg:text-lg">Two months down.</p>
                <p className="mt-4 text-xl font-semibold text-white lg:mt-3 lg:text-lg">Clarity. Focus. Execution.</p>
              </div>
              <p className="font-semibold text-white">— Team Aether</p>
            </div>
          </div>
        </details>

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
