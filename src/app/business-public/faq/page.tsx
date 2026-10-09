"use client";

import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";

const faqs = [
  ["What is Aether Business?", "Aether Business is an operating system that brings customer relationships, marketing, inventory, dispatch, finance, and day-to-day execution into one connected workspace. Instead of jumping between disconnected tools, teams can see their work and coordinate across departments."],
  ["Who is Aether Business built for?", "Aether Business is designed for small and midsize businesses that want to start with specific operational modules, as well as larger organizations that need a more tailored operating environment."],
  ["What makes Aether Business different?", "Aether is designed around how work moves between departments, not just how each department tracks its own tasks. The goal is to make operational pressure, ownership, and next steps easier to see."],
  ["What modules are available?", "The five business modules are CRM, Marketing, Inventory, Dispatch, and Finance. CRM helps manage customer relationships; Marketing connects activity to operational plans; Inventory tracks stock and related work; Dispatch coordinates jobs and assignments; and Finance helps teams keep an eye on financial activity."],
  ["What comes standard with Aether Business?", "Business Overview, Tools, and FAQ are included as standard. The departments you select determine which module-specific workflows are available to your organization."],
  ["Can we start with one module and add more?", "That is the idea behind the modular SMB offering. Start with the departments you need and discuss adding more as your business grows."],
  ["How much does Aether Business cost?", "For the SMB modular offering, each selected module is $500 per month. Business Overview, Tools, and FAQ are included as standard. Enterprise pricing is custom and based on your organization’s requirements."],
  ["How does Enterprise pricing work?", "Team Aether reviews factors such as headcount, team structure, departments, workflows, data volume, integration requirements, and operational complexity before preparing a tailored monthly quote."],
  ["What is A.B.E.?", "A.B.E. is Aether Business’s operational intelligence layer. It interprets information from enabled departments to surface meaningful signals, identify where attention may be needed, and help teams focus on their next steps."],
  ["Is A.B.E. artificial intelligence?", "No. Business A.B.E. uses deterministic operational rules applied to relevant business records. It is not a generative AI chatbot, and its observations are based on the departments and data available to the organization."],
  ["Does A.B.E. make decisions for our business?", "No. A.B.E. provides operational observations and recommended areas of focus. Your team remains responsible for reviewing information and deciding what to do."],
  ["Does A.B.E. see departments we have not enabled?", "A.B.E. is designed to respect your organization’s enabled modules. Its operational picture is based on the business data and departments available within your configuration."],
  ["Can Aether Business replace our current CRM?", "The CRM module is designed to bring customer information and related follow-up work into the broader operating system. Whether it replaces an existing CRM depends on the workflows and integrations your organization needs."],
  ["Can Aether Business connect with other tools?", "Aether Business includes a Tools area for supported integrations. Available connections and the scope of data they support should be reviewed with Team Aether for your specific use case."],
  ["Is Aether Business the same as Aether Political?", "They share the Aether philosophy of clarity, focus, and execution, but they are distinct products. Aether Business is organized around business departments and operational workflows rather than campaign operations."],
  ["Can I request a demonstration?", "Absolutely. Tell us a little about your organization and what you want to accomplish. Team Aether can walk through the business experience, discuss modules or enterprise needs, and answer your questions."],
];

export default function BusinessPublicFAQPage() {
  return (
    <main className="min-h-screen bg-[#07111F] text-white">
      <div className="mx-auto max-w-5xl px-6 py-20 lg:py-12">
        <Link
          href="/business-public"
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10 lg:mb-6 lg:gap-1.5 lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-xs"
        >
          <span>←</span>
          <span>Back to Landing Page</span>
        </Link>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs">
            <HelpCircle className="h-4 w-4 lg:h-3.5 lg:w-3.5"/> Frequently Asked Questions
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tight lg:mt-6 lg:text-5xl">Everything you need to know before requesting a demo.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 lg:mt-4 lg:text-base lg:leading-7">
            Aether Business is designed to bring everyday operations into one connected workspace.
            Here are the essentials about modules, pricing, A.B.E., and getting started.
          </p>
        </div>

        <div className="mt-20 space-y-8 lg:mt-12 lg:space-y-5">
          {faqs.map(([q,a])=>(
            <section key={q} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl lg:rounded-2xl lg:p-5">
              <h2 className="text-2xl font-bold text-white lg:text-xl">{q}</h2>
              <p className="mt-5 text-base leading-8 text-slate-300 lg:mt-3 lg:text-sm lg:leading-6">{a}</p>
            </section>
          ))}
        </div>

        <section className="mt-20 rounded-[2rem] border border-violet-400/20 bg-violet-500/5 p-12 text-center lg:mt-12 lg:rounded-2xl lg:p-8">
          <h2 className="text-4xl font-bold lg:text-3xl">Still Have Questions?</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 lg:mt-4 lg:text-base lg:leading-7">
            Every business operates differently. If your question isn't answered here, we'd be happy to walk through Aether Business, learn about your workflows, and discuss the right fit for your organization.
          </p>
          <Link
            href="/business-public/explore-abe"
            className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 font-black uppercase tracking-[0.08em] shadow-2xl transition hover:from-violet-400 hover:to-violet-700 lg:mt-6 lg:gap-2 lg:rounded-xl lg:px-6 lg:py-3.5 lg:text-sm"
          >
            Request a Demo <ArrowRight className="h-5 w-5 lg:h-4 lg:w-4"/>
          </Link>
        </section>
      </div>
    </main>
  );
}
