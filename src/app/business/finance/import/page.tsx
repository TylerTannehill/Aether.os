"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Landmark,
  Upload,
  XCircle,
} from "lucide-react";

const TRANSACTION_HEADERS = [
  "Direction",
  "Amount",
  "Transaction Date",
  "Description",
  "Counterparty",
] as const;

const OBLIGATION_HEADERS = [
  "Direction",
  "Amount",
  "Due Date",
  "Description",
  "Counterparty",
] as const;

type ImportKind = "transactions" | "obligations";
type CsvRow = Record<string, string>;

type ParsedCsv = {
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

function headersFor(kind: ImportKind) {
  return kind === "transactions" ? TRANSACTION_HEADERS : OBLIGATION_HEADERS;
}

function parseCsv(text: string, kind: ImportKind): ParsedCsv {
  const requiredHeaders = headersFor(kind);
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["The CSV needs a header row and at least one data row."],
    };
  }

  const headers = parseCsvLine(lines[0]);
  const errors: string[] = [];
  const exactHeaders =
    headers.length === requiredHeaders.length &&
    requiredHeaders.every((header, index) => headers[index] === header);

  if (!exactHeaders) {
    errors.push(
      `Headers must exactly match the Aether template: ${requiredHeaders.join(", ")}`
    );
  }

  const rows: CsvRow[] = [];

  if (exactHeaders) {
    lines.slice(1).forEach((line, rowIndex) => {
      const values = parseCsvLine(line);
      const displayRow = rowIndex + 2;

      if (values.length !== requiredHeaders.length) {
        errors.push(
          `Row ${displayRow}: expected ${requiredHeaders.length} columns but found ${values.length}.`
        );
        return;
      }

      const row = Object.fromEntries(
        requiredHeaders.map((header, index) => [header, values[index] ?? ""])
      ) as CsvRow;

      const direction = row.Direction?.toLowerCase();
      if (direction !== "in" && direction !== "out") {
        errors.push(`Row ${displayRow}: Direction must be in or out.`);
      }

      if (
        row.Amount === "" ||
        !Number.isFinite(Number(row.Amount)) ||
        Number(row.Amount) < 0
      ) {
        errors.push(`Row ${displayRow}: Amount must be a non-negative number.`);
      }

      const dateField = kind === "transactions" ? "Transaction Date" : "Due Date";
      const dateValue = row[dateField];
      const parsedDate = new Date(`${dateValue}T00:00:00`);

      if (
        !dateValue ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
        Number.isNaN(parsedDate.getTime())
      ) {
        errors.push(`Row ${displayRow}: ${dateField} must use YYYY-MM-DD.`);
      }

      if (!row.Description?.trim()) {
        errors.push(`Row ${displayRow}: Description is required.`);
      }

      rows.push(row);
    });
  }

  return { rows, errors };
}

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function downloadTransactionTemplate() {
  downloadCsv("aether-finance-transactions-template.csv", [
    TRANSACTION_HEADERS.join(","),
    'in,500.00,2026-10-06,"Customer payment","Example Customer"',
    'out,69.00,2026-10-06,"Service payment","Example Vendor"',
  ]);
}

function downloadObligationTemplate() {
  downloadCsv("aether-finance-obligations-template.csv", [
    OBLIGATION_HEADERS.join(","),
    'in,500.00,2026-10-09,"Expected customer payment","Example Customer"',
    'out,69.00,2026-10-09,"Upcoming service payment","Example Vendor"',
  ]);
}

