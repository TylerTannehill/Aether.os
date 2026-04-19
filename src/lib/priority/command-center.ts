import {
  PriorityLevel,
  PriorityScoreResult,
  getTopPriorityItems,
  sortPriorityResults,
} from "@/lib/priority/priority-engine";
import {
  OwnerRiskLevel,
  OwnerSignalsResult,
  getRedistributionTargets,
  sortOwnerSignals,
} from "@/lib/priority/owner-signals";

export type CommandCenterAlertType =
  | "risk"
  | "opportunity"
  | "execution"
  | "owner"
  | "system";

export interface CommandCenterAlert {
  id: string;
  type: CommandCenterAlertType;
  level: PriorityLevel;
  title: string;
  message: string;
  action: string;
  score: number;
  badges: string[];
  relatedEntityIds: string[];
  updatedAt: string;
}

export interface CommandCenterMetricCard {
  id: string;
  label: string;
  value: number;
  tone: PriorityLevel | "positive";
  detail: string;
}

export interface CommandCenterFocusItem {
  id: string;
  entityType: string;
  entityId: string;
  level: PriorityLevel;
  score: number;
  title: string;
  summary: string;
  action: string;
  badges: string[];
}

export interface CommandCenterSnapshot {
  generatedAt: string;
  alerts: CommandCenterAlert[];
  topFocus: CommandCenterFocusItem[];
  ownerRisks: OwnerSignalsResult[];
  redistributionTargets: OwnerSignalsResult[];
  metricCards: CommandCenterMetricCard[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    criticalOwnerCount: number;
    highRiskOwnerCount: number;
  };
}

interface BuildCommandCenterSnapshotInput {
  priorityResults: PriorityScoreResult[];
  ownerSignals: OwnerSignalsResult[];
  now?: Date;
}
function countByLevel(
  items: PriorityScoreResult[],
  level: PriorityLevel,
): number {
  return items.filter((item) => item.level === level).length;
}

function countOwnersByRisk(
  items: OwnerSignalsResult[],
  riskLevel: OwnerRiskLevel,
): number {
  return items.filter((item) => item.riskLevel === riskLevel).length;
}

function formatEntityLabel(entityType: string): string {
  switch (entityType) {
    case "task":
      return "Task";
    case "contact":
      return "Contact";
    case "opportunity":
      return "Opportunity";
    case "owner_queue":
      return "Owner Queue";
    case "outreach_gap":
      return "Outreach Gap";
    default:
      return "Item";
  }
}

function buildFocusTitle(item: PriorityScoreResult): string {
  const label = formatEntityLabel(item.entityType);
  return `${label} • ${item.reason || "Priority signal"}`;
}

function makeAlert(
  alert: Omit<CommandCenterAlert, "updatedAt">,
  now: Date,
): CommandCenterAlert {
  return {
    ...alert,
    updatedAt: now.toISOString(),
  };
}

