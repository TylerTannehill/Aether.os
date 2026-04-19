"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Eye,
  Play,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  computeDashboardMetrics,
  filterDashboardDataByOwner,
  getDashboardData,
  getTodaySnapshot,
} from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
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
import { useDashboardOwner } from "../owner-context";
import { buildCommandCenterAdapterResult } from "@/lib/priority/command-center-adapter";
import { buildUnifiedActionEngineAdapterResult } from "@/lib/priority/action-engine-adapter";
import { buildAutoExecutionPlan } from "@/lib/priority/auto-execution";
import {
  analyzePolicyBlocks,
  generatePolicySuggestions,
} from "@/lib/brain/policy-feedback";
import {
  DEFAULT_AUTONOMY_CONFIG,
  mergeAutonomyConfig,
  type AutonomyConfig,
} from "@/lib/brain/autonomy-config";
import { generatePolicyRecommendations } from "@/lib/brain/policy-recommendations";
import {
  appendPolicyVersion,
  createPolicyVersionRecord,
  rollbackPolicyVersion,
  type PolicyVersionRecord,
} from "@/lib/brain/policy-versioning";
import { decideStrategy } from "@/lib/brain/strategy-layer";
import { evaluateExecutionSummaryFeedback } from "@/lib/brain/feedback-loop";
import { buildExecutionSummary } from "@/lib/brain/execution-summary";
import {
  getOutreachSignals,
  getFinanceSignals,
  getFieldSignals,
  getDigitalSignals,
  getPrintSignals,
} from "@/lib/intelligence/signals";
import {
  aggregateAetherIntelligence,
  buildAetherSummaryText,
} from "@/lib/intelligence/aggregator";
import {
  getTopTriggerActions,
  summarizeTriggerActions,
  buildActionItemsFromTriggers,
} from "@/lib/intelligence/action-triggers";
import { buildDraftTasksFromTriggers } from "@/lib/intelligence/task-drafts";
import {
  suggestStrategyFromIntelligence,
  shouldAutoShiftStrategy,
} from "@/lib/intelligence/strategy-hooks";
import {
  dryRunGovernedActionItem,
  executeGovernedActionItem,
  getGovernedExecutionDecision,
} from "@/lib/priority/action-execution-client";
/* ADMIN CONTROL LAYER */

type DomainKey = "outreach" | "finance" | "field" | "digital" | "print";

type DomainPriority = {
  key: DomainKey;
  label: string;
  weight: number;
};

type AdminFocusTask = {
  id: string;
  title: string;
  type: "governance" | "execution" | "risk";
  priority: "high" | "medium" | "low";
  summary: string;
};

type SystemCommand =
  | "fundraising_push"
  | "outreach_push"
  | "stability"
  | "clear_blocked_queue"
  | "reinforce_top_domain";

function focusPriorityTone(priority: "high" | "medium" | "low") {
  if (priority === "high") return "red";
  if (priority === "medium") return "yellow";
  return "gray";
}
type DashboardTask = DashboardData["tasks"][number] & {
  fallback_reason?: string | null;
};

type AutoExecutionApiResponse = {
  ok: boolean;
  mode?: string;
  dryRun?: boolean;
  limit?: number;
  result?: {
    snapshotAt: string;
    summary: {
      scanned: number;
      eligible: number;
      executed: number;
      skipped: number;
      failed: number;
    };
  };
  error?: string;
};

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

type AdminActionView = {
  raw: any;
  id: string;
  title: string;
  whyNow: string;
  domain: string;
  score: number;
  mode: "auto" | "manual" | "blocked";
  governance: {
    allowed: boolean;
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    reason: string;
  };
};

const AUTONOMY_CONFIG_STORAGE_KEY = "aether_autonomy_config";
const POLICY_VERSION_STORAGE_KEY = "aether_policy_versions";

function readStoredAutonomyConfig(): AutonomyConfig {
  if (typeof window === "undefined") return DEFAULT_AUTONOMY_CONFIG;

  try {
    const raw = window.localStorage.getItem(AUTONOMY_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_AUTONOMY_CONFIG;
    return mergeAutonomyConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_AUTONOMY_CONFIG;
  }
}

function writeStoredAutonomyConfig(config: AutonomyConfig) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      AUTONOMY_CONFIG_STORAGE_KEY,
      JSON.stringify(config)
    );
  } catch {
    // ignore storage failures
  }
}

