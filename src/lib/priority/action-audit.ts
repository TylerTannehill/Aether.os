export type ActionAuditTarget = {
  entityType: string;
  entityId: string;
};

export type ActionAuditMutation = {
  table: string;
  action: "update";
  filters: Record<string, string>;
  values: Record<string, unknown>;
};

export type ActionAuditMutationResult = {
  table: string;
  entityId?: string;
  success: boolean;
  error?: string;
};

export type ActionAuditRecord = {
  id?: string;
  action_id: string;
  action_type: string;
  dry_run: boolean;
  ok: boolean;
  message: string;
  recommended_action: string | null;
  source_ids: string[];
  targets: ActionAuditTarget[];
  mutations: ActionAuditMutation[];
  results: ActionAuditMutationResult[];
  triggered_by: string | null;
  request_payload: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreateActionAuditPayloadInput = {
  actionId?: string;
  actionType: string;
  dryRun: boolean;
  ok: boolean;
  baseMessage: string;
  recommendedAction?: string | null;
  sourceIds?: string[];
  targets?: ActionAuditTarget[];
  mutations?: ActionAuditMutation[];
  results?: ActionAuditMutationResult[];
  triggeredBy?: string | null;
  requestPayload?: Record<string, unknown> | null;
  extraMetadata?: Record<string, unknown>;
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeObject(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => (value || "").trim()).filter(Boolean))];
}
function normalizeTargets(targets?: ActionAuditTarget[]): ActionAuditTarget[] {
  return safeArray(targets).filter(
    (target) =>
      target &&
      typeof target.entityType === "string" &&
      target.entityType.trim().length > 0 &&
      typeof target.entityId === "string" &&
      target.entityId.trim().length > 0
  );
}

function normalizeMutations(
  mutations?: ActionAuditMutation[]
): ActionAuditMutation[] {
  return safeArray(mutations).filter(
    (mutation) =>
      mutation &&
      typeof mutation.table === "string" &&
      mutation.table.trim().length > 0 &&
      mutation.action === "update"
  );
}

function normalizeResults(
  results?: ActionAuditMutationResult[]
): ActionAuditMutationResult[] {
  return safeArray(results).filter(
    (result) =>
      result &&
      typeof result.table === "string" &&
      result.table.trim().length > 0 &&
      typeof result.success === "boolean"
  );
}

function buildAuditMessage(
  baseMessage: string,
  dryRun: boolean,
  ok: boolean,
  mutationCount: number,
  failedCount: number
) {
  const modePrefix = dryRun ? "Preview" : ok ? "Executed" : "Execution issue";

  if (mutationCount === 0) {
    return `${modePrefix} → ${baseMessage}`;
  }

  if (failedCount === 0) {
    return `${modePrefix} → ${baseMessage} (${mutationCount} mutation${
      mutationCount === 1 ? "" : "s"
    })`;
  }

  return `${modePrefix} → ${baseMessage} (${failedCount} failed / ${mutationCount} attempted)`;
}

