"use client";

import Link from "next/link";
import { DragEvent, Fragment, useEffect, useMemo, useState } from "react";
import { autoMapFields } from "@/lib/ingestion/mapping";
import { parseCSV } from "@/lib/ingestion/parser";

type PipelineFilter =
  | "all"
  | "needs_follow_up"
  | "awaiting_reply"
  | "demo_scheduled"
  | "interested"
  | "customers"
  | "archived";

type Campaign = {
  id?: string;
  campaign: string;
  contact: string;
  race: string;
  state: string;
  emails: number;
  owner: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  replyReceived: boolean;
  demoScheduled: boolean;
  interested: boolean;
  customer: boolean;
  archived: boolean;
  needsFollowUp: boolean;
  lastActivity: string;
};

type ParsedCampaignCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

function ProgressDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-3 w-3 rounded-full border ${
        active
          ? "border-slate-950 bg-slate-950"
          : "border-slate-300 bg-white"
      }`}
    />
  );
}

function BooleanStatus({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export default function TeamAetherSalesPage() {
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<PipelineFilter>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCampaignCsv | null>(null);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState("");
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [pageError, setPageError] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  function mapApiCampaign(row: Record<string, unknown>): Campaign {
    return {
      id: typeof row.id === "string" ? row.id : undefined,
      campaign: String(row.campaign || ""),
      contact: String(row.contact || ""),
      race: String(row.race || ""),
      state: String(row.state || ""),
      emails: Number(row.emails_sent || 0),
      owner: String(row.owner || ""),
      email: String(row.email || ""),
      phone: String(row.phone || ""),
      website: String(row.website || ""),
      notes: String(row.notes || ""),
      replyReceived: Boolean(row.reply_received),
      demoScheduled: Boolean(row.demo_scheduled),
      interested: Boolean(row.interested),
      customer: Boolean(row.customer),
      archived: Boolean(row.archived),
      needsFollowUp: Boolean(row.needs_follow_up),
      lastActivity: String(row.last_activity || "Imported"),
    };
  }

  async function loadCampaigns() {
    try {
      setLoadingCampaigns(true);
      setPageError("");

      const response = await fetch("/api/team-aether/sales-pipeline", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to load campaigns.");
      }

      const loadedCampaigns = Array.isArray(result.campaigns)
        ? result.campaigns.map((row: Record<string, unknown>) =>
            mapApiCampaign(row)
          )
        : [];

      setCampaigns(loadedCampaigns);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load campaigns."
      );
    } finally {
      setLoadingCampaigns(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function normalizeFieldName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function getRowValue(
    row: Record<string, string>,
    canonicalNames: string[],
    headerAliases: string[]
  ) {
    const normalizedCanonicalNames = canonicalNames.map(normalizeFieldName);
    const normalizedAliases = headerAliases.map(normalizeFieldName);

    const mappedHeader = Object.keys(csvMapping).find((header) =>
      normalizedCanonicalNames.includes(
        normalizeFieldName(String(csvMapping[header] || ""))
      )
    );

    if (mappedHeader && row[mappedHeader] !== undefined) {
      return String(row[mappedHeader] || "").trim();
    }

    const directHeader = Object.keys(row).find((header) =>
      normalizedAliases.includes(normalizeFieldName(header))
    );

    return directHeader ? String(row[directHeader] || "").trim() : "";
  }

  function resetImportModal() {
    setSelectedFile(null);
    setParsedCsv(null);
    setCsvMapping({});
    setImportError("");
  }

  function closeImportModal() {
    setShowImportModal(false);
    resetImportModal();
  }

  function readCampaignCsv(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportError("Please select a CSV file.");
      setSelectedFile(null);
      setParsedCsv(null);
      setCsvMapping({});
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = String(event.target?.result || "");
        const parsed = parseCSV(csvText) as ParsedCampaignCsv;

        if (!parsed.headers?.length) {
          throw new Error("The CSV does not contain a header row.");
        }

        if (!parsed.rows?.length) {
          throw new Error("The CSV does not contain any campaign rows.");
        }

        setSelectedFile(file);
        setParsedCsv(parsed);
        setCsvMapping(autoMapFields(parsed.headers));
        setImportError("");
      } catch (error) {
        setSelectedFile(null);
        setParsedCsv(null);
        setCsvMapping({});
        setImportError(
          error instanceof Error ? error.message : "Unable to read the CSV."
        );
      }
    };

    reader.onerror = () => {
      setSelectedFile(null);
      setParsedCsv(null);
      setCsvMapping({});
      setImportError("Unable to read the selected CSV.");
    };

    reader.readAsText(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      readCampaignCsv(file);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      readCampaignCsv(file);
    }
  }

  async function handleCampaignImport() {
    if (!parsedCsv) {
      setImportError("Choose a CSV file before importing.");
      return;
    }

    const importedCampaigns = parsedCsv.rows
      .map((row) => {
        const campaignName = getRowValue(
          row,
          ["campaign", "campaign_name"],
          ["Campaign", "Campaign Name"]
        );

        return {
          campaign: campaignName,
          contact: getRowValue(
            row,
            ["contact", "contact_name", "full_name"],
            ["Contact", "Contact Name", "Full Name"]
          ),
          email: getRowValue(
            row,
            ["email", "email_address"],
            ["Email", "Email Address"]
          ),
          phone: getRowValue(
            row,
            ["phone", "phone_number", "mobile"],
            ["Phone", "Phone Number", "Mobile"]
          ),
          race: getRowValue(
            row,
            ["race", "district", "office"],
            ["Race", "District", "Office"]
          ),
          state: getRowValue(
            row,
            ["state", "state_code"],
            ["State", "State Code"]
          ),
          website: getRowValue(
            row,
            ["campaign_website", "website", "url"],
            ["Campaign Website", "Website", "URL"]
          ),
          owner: "Tyler",
          emails_sent: 0,
          notes: "",
          reply_received: false,
          demo_scheduled: false,
          interested: false,
          customer: false,
          archived: false,
          needs_follow_up: true,
          last_activity: "Imported",
        };
      })
      .filter((campaign) => campaign.campaign.length > 0);

    if (!importedCampaigns.length) {
      setImportError(
        'No campaigns were imported. Make sure the CSV includes a "Campaign" column.'
      );
      return;
    }

    try {
      setImportError("");

      const response = await fetch("/api/team-aether/sales-pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaigns: importedCampaigns,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to import campaigns.");
      }

      const firstCampaignName = importedCampaigns[0].campaign;

      await loadCampaigns();
      setExpandedCampaign(firstCampaignName);
      setActiveFilter("all");
      closeImportModal();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to import campaigns."
      );
    }
  }

  function downloadCsvTemplate() {
    const template =
      "Campaign,Contact,Email,Phone,Race,State,Campaign Website\\n";

    const blob = new Blob([template], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "team-aether-sales-pipeline-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function patchCampaign(id: string | undefined, updates: Record<string, unknown>) {
    if (!id) return;

    const response = await fetch("/api/team-aether/sales-pipeline", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, updates }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Failed to update campaign.");
    }

    await loadCampaigns();
  }

  async function handleEmailSent(campaign: Campaign) {
    const nextEmails = Math.min(campaign.emails + 1, 3);

    await patchCampaign(campaign.id, {
      emails_sent: nextEmails,
      needs_follow_up:
        !campaign.replyReceived &&
        !campaign.customer &&
        !campaign.archived &&
        nextEmails < 3,
      last_activity: "Just now",
    });
  }

  async function handleReply(campaign: Campaign) {
    await patchCampaign(campaign.id, {
      reply_received: !campaign.replyReceived,
      needs_follow_up: campaign.replyReceived && !campaign.archived,
      last_activity: "Just now",
    });
  }

  async function handleDemo(campaign: Campaign) {
    await patchCampaign(campaign.id, {
      demo_scheduled: !campaign.demoScheduled,
      needs_follow_up: false,
      last_activity: "Just now",
    });
  }

  async function handleInterested(campaign: Campaign) {
    await patchCampaign(campaign.id, {
      interested: !campaign.interested,
      needs_follow_up: false,
      last_activity: "Just now",
    });
  }

  async function handleArchive(campaign: Campaign) {
    await patchCampaign(campaign.id, {
      archived: !campaign.archived,
      needs_follow_up: campaign.archived
        ? !campaign.replyReceived && !campaign.customer
        : false,
      last_activity: "Just now",
    });
  }

  async function handleOwnerChange(campaign: Campaign, owner: string) {
    await patchCampaign(campaign.id, {
      owner,
      last_activity: "Just now",
    });
  }

  const metrics = useMemo(
    () => ({
      needsFollowUp: campaigns.filter(
        (campaign) => campaign.needsFollowUp && !campaign.archived
      ).length,
      awaitingReply: campaigns.filter(
        (campaign) =>
          campaign.emails > 0 &&
          !campaign.replyReceived &&
          !campaign.customer &&
          !campaign.archived
      ).length,
      upcomingDemos: campaigns.filter(
        (campaign) => campaign.demoScheduled && !campaign.customer
      ).length,
      customers: campaigns.filter((campaign) => campaign.customer).length,
    }),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch =
        !normalizedSearch ||
        campaign.campaign.toLowerCase().includes(normalizedSearch) ||
        campaign.contact.toLowerCase().includes(normalizedSearch) ||
        campaign.race.toLowerCase().includes(normalizedSearch) ||
        campaign.state.toLowerCase().includes(normalizedSearch) ||
        campaign.owner.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "needs_follow_up" &&
          campaign.needsFollowUp &&
          !campaign.archived) ||
        (activeFilter === "awaiting_reply" &&
          campaign.emails > 0 &&
          !campaign.replyReceived &&
          !campaign.customer &&
          !campaign.archived) ||
        (activeFilter === "demo_scheduled" &&
          campaign.demoScheduled &&
          !campaign.customer &&
          !campaign.archived) ||
        (activeFilter === "interested" &&
          campaign.interested &&
          !campaign.customer &&
          !campaign.archived) ||
        (activeFilter === "customers" && campaign.customer) ||
        (activeFilter === "archived" && campaign.archived);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, campaigns, search]);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                Team Aether
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight lg:text-5xl">
                Sales Pipeline
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Track outreach, demos and customers from one operational page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-[520px]">
              {[
                { label: "Dashboard", href: "/team-aether/dashboard" },
                {
                  label: "Organizations",
                  href: "/team-aether/organizations",
                },
                { label: "Provisioning", href: "/team-aether" },
                {
                  label: "Sales Pipeline",
                  href: "/team-aether/sales-pipeline",
                },
                {
                  label: "Email Templates",
                  href: "/team-aether/email-templates",
                },
                { label: "Support", href: "/team-aether/support-portal" },
                { label: "Logout", href: "/logout" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.label === "Sales Pipeline"
                      ? "rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-center text-base font-extrabold !text-black shadow-sm"
                      : "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-white transition hover:bg-white/20"
                  }
                  style={item.label === "Sales Pipeline" ? { color: "#000000" } : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  resetImportModal();
                  setShowImportModal(true);
                }}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Import Campaigns
              </button>

              <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Add Campaign
              </button>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 lg:ml-auto lg:w-96"
              placeholder="Search campaign, contact, race, state or owner..."
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                Needs Follow-up
              </p>
              <p className="mt-3 text-3xl font-semibold text-amber-950">
                {metrics.needsFollowUp}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Awaiting Reply
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metrics.awaitingReply}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Upcoming Demos
              </p>
              <p className="mt-3 text-3xl font-semibold text-blue-950">
                {metrics.upcomingDemos}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Customers
              </p>
              <p className="mt-3 text-3xl font-semibold text-emerald-950">
                {metrics.customers}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["needs_follow_up", "Needs Follow-up"],
                ["awaiting_reply", "Awaiting Reply"],
                ["demo_scheduled", "Demo Scheduled"],
                ["interested", "Interested"],
                ["customers", "Customers"],
                ["archived", "Archived"],
              ] as const
            ).map(([value, label]) => {
              const active = activeFilter === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loadingCampaigns ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading campaigns...
            </div>
          ) : pageError ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
              {pageError}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No campaigns match the current search and filter.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Campaign</th>
                      <th className="px-5 py-4">Emails</th>
                      <th className="px-5 py-4">Reply</th>
                      <th className="px-5 py-4">Demo</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4">Last Activity</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredCampaigns.map((campaign) => {
                      const expanded =
                        expandedCampaign === campaign.campaign;

                      return (
                        <Fragment key={campaign.id || campaign.campaign}>
                          <tr
                            onClick={() =>
                              setExpandedCampaign((current) =>
                                current === campaign.campaign
                                  ? null
                                  : campaign.campaign
                              )
                            }
                            className={`cursor-pointer transition ${
                              expanded
                                ? "bg-slate-100"
                                : "bg-white hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 text-xs text-slate-400">
                                  {expanded ? "▼" : "▶"}
                                </span>

                                <div>
                                  <p className="font-semibold text-slate-950">
                                    {campaign.campaign}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {campaign.race} · {campaign.state}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                  {[1, 2, 3].map((step) => (
                                    <ProgressDot
                                      key={step}
                                      active={campaign.emails >= step}
                                    />
                                  ))}
                                </div>

                                <span className="text-xs font-semibold text-slate-600">
                                  {campaign.emails}/3
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <BooleanStatus
                                active={campaign.replyReceived}
                                activeLabel="Received"
                                inactiveLabel="Waiting"
                              />
                            </td>

                            <td className="px-5 py-4">
                              <BooleanStatus
                                active={campaign.demoScheduled}
                                activeLabel="Scheduled"
                                inactiveLabel="Not Set"
                              />
                            </td>

                            <td className="px-5 py-4">
                              <BooleanStatus
                                active={campaign.customer}
                                activeLabel="Customer"
                                inactiveLabel="Open"
                              />
                            </td>

                            <td className="px-5 py-4 font-medium text-slate-700">
                              {campaign.owner}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {campaign.lastActivity}
                            </td>
                          </tr>

                          {expanded ? (
                            <tr className="bg-slate-50">
                              <td colSpan={7} className="p-6">
                                <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                                  <div>
                                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                                      Campaign Details
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                      {[
                                        ["Contact", campaign.contact],
                                        ["Email", campaign.email],
                                        ["Phone", campaign.phone],
                                        ["Website", campaign.website],
                                        ["Race", campaign.race],
                                        ["State", campaign.state],
                                        ["Owner", ""],
                                      ].map(([label, value]) => (
                                        <div
                                          key={label}
                                          className="rounded-2xl border border-slate-200 bg-white p-4"
                                        >
                                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            {label}
                                          </p>
                                          {label === "Owner" ? (
                                            <select
                                              value={campaign.owner}
                                              onClick={(e)=>e.stopPropagation()}
                                              onChange={(e)=>handleOwnerChange(campaign,e.target.value)}
                                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                                            >
                                              <option>Tyler</option>
                                              <option>Mike</option>
                                              <option>Robby</option>
                                            </select>
                                          ) : (
                                          <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                                            {value}
                                          </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                                      Internal Progress
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                          Emails
                                        </p>
                                        <p className="mt-2 text-lg font-semibold">
                                          {campaign.emails}/3
                                        </p>
                                      </div>

                                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                          Reply
                                        </p>
                                        <p className="mt-2 text-sm font-semibold">
                                          {campaign.replyReceived
                                            ? "Received"
                                            : "Waiting"}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                          Demo
                                        </p>
                                        <p className="mt-2 text-sm font-semibold">
                                          {campaign.demoScheduled
                                            ? "Scheduled"
                                            : "Not Set"}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                          Interested
                                        </p>
                                        <p className="mt-2 text-sm font-semibold">
                                          {campaign.interested ? "Yes" : "No"}
                                        </p>
                                      </div>

                                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                          Customer
                                        </p>
                                        <p className="mt-2 text-sm font-semibold">
                                          {campaign.customer ? "Yes" : "No"}
                                        </p>
                                      </div>
                                    </div>

                                    <textarea
                                      defaultValue={campaign.notes}
                                      className="mt-4 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-slate-400"
                                      placeholder="Internal notes..."
                                    />

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                      <button
                                        type="button"
                                        disabled={
                                          campaign.emails >= 3 ||
                                          campaign.archived
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleEmailSent(campaign);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                      >
                                        {campaign.emails >= 3
                                          ? "3 Emails Sent"
                                          : "+ Email Sent"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={campaign.archived}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleReply(campaign);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                      >
                                        {campaign.replyReceived
                                          ? "Undo Reply"
                                          : "Mark Reply"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={campaign.archived}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDemo(campaign);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                      >
                                        {campaign.demoScheduled
                                          ? "Unschedule Demo"
                                          : "Schedule Demo"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={campaign.archived}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleInterested(campaign);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                      >
                                        {campaign.interested
                                          ? "Remove Interested"
                                          : "Mark Interested"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleArchive(campaign);
                                        }}
                                        className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                                          campaign.archived
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                                        }`}
                                      >
                                        {campaign.archived
                                          ? "Restore Campaign"
                                          : "Archive"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl">
              <h2 className="text-3xl font-bold">Import Campaigns</h2>
              <p className="mt-2 text-slate-500">Import campaign opportunities from a CSV file.</p>

              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 p-10 text-center transition hover:border-slate-400 hover:bg-slate-50"
              >
                <p className="font-semibold">Drag & Drop CSV Here</p>
                <p className="my-4 text-slate-500">or</p>
                <label className="inline-flex cursor-pointer rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
                  Choose CSV File
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {parsedCsv ? (
                  <p className="mt-4 text-sm font-medium text-emerald-700">
                    {parsedCsv.rows.length} campaign row
                    {parsedCsv.rows.length === 1 ? "" : "s"} detected
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p><strong>Selected File:</strong> {selectedFile?.name || "None"}</p>
                <p className="mt-3 font-semibold">Expected Columns</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ Campaign</li>
                  <li>✓ Contact</li>
                  <li>✓ Email</li>
                  <li>✓ Phone</li>
                  <li>✓ Race</li>
                  <li>✓ State</li>
                  <li>✓ Campaign Website</li>
                </ul>

                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm transition hover:bg-white"
                >
                  Download CSV Template
                </button>
              </div>

              {importError ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {importError}
                </div>
              ) : null}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={closeImportModal}
                  className="rounded-2xl border border-slate-300 px-5 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCampaignImport}
                  disabled={!parsedCsv}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Import Campaigns
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
