"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react";

const REQUIRED_HEADERS = [
  "Date",
  "Platform",
  "Impressions",
  "Engagement",
  "Clicks",
  "Spend",
  "Positive Sentiment",
  "Negative Sentiment",
] as const;

const SUPPORTED_PLATFORMS = [
  "Facebook",
  "Instagram",
  "X",
  "TikTok",
  "YouTube",
  "Website",
] as const;

type CsvRow = Record<(typeof REQUIRED_HEADERS)[number], string>;

type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
  errors: string[];
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): ParsedCsv {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ["The CSV needs a header row and at least one data row."] };
  }

  const headers = parseCsvLine(lines[0]);
  const errors: string[] = [];
  const exactHeaders =
    headers.length === REQUIRED_HEADERS.length &&
    REQUIRED_HEADERS.every((header, index) => headers[index] === header);

  if (!exactHeaders) {
    errors.push(`Headers must exactly match the Aether template: ${REQUIRED_HEADERS.join(", ")}`);
  }

  const rows: CsvRow[] = [];

  if (exactHeaders) {
    lines.slice(1).forEach((line, rowIndex) => {
      const values = parseCsvLine(line);
      const displayRow = rowIndex + 2;

      if (values.length !== REQUIRED_HEADERS.length) {
        errors.push(`Row ${displayRow}: expected ${REQUIRED_HEADERS.length} columns but found ${values.length}.`);
        return;
      }

      const row = Object.fromEntries(
        REQUIRED_HEADERS.map((header, index) => [header, values[index] ?? ""])
      ) as CsvRow;

      const parsedDate = new Date(row.Date);
      if (!row.Date || Number.isNaN(parsedDate.getTime())) {
        errors.push(`Row ${displayRow}: Date is missing or invalid.`);
      }

      if (!SUPPORTED_PLATFORMS.includes(row.Platform as (typeof SUPPORTED_PLATFORMS)[number])) {
        errors.push(`Row ${displayRow}: Platform must be one of ${SUPPORTED_PLATFORMS.join(", ")}.`);
      }

      [
        "Impressions",
        "Engagement",
        "Clicks",
        "Spend",
        "Positive Sentiment",
        "Negative Sentiment",
      ].forEach((field) => {
        const value = row[field as keyof CsvRow];
        if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
          errors.push(`Row ${displayRow}: ${field} must be a non-negative number.`);
        }
      });

      rows.push(row);
    });
  }

  return { headers, rows, errors };
}

