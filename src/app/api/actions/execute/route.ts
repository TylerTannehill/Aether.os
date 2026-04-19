import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ActionAuditRecord,
  createActionAuditPayload,
  getActionAuditTableCandidates,
} from "@/lib/priority/action-audit";
import type { ActionItem } from "@/lib/priority/action-engine";
import {
  AutoExecutionRiskLevel,
  evaluateAutoExecutionAction,
  inferAutoExecutionConfidence,
  inferAutoExecutionRiskLevel,
} from "@/lib/priority/auto-execution";

export const runtime = "nodejs";

type ActionType = ActionItem["type"];

type ActionTarget = {
  entityType: string;
  entityId: string;
};

type ExecuteActionRequest = {
  actionId?: string;
  type: ActionType;
  targets?: ActionTarget[];
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

type ExecutionMutation = {
  table: string;
  action: "update";
  filters: Record<string, string>;
  values: Record<string, unknown>;
};

type ExecutionResult = {
  ok: boolean;
  type: ActionType;
  actionId?: string;
  dryRun: boolean;
  message: string;
  mutations: ExecutionMutation[];
  results: Array<{
    table: string;
    entityId?: string;
    success: boolean;
    error?: string;
  }>;
  audit: {
    attempted: boolean;
    written: boolean;
    table: string | null;
    error: string | null;
    record: ActionAuditRecord | null;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    if (isNonEmptyString(value)) return value.trim();
  }
  return null;
}

function getServerSupabaseConfig() {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL
  );

  const secretKey = firstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_KEY
  );

  if (!url || !secretKey) {
    throw new Error(
      [
        "Missing Supabase server environment variables.",
        "Expected:",
        "- NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)",
        "- SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_KEY)",
      ].join(" ")
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error("Invalid Supabase URL in NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL");
  }

  return { url, secretKey };
}

function getSupabaseAdmin() {
  const { url, secretKey } = getServerSupabaseConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status: 400 }
  );
}

function serverError(message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status: 500 }
  );
}

function normalizeTargets(targets?: ActionTarget[]): ActionTarget[] {
  if (!Array.isArray(targets)) return [];
  return targets.filter(
    (target) =>
      target &&
      isNonEmptyString(target.entityType) &&
      isNonEmptyString(target.entityId)
  );
}

function getFirstTarget(
  targets: ActionTarget[],
  entityType: string
): ActionTarget | null {
  return targets.find((target) => target.entityType === entityType) ?? null;
}

function buildTimestamp() {
  return new Date().toISOString();
}

function buildTaskCompleteMutation(taskId: string): ExecutionMutation {
  return {
    table: "tasks",
    action: "update",
    filters: { id: taskId },
    values: {
      status: "done",
      completed_at: buildTimestamp(),
      blocked: false,
      updated_at: buildTimestamp(),
    },
  };
}

function buildTaskOwnerMutation(taskId: string, ownerId: string): ExecutionMutation {
  return {
    table: "tasks",
    action: "update",
    filters: { id: taskId },
    values: {
      owner_id: ownerId,
      assigned_to: ownerId,
      updated_at: buildTimestamp(),
    },
  };
}

function buildTaskUnblockMutation(taskId: string): ExecutionMutation {
  return {
    table: "tasks",
    action: "update",
    filters: { id: taskId },
    values: {
      blocked: false,
      updated_at: buildTimestamp(),
    },
  };
}

function buildContactFollowUpMutation(contactId: string): ExecutionMutation {
  return {
    table: "contacts",
    action: "update",
    filters: { id: contactId },
    values: {
      needs_follow_up: false,
      last_contacted_at: buildTimestamp(),
      updated_at: buildTimestamp(),
    },
  };
}

function buildContactDataMutation(
  contactId: string,
  fields: Record<string, unknown>
): ExecutionMutation {
  return {
    table: "contacts",
    action: "update",
    filters: { id: contactId },
    values: {
      ...fields,
      updated_at: buildTimestamp(),
    },
  };
}

