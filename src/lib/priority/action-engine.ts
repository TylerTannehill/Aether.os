import {
  CommandCenterAlert,
  CommandCenterSnapshot,
} from "@/lib/priority/command-center";
import {
  PriorityLevel,
  PriorityScoreResult,
} from "@/lib/priority/priority-engine";
import { OwnerSignalsResult } from "@/lib/priority/owner-signals";
import { getImpactAdjustedScore } from "@/lib/priority/impact-scoring";

export type ActionType =
  | "complete_task"
  | "reassign_task"
  | "assign_owner"
  | "follow_up_contact"
  | "fix_contact_data"
  | "review_routing"
  | "reduce_owner_pressure"
  | "rebalance_queue"
  | "unblock_work"
  | "work_opportunity"
  | "review_alert"
  | "monitor";

export type ActionBucket =
  | "fix_now"
  | "do_next"
  | "follow_up"
  | "routing"
  | "owner"
  | "pipeline";

export interface ActionTarget {
  entityType: string;
  entityId: string;
}

export interface ActionItem {
  id: string;
  type: ActionType;
  bucket: ActionBucket;
  level: PriorityLevel;
  score: number;
  title: string;
  summary: string;
  reason: string;
  recommendedAction: string;
  targets: ActionTarget[];
  sourceIds: string[];
  badges: string[];
  createdAt: string;
}

export interface ActionEngineResult {
  actions: ActionItem[];
  topActions: ActionItem[];
  buckets: Record<ActionBucket, ActionItem[]>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    fixNow: number;
    doNext: number;
  };
}

export interface BuildActionEngineInput {
  priorityResults: PriorityScoreResult[];
  ownerSignals: OwnerSignalsResult[];
  snapshot: CommandCenterSnapshot;
  now?: Date;
}

function countByLevel(items: ActionItem[], level: PriorityLevel): number {
  return items.filter((item) => item.level === level).length;
}

