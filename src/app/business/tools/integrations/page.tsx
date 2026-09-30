"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  PlugZap,
  RadioTower,
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

type CredentialState = {
  accountName: string;
  accessToken: string;
  accountId: string;
};


const CARD_STYLE =
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md lg:rounded-2xl lg:p-4";

const DIGITAL_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "meta",
    name: "Meta",
    category: "Marketing",
    description:
      "Track ads, reach, engagement, and audience momentum from Meta.",
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
    category: "Marketing",
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
    category: "Marketing",
    description:
      "Monitor engagement, replies, and narrative movement from X.",
    icon: MessageSquareMore,
    status: "ready_to_configure",
    setupNote:
      "Connect X so your team can follow content performance and engagement.",
    credentialHint: "X account login",
    logoText: "𝕏",
    logoSubtext: "X",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Marketing",
    description:
      "Bring TikTok performance and audience momentum into Aether.",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connect TikTok to help your team understand short-form content momentum.",
    credentialHint: "TikTok account login",
    logoText: "♪",
    logoSubtext: "TikTok",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Marketing",
    description:
      "Track video performance, watch activity, and long-form messaging.",
    icon: BarChart3,
    status: "ready_to_configure",
    setupNote:
      "Connect YouTube to bring video performance into Aether.",
    credentialHint: "YouTube channel login",
    logoText: "▶",
    logoSubtext: "YouTube",
  },
  {
    id: "website",
    name: "Business Website",
    category: "Marketing",
    description:
      "Monitor website traffic, signups, and customer activity.",
    icon: Workflow,
    status: "ready_to_configure",
    setupNote:
      "Connect your business website to follow visitor activity and conversions.",
    credentialHint: "Website analytics access",
    logoText: "◎",
    logoSubtext: "Site",
  },
];

const DISPATCH_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "routes",
    name: "Google Routes",
    category: "Dispatch",
    description:
      "Support optimized driving routes for Dispatch jobs and service locations.",
    icon: MapPinned,
    status: "ready_to_configure",
    setupNote:
      "Connect Google Routes to verify Aether-managed route optimization for this organization.",
    credentialHint: "Managed by Aether",
    logoText: "G",
    logoSubtext: "Routes",
  },
];

const UTILITY_INTEGRATIONS: IntegrationCard[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "Business Operations",
    description:
      "Connect business email and shared inbox communication.",
    icon: Mail,
    status: "needs_credentials",
    setupNote:
      "Connect Gmail so business communication can work inside Aether.",
    credentialHint: "Google account login",
    logoText: "M",
    logoSubtext: "Gmail",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Business Operations",
    description:
      "Coordinate business schedules, meetings, and events.",
    icon: CalendarDays,
    status: "needs_credentials",
    setupNote:
      "Connect Calendar so your organization schedule can support operations.",
    credentialHint: "Google account login",
    logoText: "31",
    logoSubtext: "Calendar",
  },
  {
    id: "drive",
    name: "Google Drive",
    category: "Business Operations",
    description:
      "Access business files, working documents, and shared assets.",
    icon: FolderKanban,
    status: "needs_credentials",
    setupNote:
      "Connect Drive so business files are easier to use inside Aether.",
    credentialHint: "Google account login",
    logoText: "△",
    logoSubtext: "Drive",
  },
];

const ALL_INTEGRATIONS: IntegrationCard[] = [
  ...DIGITAL_INTEGRATIONS,
  ...DISPATCH_INTEGRATIONS,
  ...UTILITY_INTEGRATIONS,
];

const SOCIAL_PROVIDER_IDS = new Set([
  "meta",
  "x",
  "tiktok",
  "youtube",
  "website",
  "routes",
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
    <div className="flex items-center gap-3 lg:gap-2">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-black tracking-tight text-slate-950 shadow-sm lg:rounded-xl lg:text-xl lg:h-12 lg:w-12">
        {integration.logoText}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">
          {integration.logoSubtext || integration.name}
        </p>

        <p className="truncate text-sm font-semibold text-slate-700 lg:text-[11px]">
          {integration.credentialHint || "Organization account"}
        </p>
      </div>
    </div>
  );
}

