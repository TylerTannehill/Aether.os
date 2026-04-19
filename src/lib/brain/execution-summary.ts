export type ExecutionSummaryAuditRecord = {
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

export type ExecutionSummaryActionTypeStats = {
  actionType: string;
  total: number;
  successful: number;
  failed: number;
  blocked: number;
  dryRuns: number;
  successRate: number;
  failureRate: number;
  blockedRate: number;
};

export type ExecutionSummaryDomainStats = {
  domain: string;
  total: number;
  successful: number;
  failed: number;
  blocked: number;
  dryRuns: number;
  successRate: number;
  failureRate: number;
  blockedRate: number;
};

export type ExecutionSummaryHotspot = {
  key: string;
  count: number;
};

export type ExecutionSummary = {
  total: number;
  executed: number;
  successful: number;
  failed: number;
  blocked: number;
  dryRuns: number;
  liveRuns: number;
  successRate: number;
  failureRate: number;
  blockedRate: number;
  actionTypes: ExecutionSummaryActionTypeStats[];
  domains: ExecutionSummaryDomainStats[];
  repeatedFailureActionTypes: ExecutionSummaryHotspot[];
  repeatedBlockedReasons: ExecutionSummaryHotspot[];
  unstableDomains: ExecutionSummaryHotspot[];
};

type AuditMetadata = Record<string, unknown>;

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeObject(value: unknown): AuditMetadata {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AuditMetadata)
    : {};
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return clampPercentage((part / total) * 100);
}

function toDisplayKey(
  value: string | null | undefined,
  fallback: string
): string {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function getMetadata(record: ExecutionSummaryAuditRecord): AuditMetadata {
  return safeObject(record.metadata);
}

function getPolicyReason(record: ExecutionSummaryAuditRecord): string | null {
  const metadata = getMetadata(record);

  const candidate =
    typeof metadata.policyReason === "string"
      ? metadata.policyReason
      : typeof metadata.policy_reason === "string"
        ? metadata.policy_reason
        : typeof metadata.blockedReason === "string"
          ? metadata.blockedReason
          : typeof metadata.reason === "string"
            ? metadata.reason
            : null;

  return candidate ? candidate.trim() || null : null;
}

function inferBlocked(record: ExecutionSummaryAuditRecord): boolean {
  const metadata = getMetadata(record);
  const actionType = String(record.action_type ?? "").toLowerCase();
  const message = String(record.message ?? "").toLowerCase();
  const status = String(metadata.status ?? "").toLowerCase();
  const mode = String(metadata.mode ?? "").toLowerCase();
  const policyReason = getPolicyReason(record);

  if (policyReason) return true;
  if (actionType.includes("blocked")) return true;
  if (message.includes("blocked")) return true;
  if (message.includes("manual-only")) return true;
  if (message.includes("outside allowed")) return true;
  if (status === "blocked") return true;
  if (mode === "blocked") return true;

  return false;
}

function inferDomain(record: ExecutionSummaryAuditRecord): string {
  const metadata = getMetadata(record);

  const candidate =
    typeof metadata.domain === "string"
      ? metadata.domain
      : typeof metadata.department === "string"
        ? metadata.department
        : typeof metadata.sourceDomain === "string"
          ? metadata.sourceDomain
          : typeof metadata.targetDomain === "string"
            ? metadata.targetDomain
            : null;

  if (candidate && candidate.trim()) {
    return candidate.trim().toLowerCase();
  }

  const actionType = String(record.action_type ?? "").toLowerCase();

  if (actionType.includes("opportunity")) return "finance";
  if (actionType.includes("contact")) return "outreach";
  if (actionType.includes("task")) return "tasks";
  if (actionType.includes("owner")) return "system";
  if (actionType.includes("routing")) return "system";

  return "system";
}

function buildHotspots(
  counts: Map<string, number>,
  minCount = 2
): ExecutionSummaryHotspot[] {
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.key.localeCompare(b.key);
    });
}

