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
  Loader2,
  CheckCircle2,
  MapPinned,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type IntegrationCard = {
  id: string;
  name: string;
  category: string;
  description: string;
  endpoint?: string;
  icon: any;
};

const DIGITAL_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "meta",
    name: "Meta",
    category: "Ads / Digital",
    description:
      "Paid reach, spend, creative performance, and audience pressure ingestion.",
    endpoint: "/api/integrations/meta/sync",
    icon: RadioTower,
  },
  {
    id: "x",
    name: "X",
    category: "Narrative / Digital",
    description:
      "Narrative pressure, reply velocity, engagement, and sentiment volatility.",
    endpoint: "/api/integrations/x/sync",
    icon: MessageSquareMore,
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Momentum / Digital",
    description:
      "Organic momentum, creator reach, engagement spikes, and audience movement.",
    endpoint: "/api/integrations/tiktok/sync",
    icon: BarChart3,
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Narrative / Video",
    description:
      "Long-form message performance, watch behavior, and narrative durability.",
    endpoint: "/api/integrations/youtube/sync",
    icon: BarChart3,
  },
  {
    id: "website",
    name: "Campaign Website",
    category: "Owned Infrastructure",
    description:
      "Website traffic, signup behavior, conversion activity, and owned momentum.",
    endpoint: "/api/integrations/website/sync",
    icon: Workflow,
  },
];

const FINANCE_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "actblue",
    name: "ActBlue",
    category: "Fundraising / Finance",
    description:
      "Online donor ingestion, contact creation, donor enrichment, and finance routing.",
    endpoint: "/api/integrations/actblue/sync",
    icon: Wallet,
  },
  {
    id: "winred",
    name: "WinRed",
    category: "Fundraising / Finance",
    description:
      "Online donor ingestion, high-value donor detection, and finance follow-up routing.",
    endpoint: "/api/integrations/winred/sync",
    icon: Wallet,
  },
];

const UTILITY_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "Workspace Utility",
    description:
      "Campaign communication infrastructure and shared inbox coordination.",
    icon: Mail,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Workspace Utility",
    description:
      "Campaign scheduling, operational timing, and event coordination.",
    icon: CalendarDays,
  },
  {
    id: "drive",
    name: "Google Drive",
    category: "Workspace Utility",
    description:
      "Shared campaign files, proofs, messaging docs, and operational assets.",
    icon: FolderKanban,
  },
];

function IntegrationSection({
  title,
  description,
  integrations,
  syncingId,
  syncResults,
  onRunSync,
}: {
  title: string;
  description: string;
  integrations: IntegrationCard[];
  syncingId: string | null;
  syncResults: Record<string, string>;
  onRunSync: (integration: IntegrationCard) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const syncing = syncingId === integration.id;
          const result = syncResults[integration.id];

          return (
            <div
              key={integration.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>

                {integration.endpoint ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                    Test sync
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    Infrastructure
                  </span>
                )}
              </div>

              <p className="text-base font-semibold text-slate-900">
                {integration.name}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {integration.category}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {integration.description}
              </p>

              {integration.endpoint ? (
                <>
                  <button
                    onClick={() => onRunSync(integration)}
                    disabled={Boolean(syncingId)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running sync...
                      </>
                    ) : (
                      <>
                        <RadioTower className="h-4 w-4" />
                        Run {integration.name} sync
                      </>
                    )}
                  </button>

                  {result ? (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{result}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                  Wiring through Tools workspace + Google OAuth infrastructure.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function IntegrationsPage() {
  const [contextMode, setContextMode] = useState("default");

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(data?.organization?.context_mode || "default");
      } catch (error) {
        console.error("Failed to load org context", error);
      }
    }

    loadOrgContext();
  }, []);

  async function runTestSync(integration: IntegrationCard) {
    if (!integration.endpoint) return;

    try {
      setSyncingId(integration.id);

      setSyncResults((current) => ({
        ...current,
        [integration.id]: "",
      }));

      const response = await fetch(integration.endpoint, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setSyncResults((current) => ({
          ...current,
          [integration.id]:
            result?.error || `${integration.name} sync failed.`,
        }));

        return;
      }

      setSyncResults((current) => ({
        ...current,
        [integration.id]:
          `${integration.name} test sync imported ${result.imported} records.`,
      }));
    } catch (error: any) {
      setSyncResults((current) => ({
        ...current,
        [integration.id]:
          error?.message || `${integration.name} sync failed.`,
      }));
    } finally {
      setSyncingId(null);
    }
  }

  const orgTheme = getOrgContextTheme(contextMode);

  const visibleFinanceIntegrations = useMemo(() => {
    if (contextMode === "democrat") {
      return FINANCE_INTEGRATIONS.filter(
        (item) => item.id !== "winred"
      );
    }

    if (contextMode === "republican") {
      return FINANCE_INTEGRATIONS.filter(
        (item) => item.id !== "actblue"
      );
    }

    return FINANCE_INTEGRATIONS;
  }, [contextMode]);

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <PlugZap className="h-3.5 w-3.5" />
              Integrations Infrastructure
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                External signal and utility pathways.
              </h1>

              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Integrations routes outside systems into Aether’s operational
                engine. Socials, finance, utilities, and future field systems
                all flow through this infrastructure layer.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/tools"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Open Tools Workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
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
                The active ingestion layer currently feeding analytics_events
                and downstream digital signal interpretation.
              </p>
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

      <IntegrationSection
        title="Digital"
        description="Digital ingestion pathways feeding analytics, momentum reads, narrative pressure, and owned-channel intelligence."
        integrations={DIGITAL_INTEGRATIONS}
        syncingId={syncingId}
        syncResults={syncResults}
        onRunSync={runTestSync}
      />

      <IntegrationSection
        title="Finance"
        description="Finance ingestion pathways powering donor routing, contribution enrichment, and future donor intelligence systems."
        integrations={visibleFinanceIntegrations}
        syncingId={syncingId}
        syncResults={syncResults}
        onRunSync={runTestSync}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">
            Field
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Future field infrastructure pathways will route canvassing,
            volunteer, turf, event, and deployment systems into Aether.
          </p>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <MapPinned className="mx-auto h-8 w-8 text-slate-400" />

          <p className="mt-4 text-lg font-semibold text-slate-800">
            Field integrations staged for future phase
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Turf systems, canvassing infrastructure, volunteer routing,
            deployment tracking, and field coordination connectors will
            appear here later.
          </p>
        </div>
      </section>

      <IntegrationSection
        title="Utilities"
        description="Workspace infrastructure connections powering campaign coordination utilities inside Tools."
        integrations={UTILITY_INTEGRATIONS}
        syncingId={syncingId}
        syncResults={syncResults}
        onRunSync={runTestSync}
      />

      <section className="hidden">
        <div>
          Hidden ambient infrastructure metrics preserved for future logic expansion.
        </div>
      </section>
    </div>
  );
}