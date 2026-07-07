"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { autoMapFields } from "@/lib/ingestion/mapping";
import { parseCSV } from "@/lib/ingestion/parser";
import { transformToContacts, transformToFecRecords } from "@/lib/ingestion/activate";

type ImportSummaryItem = {
  name: string;
  count: number;
};

type ImportResult = {
  success?: boolean;
  source?: string;
  count?: number;
  matchedCount?: number;
  updatedContacts?: number;
  listsCreated?: number;
  listSummary?: ImportSummaryItem[];
};

type OperationalRoutingType =
  | "general_outreach"
  | "field_turf"
  | "walk_packet"
  | "persuasion_universe"
  | "follow_up_queue"
  | "print_universe"
  | "literature_drop";

type OperationalRoutingOption = {
  value: OperationalRoutingType;
  label: string;
  description: string;
  defaultListName: string;
  routeLabel: string;
};

const operationalRoutingOptions: OperationalRoutingOption[] = [
  { value: "general_outreach", label: "General Outreach", description: "Use this upload as a general contact pool for standard outreach work.", defaultListName: "General Outreach Pool", routeLabel: "Outreach" },
  { value: "field_turf", label: "Field Turf", description: "Seed a turf universe that Field Focus can recognize and deploy.", defaultListName: "Field Turf Universe", routeLabel: "Field" },
  { value: "walk_packet", label: "Walk Packet", description: "Create a walkable field packet for canvass execution.", defaultListName: "Weekend Walk Packet", routeLabel: "Field" },
  { value: "persuasion_universe", label: "Persuasion Universe", description: "Seed a persuasion target universe for field and follow-up routing.", defaultListName: "Persuasion Universe", routeLabel: "Field" },
  { value: "follow_up_queue", label: "Follow-Up Queue", description: "Create a follow-up queue for contacts that need a next touch after field activity.", defaultListName: "Field Follow-Up Queue", routeLabel: "Field Follow-Up" },
  { value: "print_universe", label: "Print Universe", description: "Seed a print-ready universe that can later feed mail or literature work.", defaultListName: "Print Universe", routeLabel: "Print" },
  { value: "literature_drop", label: "Literature Drop", description: "Create a literature drop route for future print and field handoff.", defaultListName: "Literature Drop Route", routeLabel: "Print + Field" },
];

const operationalTagOptions = [
  "persuasion",
  "turnout",
  "walk",
  "volunteer",
  "print",
  "lit-drop",
  "high-priority",
];

function IngestPageContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "outreach";

  const [data, setData] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [listsCreated, setListsCreated] = useState(0);
  const [listSummary, setListSummary] = useState<ImportSummaryItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [ownerAssignment, setOwnerAssignment] = useState("");
  const [operationalType, setOperationalType] =
    useState<OperationalRoutingType>("general_outreach");
  const [customListName, setCustomListName] = useState("");
  const [routingTags, setRoutingTags] = useState<string[]>([]);

  function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event: any) => {
      const text = event.target?.result;
      const parsed = parseCSV(text);

      setData(parsed);
      setMapping(autoMapFields(parsed.headers));
      setErrorMessage("");
      setImportSuccess(false);
      setImportCount(0);
      setListsCreated(0);
      setListSummary([]);
      setImportResult(null);
      setCustomListName("");
      setRoutingTags([]);
    };

    reader.readAsText(file);
  }

  const selectedOperationalOption = useMemo(() => {
    return (
      operationalRoutingOptions.find((option) => option.value === operationalType) ||
      operationalRoutingOptions[0]
    );
  }, [operationalType]);

  const resolvedOperationalListName = useMemo(() => {
    const customName = customListName.trim();

    if (customName) {
      return customName;
    }

    return selectedOperationalOption.defaultListName;
  }, [customListName, selectedOperationalOption.defaultListName]);

  function toggleRoutingTag(tag: string) {
    setRoutingTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  async function handleImport() {
    if (!data) return;

    setErrorMessage("");
    setImportSuccess(false);
    setImportCount(0);
    setListsCreated(0);
    setListSummary([]);
    setImportResult(null);

    const contacts =
      source === "fec"
        ? []
        : transformToContacts(data.rows, mapping).map((contact: any) => ({
            ...contact,
            owner_name: ownerAssignment.trim() || contact.owner_name || null,
          }));

    const fecRecords =
      source === "fec"
        ? transformToFecRecords(data.rows, mapping)
        : [];

    try {
      const res = await fetch("/api/actions/ingest/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts,
          fecRecords,
          suggestedLists: routingListPayload,
          source,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        const message = result?.error || "Import failed";
        setErrorMessage(message);
        alert(message);
        return;
      }

      setImportSuccess(true);
      setImportCount(result.count || 0);
      setListsCreated(result.listsCreated || 0);
      setListSummary(result.listSummary || []);
      setImportResult(result || null);

      alert(source === "fec" ? `Imported ${result.count} FEC records` : `Imported ${result.count} contacts`);
    } catch (err: any) {
      const message = err?.message || "Import failed";
      setErrorMessage(message);
      alert(message);
    }
  }

  const interpretation = useMemo(() => {
    if (!data?.rows?.length) return null;

    const rows = data.rows as Record<string, string>[];
    const headers = (data.headers as string[]).map((header) =>
      header.toLowerCase()
    );

    const hasPhoneHeader = headers.some((header) =>
      ["phone", "phone_number", "mobile", "cell"].includes(header)
    );

    const hasEmailHeader = headers.some((header) =>
      ["email", "email_address"].includes(header)
    );

    const hasAmountHeader = headers.some((header) =>
      [
        "amount",
        "donation",
        "donation_total",
        "contribution",
        "contribution_amount",
      ].includes(header)
    );

    const normalizedRows = rows.map((row) => {
      const normalized: Record<string, string> = {};

      Object.entries(row).forEach(([key, value]) => {
        normalized[key.toLowerCase()] = String(value || "").trim();
      });

      return normalized;
    });

    const totalContacts = normalizedRows.length;

    const contactsWithPhone = normalizedRows.filter((row) =>
      Object.entries(row).some(
        ([key, value]) =>
          ["phone", "phone_number", "mobile", "cell"].includes(key) &&
          value.length > 0
      )
    ).length;

    const contactsWithEmail = normalizedRows.filter((row) =>
      Object.entries(row).some(
        ([key, value]) =>
          ["email", "email_address"].includes(key) && value.length > 0
      )
    ).length;

    const contactsMissingPhone = totalContacts - contactsWithPhone;
    const contactsMissingEmail = totalContacts - contactsWithEmail;

    const likelyDonors = normalizedRows.filter((row) =>
      Object.entries(row).some(([key, value]) => {
        const numericValue = Number(value);
        return (
          [
            "amount",
            "donation",
            "donation_total",
            "contribution",
            "contribution_amount",
          ].includes(key) &&
          !Number.isNaN(numericValue) &&
          numericValue > 0
        );
      })
    ).length;

    const highValueTargets = normalizedRows.filter((row) =>
      Object.entries(row).some(([key, value]) => {
        const numericValue = Number(value);
        return (
          [
            "amount",
            "donation",
            "donation_total",
            "contribution",
            "contribution_amount",
          ].includes(key) &&
          !Number.isNaN(numericValue) &&
          numericValue >= 250
        );
      })
    ).length;

    const possibleDuplicates =
      new Set(
        normalizedRows
          .map(
            (row) =>
              row.phone ||
              row.phone_number ||
              row.email ||
              row.email_address ||
              ""
          )
          .filter(Boolean)
      ).size < totalContacts
        ? totalContacts -
          new Set(
            normalizedRows
              .map(
                (row) =>
                  row.phone ||
                  row.phone_number ||
                  row.email ||
                  row.email_address ||
                  ""
              )
              .filter(Boolean)
          ).size
        : 0;

    const suggestedLists =
      (
        source === "fec"
          ? []
          : source === "finance"
          ? [
              likelyDonors > 0 ? "Likely Donors" : null,
              highValueTargets > 0 ? "High Value Donors" : null,
              contactsMissingPhone > 0 ? "Missing Phone Numbers" : null,
              "General Finance Follow-Up",
            ]
          : source === "field"
          ? [
              contactsMissingPhone > 0 ? "Field Missing Phone Numbers" : null,
              contactsMissingEmail > 0 ? "Field Missing Email Addresses" : null,
              "Field Turf Universe",
            ]
          : source === "print"
          ? [
              contactsMissingEmail > 0 ? "Print Missing Email Addresses" : null,
              "Print Universe",
            ]
          : [
              contactsMissingPhone > 0 ? "Missing Phone Numbers" : null,
              contactsMissingEmail > 0 ? "Missing Email Addresses" : null,
              highValueTargets > 0 ? "Priority Outreach Targets" : null,
              "General Outreach Pool",
            ]
      ).filter(Boolean) as string[];

    return {
      totalContacts,
      contactsWithPhone,
      contactsWithEmail,
      contactsMissingPhone,
      contactsMissingEmail,
      likelyDonors,
      highValueTargets,
      possibleDuplicates,
      hasPhoneHeader,
      hasEmailHeader,
      hasAmountHeader,
      suggestedLists,
    };
  }, [data, source]);

  const routingListPayload = useMemo(() => {
    if (source === "fec") return [];

    const baseLists = interpretation?.suggestedLists || [];
    const operationalList = resolvedOperationalListName.trim();
    const tagLists = routingTags.map((tag) => {
      if (tag === "lit-drop") return "Literature Drop Route";
      if (tag === "high-priority") return "High Priority Targets";

      return `${tag
        .split("-")
        .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
        .join(" ")} Segment`;
    });

    return Array.from(
      new Set([operationalList, ...tagLists, ...baseLists].filter(Boolean))
    );
  }, [interpretation?.suggestedLists, resolvedOperationalListName, routingTags, source]);

  const systemImpact = useMemo(() => {
    if (!importSuccess || !interpretation) return null;

    const topList = listSummary[0] || null;
    const recommendedListName =
      topList?.name ||
      (source === "finance"
        ? "High Value Donors"
        : source === "fec"
        ? "Finance donor intelligence"
        : "Priority Outreach Targets");

    const issueHighlights = [
      interpretation.contactsMissingPhone > 0
        ? `${interpretation.contactsMissingPhone} contact${
            interpretation.contactsMissingPhone === 1 ? "" : "s"
          } missing phone numbers`
        : null,
      interpretation.contactsMissingEmail > 0
        ? `${interpretation.contactsMissingEmail} contact${
            interpretation.contactsMissingEmail === 1 ? "" : "s"
          } missing email addresses`
        : null,
      interpretation.possibleDuplicates > 0
        ? `${interpretation.possibleDuplicates} possible duplicate record${
            interpretation.possibleDuplicates === 1 ? "" : "s"
          } detected before import`
        : null,
    ].filter(Boolean) as string[];

    const listAssignmentCount = listSummary.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      recommendedListName,
      issueHighlights,
      matchedCount: importResult?.matchedCount ?? 0,
      updatedContacts: importResult?.updatedContacts ?? 0,
      highValueTargets: interpretation.highValueTargets,
      listAssignmentCount,
    };
  }, [importSuccess, interpretation, importResult, listSummary, source]);

  const primaryActionLabel =
    source === "finance"
      ? "Start Donor Follow-Up"
      : source === "fec"
      ? "Open Finance Focus"
      : source === "field"
      ? "Open Field Focus"
      : source === "print"
      ? "Open Print"
      : "Start Outreach";

  const successBody =
    source === "finance"
      ? "Aether pushed these records into your live contact system. Start donor follow-up now, review contacts directly, or inspect lists next."
      : source === "fec"
      ? "Aether imported FEC records, attempted contact matching, and updated donor intelligence signals."
      : source === "field"
      ? "Aether pushed these records into your live contact system and seeded operational field lists for Focus routing."
      : source === "print"
      ? "Aether pushed these records into your live contact system and seeded print-ready list infrastructure."
      : "Aether pushed these records into your live contact system. Start outreach now, review contacts directly, or inspect lists next.";

  const primaryActionHref =
    source === "finance"
      ? "/dashboard/outreach?channel=call"
      : source === "fec"
      ? "/dashboard/finance"
      : source === "field"
      ? "/dashboard/field/focus"
      : source === "print"
      ? "/dashboard/print"
      : "/dashboard/outreach";

  const pageTitle =
    source === "finance"
      ? "Finance Data Ingestion"
      : source === "fec"
      ? "FEC Donor Intelligence Ingestion"
      : source === "field"
      ? "Field Data Ingestion"
      : source === "print"
      ? "Print Data Ingestion"
      : "Outreach Data Ingestion";

  const pageDescription =
    source === "field"
      ? "Upload contact or turf data, segment it into operational lists, then route it into Field Focus."
      : source === "print"
      ? "Upload contact data, segment it into print-ready universes, then prepare it for downstream print work."
      : "Upload contact data, verify how Aether understands it, then import it into the system.";

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {pageTitle}
        </h1>
        <p className="text-sm text-slate-600">
          {pageDescription}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Upload CSV</p>
            <p className="mt-1 text-sm text-slate-500">
              {source === "fec"
                ? "Upload FEC-style donor contribution files for matching and anomaly detection."
                : source === "field"
                ? "Bring in turf, walk packet, persuasion, or volunteer data and let Aether organize it into execution lists."
                : source === "print"
                ? "Bring in print, literature drop, or mail universe data and let Aether organize it for routing."
                : "Bring in messy outside data and let Aether organize it."}
            </p>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400 hover:bg-slate-100">
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="sr-only"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm transition group-hover:bg-slate-800">
              <Upload className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-900">
              {source === "fec"
                ? "Click here to upload FEC CSV"
                : "Click here to upload contact CSV"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {source === "fec"
                ? "Select a .csv file containing donor contribution records."
                : "Select a .csv file containing voter, donor, volunteer, or outreach contacts."}
            </p>
          </label>
        </div>
      </div>

      {importSuccess ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-800">
                Import Complete
              </p>
              <h2 className="text-2xl font-semibold text-emerald-900">
                {source === "fec"
                  ? `${importCount} FEC record${importCount === 1 ? "" : "s"} imported successfully`
                  : `${importCount} contact${importCount === 1 ? "" : "s"} saved successfully`}
              </h2>
              <p className="max-w-3xl text-sm text-emerald-900/80">
                {successBody}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {source === "fec" ? "FEC Records Imported" : "Contacts Saved"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {importCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {source === "fec" ? "Contacts Matched" : "Lists Ready"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {source === "fec" ? systemImpact?.matchedCount || 0 : listsCreated}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    High Value Signals
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {systemImpact?.highValueTargets || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Data Issues Flagged
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {systemImpact?.issueHighlights.length || 0}
                  </p>
                </div>
              </div>

              {systemImpact ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-900">
                      System Impact
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        {source === "fec"
                          ? `${systemImpact.updatedContacts} contact${
                              systemImpact.updatedContacts === 1 ? "" : "s"
                            } updated with donor intelligence`
                          : `${importCount} contact${
                              importCount === 1 ? "" : "s"
                            } normalized and saved into the contact layer`}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        {source === "fec"
                          ? `${systemImpact.matchedCount} FEC match${
                              systemImpact.matchedCount === 1 ? "" : "es"
                            } created or refreshed`
                          : `${systemImpact.listAssignmentCount} list assignment${
                              systemImpact.listAssignmentCount === 1 ? "" : "s"
                            } prepared for routing`}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        {systemImpact.highValueTargets > 0
                          ? `${systemImpact.highValueTargets} high-value target${
                              systemImpact.highValueTargets === 1 ? "" : "s"
                            } surfaced for downstream execution`
                          : "No high-value donor or priority amount signal detected in this upload"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Recommended Next Move
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Start by reviewing {systemImpact.recommendedListName}. That is the cleanest place to verify the import before tomorrow’s full pressure test.
                    </p>

                    {systemImpact.issueHighlights.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {systemImpact.issueHighlights.slice(0, 3).map((issue) => (
                          <div
                            key={issue}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                          >
                            {issue}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        No obvious cleanup flags surfaced from this upload.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {listSummary.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-900">
                    Smart Assignment Summary
                  </p>

                  <div className="mt-3 space-y-2">
                    {listSummary.map((item) => (
                      <Link
                        key={item.name}
                        href={`/dashboard/lists?name=${encodeURIComponent(item.name)}`}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-slate-600">
                          {item.count} assigned
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryActionHref}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                {primaryActionLabel}
              </Link>

              <Link
                href="/dashboard/contacts"
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
              >
                View Contacts
              </Link>

              <Link
                href="/dashboard/lists"
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
              >
                Review Lists
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {interpretation ? (
        <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-fuchsia-800">
                Aether Interpretation
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-fuchsia-900">
                Here’s what Aether sees in this upload
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-fuchsia-900/80">
                Before import, Aether interprets the data structure, highlights
                likely issues, and suggests how this upload should be organized.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-fuchsia-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Contacts detected
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {interpretation.totalContacts}
                </p>
              </div>

              <div className="rounded-2xl border border-fuchsia-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  With phone
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {interpretation.contactsWithPhone}
                </p>
              </div>

              <div className="rounded-2xl border border-fuchsia-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  With email
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {interpretation.contactsWithEmail}
                </p>
              </div>

              <div className="rounded-2xl border border-fuchsia-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  High value targets
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {interpretation.highValueTargets}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">
                  Signal readout
                </p>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {interpretation.hasPhoneHeader
                      ? `${interpretation.contactsMissingPhone} contact${
                          interpretation.contactsMissingPhone === 1 ? "" : "s"
                        } missing phone numbers`
                      : "No phone field detected in this upload"}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {interpretation.hasEmailHeader
                      ? `${interpretation.contactsMissingEmail} contact${
                          interpretation.contactsMissingEmail === 1 ? "" : "s"
                        } missing email addresses`
                      : "No email field detected in this upload"}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {interpretation.hasAmountHeader
                      ? `${interpretation.likelyDonors} likely donor record${
                          interpretation.likelyDonors === 1 ? "" : "s"
                        } detected`
                      : "No donation or contribution field detected"}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {interpretation.possibleDuplicates > 0
                      ? `${interpretation.possibleDuplicates} possible duplicate record${
                          interpretation.possibleDuplicates === 1 ? "" : "s"
                        } detected`
                      : "No obvious duplicates detected in this upload"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">
                  Suggested lists
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Based on the uploaded structure and detected signals.
                </p>

                <div className="mt-4 space-y-2">
                  {interpretation.suggestedLists.map((listName) => (
                    <div
                      key={listName}
                      className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-sm font-medium text-fuchsia-900"
                    >
                      {listName}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
            <pre className="mt-4 rounded-2xl bg-slate-100 p-4 text-xs text-slate-700">
              {JSON.stringify(data.rows.slice(0, 5), null, 2)}
            </pre>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Field Mapping
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review these before import. Blank fields will be ignored.
            </p>

            <div className="mt-5 space-y-3">
              {data.headers.map((header: string) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="w-44 text-sm font-medium text-slate-700">
                    {header}
                  </span>

                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={mapping[header] || ""}
                    onChange={(e) =>
                      setMapping({
                        ...mapping,
                        [header]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Owner Assignment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign imported contacts to an owner before they enter the system.
            </p>

            <div className="mt-5">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={ownerAssignment}
                onChange={(e) => setOwnerAssignment(e.target.value)}
                placeholder="e.g. Finance Director, Outreach Lead, Tyler"
              />
            </div>
          </section>

          {source !== "fec" ? (
            <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
              <div className="space-y-2">
                <p className="text-sm font-medium text-sky-800">
                  Operational Routing
                </p>
                <h2 className="text-2xl font-semibold text-sky-950">
                  Segment this upload before it enters Aether
                </h2>
                <p className="max-w-3xl text-sm text-sky-900/80">
                  Choose the operational container this upload should create.
                  Field Focus and future Print routing can consume these list
                  names without needing a separate data path.
                </p>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-sky-200 bg-white p-5">
                  <label className="text-sm font-medium text-slate-900">
                    Operational Type
                  </label>

                  <select
                    className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={operationalType}
                    onChange={(e) =>
                      setOperationalType(e.target.value as OperationalRoutingType)
                    }
                  >
                    {operationalRoutingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <p className="mt-3 text-sm text-slate-600">
                    {selectedOperationalOption.description}
                  </p>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-slate-900">
                      Operational List Name
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={customListName}
                      onChange={(e) => setCustomListName(e.target.value)}
                      placeholder={selectedOperationalOption.defaultListName}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Leave blank to use Aether’s recommended list name.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-900">
                    Routing Tags
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Optional lightweight segments for demo seeding and launch
                    cleanup. Each selected tag also creates a usable list
                    container.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {operationalTagOptions.map((tag) => {
                      const selected = routingTags.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleRoutingTag(tag)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-sm font-medium text-sky-950">
                      Routing Preview
                    </p>
                    <p className="mt-2 text-sm text-sky-900">
                      This upload will seed into:
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {routingListPayload.map((listName) => (
                        <span
                          key={listName}
                          className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-900"
                        >
                          {listName}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-xs text-sky-700">
                      Primary route: {selectedOperationalOption.routeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              className="cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {source === "fec" ? "Import FEC Records" : "Import Data"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function IngestPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading ingest...</div>}>
      <IngestPageContent />
    </Suspense>
  );
}