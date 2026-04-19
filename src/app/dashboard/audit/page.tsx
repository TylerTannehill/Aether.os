"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Wrench,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuditStatus = "preview" | "success" | "partial_failure" | "failure";

type AuditLog = {
  id: string;
  action_id: string | null;
  action_type: string;
  dry_run: boolean;
  status: AuditStatus;
  message: string;
  recommended_action: string | null;
  source_ids: string[] | null;
  targets:
    | Array<{
        entityType: string;
        entityId: string;
      }>
    | null;
  mutation_count: number;
  success_count: number;
  failure_count: number;
  mutations: Array<{
    table: string;
    action: "update";
    filters: Record<string, string>;
    values: Record<string, unknown>;
  }> | null;
  results: Array<{
    table: string;
    entityId?: string;
    success: boolean;
    error?: string;
  }> | null;
  metadata: Record<string, unknown> | null;
  triggered_by: string | null;
  created_at: string;
};

function formatStatusTone(status: AuditStatus) {
  switch (status) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "partial_failure":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "failure":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "preview":
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function formatDryRunTone(dryRun: boolean) {
  return dryRun
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

function formatActionType(actionType: string) {
  return actionType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
export default function AuditDashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AuditStatus>("all");
  const [dryRunFilter, setDryRunFilter] = useState<"all" | "dry_run" | "live">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("action_execution_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      setLogs((data as AuditLog[]) ?? []);
    } catch (err: any) {
      setMessage(
        err?.message ||
          "Failed to load audit logs. Make sure the audit table exists and RLS is configured correctly."
      );
    } finally {
      setLoading(false);
    }
  }

  const actionTypes = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action_type)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        log.action_type.toLowerCase().includes(searchText) ||
        (log.message || "").toLowerCase().includes(searchText) ||
        (log.recommended_action || "").toLowerCase().includes(searchText) ||
        (log.triggered_by || "").toLowerCase().includes(searchText) ||
        (log.action_id || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" || log.status === statusFilter;

      const matchesDryRun =
        dryRunFilter === "all" ||
        (dryRunFilter === "dry_run" && log.dry_run) ||
        (dryRunFilter === "live" && !log.dry_run);

      const matchesType =
        typeFilter === "all" || log.action_type === typeFilter;

      return matchesSearch && matchesStatus && matchesDryRun && matchesType;
    });
  }, [logs, search, statusFilter, dryRunFilter, typeFilter]);

  const summary = useMemo(() => {
    return {
      total: filteredLogs.length,
      success: filteredLogs.filter((log) => log.status === "success").length,
      preview: filteredLogs.filter((log) => log.status === "preview").length,
      partialFailure: filteredLogs.filter((log) => log.status === "partial_failure")
        .length,
      failure: filteredLogs.filter((log) => log.status === "failure").length,
      liveRuns: filteredLogs.filter((log) => !log.dry_run).length,
    };
  }, [filteredLogs]);
    if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading audit dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Shield className="h-3.5 w-3.5" />
              Audit Layer • Action History
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Action Audit Dashboard
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Every preview, execution, mutation summary, and outcome in one
                place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadAuditLogs}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Logs</p>
            <Activity className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            {summary.total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Success</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-emerald-600">
            {summary.success}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Preview</p>
            <Eye className="h-5 w-5 text-sky-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-sky-600">
            {summary.preview}
          </p>
        </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Partial Failure</p>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-amber-600">
            {summary.partialFailure}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Failure</p>
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-rose-600">
            {summary.failure}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Live Runs</p>
            <Wrench className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            {summary.liveRuns}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.9fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search message, action type, action ID, or triggered by..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | AuditStatus)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="preview">Preview</option>
            <option value="success">Success</option>
            <option value="partial_failure">Partial Failure</option>
            <option value="failure">Failure</option>
          </select>

          <select
            value={dryRunFilter}
            onChange={(event) =>
              setDryRunFilter(event.target.value as "all" | "dry_run" | "live")
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Runs</option>
            <option value="dry_run">Dry Run Only</option>
            <option value="live">Live Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Action Types</option>
            {actionTypes.map((actionType) => (
              <option key={actionType} value={actionType}>
                {formatActionType(actionType)}
              </option>
            ))}
          </select>
        </div>
      </section>
            <section className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            No audit logs match the current filters.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatStatusTone(
                        log.status
                      )}`}
                    >
                      {log.status.replace("_", " ")}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatDryRunTone(
                        log.dry_run
                      )}`}
                    >
                      {log.dry_run ? "dry run" : "live"}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatActionType(log.action_type)}
                    </span>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {log.message}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {log.recommended_action || "No recommended action logged"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Created
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Mutations
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {log.mutation_count}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Success
                      </p>
                      <p className="mt-1 text-sm font-medium text-emerald-700">
                        {log.success_count}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Failure
                      </p>
                      <p className="mt-1 text-sm font-medium text-rose-700">
                        {log.failure_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-[260px]">
                  <p className="font-medium text-slate-800">Action ID</p>
                  <p className="mt-1 break-all text-xs">
                    {log.action_id || "No action ID"}
                  </p>

                  <p className="mt-4 font-medium text-slate-800">Triggered By</p>
                  <p className="mt-1 text-xs">
                    {log.triggered_by || "System / not recorded"}
                  </p>
                </div>
              </div>
                            <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Targets</p>
                  <div className="mt-3 space-y-2">
                    {(log.targets ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No targets logged</p>
                    ) : (
                      (log.targets ?? []).slice(0, 6).map((target, index) => (
                        <div
                          key={`${target.entityType}-${target.entityId}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          {target.entityType} · {target.entityId}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Results</p>
                  <div className="mt-3 space-y-2">
                    {(log.results ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No result records logged</p>
                    ) : (
                      (log.results ?? []).slice(0, 6).map((result, index) => (
                        <div
                          key={`${result.table}-${result.entityId}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          <span className="font-medium">{result.table}</span>
                          {" · "}
                          {result.entityId || "no id"}
                          {" · "}
                          <span
                            className={
                              result.success ? "text-emerald-700" : "text-rose-700"
                            }
                          >
                            {result.success ? "success" : "failure"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Source IDs</p>
                  <div className="mt-3 space-y-2">
                    {(log.source_ids ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No source IDs logged</p>
                    ) : (
                      (log.source_ids ?? []).slice(0, 6).map((sourceId, index) => (
                        <div
                          key={`${sourceId}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          {sourceId}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