export default function BusinessFinanceImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<ImportKind>("transactions");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasFile, setHasFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const requiredHeaders = headersFor(kind);
  const ready = hasFile && rows.length > 0 && errors.length === 0;

  function resetFile(nextKind?: ImportKind) {
    if (nextKind) setKind(nextKind);
    setFileName("");
    setRows([]);
    setErrors([]);
    setHasFile(false);
    setImportError(null);
    setImportedCount(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHasFile(true);
    setImportError(null);
    setImportedCount(null);

    try {
      const parsed = parseCsv(await file.text(), kind);
      setRows(parsed.rows);
      setErrors(parsed.errors);
    } catch {
      setRows([]);
      setErrors(["Aether could not read this CSV file."]);
    }
  }

  async function importFinanceData() {
    if (!ready || importing) return;

    setImporting(true);
    setImportError(null);
    setImportedCount(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!organizationId) {
        throw new Error("No active Business organization is available.");
      }

      const supabase = createClient();

      if (kind === "transactions") {
        const records = rows.map((row) => ({
          organization_id: organizationId,
          direction: row.Direction.toLowerCase(),
          amount: Number(row.Amount),
          transaction_date: row["Transaction Date"],
          description: row.Description.trim(),
          counterparty_name: row.Counterparty?.trim() || null,
          source: "csv",
          external_id: null,
          needs_review: false,
          review_reason: null,
          reviewed_at: null,
        }));

        const { error } = await supabase
          .from("business_finance_transactions")
          .insert(records);

        if (error) {
          console.error("Unable to import Business Finance transactions:", error);
          throw new Error("Aether could not import these transactions.");
        }
      } else {
        const records = rows.map((row) => ({
          organization_id: organizationId,
          direction: row.Direction.toLowerCase(),
          amount: Number(row.Amount),
          due_date: row["Due Date"],
          description: row.Description.trim(),
          business_contact_id: null,
          counterparty_name: row.Counterparty?.trim() || null,
          status: "open",
        }));

        const { error } = await supabase
          .from("business_finance_obligations")
          .insert(records);

        if (error) {
          console.error("Unable to import Business Finance obligations:", error);
          throw new Error("Aether could not import these obligations.");
        }
      }

      setImportedCount(rows.length);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Aether could not import this Finance CSV."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8 pb-10 lg:space-y-6 lg:pb-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <Landmark className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Business Finance
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                Finance Import Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Bring historical financial reality into Aether using Aether&apos;s
                standard CSV formats.
              </p>
            </div>
          </div>

          <Link
            href="/business/finance"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Back to Finance
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          {
            label: "Choose",
            detail: "Select transactions or obligations",
            icon: FileSpreadsheet,
          },
          {
            label: "Upload",
            detail: "Use the matching Aether CSV template",
            icon: Upload,
          },
          {
            label: "Review",
            detail: "Validate every row before import",
            icon: CheckCircle2,
          },
        ].map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">
                  Step {index + 1}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900 lg:mt-3 lg:text-sm">
                {step.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500 lg:text-[10px]">
                {step.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:gap-3">
        <button
          type="button"
          onClick={() => resetFile("transactions")}
          className={`rounded-3xl border-2 p-5 text-left transition lg:rounded-2xl lg:p-4 ${
            kind === "transactions"
              ? "border-slate-900 bg-white shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Actual Movement
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 lg:text-base">
            Transactions
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 lg:text-[10px]">
            Import money that already moved. These records feed Money In, Money
            Out, Net, Financial Flow, and Recent Transactions.
          </p>
        </button>

        <button
          type="button"
          onClick={() => resetFile("obligations")}
          className={`rounded-3xl border-2 p-5 text-left transition lg:rounded-2xl lg:p-4 ${
            kind === "obligations"
              ? "border-slate-900 bg-white shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Expected Movement
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 lg:text-base">
            Obligations
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 lg:text-[10px]">
            Import money expected to move. These records feed Outstanding and
            Finance Focus Receive / Pay pressure.
          </p>
        </button>
      </section>

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
              {kind === "transactions" ? "Transaction File" : "Obligation File"}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
              Upload Finance CSV
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
              Use the Aether template exactly. No field mapping, no mystery
              columns, no guessing.
            </p>
          </div>

          <button
            type="button"
            onClick={
              kind === "transactions"
                ? downloadTransactionTemplate
                : downloadObligationTemplate
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:text-[11px]"
          >
            <Download className="h-4 w-4" />
            Download {kind === "transactions" ? "Transaction" : "Obligation"} Template
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />

        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center lg:mt-4 lg:min-h-52 lg:rounded-2xl lg:py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm lg:h-11 lg:w-11 lg:rounded-xl">
            <Upload className="h-5 w-5 lg:h-4 lg:w-4" />
          </div>
          <h3 className="mt-5 text-base font-semibold text-slate-900 lg:mt-4 lg:text-sm">
            {fileName ||
              `Select an Aether ${kind === "transactions" ? "transaction" : "obligation"} CSV`}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 lg:text-[11px]">
            {hasFile
              ? `${rows.length} data row${rows.length === 1 ? "" : "s"} detected.`
              : "Download the template, fill it out, then upload the completed CSV here."}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:mt-4 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
          >
            <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            {hasFile ? "Choose Different CSV" : "Select CSV"}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Review
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Data Preview &amp; Validation
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Aether validates headers, direction, amount, date, and description
            before anything can be imported.
          </p>

          {!hasFile ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 lg:text-[11px]">
              Select a CSV to preview its rows.
            </div>
          ) : errors.length > 0 ? (
            <div className="mt-5 space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-red-800">
                <XCircle className="h-4 w-4" />
                Fix the CSV before import
              </div>
              {errors.slice(0, 12).map((error) => (
                <p key={error} className="text-sm text-red-700 lg:text-[10px]">
                  {error}
                </p>
              ))}
              {errors.length > 12 ? (
                <p className="text-sm font-medium text-red-700 lg:text-[10px]">
                  + {errors.length - 12} more validation errors
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 lg:text-[10px]">
                <CheckCircle2 className="h-4 w-4" />
                {rows.length} row{rows.length === 1 ? "" : "s"} passed validation.
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-[760px] w-full text-left text-xs lg:text-[9px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {requiredHeaders.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 font-semibold uppercase tracking-[0.08em]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 10).map((row, index) => (
                      <tr key={`${index}-${row.Description}`} className="text-slate-700">
                        {requiredHeaders.map((header) => (
                          <td key={header} className="whitespace-nowrap px-3 py-2">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 10 ? (
                <p className="text-xs text-slate-500 lg:text-[9px]">
                  Showing the first 10 of {rows.length} rows.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Aether Format
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Accepted Fields
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            Match the template exactly. Connected systems will use their own
            Aether adapters instead.
          </p>

          <div className="mt-5 grid gap-2">
            {requiredHeaders.map((header) => (
              <div
                key={header}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 lg:text-[10px]"
              >
                {header}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
              {ready
                ? "CSV validation passed."
                : `Select and validate an Aether ${kind === "transactions" ? "transaction" : "obligation"} CSV.`}
            </p>
            <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
              {importedCount !== null
                ? `${importedCount} ${kind === "transactions" ? "transaction" : "obligation"}${importedCount === 1 ? "" : "s"} imported into Aether.`
                : "Validated rows are written directly into the active Business organization."}
            </p>
            {importError ? (
              <p className="mt-2 text-sm font-medium text-red-700 lg:text-[10px]">
                {importError}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={importFinanceData}
            disabled={!ready || importing || importedCount !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:text-[11px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            {importing
              ? "Importing..."
              : importedCount !== null
                ? "Import Complete"
                : "Import Finance Data"}
          </button>
        </div>
      </section>
    </div>
  );
}
