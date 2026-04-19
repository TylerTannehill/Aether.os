"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { autoMapFields } from "@/lib/ingestion/mapping";
import { parseCSV } from "@/lib/ingestion/parser";
import { transformToContacts } from "@/lib/ingestion/activate";

type ImportSummaryItem = {
  name: string;
  count: number;
};

export default function IngestPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "outreach";

  const [data, setData] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [listsCreated, setListsCreated] = useState(0);
  const [listSummary, setListSummary] = useState<ImportSummaryItem[]>([]);
  const [ownerAssignment, setOwnerAssignment] = useState("");

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
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (!data) return;

    setErrorMessage("");
    setImportSuccess(false);
    setImportCount(0);
    setListsCreated(0);
    setListSummary([]);

    const contacts = transformToContacts(data.rows, mapping).map((contact: any) => ({
      ...contact,
      owner_name: ownerAssignment.trim() || contact.owner_name || null,
    }));

    try {
      const res = await fetch("/api/actions/ingest/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts,
          suggestedLists: interpretation?.suggestedLists || [],
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

      alert(`Imported ${result.count} contacts`);
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
        source === "finance"
          ? [
              likelyDonors > 0 ? "Likely Donors" : null,
              highValueTargets > 0 ? "High Value Donors" : null,
              contactsMissingPhone > 0 ? "Missing Phone Numbers" : null,
              "General Finance Follow-Up",
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

  const primaryActionLabel =
    source === "finance" ? "Start Donor Follow-Up" : "Start Outreach";

  const successBody =
    source === "finance"
      ? "Aether pushed these records into your live contact system. Start donor follow-up now, review contacts directly, or inspect lists next."
      : "Aether pushed these records into your live contact system. Start outreach now, review contacts directly, or inspect lists next.";

  const primaryActionHref =
    source === "finance"
      ? "/dashboard/outreach?channel=call"
      : "/dashboard/outreach";

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {source === "finance"
            ? "Finance Data Ingestion"
            : "Outreach Data Ingestion"}
        </h1>
        <p className="text-sm text-slate-600">
          Upload contact data, verify how Aether understands it, then import it
          into the system.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Upload CSV</p>
            <p className="mt-1 text-sm text-slate-500">
              Bring in messy outside data and let Aether organize it.
            </p>
          </div>

          <input type="file" accept=".csv" onChange={handleFile} />
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
                {importCount} contact{importCount === 1 ? "" : "s"} imported
                successfully
              </h2>
              <p className="max-w-3xl text-sm text-emerald-900/80">
                {successBody}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Contacts Imported
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {importCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Lists Created
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {listsCreated}
                  </p>
                </div>
              </div>

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
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:bg-slate-100"
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
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                {primaryActionLabel}
              </Link>

              <Link
                href="/dashboard/contacts"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
              >
                View Contacts
              </Link>

              <Link
                href="/dashboard/lists"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
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

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Import Data
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}