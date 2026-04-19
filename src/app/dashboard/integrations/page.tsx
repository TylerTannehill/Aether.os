"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  Mail,
  MessageSquareMore,
  PlugZap,
  RadioTower,
  Wallet,
  Workflow,
  X,
} from "lucide-react";

type IntegrationStatus = "available" | "beta" | "coming_soon" | "connected";

type IntegrationItem = {
  id: string;
  name: string;
  category: "fundraising" | "crm" | "communications" | "ads" | "workspace";
  status: IntegrationStatus;
  value: string;
  description: string;
  capabilities: string[];
  cta: string;
  previewTitle: string;
  previewBody: string;
};

type ConnectForm = {
  workspace: string;
  apiKey: string;
  webhookUrl: string;
  audience: string;
  syncMode: string;
};

function statusTone(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "beta":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "coming_soon":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "available":
    default:
      return "border-sky-200 bg-sky-50 text-sky-800";
  }
}

function categoryTone(category: IntegrationItem["category"]) {
  switch (category) {
    case "fundraising":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "crm":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "communications":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "ads":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800";
    case "workspace":
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function statusLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "beta":
      return "Beta";
    case "coming_soon":
      return "Coming Soon";
    case "available":
    default:
      return "Available";
  }
}

function categoryLabel(category: IntegrationItem["category"]) {
  switch (category) {
    case "fundraising":
      return "Fundraising";
    case "crm":
      return "CRM";
    case "communications":
      return "Communications";
    case "ads":
      return "Ads";
    case "workspace":
    default:
      return "Workspace";
  }
}

function integrationIcon(id: string) {
  switch (id) {
    case "actblue":
      return Wallet;
    case "ngp":
      return Workflow;
    case "mailchimp":
      return Mail;
    case "scale-to-win":
      return MessageSquareMore;
    case "meta":
      return RadioTower;
    case "google-drive":
      return FolderKanban;
    case "google-calendar":
      return CalendarDays;
    default:
      return PlugZap;
  }
}

function modalFieldsFor(id: string) {
  if (id === "actblue") {
    return {
      workspaceLabel: "Entity / Workspace",
      workspacePlaceholder: "Friends of Example Campaign",
      keyLabel: "Webhook Secret or API Key",
      keyPlaceholder: "ab_live_...",
      extraLabel: "Webhook URL",
      extraPlaceholder: "https://aether.app/api/integrations/actblue",
    };
  }

  if (id === "mailchimp") {
    return {
      workspaceLabel: "Audience",
      workspacePlaceholder: "Main Campaign Audience",
      keyLabel: "API Key",
      keyPlaceholder: "mailchimp_live_...",
      extraLabel: "Sync Mode",
      extraPlaceholder: "Audience pull + segment push",
    };
  }

  if (id === "ngp") {
    return {
      workspaceLabel: "Committee / Folder",
      workspacePlaceholder: "General Campaign Workspace",
      keyLabel: "API Key",
      keyPlaceholder: "ngp_live_...",
      extraLabel: "Sync Scope",
      extraPlaceholder: "Contacts + field lists",
    };
  }

  if (id === "scale-to-win") {
    return {
      workspaceLabel: "Workspace",
      workspacePlaceholder: "Texting + Dialer Workspace",
      keyLabel: "API Key",
      keyPlaceholder: "stw_live_...",
      extraLabel: "Sync Scope",
      extraPlaceholder: "Lists + outcomes + metrics",
    };
  }

  if (id === "meta") {
    return {
      workspaceLabel: "Ad Account",
      workspacePlaceholder: "Campaign Main Account",
      keyLabel: "Access Token",
      keyPlaceholder: "meta_live_...",
      extraLabel: "Primary Objective",
      extraPlaceholder: "Reach + persuasion monitoring",
    };
  }

  return {
    workspaceLabel: "Workspace",
    workspacePlaceholder: "Primary Campaign Workspace",
    keyLabel: "Connection Key",
    keyPlaceholder: "live_key_...",
    extraLabel: "Sync Scope",
    extraPlaceholder: "Core campaign data",
  };
}

