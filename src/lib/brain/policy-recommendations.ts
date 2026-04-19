import type { ExecutionSummary } from "./execution-summary";

export type PolicyRecommendationType =
  | "expand_hours"
  | "allow_department"
  | "allow_action"
  | "allow_task_type"
  | "allow_weekends"
  | "stabilize_domain"
  | "reduce_action_risk"
  | "tighten_blocked_action_review";

export type PolicyRecommendation = {
  id: string;
  type: PolicyRecommendationType;
  reason: string;
  message: string;
  confidence: number;
  count: number;
  payload: Record<string, unknown>;
};

type PolicyFeedbackItem = {
  reason: string;
  count: number;
};

type GeneratePolicyRecommendationOptions = {
  executionSummary?: ExecutionSummary | null;
};

function buildRecommendationId(
  type: PolicyRecommendationType,
  reason: string
): string {
  return `${type}:${reason}`;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function confidenceFromCount(count: number, bonus = 0) {
  return clampConfidence(count / 10 + bonus);
}

function titleCasePolicyReason(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function topFailureActionType(summary?: ExecutionSummary | null) {
  return summary?.repeatedFailureActionTypes?.[0] ?? null;
}

function topBlockedReason(summary?: ExecutionSummary | null) {
  return summary?.repeatedBlockedReasons?.[0] ?? null;
}

function topUnstableDomain(summary?: ExecutionSummary | null) {
  return summary?.unstableDomains?.[0] ?? null;
}

function createExecutionSummaryRecommendations(
  summary?: ExecutionSummary | null
): PolicyRecommendation[] {
  if (!summary) return [];

  const recommendations: PolicyRecommendation[] = [];

  const unstableDomain = topUnstableDomain(summary);
  const failureAction = topFailureActionType(summary);
  const blockedReason = topBlockedReason(summary);

  if (unstableDomain && unstableDomain.count >= 2) {
    recommendations.push({
      id: buildRecommendationId("stabilize_domain", unstableDomain.key),
      type: "stabilize_domain",
      reason: unstableDomain.key,
      message: `${unstableDomain.key.toUpperCase()} is accumulating repeated execution instability. Keep automation conservative there until failure pressure drops.`,
      confidence: confidenceFromCount(
        unstableDomain.count,
        summary.failureRate >= 30 ? 0.15 : 0.05
      ),
      count: unstableDomain.count,
      payload: {
        suggestedChange: "stabilize_domain",
        domain: unstableDomain.key,
        failureRate: summary.failureRate,
        blockedRate: summary.blockedRate,
      },
    });
  }

  if (failureAction && failureAction.count >= 2) {
    recommendations.push({
      id: buildRecommendationId("reduce_action_risk", failureAction.key),
      type: "reduce_action_risk",
      reason: failureAction.key,
      message: `${failureAction.key} is failing repeatedly. Tighten approval expectations or reduce auto-execution exposure for this action type.`,
      confidence: confidenceFromCount(
        failureAction.count,
        summary.failureRate >= 25 ? 0.15 : 0.05
      ),
      count: failureAction.count,
      payload: {
        suggestedChange: "reduce_action_risk",
        actionType: failureAction.key,
        failureRate: summary.failureRate,
      },
    });
  }

  if (blockedReason && blockedReason.count >= 3 && summary.blockedRate >= 30) {
    recommendations.push({
      id: buildRecommendationId(
        "tighten_blocked_action_review",
        blockedReason.key
      ),
      type: "tighten_blocked_action_review",
      reason: blockedReason.key,
      message: `${titleCasePolicyReason(
        blockedReason.key
      )} is creating repeated policy friction. Review whether this rule should stay strict or whether a safer exception path should exist.`,
      confidence: confidenceFromCount(blockedReason.count, 0.15),
      count: blockedReason.count,
      payload: {
        suggestedChange: "tighten_blocked_action_review",
        blockedReason: blockedReason.key,
        blockedRate: summary.blockedRate,
      },
    });
  }

  return recommendations;
}

export function generatePolicyRecommendations(
  feedback: PolicyFeedbackItem[],
  options?: GeneratePolicyRecommendationOptions
): PolicyRecommendation[] {
  const executionSummary = options?.executionSummary ?? null;
  const recommendations: PolicyRecommendation[] = [];

  for (const item of feedback) {
    if (item.count < 3) continue;

    switch (item.reason) {
      case "outside_allowed_hours":
        recommendations.push({
          id: buildRecommendationId("expand_hours", item.reason),
          type: "expand_hours",
          reason: item.reason,
          message:
            executionSummary?.blockedRate && executionSummary.blockedRate >= 30
              ? "Allowed-hours policy is repeatedly blocking execution while policy friction is elevated. Review whether the execution window should be expanded."
              : "Multiple tasks are blocked by allowed hours. Consider expanding the execution window.",
          confidence: confidenceFromCount(
            item.count,
            executionSummary?.blockedRate && executionSummary.blockedRate >= 30
              ? 0.1
              : 0
          ),
          count: item.count,
          payload: {
            suggestedChange: "expand_hours",
            blockedRate: executionSummary?.blockedRate ?? null,
          },
        });
        break;

      case "department_not_allowed": {
        const unstableDomain = topUnstableDomain(executionSummary);

        recommendations.push({
          id: buildRecommendationId("allow_department", item.reason),
          type: "allow_department",
          reason: item.reason,
          message:
            unstableDomain && unstableDomain.key !== "system"
              ? `A restricted department is repeatedly blocked, and ${unstableDomain.key.toUpperCase()} is also surfacing instability. Review whether that department needs a safer exception path rather than full auto access.`
              : "A restricted department is repeatedly blocked. Review whether it should be allowed in Auto Mode.",
          confidence: confidenceFromCount(
            item.count,
            unstableDomain ? 0.1 : 0
          ),
          count: item.count,
          payload: {
            suggestedChange: "allow_department",
            unstableDomain: unstableDomain?.key ?? null,
          },
        });
        break;
      }

      case "action_type_blocked": {
        const failureAction = topFailureActionType(executionSummary);

        recommendations.push({
          id: buildRecommendationId("allow_action", item.reason),
          type: "allow_action",
          reason: item.reason,
          message:
            failureAction
              ? `A blocked action type is creating repeated friction, while ${failureAction.key} is also failing repeatedly. Review whether this action should be selectively enabled with stronger approval guardrails.`
              : "A blocked action type is creating repeated friction. Review whether it should be enabled.",
          confidence: confidenceFromCount(
            item.count,
            failureAction ? 0.1 : 0
          ),
          count: item.count,
          payload: {
            suggestedChange: "allow_action",
            failureActionType: failureAction?.key ?? null,
          },
        });
        break;
      }

      case "task_type_blocked":
        recommendations.push({
          id: buildRecommendationId("allow_task_type", item.reason),
          type: "allow_task_type",
          reason: item.reason,
          message:
            executionSummary?.successRate && executionSummary.successRate >= 70
              ? "A blocked task type is repeatedly stopping execution, even though overall execution is otherwise healthy. Review whether this task type should be allowed with governance."
              : "A blocked task type is repeatedly stopping execution. Review whether it should be allowed.",
          confidence: confidenceFromCount(
            item.count,
            executionSummary?.successRate && executionSummary.successRate >= 70
              ? 0.1
              : 0
          ),
          count: item.count,
          payload: {
            suggestedChange: "allow_task_type",
            successRate: executionSummary?.successRate ?? null,
          },
        });
        break;

      case "weekend_blocked":
        recommendations.push({
          id: buildRecommendationId("allow_weekends", item.reason),
          type: "allow_weekends",
          reason: item.reason,
          message:
            executionSummary?.failureRate && executionSummary.failureRate <= 20
              ? "Weekend policy is repeatedly blocking execution while recent failure pressure remains relatively low. Review whether safe weekend automation should be allowed."
              : "Weekend policy is repeatedly blocking execution. Review whether safe weekend automation should be allowed.",
          confidence: confidenceFromCount(
            item.count,
            executionSummary?.failureRate !== undefined &&
              executionSummary.failureRate <= 20
              ? 0.1
              : 0
          ),
          count: item.count,
          payload: {
            suggestedChange: "allow_weekends",
            failureRate: executionSummary?.failureRate ?? null,
          },
        });
        break;

      default:
        break;
    }
  }

  recommendations.push(...createExecutionSummaryRecommendations(executionSummary));

  const deduped = new Map<string, PolicyRecommendation>();

  for (const recommendation of recommendations) {
    const existing = deduped.get(recommendation.id);

    if (!existing || recommendation.confidence > existing.confidence) {
      deduped.set(recommendation.id, recommendation);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.message.localeCompare(b.message);
  });
}