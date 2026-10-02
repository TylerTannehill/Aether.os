"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  Users,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Company",
  "Job Title",
  "Street Address",
  "City",
  "State",
  "ZIP",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];

type ParsedContact = {
  rowNumber: number;
  values: Record<CsvHeader, string>;
  errors: string[];
};

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("The CSV contains an unclosed quoted field.");
  }

  row.push(field);
  if (row.some((value) => value.length > 0) || rows.length === 0) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

export default function BusinessContactsImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedContact[]>([]);
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const validRows = useMemo(
    () => rows.filter((row) => row.errors.length === 0),
    [rows],
  );

  const invalidRows = useMemo(
    () => rows.filter((row) => row.errors.length > 0),
    [rows],
  );

  function downloadTemplate() {
    const csv = `${CSV_HEADERS.map((header) => csvCell(header)).join(",")}\r\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "aether-business-contacts-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError("");
    setImportError("");
    setImportedCount(null);
    setRows([]);

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please choose a CSV file.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      if (parsed.length === 0) {
        throw new Error("The CSV is empty.");
      }

      const headers = parsed[0].map(normalizeHeader);
      const expected = CSV_HEADERS.map(normalizeHeader);

      const missingHeaders = expected.filter(
        (header) => !headers.includes(header),
      );

      if (missingHeaders.length > 0) {
        const displayMissing = missingHeaders
          .map(
            (header) =>
              CSV_HEADERS[expected.indexOf(header)],
          )
          .join(", ");

        throw new Error(
          `The CSV is missing required columns: ${displayMissing}. Download the Aether template to use the supported format.`,
        );
      }

      const headerIndexes = CSV_HEADERS.reduce(
        (map, header) => {
          map[header] = headers.indexOf(normalizeHeader(header));
          return map;
        },
        {} as Record<CsvHeader, number>,
      );

      const contacts = parsed
        .slice(1)
        .filter((record) => record.some((value) => value.trim().length > 0))
        .map((record, index): ParsedContact => {
          const values = CSV_HEADERS.reduce(
            (map, header) => {
              map[header] = (record[headerIndexes[header]] || "").trim();
              return map;
            },
            {} as Record<CsvHeader, string>,
          );

          const errors: string[] = [];
          if (!values["First Name"] && !values["Last Name"]) {
            errors.push("First Name or Last Name is required.");
          }

          return {
            rowNumber: index + 2,
            values,
            errors,
          };
        });

      if (contacts.length === 0) {
        throw new Error("The CSV does not contain any contact rows.");
      }

      setRows(contacts);
    } catch (error: any) {
      setRows([]);
      setFileError(error?.message || "The CSV could not be read.");
    } finally {
      event.target.value = "";
    }
  }

  async function importValidContacts() {
    if (validRows.length === 0 || importing) return;

    setImporting(true);
    setImportError("");
    setImportedCount(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
      });
      const context = await contextResponse.json().catch(() => null);

      if (!contextResponse.ok || !context?.organization?.id) {
        throw new Error(
          context?.error || "Active organization context is unavailable.",
        );
      }

      const organizationId = context.organization.id;

      const payload = validRows.map(({ values }) => ({
        organization_id: organizationId,
        first_name: values["First Name"] || null,
        last_name: values["Last Name"] || null,
        email: values["Email"] || null,
        phone: values["Phone"] || null,
        company: values["Company"] || null,
        job_title: values["Job Title"] || null,
        street_address: values["Street Address"] || null,
        city: values["City"] || null,
        state: values["State"] || null,
        zip: values["ZIP"] || null,
      }));

      const { data, error } = await supabase
        .from("business_contacts")
        .insert(payload)
        .select("id");

      if (error) throw error;

      setImportedCount(data?.length || payload.length);
    } catch (error: any) {
      setImportError(error?.message || "Contacts could not be imported.");
    } finally {
      setImporting(false);
    }
  }

  const importComplete = importedCount !== null;

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <FileSpreadsheet className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Business contact ingestion
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Import Contacts
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-[11px]">
                Upload an Aether-formatted CSV, validate the records, review the
                preview, and import valid contacts into the active organization.
              </p>
            </div>
          </div>

          <Link
            href="/business/contacts"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Back to Contacts
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Step 1
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
                Prepare Your CSV
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 lg:text-[11px]">
                Use the Aether template or export an existing contact set and
                use the same column structure.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[10px]"
            >
              <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Download Template
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:mt-4">
            {CSV_HEADERS.map((header) => (
              <div
                key={header}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 lg:text-[9px]"
              >
                {header}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500 lg:text-[9px]">
            First Name or Last Name is required. All other fields may be blank.
            Aether does not silently merge or deduplicate imported records.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
            Step 2
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Upload + Validate
          </h2>
          <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
            Nothing is written to Aether until you review the preview and
            explicitly import the valid records.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 lg:mt-4 lg:py-6"
          >
            <Upload className="h-7 w-7 text-slate-500" />
            <span className="mt-3 text-sm font-semibold text-slate-800 lg:text-[11px]">
              Choose CSV File
            </span>
            <span className="mt-1 text-xs text-slate-500 lg:text-[9px]">
              {fileName || "Aether Business Contact CSV"}
            </span>
          </button>

          {fileError ? (
            <div className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs font-medium lg:text-[9px]">{fileError}</p>
            </div>
          ) : null}
        </div>
      </section>

      {rows.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">
                Step 3
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
                Review Import
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                Review the parsed records before committing them to the active
                organization.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 lg:text-[9px]">
                {rows.length} total
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 lg:text-[9px]">
                {validRows.length} valid
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 lg:text-[9px]">
                {invalidRows.length} invalid
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 lg:mt-4">
            <table className="w-full min-w-[1050px] border-separate border-spacing-0">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Row",
                    "Status",
                    "Name",
                    "Email",
                    "Phone",
                    "Company",
                    "Job Title",
                    "Location",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:px-3 lg:text-[9px]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const name =
                    `${row.values["First Name"]} ${row.values["Last Name"]}`.trim() ||
                    "Unnamed Contact";
                  const location =
                    [
                      row.values["City"],
                      row.values["State"],
                      row.values["ZIP"],
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not provided";

                  return (
                    <tr key={row.rowNumber} className="bg-white">
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 lg:px-3 lg:text-[10px]">
                        {row.rowNumber}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 lg:px-3">
                        {row.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 lg:text-[9px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Valid
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 lg:text-[9px]">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Invalid
                            </span>
                            <p className="mt-1 max-w-xs text-xs text-rose-600 lg:text-[9px]">
                              {row.errors.join(" ")}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 lg:px-3 lg:text-[10px]">
                        {name}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:px-3 lg:text-[10px]">
                        {row.values["Email"] || "—"}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:px-3 lg:text-[10px]">
                        {row.values["Phone"] || "—"}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:px-3 lg:text-[10px]">
                        {row.values["Company"] || "—"}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:px-3 lg:text-[10px]">
                        {row.values["Job Title"] || "—"}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:px-3 lg:text-[10px]">
                        {location}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:mt-4 lg:p-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 lg:text-[11px]">
                Ready to import {validRows.length} valid contact
                {validRows.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                Invalid rows are never written. This import does not deduplicate
                or overwrite existing contacts.
              </p>
            </div>

            <button
              type="button"
              onClick={importValidContacts}
              disabled={validRows.length === 0 || importing || importComplete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[10px]"
            >
              <Users className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              {importing
                ? "Importing..."
                : importComplete
                  ? "Import Complete"
                  : "Import Valid Contacts"}
            </button>
          </div>

          {importError ? (
            <div className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs font-medium lg:text-[9px]">{importError}</p>
            </div>
          ) : null}

          {importComplete ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 lg:text-[11px]">
                    {importedCount} contact{importedCount === 1 ? "" : "s"} imported.
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 lg:text-[9px]">
                    The records are now part of the active Business organization.
                  </p>
                </div>
              </div>

              <Link
                href="/business/contacts"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 lg:text-[10px]"
              >
                Back to Contact Management
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
