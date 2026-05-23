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
  Settings2,
  ShieldCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type IntegrationStatus =
  | "not_connected"
  | "ready_to_configure"
  | "needs_credentials"
  | "connected";

type IntegrationCard = {
  id: string;
  name: string;
  category: string;
  description: string;
  endpoint?: string;
  icon: any;
  status: IntegrationStatus;
  setupNote: string;
  credentialHint?: string;
  lastSync?: string;
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
    status: "ready_to_configure",
    setupNote:
      "Connection pathway staged. Add account credentials when the campaign social assets are ready.",
    credentialHint: "Meta Business / Ads account access",
  },
  {
    id: "x",
    name: "X",
    category: "Narrative / Digital",
    description:
      "Narrative pressure, reply velocity, engagement, and sentiment volatility.",
    endpoint: "/api/integrations/x/sync",
    icon: MessageSquareMore,
    status: "ready_to_configure",
    setupNote:
      "Connection pathway staged for narrative signal ingestion and future live account sync.",
    credentialHint: "X account/API access",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Momentum / Digital",
    description:
      "Organic momentum, creator reach, engagement spikes, and audience movement.",
    endpoint: "/api/integrations/tiktok/sync",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connection pathway staged for organic momentum and creator reach analytics.",
    credentialHint: "TikTok account/API access",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Narrative / Video",
    description:
      "Long-form message performance, watch behavior, and narrative durability.",
    endpoint: "/api/integrations/youtube/sync",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connection pathway staged for video performance and long-form message analytics.",
    credentialHint: "Google/YouTube channel access",
  },
  {
    id: "website",
    name: "Campaign Website",
    category: "Owned Infrastructure",
    description:
      "Website traffic, signup behavior, conversion activity, and owned momentum.",
    endpoint: "/api/integrations/website/sync",
    icon: Workflow,
    status: "ready_to_configure",
    setupNote:
      "Owned-channel pathway staged. This can receive website traffic and conversion data once the site is wired.",
    credentialHint: "Website analytics source",
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
    status: "ready_to_configure",
    setupNote:
      "Democratic fundraising connector staged. Add campaign credentials when available.",
    credentialHint: "ActBlue export/API access",
  },
  {
    id: "winred",
    name: "WinRed",
    category: "Fundraising / Finance",
    description:
      "Online donor ingestion, high-value donor detection, and finance follow-up routing.",
    endpoint: "/api/integrations/winred/sync",
    icon: Wallet,
    status: "ready_to_configure",
    setupNote:
      "Republican fundraising connector staged. Add campaign credentials when available.",
    credentialHint: "WinRed export/API access",
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
    status: "needs_credentials",
    setupNote:
      "Workspace connection staging active. OAuth activation is pending organizational Google Workspace setup.",
    credentialHint: "Google Workspace / Gmail OAuth",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Workspace Utility",
    description:
      "Campaign scheduling, operational timing, and event coordination.",
    icon: CalendarDays,
    status: "needs_credentials",
    setupNote:
      "Calendar pathway staged for scheduling and operational timing once Workspace access is ready.",
    credentialHint: "Google Calendar OAuth",
  },
  {
    id: "drive",
    name: "Google Drive",
    category: "Workspace Utility",
    description:
      "Shared campaign files, proofs, messaging docs, and operational assets.",
    icon: FolderKanban,
    status: "needs_credentials",
    setupNote:
      "Drive pathway staged for proofs, assets, and campaign documents once Workspace access is ready.",
    credentialHint: "Google Drive OAuth",
  },
];

function statusLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "needs_credentials":
      return "Needs Credentials";
    case "ready_to_configure":
      return "Ready to Configure";
    case "not_connected":
    default:
      return "Not Connected";
  }
}

function statusClasses(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "needs_credentials":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "ready_to_configure":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "not_connected":
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

function statusIcon(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return CheckCircle2;
    case "needs_credentials":
      return AlertCircle;
    case "ready_to_configure":
      return Settings2;
    case "not_connected":
    default:
      return PlugZap;
  }
}

