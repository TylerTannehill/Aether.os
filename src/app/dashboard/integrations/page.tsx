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
  Clock3,
  AlertCircle,
  X,
  ShieldCheck,
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
  logoText: string;
  logoSubtext?: string;
};

type AetherTier = "t1" | "t2" | "t3";

type CredentialState = {
  accountName: string;
  accessToken: string;
  accountId: string;
};

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";

  return "t3";
}

function canShowToolsWorkspaceLink(tier: AetherTier) {
  return tier === "t3";
}

const CARD_STYLE =
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md";

const DIGITAL_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "meta",
    name: "Meta",
    category: "Digital Team",
    description:
      "Track ads, reach, engagement, and campaign momentum from Meta.",
    endpoint: "/api/integrations/meta/sync",
    icon: RadioTower,
    status: "ready_to_configure",
    setupNote:
      "Connect Meta to bring ad performance and audience activity into Aether.",
    credentialHint: "Meta Business account",
    logoText: "∞",
    logoSubtext: "Meta",
  },
  {
    id: "x",
    name: "X",
    category: "Digital Team",
    description:
      "Monitor engagement, replies, and narrative movement from X.",
    endpoint: "/api/integrations/x/sync",
    icon: MessageSquareMore,
    status: "ready_to_configure",
    setupNote:
      "Connect X so your digital team can follow message movement and engagement.",
    credentialHint: "X account login",
    logoText: "𝕏",
    logoSubtext: "X",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Digital Team",
    description:
      "Bring TikTok performance and audience momentum into Aether.",
    endpoint: "/api/integrations/tiktok/sync",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connect TikTok to help the campaign understand short-form content momentum.",
    credentialHint: "TikTok account login",
    logoText: "♪",
    logoSubtext: "TikTok",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Digital Team",
    description:
      "Track video performance, watch activity, and long-form messaging.",
    endpoint: "/api/integrations/youtube/sync",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connect YouTube to bring campaign video performance into Aether.",
    credentialHint: "YouTube channel login",
    logoText: "▶",
    logoSubtext: "YouTube",
  },
  {
    id: "website",
    name: "Campaign Website",
    category: "Digital Team",
    description:
      "Monitor website traffic, signups, and supporter activity.",
    endpoint: "/api/integrations/website/sync",
    icon: Workflow,
    status: "ready_to_configure",
    setupNote:
      "Connect your campaign website to follow supporter activity and conversions.",
    credentialHint: "Website analytics access",
    logoText: "◎",
    logoSubtext: "Site",
  },
];

const FINANCE_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "actblue",
    name: "ActBlue",
    category: "Finance Team",
    description:
      "Bring donor activity and fundraising performance into Aether.",
    endpoint: "/api/integrations/actblue/sync",
    icon: Wallet,
    status: "ready_to_configure",
    setupNote:
      "Connect ActBlue so finance can follow online donations and donor movement.",
    credentialHint: "ActBlue account access",
    logoText: "AB",
    logoSubtext: "ActBlue",
  },
  {
    id: "winred",
    name: "WinRed",
    category: "Finance Team",
    description:
      "Track online fundraising activity and donor momentum.",
    endpoint: "/api/integrations/winred/sync",
    icon: Wallet,
    status: "ready_to_configure",
    setupNote:
      "Connect WinRed so finance can follow online donations and donor movement.",
    credentialHint: "WinRed account access",
    logoText: "WR",
    logoSubtext: "WinRed",
  },
];

const UTILITY_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "Campaign Operations",
    description:
      "Connect campaign email and shared inbox communication.",
    icon: Mail,
    status: "needs_credentials",
    setupNote:
      "Connect Gmail so campaign communication can work inside Aether.",
    credentialHint: "Google account login",
    logoText: "M",
    logoSubtext: "Gmail",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Campaign Operations",
    description:
      "Coordinate campaign schedules, meetings, and events.",
    icon: CalendarDays,
    status: "needs_credentials",
    setupNote:
      "Connect Calendar so the campaign schedule supports operations.",
    credentialHint: "Google account login",
    logoText: "31",
    logoSubtext: "Calendar",
  },
  {
    id: "drive",
    name: "Google Drive",
    category: "Campaign Operations",
    description:
      "Access campaign files, messaging docs, and shared assets.",
    icon: FolderKanban,
    status: "needs_credentials",
    setupNote:
      "Connect Drive so campaign files are easier to use inside Aether.",
    credentialHint: "Google account login",
    logoText: "△",
    logoSubtext: "Drive",
  },
];

function statusLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "needs_credentials":
      return "Needs Login";
    case "ready_to_configure":
      return "Ready";
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

function BrandLogo({ integration }: { integration: IntegrationCard }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-black tracking-tight text-slate-950 shadow-sm">
        {integration.logoText}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {integration.logoSubtext || integration.name}
        </p>

        <p className="truncate text-sm font-semibold text-slate-700">
          {integration.credentialHint || "Campaign account"}
        </p>
      </div>
    </div>
  );
}

function ConnectionProgress() {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
            1
          </div>

          <p className="text-xs font-semibold text-blue-700">
            Login
          </p>
        </div>

        <div className="mx-3 h-px flex-1 bg-slate-200" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-500">
            2
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Review
          </p>
        </div>

        <div className="mx-3 h-px flex-1 bg-slate-200" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-500">
            3
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Finish
          </p>
        </div>
      </div>
    </div>
  );
}

function IntegrationSection({
  title,
  description,
  integrations,
  syncingId,
  syncResults,
  configuredIntegrations,
  onRunSync,
  onOpenConnection,
}: {
  title: string;
  description: string;
  integrations: IntegrationCard[];
  syncingId: string | null;
  syncResults: Record<string, string>;
  configuredIntegrations: Record<string, boolean>;
  onRunSync: (integration: IntegrationCard) => void;
  onOpenConnection: (integration: IntegrationCard) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <PlugZap className="h-3.5 w-3.5" />
          {integrations.length} available
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration: IntegrationCard) => {
          const syncing = syncingId === integration.id;
          const result = syncResults[integration.id];
          const configured = Boolean(configuredIntegrations[integration.id]);

          const effectiveStatus: IntegrationStatus = configured
            ? "connected"
            : integration.status;

          return (
            <div key={integration.id} className={CARD_STYLE}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <BrandLogo integration={integration} />

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                    effectiveStatus
                  )}`}
                >
                  {effectiveStatus === "connected" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}

                  {statusLabel(effectiveStatus)}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-slate-950">
                {integration.name}
              </h3>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {integration.category}
              </p>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                {integration.description}
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  {configured
                    ? `${integration.name} is connected for this campaign.`
                    : integration.setupNote}
                </p>

                <div className="mt-3 flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <p className="text-xs leading-5 text-slate-500">
                    {result
                      ? "Last update: just now"
                      : configured
                      ? "Last update: connected"
                      : "Last update: not connected yet"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => onOpenConnection(integration)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    configured
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {configured ? (
                    <>
                      <Settings2 className="h-4 w-4" />
                      Manage Connection
                    </>
                  ) : (
                    <>
                      <PlugZap className="h-4 w-4" />
                      Connect
                    </>
                  )}
                </button>

                {integration.endpoint ? (
                  <button
                    onClick={() => onRunSync(integration)}
                    disabled={!configured || Boolean(syncingId)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionPanel({
  integration,
  credentials,
  setCredentials,
  onClose,
  onSave,
}: {
  integration: IntegrationCard;
  credentials: Record<string, CredentialState>;
  setCredentials: React.Dispatch<
    React.SetStateAction<Record<string, CredentialState>>
  >;
  onClose: () => void;
  onSave: () => void;
}) {
  const currentCredentials = credentials[integration.id] || {
    accountName: "",
    accessToken: "",
    accountId: "",
  };

  function updateField(field: keyof CredentialState, value: string) {
    setCredentials((current) => ({
      ...current,
      [integration.id]: {
        accountName: current[integration.id]?.accountName || "",
        accessToken: current[integration.id]?.accessToken || "",
        accountId: current[integration.id]?.accountId || "",
        [field]: value,
      },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/50">
      <button
        type="button"
        aria-label="Close connection panel"
        onClick={onClose}
        className="hidden flex-1 cursor-default lg:block"
      />

      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <BrandLogo integration={integration} />

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
              Connect {integration.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add the account details your campaign uses for this tool. Once
              saved, this integration will show as connected.
            </p>
          </div>

          <ConnectionProgress />
        </div>

        <div className="flex-1 space-y-5 p-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">
              What this connects
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {integration.description}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Account Email / Username
            </label>

            <input
              value={currentCredentials.accountName}
              onChange={(event) =>
                updateField("accountName", event.target.value)
              }
              placeholder="campaign@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Access Key / Token
            </label>

            <input
              type="password"
              value={currentCredentials.accessToken}
              onChange={(event) =>
                updateField("accessToken", event.target.value)
              }
              placeholder="Paste access token"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Account ID
              <span className="ml-1 font-normal text-slate-400">
                optional
              </span>
            </label>

            <input
              value={currentCredentials.accountId}
              onChange={(event) =>
                updateField("accountId", event.target.value)
              }
              placeholder="Enter account ID"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Secure connection
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                  Your campaign controls which accounts are connected. This
                  screen is designed for credentials now and can be wired into
                  provider OAuth when the live permission flow is ready.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              className="flex-1 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Save & Connect
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function IntegrationsPage() {
  const [contextMode, setContextMode] = useState("default");
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});
  const [configuredIntegrations, setConfiguredIntegrations] = useState<
    Record<string, boolean>
  >({});

  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationCard | null>(null);

  const [credentials, setCredentials] = useState<
    Record<string, CredentialState>
  >({});

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(data?.organization?.context_mode || "default");

        setAetherTier(
          normalizeAetherTier(data?.organization?.aether_tier)
        );
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

      const response = await fetch(integration.endpoint, {
        method: "POST",
      });

      const result = await response.json();

      setSyncResults((current) => ({
        ...current,
        [integration.id]:
          result?.success
            ? `${integration.name} synced ${result.imported} records.`
            : `${integration.name} sync failed.`,
      }));
    } catch {
      setSyncResults((current) => ({
        ...current,
        [integration.id]: `${integration.name} sync failed.`,
      }));
    } finally {
      setSyncingId(null);
    }
  }

  function saveConnection() {
    if (!activeIntegration) return;

    setConfiguredIntegrations((current) => ({
      ...current,
      [activeIntegration.id]: true,
    }));

    setSyncResults((current) => ({
      ...current,
      [activeIntegration.id]:
        `${activeIntegration.name} connected for this campaign.`,
    }));

    setActiveIntegration(null);
  }

  const orgTheme = getOrgContextTheme(contextMode);

  const showToolsWorkspaceLink =
    canShowToolsWorkspaceLink(aetherTier);

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
    <>
      <div className="space-y-8">
        <section
          className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                <PlugZap className="h-3.5 w-3.5" />
                Campaign Integrations
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                  Connect the tools your campaign already uses.
                </h1>

                <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                  Bring your campaign’s digital, finance, and workspace tools
                  into Aether so your team can work from one command center.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  {configuredCount} / {totalVisibleIntegrations} connected
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  Context: {contextMode}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  Connections available anytime
                </span>
              </div>
            </div>

            {showToolsWorkspaceLink ? (
              <Link
                href="/dashboard/tools"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Tools Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                <BarChart3 className="h-3.5 w-3.5" />
                Live Analytics Import
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
                  Analytics CSV Import
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900/80">
                  Import campaign analytics and reporting data directly into
                  Aether.
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
          description="Connect the channels your digital team uses to track reach, content, engagement, and momentum."
          integrations={DIGITAL_INTEGRATIONS}
          syncingId={syncingId}
          syncResults={syncResults}
          configuredIntegrations={configuredIntegrations}
          onRunSync={runTestSync}
          onOpenConnection={setActiveIntegration}
        />

        <IntegrationSection
          title="Finance"
          description="Connect fundraising tools so donor activity and contribution movement can support finance work."
          integrations={visibleFinanceIntegrations}
          syncingId={syncingId}
          syncResults={syncResults}
          configuredIntegrations={configuredIntegrations}
          onRunSync={runTestSync}
          onOpenConnection={setActiveIntegration}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Field
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Field tools and operational integrations are planned for a future
              rollout.
            </p>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <MapPinned className="h-7 w-7 text-slate-500" />
            </div>

            <p className="mt-4 text-lg font-semibold text-slate-800">
              Field is part of the roadmap.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Aether’s first launch focus is digital, finance, and campaign
              operations. Dedicated field integrations will expand over time.
            </p>
          </div>
        </section>

        <IntegrationSection
          title="Utilities"
          description="Connect the workspace tools your campaign uses to coordinate email, schedules, and shared files."
          integrations={UTILITY_INTEGRATIONS}
          syncingId={syncingId}
          syncResults={syncResults}
          configuredIntegrations={configuredIntegrations}
          onRunSync={runTestSync}
          onOpenConnection={setActiveIntegration}
        />
      </div>

      {activeIntegration ? (
        <ConnectionPanel
          integration={activeIntegration}
          credentials={credentials}
          setCredentials={setCredentials}
          onClose={() => setActiveIntegration(null)}
          onSave={saveConnection}
        />
      ) : null}
    </>
  );
}
