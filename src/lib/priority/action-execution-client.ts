import { ActionItem } from "@/lib/priority/action-engine";
import {
  AutoExecutionRiskLevel,
  evaluateAutoExecutionAction,
  inferAutoExecutionConfidence,
  inferAutoExecutionRiskLevel,
} from "@/lib/priority/auto-execution";

export type ExecuteActionRequest = {
  actionId?: string;
  type: ActionItem["type"];
  targets?: Array<{
    entityType: string;
    entityId: string;
  }>;
  sourceIds?: string[];
  recommendedAction?: string;
  payload?: {
    ownerId?: string | null;
    assignedTo?: string | null;
    taskId?: string | null;
    contactId?: string | null;
    opportunityId?: string | null;
    targetOwnerId?: string | null;
    fromOwnerId?: string | null;
    taskIds?: string[];
    contactIds?: string[];
    notes?: string | null;
    fields?: Record<string, unknown> | null;
    status?: string | null;
    approvalMode?: "approved" | "override" | null;
    approvalReason?: string | null;
  };
  dryRun?: boolean;
  triggeredBy?: string | null;
};

export type ExecuteActionResult = {
  ok: boolean;
  type: ActionItem["type"];
  actionId?: string;
  dryRun: boolean;
  message: string;
  mutations: Array<{
    table: string;
    action: "update";
    filters: Record<string, string>;
    values: Record<string, unknown>;
  }>;
  results: Array<{
    table: string;
    entityId?: string;
    success: boolean;
    error?: string;
  }>;
  error?: string;
  details?: unknown;
};

export type GovernedExecutionDecision = {
  allowed: boolean;
  confidence: number;
  riskLevel: AutoExecutionRiskLevel;
  reason: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeResult(data: unknown): ExecuteActionResult {
  if (!isObject(data)) {
    return {
      ok: false,
      type: "monitor",
      dryRun: false,
      message: "Invalid response from action execution API",
      mutations: [],
      results: [],
      error: "Invalid response from action execution API",
    };
  }

  return {
    ok: Boolean(data.ok),
    type: (data.type as ActionItem["type"]) ?? "monitor",
    actionId: typeof data.actionId === "string" ? data.actionId : undefined,
    dryRun: Boolean(data.dryRun),
    message:
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unknown action execution result",
    mutations: Array.isArray(data.mutations)
      ? (data.mutations as ExecuteActionResult["mutations"])
      : [],
    results: Array.isArray(data.results)
      ? (data.results as ExecuteActionResult["results"])
      : [],
    error: typeof data.error === "string" ? data.error : undefined,
    details: data.details,
  };
}

export function getGovernedExecutionDecision(
  action: ActionItem
): GovernedExecutionDecision {
  const confidence = inferAutoExecutionConfidence(action);
  const riskLevel = inferAutoExecutionRiskLevel(action);
  const decision = evaluateAutoExecutionAction(action);

  return {
    allowed: decision.disposition === "auto_execute",
    confidence,
    riskLevel,
    reason: decision.reason,
  };
}

export async function executeActionRequest(
  request: ExecuteActionRequest
): Promise<ExecuteActionResult> {
  try {
    const response = await fetch("/api/actions/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json().catch(() => null);
    const result = normalizeResult(data);

    if (!response.ok && !result.ok) {
      return {
        ...result,
        ok: false,
      };
    }

    return result;
  } catch (error: any) {
    return {
      ok: false,
      type: request.type,
      actionId: request.actionId,
      dryRun: Boolean(request.dryRun),
      message: error?.message || "Failed to reach action execution API",
      mutations: [],
      results: [],
      error: error?.message || "Failed to reach action execution API",
    };
  }
}

export async function dryRunActionRequest(
  request: Omit<ExecuteActionRequest, "dryRun">
): Promise<ExecuteActionResult> {
  return executeActionRequest({
    ...request,
    dryRun: true,
  });
}

function inferPayloadFromAction(
  action: ActionItem
): ExecuteActionRequest["payload"] {
  const firstTaskTarget = (action.targets ?? []).find(
    (target) => target.entityType === "task"
  );
  const firstContactTarget = (action.targets ?? []).find(
    (target) => target.entityType === "contact"
  );
  const firstOpportunityTarget = (action.targets ?? []).find(
    (target) => target.entityType === "opportunity"
  );
  const firstOwnerQueueTarget = (action.targets ?? []).find(
    (target) => target.entityType === "owner_queue"
  );

  switch (action.type) {
    case "complete_task":
    case "unblock_work":
      return {
        taskId: firstTaskTarget?.entityId ?? null,
      };

    case "follow_up_contact":
      return {
        contactId: firstContactTarget?.entityId ?? null,
      };

    case "work_opportunity":
      return {
        opportunityId: firstOpportunityTarget?.entityId ?? null,
        status: "in_progress",
      };

    case "reduce_owner_pressure":
    case "rebalance_queue":
      return {
        fromOwnerId: firstOwnerQueueTarget?.entityId ?? null,
        taskIds: (action.targets ?? [])
          .filter((target) => target.entityType === "task")
          .map((target) => target.entityId),
      };

    default:
      return {};
  }
}

export function buildExecuteRequestFromAction(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): ExecuteActionRequest {
  return {
    actionId: action.id,
    type: action.type,
    targets: action.targets ?? [],
    sourceIds: action.sourceIds,
    recommendedAction: action.recommendedAction,
    payload: {
      ...inferPayloadFromAction(action),
      ...(payload ?? {}),
    },
  };
}

export async function executeActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  return executeActionRequest(buildExecuteRequestFromAction(action, payload));
}

function buildBlockedGovernanceResult(
  action: ActionItem,
  dryRun: boolean
): ExecuteActionResult {
  const decision = getGovernedExecutionDecision(action);

  return {
    ok: false,
    type: action.type,
    actionId: action.id,
    dryRun,
    message: decision.reason,
    mutations: [],
    results: [],
    error: decision.reason,
    details: {
      confidence: decision.confidence,
      riskLevel: decision.riskLevel,
    },
  };
}

export async function executeGovernedActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  const decision = getGovernedExecutionDecision(action);

  if (!decision.allowed) {
    return buildBlockedGovernanceResult(action, false);
  }

  return executeActionRequest(buildExecuteRequestFromAction(action, payload));
}

export async function approveGovernedActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  return executeActionRequest(
    buildExecuteRequestFromAction(action, {
      ...(payload ?? {}),
      approvalMode: "approved",
      approvalReason:
        payload?.approvalReason ??
        "Approved manually from dashboard command center",
    })
  );
}

export async function overrideExecuteActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  return executeActionRequest(
    buildExecuteRequestFromAction(action, {
      ...(payload ?? {}),
      approvalMode: "override",
      approvalReason:
        payload?.approvalReason ??
        "Override execution requested from dashboard command center",
    })
  );
}

export async function dryRunActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  return dryRunActionRequest(buildExecuteRequestFromAction(action, payload));
}

export async function dryRunGovernedActionItem(
  action: ActionItem,
  payload?: ExecuteActionRequest["payload"]
): Promise<ExecuteActionResult> {
  const decision = getGovernedExecutionDecision(action);

  if (!decision.allowed) {
    return buildBlockedGovernanceResult(action, true);
  }

  return dryRunActionRequest(buildExecuteRequestFromAction(action, payload));
}