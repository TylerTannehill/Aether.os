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
  CheckCircle2,
  MapPinned,
  Settings2,
  Clock3,
  AlertCircle,
  X,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getOrgContextTheme } from "@/lib/org-context-theme";
import {
  getConnection,
  saveConnection,
} from "@/lib/integrations/connection-store";

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
    icon: RadioTower,
    status: "ready_to_configure",
    setupNote:
      "Connect Meta to bring ad performance and audience activity into Aether.",
    credentialHint: "Meta Business account",
    logoText: "∞",
    logoSubtext: "Meta",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Digital Team",
    description:
      "Track Instagram reach, engagement, content performance, and audience momentum.",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connect Meta to bring Instagram performance and audience activity into Aether.",
    credentialHint: "Instagram Business account",
    logoText: "◎",
    logoSubtext: "Instagram",
  },
  {
    id: "x",
    name: "X",
    category: "Digital Team",
    description:
      "Monitor engagement, replies, and narrative movement from X.",
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

const ALL_INTEGRATIONS: IntegrationCard[] = [
  ...DIGITAL_INTEGRATIONS,
  ...FINANCE_INTEGRATIONS,
  ...UTILITY_INTEGRATIONS,
];

const SOCIAL_PROVIDER_IDS = new Set([
  "meta",
  "x",
  "tiktok",
  "youtube",
  "website",
  "winred",
  "google",
  "gmail",
  "calendar",
  "drive",
]);

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
  configuredIntegrations,
  onOpenConnection,
}: {
  title: string;
  description: string;
  integrations: IntegrationCard[];
  configuredIntegrations: Record<string, boolean>;
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
          const configured =
            integration.id === "gmail" ||
            integration.id === "calendar" ||
            integration.id === "drive"
              ? Boolean(configuredIntegrations["google"])
              : integration.id === "instagram"
              ? Boolean(configuredIntegrations["meta"])
              : Boolean(configuredIntegrations[integration.id]);

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
                    {configured ? "Last update: connected" : "Last update: not connected yet"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenConnection(
                      integration.id === "gmail" ||
                      integration.id === "calendar" ||
                      integration.id === "drive"
                        ? {
                            ...integration,
                            id: "google",
                            name: "Google",
                            description:
                              "Connect your Google account to enable Gmail, Google Calendar, and Google Drive.",
                            credentialHint: "Google Account",
                            logoText: "G",
                            logoSubtext: "Google",
                          }
                        : integration.id === "instagram"
                        ? {
                            ...integration,
                            id: "meta",
                            name: "Meta",
                            description:
                              "Connect Meta once to enable Facebook and Instagram analytics in Aether.",
                            credentialHint: "Meta Business account",
                            logoText: "∞",
                            logoSubtext: "Meta",
                          }
                        : integration
                    )
                  }
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
  connected,
  canDisconnect,
  credentials,
  setCredentials,
  onClose,
  onSave,
  onDisconnect,
  saving,
  disconnecting,
  actionError,
  websiteApiKey,
  websiteEndpoint,
  websiteTrackerId,
  winredWebhookUrl,
}: {
  integration: IntegrationCard;
  connected: boolean;
  canDisconnect: boolean;
  credentials: Record<string, CredentialState>;
  setCredentials: React.Dispatch<
    React.SetStateAction<Record<string, CredentialState>>
  >;
  onClose: () => void;
  onSave: () => void;
  onDisconnect: () => void;
  saving: boolean;
  disconnecting: boolean;
  actionError: string;
  websiteApiKey: string;
  websiteEndpoint: string;
  websiteTrackerId: string;
  winredWebhookUrl: string;
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
              {connected
                ? `${integration.name} Connection`
                : `Connect ${integration.name}`}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {connected
                ? `${integration.name} is connected for this campaign.`
                : integration.id === "google"
                ? "You\'ll be redirected to Google to securely connect Gmail, Google Calendar, and Google Drive."
                : integration.id === "meta"
                ? "You\'ll be redirected to Meta to securely connect the campaign\'s Facebook and Instagram analytics."
                : integration.id === "youtube"
                ? "You\'ll be redirected to Google to securely connect the campaign\'s YouTube channel and analytics."
                : integration.id === "x"
                ? "You\'ll be redirected to X to securely connect the campaign\'s X account and analytics."
                : integration.id === "winred"
                ? "Aether will create a campaign-specific WinRed webhook URL. Add that URL to WinRed so new donor activity can flow directly into Aether Contacts."
                : "Add the account details your campaign uses for this tool. Once saved, this integration will show as connected."}
            </p>
          </div>

          {connected ? (
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Connected
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    This provider is available for analytics sync.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ConnectionProgress />
          )}
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

          {integration.id === "website" && connected && websiteTrackerId ? (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      Campaign Website tracker ready
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      Copy the installation code below and add it once to the campaign website. Aether will begin tracking page views, clicks, and form submissions automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Installation Code
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Paste this before the closing &lt;/body&gt; tag on the campaign website.
                    </p>
                  </div>
                </div>

                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {`<script src="https://aetheros.pro/aether-tracker.js" data-aether-tracker="${websiteTrackerId}" defer></script>`}
                </pre>

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `<script src="https://aetheros.pro/aether-tracker.js" data-aether-tracker="${websiteTrackerId}" defer></script>`
                    )
                  }
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Copy className="h-4 w-4" />
                  Copy Installation Code
                </button>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-950">
                      Safe for the campaign website
                    </p>
                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                      This installation code uses the campaign&apos;s public tracker ID. It does not expose the private Website API key.
                    </p>
                  </div>
                </div>
              </div>

              {websiteApiKey ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                    Advanced API access
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Only use this private API key for a server-side or custom integration. Never place it in browser code.
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Private API Key
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={websiteApiKey}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(websiteApiKey)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Ingest Endpoint
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={websiteEndpoint}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(websiteEndpoint)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">
                      Save the private key now if you need custom API access.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800/80">
                      Aether will not display the full private API key again after this panel is closed.
                    </p>
                  </div>
                </details>
              ) : null}
            </>
          ) : integration.id === "winred" && connected ? (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      WinRed webhook ready
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      WinRed donor activity can flow into this campaign&apos;s Aether Contacts through the campaign-specific webhook below.
                    </p>
                  </div>
                </div>
              </div>

              {winredWebhookUrl ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    WinRed Webhook URL
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Copy this URL into the campaign&apos;s WinRed webhook configuration.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      readOnly
                      value={winredWebhookUrl}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(winredWebhookUrl)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                    <div>
                      <p className="text-sm font-semibold text-blue-950">
                        Webhook credential protected
                      </p>
                      <p className="mt-1 text-sm leading-6 text-blue-800/80">
                        The connection is active. For security, Aether does not redisplay a previously generated webhook token after the page is reloaded.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : connected ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Provider
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {integration.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Connection status is stored for the active campaign.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-950">Credentials protected</p>
                    <p className="mt-1 text-sm leading-6 text-blue-800/80">
                      Saved tokens are never displayed in Aether.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "google" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Google Workspace</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  One secure Google connection enables Gmail, Google Calendar, and Google Drive.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Secure OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      You'll be redirected to Google to approve access. Aether never asks for your Google password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "meta" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Meta Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Connect the campaign&apos;s Meta Business account so Aether can read Facebook and Instagram advertising and performance analytics.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Secure Meta OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      You&apos;ll be redirected to Meta to approve access. Aether never asks for your Meta password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "youtube" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">YouTube Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Connect the campaign&apos;s YouTube channel so Aether can read channel and analytics performance through the YouTube APIs.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Secure Google OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      You&apos;ll be redirected to Google to approve YouTube access. Aether never asks for your Google password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "x" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">X Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Connect the campaign&apos;s X account so Aether can read profile, post, and engagement performance through the X API.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Secure X OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      You&apos;ll be redirected to X to approve read-only access. Aether never asks for your X password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "winred" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">WinRed Donor Webhook</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Aether creates a secure webhook URL for this campaign. Add it to WinRed once, and incoming donor activity will be processed through Aether&apos;s Contacts ingestion engine.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">No WinRed password required</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      Aether generates the campaign-specific webhook credential. You only need to copy the URL into WinRed.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "website" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Campaign Website API</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Aether creates a campaign-specific website tracker. Copy one installation snippet into the campaign website and Aether will handle analytics automatically.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">One-copy installation</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      No third-party login is required. Aether generates a public tracker ID for the website and keeps the private API credential protected.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Account Email / Username</label>
                <input value={currentCredentials.accountName} onChange={(e)=>updateField("accountName",e.target.value)} placeholder="campaign@example.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"/>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Access Key / Token</label>
                <input type="password" value={currentCredentials.accessToken} onChange={(e)=>updateField("accessToken",e.target.value)} placeholder="Paste access token" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"/>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Account ID <span className="ml-1 font-normal text-slate-400">optional</span></label>
                <input value={currentCredentials.accountId} onChange={(e)=>updateField("accountId",e.target.value)} placeholder="Enter account ID" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"/>
              </div>
            </>
          )}
        </div>

        {actionError ? (
          <div className="mx-6 mb-0 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">
              Connection action failed
            </p>

            <p className="mt-1 text-sm text-rose-800">
              {actionError}
            </p>
          </div>
        ) : null}

        <div className="border-t border-slate-200 bg-white p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || disconnecting}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {integration.id === "website" && connected && websiteTrackerId
                ? "Done"
                : integration.id === "winred" && connected && winredWebhookUrl
                ? "Done"
                : connected
                ? "Close"
                : "Cancel"}
            </button>

            {integration.id === "website" && connected && websiteTrackerId ? null : connected ? (
              canDisconnect ? (
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : null
            ) : (
              <button
                type="button"
                onClick={
                  integration.id === "google"
                    ? () => window.location.assign("/api/integrations/google/connect")
                    : integration.id === "meta"
                    ? () => window.location.assign("/api/integrations/meta/connect")
                    : integration.id === "youtube"
                    ? () => window.location.assign("/api/integrations/youtube/connect")
                    : integration.id === "x"
                    ? () => window.location.assign("/api/integrations/x/connect")
                    : onSave
                }
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {integration.id === "google"
                  ? "Connect with Google"
                  : integration.id === "meta"
                  ? "Connect with Meta"
                  : integration.id === "youtube"
                  ? "Connect with YouTube"
                  : integration.id === "x"
                  ? "Connect with X"
                  : integration.id === "website"
                  ? saving
                    ? "Creating API Key..."
                    : "Create Website Tracker"
                  : integration.id === "winred"
                  ? saving
                    ? "Creating Webhook..."
                    : "Create WinRed Webhook"
                  : saving
                  ? "Saving..."
                  : "Save & Connect"}
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function IntegrationsPage() {
  const [contextMode, setContextMode] = useState("default");
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");

  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(
    null
  );
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [savingConnection, setSavingConnection] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [connectionSaveError, setConnectionSaveError] = useState("");
  const [websiteApiKey, setWebsiteApiKey] = useState("");
  const [websiteEndpoint, setWebsiteEndpoint] = useState("");
  const [websiteTrackerId, setWebsiteTrackerId] = useState("");
  const [winredWebhookUrl, setWinredWebhookUrl] = useState("");
  const [configuredIntegrations, setConfiguredIntegrations] = useState<
    Record<string, boolean>
  >({});

  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationCard | null>(null);

  const [credentials, setCredentials] = useState<
    Record<string, CredentialState>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      try {
        setLoadingConnections(true);

        const response = await fetch("/api/auth/current-context", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load campaign context.");
        }

        const data = await response.json();

        const organizationId =
          data?.organization?.id ||
          data?.membership?.organization_id ||
          null;

        if (!organizationId) {
          throw new Error("No active campaign selected.");
        }

        if (cancelled) return;

        setActiveOrganizationId(String(organizationId));
        setContextMode(data?.organization?.context_mode || "default");
        setAetherTier(
          normalizeAetherTier(data?.organization?.aether_tier)
        );

        const connectionMap: Record<string, boolean> = {};

        const providers = [
          "google",
          "meta",
          "x",
          "tiktok",
          "youtube",
          "website",
          "actblue",
          "winred",
        ] as const;

        await Promise.all(
          providers.map(async (provider) => {
            try {
              const connection = await getConnection(
                String(organizationId),
                provider
              );

              connectionMap[provider] =
                Boolean(connection?.status === "connected");

              if (provider === "website" && connection?.status === "connected") {
                const metadata =
                  connection?.metadata &&
                  typeof connection.metadata === "object" &&
                  !Array.isArray(connection.metadata)
                    ? connection.metadata
                    : {};

                const existingTrackerId = String(
                  metadata?.tracker_id || metadata?.trackerId || ""
                ).trim();

                if (existingTrackerId && !cancelled) {
                  setWebsiteTrackerId(existingTrackerId);
                }
              }

            } catch (error) {
              console.error(`[Integrations] Failed loading ${provider}`, error);
              connectionMap[provider] = false;
            }
          })
        );

        connectionMap.gmail = connectionMap.google;
        connectionMap.calendar = connectionMap.google;
        connectionMap.drive = connectionMap.google;
        connectionMap.instagram = connectionMap.meta;

        if (cancelled) return;

        console.log("[Aether] Configured Integrations:", connectionMap);

        setConfiguredIntegrations(connectionMap);
      } catch (error) {
        console.error("Failed to load integrations page", error);

        if (!cancelled) {
          setConfiguredIntegrations({});
        }
      } finally {
        if (!cancelled) {
          setLoadingConnections(false);
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveCurrentConnection() {
    if (!activeIntegration || !activeOrganizationId) return;

    if (activeIntegration.id === "website") {
      try {
        setSavingConnection(true);
        setConnectionSaveError("");

        const response = await fetch("/api/integrations/website/connect", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "The Campaign Website API connection could not be created."
          );
        }

        setConfiguredIntegrations((current) => ({
          ...current,
          website: true,
        }));

        setWebsiteApiKey(String(result.apiKey || ""));
        setWebsiteTrackerId(String(result.trackerId || ""));
        const returnedEndpoint = String(result.endpoint || "/api/integrations/website/ingest");
        setWebsiteEndpoint(
          returnedEndpoint.startsWith("http")
            ? returnedEndpoint
            : `${window.location.origin}${returnedEndpoint}`
        );
      } catch (error: any) {
        console.error("Failed to create Campaign Website API connection", error);
        setConnectionSaveError(
          error?.message || "The Campaign Website API connection could not be created."
        );
      } finally {
        setSavingConnection(false);
      }
      return;
    }

    if (activeIntegration.id === "winred") {
      try {
        setSavingConnection(true);
        setConnectionSaveError("");

        const response = await fetch("/api/integrations/winred/connect", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "The WinRed webhook connection could not be created."
          );
        }

        setConfiguredIntegrations((current) => ({
          ...current,
          winred: true,
        }));

        setWinredWebhookUrl(String(result.webhookUrl || ""));
      } catch (error: any) {
        console.error("Failed to create WinRed webhook connection", error);
        setConnectionSaveError(
          error?.message || "The WinRed webhook connection could not be created."
        );
      } finally {
        setSavingConnection(false);
      }
      return;
    }

    const currentCredentials = credentials[activeIntegration.id] || {
      accountName: "",
      accessToken: "",
      accountId: "",
    };

    if (!currentCredentials.accessToken.trim()) {
      setConnectionSaveError(
        "An access key or token is required before this connection can be saved."
      );
      return;
    }

    try {
      setSavingConnection(true);
      setConnectionSaveError("");

      await saveConnection({
        organizationId: activeOrganizationId,
        provider: activeIntegration.id,
        providerAccountEmail:
          currentCredentials.accountName.trim() || null,
        accessToken: currentCredentials.accessToken.trim(),
        status: "connected",
        metadata: currentCredentials.accountId.trim()
          ? {
              provider_account_id: currentCredentials.accountId.trim(),
            }
          : {},
      });

      setConfiguredIntegrations((current) => ({
        ...current,
        [activeIntegration.id]: true,
      }));

      setActiveIntegration(null);
    } catch (error: any) {
      console.error("Failed to save integration connection", error);

      setConnectionSaveError(
        error?.message || "The connection could not be saved."
      );
    } finally {
      setSavingConnection(false);
    }
  }

  async function disconnectCurrentConnection() {
    if (!activeIntegration || !activeOrganizationId) return;

    const providerId = activeIntegration.id;
    const providerName = activeIntegration.name;

    try {
      setDisconnectingId(providerId);
      setConnectionSaveError("");

      const response = await fetch(
        `/api/integrations/${providerId}/disconnect?organizationId=${encodeURIComponent(
          activeOrganizationId
        )}`,
        {
          method:
            providerId === "website" || providerId === "winred"
              ? "POST"
              : "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || `Unable to disconnect ${providerName}.`
        );
      }

      setConfiguredIntegrations((current) => ({
        ...current,
        [providerId]: false,
      }));

      setCredentials((current) => {
        const next = { ...current };
        delete next[providerId];
        return next;
      });

      if (providerId === "website") {
        setWebsiteApiKey("");
        setWebsiteEndpoint("");
        setWebsiteTrackerId("");
      }

      if (providerId === "winred") {
        setWinredWebhookUrl("");
      }

      setActiveIntegration(null);
    } catch (error: any) {
      console.error(`Failed to disconnect ${providerName}`, error);

      setConnectionSaveError(
        error?.message || `Unable to disconnect ${providerName}.`
      );
    } finally {
      setDisconnectingId(null);
    }
  }

  function openConnection(integration: IntegrationCard) {
    setConnectionSaveError("");
    setWebsiteApiKey("");
    setWebsiteEndpoint("");
    setWinredWebhookUrl("");
    setActiveIntegration(integration);
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
                  {loadingConnections
                    ? "Loading connections..."
                    : `${configuredCount} / ${totalVisibleIntegrations} connected`}
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
          configuredIntegrations={configuredIntegrations}
          onOpenConnection={openConnection}
        />

        <IntegrationSection
          title="Finance"
          description="Connect fundraising tools so donor activity and contribution movement can support finance work."
          integrations={visibleFinanceIntegrations}
          configuredIntegrations={configuredIntegrations}
          onOpenConnection={openConnection}
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
          configuredIntegrations={configuredIntegrations}
          onOpenConnection={openConnection}
        />
      </div>

      {activeIntegration ? (
        <ConnectionPanel
          integration={activeIntegration}
          connected={Boolean(
            configuredIntegrations[
              activeIntegration.id === "gmail" ||
              activeIntegration.id === "calendar" ||
              activeIntegration.id === "drive"
                ? "google"
                : activeIntegration.id === "instagram"
                ? "meta"
                : activeIntegration.id
            ]
          )}
          canDisconnect={SOCIAL_PROVIDER_IDS.has(
            activeIntegration.id
          )}
          credentials={credentials}
          setCredentials={setCredentials}
          onClose={() => {
            setConnectionSaveError("");
            setWebsiteApiKey("");
            setWebsiteEndpoint("");
            setActiveIntegration(null);
          }}
          onSave={saveCurrentConnection}
          onDisconnect={disconnectCurrentConnection}
          saving={savingConnection}
          disconnecting={disconnectingId === activeIntegration.id}
          actionError={connectionSaveError}
          websiteApiKey={websiteApiKey}
          websiteEndpoint={websiteEndpoint}
          websiteTrackerId={websiteTrackerId}
          winredWebhookUrl={winredWebhookUrl}
        />
      ) : null}
    </>
  );
}
