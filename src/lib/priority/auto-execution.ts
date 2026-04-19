import { ActionItem } from "@/lib/priority/action-engine";

export type AutoExecutionRiskLevel = "low" | "medium" | "high";

export type AutoExecutionDisposition =
  | "auto_execute"
  | "manual_review"
  | "blocked";

export type ExecutionMode = "manual" | "hybrid" | "auto";

export interface ExecutionSettings {
  mode: ExecutionMode;
  confidenceThreshold: number;
  requireApproval: boolean;
  maximumRiskLevel: AutoExecutionRiskLevel;
  allowActionTypes: ActionItem["type"][];
}

export interface AutoExecutionRuleResult {
  actionId: string;
  actionType: ActionItem["type"];
  disposition: AutoExecutionDisposition;
  confidence: number;
  riskLevel: AutoExecutionRiskLevel;
  reason: string;
  recommendedMode: "automatic" | "manual";
  action: ActionItem;
}

export interface AutoExecutionSummary {
  total: number;
  autoExecutable: number;
  manualReview: number;
  blocked: number;
  highConfidence: number;
}

export interface AutoExecutionResult {
  decisions: AutoExecutionRuleResult[];
  autoExecutable: AutoExecutionRuleResult[];
  manualReview: AutoExecutionRuleResult[];
  blocked: AutoExecutionRuleResult[];
  summary: AutoExecutionSummary;
  settings: ExecutionSettings;
}

export interface AutoExecutionOptions {
  allowActionTypes?: ActionItem["type"][];
  minimumConfidence?: number;
  maximumRiskLevel?: AutoExecutionRiskLevel;
  mode?: ExecutionMode;
  requireApproval?: boolean;
}

const DEFAULT_AUTO_ALLOWED_TYPES: ActionItem["type"][] = [
  "complete_task",
  "follow_up_contact",
  "unblock_work",
  "monitor",
];

const DEFAULT_EXECUTION_SETTINGS: ExecutionSettings = {
  mode: "hybrid",
  confidenceThreshold: 70,
  requireApproval: true,
  maximumRiskLevel: "low",
  allowActionTypes: DEFAULT_AUTO_ALLOWED_TYPES,
};

let executionSettings: ExecutionSettings = {
  ...DEFAULT_EXECUTION_SETTINGS,
  allowActionTypes: [...DEFAULT_EXECUTION_SETTINGS.allowActionTypes],
};

const RISK_ORDER: Record<AutoExecutionRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function hasBadge(action: ActionItem, match: string): boolean {
  return (action.badges ?? []).some((badge) =>
    String(badge).toLowerCase().includes(match.toLowerCase())
  );
}

function cloneSettings(settings: ExecutionSettings): ExecutionSettings {
  return {
    ...settings,
    allowActionTypes: [...settings.allowActionTypes],
  };
}

function exceedsRisk(
  risk: AutoExecutionRiskLevel,
  max: AutoExecutionRiskLevel
): boolean {
  return RISK_ORDER[risk] > RISK_ORDER[max];
}

export function getDefaultExecutionSettings(): ExecutionSettings {
  return cloneSettings(DEFAULT_EXECUTION_SETTINGS);
}

export function resolveExecutionSettings(
  options?: AutoExecutionOptions | Partial<ExecutionSettings>
): ExecutionSettings {
  const autoOptions = options as AutoExecutionOptions | undefined;
  const partialSettings = options as Partial<ExecutionSettings> | undefined;

  const confidenceThreshold =
    typeof autoOptions?.minimumConfidence === "number"
      ? autoOptions.minimumConfidence
      : typeof partialSettings?.confidenceThreshold === "number"
        ? partialSettings.confidenceThreshold!
        : executionSettings.confidenceThreshold;

  return {
    mode: options?.mode ?? executionSettings.mode,
    confidenceThreshold,
    requireApproval:
      options?.requireApproval ?? executionSettings.requireApproval,
    maximumRiskLevel:
      options?.maximumRiskLevel ?? executionSettings.maximumRiskLevel,
    allowActionTypes: [
      ...(options?.allowActionTypes ?? executionSettings.allowActionTypes),
    ],
  };
}

export function getExecutionSettings(): ExecutionSettings {
  return cloneSettings(executionSettings);
}

export function updateExecutionSettings(
  updates: Partial<ExecutionSettings>
): ExecutionSettings {
  executionSettings = {
    ...executionSettings,
    ...updates,
    allowActionTypes: [
      ...(updates.allowActionTypes ?? executionSettings.allowActionTypes),
    ],
  };

  return getExecutionSettings();
}

export function resetExecutionSettings(): ExecutionSettings {
  executionSettings = getDefaultExecutionSettings();
  return getExecutionSettings();
}

export function inferAutoExecutionRiskLevel(
  action: Pick<ActionItem, "level" | "type">
): AutoExecutionRiskLevel {
  switch (action.type) {
    case "reduce_owner_pressure":
    case "rebalance_queue":
    case "assign_owner":
    case "reassign_task":
      return action.level === "critical" ? "high" : "medium";
    default:
      if (action.level === "critical") return "high";
      if (action.level === "high") return "medium";
      return "low";
  }
}

export function inferAutoExecutionConfidence(
  action: Pick<ActionItem, "type" | "targets" | "badges" | "score">
): number {
  let confidence = 60;

  if (action.type === "complete_task") confidence += 20;
  if (action.type === "follow_up_contact") confidence += 15;
  if (action.type === "unblock_work") confidence += 10;

  if (hasBadge(action as ActionItem, "fallback")) confidence -= 10;
  if ((action.targets ?? []).length > 2) confidence -= 10;

  if ((action.score ?? 0) >= 85) confidence += 5;
  if ((action.score ?? 0) < 40) confidence -= 5;

  return clamp(confidence);
}