export default function IntegrationsPage() {
  const [selectedId, setSelectedId] = useState<string>("actblue");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string>("");
  const [providerStatuses, setProviderStatuses] = useState<Record<string, IntegrationStatus>>({
    "google-drive": "connected",
  });
  const [connectedPreviewCounts, setConnectedPreviewCounts] = useState<Record<string, number>>({
    "google-drive": 12,
  });
  const [form, setForm] = useState<ConnectForm>({
    workspace: "",
    apiKey: "",
    webhookUrl: "",
    audience: "",
    syncMode: "",
  });

  const integrations = useMemo<IntegrationItem[]>(() => {
    return [
      {
        id: "actblue",
        name: "ActBlue",
        category: "fundraising",
        status: providerStatuses["actblue"] ?? "available",
        value: "Import donations, pledges, and donor activity.",
        description:
          "Bring fundraising activity into Aether so finance, donor follow-up, and compliance workflows stay connected.",
        capabilities: ["Import recent donations", "Sync donor records", "Flag compliance gaps"],
        cta: providerStatuses["actblue"] === "connected" ? "Connected" : "Connect ActBlue",
        previewTitle: "Fundraising activity ready",
        previewBody: "Recent donations, pledges, and donor signals can route into Finance and Outreach without leaving Aether.",
      },
      {
        id: "ngp",
        name: "NGP VAN",
        category: "crm",
        status: providerStatuses["ngp"] ?? "beta",
        value: "Pull contacts, lists, and canvass data.",
        description:
          "Map voter, volunteer, and contact data into Aether so field and outreach work from a shared operational layer.",
        capabilities: ["Sync contact records", "Pull field lists", "Map canvass responses"],
        cta: providerStatuses["ngp"] === "connected" ? "Connected" : "Configure VAN",
        previewTitle: "CRM and field sync",
        previewBody: "Contacts, walk packets, and canvass responses can become live execution inputs inside Aether.",
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        category: "communications",
        status: providerStatuses["mailchimp"] ?? "available",
        value: "Connect audiences, campaigns, and engagement.",
        description:
          "Use Aether to coordinate email audiences, campaign pushes, and downstream follow-up based on engagement.",
        capabilities: ["Sync audiences", "Push segmented lists", "Pull campaign performance"],
        cta: providerStatuses["mailchimp"] === "connected" ? "Connected" : "Connect Mailchimp",
        previewTitle: "Audience sync available",
        previewBody: "Audience membership and campaign performance can push straight into Aether routing and follow-up logic.",
      },
      {
        id: "scale-to-win",
        name: "Scale to Win",
        category: "communications",
        status: providerStatuses["scale-to-win"] ?? "beta",
        value: "Sync texting workflows and outreach outcomes.",
        description:
          "Bring texting and contact outcomes back into Aether so communications activity feeds the broader operating system.",
        capabilities: ["Push outreach lists", "Pull texting metrics", "Sync dialer outcomes"],
        cta: providerStatuses["scale-to-win"] === "connected" ? "Connected" : "Connect Scale to Win",
        previewTitle: "Texting workflows in reach",
        previewBody: "Lists, outcomes, and channel performance can flow back into Outreach and Dashboard Focus.",
      },
      {
        id: "meta",
        name: "Meta",
        category: "ads",
        status: providerStatuses["meta"] ?? "available",
        value: "Surface ad performance and audience movement.",
        description:
          "Connect paid performance into Digital so Aether can see what is actually driving reach, engagement, and spend efficiency.",
        capabilities: ["Pull ad performance", "Map audience shifts", "Compare spend efficiency"],
        cta: providerStatuses["meta"] === "connected" ? "Connected" : "Connect Meta",
        previewTitle: "Ad account visibility ready",
        previewBody: "Spend efficiency, audience movement, and performance shifts can become live Digital signals.",
      },
      {
        id: "google-drive",
        name: "Google Drive",
        category: "workspace",
        status: providerStatuses["google-drive"] ?? "connected",
        value: "Keep campaign docs and process assets connected.",
        description:
          "Link campaign documents, print proofs, and planning assets into Aether without forcing users to leave the system.",
        capabilities: ["Open shared assets", "Map folders by department", "Reference campaign docs"],
        cta: "Connected",
        previewTitle: "Workspace assets linked",
        previewBody: "Shared docs, print proofs, and process materials can stay visible without breaking execution flow.",
      },
      {
        id: "google-calendar",
        name: "Google Calendar",
        category: "workspace",
        status: providerStatuses["google-calendar"] ?? "coming_soon",
        value: "Tie schedule visibility into execution.",
        description:
          "Surface meetings, deadlines, and field timing so campaign execution stays aligned with the calendar.",
        capabilities: ["Read event schedules", "Sync campaign timing", "Surface deadline conflicts"],
        cta: "Preview Calendar Hook",
        previewTitle: "Schedule-aware execution",
        previewBody: "Deadlines, events, and timing conflicts can become real execution context inside Aether.",
      },
    ];
  }, [providerStatuses]);

  const selected = integrations.find((item) => item.id === selectedId) ?? integrations[0];
  const modalFields = modalFieldsFor(selected.id);

  const summary = useMemo(() => {
    return {
      connected: integrations.filter((item) => item.status === "connected").length,
      available: integrations.filter((item) => item.status === "available").length,
      beta: integrations.filter((item) => item.status === "beta").length,
      comingSoon: integrations.filter((item) => item.status === "coming_soon").length,
    };
  }, [integrations]);

  const connectedPreviewCards = useMemo(() => {
    return integrations
      .filter((item) => item.status === "connected")
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.previewTitle,
        body: item.previewBody,
        count: connectedPreviewCounts[item.id] ?? 0,
      }));
  }, [integrations, connectedPreviewCounts]);

  function openConnectModal() {
    setPreviewMessage("");
    setForm({
      workspace: "",
      apiKey: "",
      webhookUrl: "",
      audience: "",
      syncMode: "",
    });
    setIsModalOpen(true);
  }

  function closeConnectModal() {
    setIsModalOpen(false);
  }

  function handleConnect() {
    if (selected.status === "coming_soon") {
      setPreviewMessage(`${selected.name} is staged as a future connector in this showable build.`);
      setIsModalOpen(false);
      return;
    }

    setProviderStatuses((current) => ({
      ...current,
      [selected.id]: "connected",
    }));

    setConnectedPreviewCounts((current) => ({
      ...current,
      [selected.id]: current[selected.id] ?? (selected.id === "actblue" ? 142 : selected.id === "mailchimp" ? 3 : selected.id === "meta" ? 4 : 2),
    }));

    setPreviewMessage(`${selected.name} connected. Aether can now surface ${selected.previewTitle.toLowerCase()}.`);
    setIsModalOpen(false);
  }

  function handlePreviewSync() {
    setPreviewMessage(`${selected.name} preview: ${selected.previewBody}`);
  }

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
                Connect the tools around the campaign.
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                This is where Aether expands from a campaign workspace into a campaign operating system.
                Connect fundraising, communications, ads, and workspace tools so execution stays in one place.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
            Start with high-visibility connections first. The goal here is not everything at once —
            it is showing that Aether can sit above the stack.
          </div>
        </div>
      </section>

      {previewMessage ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
          {previewMessage}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">Connected</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-900">{summary.connected}</p>
          <p className="mt-2 text-sm text-emerald-800">Live workspace connections</p>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-sky-800">Available</p>
          <p className="mt-3 text-3xl font-semibold text-sky-900">{summary.available}</p>
          <p className="mt-2 text-sm text-sky-800">Ready to wire next</p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-amber-800">Beta Hooks</p>
          <p className="mt-3 text-3xl font-semibold text-amber-900">{summary.beta}</p>
          <p className="mt-2 text-sm text-amber-800">Early connector surfaces</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Coming Soon</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.comingSoon}</p>
          <p className="mt-2 text-sm text-slate-600">Next visibility layers</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Available Connections</p>
              <h2 className="text-xl font-semibold text-slate-900">Choose the next system to wire</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {integrations.length} providers
            </div>
          </div>

          <div className="space-y-4">
            {integrations.map((item) => {
              const Icon = integrationIcon(item.id);
              const isActive = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <Icon className="h-5 w-5 text-slate-700" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{item.name}</p>

                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>

                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${categoryTone(item.category)}`}>
                            {categoryLabel(item.category)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-700">{item.value}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    </div>

                    <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Selected Integration</p>
                <h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2>
              </div>

              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(selected.status)}`}>
                {statusLabel(selected.status)}
              </span>
            </div>

            <p className="text-sm text-slate-600">{selected.description}</p>

            <div className="mt-5 space-y-3">
              {selected.capabilities.map((capability) => (
                <div
                  key={capability}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{capability}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={openConnectModal}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {selected.cta}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handlePreviewSync}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Preview Sync
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Connected Data Preview
            </p>

            <div className="mt-4 space-y-3">
              {connectedPreviewCards.length === 0 ? (
                <div className="rounded-2xl border border-white/70 bg-white p-4 text-sm text-slate-600">
                  No live connectors yet. Use one of the connection modals to turn this into a real platform moment.
                </div>
              ) : (
                connectedPreviewCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-white/70 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                        {card.count}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{card.body}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <PlugZap className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Integrations Rule</h2>
                <p className="mt-2 text-sm text-amber-800">
                  Start with the connections that make Aether feel larger than a dashboard.
                  The point is not hooking up everything at once — it is proving that Aether can sit above the campaign stack.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Connect Provider</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{selected.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  This is a lightweight connection flow for the showable build. It gives Aether a real platform feel without overbuilding the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={closeConnectModal}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-900">{modalFields.workspaceLabel}</label>
                <input
                  value={form.workspace}
                  onChange={(e) => setForm((current) => ({ ...current, workspace: e.target.value }))}
                  placeholder={modalFields.workspacePlaceholder}
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900">{modalFields.keyLabel}</label>
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm((current) => ({ ...current, apiKey: e.target.value }))}
                  placeholder={modalFields.keyPlaceholder}
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-900">{modalFields.extraLabel}</label>
                <input
                  value={form.webhookUrl}
                  onChange={(e) => setForm((current) => ({ ...current, webhookUrl: e.target.value }))}
                  placeholder={modalFields.extraPlaceholder}
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">What Aether will show after connection</p>
              <p className="mt-1">{selected.previewBody}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConnect}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Confirm Connection
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={closeConnectModal}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
