import {
  BrainContext,
  BrainFailureType,
  BrainIssueType,
  BrainPriorityHint,
} from "./context-layer";

export type BrainDecisionTier = "critical" | "high" | "medium" | "low";

export type BrainDecisionWeights = {
  impact: number;
  urgency: number;
  confidence: number;
  ease: number;
};

export type BrainDecisionBreakdown = {
  impact: number;
  urgency: number;
  confidence: number;
  ease: number;
};

export type BrainDecisionResult = {
  itemId: string;
  score: number;
  tier: BrainDecisionTier;
  breakdown: BrainDecisionBreakdown;
  reasons: string[];
  shouldSurface: boolean;
  shouldAutoExecute: boolean;
  context: BrainContext;
};

const DEFAULT_WEIGHTS: BrainDecisionWeights = {
  impact: 0.4,
  urgency: 0.3,
  confidence: 0.2,
  ease: 0.1,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function mapPriorityHintToImpact(priorityHint: BrainPriorityHint): number {
  switch (priorityHint) {
    case "critical":
      return 1;
    case "high":
      return 0.82;
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.45;
  }
}

function mapFailureTypeToImpact(failureType: BrainFailureType): number {
  switch (failureType) {
    case "no_owner":
      return 0.92;
    case "missing_contact_data":
      return 0.86;
    case "blocked_dependency":
      return 0.95;
    case "no_rule_match":
      return 0.72;
    case "stale_data":
      return 0.7;
    case "manual_override":
      return 0.45;
    case "unknown":
      return 0.68;
    case null:
    default:
      return 0.5;
  }
}

function mapIssueTypeToImpact(issueType: BrainIssueType): number {
  switch (issueType) {
    case "failure":
      return 0.95;
    case "warning":
      return 0.75;
    case "opportunity":
      return 0.72;
    case "execution":
      return 0.7;
    case "follow_up":
      return 0.62;
    case "review":
      return 0.35;
    default:
      return 0.5;
  }
}

function scoreImpact(context: BrainContext, reasons: string[]): number {
  let score = 0.4;

  const priorityImpact = mapPriorityHintToImpact(context.priorityHint);
  score = Math.max(score, priorityImpact);

  if (context.failureType) {
    const failureImpact = mapFailureTypeToImpact(context.failureType);
    score = Math.max(score, failureImpact);
    reasons.push(`Failure context increases impact (${context.failureType}).`);
  }

  const issueImpact = mapIssueTypeToImpact(context.issueType);
  score = Math.max(score, issueImpact);

  if (context.department === "finance" || context.department === "executive") {
    score += 0.08;
    reasons.push(`Department weighting increased impact (${context.department}).`);
  }

  if (context.relatedMetric) {
    score += 0.04;
    reasons.push(`Connected metric increased impact (${context.relatedMetric}).`);
  }

  return clamp(score);
}

function scoreUrgency(context: BrainContext, reasons: string[]): number {
  let score = 0.35;

  if (context.priorityHint === "critical") {
    score = Math.max(score, 0.95);
    reasons.push("Critical priority hint increased urgency.");
  } else if (context.priorityHint === "high") {
    score = Math.max(score, 0.78);
    reasons.push("High priority hint increased urgency.");
  }

  if (context.hasFallback) {
    score += 0.1;
    reasons.push("Fallback status increased urgency.");
  }

  if (context.isStale) {
    score += 0.2;
    reasons.push("Stale data increased urgency.");
  }

  if (context.dueAt) {
    const dueTime = new Date(context.dueAt).getTime();

    if (!Number.isNaN(dueTime)) {
      const now = Date.now();
      const delta = dueTime - now;
      const oneDay = 1000 * 60 * 60 * 24;
      const threeDays = oneDay * 3;

      if (delta <= 0) {
        score = Math.max(score, 1);
        reasons.push("Overdue item increased urgency to maximum.");
      } else if (delta <= oneDay) {
        score = Math.max(score, 0.9);
        reasons.push("Due within 24 hours increased urgency.");
      } else if (delta <= threeDays) {
        score = Math.max(score, 0.75);
        reasons.push("Due within 3 days increased urgency.");
      }
    }
  }

  return clamp(score);
}
function scoreConfidence(context: BrainContext, reasons: string[]): number {
  let score = 0.55;

  if (context.hasOwner) {
    score += 0.12;
    reasons.push("Assigned owner increased confidence.");
  } else {
    score -= 0.15;
    reasons.push("Missing owner reduced confidence.");
  }

  if (context.failureType === "no_rule_match") {
    score -= 0.12;
    reasons.push("No rule match reduced confidence.");
  }

  if (context.failureType === "manual_override") {
    score -= 0.08;
    reasons.push("Manual override reduced confidence.");
  }

  if (context.issueType === "review") {
    score -= 0.08;
    reasons.push("Review-oriented item reduced confidence.");
  }

  if (context.source === "system" || context.source === "routing") {
    score += 0.08;
    reasons.push(`Structured source increased confidence (${context.source}).`);
  }

  if (context.relatedMetric) {
    score += 0.05;
    reasons.push("Metric linkage increased confidence.");
  }

  return clamp(score);
}

function scoreEase(context: BrainContext, reasons: string[]): number {
  let score = 0.5;

  if (context.isManualOnly) {
    score -= 0.2;
    reasons.push("Manual-only item reduced ease.");
  }

  if (context.isAutoExecutable) {
    score += 0.28;
    reasons.push("Auto-executable item increased ease.");
  }

  if (!context.hasOwner) {
    score -= 0.12;
    reasons.push("Missing owner reduced ease.");
  }

  if (context.failureType === "blocked_dependency") {
    score -= 0.3;
    reasons.push("Blocked dependency reduced ease.");
  }

  if (context.issueType === "follow_up" || context.issueType === "execution") {
    score += 0.08;
    reasons.push(`Action-oriented issue increased ease (${context.issueType}).`);
  }

  return clamp(score);
}

function resolveTier(score: number): BrainDecisionTier {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function decideBrainItem(
  context: BrainContext,
  weights: BrainDecisionWeights = DEFAULT_WEIGHTS
): BrainDecisionResult {
  const reasons: string[] = [];

  const breakdown: BrainDecisionBreakdown = {
    impact: scoreImpact(context, reasons),
    urgency: scoreUrgency(context, reasons),
    confidence: scoreConfidence(context, reasons),
    ease: scoreEase(context, reasons),
  };

  const score = roundScore(
    breakdown.impact * weights.impact +
      breakdown.urgency * weights.urgency +
      breakdown.confidence * weights.confidence +
      breakdown.ease * weights.ease
  );

  const tier = resolveTier(score);

  const shouldSurface =
    tier === "critical" ||
    tier === "high" ||
    context.failureType !== null ||
    context.priorityHint === "critical";

  const shouldAutoExecute =
    context.isAutoExecutable &&
    !context.isManualOnly &&
    context.failureType !== "blocked_dependency" &&
    score >= 0.78;

  return {
    itemId: context.itemId,
    score,
    tier,
    breakdown,
    reasons,
    shouldSurface,
    shouldAutoExecute,
    context,
  };
}

export function decideBrainItems(
  contexts: BrainContext[],
  weights: BrainDecisionWeights = DEFAULT_WEIGHTS
): BrainDecisionResult[] {
  return contexts
    .map((context) => decideBrainItem(context, weights))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aDue = a.context.dueAt
        ? new Date(a.context.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      const bDue = b.context.dueAt
        ? new Date(b.context.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      if (aDue !== bDue) return aDue - bDue;

      return a.context.label.localeCompare(b.context.label);
    });
}