function buildMetadata(input: {
  dryRun: boolean;
  ok: boolean;
  sourceIds: string[];
  targets: ActionAuditTarget[];
  mutations: ActionAuditMutation[];
  results: ActionAuditMutationResult[];
  requestPayload: Record<string, unknown> | null;
  extraMetadata?: Record<string, unknown>;
}) {
  const failedResults = input.results.filter((result) => !result.success);

  return {
    mode: input.dryRun ? "preview" : "execution",
    status: input.ok ? "ok" : "issue",
    sourceCount: input.sourceIds.length,
    targetCount: input.targets.length,
    mutationCount: input.mutations.length,
    resultCount: input.results.length,
    failedCount: failedResults.length,
    affectedTables: uniqueStrings(input.mutations.map((mutation) => mutation.table)),
    affectedEntityIds: uniqueStrings(
      input.results.map((result) => result.entityId ?? null)
    ),
    requestPayloadKeys: Object.keys(input.requestPayload ?? {}),
    ...safeObject(input.extraMetadata),
  };
}
export function createActionAuditPayload(
  input: CreateActionAuditPayloadInput
): ActionAuditRecord {
  const sourceIds = uniqueStrings(input.sourceIds ?? []);
  const targets = normalizeTargets(input.targets);
  const mutations = normalizeMutations(input.mutations);
  const results = normalizeResults(input.results);
  const requestPayload =
    input.requestPayload && typeof input.requestPayload === "object"
      ? input.requestPayload
      : null;

  const failedCount = results.filter((result) => !result.success).length;
  const message = buildAuditMessage(
    input.baseMessage,
    input.dryRun,
    input.ok,
    mutations.length,
    failedCount
  );

  const metadata = buildMetadata({
    dryRun: input.dryRun,
    ok: input.ok,
    sourceIds,
    targets,
    mutations,
    results,
    requestPayload,
    extraMetadata: input.extraMetadata,
  });

  return {
    action_id:
      (input.actionId || `${input.actionType}:${new Date().toISOString()}`).trim(),
    action_type: input.actionType,
    dry_run: Boolean(input.dryRun),
    ok: Boolean(input.ok),
    message,
    recommended_action: input.recommendedAction ?? null,
    source_ids: sourceIds,
    targets,
    mutations,
    results,
    triggered_by: input.triggeredBy ?? null,
    request_payload: requestPayload,
    metadata,
    created_at: new Date().toISOString(),
  };
}
export function getActionAuditTableCandidates(): string[] {
  return [
    "action_audit",
    "action_audit_log",
    "action_execution_audit",
  ];
}

export function getActionAuditSummary(
  records: ActionAuditRecord[]
): {
  total: number;
  successful: number;
  failed: number;
  dryRuns: number;
  byActionType: Record<string, number>;
} {
  const total = records.length;
  const successful = records.filter((record) => record.ok).length;
  const failed = records.filter((record) => !record.ok).length;
  const dryRuns = records.filter((record) => record.dry_run).length;

  const byActionType = records.reduce<Record<string, number>>((acc, record) => {
    const actionType = record.action_type || "unknown";
    acc[actionType] = (acc[actionType] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    successful,
    failed,
    dryRuns,
    byActionType,
  };
}
export function toActionAuditRecord(
  value: Record<string, unknown>
): ActionAuditRecord {
  return {
    id: typeof value.id === "string" ? value.id : undefined,
    action_id: typeof value.action_id === "string" ? value.action_id : "unknown",
    action_type:
      typeof value.action_type === "string" ? value.action_type : "unknown",
    dry_run: Boolean(value.dry_run),
    ok: Boolean(value.ok),
    message:
      typeof value.message === "string" ? value.message : "No message recorded",
    recommended_action:
      typeof value.recommended_action === "string"
        ? value.recommended_action
        : null,
    source_ids: Array.isArray(value.source_ids)
      ? value.source_ids.filter((item): item is string => typeof item === "string")
      : [],
    targets: Array.isArray(value.targets)
      ? value.targets.filter(
          (item): item is ActionAuditTarget =>
            !!item &&
            typeof item === "object" &&
            typeof (item as ActionAuditTarget).entityType === "string" &&
            typeof (item as ActionAuditTarget).entityId === "string"
        )
      : [],
    mutations: Array.isArray(value.mutations)
      ? value.mutations.filter(
          (item): item is ActionAuditMutation =>
            !!item &&
            typeof item === "object" &&
            typeof (item as ActionAuditMutation).table === "string" &&
            (item as ActionAuditMutation).action === "update"
        )
      : [],
    results: Array.isArray(value.results)
      ? value.results.filter(
          (item): item is ActionAuditMutationResult =>
            !!item &&
            typeof item === "object" &&
            typeof (item as ActionAuditMutationResult).table === "string" &&
            typeof (item as ActionAuditMutationResult).success === "boolean"
        )
      : [],
    triggered_by:
      typeof value.triggered_by === "string" ? value.triggered_by : null,
    request_payload:
      value.request_payload &&
      typeof value.request_payload === "object" &&
      !Array.isArray(value.request_payload)
        ? (value.request_payload as Record<string, unknown>)
        : null,
    metadata:
      value.metadata &&
      typeof value.metadata === "object" &&
      !Array.isArray(value.metadata)
        ? (value.metadata as Record<string, unknown>)
        : {},
    created_at:
      typeof value.created_at === "string"
        ? value.created_at
        : new Date().toISOString(),
  };
}