function IntegrationSection({
  title,
  description,
  integrations,
  syncingId,
  syncResults,
  configuredIntegrations,
  onRunSync,
  onMarkConfigured,
}: {
  title: string;
  description: string;
  integrations: IntegrationCard[];
  syncingId: string | null;
  syncResults: Record<string, string>;
  configuredIntegrations: Record<string, boolean>;
  onRunSync: (integration: IntegrationCard) => void;
  onMarkConfigured: (integration: IntegrationCard) => void;
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
          const configured = Boolean(configuredIntegrations[integration.id]);
          const effectiveStatus: IntegrationStatus = configured
            ? "connected"
            : integration.status;
          const StatusIcon = statusIcon(effectiveStatus);

          return (
            <div
              key={integration.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                    effectiveStatus
                  )}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusLabel(effectiveStatus)}
                </span>
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

              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="text-sm leading-5 text-slate-600">
                    {configured
                      ? "Connector marked ready for this organization. Real credential refinement can happen when accounts are available."
                      : integration.setupNote}
                  </p>
                </div>

                {integration.credentialHint ? (
                  <div className="flex items-start gap-2">
                    <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p className="text-xs leading-5 text-slate-500">
                      Credential path: {integration.credentialHint}
                    </p>
                  </div>
                ) : null}

                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="text-xs leading-5 text-slate-500">
                    {result
                      ? "Last activity: just now"
                      : configured
                      ? "Last activity: staged connection"
                      : integration.lastSync || "Last activity: not synced yet"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => onMarkConfigured(integration)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <PlugZap className="h-4 w-4" />
                  {configured ? "Configured" : "Mark Ready"}
                </button>

                {integration.endpoint ? (
                  <button
                    onClick={() => onRunSync(integration)}
                    disabled={Boolean(syncingId)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
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
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                    OAuth activation pending organization setup.
                  </div>
                )}
              </div>

              {result ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{result}</span>
                </div>
              ) : null}
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
  const [configuredIntegrations, setConfiguredIntegrations] = useState<
    Record<string, boolean>
  >({});

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

      setConfiguredIntegrations((current) => ({
        ...current,
        [integration.id]: true,
      }));

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

  function markConfigured(integration: IntegrationCard) {
    setConfiguredIntegrations((current) => ({
      ...current,
      [integration.id]: !current[integration.id],
    }));

    setSyncResults((current) => ({
      ...current,
      [integration.id]: current[integration.id]
        ? current[integration.id]
        : `${integration.name} marked ready for credential connection.`,
    }));
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

  const totalVisibleIntegrations =
    DIGITAL_INTEGRATIONS.length +
    visibleFinanceIntegrations.length +
    UTILITY_INTEGRATIONS.length;

  const configuredCount = useMemo(() => {
    return Object.values(configuredIntegrations).filter(Boolean).length;
  }, [configuredIntegrations]);

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

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                {configuredCount} / {totalVisibleIntegrations} marked ready
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                Context: {contextMode}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                OAuth refinement pending credentials
              </span>
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
        configuredIntegrations={configuredIntegrations}
        onRunSync={runTestSync}
        onMarkConfigured={markConfigured}
      />

      <IntegrationSection
        title="Finance"
        description="Finance ingestion pathways powering donor routing, contribution enrichment, and future donor intelligence systems."
        integrations={visibleFinanceIntegrations}
        syncingId={syncingId}
        syncResults={syncResults}
        configuredIntegrations={configuredIntegrations}
        onRunSync={runTestSync}
        onMarkConfigured={markConfigured}
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
        configuredIntegrations={configuredIntegrations}
        onRunSync={runTestSync}
        onMarkConfigured={markConfigured}
      />

      <section className="hidden">
        <div>
          Hidden ambient infrastructure metrics preserved for future logic expansion.
        </div>
      </section>
    </div>
  );
}
