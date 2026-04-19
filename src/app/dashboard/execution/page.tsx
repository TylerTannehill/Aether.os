"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  filterDashboardDataByOwner,
  getDashboardData,
  getOwnerDashboardSignals,
} from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
import { useDashboardOwner } from "../owner-context";
import { buildCommandCenterAdapterResult } from "@/lib/priority/command-center-adapter";
import { getCommandCenterPageData } from "@/lib/priority/command-center-selectors";
import { getActionEnginePageData } from "@/lib/priority/action-engine-selectors";
import { buildUnifiedActionEngineAdapterResult } from "@/lib/priority/action-engine-adapter";
import { buildAutoExecutionPlan } from "@/lib/priority/auto-execution";
import {
  dryRunActionItem,
  dryRunGovernedActionItem,
  executeGovernedActionItem,
  approveGovernedActionItem,
  overrideExecuteActionItem,
  getGovernedExecutionDecision,
} from "@/lib/priority/action-execution-client";
import {
  getOutreachSignals,
  getFinanceSignals,
  getFieldSignals,
  getDigitalSignals,
  getPrintSignals,
} from "@/lib/intelligence/signals";
import { aggregateAetherIntelligence } from "@/lib/intelligence/aggregator";
import {
  getTopTriggerActions,
  buildActionItemsFromTriggers,
} from "@/lib/intelligence/action-triggers";
import {
  getDigitalSnapshot,
  type DigitalSnapshot,
} from "@/lib/data/digital";
import {
  getFieldSnapshot,
  type FieldSnapshot,
} from "@/lib/data/field";
import {
  getPrintSnapshot,
  type PrintSnapshot,
} from "@/lib/data/print";
import {
  getFinanceSnapshot,
  type FinanceSnapshot,
} from "@/lib/data/finance";
import { evaluateExecutionSummaryFeedback } from "@/lib/brain/feedback-loop";
import { buildExecutionSummary } from "@/lib/brain/execution-summary";

type AuditRecord = {
  id?: string;
  action_id?: string | null;
  action_type?: string | null;
  ok?: boolean | null;
  dry_run?: boolean | null;
  message?: string | null;
  created_at?: string | null;
  triggered_by?: string | null;
  metadata?: Record<string, unknown>;
};

type AuditApiResponse = {
  ok: boolean;
  records?: AuditRecord[];
  summary?: {
    total: number;
    successful: number;
    failed: number;
    dryRuns: number;
    byActionType: Record<string, number>;
  };
  error?: string;
};

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

function getActionTitle(action: any) {
  return String(
    action?.title ??
      action?.label ??
      action?.headline ??
      action?.name ??
      "Untitled action"
  );
}

function getActionWhyNow(action: any) {
  return String(
    action?.whyNow ??
      action?.reason ??
      action?.summary ??
      action?.description ??
      "Priority action surfaced by the engine."
  );
}

function getActionDomain(action: any) {
  return String(action?.domain ?? action?.department ?? "system").toLowerCase();
}