function downloadTemplate() {
  const sample = [
    REQUIRED_HEADERS.join(","),
    "2026-10-01,Facebook,0,0,0,0,0,0",
    "2026-10-01,Instagram,0,0,0,0,0,0",
    "2026-10-01,X,0,0,0,0,0,0",
    "2026-10-01,TikTok,0,0,0,0,0,0",
    "2026-10-01,YouTube,0,0,0,0,0,0",
    "2026-10-01,Website,0,0,0,0,0,0",
  ].join("\n");

  const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "aether-marketing-analytics-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function BusinessMarketingImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasFile, setHasFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHasFile(true);
    setImportError("");
    setImportedCount(null);

    try {
      const parsed = parseCsv(await file.text());
      setRows(parsed.rows);
      setErrors(parsed.errors);
    } catch {
      setRows([]);
      setErrors(["Aether could not read this CSV file."]);
    }
  }

  async function handleImport() {
    if (!ready || importing) return;

    setImporting(true);
    setImportError("");
    setImportedCount(null);

    try {
      const events = rows.map((row) => ({
        source: "csv",
        department: "digital",
        platform: row.Platform,
        metric_date: row.Date,
        impressions: Number(row.Impressions),
        engagement: Number(row.Engagement),
        clicks: Number(row.Clicks),
        spend: Number(row.Spend),
        positive_sentiment: Number(row["Positive Sentiment"]),
        negative_sentiment: Number(row["Negative Sentiment"]),
      }));

      const response = await fetch("/api/actions/ingest/analytics", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Analytics import failed.");
      }

      setImportedCount(Number(payload.count ?? events.length));
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Analytics import failed."
      );
    } finally {
      setImporting(false);
    }
  }

  const ready = hasFile && rows.length > 0 && errors.length === 0;

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <BarChart3 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Marketing Analytics
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">Analytics Upload</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Import marketing performance data using Aether&apos;s standard analytics CSV format.
              </p>
            </div>
          </div>
          <Link href="/business/marketing" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]">
            <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" /> Back to Marketing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          { label: "Upload", detail: "Select an Aether-format analytics CSV", icon: Upload },
          { label: "Review", detail: "Validate rows before anything is written", icon: FileSpreadsheet },
          { label: "Import", detail: "Write validated rows to Marketing analytics", icon: CheckCircle2 },
        ].map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">Step {index + 1}</span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900 lg:mt-3 lg:text-sm">{step.label}</h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[10px]">{step.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">Analytics File</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">Upload Marketing Analytics CSV</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">Use the Aether template exactly. Manual uploads are intentionally strict so imported analytics stay clean.</p>
          </div>
          <button type="button" onClick={downloadTemplate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[11px]">
            <Download className="h-4 w-4" /> Download Template
          </button>
        </div>

        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center lg:mt-4 lg:min-h-52 lg:rounded-2xl lg:py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm lg:h-11 lg:w-11 lg:rounded-xl"><Upload className="h-5 w-5 lg:h-4 lg:w-4" /></div>
          <h3 className="mt-5 text-base font-semibold text-slate-900 lg:mt-4 lg:text-sm">{fileName || "Select an Aether analytics CSV"}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 lg:text-[11px]">
            {hasFile ? `${rows.length} data row${rows.length === 1 ? "" : "s"} detected.` : "Download the template, fill it out, then upload the completed CSV here."}
          </p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:mt-4 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]">
            <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5" /> {hasFile ? "Choose Different CSV" : "Select CSV"}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">Review</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">Data Preview &amp; Validation</h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">Aether validates the template, supported platforms, dates, and numeric metrics before import.</p>

          {!hasFile ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 lg:text-[11px]">Select a CSV to preview its rows.</div>
          ) : errors.length > 0 ? (
            <div className="mt-5 space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-red-800"><XCircle className="h-4 w-4" /> Fix the CSV before import</div>
              {errors.slice(0, 12).map((error) => <p key={error} className="text-sm text-red-700 lg:text-[10px]">{error}</p>)}
              {errors.length > 12 && <p className="text-sm font-medium text-red-700 lg:text-[10px]">+ {errors.length - 12} more validation errors</p>}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 lg:text-[10px]"><CheckCircle2 className="h-4 w-4" /> {rows.length} row{rows.length === 1 ? "" : "s"} passed validation.</div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-[980px] w-full text-left text-xs lg:text-[9px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>{REQUIRED_HEADERS.map((header) => <th key={header} className="px-3 py-2 font-semibold uppercase tracking-[0.08em]">{header}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 10).map((row, index) => (
                      <tr key={`${row.Date}-${row.Platform}-${index}`} className="text-slate-700">
                        {REQUIRED_HEADERS.map((header) => <td key={header} className="whitespace-nowrap px-3 py-2">{row[header]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && <p className="text-xs text-slate-500 lg:text-[9px]">Showing the first 10 of {rows.length} rows.</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">Aether Format</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">Accepted Analytics</h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">No field mapping. Match the template or connect the platform integration.</p>
          <div className="mt-5 grid gap-2">
            {SUPPORTED_PLATFORMS.map((platform) => <div key={platform} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 lg:text-[10px]">{platform}</div>)}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
              {importedCount !== null
                ? `${importedCount} analytics row${importedCount === 1 ? "" : "s"} imported.`
                : ready
                  ? "CSV validation passed."
                  : "Select and validate an Aether analytics CSV."}
            </p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
              {importedCount !== null
                ? "The imported rows are now part of this organization’s Marketing analytics."
                : "Only validated rows can be imported into Marketing analytics."}
            </p>
            {importError && (
              <p className="mt-2 text-sm font-medium text-red-700 lg:text-[10px]">
                {importError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={!ready || importing || importedCount !== null}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition lg:text-[11px] ${
              !ready || importing || importedCount !== null
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {importing
              ? "Importing..."
              : importedCount !== null
                ? "Imported"
                : "Import Analytics"}
          </button>
        </div>
      </section>
    </div>
  );
}
