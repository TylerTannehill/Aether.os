"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  PlugZap,
  RadioTower,
  Wallet,
  MessageSquareMore,
  Workflow,
  FolderKanban,
  CalendarDays,
  Mail,
  Clock3,
} from "lucide-react";

type ComingSoonIntegration = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
};

const COMING_SOON_INTEGRATIONS: ComingSoonIntegration[] = [
  {
    id: "actblue",
    name: "ActBlue",
    category: "Fundraising",
    description:
      "Future donor, pledge, contribution, and finance signal ingestion powering Finance, FEC matching, and Jackpot intelligence.",
    icon: Wallet,
  },
  {
    id: "meta",
    name: "Meta",
    category: "Ads / Digital",
    description:
      "Future paid reach, engagement, spend, creative performance, and audience pressure ingestion.",
    icon: RadioTower,
  },
  {
    id: "x",
    name: "X",
    category: "Narrative / Digital",
    description:
      "Future sentiment, narrative pressure, trending conversation, and active political battlefield monitoring.",
    icon: MessageSquareMore,
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Momentum / Digital",
    description:
      "Future creator momentum, organic reach, engagement, and viral campaign signal ingestion.",
    icon: BarChart3,
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Narrative / Video",
    description:
      "Future long-form narrative, video performance, watch behavior, and audience retention analytics.",
    icon: BarChart3,
  },
  {
    id: "campaign-domain",
    name: "Campaign Website",
    category: "Owned Infrastructure",
    description:
      "Future website traffic, conversions, signup flow, donation routing, and owned audience analytics.",
    icon: Workflow,
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Workspace",
    description:
      "Future lightweight communication threading, outreach coordination, and operational visibility.",
    icon: Mail,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Workspace",
    description:
      "Future event timing, campaign scheduling, and execution coordination context.",
    icon: CalendarDays,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "Workspace",
    description:
      "Future shared asset memory, campaign files, proofs, and operational document linking.",
    icon: FolderKanban,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <PlugZap className="h-3.5 w-3.5" />
              Integrations Hub
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Bring outside signals into Aether.
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                This hub separates real ingestion pathways from future direct platform connectors.
                Today, Analytics CSV Import is live. Native API integrations come later.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
            Real now: CSV analytics ingestion. Next: launch integrations that feed the same signal engine.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              <BarChart3 className="h-3.5 w-3.5" />
              Live Ingestion Pathway
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
                Analytics CSV Import
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900/80">
                Upload digital, platform, campaign, spend, engagement, or sentiment exports into the
                analytics signal engine. This feeds Digital first, then Dashboard, ABE, and cross-domain
                intelligence as we wire the downstream reads.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Destination
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  analytics_events
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Best First Use
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Digital metrics
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Ready to import
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/import/analytics"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Open Analytics Import
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Live pathways</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">1</p>
          <p className="mt-2 text-sm text-slate-600">Analytics CSV Import</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Launch targets</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {COMING_SOON_INTEGRATIONS.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Launch-ready integration targets
          </p>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-800">Integration model</p>
          <p className="mt-3 text-xl font-semibold text-blue-950">
            CSV first, APIs later
          </p>
          <p className="mt-2 text-sm text-blue-900/80">
            The backend path stays the same as connectors mature.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Launch Integration Targets</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              These connectors define the launch-ready stack
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              These are intentionally not fake-connected. They are staged as the focused launch set
              because each one ties directly to fundraising ROI, narrative visibility, operational coordination,
              or retained campaign usage.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Clock3 className="h-4 w-4" />
            Staged, not active
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COMING_SOON_INTEGRATIONS.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    Launch target
                  </span>
                </div>

                <p className="text-base font-semibold text-slate-900">
                  {item.name}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.category}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
