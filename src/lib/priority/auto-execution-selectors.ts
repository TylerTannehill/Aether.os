import { ActionItem, getActionPriorityScore } from "@/lib/priority/action-engine";
import {
  AutoExecutionAdapterResult,
  buildAutoExecutionAdapterResult,
} from "@/lib/priority/auto-execution-adapter";
import {
  AutoExecutionResult,
  AutoExecutionRuleResult,
} from "@/lib/priority/auto-execution";
import { CommandCenterAdapterInput } from "@/lib/priority/command-center-adapter";

export interface AutoExecutionSelectorCard {
  actionId: string;
  title: string;
  summary: string;
  reason: string;
  recommendedAction: string;
  type: ActionItem["type"];
  bucket: ActionItem["bucket"];
  level: ActionItem["level"];
  score: number;
  priorityScore: number;
  confidence: number;
  riskLevel: AutoExecutionRuleResult["riskLevel"];
  disposition: AutoExecutionRuleResult["disposition"];
  recommendedMode: AutoExecutionRuleResult["recommendedMode"];
  badges: string[];
  sourceIds: string[];
  targets: ActionItem["targets"];
  createdAt: string;
}

export interface AutoExecutionSelectorSummary {
  total: number;
  autoExecutable: number;
  manualReview: number;
  blocked: number;
  highConfidence: number;
  topPriorityScore: number;
  autoExecutionRate: number;
}

export interface AutoExecutionSelectorResult {
  summary: AutoExecutionSelectorSummary;
  topAutoExecutable: AutoExecutionSelectorCard[];
  topManualReview: AutoExecutionSelectorCard[];
  topBlocked: AutoExecutionSelectorCard[];
  allCards: AutoExecutionSelectorCard[];
  immediateQueue: AutoExecutionSelectorCard[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function toCard(decision: AutoExecutionRuleResult): AutoExecutionSelectorCard {
  const action = decision.action;
  const priorityScore = getActionPriorityScore(action);

  return {
    actionId: decision.actionId,
    title: action.title,
    summary: action.summary,
    reason: decision.reason,
    recommendedAction: action.recommendedAction,
    type: action.type,
    bucket: action.bucket,
    level: action.level,
    score: action.score,
    priorityScore,
    confidence: decision.confidence,
    riskLevel: decision.riskLevel,
    disposition: decision.disposition,
    recommendedMode: decision.recommendedMode,
    badges: action.badges,
    sourceIds: action.sourceIds,
    targets: action.targets,
    createdAt: action.createdAt,
  };
}

function sortCards(cards: AutoExecutionSelectorCard[]): AutoExecutionSelectorCard[] {
  return [...cards].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  });
}

function buildSelectorSummary(
  result: AutoExecutionResult,
  cards: AutoExecutionSelectorCard[]
): AutoExecutionSelectorSummary {
  const total = result.summary.total;
  const autoExecutionRate =
    total > 0 ? clamp(Math.round((result.summary.autoExecutable / total) * 100)) : 0;

  return {
    total,
    autoExecutable: result.summary.autoExecutable,
    manualReview: result.summary.manualReview,
    blocked: result.summary.blocked,
    highConfidence: result.summary.highConfidence,
    topPriorityScore: cards[0]?.priorityScore ?? 0,
    autoExecutionRate,
  };
}

export function buildAutoExecutionSelectorResult(
  autoExecution: AutoExecutionResult
): AutoExecutionSelectorResult {
  const allCards = sortCards(autoExecution.decisions.map(toCard));

  const topAutoExecutable = allCards
    .filter((card) => card.disposition === "auto_execute")
    .slice(0, 8);

  const topManualReview = allCards
    .filter((card) => card.disposition === "manual_review")
    .slice(0, 8);

  const topBlocked = allCards
    .filter((card) => card.disposition === "blocked")
    .slice(0, 8);

  const immediateQueue = allCards
    .filter(
      (card) =>
        card.bucket === "fix_now" ||
        card.bucket === "owner" ||
        card.level === "critical" ||
        card.level === "high"
    )
    .slice(0, 8);

  return {
    summary: buildSelectorSummary(autoExecution, allCards),
    topAutoExecutable,
    topManualReview,
    topBlocked,
    allCards,
    immediateQueue,
  };
}

export function buildAutoExecutionSelectorResultFromAdapter(
  result: AutoExecutionAdapterResult
): AutoExecutionSelectorResult {
  return buildAutoExecutionSelectorResult(result.autoExecution);
}

export function buildAutoExecutionSelectorResultFromData(
  input: CommandCenterAdapterInput
): AutoExecutionSelectorResult {
  const result = buildAutoExecutionAdapterResult(input);
  return buildAutoExecutionSelectorResult(result.autoExecution);
}

export function getAutoExecutionQueueHeadline(
  result: AutoExecutionSelectorResult
): string {
  if (result.summary.autoExecutable > 0) {
    return `Aether can auto-run ${result.summary.autoExecutable} actions`;
  }

  if (result.summary.manualReview > 0) {
    return `${result.summary.manualReview} actions need manual review`;
  }

  if (result.summary.blocked > 0) {
    return `${result.summary.blocked} actions are blocked`;
  }

  return "No executable actions available";
}

export function getAutoExecutionQueueSubheadline(
  result: AutoExecutionSelectorResult
): string {
  if (result.immediateQueue.length > 0) {
    return `Top queue priority score: ${result.summary.topPriorityScore}`;
  }

  return "The queue is currently clear.";
}

export function getTopAutoExecutionCards(
  result: AutoExecutionSelectorResult,
  limit = 6
): AutoExecutionSelectorCard[] {
  return result.topAutoExecutable.slice(0, limit);
}

export function getTopManualReviewCards(
  result: AutoExecutionSelectorResult,
  limit = 6
): AutoExecutionSelectorCard[] {
  return result.topManualReview.slice(0, limit);
}

export function getTopBlockedCards(
  result: AutoExecutionSelectorResult,
  limit = 6
): AutoExecutionSelectorCard[] {
  return result.topBlocked.slice(0, limit);
}

export function getImmediateExecutionCards(
  result: AutoExecutionSelectorResult,
  limit = 6
): AutoExecutionSelectorCard[] {
  return result.immediateQueue.slice(0, limit);
}