function buildOpportunityMutation(
  opportunityId: string,
  status?: string | null
): ExecutionMutation {
  return {
    table: "opportunities",
    action: "update",
    filters: { id: opportunityId },
    values: {
      status: status || "in_progress",
      updated_at: buildTimestamp(),
      last_activity_at: buildTimestamp(),
    },
  };
}

function toGovernanceAction(body: ExecuteActionRequest): ActionItem {
  const targets = normalizeTargets(body.targets);

  return {
    id: body.actionId ?? `action:${body.type}:${targets[0]?.entityId ?? "unknown"}`,
    type: body.type,
    bucket: "do_next",
    level:
      body.type === "reduce_owner_pressure" || body.type === "rebalance_queue"
        ? "high"
        : "medium",
    score: 50,
    title: body.recommendedAction ?? body.type,
    summary: body.recommendedAction ?? body.type,
    reason: body.recommendedAction ?? body.type,
    recommendedAction: body.recommendedAction ?? body.type,
    targets,
    sourceIds: body.sourceIds ?? [],
    badges: [],
    createdAt: new Date().toISOString(),
  };
}

function getGovernanceDecision(body: ExecuteActionRequest): {
  allowed: boolean;
  confidence: number;
  riskLevel: AutoExecutionRiskLevel;
  reason: string;
} {
  const action = toGovernanceAction(body);
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

function buildMutationsFromRequest(
  body: ExecuteActionRequest
): { mutations: ExecutionMutation[]; message: string } {
  const payload = body.payload ?? {};
  const targets = normalizeTargets(body.targets);
  const taskTarget = getFirstTarget(targets, "task");
  const contactTarget = getFirstTarget(targets, "contact");
  const opportunityTarget = getFirstTarget(targets, "opportunity");
  const ownerQueueTarget = getFirstTarget(targets, "owner_queue");

  switch (body.type) {
    case "complete_task": {
      const taskId = payload.taskId ?? taskTarget?.entityId;
      if (!isNonEmptyString(taskId)) {
        throw new Error("complete_task requires a task target or payload.taskId");
      }

      return {
        mutations: [buildTaskCompleteMutation(taskId)],
        message: "Task marked complete",
      };
    }

    case "assign_owner":
    case "reassign_task": {
      const taskId = payload.taskId ?? taskTarget?.entityId;
      const ownerId = payload.ownerId ?? payload.assignedTo ?? payload.targetOwnerId;

      if (!isNonEmptyString(taskId)) {
        throw new Error(`${body.type} requires a task target or payload.taskId`);
      }

      if (!isNonEmptyString(ownerId)) {
        throw new Error(`${body.type} requires payload.ownerId or payload.targetOwnerId`);
      }

      return {
        mutations: [buildTaskOwnerMutation(taskId, ownerId)],
        message: "Task owner updated",
      };
    }

    case "follow_up_contact": {
      const contactId = payload.contactId ?? contactTarget?.entityId;
      if (!isNonEmptyString(contactId)) {
        throw new Error("follow_up_contact requires a contact target or payload.contactId");
      }

      return {
        mutations: [buildContactFollowUpMutation(contactId)],
        message: "Contact follow-up recorded",
      };
    }

    case "fix_contact_data": {
      const contactId = payload.contactId ?? contactTarget?.entityId;
      const fields = payload.fields ?? null;

      if (!isNonEmptyString(contactId)) {
        throw new Error("fix_contact_data requires a contact target or payload.contactId");
      }

      if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
        throw new Error("fix_contact_data requires payload.fields");
      }

      return {
        mutations: [buildContactDataMutation(contactId, fields)],
        message: "Contact data updated",
      };
    }

    case "unblock_work": {
      const taskId = payload.taskId ?? taskTarget?.entityId;
      if (!isNonEmptyString(taskId)) {
        throw new Error("unblock_work requires a task target or payload.taskId");
      }

      return {
        mutations: [buildTaskUnblockMutation(taskId)],
        message: "Task unblocked",
      };
    }

    case "work_opportunity": {
      const opportunityId = payload.opportunityId ?? opportunityTarget?.entityId;
      if (!isNonEmptyString(opportunityId)) {
        throw new Error(
          "work_opportunity requires an opportunity target or payload.opportunityId"
        );
      }

      return {
        mutations: [buildOpportunityMutation(opportunityId, payload.status)],
        message: "Opportunity updated",
      };
    }

    case "reduce_owner_pressure":
    case "rebalance_queue": {
      const taskIds =
        payload.taskIds?.filter(isNonEmptyString) ??
        targets
          .filter((target) => target.entityType === "task")
          .map((target) => target.entityId)
          .filter(isNonEmptyString);

      const targetOwnerId =
        payload.targetOwnerId ?? payload.ownerId ?? payload.assignedTo;
      const fromOwnerId = payload.fromOwnerId ?? ownerQueueTarget?.entityId ?? null;

      if (!taskIds.length) {
        throw new Error(`${body.type} requires payload.taskIds or task targets`);
      }

      if (!isNonEmptyString(targetOwnerId)) {
        throw new Error(`${body.type} requires payload.targetOwnerId or payload.ownerId`);
      }

      return {
        mutations: taskIds.map((taskId) => ({
          table: "tasks",
          action: "update" as const,
          filters: {
            id: taskId,
            ...(isNonEmptyString(fromOwnerId) ? { owner_id: fromOwnerId } : {}),
          },
          values: {
            owner_id: targetOwnerId,
            assigned_to: targetOwnerId,
            updated_at: buildTimestamp(),
          },
        })),
        message: "Queue rebalanced",
      };
    }

    case "review_routing":
    case "review_alert":
    case "monitor": {
      return {
        mutations: [],
        message: "No direct mutation executed for review-only action",
      };
    }

    default:
      throw new Error(`Unsupported action type: ${body.type}`);
  }
}