export function buildExecutionSummary(
  records: ExecutionSummaryAuditRecord[]
): ExecutionSummary {
  const normalizedRecords = safeArray(records);

  const total = normalizedRecords.length;
  const dryRuns = normalizedRecords.filter((record) => Boolean(record.dry_run)).length;
  const liveRuns = total - dryRuns;
  const successful = normalizedRecords.filter((record) => Boolean(record.ok)).length;
  const failed = normalizedRecords.filter((record) => !Boolean(record.ok)).length;
  const blocked = normalizedRecords.filter(inferBlocked).length;
  const executed = normalizedRecords.filter((record) => !Boolean(record.dry_run)).length;

  const actionTypeMap = new Map<
    string,
    {
      total: number;
      successful: number;
      failed: number;
      blocked: number;
      dryRuns: number;
    }
  >();

  const domainMap = new Map<
    string,
    {
      total: number;
      successful: number;
      failed: number;
      blocked: number;
      dryRuns: number;
    }
  >();

  const repeatedFailureActionTypes = new Map<string, number>();
  const repeatedBlockedReasons = new Map<string, number>();
  const unstableDomains = new Map<string, number>();

  for (const record of normalizedRecords) {
    const actionType = toDisplayKey(record.action_type, "unknown");
    const domain = inferDomain(record);
    const isSuccess = Boolean(record.ok);
    const isDryRun = Boolean(record.dry_run);
    const isBlocked = inferBlocked(record);

    const existingActionType = actionTypeMap.get(actionType) ?? {
      total: 0,
      successful: 0,
      failed: 0,
      blocked: 0,
      dryRuns: 0,
    };

    existingActionType.total += 1;
    existingActionType.successful += isSuccess ? 1 : 0;
    existingActionType.failed += isSuccess ? 0 : 1;
    existingActionType.blocked += isBlocked ? 1 : 0;
    existingActionType.dryRuns += isDryRun ? 1 : 0;
    actionTypeMap.set(actionType, existingActionType);

    const existingDomain = domainMap.get(domain) ?? {
      total: 0,
      successful: 0,
      failed: 0,
      blocked: 0,
      dryRuns: 0,
    };

    existingDomain.total += 1;
    existingDomain.successful += isSuccess ? 1 : 0;
    existingDomain.failed += isSuccess ? 0 : 1;
    existingDomain.blocked += isBlocked ? 1 : 0;
    existingDomain.dryRuns += isDryRun ? 1 : 0;
    domainMap.set(domain, existingDomain);

    if (!isSuccess) {
      repeatedFailureActionTypes.set(
        actionType,
        (repeatedFailureActionTypes.get(actionType) ?? 0) + 1
      );
      unstableDomains.set(domain, (unstableDomains.get(domain) ?? 0) + 1);
    }

    const policyReason = getPolicyReason(record);
    if (policyReason) {
      repeatedBlockedReasons.set(
        policyReason,
        (repeatedBlockedReasons.get(policyReason) ?? 0) + 1
      );
      unstableDomains.set(domain, (unstableDomains.get(domain) ?? 0) + 1);
    }
  }

  const actionTypes: ExecutionSummaryActionTypeStats[] = Array.from(actionTypeMap.entries())
    .map(([actionType, stats]) => ({
      actionType,
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      blocked: stats.blocked,
      dryRuns: stats.dryRuns,
      successRate: rate(stats.successful, stats.total),
      failureRate: rate(stats.failed, stats.total),
      blockedRate: rate(stats.blocked, stats.total),
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.actionType.localeCompare(b.actionType);
    });

  const domains: ExecutionSummaryDomainStats[] = Array.from(domainMap.entries())
    .map(([domain, stats]) => ({
      domain,
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      blocked: stats.blocked,
      dryRuns: stats.dryRuns,
      successRate: rate(stats.successful, stats.total),
      failureRate: rate(stats.failed, stats.total),
      blockedRate: rate(stats.blocked, stats.total),
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.domain.localeCompare(b.domain);
    });

  return {
    total,
    executed,
    successful,
    failed,
    blocked,
    dryRuns,
    liveRuns,
    successRate: rate(successful, total),
    failureRate: rate(failed, total),
    blockedRate: rate(blocked, total),
    actionTypes,
    domains,
    repeatedFailureActionTypes: buildHotspots(repeatedFailureActionTypes),
    repeatedBlockedReasons: buildHotspots(repeatedBlockedReasons),
    unstableDomains: buildHotspots(unstableDomains),
  };
}