export function getAutoExecutionDisposition(args: {
  actionType: ActionItem["type"];
  confidence: number;
  riskLevel: AutoExecutionRiskLevel;
  settings?: AutoExecutionOptions | Partial<ExecutionSettings>;
}): {
  disposition: AutoExecutionDisposition;
  recommendedMode: "automatic" | "manual";
  reason: string;
  settings: ExecutionSettings;
} {
  const settings = resolveExecutionSettings(args.settings);

  if (!settings.allowActionTypes.includes(args.actionType)) {
    return {
      disposition: "blocked",
      recommendedMode: "manual",
      reason: "Type not allowed",
      settings,
    };
  }

  if (settings.mode === "manual") {
    return {
      disposition: "manual_review",
      recommendedMode: "manual",
      reason: "Execution mode is manual",
      settings,
    };
  }

  if (exceedsRisk(args.riskLevel, settings.maximumRiskLevel)) {
    return {
      disposition: "manual_review",
      recommendedMode: "manual",
      reason: "Risk too high",
      settings,
    };
  }

  if (args.confidence < settings.confidenceThreshold) {
    return {
      disposition: "manual_review",
      recommendedMode: "manual",
      reason: "Low confidence",
      settings,
    };
  }

  if (settings.mode === "hybrid" && settings.requireApproval) {
    return {
      disposition: "manual_review",
      recommendedMode: "manual",
      reason: "Approval required in hybrid mode",
      settings,
    };
  }

  return {
    disposition: "auto_execute",
    recommendedMode: "automatic",
    reason: "Safe to execute",
    settings,
  };
}

export function evaluateAutoExecutionAction(
  action: ActionItem,
  options?: AutoExecutionOptions
): AutoExecutionRuleResult {
  const confidence = inferAutoExecutionConfidence(action);
  const riskLevel = inferAutoExecutionRiskLevel(action);
  const decision = getAutoExecutionDisposition({
    actionType: action.type,
    confidence,
    riskLevel,
    settings: options,
  });

  return {
    actionId: action.id,
    actionType: action.type,
    disposition: decision.disposition,
    confidence,
    riskLevel,
    reason: decision.reason,
    recommendedMode: decision.recommendedMode,
    action,
  };
}

export function shouldAutoExecute(
  confidence: number,
  riskLevel: AutoExecutionRiskLevel,
  actionType: ActionItem["type"],
  settings?: Partial<ExecutionSettings>
): boolean {
  return (
    getAutoExecutionDisposition({
      actionType,
      confidence,
      riskLevel,
      settings,
    }).disposition === "auto_execute"
  );
}

export function buildAutoExecutionPlan(
  actions: ActionItem[],
  options?: AutoExecutionOptions
): AutoExecutionResult {
  const settings = resolveExecutionSettings(options);
  const decisions = actions.map((action) =>
    evaluateAutoExecutionAction(action, options)
  );

  return {
    decisions,
    autoExecutable: decisions.filter(
      (decision) => decision.disposition === "auto_execute"
    ),
    manualReview: decisions.filter(
      (decision) => decision.disposition === "manual_review"
    ),
    blocked: decisions.filter(
      (decision) => decision.disposition === "blocked"
    ),
    summary: {
      total: decisions.length,
      autoExecutable: decisions.filter(
        (decision) => decision.disposition === "auto_execute"
      ).length,
      manualReview: decisions.filter(
        (decision) => decision.disposition === "manual_review"
      ).length,
      blocked: decisions.filter(
        (decision) => decision.disposition === "blocked"
      ).length,
      highConfidence: decisions.filter(
        (decision) => decision.confidence >= 85
      ).length,
    },
    settings,
  };
}

export function getTopAutoExecutableActions(
  result: AutoExecutionResult
): AutoExecutionRuleResult[] {
  return result.autoExecutable.slice(0, 5);
}

export function getTopManualReviewActions(
  result: AutoExecutionResult
): AutoExecutionRuleResult[] {
  return result.manualReview.slice(0, 5);
}

export function getBlockedAutoExecutionActions(
  result: AutoExecutionResult
): AutoExecutionRuleResult[] {
  return result.blocked.slice(0, 5);
}

export function shouldEnableAutoExecutionBanner(
  result: AutoExecutionResult
): boolean {
  return result.summary.autoExecutable > 0;
}

export function getAutoExecutionHeadline(result: AutoExecutionResult): string {
  if (result.summary.autoExecutable > 0) {
    return `Aether can auto-run ${result.summary.autoExecutable} actions`;
  }

  if (result.settings.mode === "manual") {
    return "Auto execution is in manual mode";
  }

  if (result.settings.mode === "hybrid" && result.settings.requireApproval) {
    return "Aether found actions waiting for approval";
  }

  return "No safe auto actions";
}

export function getAutoExecutionSubheadline(
  result: AutoExecutionResult
): string {
  if (result.summary.autoExecutable > 0) {
    return "Only safe actions above the confidence threshold are executed automatically.";
  }

  if (result.settings.mode === "manual") {
    return "All actions require manual review.";
  }

  if (result.settings.mode === "hybrid" && result.settings.requireApproval) {
    return "Hybrid mode is active and approval is required before execution.";
  }

  return "Manual review required.";
}