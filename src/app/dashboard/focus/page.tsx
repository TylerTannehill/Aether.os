"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Crosshair,
  Loader2,
  Route,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
import { fullName } from "@/lib/data/utils";
import { useDashboardOwner } from "../owner-context";
import { useFocusContext } from "@/lib/focus/focus-context";
import { buildActionEngineAdapterResult } from "@/lib/priority/action-engine-adapter";
import { getActionEnginePageData } from "@/lib/priority/action-engine-selectors";
import { ActionItem } from "@/lib/priority/action-engine";
import {
  ExecuteActionResult,
  buildExecuteRequestFromAction,
  dryRunActionItem,
  executeActionItem,
} from "@/lib/priority/action-execution-client";
import { buildDashboardBrainOutput } from "@/lib/brain";

function isFallbackTask(taskType?: string | null) {
  return (taskType || "").trim().toLowerCase() === "fallback";
}

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in_progress", "in progress", "active"].includes(value)) {
    return "in_progress";
  }

  return value || "open";
}

function formatPriorityTone(level?: string | null) {
  switch ((level || "").toLowerCase()) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatBucketTone(bucket?: string | null) {
  switch ((bucket || "").toLowerCase()) {
    case "fix_now":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "follow_up":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "routing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "owner":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "pipeline":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

type DashboardTask = DashboardData["tasks"][number] & {
  fallback_reason?: string | null;
};

type BucketKey =
  | "immediate"
  | "fixNow"
  | "followUp"
  | "routing"
  | "owner"
  | "pipeline";

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

function getActionReasonLines(action: any): string[] {
  if (Array.isArray(action?.brain_reasons) && action.brain_reasons.length) {
    return action.brain_reasons
      .filter((reason: unknown): reason is string => typeof reason === "string")
      .slice(0, 3);
  }

  if (Array.isArray(action?.badges) && action.badges.length) {
    return action.badges
      .filter((badge: unknown): badge is string => typeof badge === "string")
      .slice(0, 3);
  }

  if (
    typeof action?.recommendedAction === "string" &&
    action.recommendedAction
  ) {
    return [action.recommendedAction];
  }

  if (typeof action?.summary === "string" && action.summary) {
    return [action.summary];
  }

  return ["No explicit reasoning available yet."];
}

function getFocusItemDepartment(item: any): DemoDepartment | "system" {
  const text = `${item?.department ?? ""} ${item?.domain ?? ""} ${
    item?.title ?? ""
  } ${item?.summary ?? ""} ${item?.recommendedAction ?? ""}`.toLowerCase();

  if (
    text.includes("finance") ||
    text.includes("donor") ||
    text.includes("pledge")
  ) {
    return "finance";
  }

  if (
    text.includes("field") ||
    text.includes("turf") ||
    text.includes("canvass") ||
    text.includes("door")
  ) {
    return "field";
  }

  if (
    text.includes("digital") ||
    text.includes("content") ||
    text.includes("sentiment") ||
    text.includes("platform")
  ) {
    return "digital";
  }

  if (
    text.includes("print") ||
    text.includes("mailer") ||
    text.includes("mail") ||
    text.includes("asset") ||
    text.includes("delivery")
  ) {
    return "print";
  }

  if (
    text.includes("outreach") ||
    text.includes("follow-up") ||
    text.includes("follow up") ||
    text.includes("contact") ||
    text.includes("call")
  ) {
    return "outreach";
  }

  return "system";
}

function getRoleQueueLimit(role: DemoRole, bucket: BucketKey) {
  if (role === "admin") {
    return bucket === "immediate" ? 6 : 5;
  }

  if (role === "director") {
    return bucket === "immediate" ? 4 : 3;
  }

  return bucket === "immediate" ? 3 : 2;
}

function getFocusRoleLabel(role: DemoRole) {
  if (role === "admin") return "Admin Focus";
  if (role === "director") return "Director Focus";
  return "Operator Focus";
}

function getFocusDepartmentLabel(department: DemoDepartment) {
  switch (department) {
    case "finance":
      return "Finance";
    case "field":
      return "Field";
    case "digital":
      return "Digital";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

export default function FocusModePage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeBucket, setActiveBucket] = useState<BucketKey>("immediate");
  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null
  );
  const [previewingActionId, setPreviewingActionId] = useState<string | null>(
    null
  );
  const [lastExecution, setLastExecution] =
    useState<ExecuteActionResult | null>(null);
  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("outreach");

  const { ownerFilter, applyMyDashboard } = useDashboardOwner();
  const { focusContext, clearFocusContext } = useFocusContext();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!focusContext?.bucket) return;

    setActiveBucket(focusContext.bucket);
    clearFocusContext();
  }, [focusContext, clearFocusContext]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const data = await getDashboardData();
      setContacts(data.contacts ?? []);
      setLists(data.lists ?? []);
      setLogs(data.logs ?? []);
      setTasks((data.tasks as DashboardTask[]) ?? []);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load focus mode");
    } finally {
      setLoading(false);
    }
  }

  const rawData = useMemo<DashboardData>(() => {
    return {
      contacts,
      lists,
      logs,
      tasks,
    };
  }, [contacts, lists, logs, tasks]);

  const filteredData = useMemo(() => {
    if (!ownerFilter) {
      return rawData;
    }

    const normalizedOwner = String(ownerFilter).toLowerCase();

    return {
      contacts: rawData.contacts.filter((contact: any) => {
        const owner =
          contact.owner_id ??
          contact.assigned_to ??
          contact.owner ??
          contact.owner_name;

        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
      lists: rawData.lists,
      logs: rawData.logs.filter((log: any) => {
        const owner =
          log.owner_id ??
          log.assigned_to ??
          log.owner ??
          log.owner_name;

        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
      tasks: rawData.tasks.filter((task: any) => {
        const owner = task.owner_id ?? task.assigned_to;
        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
    };
  }, [rawData, ownerFilter]);

  const ownerDirectory = useMemo(() => {
    const map: Record<string, string> = {};

    filteredData.contacts.forEach((contact: any) => {
      const ownerId =
        contact.owner_id ??
        contact.assigned_to ??
        contact.owner ??
        contact.owner_name;

      const ownerName =
        contact.owner_name ??
        contact.owner ??
        contact.assigned_to ??
        contact.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    filteredData.tasks.forEach((task: any) => {
      const ownerId = task.owner_id ?? task.assigned_to;
      const ownerName = task.owner_name ?? task.assigned_to ?? task.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    return map;
  }, [filteredData]);

  const brainOutput = useMemo(() => {
    return buildDashboardBrainOutput({
      tasks: (filteredData.tasks ?? []).map((task: any) => ({
        id: String(task.id),
        title: task.title ?? "Untitled task",
        description: task.description ?? null,
        status: normalizeTaskStatus(task.status),
        priority: task.priority ?? null,
        due_at: task.due_at ?? task.due_date ?? null,
        created_at: task.created_at ?? null,
        updated_at: task.updated_at ?? null,
        completed_at:
          normalizeTaskStatus(task.status) === "completed"
            ? task.updated_at ?? task.completed_at ?? null
            : task.completed_at ?? null,
        assigned_to: task.assigned_to ?? null,
        owner_id: task.owner_id ?? null,
        owner_name: task.owner_name ?? null,
        owner_role: task.role ?? null,
        department: task.department ?? null,
        fallback_reason: task.fallback_reason ?? null,
        route_type: isFallbackTask(task.task_type)
          ? "fallback"
          : task.task_type ?? null,
        task_type: task.task_type ?? null,
        manual_override:
          task.fallback_reason === "manual_override" ||
          Boolean(task.manual_override),
        blocked: Boolean(task.blocked),
        contact_id: task.contact_id ?? null,
        estimated_value: Number(task.estimated_value ?? 0) || null,
      })),
      contacts: (filteredData.contacts ?? []).map((contact: any) => ({
        id: String(contact.id),
        first_name: contact.first_name ?? null,
        last_name: contact.last_name ?? null,
        full_name:
  contact.full_name ??
  `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
        owner_id: contact.owner_id ?? null,
        assigned_to: contact.assigned_to ?? contact.owner ?? null,
        owner_name: contact.owner_name ?? contact.owner ?? null,
        owner_role: null,
        last_contacted_at:
          contact.last_contacted_at ??
          contact.last_outreach_at ??
          contact.updated_at ??
          null,
        updated_at: contact.updated_at ?? null,
        created_at: contact.created_at ?? null,
        phone: contact.phone ?? null,
        email: contact.email ?? null,
        city: contact.city ?? null,
        state: contact.state ?? null,
        employer: contact.employer ?? null,
        occupation: contact.occupation ?? null,
        donor_status: contact.donor_status ?? null,
        pledge_amount: Number(contact.pledge_amount ?? 0) || null,
        donation_total: Number(contact.donation_total ?? 0) || null,
        lifetime_value:
          Number(contact.lifetime_value ?? contact.donation_total ?? 0) || null,
        support_score: Number(contact.support_score ?? 0) || null,
        engagement_score: Number(contact.engagement_score ?? 0) || null,
        needs_follow_up: Boolean(contact.needs_follow_up),
        is_stale: Boolean(contact.is_stale),
      })),
      ownerDirectory,
    });
  }, [filteredData, ownerDirectory]);

  const priorityTasks = useMemo(() => {
    return brainOutput.priorityTasks;
  }, [brainOutput]);

  const priorityContacts = useMemo(() => {
    return brainOutput.priorityContacts;
  }, [brainOutput]);
    const focusEngine = useMemo(() => {
    return buildActionEngineAdapterResult({
      tasks: priorityTasks,
      contacts: priorityContacts,
      opportunities: [],
      ownerDirectory,
    });
  }, [priorityTasks, priorityContacts, ownerDirectory]);

  const focusPage = useMemo(() => {
    return getActionEnginePageData(focusEngine.actionEngine);
  }, [focusEngine]);

  const focusBoard = useMemo(() => {
    const buckets = focusPage?.buckets;

    return {
      immediate: priorityTasks.slice(0, 5),
      fixNow: buckets?.fix_now ?? [],
      followUp: buckets?.follow_up ?? [],
      routing: buckets?.routing ?? [],
      owner: buckets?.owner ?? [],
      pipeline: buckets?.pipeline ?? [],
    };
  }, [focusPage, priorityTasks]);

  const scopedFocusBoard = useMemo(() => {
    const scopeItems = (items: any[], bucket: BucketKey) => {
      let scoped = items;

      if (demoRole !== "admin") {
        scoped = scoped.filter((item) => {
          const itemDepartment = getFocusItemDepartment(item);

          if (demoDepartment === "outreach") {
            return (
              itemDepartment === "outreach" ||
              itemDepartment === "system" ||
              itemDepartment === "finance"
            );
          }

          return (
            itemDepartment === demoDepartment || itemDepartment === "system"
          );
        });
      }

      return scoped.slice(0, getRoleQueueLimit(demoRole, bucket));
    };

    return {
      immediate: scopeItems(focusBoard.immediate ?? [], "immediate"),
      fixNow: scopeItems(focusBoard.fixNow ?? [], "fixNow"),
      followUp: scopeItems(focusBoard.followUp ?? [], "followUp"),
      routing: scopeItems(focusBoard.routing ?? [], "routing"),
      owner: scopeItems(focusBoard.owner ?? [], "owner"),
      pipeline: scopeItems(focusBoard.pipeline ?? [], "pipeline"),
    };
  }, [focusBoard, demoRole, demoDepartment]);

  const queue = useMemo(() => {
    switch (activeBucket) {
      case "fixNow":
        return scopedFocusBoard.fixNow ?? [];
      case "followUp":
        return scopedFocusBoard.followUp ?? [];
      case "routing":
        return scopedFocusBoard.routing ?? [];
      case "owner":
        return scopedFocusBoard.owner ?? [];
      case "pipeline":
        return scopedFocusBoard.pipeline ?? [];
      case "immediate":
      default:
        return scopedFocusBoard.immediate ?? [];
    }
  }, [activeBucket, scopedFocusBoard]);

  const openTaskCount = useMemo(() => {
    const allScopedItems = [
      ...scopedFocusBoard.immediate,
      ...scopedFocusBoard.fixNow,
      ...scopedFocusBoard.followUp,
      ...scopedFocusBoard.routing,
      ...scopedFocusBoard.owner,
      ...scopedFocusBoard.pipeline,
    ];

    const uniqueIds = new Set(allScopedItems.map((item: any) => String(item.id)));
    return uniqueIds.size;
  }, [scopedFocusBoard]);

  const fallbackTaskCount = useMemo(() => {
    return queue.filter((task: any) => isFallbackTask(task.task_type)).length;
  }, [queue]);

  const followUpCount = useMemo(() => {
    return scopedFocusBoard.followUp.length;
  }, [scopedFocusBoard]);

  const focusRoleHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Work the right things across the campaign.";
    }

    if (demoRole === "director") {
      return `Run the ${getFocusDepartmentLabel(
        demoDepartment
      )} lane with tighter execution focus.`;
    }

    return `Stay inside your ${getFocusDepartmentLabel(
      demoDepartment
    ).toLowerCase()} work lane and keep the queue moving.`;
  }, [demoRole, demoDepartment]);

  const focusRoleSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "This is the full action-engine execution surface with broad campaign visibility.";
    }

    if (demoRole === "director") {
      return `This view narrows the queue around ${getFocusDepartmentLabel(
        demoDepartment
      ).toLowerCase()} so leaders can review, route, and clear work inside their lane.`;
    }

    return `This view strips away cross-org noise and keeps only the actions an individual operator should understand and execute.`;
  }, [demoRole, demoDepartment]);

  const visibleBucketButtons = useMemo(() => {
    if (demoRole === "admin") {
      return [
        "immediate",
        "fixNow",
        "followUp",
        "routing",
        "owner",
        "pipeline",
      ] as BucketKey[];
    }

    if (demoRole === "director") {
      return ["immediate", "fixNow", "followUp", "routing"] as BucketKey[];
    }

    return ["immediate", "followUp", "pipeline"] as BucketKey[];
  }, [demoRole]);

  const focusLinks = useMemo(() => {
    const departmentHref =
      demoDepartment === "finance"
        ? "/dashboard/finance"
        : demoDepartment === "field"
        ? "/dashboard/field"
        : demoDepartment === "digital"
        ? "/dashboard/digital"
        : demoDepartment === "print"
        ? "/dashboard/print"
        : "/dashboard/outreach";

    const departmentLabel =
      demoDepartment === "finance"
        ? "Open Finance"
        : demoDepartment === "field"
        ? "Open Field"
        : demoDepartment === "digital"
        ? "Open Digital"
        : demoDepartment === "print"
        ? "Open Print"
        : "Open Outreach";

    const links = [
      {
        label: departmentLabel,
        href: departmentHref,
      },
      {
        label: "Return to Command Center",
        href: "/dashboard",
      },
    ];

    if (demoRole !== "general_user") {
      links.splice(1, 0, {
        label: "Open Routing Rules",
        href: "/dashboard/routing",
      });
    }

    return links;
  }, [demoRole, demoDepartment]);

  async function handlePreviewAction(action: ActionItem) {
    try {
      setPreviewingActionId(action.id);
      setMessage("");

      const result = await dryRunActionItem(action);

      setLastExecution(result);
      setMessage(
        result.ok
          ? `Preview → ${result.message} (${result.mutations.length} mutation${
              result.mutations.length === 1 ? "" : "s"
            })`
          : result.message
      );
    } catch (err: any) {
      setMessage(err?.message || "Failed to preview action");
    } finally {
      setPreviewingActionId(null);
    }
  }

  async function handleExecuteAction(action: ActionItem) {
    try {
      setExecutingActionId(action.id);
      setMessage("");

      const payload = buildExecuteRequestFromAction(action).payload;

      if (
        action.type === "reduce_owner_pressure" ||
        action.type === "rebalance_queue"
      ) {
        setMessage(
          "Queue rebalance actions need targetOwnerId before they can execute."
        );
        return;
      }

      if (action.type === "fix_contact_data") {
        setMessage(
          "Fix contact data actions need payload.fields before they can execute."
        );
        return;
      }

      const result = await executeActionItem(action, payload);

      setLastExecution(result);
      setMessage(result.message);

      if (result.ok) {
        await loadData();
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to execute action");
    } finally {
      setExecutingActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading focus mode...</p>
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
              <Crosshair className="h-3.5 w-3.5" />
              Focus Mode • {getFocusRoleLabel(demoRole)}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {focusRoleHeadline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {focusRoleSubheadline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                {scopedFocusBoard.fixNow.length} fix now
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
                <Zap className="h-4 w-4" />
                {scopedFocusBoard.immediate.length} immediate
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                <Users className="h-4 w-4" />
                {followUpCount} follow up
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadData}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Refresh
            </button>

            <button
              onClick={applyMyDashboard}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              My Focus
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border-2 border-slate-900 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Ranked Action Queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Start here. This queue is the highest-value work in your current execution surface.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {queue.length} actions
            </div>
          </div>

          <div className="space-y-4">
            {queue.length === 0 ? (
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 text-slate-500">
                No actions in this lane right now.
              </div>
            ) : (
              queue.map((action: any) => {
                const isExecuting = executingActionId === action.id;
                const isPreviewing = previewingActionId === action.id;
                const reasonLines = getActionReasonLines(action);
                const itemDepartment = getFocusItemDepartment(action);

                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-slate-300 bg-slate-50 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatPriorityTone(
                              action.level ??
                                action.brain_tier ??
                                action.priority
                            )}`}
                          >
                            {action.level ??
                              action.brain_tier ??
                              action.priority ??
                              "open"}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatBucketTone(
                              action.bucket ?? "immediate"
                            )}`}
                          >
                            {String(action.bucket ?? "immediate").replace(
                              "_",
                              " "
                            )}
                          </span>

                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {itemDepartment === "system"
                              ? "system"
                              : getFocusDepartmentLabel(itemDepartment)}
                          </span>
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {action.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {action.summary ??
                              action.recommendedAction ??
                              reasonLines[0] ??
                              "No summary available."}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Why Aether picked this
                          </div>

                          {reasonLines.map((reason) => (
                            <div
                              key={`${action.id}-${reason}`}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                            >
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 lg:w-[300px]">
                        <div className="rounded-2xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-700">
                          {action.recommendedAction ??
                            reasonLines[0] ??
                            "Review this action before execution."}
                        </div>

                        <div className="flex gap-2">
                          {"type" in action ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePreviewAction(action as ActionItem)
                                }
                                disabled={isExecuting || isPreviewing}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isPreviewing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Previewing
                                  </>
                                ) : (
                                  <>
                                    Preview
                                    <ArrowRight className="h-4 w-4" />
                                  </>
                                )}
                              </button>
                                                            <button
                                type="button"
                                onClick={() =>
                                  handleExecuteAction(action as ActionItem)
                                }
                                disabled={isExecuting || isPreviewing}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isExecuting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Working
                                  </>
                                ) : (
                                  <>
                                    {demoRole === "general_user"
                                      ? "Do this next"
                                      : "Work this action"}
                                    <Zap className="h-4 w-4" />
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <div className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-500">
                              Brain-ranked task view only
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Immediate Queue Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast visibility into what the engine wants worked first.
              </p>
            </div>

            <div className="space-y-4">
              {scopedFocusBoard.immediate.slice(0, getRoleQueueLimit(demoRole, "immediate")).map((action: any) => {
                const reasonLines = getActionReasonLines(action);
                const itemDepartment = getFocusItemDepartment(action);

                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {action.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {action.recommendedAction ??
                            reasonLines[0] ??
                            "No recommendation available."}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Why: {reasonLines[0]}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Lane:{" "}
                          {itemDepartment === "system"
                            ? "system"
                            : getFocusDepartmentLabel(itemDepartment)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatPriorityTone(
                          action.level ?? action.brain_tier ?? action.priority
                        )}`}
                      >
                        {action.level ??
                          action.brain_tier ??
                          action.priority ??
                          "open"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {scopedFocusBoard.immediate.length === 0 ? (
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 text-slate-500">
                  Immediate queue is clear.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Last Execution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest preview or action execution result.
              </p>
            </div>

            {lastExecution ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      {lastExecution.message}
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        lastExecution.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {lastExecution.ok ? "Success" : "Issue"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {lastExecution.dryRun
                      ? "Dry run only — no database changes were made."
                      : "Execution attempted against the action API."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {lastExecution.mutations.length} mutation(s) planned ·{" "}
                  {lastExecution.results.length} result record(s)
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 text-slate-500">
                No action previewed or executed yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Focus Links
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump straight into the systems behind the action engine.
              </p>
            </div>

            <div className="space-y-3">
              {focusLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Focus Mode Status
              </p>
              <Sparkles className="h-5 w-5 text-slate-500" />
            </div>

            <p className="text-lg font-semibold text-slate-900">
              {demoRole === "admin"
                ? focusPage.hero.headline
                : `${getFocusDepartmentLabel(demoDepartment)} execution lane active`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {ownerFilter
                ? "You are viewing a filtered, owner-scoped execution lane."
                : demoRole === "admin"
                ? "You are viewing the full action-engine execution lane."
                : `You are viewing a ${getFocusRoleLabel(
                    demoRole
                  ).toLowerCase()} narrowed to the ${getFocusDepartmentLabel(
                    demoDepartment
                  ).toLowerCase()} lane.`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {openTaskCount} scoped actions
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {scopedFocusBoard.fixNow.length} fix now
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {scopedFocusBoard.immediate.length} immediate
              </span>
            </div>
          </div>
        </div>
      </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Demo role perspective
            </p>
            <div className="flex flex-wrap gap-2">
              {(["admin", "director", "general_user"] as DemoRole[]).map(
                (role) => (
                  <button
                    key={role}
                    onClick={() => setDemoRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      demoRole === role
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {role}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Demo department perspective
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                ["outreach", "finance", "field", "digital", "print"] as DemoDepartment[]
              ).map((department) => (
                <button
                  key={department}
                  onClick={() => setDemoDepartment(department)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    demoDepartment === department
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            {getFocusRoleLabel(demoRole)}:
          </span>{" "}
          This demo layer lets viewers switch roles and departments to see how
          the execution surface narrows around who is using Aether.
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Action Buckets
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {visibleBucketButtons.includes("immediate") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("immediate")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "immediate"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Immediate
              </button>
            ) : null}

            {visibleBucketButtons.includes("fixNow") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("fixNow")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "fixNow"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Fix Now
              </button>
            ) : null}

            {visibleBucketButtons.includes("followUp") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("followUp")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "followUp"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Follow Up
              </button>
            ) : null}

            {visibleBucketButtons.includes("routing") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("routing")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "routing"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Routing
              </button>
            ) : null}

            {visibleBucketButtons.includes("owner") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("owner")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "owner"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Owner
              </button>
            ) : null}

            {visibleBucketButtons.includes("pipeline") ? (
              <button
                type="button"
                onClick={() => setActiveBucket("pipeline")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeBucket === "pipeline"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Pipeline
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Primary Action</p>
            <Target className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {demoRole === "admin"
              ? focusPage.hero.headline
              : `${getFocusDepartmentLabel(demoDepartment)} lane is active`}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {demoRole === "admin"
              ? focusPage.hero.subheadline
              : `This view is trimmed for ${getFocusRoleLabel(
                  demoRole
                ).toLowerCase()} inside the ${getFocusDepartmentLabel(
                  demoDepartment
                ).toLowerCase()} lane.`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Open Tasks</p>
            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">
            {openTaskCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">Open work in this view</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Fallback Work</p>
            <Route className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-semibold tracking-tight text-amber-600">
            {fallbackTaskCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Routing misses still active
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Follow-Up Queue</p>
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-semibold tracking-tight text-emerald-600">
            {followUpCount}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Contacts that need action
          </p>
        </div>
      </section>
    </div>
  );
}