function getActionScore(action: any) {
  const raw = Number(
    action?.score ??
      action?.priorityScore ??
      action?.pressureScore ??
      action?.rank ??
      0
  );

  if (Number.isNaN(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

function getActionKey(action: any) {
  return String(
    action?.id ?? `${getActionDomain(action)}-${getActionTitle(action)}`
  );
}

function getActionSeverity(score: number): "critical" | "high" | "medium" {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  return "medium";
}

function getModeBadgeClasses(mode: "auto" | "manual" | "blocked") {
  if (mode === "auto") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (mode === "blocked") {
    return "border border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border border-amber-200 bg-amber-50 text-amber-800";
}

function getSeverityClasses(severity: "critical" | "high" | "medium") {
  if (severity === "critical") {
    return "border border-rose-200 bg-rose-50 text-rose-800";
  }

  if (severity === "high") {
    return "border border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border border-sky-200 bg-sky-50 text-sky-800";
}

function getDomainHref(domain: string) {
  switch (domain) {
    case "finance":
      return "/dashboard/finance";
    case "field":
      return "/dashboard/field";
    case "digital":
      return "/dashboard/digital";
    case "print":
      return "/dashboard/print";
    case "outreach":
      return "/dashboard/outreach";
    default:
      return "/dashboard/focus";
  }
}

function buildActionIntentHref(
  action: {
    id: string;
    title: string;
    domain: string;
    mode: "auto" | "manual" | "blocked";
  },
  intent: "review" | "blocked" | "domain"
) {
  const encodedTitle = encodeURIComponent(action.title);
  const encodedDomain = encodeURIComponent(action.domain);
  const encodedId = encodeURIComponent(action.id);

  if (intent === "domain") {
    return getDomainHref(action.domain);
  }

  if (intent === "review") {
    return `/dashboard/admin?queue=manual-review&action=${encodedId}&domain=${encodedDomain}&label=${encodedTitle}`;
  }

  return `/dashboard/admin?queue=blocked&action=${encodedId}&domain=${encodedDomain}&label=${encodedTitle}`;
}

type DashboardTask = DashboardData["tasks"][number];
type ExecutionMode = "manual" | "hybrid" | "auto";

type TopActionView = {
  raw: any;
  id: string;
  title: string;
  whyNow: string;
  domain: string;
  score: number;
  mode: "auto" | "manual" | "blocked";
  severity: "critical" | "high" | "medium";
  governance: {
    allowed: boolean;
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    reason: string;
  };
};

export default function ExecutionPage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null
  );
  const [previewingActionId, setPreviewingActionId] = useState<string | null>(
    null
  );
  const [executionMessage, setExecutionMessage] = useState("");
  const [executionMode, setExecutionMode] =
    useState<ExecutionMode>("hybrid");
  const [autoRunning, setAutoRunning] = useState(false);
  const [hasAutoRun, setHasAutoRun] = useState(false);
  const [hasLoadedPersistedMode, setHasLoadedPersistedMode] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);

  const [digitalSnapshot, setDigitalSnapshot] = useState<DigitalSnapshot>({
    impressions: 0,
    engagement: 0,
    spend: 0,
    bestPlatform: "No platform data",
    issue: "No digital issues detected yet.",
  });

  const [fieldSnapshot, setFieldSnapshot] = useState<FieldSnapshot>({
    doors: 0,
    conversations: 0,
    ids: 0,
    strongestCanvasser: "No canvasser data",
    issue: "No field issues detected yet.",
  });

  const [printSnapshot, setPrintSnapshot] = useState<PrintSnapshot>({
    onHand: 0,
    orders: 0,
    approvalReady: 0,
    pressureItem: "No print inventory data",
    issue: "No print issues detected yet.",
  });

  const [financeSnapshot, setFinanceSnapshot] = useState<FinanceSnapshot>({
    moneyIn: 0,
    moneyOut: 0,
    net: 0,
    pledges: 0,
  });

  const { ownerFilter, applyMyDashboard } = useDashboardOwner();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAuditLog();
  }, []);

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(
        "aether.executionMode"
      ) as ExecutionMode | null;

      if (
        savedMode === "manual" ||
        savedMode === "hybrid" ||
        savedMode === "auto"
      ) {
        setExecutionMode(savedMode);
      }
    } catch {
      // ignore localStorage read failures
    } finally {
      setHasLoadedPersistedMode(true);
    }
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [
        data,
        liveDigitalSnapshot,
        liveFieldSnapshot,
        livePrintSnapshot,
        liveFinanceSnapshot,
      ] = await Promise.all([
        getDashboardData(),
        getDigitalSnapshot(),
        getFieldSnapshot(),
        getPrintSnapshot(),
        getFinanceSnapshot(),
      ]);

      setContacts(data.contacts ?? []);
      setLists(data.lists ?? []);
      setLogs(data.logs ?? []);
      setTasks((data.tasks as DashboardTask[]) ?? []);
      setDigitalSnapshot(liveDigitalSnapshot);
      setFieldSnapshot(liveFieldSnapshot);
      setPrintSnapshot(livePrintSnapshot);
      setFinanceSnapshot(liveFinanceSnapshot);
      setHasAutoRun(false);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load execution mode");
    } finally {
      setLoading(false);
    }
  }

  async function loadAuditLog() {
    try {
      setAuditLoading(true);
      setAuditError("");

      const response = await fetch("/api/actions/audit?limit=12", {
        method: "GET",
      });

      const data = (await response.json()) as AuditApiResponse;

      if (!response.ok || !data.ok) {
        setAuditError(data.error || "Failed to load execution log");
        return;
      }

      setAuditRecords(Array.isArray(data.records) ? data.records : []);
    } catch (err: any) {
      setAuditError(err?.message || "Failed to load execution log");
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleExecute(action: TopActionView) {
    try {
      setExecutingActionId(action.id);
      setExecutionMessage("");

      const result = await executeGovernedActionItem(action.raw);

      if (result.ok) {
        setExecutionMessage(`✅ ${result.message}`);
        await Promise.all([loadData(), loadAuditLog()]);
      } else {
        setExecutionMessage(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      setExecutionMessage(err?.message || "Execution failed");
    } finally {
      setExecutingActionId(null);
    }
  }

  async function handlePreview(action: TopActionView) {
    try {
      setPreviewingActionId(action.id);
      setExecutionMessage("");

      const result = action.governance.allowed
        ? await dryRunGovernedActionItem(action.raw)
        : await dryRunActionItem(action.raw);

      setExecutionMessage(
        result.ok
          ? `👀 Preview: ${result.message}`
          : `⚠️ Preview failed: ${result.message}`
      );
    } catch (err: any) {
      setExecutionMessage(err?.message || "Preview failed");
    } finally {
      setPreviewingActionId(null);
    }
  }

  async function handleApprove(action: TopActionView) {
    try {
      setExecutingActionId(action.id);
      setExecutionMessage("");

      const result = await approveGovernedActionItem(action.raw);

      if (result.ok) {
        setExecutionMessage(`✅ ${result.message}`);
        await Promise.all([loadData(), loadAuditLog()]);
      } else {
        setExecutionMessage(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      setExecutionMessage(err?.message || "Approval failed");
    } finally {
      setExecutingActionId(null);
    }
  }

  async function handleOverride(action: TopActionView) {
    try {
      setExecutingActionId(action.id);
      setExecutionMessage("");

      const result = await overrideExecuteActionItem(action.raw);

      if (result.ok) {
        setExecutionMessage(`✅ ${result.message}`);
        await Promise.all([loadData(), loadAuditLog()]);
      } else {
        setExecutionMessage(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      setExecutionMessage(err?.message || "Override failed");
    } finally {
      setExecutingActionId(null);
    }
  }

  function canAutoExecute(action: TopActionView) {
    return action.mode === "auto" && action.governance.allowed;
  }

  async function handleAutoRun() {
    try {
      setAutoRunning(true);
      setExecutionMessage("");

      const eligible = topActions.filter((action) => canAutoExecute(action));

      if (eligible.length === 0) {
        setExecutionMessage("No eligible actions for auto execution.");
        return;
      }

      let successCount = 0;

      for (const action of eligible) {
        const result = await executeGovernedActionItem(action.raw);

        if (result.ok) {
          successCount++;
        }
      }

      setExecutionMessage(`⚡ Auto Mode executed ${successCount} actions.`);
      await Promise.all([loadData(), loadAuditLog()]);
    } catch (err: any) {
      setExecutionMessage(err?.message || "Auto execution failed");
    } finally {
      setAutoRunning(false);
    }
  }

  useEffect(() => {
    if (!hasLoadedPersistedMode) return;

    try {
      window.localStorage.setItem("aether.executionMode", executionMode);
    } catch {
      // ignore write failures
    }
  }, [executionMode, hasLoadedPersistedMode]);

  const rawData = useMemo<DashboardData>(() => {
    return {
      contacts: contacts ?? [],
      lists: lists ?? [],
      logs: logs ?? [],
      tasks: tasks ?? [],
    };
  }, [contacts, lists, logs, tasks]);

  const filteredData = useMemo<DashboardData>(() => {
    const result = filterDashboardDataByOwner(rawData, ownerFilter);

    return {
      contacts: result?.contacts ?? [],
      lists: result?.lists ?? [],
      logs: result?.logs ?? [],
      tasks: result?.tasks ?? [],
    };
  }, [rawData, ownerFilter]);

  const ownerSignalsRaw = useMemo(() => {
    return getOwnerDashboardSignals(filteredData.tasks ?? []);
  }, [filteredData]);

  const ownerSignals = useMemo(() => {
    if (Array.isArray(ownerSignalsRaw)) {
      return ownerSignalsRaw;
    }

    if (ownerSignalsRaw && typeof ownerSignalsRaw === "object") {
      const values = Object.values(ownerSignalsRaw as Record<string, unknown>);
      return values.filter(
        (value): value is { owner?: string; summary?: string } =>
          Boolean(value) && typeof value === "object"
      );
    }

    return [];
  }, [ownerSignalsRaw]);

  const priorityTasks = useMemo(() => {
    return (filteredData.tasks ?? []).map((task: any) => ({
      id: String(task.id),
      title: task.title ?? "Untitled task",
      status: normalizeTaskStatus(task.status),
      priority: task.priority ?? null,
      due_at: task.due_at ?? task.due_date ?? null,
      created_at: task.created_at ?? null,
      updated_at: task.updated_at ?? null,
      completed_at:
        normalizeTaskStatus(task.status) === "completed"
          ? task.updated_at ?? task.completed_at ?? null
          : task.completed_at ?? null,
      assigned_to: task.assigned_to ?? task.owner_name ?? null,
      owner_id: task.owner_id ?? task.owner_name ?? null,
      department: task.department ?? null,
      blocked: Boolean(task.blocked),
      contact_id: task.contact_id ?? null,
      estimated_value: Number(task.estimated_value ?? 0) || null,
    }));
  }, [filteredData.tasks]);

  const priorityContacts = useMemo(() => {
    return (filteredData.contacts ?? []).map((contact: any) => ({
      id: String(contact.id),
      first_name: contact.first_name ?? null,
      last_name: contact.last_name ?? null,
      full_name:
        contact.full_name ??
        `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
      owner_id: contact.owner_id ?? contact.owner_name ?? null,
      assigned_to: contact.assigned_to ?? contact.owner_name ?? null,
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
      needs_follow_up:
        Boolean(contact.needs_follow_up) ||
        Boolean(contact.last_contacted_at) === false,
      is_stale: Boolean(contact.is_stale),
    }));
  }, [filteredData.contacts]);

  const ownerDirectory = useMemo(() => {
    const map: Record<string, string> = {};

    (filteredData.contacts ?? []).forEach((contact: any) => {
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

    (filteredData.tasks ?? []).forEach((task: any) => {
      const ownerId = task.owner_id ?? task.assigned_to ?? task.owner_name;
      const ownerName =
        task.owner_name ?? task.assigned_to ?? task.owner_id ?? task.owner_name;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    return map;
  }, [filteredData]);

  const commandCenterInput = useMemo(() => {
    return {
      tasks: priorityTasks,
      contacts: priorityContacts,
      opportunities: [],
      ownerDirectory,
    };
  }, [priorityTasks, priorityContacts, ownerDirectory]);

  const commandCenterFull = useMemo(() => {
    return buildCommandCenterAdapterResult(commandCenterInput);
  }, [commandCenterInput]);

  const commandCenterPage = useMemo(() => {
    return getCommandCenterPageData(commandCenterFull.snapshot);
  }, [commandCenterFull]);

  const outreachBundle = useMemo(() => {
    const staleContacts = (filteredData.contacts ?? []).filter((contact: any) =>
      Boolean(contact.is_stale)
    ).length;

    const pendingFollowUps = (filteredData.tasks ?? []).filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);

      return (
        status !== "completed" &&
        (title.includes("follow-up") || title.includes("follow up"))
      );
    }).length;

    const positiveContacts = (filteredData.logs ?? []).filter((log: any) => {
      const result = String(log.result || "").toLowerCase();

      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
      );
    }).length;

    const uncontactedContacts = Math.max(
      0,
      (filteredData.contacts ?? []).length - (filteredData.logs ?? []).length
    );

    return getOutreachSignals({
      staleContacts,
      pendingFollowUps,
      positiveContacts,
      uncontactedContacts,
    });
  }, [filteredData]);

  const financeBundle = useMemo(() => {
    const missingComplianceRecords = Math.max(
      0,
      Math.round(financeSnapshot.pledges / 1000)
    );

    const overduePledges = Math.max(
      0,
      Math.round(financeSnapshot.pledges / 2500)
    );

    const highValueDonorsPending = (filteredData.contacts ?? []).filter(
      (contact: any) =>
        Number(contact.donation_total ?? 0) >= 500 ||
        Number(contact.pledge_amount ?? 0) >= 500
    ).length;

    const cashOnHandPressure =
      financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 8 : 4;

    return getFinanceSignals({
      missingComplianceRecords,
      overduePledges,
      highValueDonorsPending,
      cashOnHandPressure,
    });
  }, [financeSnapshot, filteredData.contacts]);

  const fieldBundle = useMemo(() => {
    const incompleteTurfs =
      fieldSnapshot.doors > 0
        ? Math.max(1, Math.round(fieldSnapshot.doors / 700))
        : 0;

    const highPriorityTurfs =
      fieldSnapshot.ids > 0
        ? Math.max(1, Math.round(fieldSnapshot.ids / 80))
        : 0;

    const strongIdRateZones =
      fieldSnapshot.ids > 0 && fieldSnapshot.conversations > 0
        ? Math.max(
            1,
            Math.round((fieldSnapshot.ids / fieldSnapshot.conversations) * 4)
          )
        : 0;

    const weakCoverageZones =
      fieldSnapshot.doors > 0
        ? Math.max(1, Math.round(fieldSnapshot.doors / 1200))
        : 0;

    return getFieldSignals({
      incompleteTurfs,
      highPriorityTurfs,
      strongIdRateZones,
      weakCoverageZones,
    });
      }, [fieldSnapshot]);

  const digitalBundle = useMemo(() => {
    const issueText = String(digitalSnapshot.issue || "").toLowerCase();
    const fallingCtrPlatforms = issueText.includes("issue") ? 1 : 0;
    const strongPerformingPlatforms = digitalSnapshot.bestPlatform ? 1 : 0;
    const negativeSentimentThreads = issueText.includes("sentiment") ? 1 : 0;
    const contentBacklogCount = Math.max(
      1,
      Math.round(digitalSnapshot.engagement / 5000)
    );

    return getDigitalSignals({
      fallingCtrPlatforms,
      strongPerformingPlatforms,
      negativeSentimentThreads,
      contentBacklogCount,
    });
  }, [digitalSnapshot]);

  const printBundle = useMemo(() => {
    const approvalBlocks = printSnapshot.approvalReady > 0 ? 1 : 2;
    const nearReorderItems =
      printSnapshot.onHand > 0
        ? Math.max(1, Math.round(printSnapshot.onHand / 4000))
        : 0;
    const deliveryRisks =
      printSnapshot.orders > 0
        ? Math.max(1, Math.round(printSnapshot.orders / 2))
        : 0;
    const readyAssets = printSnapshot.approvalReady;

    return getPrintSignals({
      approvalBlocks,
      nearReorderItems,
      deliveryRisks,
      readyAssets,
    });
  }, [printSnapshot]);

  const intelligenceSnapshot = useMemo(() => {
    return aggregateAetherIntelligence(
      [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle],
      {
        finance: {
          overduePledges:
            (financeBundle.risks.find(
              (item) => item.id === "finance-overdue-pledges"
            )?.metadata?.overduePledges as number) || 0,
          highValueDonorsPending:
            (financeBundle.opportunities.find(
              (item) => item.id === "finance-high-value-donors"
            )?.metadata?.highValueDonorsPending as number) || 0,
        },
        outreach: {
          pendingFollowUps:
            (outreachBundle.risks.find(
              (item) => item.id === "outreach-pending-followups"
            )?.metadata?.pendingFollowUps as number) || 0,
          positiveContacts:
            (outreachBundle.opportunities.find(
              (item) => item.id === "outreach-positive-contacts"
            )?.metadata?.positiveContacts as number) || 0,
        },
        field: {
          strongIdRateZones:
            (fieldBundle.opportunities.find(
              (item) => item.id === "field-strong-id-zones"
            )?.metadata?.strongIdRateZones as number) || 0,
          incompleteTurfs:
            (fieldBundle.risks.find(
              (item) => item.id === "field-incomplete-turfs"
            )?.metadata?.incompleteTurfs as number) || 0,
        },
        digital: {
          strongPerformingPlatforms:
            (digitalBundle.opportunities.find(
              (item) => item.id === "digital-strong-platforms"
            )?.metadata?.strongPerformingPlatforms as number) || 0,
          negativeSentimentThreads:
            (digitalBundle.risks.find(
              (item) => item.id === "digital-negative-sentiment"
            )?.metadata?.negativeSentimentThreads as number) || 0,
        },
        print: {
          readyAssets:
            (printBundle.opportunities.find(
              (item) => item.id === "print-ready-assets"
            )?.metadata?.readyAssets as number) || 0,
          deliveryRisks:
            (printBundle.statuses.find(
              (item) => item.id === "print-delivery-risks"
            )?.metadata?.deliveryRisks as number) || 0,
        },
      }
    );
  }, [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle]);

  const intelligenceTriggerActions = useMemo(() => {
    const highValueContacts = (filteredData.contacts ?? []).map((contact: any) => ({
      id: String(contact.id),
      full_name:
        contact.full_name ??
        `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
      donation_total: Number(contact.donation_total ?? 0),
      pledge_amount: Number(contact.pledge_amount ?? 0),
      last_contacted_at:
        contact.last_contacted_at ??
        contact.last_outreach_at ??
        null,
    }));

    return getTopTriggerActions(intelligenceSnapshot, 6, {
      highValueContacts,
    });
  }, [intelligenceSnapshot, filteredData.contacts]);

  const intelligenceActionItems = useMemo(() => {
    return buildActionItemsFromTriggers(intelligenceTriggerActions);
  }, [intelligenceTriggerActions]);

  const unifiedActionEngineFull = useMemo(() => {
    return buildUnifiedActionEngineAdapterResult(
      commandCenterInput,
      intelligenceActionItems
    );
  }, [commandCenterInput, intelligenceActionItems]);

  const autoExecutionFull = useMemo(() => {
    if (executionMode === "manual") {
      return buildAutoExecutionPlan(unifiedActionEngineFull.actionEngine.actions, {
        mode: "manual",
      });
    }

    if (executionMode === "auto") {
      return buildAutoExecutionPlan(unifiedActionEngineFull.actionEngine.actions, {
        mode: "auto",
        requireApproval: false,
      });
    }

    return buildAutoExecutionPlan(unifiedActionEngineFull.actionEngine.actions, {
      mode: "hybrid",
      requireApproval: true,
    });
  }, [unifiedActionEngineFull, executionMode]);

  const actionEnginePage = useMemo(() => {
    return getActionEnginePageData(unifiedActionEngineFull.actionEngine);
  }, [unifiedActionEngineFull]);

  const allTopActions = useMemo<TopActionView[]>(() => {
    const manualKeys = new Set(
      (autoExecutionFull.manualReview ?? []).map((action: any) =>
        getActionKey(action)
      )
    );
    const blockedKeys = new Set(
      (autoExecutionFull.blocked ?? []).map((action: any) =>
        getActionKey(action)
      )
    );
    const autoKeys = new Set(
      (autoExecutionFull.autoExecutable ?? []).map((action: any) =>
        getActionKey(action)
      )
    );

    return (unifiedActionEngineFull.actionEngine.topActions ?? []).map((action: any) => {
      const key = getActionKey(action);
      let mode: "auto" | "manual" | "blocked" = "manual";

      if (blockedKeys.has(key)) mode = "blocked";
      else if (autoKeys.has(key)) mode = "auto";
      else if (manualKeys.has(key)) mode = "manual";

      return {
        raw: action,
        id: key,
        title: getActionTitle(action),
        whyNow: getActionWhyNow(action),
        domain: getActionDomain(action),
        score: getActionScore(action),
        mode,
        severity: getActionSeverity(getActionScore(action)),
        governance: getGovernedExecutionDecision(action),
      };
    });
  }, [autoExecutionFull, unifiedActionEngineFull]);

  const topActions = useMemo(() => {
    return allTopActions
      .filter((action) => action && action.id && action.title)
      .slice(0, 12);
  }, [allTopActions]);

  const selectedAction = useMemo(() => {
    if (!selectedActionId) {
      return topActions[0] ?? null;
    }

    const found = topActions.find((action) => action.id === selectedActionId);
    return found ?? topActions[0] ?? null;
  }, [topActions, selectedActionId]);

  const autoExecutableActions = useMemo(() => {
    return topActions.filter((action) => action.mode === "auto").slice(0, 12);
  }, [topActions]);

  const manualReviewActions = useMemo(() => {
    return topActions.filter((action) => action.mode === "manual").slice(0, 12);
  }, [topActions]);

  const blockedActions = useMemo(() => {
    return topActions.filter((action) => action.mode === "blocked").slice(0, 12);
  }, [topActions]);

  const criticalActionCount = useMemo(
    () =>
      allTopActions.filter((action) => action.severity === "critical").length,
    [allTopActions]
  );

  const executionSummary = useMemo(() => {
    return buildExecutionSummary(auditRecords);
  }, [auditRecords]);

  const executionReadinessLabel = useMemo(() => {
    if (blockedActions.length > autoExecutableActions.length) {
      return "Execution is currently constrained by governance and policy";
    }

    if (executionSummary.blockedRate >= 35) {
      return "Execution posture is seeing elevated policy friction right now";
    }

    if (executionSummary.failureRate >= 35) {
      return "Execution posture is seeing elevated failure pressure right now";
    }

    if (autoExecutableActions.length >= manualReviewActions.length) {
      return "Execution mode is ready to move on governed actions";
    }

    return "Execution mode is prioritizing review before direct action";
  }, [
    blockedActions.length,
    autoExecutableActions.length,
    manualReviewActions.length,
    executionSummary.blockedRate,
    executionSummary.failureRate,
  ]);

  const executionFeedback = useMemo(() => {
    return evaluateExecutionSummaryFeedback({
      summary: executionSummary,
      strategy: "balanced",
    });
  }, [executionSummary]);

  useEffect(() => {
    if (!hasLoadedPersistedMode) return;
    if (executionMode !== "auto") return;
    if (autoRunning) return;
    if (hasAutoRun) return;
    if (autoExecutableActions.length === 0) return;

    handleAutoRun();
    setHasAutoRun(true);
  }, [
    executionMode,
    autoExecutableActions,
    autoRunning,
    hasAutoRun,
    hasLoadedPersistedMode,
  ]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading execution mode...</p>
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
              <Zap className="h-4 w-4" />
              Execution mode
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Governed Execution Center
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                This is where Aether turns visibility into action. Review,
                approve, override, and execute surfaced actions without crowding
                the overview dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadData}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              onClick={applyMyDashboard}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              My Execution View
            </button>

            <button
              onClick={loadAuditLog}
              disabled={auditLoading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auditLoading ? "Refreshing Log..." : "Refresh Execution Log"}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Overview
            </Link>

            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900 transition hover:bg-indigo-100"
            >
              <Sparkles className="h-4 w-4" />
              Admin Control
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {executionMessage ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {executionMessage}
        </div>
      ) : null}

      {auditError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {auditError}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Bot className="h-3.5 w-3.5" />
              Governed Action Layer
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                {commandCenterPage.hero.headline}
              </h2>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {commandCenterPage.hero.subheadline}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    Auto Mode
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Execution posture: {executionMode.toUpperCase()}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">
                    Manual keeps operators in full control. Hybrid preserves
                    governed review. Auto lets Aether run every currently
                    eligible action through your unified execution pipeline.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["manual", "hybrid", "auto"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExecutionMode(mode)}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                        executionMode === mode
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {executionMode === "auto" ? (
                <button
                  type="button"
                  onClick={handleAutoRun}
                  disabled={autoRunning}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  {autoRunning ? "Running Auto Mode..." : "Run Auto Mode"}
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">
                  Auto Ready
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {autoExecutableActions.length}
                </p>
                <p className="mt-1 text-sm text-emerald-100">
                  Governed actions ready to execute
                </p>
              </div>

              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">
                  Review Queue
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {manualReviewActions.length}
                </p>
                <p className="mt-1 text-sm text-amber-100">
                  Actions waiting on approval
                </p>
              </div>

              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-rose-100/80">
                  Blocked
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {blockedActions.length}
                </p>
                <p className="mt-1 text-sm text-rose-100">
                  Actions constrained by policy
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">
                Execution posture
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {executionReadinessLabel}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                {actionEnginePage.domainPriority.subheadline}
              </p>
              <p className="mt-3 text-sm text-cyan-100">
                Feedback: {executionFeedback.recommendation}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Execution snapshot
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Control overview
                </h3>
              </div>
              <Activity className="h-5 w-5 text-slate-300" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-300">Critical actions</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {criticalActionCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-300">Top domain</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {actionEnginePage.domainPriority.topDomain
                    ? actionEnginePage.domainPriority.topDomain.domain.toUpperCase()
                    : "No domain priority surfaced"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {actionEnginePage.domainPriority.headline}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-300">Owner pressure</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {ownerSignals.length > 0
                    ? `${ownerSignals.length} owner signals active`
                    : "No owner signals surfaced"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-300">Execution health</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {executionFeedback.executionHealthScore}/100
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Success {executionSummary.successRate}% · Failure{" "}
                  {executionSummary.failureRate}% · Blocked{" "}
                  {executionSummary.blockedRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
            <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Auto Executable
              </p>
              <h2 className="mt-1 text-xl font-semibold text-emerald-900">
                Ready now
              </h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>

          <div className="mt-4 space-y-3">
            {autoExecutableActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedActionId(action.id)}
                className="w-full rounded-2xl border border-emerald-200 bg-white p-4 text-left transition hover:bg-emerald-50"
              >
                <p className="font-medium text-slate-900">{action.title}</p>
                <p className="mt-1 text-sm text-slate-600">{action.whyNow}</p>
              </button>
            ))}

            {autoExecutableActions.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-500">
                No auto-executable actions are surfaced right now.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Manual Review
              </p>
              <h2 className="mt-1 text-xl font-semibold text-amber-900">
                Needs approval
              </h2>
            </div>
            <ShieldAlert className="h-5 w-5 text-amber-700" />
          </div>

          <div className="mt-4 space-y-3">
            {manualReviewActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedActionId(action.id)}
                className="w-full rounded-2xl border border-amber-200 bg-white p-4 text-left transition hover:bg-amber-50"
              >
                <p className="font-medium text-slate-900">{action.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Governance: {action.governance.reason}
                </p>
              </button>
            ))}

            {manualReviewActions.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-500">
                No review actions are waiting right now.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-800">Blocked</p>
              <h2 className="mt-1 text-xl font-semibold text-rose-900">
                Held by policy
              </h2>
            </div>
            <ShieldAlert className="h-5 w-5 text-rose-700" />
          </div>

          <div className="mt-4 space-y-3">
            {blockedActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedActionId(action.id)}
                className="w-full rounded-2xl border border-rose-200 bg-white p-4 text-left transition hover:bg-rose-50"
              >
                <p className="font-medium text-slate-900">{action.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Governance: {action.governance.reason}
                </p>
              </button>
            ))}

            {blockedActions.length === 0 ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-slate-500">
                No blocked actions are surfaced right now.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-800">
                Failure Hotspots
              </p>
              <h2 className="mt-1 text-xl font-semibold text-rose-900">
                Repeated failures
              </h2>
            </div>
            <X className="h-5 w-5 text-rose-700" />
          </div>

          <div className="mt-4 space-y-3">
            {executionSummary.repeatedFailureActionTypes.slice(0, 4).map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-rose-200 bg-white p-4"
              >
                <p className="font-medium text-slate-900">{item.key}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.count} repeated failure{item.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}

            {executionSummary.repeatedFailureActionTypes.length === 0 ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-slate-500">
                No repeated failure hotspots surfaced yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Blocked Hotspots
              </p>
              <h2 className="mt-1 text-xl font-semibold text-amber-900">
                Policy friction
              </h2>
            </div>
            <ShieldAlert className="h-5 w-5 text-amber-700" />
          </div>

          <div className="mt-4 space-y-3">
            {executionSummary.repeatedBlockedReasons.slice(0, 4).map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-amber-200 bg-white p-4"
              >
                <p className="font-medium text-slate-900">
                  {item.key
                    .split("_")
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.count} repeated block{item.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}

            {executionSummary.repeatedBlockedReasons.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-500">
                No repeated blocked hotspots surfaced yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sky-800">
                Unstable Domains
              </p>
              <h2 className="mt-1 text-xl font-semibold text-sky-900">
                Concentrated pressure
              </h2>
            </div>
            <Activity className="h-5 w-5 text-sky-700" />
          </div>

          <div className="mt-4 space-y-3">
            {executionSummary.unstableDomains.slice(0, 4).map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-sky-200 bg-white p-4"
              >
                <p className="font-medium text-slate-900">
                  {item.key.toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.count} instability signal{item.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}

            {executionSummary.unstableDomains.length === 0 ? (
              <div className="rounded-2xl border border-sky-200 bg-white p-4 text-sm text-slate-500">
                No unstable domains surfaced yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Execution Queue</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Top action queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Governed execution, approvals, overrides, and routed review all
                live here.
              </p>
            </div>
            <Lightbulb className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
            {topActions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No high-priority execution items are surfaced right now.
              </div>
            ) : (
              topActions.map((action) => {
                const isSelected = selectedAction?.id === action.id;

                return (
                  <div
                    key={action.id}
                    className={`rounded-3xl border p-5 transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-100"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getModeBadgeClasses(
                                action.mode
                              )}`}
                            >
                              {action.mode === "auto"
                                ? "Auto-executable"
                                : action.mode === "blocked"
                                  ? "Blocked"
                                  : "Manual review"}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getSeverityClasses(
                                action.severity
                              )}`}
                            >
                              {action.severity.toUpperCase()}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              {action.domain.toUpperCase()}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              Confidence {action.governance.confidence}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              Risk {action.governance.riskLevel.toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {action.title}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {action.whyNow}
                            </p>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Governance: {action.governance.reason}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <div className="font-semibold">Score {action.score}/100</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Ranked by unified engine pressure
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {action.mode === "auto" && action.governance.allowed ? (
                          <button
                            type="button"
                            onClick={() => handleExecute(action)}
                            disabled={executingActionId === action.id}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Zap className="h-4 w-4" />
                            {executingActionId === action.id ? "Running..." : "Run now"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handlePreview(action)}
                          disabled={previewingActionId === action.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {previewingActionId === action.id ? "Previewing..." : "Preview"}
                        </button>

                        {!action.governance.allowed ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(action)}
                            disabled={executingActionId === action.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-900 transition hover:bg-blue-100 disabled:opacity-50"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            {executingActionId === action.id ? "Approving..." : "Approve"}
                          </button>
                        ) : null}

                        {action.mode === "blocked" ? (
                          <button
                            type="button"
                            onClick={() => handleOverride(action)}
                            disabled={executingActionId === action.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            {executingActionId === action.id ? "Overriding..." : "Override"}
                          </button>
                        ) : null}

                        {(action.mode === "manual" || !action.governance.allowed) &&
                        action.mode !== "blocked" ? (
                          <Link
                            href={buildActionIntentHref(action, "review")}
                            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            Send to review
                          </Link>
                        ) : null}

                        {action.mode === "blocked" ? (
                          <Link
                            href={buildActionIntentHref(action, "blocked")}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Why blocked
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}

                        <Link
                          href={buildActionIntentHref(action, "domain")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Open domain
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setSelectedActionId(action.id)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Action details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Action Detail</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Selected control surface
              </h2>
            </div>

            {selectedAction ? (
              <button
                type="button"
                onClick={() => setSelectedActionId(null)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {selectedAction ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getModeBadgeClasses(
                    selectedAction.mode
                  )}`}
                >
                  {selectedAction.mode === "auto"
                    ? "Auto-executable"
                    : selectedAction.mode === "blocked"
                      ? "Blocked"
                      : "Manual review"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getSeverityClasses(
                    selectedAction.severity
                  )}`}
                >
                  {selectedAction.severity.toUpperCase()}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {selectedAction.domain.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {selectedAction.title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedAction.whyNow}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Execution mode</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedAction.governance.allowed
                      ? "Allowed by governance"
                      : "Requires review"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Engine score</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedAction.score}/100
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Governance confidence</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedAction.governance.confidence}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Risk level</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedAction.governance.riskLevel.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Governance reason</p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedAction.governance.reason}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Operator guidance</p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedAction.governance.allowed
                    ? "This action cleared the governance layer and can be executed directly from execution mode."
                    : "This action is visible, but governance is preventing direct execution. Approve it, override it if necessary, or route it through review."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedAction.mode === "auto" &&
                selectedAction.governance.allowed ? (
                  <button
                    type="button"
                    onClick={() => handleExecute(selectedAction)}
                    disabled={executingActionId === selectedAction.id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    {executingActionId === selectedAction.id
                      ? "Running..."
                      : "Run action"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => handlePreview(selectedAction)}
                  disabled={previewingActionId === selectedAction.id}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {previewingActionId === selectedAction.id
                    ? "Previewing..."
                    : "Preview"}
                </button>

                {!selectedAction.governance.allowed ? (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedAction)}
                    disabled={executingActionId === selectedAction.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-900 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {executingActionId === selectedAction.id
                      ? "Approving..."
                      : "Approve action"}
                  </button>
                ) : null}

                {selectedAction.mode === "blocked" ? (
                  <button
                    type="button"
                    onClick={() => handleOverride(selectedAction)}
                    disabled={executingActionId === selectedAction.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-900 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {executingActionId === selectedAction.id
                      ? "Overriding..."
                      : "Override execution"}
                  </button>
                ) : null}

                {(selectedAction.mode === "manual" ||
                  !selectedAction.governance.allowed) &&
                selectedAction.mode !== "blocked" ? (
                  <Link
                    href={buildActionIntentHref(selectedAction, "review")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Open review queue
                  </Link>
                ) : null}

                {selectedAction.mode === "blocked" ? (
                  <Link
                    href={buildActionIntentHref(selectedAction, "blocked")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Why blocked
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}

                <Link
                  href={buildActionIntentHref(selectedAction, "domain")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open {selectedAction.domain} page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Select an action card to inspect its control surface.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}