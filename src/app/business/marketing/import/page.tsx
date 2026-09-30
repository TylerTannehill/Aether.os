"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

export default function BusinessMarketingImportPage() {
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
              <h1 className="text-3xl font-semibold tracking-tight lg:text-2xl">
                Analytics Upload
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Bring exported marketing performance data into Aether when a
                direct platform connection is not available or does not contain
                the reporting you need.
              </p>
            </div>
          </div>

          <Link
            href="/business/marketing"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Back to Marketing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          {
            label: "Upload",
            detail: "Select an exported analytics CSV",
            icon: Upload,
          },
          {
            label: "Review",
            detail: "Confirm detected fields and reporting context",
            icon: FileSpreadsheet,
          },
          {
            label: "Import",
            detail: "Add verified signals to Marketing analytics",
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

      <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md lg:rounded-2xl lg:p-[18px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Analytics File
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Upload Marketing Analytics CSV
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 lg:text-[11px]">
            This surface is intended for platform exports, vendor reports, and
            internal marketing reporting files that need to become part of
            Aether&apos;s Marketing analytics layer.
          </p>
        </div>

        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center lg:mt-4 lg:min-h-52 lg:rounded-2xl lg:py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm lg:h-11 lg:w-11 lg:rounded-xl">
            <Upload className="h-5 w-5 lg:h-4 lg:w-4" />
          </div>

          <h3 className="mt-5 text-base font-semibold text-slate-900 lg:mt-4 lg:text-sm">
            CSV upload is not connected yet
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 lg:text-[11px]">
            The Business analytics ingestion route and storage contract will be
            connected during the Marketing data-layer build. No file selected
            here will be parsed, uploaded, or written anywhere yet.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white opacity-40 lg:mt-4 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
          >
            <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            Select CSV
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Review
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Data Preview &amp; Field Mapping
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            After connectivity is added, uploaded rows will be previewed here
            before import. Aether will be able to identify common analytics
            fields while leaving the user in control of the final mapping.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 lg:mt-4 lg:rounded-xl">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:px-3 lg:py-2 lg:text-[9px]">
              <span>Source Field</span>
              <span>Aether Field</span>
              <span>Status</span>
            </div>

            <div className="px-4 py-10 text-center text-sm text-slate-500 lg:px-3 lg:py-8 lg:text-[11px]">
              Upload a connected CSV to preview field mappings.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
            Expected Signals
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
            Marketing Performance Context
          </h2>
          <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
            The eventual Business importer can normalize common reporting
            signals without requiring every source file to use identical column
            names.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 lg:mt-4 lg:gap-2">
            {[
              "Platform / Channel",
              "Campaign / Asset",
              "Reporting Date",
              "Impressions / Reach",
              "Engagement / Clicks",
              "Spend",
              "Sentiment / Notes",
            ].map((signal) => (
              <div
                key={signal}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-[10px]"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
        <p className="text-sm font-semibold text-slate-700 lg:text-[11px]">
          Analytics ingestion is intentionally inactive.
        </p>
        <p className="mt-1 text-sm text-slate-500 lg:text-[9px]">
          This page establishes the Business Marketing upload workflow without
          borrowing the existing Political ingestion endpoint or making storage
          assumptions before the Business analytics contract is defined.
        </p>
      </section>
    </div>
  );
}
