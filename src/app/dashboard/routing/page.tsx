"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  Route,
  Save,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { filterDashboardDataByOwner, getDashboardData } from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
import { formatDateTime } from "@/lib/data/utils";
import { generateRuleSuggestions } from "@/lib/routing/suggestions";
import { useDashboardOwner } from "../owner-context";

type RoutingTask = DashboardData["tasks"][number] & {
  fallback_reason?: string | null;
};

type RoutingRuleRow = {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  task_type?: string | null;
  list_id?: string | null;
  contact_id?: string | null;
  fallback_reason?: string | null;
  route_to_owner_name?: string | null;
  priority_override?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  matched_count?: number | null;
  last_matched_at?: string | null;
};

type RuleSuggestion = {
  key: string;
  count: number;
  task_type?: string | null;
  list_id?: string | null;
  fallback_reason?: string | null;
  suggested_owner?: string | null;
};

type EnhancedSuggestion = RuleSuggestion & {
  existingRule?: RoutingRuleRow;
  converted: boolean;
  dismissed: boolean;
};

function isFallbackTask(taskType?: string | null) {
  return (taskType || "").trim().toLowerCase() === "fallback";
}

function formatFallbackReason(reason?: string | null) {
  if (!reason) return "No reason logged";

  return reason
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupTasksByReason(tasks: RoutingTask[]) {
  const map = new Map<string, RoutingTask[]>();

  for (const task of tasks) {
    const key = formatFallbackReason(task.fallback_reason);

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(task);
  }

  return Array.from(map.entries())
    .map(([reason, items]) => ({
      reason,
      count: items.length,
      items: items.sort((a, b) => {
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      }),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildSuggestedCondition(task: RoutingTask) {
  const chunks = [
    task.task_type ? `task_type = ${task.task_type}` : null,
    task.list_id ? `list_id = ${task.list_id}` : null,
    task.contact_id ? `contact_id = ${task.contact_id}` : null,
  ].filter(Boolean);

  if (chunks.length === 0) return "match repeated fallback pattern from this task";
  return chunks.join(" AND ");
}

function buildSuggestedName(task: RoutingTask, ownerFilter: string) {
  return `Route ${task.task_type || "task"} for ${
    task.owner_name || ownerFilter || "default owner"
  }`;
}

function getRuleMatchCount(rule: RoutingRuleRow) {
  return typeof rule.matched_count === "number" ? rule.matched_count : 0;
}

function matchesSuggestion(rule: RoutingRuleRow, suggestion: RuleSuggestion) {
  const sameTaskType = (rule.task_type || null) === (suggestion.task_type || null);
  const sameListId = (rule.list_id || null) === (suggestion.list_id || null);
  const sameFallbackReason =
    (rule.fallback_reason || null) === (suggestion.fallback_reason || null);

  return sameTaskType && sameListId && sameFallbackReason;
}

function buildSuggestionKey(suggestion: RuleSuggestion) {
  return [
    suggestion.task_type || "any",
    suggestion.list_id || "any",
    suggestion.fallback_reason || "any",
  ].join("|");
}

function getSuggestionPerformance(rule?: RoutingRuleRow) {
  if (!rule) return { label: "New", tone: "slate" as const };

  const count = getRuleMatchCount(rule);

  if (count >= 20) return { label: "High Impact", tone: "emerald" as const };
  if (count >= 5) return { label: "Working", tone: "blue" as const };
  if (count > 0) return { label: "Low Impact", tone: "amber" as const };
  return { label: "Unused", tone: "rose" as const };
}

export default function RoutingRulesPage() {
  const [tasks, setTasks] = useState<RoutingTask[]>([]);
  const [rules, setRules] = useState<RoutingRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingRule, setSavingRule] = useState(false);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [savingSuggestionKey, setSavingSuggestionKey] = useState<string | null>(null);

  const [ruleName, setRuleName] = useState("");
  const [ruleTaskType, setRuleTaskType] = useState("");
  const [ruleListId, setRuleListId] = useState("");
  const [ruleContactId, setRuleContactId] = useState("");
  const [ruleFallbackReason, setRuleFallbackReason] = useState("");
  const [routeToOwnerName, setRouteToOwnerName] = useState("");
  const [priorityOverride, setPriorityOverride] = useState("");
  const [ruleNotes, setRuleNotes] = useState("");

  const [editingRules, setEditingRules] = useState<Record<string, RoutingRuleRow>>({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState<
    Record<string, boolean>
  >({});

  const searchParams = useSearchParams();
  const { ownerFilter } = useDashboardOwner();

  const fromTask = searchParams.get("fromTask");
  const selectedTaskId = searchParams.get("taskId");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const data = await getDashboardData();

      const filtered = filterDashboardDataByOwner(
        {
          contacts: data.contacts,
          lists: data.lists,
          logs: data.logs,
          tasks: data.tasks as RoutingTask[],
        },
        ownerFilter
      );

      const fallbackTasks = (filtered.tasks as RoutingTask[]).filter(
        (task) =>
          task.status !== "done" &&
          task.status !== "cancelled" &&
          isFallbackTask(task.task_type)
      );

      setTasks(fallbackTasks);

      const { data: rulesData, error: rulesError } = await supabase
        .from("routing_rules")
        .select("*")
        .order("priority", { ascending: false })
        .order("matched_count", { ascending: false })
        .order("last_matched_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (rulesError) throw rulesError;

      setRules((rulesData as RoutingRuleRow[]) ?? []);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load routing rules view.");
      setTasks([]);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((task) => task.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) return;

    setRuleName(buildSuggestedName(selectedTask, ownerFilter));
    setRuleTaskType(selectedTask.task_type || "");
    setRuleListId(selectedTask.list_id || "");
    setRuleContactId(selectedTask.contact_id || "");
    setRuleFallbackReason(selectedTask.fallback_reason || "");
    setRouteToOwnerName(selectedTask.owner_name || ownerFilter || "");
    setPriorityOverride("");
    setRuleNotes(
      `Created from fallback task "${selectedTask.title}" on routing page prefill.`
    );
  }, [selectedTask, ownerFilter]);

  async function saveRule() {
    try {
      setSavingRule(true);
      setMessage("");

      if (!ruleName.trim()) {
        setMessage("Rule name is required.");
        return;
      }

      const duplicateRule = rules.find(
        (rule) =>
          (rule.task_type || null) === (ruleTaskType.trim() || null) &&
          (rule.list_id || null) === (ruleListId.trim() || null) &&
          (rule.contact_id || null) === (ruleContactId.trim() || null) &&
          (rule.fallback_reason || null) === (ruleFallbackReason.trim() || null)
      );

      if (duplicateRule) {
        setMessage(`A matching rule already exists: "${duplicateRule.name}".`);
        return;
      }

      const payload = {
        name: ruleName.trim(),
        is_active: true,
        priority: 0,
        task_type: ruleTaskType.trim() || null,
        list_id: ruleListId.trim() || null,
        contact_id: ruleContactId.trim() || null,
        fallback_reason: ruleFallbackReason.trim() || null,
        route_to_owner_name: routeToOwnerName.trim() || null,
        priority_override: priorityOverride.trim() || null,
        notes: ruleNotes.trim() || null,
      };

      const { error } = await supabase.from("routing_rules").insert([payload]);

      if (error) throw error;

      setMessage(`Routing rule "${ruleName.trim()}" saved.`);
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Failed to save routing rule.");
    } finally {
      setSavingRule(false);
    }
  }

  async function approveSuggestion(suggestion: RuleSuggestion) {
    try {
      setSavingSuggestionKey(suggestion.key);
      setMessage("");

      const existingRule = rules.find((rule) => matchesSuggestion(rule, suggestion));

      if (existingRule) {
        setMessage(`Suggestion already covered by "${existingRule.name}".`);
        return;
      }

      const payload = {
        name: `Auto rule for ${suggestion.fallback_reason || "fallback"}`,
        is_active: true,
        priority: 5,
        task_type: suggestion.task_type || null,
        list_id: suggestion.list_id || null,
        contact_id: null,
        fallback_reason: suggestion.fallback_reason || null,
        route_to_owner_name: suggestion.suggested_owner || null,
        priority_override: null,
        notes: `Auto-created from ${suggestion.count} repeated fallback tasks.`,
      };

      const { error } = await supabase.from("routing_rules").insert([payload]);

      if (error) throw error;

      setMessage(`Created rule from suggestion: ${payload.name}`);
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Failed to apply suggestion.");
    } finally {
      setSavingSuggestionKey(null);
    }
  }

  function dismissSuggestion(suggestion: RuleSuggestion) {
    const key = buildSuggestionKey(suggestion);

    setDismissedSuggestions((prev) => ({
      ...prev,
      [key]: true,
    }));

    setMessage(`Dismissed suggestion: ${suggestion.fallback_reason}`);
  }

  function startEditing(rule: RoutingRuleRow) {
    setEditingRules((prev) => ({
      ...prev,
      [rule.id]: { ...rule },
    }));
  }

  function cancelEditing(ruleId: string) {
    setEditingRules((prev) => {
      const next = { ...prev };
      delete next[ruleId];
      return next;
    });
  }

  function updateEditingRule(ruleId: string, updates: Partial<RoutingRuleRow>) {
    setEditingRules((prev) => ({
      ...prev,
      [ruleId]: {
        ...(prev[ruleId] || {}),
        ...updates,
      } as RoutingRuleRow,
    }));
  }
    async function saveEditingRule(ruleId: string) {
    const rule = editingRules[ruleId];
    if (!rule) return;

    try {
      setSavingRuleId(ruleId);
      setMessage("");

      const payload = {
        priority: Number.isFinite(rule.priority) ? rule.priority : 0,
        is_active: !!rule.is_active,
        route_to_owner_name: rule.route_to_owner_name?.trim() || null,
        priority_override: rule.priority_override?.trim() || null,
        notes: rule.notes?.trim() || null,
      };

      const { error } = await supabase
        .from("routing_rules")
        .update(payload)
        .eq("id", ruleId);

      if (error) throw error;

      setMessage(`Updated rule "${rule.name}".`);
      cancelEditing(ruleId);
      await loadData();
    } catch (err: any) {
      setMessage(err?.message || "Failed to update rule.");
    } finally {
      setSavingRuleId(null);
    }
  }

  const grouped = useMemo(() => groupTasksByReason(tasks), [tasks]);

  const rawSuggestions = useMemo(() => {
    return generateRuleSuggestions(tasks) as RuleSuggestion[];
  }, [tasks]);

  const suggestions = useMemo<EnhancedSuggestion[]>(() => {
    return rawSuggestions.map((suggestion) => {
      const existingRule = rules.find((rule) => matchesSuggestion(rule, suggestion));
      const key = buildSuggestionKey(suggestion);

      return {
        ...suggestion,
        existingRule,
        converted: !!existingRule,
        dismissed: !!dismissedSuggestions[key],
      };
    });
  }, [rawSuggestions, rules, dismissedSuggestions]);

  const totalFallback = tasks.length;
  const noOwnerCount = tasks.filter((task) => task.fallback_reason === "no_owner").length;
  const noRuleMatchCount = tasks.filter(
    (task) => task.fallback_reason === "no_rule_match"
  ).length;
  const missingContactDataCount = tasks.filter(
    (task) => task.fallback_reason === "missing_contact_data"
  ).length;

  const totalRuleMatches = useMemo(
    () => rules.reduce((sum, rule) => sum + getRuleMatchCount(rule), 0),
    [rules]
  );

  const activeRuleCount = useMemo(
    () => rules.filter((rule) => rule.is_active).length,
    [rules]
  );

  const bestRule = useMemo(() => {
    if (rules.length === 0) return null;
    const sorted = [...rules].sort((a, b) => {
      const countDiff = getRuleMatchCount(b) - getRuleMatchCount(a);
      if (countDiff !== 0) return countDiff;
      return (b.priority || 0) - (a.priority || 0);
    });
    return getRuleMatchCount(sorted[0]) > 0 ? sorted[0] : null;
  }, [rules]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading routing rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Route className="h-4 w-4" />
              Routing controls
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Routing Rules
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Review fallback patterns and turn repeated failures into cleaner routing rules.
              </p>
              <p className="text-sm text-slate-500">
                Viewing: <span className="font-semibold">{ownerFilter || "All Owners"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              href="/dashboard/tasks"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Open Operator Queue
            </Link>

            <Link
              href="/dashboard/focus"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Zap className="h-4 w-4" />
              Focus Mode
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {fromTask && selectedTask ? (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Prefill from task
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Suggested rule draft
              </h2>
              <p className="text-sm text-slate-600">
                This draft is based on the fallback task you opened from the queue.
              </p>
            </div>

            <Link
              href="/dashboard/tasks"
              className="inline-flex items-center gap-1 rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              Back to task
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Source task
              </p>
              <p className="mt-2 font-semibold text-slate-900">{selectedTask.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedTask.description || "No description"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Reason: {formatFallbackReason(selectedTask.fallback_reason)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Current owner: {selectedTask.owner_name || "Unassigned"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Due: {formatDateTime(selectedTask.due_date)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggested condition preview
              </p>
              <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {buildSuggestedCondition(selectedTask)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Suggested Rules</h2>
            <p className="mt-1 text-sm text-slate-600">
              Patterns detected from repeated fallback tasks.
            </p>
          </div>

          <button
            onClick={() => setDismissedSuggestions({})}
            className="text-xs text-slate-500 underline"
          >
            Reset dismissed
          </button>
        </div>

        {suggestions.filter((suggestion) => !suggestion.dismissed).length === 0 ? (
          <div className="text-sm text-slate-500">No strong patterns yet.</div>
        ) : (
          <div className="space-y-3">
            {suggestions
              .filter((suggestion) => !suggestion.dismissed)
              .map((suggestion) => {
                const perf = getSuggestionPerformance(suggestion.existingRule);

                return (
                  <div
                    key={suggestion.key}
                    className="rounded-2xl border border-purple-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {suggestion.task_type || "any"} · {suggestion.fallback_reason}
                          </p>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              perf.tone === "emerald"
                                ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                                : perf.tone === "blue"
                                ? "border border-blue-200 bg-blue-100 text-blue-700"
                                : perf.tone === "amber"
                                ? "border border-amber-200 bg-amber-100 text-amber-700"
                                : perf.tone === "rose"
                                ? "border border-rose-200 bg-rose-100 text-rose-700"
                                : "border border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {perf.label}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500">
                          {suggestion.count} similar failures
                        </p>

                        <p className="text-xs text-slate-500">
                          list: {suggestion.list_id || "any"}
                        </p>

                        {suggestion.converted ? (
                          <p className="mt-2 text-xs font-medium text-emerald-700">
                            Converted → "{suggestion.existingRule?.name}"
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => approveSuggestion(suggestion)}
                          disabled={
                            savingSuggestionKey === suggestion.key || suggestion.converted
                          }
                          className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingSuggestionKey === suggestion.key
                            ? "Applying..."
                            : suggestion.converted
                            ? "Applied"
                            : "Auto-Apply"}
                        </button>

                        <button
                          onClick={() => {
                            setRuleName(`Auto rule for ${suggestion.fallback_reason}`);
                            setRuleTaskType(suggestion.task_type || "");
                            setRuleListId(suggestion.list_id || "");
                            setRuleContactId("");
                            setRuleFallbackReason(suggestion.fallback_reason || "");
                            setRouteToOwnerName(suggestion.suggested_owner || "");
                            setPriorityOverride("");
                            setRuleNotes(
                              `Suggested from ${suggestion.count} repeated fallback tasks.`
                            );
                          }}
                          disabled={suggestion.converted}
                          className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Prefill
                        </button>

                        <button
                          onClick={() => dismissSuggestion(suggestion)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Active Fallback Work</p>
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-amber-900">
            {totalFallback}
          </p>
          <p className="mt-2 text-sm text-amber-800">Tasks currently missing clean routing</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Rules</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {activeRuleCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">Rules ready to route new tasks</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Rule Matches</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {totalRuleMatches}
          </p>
          <p className="mt-2 text-sm text-slate-500">Total successful rule applications</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">No Owner</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {noOwnerCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">Best solved by assignment defaults</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">No Rule Match</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {noRuleMatchCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">Best solved by new routing logic</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Missing Contact Data</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {missingContactDataCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">Best solved by better input quality</p>
        </div>
      </section>
            {bestRule ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-700">
                Top Performing Rule
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{bestRule.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {getRuleMatchCount(bestRule)} matches · last used{" "}
                {formatDateTime(bestRule.last_matched_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700">
              Routes to{" "}
              <span className="font-semibold">
                {bestRule.route_to_owner_name || "No owner target"}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Rule Draft</h2>
              <p className="mt-1 text-sm text-slate-500">
                Save a routing rule from the current fallback pattern.
              </p>
            </div>

            <button
              onClick={saveRule}
              disabled={savingRule}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingRule ? "Saving..." : "Save Rule"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Rule Name
              </label>
              <input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Route fallback tasks for owner"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Task Type
              </label>
              <input
                value={ruleTaskType}
                onChange={(e) => setRuleTaskType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="fallback"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Fallback Reason
              </label>
              <input
                value={ruleFallbackReason}
                onChange={(e) => setRuleFallbackReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="no_rule_match"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                List ID
              </label>
              <input
                value={ruleListId}
                onChange={(e) => setRuleListId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Optional list UUID"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact ID
              </label>
              <input
                value={ruleContactId}
                onChange={(e) => setRuleContactId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Optional contact UUID"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Route To Owner
              </label>
              <input
                value={routeToOwnerName}
                onChange={(e) => setRouteToOwnerName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Owner name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Priority Override
              </label>
              <select
                value={priorityOverride}
                onChange={(e) => setPriorityOverride(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="">No override</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                value={ruleNotes}
                onChange={(e) => setRuleNotes(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Describe when this rule should be used"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Saved Rules</h2>
            <p className="mt-1 text-sm text-slate-500">
              Rules currently stored in Supabase, ranked by performance.
            </p>
          </div>

          {rules.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              No saved routing rules yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.slice(0, 10).map((rule) => {
                const editing = editingRules[rule.id];
                const isEditing = !!editing;

                return (
                  <div
                    key={rule.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{rule.name}</p>

                          {getRuleMatchCount(rule) > 0 ? (
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {getRuleMatchCount(rule)} matches
                            </span>
                          ) : null}

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              rule.is_active
                                ? "border border-blue-200 bg-blue-100 text-blue-700"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {rule.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500">
                          {rule.route_to_owner_name || "No owner target"} ·{" "}
                          {rule.task_type || "any task"} · {rule.fallback_reason || "any reason"}
                        </p>

                        <p className="text-xs text-slate-500">
                          Last matched: {formatDateTime(rule.last_matched_at)}
                        </p>

                        <div className="grid gap-3 pt-2 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Priority
                            </label>
                            <input
                              type="number"
                              value={isEditing ? editing.priority ?? 0 : rule.priority ?? 0}
                              onFocus={() => startEditing(rule)}
                              onChange={(e) =>
                                updateEditingRule(rule.id, {
                                  priority: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Route To Owner
                            </label>
                            <input
                              value={
                                isEditing
                                  ? editing.route_to_owner_name || ""
                                  : rule.route_to_owner_name || ""
                              }
                              onFocus={() => startEditing(rule)}
                              onChange={(e) =>
                                updateEditingRule(rule.id, {
                                  route_to_owner_name: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Priority Override
                            </label>
                            <select
                              value={
                                isEditing
                                  ? editing.priority_override || ""
                                  : rule.priority_override || ""
                              }
                              onFocus={() => startEditing(rule)}
                              onChange={(e) =>
                                updateEditingRule(rule.id, {
                                  priority_override: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="">No override</option>
                              <option value="low">low</option>
                              <option value="medium">medium</option>
                              <option value="high">high</option>
                              <option value="urgent">urgent</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={isEditing ? !!editing.is_active : !!rule.is_active}
                                onChange={(e) => {
                                  if (!isEditing) startEditing(rule);
                                  updateEditingRule(rule.id, {
                                    is_active: e.target.checked,
                                  });
                                }}
                              />
                              Active
                            </label>
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Notes
                            </label>
                            <textarea
                              rows={2}
                              value={isEditing ? editing.notes || "" : rule.notes || ""}
                              onFocus={() => startEditing(rule)}
                              onChange={(e) =>
                                updateEditingRule(rule.id, {
                                  notes: e.target.value,
                                })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {!isEditing ? (
                            <button
                              onClick={() => startEditing(rule)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit Rule
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => saveEditingRule(rule.id)}
                                disabled={savingRuleId === rule.id}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                              >
                                {savingRuleId === rule.id ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                onClick={() => cancelEditing(rule.id)}
                                disabled={savingRuleId === rule.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        P{rule.priority || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Fallback Patterns</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use these clusters to decide what routing rule to add next.
          </p>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No active fallback patterns right now.
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div
                key={group.reason}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{group.reason}</h3>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {group.count} task{group.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {group.reason === "No Owner"
                        ? "Recommended rule: default owner assignment by list, source, or task type."
                        : group.reason === "No Rule Match"
                        ? "Recommended rule: add a routing condition based on repeated task patterns."
                        : group.reason === "Missing Contact Data"
                        ? "Recommended rule: require key contact fields before generating this task."
                        : "Recommended rule: review this fallback pattern and convert it into a stable workflow rule."}
                    </p>
                  </div>

                  <Link
                    href="/dashboard/tasks"
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open tasks
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {group.items.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {task.owner_name || "Unassigned"} · {task.priority || "No priority"} ·{" "}
                            {task.status || "open"}
                          </p>
                          {task.description ? (
                            <p className="mt-2 text-sm text-slate-600">{task.description}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-500">
                            Created {formatDateTime(task.created_at)}
                          </p>
                        </div>

                        <Link
                          href={`/dashboard/routing?fromTask=1&taskId=${task.id}`}
                          className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Prefill Rule
                        </Link>
                      </div>
                    </div>
                  ))}

                  {group.items.length > 5 ? (
                    <p className="text-xs text-slate-500">
                      +{group.items.length - 5} more similar task
                      {group.items.length - 5 === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}