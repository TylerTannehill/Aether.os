import type { AutoModePolicyReasonCode } from "./auto-mode-policy";

export type PolicyFeedback = {
  reason: Exclude<AutoModePolicyReasonCode, "allowed"> | "unknown";
  count: number;
};

function normalizeReason(
  reason: string | null | undefined
): PolicyFeedback["reason"] {
  const value = String(reason ?? "").trim().toLowerCase();

  if (!value) return "unknown";

  if (
    value === "outside_allowed_hours" ||
    value.includes("outside allowed auto mode hours") ||
    value.includes("outside allowed hours")
  ) {
    return "outside_allowed_hours";
  }

  if (
    value === "department_not_allowed" ||
    value.includes("not allowed for auto mode") ||
    value.includes("department is not allowed")
  ) {
    return "department_not_allowed";
  }

  if (
    value === "manual_only_department" ||
    value.includes("manual-only")
  ) {
    return "manual_only_department";
  }

  if (
    value === "action_type_blocked" ||
    value.includes("action type") && value.includes("blocked")
  ) {
    return "action_type_blocked";
  }

  if (
    value === "task_type_blocked" ||
    value.includes("task type") && value.includes("blocked")
  ) {
    return "task_type_blocked";
  }

  if (
    value === "weekend_blocked" ||
    value.includes("disabled on weekends") ||
    value.includes("weekend")
  ) {
    return "weekend_blocked";
  }

  return "unknown";
}

export function analyzePolicyBlocks(
  blocks: Array<{ reason?: string; reasonCode?: string }>
): PolicyFeedback[] {
  const counts = new Map<PolicyFeedback["reason"], number>();

  for (const block of blocks) {
    const reason = normalizeReason(block?.reasonCode ?? block?.reason);
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function generatePolicySuggestions(
  feedback: PolicyFeedback[]
): string[] {
  const suggestions = new Set<string>();

  for (const item of feedback) {
    switch (item.reason) {
      case "outside_allowed_hours":
        suggestions.add(
          "Consider expanding allowed hours or moving eligible tasks into the current execution window."
        );
        break;
      case "department_not_allowed":
        suggestions.add(
          "Review allowed departments in policy settings and confirm whether this department should be auto-runnable."
        );
        break;
      case "manual_only_department":
        suggestions.add(
          "A manual-only department is creating automation friction. Keep it manual or remove the restriction if appropriate."
        );
        break;
      case "action_type_blocked":
        suggestions.add(
          "Blocked action types are preventing execution. Review whether these actions should remain restricted."
        );
        break;
      case "task_type_blocked":
        suggestions.add(
          "Task type restrictions are stopping execution. Review whether these task categories should be allowed."
        );
        break;
      case "weekend_blocked":
        suggestions.add(
          "Weekend policy is blocking execution. Allow weekends only if you want Auto Mode active outside weekdays."
        );
        break;
      case "unknown":
      default:
        suggestions.add(
          "Some policy blocks do not have a clear reason yet. Review audit metadata for consistency."
        );
        break;
    }
  }

  return Array.from(suggestions);
}