function dedupeAlerts(alerts: CommandCenterAlert[]): CommandCenterAlert[] {
  const seen = new Set<string>();
  const deduped: CommandCenterAlert[] = [];

  for (const alert of alerts) {
    const key = `${alert.type}::${alert.title}::${alert.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(alert);
  }

  return deduped.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });
}

function toFocusItem(item: PriorityScoreResult): CommandCenterFocusItem {
  return {
    id: `${item.entityType}:${item.entityId}`,
    entityType: item.entityType,
    entityId: item.entityId,
    level: item.level,
    score: item.score,
    title: buildFocusTitle(item),
    summary: item.reason,
    action: item.recommendedAction,
    badges: item.badges,
  };
}
function buildPriorityAlerts(
  priorityResults: PriorityScoreResult[],
  now: Date,
): CommandCenterAlert[] {
  const alerts: CommandCenterAlert[] = [];

  const criticalItems = priorityResults.filter((item) => item.level === "critical");
  const fallbackItems = priorityResults.filter((item) =>
    item.reasons.some((reason) => reason.code === "fallback_routing"),
  );
  const staleHighValueContacts = priorityResults.filter(
    (item) =>
      item.entityType === "contact" &&
      item.reasons.some(
        (reason) =>
          reason.code === "large_donation_history" ||
          reason.code === "high_value_contact",
      ) &&
      item.reasons.some(
        (reason) =>
          reason.code === "stale_contact" ||
          reason.code === "no_recent_outreach",
      ),
  );
  const overdueTasks = priorityResults.filter(
    (item) =>
      item.entityType === "task" &&
      item.reasons.some((reason) => reason.code === "overdue_task"),
  );

  if (criticalItems.length > 0) {
    alerts.push(
      makeAlert(
        {
          id: "critical-priority-cluster",
          type: "risk",
          level: "critical",
          title: "Critical priority cluster",
          message: `${criticalItems.length} item(s) are in critical condition and need immediate action`,
          action: "Work the top critical queue now",
          score: 98,
          badges: ["Critical", "Immediate Action"],
          relatedEntityIds: criticalItems.map(
            (item) => `${item.entityType}:${item.entityId}`,
          ),
        },
        now,
      ),
    );
  }

  if (overdueTasks.length >= 3) {
    alerts.push(
      makeAlert(
        {
          id: "overdue-task-pressure",
          type: "execution",
          level: "high",
          title: "Overdue task pressure",
          message: `${overdueTasks.length} task(s) are overdue across the system`,
          action: "Clear overdue execution before adding new work",
          score: 88,
          badges: ["Overdue", "Execution Risk"],
          relatedEntityIds: overdueTasks.map(
            (item) => `${item.entityType}:${item.entityId}`,
          ),
        },
        now,
      ),
    );
  }

  if (fallbackItems.length >= 2) {
    alerts.push(
      makeAlert(
        {
          id: "fallback-routing-pattern",
          type: "system",
          level: "high",
          title: "Fallback routing pattern detected",
          message: `${fallbackItems.length} item(s) are relying on fallback routing`,
          action: "Audit routing logic and tighten owner assignment",
          score: 82,
          badges: ["Fallback", "Workflow Loop"],
          relatedEntityIds: fallbackItems.map(
            (item) => `${item.entityType}:${item.entityId}`,
          ),
        },
        now,
      ),
    );
  }

  if (staleHighValueContacts.length >= 1) {
    alerts.push(
      makeAlert(
        {
          id: "stale-high-value-contacts",
          type: "opportunity",
          level: "high",
          title: "High-value contacts are stalling",
          message: `${staleHighValueContacts.length} important contact(s) need renewed outreach`,
          action: "Push them into focus mode and assign same-day follow-up",
          score: 86,
          badges: ["Revenue", "Follow-Up"],
          relatedEntityIds: staleHighValueContacts.map(
            (item) => `${item.entityType}:${item.entityId}`,
          ),
        },
        now,
      ),
    );
  }

  return alerts;
}
function buildOwnerAlerts(
  ownerSignals: OwnerSignalsResult[],
  now: Date,
): CommandCenterAlert[] {
  const alerts: CommandCenterAlert[] = [];
  const criticalOwners = ownerSignals.filter(
    (owner) => owner.riskLevel === "critical",
  );
  const highRiskOwners = ownerSignals.filter(
    (owner) => owner.riskLevel === "high",
  );
  const redistributionTargets = getRedistributionTargets(ownerSignals);

  if (criticalOwners.length > 0) {
    alerts.push(
      makeAlert(
        {
          id: "critical-owner-risk",
          type: "owner",
          level: "critical",
          title: "Critical owner load detected",
          message: `${criticalOwners.length} owner queue(s) are in critical condition`,
          action: "Rebalance workload immediately",
          score: 96,
          badges: ["Owner Risk", "Redistribute"],
          relatedEntityIds: criticalOwners.map((owner) => owner.ownerId),
        },
        now,
      ),
    );
  }

  if (highRiskOwners.length >= 2) {
    alerts.push(
      makeAlert(
        {
          id: "multiple-high-risk-owners",
          type: "owner",
          level: "high",
          title: "Multiple owners under pressure",
          message: `${highRiskOwners.length} owner queue(s) show high execution pressure`,
          action: "Review overdue load, stale contacts, and fallback volume",
          score: 84,
          badges: ["Owner Pressure", "Queue Health"],
          relatedEntityIds: highRiskOwners.map((owner) => owner.ownerId),
        },
        now,
      ),
    );
  }

  if (redistributionTargets.length > 0) {
    alerts.push(
      makeAlert(
        {
          id: "redistribution-capacity-available",
          type: "execution",
          level: "medium",
          title: "Redistribution capacity available",
          message: `${redistributionTargets.length} owner queue(s) can absorb more work`,
          action: "Shift selected tasks to strong execution owners",
          score: 62,
          badges: ["Capacity", "Strong Execution"],
          relatedEntityIds: redistributionTargets.map((owner) => owner.ownerId),
        },
        now,
      ),
    );
  }

  return alerts;
}

function buildMetricCards(
  priorityResults: PriorityScoreResult[],
  ownerSignals: OwnerSignalsResult[],
): CommandCenterMetricCard[] {
  const criticalCount = countByLevel(priorityResults, "critical");
  const highCount = countByLevel(priorityResults, "high");
  const overdueOwnerCount = ownerSignals.filter(
    (owner) => owner.metrics.overdueTasks > 0,
  ).length;
  const staleHighValueContactCount = ownerSignals.reduce(
    (sum, owner) => sum + owner.metrics.highValueStaleContacts,
    0,
  );
  const redistributionCapacity = getRedistributionTargets(ownerSignals).length;

  return [
    {
      id: "critical-items",
      label: "Critical Items",
      value: criticalCount,
      tone: criticalCount > 0 ? "critical" : "positive",
      detail:
        criticalCount > 0
          ? "Immediate command-center attention required"
          : "No critical items detected",
    },
    {
      id: "high-priority-items",
      label: "High Priority",
      value: highCount,
      tone: highCount >= 5 ? "high" : highCount > 0 ? "medium" : "positive",
      detail: "System-wide high priority queue",
    },
    {
      id: "owners-with-overdue",
      label: "Owners w/ Overdue",
      value: overdueOwnerCount,
      tone: overdueOwnerCount >= 2 ? "high" : overdueOwnerCount > 0 ? "medium" : "positive",
      detail: "Owner queues carrying overdue task load",
    },
    {
      id: "stale-high-value-contacts",
      label: "Stale High-Value Contacts",
      value: staleHighValueContactCount,
      tone:
        staleHighValueContactCount >= 3
          ? "high"
          : staleHighValueContactCount > 0
            ? "medium"
            : "positive",
      detail: "Revenue opportunities not being worked",
    },
    {
      id: "redistribution-targets",
      label: "Redistribution Targets",
      value: redistributionCapacity,
      tone: redistributionCapacity > 0 ? "positive" : "low",
      detail: "Owner queues that can take additional work",
    },
  ];
}
export function buildCommandCenterSnapshot(
  input: BuildCommandCenterSnapshotInput,
): CommandCenterSnapshot {
  const now = input.now ?? new Date();
  const sortedPriority = sortPriorityResults(input.priorityResults);
  const sortedOwners = sortOwnerSignals(input.ownerSignals);

  const alerts = dedupeAlerts([
    ...buildPriorityAlerts(sortedPriority, now),
    ...buildOwnerAlerts(sortedOwners, now),
  ]);

  const topFocus = getTopPriorityItems(sortedPriority, 12).map(toFocusItem);
  const redistributionTargets = getRedistributionTargets(sortedOwners);
  const metricCards = buildMetricCards(sortedPriority, sortedOwners);

  return {
    generatedAt: now.toISOString(),
    alerts,
    topFocus,
    ownerRisks: sortedOwners,
    redistributionTargets,
    metricCards,
    summary: {
      criticalCount: countByLevel(sortedPriority, "critical"),
      highCount: countByLevel(sortedPriority, "high"),
      mediumCount: countByLevel(sortedPriority, "medium"),
      lowCount: countByLevel(sortedPriority, "low"),
      criticalOwnerCount: countOwnersByRisk(sortedOwners, "critical"),
      highRiskOwnerCount: countOwnersByRisk(sortedOwners, "high"),
    },
  };
}

export function getPrimaryCommandCenterAlert(
  snapshot: CommandCenterSnapshot,
): CommandCenterAlert | null {
  return snapshot.alerts.length ? snapshot.alerts[0] : null;
}

export function getTopOwnerRisks(
  snapshot: CommandCenterSnapshot,
  limit = 5,
): OwnerSignalsResult[] {
  return snapshot.ownerRisks.slice(0, limit);
}

export function getTopFocusByLevel(
  snapshot: CommandCenterSnapshot,
  level: PriorityLevel,
  limit = 10,
): CommandCenterFocusItem[] {
  return snapshot.topFocus
    .filter((item) => item.level === level)
    .slice(0, limit);
}