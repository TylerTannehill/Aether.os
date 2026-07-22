"use client";

import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";

const faqs = [
  ["What is Aether?","Aether is a campaign operating system that brings field, finance, outreach, digital, print, contacts, and campaign intelligence together in one platform. Instead of managing separate tools across every department, campaigns operate from one shared operational system designed around how campaigns actually work."],
  ["Who is Aether built for?","Aether is designed for political campaigns of every size—from local municipal races to statewide organizations. Whether your campaign has a handful of volunteers or a full professional staff, Aether scales to support your operation."],
  ["What makes Aether different?","Most campaign software focuses on one department. Aether focuses on how every department works together, helping campaign leadership understand operational pressure before it becomes operational failure."],
  ["What is Honest Abe?","Honest Abe is Aether's strategic intelligence layer. It analyzes activity across every department, identifies meaningful operational trends, and provides recommendations. Campaign leadership always remains in control."],
  ["Is Honest Abe AI?","Not exactly. Honest Abe is Aether's strategy engine, purpose-built to interpret the operational reality of political campaigns. Rather than generating strategy from scratch like a chatbot, Abe follows campaign-specific logic to identify operational pressure, competing priorities, execution risks, and opportunities for better coordination. Campaigns can tailor Abe's perspective based on where they are in the election cycle, and AI simply helps communicate those insights in a more natural way. In short: AI helps Abe explain. Aether tells Abe what matters."],
  ["Does Aether use AI to make campaign decisions?","No. Campaign decisions always belong to campaign leadership. Honest Abe provides observations and recommendations, but people remain responsible for every decision."],
  ["What departments does Aether support?","Finance, Field, Outreach, Digital, and Print—all operating from the same contacts, lists, dashboards, analytics, and operational intelligence."],
  ["Is campaign data shared between organizations?","No. Every campaign operates inside its own isolated organization. Campaign information is never shared with another campaign using Aether."],
  ["Who owns our campaign's data?","Your campaign. Always. Aether exists to organize campaign operations—not to own, sell, or monetize campaign data."],
  ["Does Aether process campaign donations?","No. Contributions continue through trusted fundraising platforms such as ActBlue and WinRed. Aether tracks contribution information after processing to support campaign operations."],
  ["Is Aether available on mobile?","Yes. Aether Mobile supports field operations and call time, allowing campaign staff and volunteers to work wherever campaign work happens."],
  ["How much does Aether cost?","Aether is available in three subscription tiers designed around campaign size and operational complexity. Current launch pricing is available on the home page."],
  ["Can Aether replace our current CRM?","In many cases, yes. Aether was designed as a campaign operating system rather than simply a contact database, allowing organizations to consolidate multiple workflows into one platform."],
  ["Can I schedule a demonstration?","Absolutely. We'd be happy to walk through the platform, answer your questions, and discuss whether Aether is the right fit for your campaign."]
];

export default function PublicFAQPage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
        >
          <span>←</span>
          <span>Back to Landing Page</span>
        </Link>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <HelpCircle className="h-4 w-4"/> Frequently Asked Questions
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tight lg:text-7xl">Everything you need to know before requesting a demo.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Aether was designed to simplify campaign operations—not make them more complicated.
            These are the questions we hear most often from campaign teams.
          </p>
        </div>

        <div className="mt-20 space-y-8">
          {faqs.map(([q,a])=>(
            <section key={q} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white">{q}</h2>
              <p className="mt-5 text-base leading-8 text-slate-300">{a}</p>
            </section>
          ))}
        </div>

        <section className="mt-20 rounded-[2rem] border border-violet-400/20 bg-violet-500/5 p-12 text-center">
          <h2 className="text-4xl font-bold">Still Have Questions?</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Every campaign operates differently. If your question isn't answered here, we'd be happy to show you how Aether works, discuss your campaign's goals, and determine whether it's the right fit for your organization.
          </p>
          <Link
            href="/explore-abe"
            className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 font-black uppercase tracking-[0.08em] shadow-2xl transition hover:from-violet-400 hover:to-violet-700"
          >
            Request a Demo <ArrowRight className="h-5 w-5"/>
          </Link>
        </section>
      </div>
    </main>
  );
}