function readStoredPolicyVersions(): PolicyVersionRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(POLICY_VERSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredPolicyVersions(history: PolicyVersionRecord[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      POLICY_VERSION_STORAGE_KEY,
      JSON.stringify(history)
    );
  } catch {
    // ignore storage failures
  }
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

function formatPolicyReason(reason?: string | null) {
  if (!reason) return "Blocked by policy";

  return reason
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAuditTimestamp(value?: string | null) {
  if (!value) return "No timestamp";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
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

function getActionModeClasses(mode: "auto" | "manual" | "blocked") {
  if (mode === "auto") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (mode === "blocked") {
    return "border border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border border-amber-200 bg-amber-50 text-amber-800";
}

function toAdminActionView(
  action: any,
  mode: "auto" | "manual" | "blocked"
): AdminActionView {
  return {
    raw: action,
    id: getActionKey(action),
    title: getActionTitle(action),
    whyNow: getActionWhyNow(action),
    domain: getActionDomain(action),
    score: getActionScore(action),
    mode,
    governance: getGovernedExecutionDecision(action),
  };
}

export default function DashboardAdminPage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

  const [runningAutoExecution, setRunningAutoExecution] = useState(false);
  const [previewingAutoExecution, setPreviewingAutoExecution] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [auditSummary, setAuditSummary] =
    useState<AuditApiResponse["summary"] | null>(null);

  const [autonomyConfig, setAutonomyConfig] = useState<AutonomyConfig>(
    DEFAULT_AUTONOMY_CONFIG
  );
  const [policyVersionHistory, setPolicyVersionHistory] = useState<
    PolicyVersionRecord[]
  >([]);
  const [policyActionMessage, setPolicyActionMessage] = useState("");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null
  );
const [adminFocusMode, setAdminFocusMode] = useState(false);

const [domainPriorities, setDomainPriorities] = useState<DomainPriority[]>([
  { key: "finance", label: "Finance", weight: 5 },
  { key: "outreach", label: "Outreach", weight: 4 },
  { key: "digital", label: "Digital", weight: 3 },
  { key: "field", label: "Field", weight: 2 },
  { key: "print", label: "Print", weight: 1 },
]);

const [adminCommandMessage, setAdminCommandMessage] = useState("");

const [selectedAdminFocusTaskId, setSelectedAdminFocusTaskId] =
  useState("admin-focus-1");
  const { ownerFilter } = useDashboardOwner();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setAutonomyConfig(readStoredAutonomyConfig());
    setPolicyVersionHistory(readStoredPolicyVersions());
  }, []);

  useEffect(() => {
    loadAuditLog();
  }, []);

  useEffect(() => {
    writeStoredAutonomyConfig(autonomyConfig);
  }, [autonomyConfig]);

  useEffect(() => {
    writeStoredPolicyVersions(policyVersionHistory);
  }, [policyVersionHistory]);

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
    } catch (err: any) {
      setMessage(err?.message || "Failed to load admin data");
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
      setAuditSummary(data.summary ?? null);
    } catch (err: any) {
      setAuditError(err?.message || "Failed to load execution log");
    } finally {
      setAuditLoading(false);
    }
  }

  async function handlePreviewUnifiedAction(action: AdminActionView) {
    try {
      setExecutingActionId(action.id);
      setMessage("");

      const result = await dryRunGovernedActionItem(action.raw);

      setMessage(
        result.ok
          ? `Preview complete → ${result.message}`
          : `Preview failed → ${result.message}`
      );
    } catch (err: any) {
      setMessage(err?.message || "Failed to preview action");
    } finally {
      setExecutingActionId(null);
    }
  }

  async function handleRunUnifiedAction(action: AdminActionView) {
    try {
      setExecutingActionId(action.id);
      setMessage("");

      const result = await executeGovernedActionItem(action.raw);

      if (result.ok) {
        setMessage(`Executed → ${result.message}`);
        await Promise.all([loadData(), loadAuditLog()]);
      } else {
        setMessage(`Execution issue → ${result.message}`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to execute action");
    } finally {
      setExecutingActionId(null);
    }
  }

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

  const highValueContacts = useMemo(() => {
    return (filteredData.contacts ?? []).map((c: any) => ({
      id: String(c.id),
      full_name: c.full_name,
      donation_total: Number(c.donation_total ?? 0),
      pledge_amount: Number(c.pledge_amount ?? 0),
      last_contacted_at: c.last_contacted_at,
    }));
  }, [filteredData.contacts]);

  const metrics = useMemo(() => {
    return computeDashboardMetrics(
      filteredData.contacts ?? [],
      filteredData.lists ?? [],
      filteredData.logs ?? []
    );
  }, [filteredData]);

  const todaySnapshot = useMemo(() => {
    return getTodaySnapshot(filteredData.tasks ?? [], filteredData.logs ?? []);
  }, [filteredData]);

  const overdueTasks = useMemo(
    () =>
      (filteredData.tasks ?? []).filter((task: any) => {
        const status = normalizeTaskStatus(task.status);
        const dueDate = task.due_date || task.due_at;
        return (
          status !== "completed" && !!dueDate && new Date(dueDate) < new Date()
        );
      }).length,
    [filteredData]
  );

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
      assigned_to: task.assigned_to ?? null,
      owner_id: task.owner_id ?? null,
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
      owner_id: contact.owner_id ?? null,
      assigned_to: contact.assigned_to ?? contact.owner ?? null,
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
      const ownerId = task.owner_id ?? task.assigned_to;
      const ownerName = task.owner_name ?? task.assigned_to ?? task.owner_id;

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
      fieldSnapshot.doors > 0 ? Math.max(1, Math.round(fieldSnapshot.doors / 700)) : 0;

    const highPriorityTurfs =
      fieldSnapshot.ids > 0 ? Math.max(1, Math.round(fieldSnapshot.ids / 80)) : 0;

    const strongIdRateZones =
      fieldSnapshot.ids > 0 && fieldSnapshot.conversations > 0
        ? Math.max(1, Math.round((fieldSnapshot.ids / fieldSnapshot.conversations) * 4))
        : 0;

    const weakCoverageZones =
      fieldSnapshot.doors > 0 ? Math.max(1, Math.round(fieldSnapshot.doors / 1200)) : 0;

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

  const intelligenceSummary = useMemo(() => {
    return buildAetherSummaryText(intelligenceSnapshot);
  }, [intelligenceSnapshot]);

  const triggerActions = useMemo(() => {
    return getTopTriggerActions(intelligenceSnapshot, 5, {
      highValueContacts,
    });
  }, [intelligenceSnapshot, highValueContacts]);

  const triggerSummary = useMemo(() => {
    return summarizeTriggerActions(triggerActions);
  }, [triggerActions]);

  const draftTasks = useMemo(() => {
    return buildDraftTasksFromTriggers(triggerActions);
  }, [triggerActions]);

  const intelligenceActionItems = useMemo(() => {
    return buildActionItemsFromTriggers(triggerActions);
  }, [triggerActions]);

  const unifiedActionEngineFull = useMemo(() => {
    return buildUnifiedActionEngineAdapterResult(
      commandCenterInput,
      intelligenceActionItems
    );
  }, [commandCenterInput, intelligenceActionItems]);

  const autoExecutionPlan = useMemo(() => {
    return buildAutoExecutionPlan(unifiedActionEngineFull.actionEngine.actions, {
      mode:
        autonomyConfig.mode === "off"
          ? "manual"
          : autonomyConfig.mode === "auto_safe"
            ? "auto"
            : "hybrid",
      requireApproval: autonomyConfig.mode !== "auto_safe",
    });
  }, [unifiedActionEngineFull, autonomyConfig.mode]);

  const allAdminActions = useMemo<AdminActionView[]>(() => {
    const manualKeys = new Set(
      (autoExecutionPlan.manualReview ?? []).map((decision) =>
        getActionKey(decision.action)
      )
    );
    const blockedKeys = new Set(
      (autoExecutionPlan.blocked ?? []).map((decision) =>
        getActionKey(decision.action)
      )
    );
    const autoKeys = new Set(
      (autoExecutionPlan.autoExecutable ?? []).map((decision) =>
        getActionKey(decision.action)
      )
    );

    return (unifiedActionEngineFull.actionEngine.topActions ?? []).map(
      (action: any) => {
        const key = getActionKey(action);
        let mode: "auto" | "manual" | "blocked" = "manual";

        if (blockedKeys.has(key)) mode = "blocked";
        else if (autoKeys.has(key)) mode = "auto";
        else if (manualKeys.has(key)) mode = "manual";

        return toAdminActionView(action, mode);
      }
    );
  }, [autoExecutionPlan, unifiedActionEngineFull]);

  const autoActions = useMemo(
    () => allAdminActions.filter((action) => action.mode === "auto").slice(0, 8),
    [allAdminActions]
  );

  const manualActions = useMemo(
    () => allAdminActions.filter((action) => action.mode === "manual").slice(0, 8),
    [allAdminActions]
  );

  const blockedActions = useMemo(
    () => allAdminActions.filter((action) => action.mode === "blocked").slice(0, 8),
    [allAdminActions]
  );

  const selectedAction = useMemo(() => {
    if (!selectedActionId) return allAdminActions[0] ?? null;
    return (
      allAdminActions.find((action) => action.id === selectedActionId) ??
      allAdminActions[0] ??
      null
    );
  }, [allAdminActions, selectedActionId]);

  const executionSummary = useMemo(() => {
    return buildExecutionSummary(auditRecords);
  }, [auditRecords]);

  const policyAuditRecords = useMemo(() => {
    return auditRecords
      .filter((record) => {
        const metadata = record.metadata ?? {};
        const policyReason =
          typeof metadata.policyReason === "string"
            ? metadata.policyReason
            : typeof metadata.policy_reason === "string"
              ? metadata.policy_reason
              : typeof metadata.blockedReason === "string"
                ? metadata.blockedReason
                : typeof metadata.reason === "string"
                  ? metadata.reason
                  : null;

        const actionType = String(record.action_type || "").toLowerCase();
        const message = String(record.message || "").toLowerCase();

        return Boolean(
          policyReason ||
            actionType.includes("policy") ||
            actionType.includes("blocked") ||
            message.includes("blocked") ||
            message.includes("manual-only") ||
            message.includes("outside allowed")
        );
      })
      .slice(0, 12);
  }, [auditRecords]);

  const policyAuditBlocks = useMemo(() => {
    return policyAuditRecords.map((record) => {
      const metadata = record.metadata ?? {};
      const reason =
        typeof metadata.policyReason === "string"
          ? metadata.policyReason
          : typeof metadata.policy_reason === "string"
            ? metadata.policy_reason
            : typeof metadata.blockedReason === "string"
              ? metadata.blockedReason
              : typeof metadata.reason === "string"
                ? metadata.reason
                : "unknown";

      return { reason };
    });
  }, [policyAuditRecords]);

  const policyFeedback = useMemo(() => {
    return analyzePolicyBlocks(policyAuditBlocks);
  }, [policyAuditBlocks]);

  const policySuggestions = useMemo(() => {
    return generatePolicySuggestions(policyFeedback);
  }, [policyFeedback]);

  const policyRecommendations = useMemo(() => {
  return generatePolicyRecommendations(policyFeedback, {
    executionSummary,
  });
}, [policyFeedback, executionSummary]);

  const strategyDecision = useMemo(() => {
    const staleContacts = (filteredData.contacts ?? []).filter(
      (contact: any) => Boolean(contact.is_stale)
    ).length;

    const financePressure = Math.min(
      10,
      Math.round(
        (financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 8 : 4) +
          (financeSnapshot.pledges > financeSnapshot.moneyIn ? 1 : 0)
      )
    );

    const outreachPressure = Math.min(
      10,
      Math.round(
        (staleContacts >= 10 ? 8 : staleContacts >= 5 ? 6 : 3) +
          ((todaySnapshot.urgentTasks ?? []).length >= 5 ? 1 : 0)
      )
    );

    return decideStrategy({
      overdueTasks,
      staleContacts,
      financePressure,
      outreachPressure,
    });
  }, [filteredData.contacts, financeSnapshot, todaySnapshot, overdueTasks]);

  const strategyHook = useMemo(() => {
    return suggestStrategyFromIntelligence(intelligenceSnapshot);
  }, [intelligenceSnapshot]);

  const autoShiftHook = useMemo(() => {
    return shouldAutoShiftStrategy(autonomyConfig.strategy, strategyHook);
  }, [autonomyConfig.strategy, strategyHook]);

  const executionFeedback = useMemo(() => {
    return evaluateExecutionSummaryFeedback({
      summary: executionSummary,
      strategy: autonomyConfig.strategy,
    });
  }, [executionSummary, autonomyConfig.strategy]);

  async function handlePreviewAutoExecution() {
    try {
      setPreviewingAutoExecution(true);
      setMessage("");

      const response = await fetch("/api/auto-execution/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun: true,
          limit: 10,
        }),
      });

      const data = (await response.json()) as AutoExecutionApiResponse;

      if (!response.ok || !data.ok || !data.result) {
        setMessage(data.error || "Failed to preview auto execution");
        return;
      }

      setMessage(
        `Safe auto preview complete → ${data.result.summary.eligible} eligible, ${data.result.summary.executed} executed, ${data.result.summary.skipped} skipped`
      );
      await loadAuditLog();
    } catch (err: any) {
      setMessage(err?.message || "Failed to preview auto execution");
    } finally {
      setPreviewingAutoExecution(false);
    }
  }

  async function handleRunAutoExecution() {
    try {
      setRunningAutoExecution(true);
      setMessage("");

      const response = await fetch("/api/auto-execution/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun: false,
          limit: 10,
        }),
      });

      const data = (await response.json()) as AutoExecutionApiResponse;

      if (!response.ok || !data.ok || !data.result) {
        setMessage(data.error || "Failed to run auto execution");
        return;
      }

      setMessage(
        `Safe auto execution complete → ${data.result.summary.executed} executed, ${data.result.summary.skipped} skipped, ${data.result.summary.failed} failed`
      );

      await Promise.all([loadData(), loadAuditLog()]);
    } catch (err: any) {
      setMessage(err?.message || "Failed to run auto execution");
    } finally {
      setRunningAutoExecution(false);
    }
  }

  function handleApplyRecommendation(recommendationId: string) {
    const recommendation = policyRecommendations.find(
      (item) => item.id === recommendationId
    );

    if (!recommendation) {
      setPolicyActionMessage("Recommendation not found.");
      return;
    }

    const historyRecord = createPolicyVersionRecord({
      policy: {
        allowedHoursStart: 8,
        allowedHoursEnd: 20,
        allowWeekends: false,
        allowedDepartments: [],
        blockedActionTypes: [],
        blockedTaskTypes: [],
        manualOnlyDepartments: [],
      },
      source: "recommendation",
      note: recommendation.message,
      recommendation,
    });

    setPolicyVersionHistory((current) =>
      appendPolicyVersion(current, historyRecord)
    );

    setPolicyActionMessage(
      `Captured recommendation "${recommendation.message}" into policy history.`
    );
  }

  function handleRollbackPolicy(versionId: string) {
    const restored = rollbackPolicyVersion(policyVersionHistory, versionId);

    if (!restored) {
      setPolicyActionMessage("Could not restore that policy version.");
      return;
    }

    const rollbackRecord = createPolicyVersionRecord({
      policy: restored,
      source: "rollback",
      note: `Rolled back to ${versionId}`,
    });

    setPolicyVersionHistory((current) =>
      appendPolicyVersion(current, rollbackRecord)
    );

    setPolicyActionMessage(`Rolled policy history back to ${versionId}.`);
  }

  function handleSetAutonomyMode(mode: AutonomyConfig["mode"]) {
    setAutonomyConfig((current) => ({
      ...current,
      mode,
    }));
  }

  function handleSetStrategy(strategy: AutonomyConfig["strategy"]) {
    setAutonomyConfig((current) => ({
      ...current,
      strategy,
    }));
  }

  function handleAutoShiftToSuggestedStrategy() {
    if (!autonomyConfig.allowStrategyAutoShift) {
      setPolicyActionMessage(
        "Strategy auto-shift is disabled in autonomy config."
      );
      return;
    }

    setAutonomyConfig((current) => ({
      ...current,
      strategy: strategyDecision.strategy,
    }));

    setPolicyActionMessage(
      `Strategy shifted to ${strategyDecision.strategy.replaceAll("_", " ")}.`
    );
  }