async function executeMutation(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  mutation: ExecutionMutation
) {
  let query = supabase.from(mutation.table).update(mutation.values);

  for (const [column, value] of Object.entries(mutation.filters)) {
    query = query.eq(column, value);
  }

  const { error } = await query;

  return {
    success: !error,
    error: error?.message,
  };
}

async function writeAuditRecord(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  record: ActionAuditRecord
) {
  const tableCandidates = getActionAuditTableCandidates();
  let lastError: string | null = null;

  for (const table of tableCandidates) {
    const { error } = await supabase.from(table).insert(record);

    if (!error) {
      return {
        attempted: true,
        written: true,
        table,
        error: null,
        record,
      };
    }

    lastError = error.message;
  }

  return {
    attempted: true,
    written: false,
    table: null,
    error: lastError,
    record,
  };
}

async function runExecution(body: ExecuteActionRequest): Promise<ExecutionResult> {
  const targets = normalizeTargets(body.targets);
  const requestPayload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as Record<string, unknown>)
      : null;

  const governance = getGovernanceDecision(body);
  const approvalMode = body.payload?.approvalMode ?? null;
  const governanceBypassed =
    approvalMode === "approved" || approvalMode === "override";

  if (!governance.allowed && !body.dryRun && !governanceBypassed) {
    const auditRecord = createActionAuditPayload({
      actionId: body.actionId,
      actionType: body.type,
      dryRun: false,
      ok: false,
      baseMessage: "Execution blocked by governance layer",
      recommendedAction: body.recommendedAction ?? null,
      sourceIds: body.sourceIds ?? [],
      targets,
      mutations: [],
      results: [],
      triggeredBy: body.triggeredBy ?? null,
      requestPayload,
      extraMetadata: {
        auditMode: "governance_block",
        confidence: governance.confidence,
        riskLevel: governance.riskLevel,
        governanceReason: governance.reason,
        approvalMode,
      },
    });

    return {
      ok: false,
      type: body.type,
      actionId: body.actionId,
      dryRun: false,
      message: "Execution blocked: conditions not met",
      mutations: [],
      results: [],
      audit: {
        attempted: false,
        written: false,
        table: null,
        error: null,
        record: auditRecord,
      },
    };
  }

  const { mutations, message } = buildMutationsFromRequest(body);

  if (body.dryRun) {
    const results = mutations.map((mutation) => ({
      table: mutation.table,
      entityId: mutation.filters.id,
      success: true,
    }));

    const auditRecord = createActionAuditPayload({
      actionId: body.actionId,
      actionType: body.type,
      dryRun: true,
      ok: true,
      baseMessage: message,
      recommendedAction: body.recommendedAction ?? null,
      sourceIds: body.sourceIds ?? [],
      targets,
      mutations,
      results,
      triggeredBy: body.triggeredBy ?? null,
      requestPayload,
      extraMetadata: {
        auditMode: "preview_only",
        confidence: governance.confidence,
        riskLevel: governance.riskLevel,
        governanceReason: governance.reason,
        approvalMode,
      },
    });

    return {
      ok: true,
      type: body.type,
      actionId: body.actionId,
      dryRun: true,
      message: auditRecord.message,
      mutations,
      results,
      audit: {
        attempted: false,
        written: false,
        table: null,
        error: null,
        record: auditRecord,
      },
    };
  }

  const supabase = getSupabaseAdmin();

  const results: ExecutionResult["results"] = [];

  for (const mutation of mutations) {
    const result = await executeMutation(supabase, mutation);
    results.push({
      table: mutation.table,
      entityId: mutation.filters.id,
      success: result.success,
      error: result.error,
    });
  }

  const failed = results.filter((result) => !result.success);

  const auditRecord = createActionAuditPayload({
    actionId: body.actionId,
    actionType: body.type,
    dryRun: false,
    ok: failed.length === 0,
    baseMessage: message,
    recommendedAction: body.recommendedAction ?? null,
    sourceIds: body.sourceIds ?? [],
    targets,
    mutations,
    results,
    triggeredBy: body.triggeredBy ?? null,
    requestPayload,
    extraMetadata: {
      auditMode: "execution",
      confidence: governance.confidence,
      riskLevel: governance.riskLevel,
      governanceReason: governance.reason,
      approvalMode,
      governanceBypassed,
    },
  });

  const audit = await writeAuditRecord(supabase, auditRecord);

  return {
    ok: failed.length === 0,
    type: body.type,
    actionId: body.actionId,
    dryRun: false,
    message: auditRecord.message,
    mutations,
    results,
    audit,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecuteActionRequest;

    if (!body || typeof body !== "object") {
      return badRequest("Invalid request body");
    }

    if (!isNonEmptyString(body.type)) {
      return badRequest("Missing required field: type");
    }

    const result = await runExecution(body);

    return NextResponse.json(result, {
      status: result.ok ? 200 : 207,
    });
  } catch (error: any) {
    const message = error?.message || "Unexpected error while executing action";

    if (message.includes("requires") || message.includes("Unsupported action type")) {
      return badRequest(message);
    }

    return serverError(message);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/actions/execute",
    envSupport: {
      url: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
      serverKey: [
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SECRET_KEY",
        "SUPABASE_SERVICE_KEY",
      ],
    },
    supportedTypes: [
      "complete_task",
      "reassign_task",
      "assign_owner",
      "follow_up_contact",
      "fix_contact_data",
      "review_routing",
      "reduce_owner_pressure",
      "rebalance_queue",
      "unblock_work",
      "work_opportunity",
      "review_alert",
      "monitor",
    ],
    audit: {
      enabled: true,
      tableCandidates: getActionAuditTableCandidates(),
    },
  });
}