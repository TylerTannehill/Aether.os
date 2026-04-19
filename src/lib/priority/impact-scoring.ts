import { ActionBucket, ActionItem, ActionType } from "@/lib/priority/action-engine";

export interface ImpactScoreBreakdown {
  baseScore: number;
  urgencyScore: number;
  impactScore: number;
  confidenceScore: number;
  ownerLoadAdjustment: number;
  dependencyPenalty: number;
  finalScore: number;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function hasBadge(action: ActionItem, match: string): boolean {
  return action.badges.some((badge) =>
    badge.toLowerCase().includes(match.toLowerCase())
  );
}

function getBaseScore(action: ActionItem): number {
  return clamp(action.score);
}

function getUrgencyScore(level: ActionItem["level"], bucket: ActionBucket): number {
  let score = 0;

  if (level === "critical") score += 30;
  if (level === "high") score += 22;
  if (level === "medium") score += 12;
  if (level === "low") score += 4;

  if (bucket === "fix_now") score += 18;
  if (bucket === "owner") score += 12;
  if (bucket === "pipeline") score += 10;
  if (bucket === "follow_up") score += 8;
  if (bucket === "routing") score += 6;
  if (bucket === "do_next") score += 4;

  return clamp(score);
}
function getImpactScore(type: ActionType): number {
  switch (type) {
    case "complete_task":
      return 18;
    case "unblock_work":
      return 20;
    case "follow_up_contact":
      return 16;
    case "work_opportunity":
      return 22;
    case "assign_owner":
      return 17;
    case "reassign_task":
      return 15;
    case "reduce_owner_pressure":
      return 19;
    case "rebalance_queue":
      return 14;
    case "fix_contact_data":
      return 12;
    case "review_routing":
      return 10;
    case "review_alert":
      return 9;
    case "monitor":
    default:
      return 6;
  }
}

function getConfidenceScore(action: ActionItem): number {
  let score = 12;

  if (action.targets.length === 1) score += 8;
  if (action.targets.length === 2) score += 4;
  if (action.targets.length > 2) score -= 4;

  if (hasBadge(action, "fallback")) score -= 6;
  if (hasBadge(action, "blocked")) score -= 4;
  if (hasBadge(action, "strong execution")) score += 5;
  if (hasBadge(action, "capacity")) score += 4;
  if (hasBadge(action, "owner pressure")) score += 3;
  if (hasBadge(action, "missing")) score -= 5;

  return clamp(score, -20, 20);
}

function getOwnerLoadAdjustment(action: ActionItem): number {
  let adjustment = 0;

  if (action.type === "reduce_owner_pressure") adjustment += 10;
  if (action.type === "assign_owner") adjustment += 6;
  if (action.type === "reassign_task") adjustment += 5;
  if (action.type === "rebalance_queue") adjustment += 4;

  if (hasBadge(action, "owner pressure")) adjustment += 6;
  if (hasBadge(action, "capacity")) adjustment += 5;

  return clamp(adjustment, -10, 20);
}
function getDependencyPenalty(action: ActionItem): number {
  let penalty = 0;

  if (hasBadge(action, "fallback")) penalty += 8;
  if (hasBadge(action, "missing")) penalty += 6;
  if (hasBadge(action, "blocked")) penalty += 7;

  if (action.type === "fix_contact_data") penalty -= 4;
  if (action.type === "unblock_work") penalty -= 3;
  if (action.type === "review_routing") penalty -= 2;

  return clamp(penalty, -10, 20);
}

export function getImpactScoreBreakdown(
  action: ActionItem
): ImpactScoreBreakdown {
  const baseScore = getBaseScore(action);
  const urgencyScore = getUrgencyScore(action.level, action.bucket);
  const impactScore = getImpactScore(action.type);
  const confidenceScore = getConfidenceScore(action);
  const ownerLoadAdjustment = getOwnerLoadAdjustment(action);
  const dependencyPenalty = getDependencyPenalty(action);

  const finalScore = clamp(
    baseScore +
      urgencyScore +
      impactScore +
      confidenceScore +
      ownerLoadAdjustment -
      dependencyPenalty
  );

  return {
    baseScore,
    urgencyScore,
    impactScore,
    confidenceScore,
    ownerLoadAdjustment,
    dependencyPenalty,
    finalScore,
  };
}
export function getImpactAdjustedScore(action: ActionItem): number {
  return getImpactScoreBreakdown(action).finalScore;
}

export function rankActionsByImpact(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort((a, b) => {
    const scoreDiff = getImpactAdjustedScore(b) - getImpactAdjustedScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    if (b.score !== a.score) return b.score - a.score;

    return a.title.localeCompare(b.title);
  });
}