function dedupeStrings(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function inferActionTypeFromPriority(item: PriorityScoreResult): ActionType {
  const codes = item.reasons.map((reason) => reason.code);

  if (codes.includes("overdue_task")) return "complete_task";
  if (codes.includes("unowned_item")) return "assign_owner";
  if (codes.includes("missing_contact_data")) return "fix_contact_data";
  if (codes.includes("fallback_routing")) return "review_routing";
  if (codes.includes("blocked_work")) return "unblock_work";
  if (codes.includes("pledge_opportunity")) return "work_opportunity";
  if (codes.includes("no_recent_outreach")) return "follow_up_contact";
  if (codes.includes("stale_contact")) return "follow_up_contact";
  if (item.entityType === "owner_queue") return "reduce_owner_pressure";

  return "monitor";
}

function inferBucketFromActionType(type: ActionType): ActionBucket {
  switch (type) {
    case "complete_task":
    case "unblock_work":
      return "fix_now";
    case "reassign_task":
    case "assign_owner":
    case "reduce_owner_pressure":
    case "rebalance_queue":
      return "owner";
    case "follow_up_contact":
      return "follow_up";
    case "fix_contact_data":
      return "do_next";
    case "review_routing":
      return "routing";
    case "work_opportunity":
      return "pipeline";
    case "review_alert":
      return "fix_now";
    default:
      return "do_next";
  }
}

function buildActionTitle(type: ActionType, item: PriorityScoreResult): string {
  switch (type) {
    case "complete_task":
      return "Complete overdue task";
    case "reassign_task":
      return "Reassign task";
    case "assign_owner":
      return "Assign owner";
    case "follow_up_contact":
      return "Follow up contact";
    case "fix_contact_data":
      return "Fix missing contact data";
    case "review_routing":
      return "Review routing logic";
    case "reduce_owner_pressure":
      return "Reduce owner pressure";
    case "rebalance_queue":
      return "Rebalance queue";
    case "unblock_work":
      return "Unblock work";
    case "work_opportunity":
      return "Work fundraising opportunity";
    case "review_alert":
      return "Review command center alert";
    default:
      return `Review ${item.entityType}`;
  }
}

function buildActionTargets(item: PriorityScoreResult): ActionTarget[] {
  return [
    {
      entityType: item.entityType,
      entityId: item.entityId,
    },
  ];
}

function getLevelWeight(level: PriorityLevel): number {
  switch (level) {
    case "critical":
      return 30;
    case "high":
      return 20;
    case "medium":
      return 10;
    case "low":
    default:
      return 0;
  }
}

function getBucketWeight(bucket: ActionBucket): number {
  switch (bucket) {
    case "fix_now":
      return 15;
    case "owner":
      return 12;
    case "pipeline":
      return 10;
    case "routing":
      return 8;
    case "follow_up":
      return 7;
    case "do_next":
    default:
      return 4;
  }
}

function getTypeWeight(type: ActionType): number {
  switch (type) {
    case "complete_task":
      return 12;
    case "unblock_work":
      return 11;
    case "reduce_owner_pressure":
      return 10;
    case "assign_owner":
      return 9;
    case "reassign_task":
      return 8;
    case "work_opportunity":
      return 8;
    case "follow_up_contact":
      return 7;
    case "fix_contact_data":
      return 6;
    case "review_routing":
      return 5;
    case "rebalance_queue":
      return 5;
    case "review_alert":
      return 4;
    case "monitor":
    default:
      return 0;
  }
}

function getBadgeWeight(badges: string[]): number {
  let weight = 0;

  for (const badge of badges) {
    const normalized = badge.toLowerCase();

    if (normalized.includes("fallback")) weight += 8;
    if (normalized.includes("blocked")) weight += 8;
    if (normalized.includes("owner pressure")) weight += 7;
    if (normalized.includes("capacity")) weight += 4;
    if (normalized.includes("strong execution")) weight += 3;
    if (normalized.includes("missing")) weight += 5;
    if (normalized.includes("stale")) weight += 4;
    if (normalized.includes("trigger")) weight += 6;
    if (normalized.includes("source")) weight += 2;
    if (normalized.includes("target")) weight += 2;
  }

  return weight;
}

export function getActionPriorityScore(action: ActionItem): number {
  const score =
    action.score +
    getLevelWeight(action.level) +
    getBucketWeight(action.bucket) +
    getTypeWeight(action.type) +
    getBadgeWeight(action.badges);

  return clamp(score);
}

function actionFromPriorityResult(
  item: PriorityScoreResult,
  now: Date
): ActionItem {
  const type = inferActionTypeFromPriority(item);
  const bucket = inferBucketFromActionType(type);

  return {
    id: `action:${item.entityType}:${item.entityId}:${type}`,
    type,
    bucket,
    level: item.level,
    score: item.score,
    title: buildActionTitle(type, item),
    summary: item.reason,
    reason: item.reason,
    recommendedAction: item.recommendedAction,
    targets: buildActionTargets(item),
    sourceIds: [`${item.entityType}:${item.entityId}`],
    badges: item.badges,
    createdAt: now.toISOString(),
  };
}

function actionFromOwnerSignal(
  owner: OwnerSignalsResult,
  now: Date
): ActionItem | null {
  if (owner.riskLevel === "low" && owner.executionScore >= 70) {
    return {
      id: `action:owner:${owner.ownerId}:rebalance_queue`,
      type: "rebalance_queue",
      bucket: "owner",
      level: "medium",
      score: Math.max(40, owner.executionScore),
      title: "Use owner as redistribution target",
      summary: `${owner.ownerName || owner.ownerId} can absorb more work`,
      reason: owner.summary,
      recommendedAction: "Shift selected tasks to this owner",
      targets: [
        {
          entityType: "owner_queue",
          entityId: owner.ownerId,
        },
      ],
      sourceIds: [owner.ownerId],
      badges: ["Capacity", "Strong Execution"],
      createdAt: now.toISOString(),
    };
  }

  if (
    owner.riskLevel === "medium" ||
    owner.riskLevel === "high" ||
    owner.riskLevel === "critical"
  ) {
    return {
      id: `action:owner:${owner.ownerId}:reduce_owner_pressure`,
      type: "reduce_owner_pressure",
      bucket: "owner",
      level:
        owner.riskLevel === "critical"
          ? "critical"
          : owner.riskLevel === "high"
            ? "high"
            : "medium",
      score: owner.pressureScore,
      title: "Reduce owner pressure",
      summary: `${owner.ownerName || owner.ownerId} is carrying execution pressure`,
      reason: owner.summary,
      recommendedAction: owner.recommendations[0] || "Audit owner workload",
      targets: [
        {
          entityType: "owner_queue",
          entityId: owner.ownerId,
        },
      ],
      sourceIds: [owner.ownerId],
      badges: ["Owner Pressure", ...(owner.recommendations.slice(0, 2) || [])],
      createdAt: now.toISOString(),
    };
  }

  return null;
}

function actionFromAlert(
  alert: CommandCenterAlert,
  now: Date
): ActionItem {
  return {
    id: `action:alert:${alert.id}`,
    type: "review_alert",
    bucket:
      alert.level === "critical" || alert.level === "high"
        ? "fix_now"
        : "do_next",
    level: alert.level,
    score: alert.score,
    title: alert.title,
    summary: alert.message,
    reason: alert.message,
    recommendedAction: alert.action,
    targets: alert.relatedEntityIds.map((id) => {
      const [entityType, entityId] = id.includes(":")
        ? id.split(":")
        : ["owner_queue", id];

      return {
        entityType,
        entityId,
      };
    }),
    sourceIds: alert.relatedEntityIds,
    badges: alert.badges,
    createdAt: now.toISOString(),
  };
}

function dedupeActions(actions: ActionItem[]): ActionItem[] {
  const byId = new Map<string, ActionItem>();

  for (const action of actions) {
    const existing = byId.get(action.id);

    if (
      !existing ||
      getImpactAdjustedScore(action) > getImpactAdjustedScore(existing)
    ) {
      byId.set(action.id, action);
    }
  }

  return [...byId.values()];
}

function sortActions(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort((a, b) => {
    const impactDiff = getImpactAdjustedScore(b) - getImpactAdjustedScore(a);
    if (impactDiff !== 0) return impactDiff;

    const priorityDiff = getActionPriorityScore(b) - getActionPriorityScore(a);
    if (priorityDiff !== 0) return priorityDiff;

    if (b.score !== a.score) return b.score - a.score;

    return a.title.localeCompare(b.title);
  });
}

function groupActions(actions: ActionItem[]): Record<ActionBucket, ActionItem[]> {
  return {
    fix_now: actions.filter((action) => action.bucket === "fix_now"),
    do_next: actions.filter((action) => action.bucket === "do_next"),
    follow_up: actions.filter((action) => action.bucket === "follow_up"),
    routing: actions.filter((action) => action.bucket === "routing"),
    owner: actions.filter((action) => action.bucket === "owner"),
    pipeline: actions.filter((action) => action.bucket === "pipeline"),
  };
}

function compressActions(actions: ActionItem[]): ActionItem[] {
  const seen = new Set<string>();
  const compressed: ActionItem[] = [];

  for (const action of sortActions(actions)) {
    const key = `${action.type}:${dedupeStrings(action.sourceIds).sort().join("|")}`;
    if (seen.has(key)) continue;

    seen.add(key);

    compressed.push({
      ...action,
      badges: dedupeStrings(action.badges).slice(0, 4),
      sourceIds: dedupeStrings(action.sourceIds),
    });
  }

  return compressed;
}

export function createActionEngineResult(
  actions: ActionItem[]
): ActionEngineResult {
  const normalized = compressActions(dedupeActions(actions));
  const sortedActions = sortActions(normalized);
  const buckets = groupActions(sortedActions);

  return {
    actions: sortedActions,
    topActions: sortedActions.slice(0, 12),
    buckets,
    summary: {
      total: sortedActions.length,
      critical: countByLevel(sortedActions, "critical"),
      high: countByLevel(sortedActions, "high"),
      medium: countByLevel(sortedActions, "medium"),
      low: countByLevel(sortedActions, "low"),
      fixNow: buckets.fix_now.length,
      doNext: buckets.do_next.length,
    },
  };
}

export function buildActionEngine(
  input: BuildActionEngineInput
): ActionEngineResult {
  const now = input.now ?? new Date();

  const priorityActions = input.priorityResults
    .filter((item) => item.level !== "low" || item.score >= 25)
    .map((item) => actionFromPriorityResult(item, now));

  const ownerActions = input.ownerSignals
    .map((owner) => actionFromOwnerSignal(owner, now))
    .filter(Boolean) as ActionItem[];

  const alertActions = input.snapshot.alerts.map((alert) =>
    actionFromAlert(alert, now)
  );

  return createActionEngineResult([
    ...priorityActions,
    ...ownerActions,
    ...alertActions,
  ]);
}

export function buildActionEngineSummary(
  input: BuildActionEngineInput
) {
  const result = buildActionEngine(input);

  return {
    totalActions: result.summary.total,
    critical: result.summary.critical,
    high: result.summary.high,
    fixNow: result.summary.fixNow,
    doNext: result.summary.doNext,
    topActions: result.topActions.slice(0, 5),
  };
}