function runSystemCommand(command: SystemCommand) {
  switch (command) {
    case "fundraising_push":
      setAdminCommandMessage(
        "System shifted toward fundraising mode. Finance domain boosted."
      );
      break;

    case "outreach_push":
      setAdminCommandMessage(
        "Outreach pressure increased. Call and messaging priority elevated."
      );
      break;

    case "stability":
      setAdminCommandMessage(
        "System stabilization engaged. Reducing volatility and pausing aggressive shifts."
      );
      break;

    case "clear_blocked_queue":
      setAdminCommandMessage(
        "Blocked queue cleared and reprioritized for execution."
      );
      break;

    case "reinforce_top_domain":
      setAdminCommandMessage(
        "Top-performing domain reinforced with additional system priority."
      );
      break;
  }
}

function adjustDomainWeight(key: DomainKey, delta: number) {
  setDomainPriorities((current) =>
    current.map((d) =>
      d.key === key
        ? { ...d, weight: Math.max(1, d.weight + delta) }
        : d
    )
  );
}
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading admin control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ADMIN COMMAND BAR */}
<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => setAdminFocusMode((prev) => !prev)}
      className={
        adminFocusMode
          ? "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
      }
    >
      {adminFocusMode ? "Focus Mode On" : "Enable Focus Mode"}
    </button>

    <button
      onClick={() => runSystemCommand("fundraising_push")}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
    >
      Fundraising Push
    </button>

    <button
      onClick={() => runSystemCommand("outreach_push")}
      className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800"
    >
      Outreach Push
    </button>

    <button
      onClick={() => runSystemCommand("stability")}
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
    >
      Stabilize
    </button>
  </div>
