"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Upload,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { parseCSV } from "@/lib/ingestion/parser";
import { autoMapFields } from "@/lib/ingestion/mapping";

type AnalyticsImportResult = {
  success?: boolean;
  count?: number;
};

const DEPARTMENT_OPTIONS = [
  "digital",
  "finance",
  "field",
  "print",
] as const;

export default function AnalyticsImportPage() {
  const [data, setData] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [department, setDepartment] =
    useState<(typeof DEPARTMENT_OPTIONS)[number]>("digital");

  const [errorMessage, setErrorMessage] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [loading, setLoading] = useState(false);

  function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event: any) => {
      const text = event.target?.result;
      const parsed = parseCSV(text);

      setData(parsed);
      setMapping(autoMapFields(parsed.headers));

      setImportSuccess(false);
      setImportCount(0);
      setErrorMessage("");
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (!data?.rows?.length) return;

    try {
      setLoading(true);
      setErrorMessage("");
      setImportSuccess(false);

      const payload = data.rows.map((row: any) => {
        const mapped: Record<string, any> = {};

        Object.entries(mapping).forEach(([csvField, mappedField]) => {
          if (!mappedField) return;

          mapped[mappedField] = row[csvField];
        });

        return {
          source: "csv",
          department,

          platform:
            mapped.platform ||
            mapped.source ||
            mapped.channel ||
            null,

          campaign_name:
            mapped.campaign_name ||
            mapped.campaign ||
            null,

          asset_name:
            mapped.asset_name ||
            mapped.asset ||
            mapped.ad_name ||
            null,

          metric_date:
            mapped.metric_date ||
            mapped.date ||
            null,

          impressions: Number(mapped.impressions || 0),
          engagements: Number(mapped.engagements || 0),
          clicks: Number(mapped.clicks || 0),
          spend: Number(mapped.spend || 0),

          sentiment_positive: Number(
            mapped.sentiment_positive || 0
          ),

          sentiment_negative: Number(
            mapped.sentiment_negative || 0
          ),

          sentiment_neutral: Number(
            mapped.sentiment_neutral || 0
          ),

          notes: mapped.notes || null,

          raw_payload: row,
        };
      });

      const res = await fetch("/api/actions/ingest/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: payload,
        }),
      });

      const result: AnalyticsImportResult = await res.json();

      if (!res.ok) {
        throw new Error(result?.success ? "Import failed" : "Import failed");
      }

      setImportSuccess(true);
      setImportCount(result.count || 0);
    } catch (err: any) {
      setErrorMessage(err?.message || "Analytics import failed");
    } finally {
      setLoading(false);
    }
  }

  const interpretation = useMemo(() => {
    if (!data?.rows?.length) return null;

    const rows = data.rows as Record<string, string>[];
    const headers = (data.headers as string[]).map((header) =>
      header.toLowerCase()
    );

    const hasImpressions = headers.some((header) =>
      ["impressions", "views", "reach"].includes(header)
    );

    const hasEngagement = headers.some((header) =>
      ["engagement", "engagements", "likes", "comments"].includes(header)
    );

    const hasSpend = headers.some((header) =>
      ["spend", "cost", "budget"].includes(header)
    );

    return {
      totalRows: rows.length,
      hasImpressions,
      hasEngagement,
      hasSpend,
    };
  }, [data]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BarChart3 className="h-4 w-4" />
          Analytics Signal Engine
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Analytics Data Ingestion
        </h1>

        <p className="max-w-3xl text-sm text-slate-600">
          Import platform analytics, campaign metrics, engagement
          data, sentiment signals, or spend reports into Aether’s
          analytics intelligence layer.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Upload analytics CSV
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Meta, TikTok, X, Instagram, Google Ads, vendor exports,
              or internal reporting sheets.
            </p>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">
              Department Destination
            </p>

            <select
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value as (typeof DEPARTMENT_OPTIONS)[number]
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {interpretation ? (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-indigo-800">
                Signal Interpretation
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-indigo-900">
                Here’s what Aether sees
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rows detected
                </p>

                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {interpretation.totalRows}
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Impression data
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {interpretation.hasImpressions ? "Detected" : "Missing"}
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Engagement data
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {interpretation.hasEngagement ? "Detected" : "Missing"}
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Spend data
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {interpretation.hasSpend ? "Detected" : "Missing"}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Preview
            </h2>

            <pre className="mt-4 overflow-auto rounded-2xl bg-slate-100 p-4 text-xs text-slate-700">
              {JSON.stringify(data.rows.slice(0, 5), null, 2)}
            </pre>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Field Mapping
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Blank mappings will be ignored.
            </p>

            <div className="mt-5 space-y-3">
              {data.headers.map((header: string) => (
                <div
                  key={header}
                  className="flex items-center gap-3"
                >
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

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />

              {loading
                ? "Importing Analytics..."
                : "Import Analytics"}
            </button>
          </div>
        </>
      ) : null}

      {importSuccess ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-800">
                Analytics Import Complete
              </p>

              <h2 className="text-2xl font-semibold text-emerald-900">
                {importCount} analytics event
                {importCount === 1 ? "" : "s"} imported
              </h2>

              <p className="max-w-3xl text-sm text-emerald-900/80">
                Aether added these analytics signals into the live
                intelligence layer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/digital"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Activity className="h-4 w-4" />
                Open Digital
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-700" />

            <div>
              <p className="text-sm font-medium text-rose-900">
                Analytics import failed
              </p>

              <p className="mt-1 text-sm text-rose-800">
                {errorMessage}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}