function ConnectionProgress() {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4 lg:mt-6">
      <div className="flex items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white lg:text-[11px] lg:h-8 lg:w-8">
            1
          </div>

          <p className="text-xs font-semibold text-blue-700 lg:text-[9px]">
            Login
          </p>
        </div>

        <div className="mx-3 h-px flex-1 bg-slate-200" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-500 lg:text-[11px] lg:h-8 lg:w-8">
            2
          </div>

          <p className="text-xs font-semibold text-slate-500 lg:text-[9px]">
            Review
          </p>
        </div>

        <div className="mx-3 h-px flex-1 bg-slate-200" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-500 lg:text-[11px] lg:h-8 lg:w-8">
            3
          </div>

          <p className="text-xs font-semibold text-slate-500 lg:text-[9px]">
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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:gap-2 lg:mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 lg:text-xl">
            {title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 lg:text-[11px]">
            {description}
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 lg:text-[9px]">
          <PlugZap className="h-3.5 w-3.5" />
          {integrations.length} available
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-3">
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
              <div className="mb-5 flex items-start justify-between gap-3 lg:gap-2 lg:mb-4">
                <BrandLogo integration={integration} />

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                    effectiveStatus
                  )} lg:text-[9px]`}
                >
                  {effectiveStatus === "connected" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}

                  {statusLabel(effectiveStatus)}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-slate-950 lg:text-base">
                {integration.name}
              </h3>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                {integration.category}
              </p>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600 lg:mt-2 lg:text-[11px]">
                {integration.description}
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3 lg:mt-3">
                <p className="text-sm leading-6 text-slate-700 lg:text-[11px]">
                  {configured
                    ? `${integration.name} is connected for this organization.`
                    : integration.setupNote}
                </p>

                <div className="mt-3 flex items-start gap-2 lg:mt-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 lg:h-3.5 lg:w-3.5" />

                  <p className="text-xs leading-5 text-slate-500 lg:text-[9px]">
                    {configured ? "Last update: connected" : "Last update: not connected yet"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 lg:mt-4">
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
                  } lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]`}
                >
                  {configured ? (
                    <>
                      <Settings2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                      Manage Connection
                    </>
                  ) : (
                    <>
                      <PlugZap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
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

      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl lg:max-w-[30rem]">
        <div className="border-b border-slate-200 p-6 lg:p-[18px]">
          <div className="flex items-start justify-between gap-4 lg:gap-3">
            <BrandLogo integration={integration} />

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </button>
          </div>

          <div className="mt-6 lg:mt-4">
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-2xl">
              {connected
                ? `${integration.name} Connection`
                : `Connect ${integration.name}`}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
              {connected
                ? `${integration.name} is connected for this organization.`
                : integration.id === "google"
                ? "You\'ll be redirected to Google to securely connect Gmail, Google Calendar, and Google Drive."
                : integration.id === "meta"
                ? "You\'ll be redirected to Meta to securely connect the organization\'s Facebook and Instagram analytics."
                : integration.id === "youtube"
                ? "You\'ll be redirected to Google to securely connect the organization\'s YouTube channel and analytics."
                : integration.id === "x"
                ? "You\'ll be redirected to X to securely connect the organization\'s X account and analytics."
                : integration.id === "tiktok"
                ? "You\'ll be redirected to TikTok to securely connect the organization\'s TikTok account and analytics."
                : "Add the account details your organization uses for this tool. Once saved, this integration will show as connected."}
            </p>
          </div>

          {connected ? (
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4 lg:mt-6">
              <div className="flex items-start gap-3 lg:gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 lg:h-4 lg:w-4" />

                <div>
                  <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">
                    Connected
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-800 lg:text-[11px]">
                    This provider is available for analytics sync.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ConnectionProgress />
          )}
        </div>

        <div className="flex-1 space-y-5 p-6 lg:space-y-4 lg:p-[18px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
            <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">
              What this connects
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
              {integration.description}
            </p>
          </div>

          {integration.id === "website" && connected && websiteTrackerId ? (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">
                      Business Website tracker ready
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      Copy the installation code below and add it once to the business website. Aether will begin tracking page views, clicks, and form submissions automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start justify-between gap-4 lg:gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                      Installation Code
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                      Paste this before the closing &lt;/body&gt; tag on the business website.
                    </p>
                  </div>
                </div>

                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100 lg:rounded-xl lg:p-3 lg:mt-3 lg:text-[9px]">
                  {`<script src="https://aetheros.pro/aether-tracker.js" data-aether-tracker="${websiteTrackerId}" defer></script>`}
                </pre>

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `<script src="https://aetheros.pro/aether-tracker.js" data-aether-tracker="${websiteTrackerId}" defer></script>`
                    )
                  }
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:rounded-xl lg:px-3 lg:py-2 lg:mt-2 lg:text-[11px]"
                >
                  <Copy className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  Copy Installation Code
                </button>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-blue-950 lg:text-[11px]">
                      Safe for the business website
                    </p>
                    <p className="mt-1 text-sm leading-6 text-blue-800/80 lg:text-[11px]">
                      This installation code uses the organization&apos;s public tracker ID. It does not expose the private Website API key.
                    </p>
                  </div>
                </div>
              </div>

              {websiteApiKey ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900 lg:text-[11px]">
                    Advanced API access
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600 lg:mt-2 lg:text-[11px]">
                    Only use this private API key for a server-side or custom integration. Never place it in browser code.
                  </p>

                  <div className="mt-4 lg:mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                      Private API Key
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={websiteApiKey}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none lg:rounded-xl lg:px-3 lg:py-2 lg:text-[9px]"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(websiteApiKey)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
                      >
                        <Copy className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                      Ingest Endpoint
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={websiteEndpoint}
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none lg:rounded-xl lg:px-3 lg:py-2 lg:text-[9px]"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(websiteEndpoint)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
                      >
                        <Copy className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 lg:rounded-xl lg:p-3 lg:mt-3">
                    <p className="text-sm font-semibold text-amber-950 lg:text-[11px]">
                      Save the private key now if you need custom API access.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800/80 lg:text-[11px]">
                      Aether will not display the full private API key again after this panel is closed.
                    </p>
                  </div>
                </details>
              ) : null}
            </>
          ) : connected ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                  Provider
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 lg:text-base">
                  {integration.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Connection status is stored for the active organization.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-blue-950 lg:text-[11px]">Credentials protected</p>
                    <p className="mt-1 text-sm leading-6 text-blue-800/80 lg:text-[11px]">
                      Saved tokens are never displayed in Aether.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "google" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">Google Workspace</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  One secure Google connection enables Gmail, Google Calendar, and Google Drive.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Secure OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      You'll be redirected to Google to approve access. Aether never asks for your Google password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "meta" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">Meta Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Connect the organization&apos;s Meta Business account so Aether can read Facebook and Instagram advertising and performance analytics.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Secure Meta OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      You&apos;ll be redirected to Meta to approve access. Aether never asks for your Meta password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "youtube" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">YouTube Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Connect the organization&apos;s YouTube channel so Aether can read channel and analytics performance through the YouTube APIs.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Secure Google OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      You&apos;ll be redirected to Google to approve YouTube access. Aether never asks for your Google password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "x" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">X Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Connect the organization&apos;s X account so Aether can read profile, post, and engagement performance through the X API.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Secure X OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      You&apos;ll be redirected to X to approve read-only access. Aether never asks for your X password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "tiktok" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">TikTok Analytics</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Connect the organization&apos;s TikTok account so Aether can read account statistics and public video performance through TikTok&apos;s API.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Secure TikTok OAuth</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      You&apos;ll be redirected to TikTok to approve read-only analytics access. Aether never asks for your TikTok password.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "routes" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">Aether-Managed Google Routes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Aether uses its own Google Routes connection for route optimization. No organization Google account, API key, or billing setup is required.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">Managed by Aether</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      Connect verifies the live Google Routes service for the active organization. Dispatch routing will use it when real Business job locations are connected.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : integration.id === "website" ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 lg:rounded-2xl lg:p-4">
                <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">Business Website API</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Aether creates an organization-specific website tracker. Copy one installation snippet into the business website and Aether will handle analytics automatically.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 lg:rounded-2xl lg:p-4">
                <div className="flex items-start gap-3 lg:gap-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 lg:h-4 lg:w-4" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 lg:text-[11px]">One-copy installation</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 lg:text-[11px]">
                      No third-party login is required. Aether generates a public tracker ID for the website and keeps the private API credential protected.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 lg:text-[11px]">Account Email / Username</label>
                <input value={currentCredentials.accountName} onChange={(e)=>updateField("accountName",e.target.value)} placeholder="team@example.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"/>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 lg:text-[11px]">Access Key / Token</label>
                <input type="password" value={currentCredentials.accessToken} onChange={(e)=>updateField("accessToken",e.target.value)} placeholder="Paste access token" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"/>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 lg:text-[11px]">Account ID <span className="ml-1 font-normal text-slate-400">optional</span></label>
                <input value={currentCredentials.accountId} onChange={(e)=>updateField("accountId",e.target.value)} placeholder="Enter account ID" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"/>
              </div>
            </>
          )}
        </div>

        {actionError ? (
          <div className="mx-6 mb-0 rounded-2xl border border-rose-200 bg-rose-50 p-4 lg:rounded-xl lg:p-3">
            <p className="text-sm font-semibold text-rose-900 lg:text-[11px]">
              Connection action failed
            </p>

            <p className="mt-1 text-sm text-rose-800 lg:text-[11px]">
              {actionError}
            </p>
          </div>
        ) : null}

        <div className="border-t border-slate-200 bg-white p-6 lg:p-[18px]">
          <div className="flex gap-3 lg:gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || disconnecting}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              {integration.id === "website" && connected && websiteTrackerId
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
                  className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : null
            ) : (
              <button
                type="button"
                onClick={
                  integration.id === "google"
                    ? () => window.location.assign("/api/business/integrations/google/connect")
                    : integration.id === "meta"
                    ? () => window.location.assign("/api/business/integrations/meta/connect")
                    : integration.id === "youtube"
                    ? () => window.location.assign("/api/business/integrations/youtube/connect")
                    : integration.id === "x"
                    ? () => window.location.assign("/api/business/integrations/x/connect")
                    : integration.id === "tiktok"
                    ? () => window.location.assign("/api/business/integrations/tiktok/connect")
                    : onSave
                }
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              >
                {integration.id === "google"
                  ? "Connect with Google"
                  : integration.id === "meta"
                  ? "Connect with Meta"
                  : integration.id === "youtube"
                  ? "Connect with YouTube"
                  : integration.id === "x"
                  ? "Connect with X"
                  : integration.id === "tiktok"
                  ? "Connect with TikTok"
                  : integration.id === "routes"
                  ? saving
                    ? "Connecting..."
                    : "Connect Google Routes"
                  : integration.id === "website"
                  ? saving
                    ? "Creating API Key..."
                    : "Create Website Tracker"
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
          throw new Error("Unable to load organization context.");
        }

        const data = await response.json();

        const organizationId =
          data?.organization?.id ||
          data?.membership?.organization_id ||
          null;

        if (!organizationId) {
          throw new Error("No active organization selected.");
        }

        if (cancelled) return;

        setActiveOrganizationId(String(organizationId));

        const connectionMap: Record<string, boolean> = {};

        const providers = [
          "google",
          "meta",
          "x",
          "tiktok",
          "youtube",
          "website",
          "routes",
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

    if (activeIntegration.id === "routes") {
      try {
        setSavingConnection(true);
        setConnectionSaveError("");

        const response = await fetch("/api/business/integrations/routes/connect", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Google Routes could not be connected.");
        }

        setConfiguredIntegrations((current) => ({
          ...current,
          routes: true,
        }));
      } catch (error: any) {
        console.error("Failed to connect Google Routes", error);
        setConnectionSaveError(error?.message || "Google Routes could not be connected.");
      } finally {
        setSavingConnection(false);
      }
      return;
    }

    if (activeIntegration.id === "website") {
      try {
        setSavingConnection(true);
        setConnectionSaveError("");

        const response = await fetch("/api/business/integrations/website/connect", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "The Business Website API connection could not be created."
          );
        }

        setConfiguredIntegrations((current) => ({
          ...current,
          website: true,
        }));

        setWebsiteApiKey(String(result.apiKey || ""));
        setWebsiteTrackerId(String(result.trackerId || ""));
        const returnedEndpoint = String(result.endpoint || "/api/business/integrations/website/ingest");
        setWebsiteEndpoint(
          returnedEndpoint.startsWith("http")
            ? returnedEndpoint
            : `${window.location.origin}${returnedEndpoint}`
        );
      } catch (error: any) {
        console.error("Failed to create Business Website API connection", error);
        setConnectionSaveError(
          error?.message || "The Business Website API connection could not be created."
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

      const disconnectEndpoint =
        providerId === "google"
          ? `/api/business/integrations/google/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "x"
          ? `/api/business/integrations/x/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "meta"
          ? `/api/business/integrations/meta/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "youtube"
          ? `/api/business/integrations/youtube/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "tiktok"
          ? `/api/business/integrations/tiktok/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "website"
          ? `/api/business/integrations/website/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : providerId === "routes"
          ? `/api/business/integrations/routes/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`
          : `/api/integrations/${providerId}/disconnect?organizationId=${encodeURIComponent(
              activeOrganizationId
            )}`;

      const response = await fetch(
        disconnectEndpoint,
        {
          method:
            providerId === "website" || providerId === "routes"
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
    setActiveIntegration(integration);
  }
  const totalVisibleIntegrations =
    DIGITAL_INTEGRATIONS.length +
    DISPATCH_INTEGRATIONS.length +
    UTILITY_INTEGRATIONS.length;

  const configuredCount = useMemo(() => {
    return Object.values(configuredIntegrations).filter(Boolean).length;
  }, [configuredIntegrations]);

  return (
    <>
      <div className="space-y-8 lg:space-y-6">
        <section
          className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
            <div className="space-y-4 lg:space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:text-[9px]">
                <PlugZap className="h-3.5 w-3.5" />
                Business Integrations
              </div>

              <div className="space-y-3 lg:space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl lg:text-2xl">
                  Connect the tools your business already uses.
                </h1>

                <p className="max-w-3xl text-sm text-slate-300 lg:text-base lg:text-[11px]">
                  Bring your marketing, operations, routing, and workspace tools
                  into Aether so your team can work from one command center.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 lg:text-[9px]">
                  {loadingConnections
                    ? "Loading connections..."
                    : `${configuredCount} / ${totalVisibleIntegrations} connected`}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 lg:text-[9px]">
                  Connections available anytime
                </span>
              </div>
            </div>
            <Link
                href="/business/tools"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
              >
                Open Tools Workspace
                <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              </Link>
          </div>
        </section>

        <IntegrationSection
          title="Marketing"
          description="Connect the channels your team uses to track reach, content, engagement, and audience momentum."
          integrations={DIGITAL_INTEGRATIONS}
          configuredIntegrations={configuredIntegrations}
          onOpenConnection={openConnection}
        />

        <IntegrationSection
          title="Dispatch"
          description="Connect services that support Dispatch routing and location-based execution."
          integrations={DISPATCH_INTEGRATIONS}
          configuredIntegrations={configuredIntegrations}
          onOpenConnection={openConnection}
        />

        <IntegrationSection
          title="Business Operations"
          description="Connect the workspace tools your organization uses to coordinate email, schedules, and shared files."
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
        />
      ) : null}
    </>
  );
}