</section>

{/* ADMIN MESSAGE */}
{adminCommandMessage ? (
  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
    {adminCommandMessage}
  </div>
) : null}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldAlert className="h-4 w-4" />
              Admin control layer
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Admin Control Center
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Governance, autonomy, execution health, policy decisions, and
                system-level review for Aether.
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
              onClick={loadAuditLog}
              disabled={auditLoading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auditLoading ? "Refreshing Log..." : "Refresh Execution Log"}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {policyActionMessage ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          {policyActionMessage}
        </div>
      ) : null}

      <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">
              Autonomy Control
            </p>
            <h2 className="text-2xl font-semibold text-indigo-900">
              System Behavior & Strategy
            </h2>
            <p className="mt-2 text-sm text-indigo-800">
              Control how Aether operates — suggestion mode, safe automation,
              and strategy behavior.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm text-indigo-900">
            Mode: {autonomyConfig.mode.toUpperCase()}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {["off", "suggest", "auto_safe"].map((mode) => (
            <button
              key={mode}
              onClick={() => handleSetAutonomyMode(mode as AutonomyConfig["mode"])}
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                autonomyConfig.mode === mode
                  ? "bg-indigo-900 text-white"
                  : "border border-indigo-200 bg-white text-indigo-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-indigo-800">
            Strategy Mode
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              "balanced",
              "cleanup",
              "fundraising_push",
              "outreach_push",
              "stability",
            ].map((strategy) => (
              <button
                key={strategy}
                onClick={() =>
                  handleSetStrategy(strategy as AutonomyConfig["strategy"])
                }
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  autonomyConfig.strategy === strategy
                    ? "bg-indigo-900 text-white"
                    : "border border-indigo-200 bg-white text-indigo-800"
                }`}
              >
                {strategy.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleAutoShiftToSuggestedStrategy}
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-900"
            >
              Apply Suggested Strategy
            </button>
          </div>

          <div className="mt-4 text-sm text-indigo-900">
            Suggested Strategy:{" "}
            <span className="font-semibold">
              {strategyDecision.strategy.replaceAll("_", " ")}
            </span>
          </div>
          <div className="text-xs text-indigo-700">
            {strategyDecision.reason}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-emerald-900">
              Execution Health
            </h2>
            <p className="text-sm text-emerald-800">
              Based on normalized execution summary
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-3xl font-bold text-emerald-900">
              {executionFeedback.executionHealthScore}
            </div>
            <div className="text-sm text-emerald-800">
              {executionFeedback.recommendation}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Success Rate
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {executionSummary.successRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Failure Rate
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {executionSummary.failureRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Blocked Rate
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {executionSummary.blockedRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Live Runs
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {executionSummary.liveRuns}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              System Snapshot
            </h2>
            <p className="text-sm text-slate-600">
              Admin-level summary of current operating pressure
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total Contacts
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {metrics.totalContacts}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Unassigned Contacts
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {metrics.unassignedContactCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Urgent Tasks
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {(todaySnapshot.urgentTasks ?? []).length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Finance Net
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                ${financeSnapshot.net.toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </section>

  
<section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-sm font-medium text-rose-800">System Risk</p>
      <h2 className="text-2xl font-semibold text-rose-900">
        Unified Risk Panel
      </h2>
      <p className="mt-2 text-sm text-rose-800">
        Combined view of failures, blocked actions, and unstable domains.
      </p>
    </div>

    <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-900">
      Failure rate:{" "}
      <span className="font-semibold">
        {executionSummary.failureRate}%
      </span>
    </div>
</div>
  <div className="grid gap-4 lg:grid-cols-3">
    <div className="rounded-2xl border border-rose-200 bg-white p-5">
      <p className="text-sm font-medium text-rose-900">Failure Hotspots</p>
      <div className="mt-4 space-y-3">
        {executionSummary.repeatedFailureActionTypes.slice(0, 5).map((item) => (
          <div key={item.key} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-medium text-slate-900">{item.key}</p>
            <p className="mt-1 text-xs text-slate-600">
              {item.count} repeated failure{item.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}

        {executionSummary.repeatedFailureActionTypes.length === 0 ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-slate-500">
            No repeated failure hotspots surfaced yet.
          </div>
        ) : null}
</div>
</div>
    <div className="rounded-2xl border border-amber-200 bg-white p-5">
      <p className="text-sm font-medium text-amber-900">Blocked Hotspots</p>
      <div className="mt-4 space-y-3">
        {executionSummary.repeatedBlockedReasons.slice(0, 5).map((item) => (
          <div key={item.key} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-slate-900">
              {formatPolicyReason(item.key)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {item.count} repeated block{item.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}

        {executionSummary.repeatedBlockedReasons.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-500">
            No repeated blocked hotspots surfaced yet.
          </div>
        ) : null}
      </div>
    </div>

    <div className="rounded-2xl border border-sky-200 bg-white p-5">
      <p className="text-sm font-medium text-sky-900">Unstable Domains</p>
      <div className="mt-4 space-y-3">
        {executionSummary.unstableDomains.slice(0, 5).map((item) => (
          <div key={item.key} className="rounded-2xl border border-sky-200 bg-sky-50 p-4">––
            <p className="font-medium text-slate-900">
              {item.key.toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {item.count} instability signal{item.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}

        {executionSummary.unstableDomains.length === 0 ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-500">
            No unstable domains surfaced yet.
          </div>
        ) : null}
      </div>
      </div>
    </div>
</section>
            <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-fuchsia-800">
              Aether Intelligence Layer
            </p>
            <h2 className="text-2xl font-semibold text-fuchsia-900">
              System Brain Snapshot
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-fuchsia-900/80">
              The system is now aggregating domain pressure, top signals, and
              cross-domain dependencies into one intelligence layer.
            </p>
          </div>

          <div className="rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-sm text-fuchsia-900">
            System risk:{" "}
            <span className="font-semibold">
              {intelligenceSnapshot.systemRiskLevel}/10
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-fuchsia-200 bg-white p-5">
          <p className="text-lg font-semibold text-slate-900">
            {intelligenceSummary.headline}
          </p>
          <p className="mt-2 text-sm text-slate-600">{intelligenceSummary.body}</p>
          <p className="mt-2 text-sm text-slate-600">
            {intelligenceSummary.crossDomain}
          </p>
          <p className="mt-2 text-sm font-medium text-fuchsia-900">
            {intelligenceSummary.risk}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Top Domains</p>
            <div className="mt-4 space-y-3">
              {intelligenceSnapshot.topDomains.slice(0, 5).map((item) => (
                <div
                  key={item.domain}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <span className="font-medium text-slate-900">
                    {item.domain.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-600">
                    Pressure {item.pressureScore}/10
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Unified Admin Actions
            </p>
            <div className="mt-4 space-y-3">
              {allAdminActions.slice(0, 4).map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium text-slate-900">{action.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {action.domain.toUpperCase()} · Score {action.score}/100
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{action.whyNow}</p>
                </div>
              ))}

              {allAdminActions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No unified admin actions surfaced yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Cross-Domain Links
            </p>
            <div className="mt-4 space-y-3">
              {(intelligenceSnapshot.crossDomainLinks || []).slice(0, 4).map((link) => (
                <div
                  key={link.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium text-slate-900">{link.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {link.from.toUpperCase()} → {link.to.toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{link.action}</p>
                </div>
              ))}

              {(intelligenceSnapshot.crossDomainLinks || []).length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No strong cross-domain link surfaced yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>

   <div className="mt-6 grid gap-6 xl:grid-cols-3">

        

          <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Strategy Hook</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">
                Suggested: {strategyHook.strategy.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-slate-600">{strategyHook.reason}</p>
              <p className="mt-2 text-xs text-slate-500">
                Confidence {(strategyHook.confidence * 100).toFixed(0)}%
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">
                Auto-shift {autoShiftHook.shouldShift ? "recommended" : "not recommended"}
              </p>
              <p className="mt-1 text-xs text-slate-600">{autoShiftHook.reason}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-blue-900">
            Policy Recommendations
          </h2>
          <p className="text-sm text-blue-700">
            Suggested improvements based on repeated system friction
          </p>
        </div>

        {policyRecommendations.length === 0 ? (
          <p className="text-sm text-slate-600">
            No strong recommendations yet.
          </p>
        ) : (
          <div className="space-y-3">
            {policyRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-blue-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-900">
                    {rec.message}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-blue-700">
                      {(rec.confidence * 100).toFixed(0)}%
                    </div>

                    <button
                      onClick={() => handleApplyRecommendation(rec.id)}
                      className="rounded-lg bg-blue-900 px-3 py-1 text-xs text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Policy History
          </h2>
          <p className="text-sm text-slate-600">
            Track changes and rollback safely
          </p>
        </div>

        {policyVersionHistory.length === 0 ? (
          <p className="text-sm text-slate-500">
            No policy changes recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {policyVersionHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {item.note}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRollbackPolicy(item.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700"
                  >
                    Rollback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Governed Action Queue
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Unified Auto Execution Queue
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Review what is safe to run, what needs manual review, and what
              remains blocked under governance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePreviewAutoExecution}
              disabled={previewingAutoExecution || runningAutoExecution}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              {previewingAutoExecution ? "Previewing Auto..." : "Preview Auto"}
            </button>

            <button
              onClick={handleRunAutoExecution}
              disabled={runningAutoExecution || previewingAutoExecution}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {runningAutoExecution ? "Running Auto..." : "Run Auto Execution"}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {autoExecutionPlan.summary.autoExecutable} auto executable
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {autoExecutionPlan.summary.manualReview} manual review
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {autoExecutionPlan.summary.blocked} blocked
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-800">Auto Executable</p>
            <div className="mt-4 space-y-3">
              {autoActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-emerald-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{action.whyNow}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getActionModeClasses(action.mode)}`}>
                      {action.mode}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreviewUnifiedAction(action)}
                      disabled={executingActionId === action.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleRunUnifiedAction(action)}
                      disabled={executingActionId === action.id}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => setSelectedActionId(action.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}

              {autoActions.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-500">
                  No auto-executable unified actions surfaced yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-800">Manual Review</p>
            <div className="mt-4 space-y-3">
              {manualActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-amber-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {action.governance.reason}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getActionModeClasses(action.mode)}`}>
                      {action.mode}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreviewUnifiedAction(action)}
                      disabled={executingActionId === action.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setSelectedActionId(action.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}

              {manualActions.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-500">
                  No manual-review unified actions surfaced yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-800">Blocked</p>
            <div className="mt-4 space-y-3">
              {blockedActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-rose-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {action.governance.reason}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getActionModeClasses(action.mode)}`}>
                      {action.mode}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedActionId(action.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}

              {blockedActions.length === 0 ? (
                <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-slate-500">
                  No blocked unified actions surfaced yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Governance Pattern Detection
            </p>
            <h2 className="text-2xl font-semibold text-amber-900">
              Recent Governance Blocks
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-amber-800">
              Surface recent executions or attempted executions that were blocked
              by policy, timing rules, or manual-only governance.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
            {policyAuditRecords.length} recent block
            {policyAuditRecords.length === 1 ? "" : "s"}
          </div>
        </div>

        {auditError ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
            {auditError}
          </div>
        ) : policyAuditRecords.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-900">
            No recent governance blocks detected.
          </div>
        ) : (
          <div className="space-y-3">
            {policyAuditRecords.map((record, index) => {
              const metadata = record.metadata ?? {};
              const policyReason =
                typeof metadata.policyReason === "string"
                  ? metadata.policyReason
                  : typeof metadata.policy_reason === "string"
                    ? metadata.policy_reason
                    : typeof metadata.blockedReason === "string"
                      ? metadata.blockedReason
                      : typeof metadata.reason === "string"
                        ? metadata.reason
                        : null;

              return (
                <div
                  key={record.id || `${record.action_id || "record"}-${index}`}
                  className="rounded-2xl border border-amber-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {record.action_type || "Blocked action"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {record.message || "Blocked by governance"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {formatPolicyReason(policyReason)}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatAuditTimestamp(record.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {policySuggestions.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-white/60 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-900">
              <Sparkles className="h-4 w-4" />
              Suggested Policy Tightening
            </div>

            <div className="space-y-2">
              {policySuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  className="text-sm text-slate-700"
                >
                  • {suggestion}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Selected Action</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Unified control surface
            </h2>
          </div>

          {selectedAction ? (
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${getActionModeClasses(selectedAction.mode)}`}>
              {selectedAction.mode.toUpperCase()}
            </div>
          ) : null}
        </div>

        {selectedAction ? (
          <div className="space-y-4">
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
                <p className="text-sm text-slate-500">Engine score</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {selectedAction.score}/100
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Governance confidence</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {selectedAction.governance.confidence}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Governance reason</p>
              <p className="mt-2 text-sm text-slate-700">
                {selectedAction.governance.reason}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handlePreviewUnifiedAction(selectedAction)}
                disabled={executingActionId === selectedAction.id}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              {selectedAction.mode === "auto" ? (
                <button
                  onClick={() => handleRunUnifiedAction(selectedAction)}
                  disabled={executingActionId === selectedAction.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  Run
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Select an action from the unified admin queue to inspect it here.
          </div>
        )}
      </section>
    </div>
  );
}