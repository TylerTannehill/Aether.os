import type { BrainStrategyMode } from "./autonomy-config";
import type { ExecutionSummary } from "./execution-summary";

export type ExecutionFeedbackInput = {
  executedCount: number;
  failedCount: number;
  blockedCount: number;
  strategy: BrainStrategyMode;
};

export type ExecutionFeedbackResult = {
  executionHealthScore: number;
  recommendation: string;
  shouldReduceAutonomy: boolean;
  shouldShiftStrategy: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function evaluateExecutionFeedback(
  input: ExecutionFeedbackInput
): ExecutionFeedbackResult {
  const total =
    input.executedCount + input.failedCount + input.blockedCount;

  if (total <= 0) {
    return {
      executionHealthScore: 100,
      recommendation: "No execution feedback yet.",
      shouldReduceAutonomy: false,
      shouldShiftStrategy: false,
    };
  }

  const failurePenalty = input.failedCount * 18;
  const blockedPenalty = input.blockedCount * 10;
  const executionBonus = input.executedCount * 6;

  const rawScore = 70 + executionBonus - failurePenalty - blockedPenalty;
  const executionHealthScore = clamp(rawScore, 0, 100);

  if (input.failedCount >= 3) {
    return {
      executionHealthScore,
      recommendation:
        "Execution failures are stacking up. Reduce autonomy pressure and review recent actions.",
      shouldReduceAutonomy: true,
      shouldShiftStrategy: true,
    };
  }

  if (input.blockedCount >= 4) {
    return {
      executionHealthScore,
      recommendation:
        "Policy friction is high. Review governance settings or shift into a safer operating mode.",
      shouldReduceAutonomy: false,
      shouldShiftStrategy: true,
    };
  }

  if (input.strategy === "cleanup" && input.executedCount >= 5) {
    return {
      executionHealthScore,
      recommendation:
        "Cleanup mode is landing well. Stay in cleanup until pressure drops.",
      shouldReduceAutonomy: false,
      shouldShiftStrategy: false,
    };
  }

  return {
    executionHealthScore,
    recommendation:
      "Execution behavior looks stable. Maintain current autonomy and strategy settings.",
    shouldReduceAutonomy: false,
    shouldShiftStrategy: false,
  };
}

export function evaluateExecutionSummaryFeedback(args: {
  summary: ExecutionSummary;
  strategy: BrainStrategyMode;
}): ExecutionFeedbackResult {
  const { summary, strategy } = args;

  const repeatedFailures = summary.repeatedFailureActionTypes.length;
  const repeatedBlocks = summary.repeatedBlockedReasons.length;
  const unstableDomains = summary.unstableDomains.length;

  const base = evaluateExecutionFeedback({
    executedCount: summary.successful,
    failedCount: summary.failed,
    blockedCount: summary.blocked,
    strategy,
  });

  let recommendation = base.recommendation;
  let shouldReduceAutonomy = base.shouldReduceAutonomy;
  let shouldShiftStrategy = base.shouldShiftStrategy;

  if (repeatedFailures >= 2) {
    recommendation =
      "Repeated failure hotspots are emerging. Reduce autonomy pressure and inspect unstable action types.";
    shouldReduceAutonomy = true;
  } else if (repeatedBlocks >= 2) {
    recommendation =
      "Policy friction is clustering around repeated block reasons. Review governance rules before expanding automation.";
    shouldShiftStrategy = true;
  } else if (unstableDomains >= 2) {
    recommendation =
      "Execution instability is concentrated in multiple domains. Shift strategy toward stabilization before increasing automation.";
    shouldShiftStrategy = true;
  } else if (
    summary.successRate >= 70 &&
    summary.failureRate <= 20 &&
    summary.blockedRate <= 25 &&
    summary.liveRuns >= 5
  ) {
    recommendation =
      "Execution outcomes look healthy across live runs. Current autonomy posture appears stable.";
  }

  const executionHealthScore = clamp(
    Math.round(
      base.executionHealthScore +
        (summary.successRate >= 70 ? 4 : 0) -
        (summary.failureRate >= 35 ? 8 : 0) -
        (summary.blockedRate >= 35 ? 6 : 0)
    ),
    0,
    100
  );

  return {
    executionHealthScore,
    recommendation,
    shouldReduceAutonomy,
    shouldShiftStrategy,
  };
}