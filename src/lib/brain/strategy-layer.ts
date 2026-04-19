import type { BrainStrategyMode } from "./autonomy-config";

export type StrategyWeights = {
  urgencyMultiplier: number;
  staleContactMultiplier: number;
  overdueTaskMultiplier: number;
  financeMultiplier: number;
  outreachMultiplier: number;
  cleanupMultiplier: number;
};

export type StrategyDecision = {
  strategy: BrainStrategyMode;
  reason: string;
  weights: StrategyWeights;
};

const STRATEGY_MAP: Record<BrainStrategyMode, StrategyWeights> = {
  balanced: {
    urgencyMultiplier: 1,
    staleContactMultiplier: 1,
    overdueTaskMultiplier: 1,
    financeMultiplier: 1,
    outreachMultiplier: 1,
    cleanupMultiplier: 1,
  },
  cleanup: {
    urgencyMultiplier: 1.1,
    staleContactMultiplier: 1.25,
    overdueTaskMultiplier: 1.4,
    financeMultiplier: 0.9,
    outreachMultiplier: 0.95,
    cleanupMultiplier: 1.5,
  },
  fundraising_push: {
    urgencyMultiplier: 1.05,
    staleContactMultiplier: 0.9,
    overdueTaskMultiplier: 0.95,
    financeMultiplier: 1.5,
    outreachMultiplier: 1.05,
    cleanupMultiplier: 0.85,
  },
  outreach_push: {
    urgencyMultiplier: 1.1,
    staleContactMultiplier: 1.3,
    overdueTaskMultiplier: 1,
    financeMultiplier: 0.9,
    outreachMultiplier: 1.45,
    cleanupMultiplier: 0.9,
  },
  stability: {
    urgencyMultiplier: 0.95,
    staleContactMultiplier: 0.95,
    overdueTaskMultiplier: 1.1,
    financeMultiplier: 1,
    outreachMultiplier: 0.95,
    cleanupMultiplier: 1.2,
  },
};

export function getStrategyWeights(
  strategy: BrainStrategyMode
): StrategyWeights {
  return STRATEGY_MAP[strategy] ?? STRATEGY_MAP.balanced;
}

export function decideStrategy(input: {
  overdueTasks: number;
  staleContacts: number;
  financePressure: number;
  outreachPressure: number;
}): StrategyDecision {
  const { overdueTasks, staleContacts, financePressure, outreachPressure } =
    input;

  if (financePressure >= 8) {
    return {
      strategy: "fundraising_push",
      reason: "Finance pressure is highest right now.",
      weights: getStrategyWeights("fundraising_push"),
    };
  }

  if (outreachPressure >= 8 || staleContacts >= 10) {
    return {
      strategy: "outreach_push",
      reason: "Outreach pressure and stale contacts are creating follow-up risk.",
      weights: getStrategyWeights("outreach_push"),
    };
  }

  if (overdueTasks >= 8) {
    return {
      strategy: "cleanup",
      reason: "Overdue task pressure is high and needs cleanup mode.",
      weights: getStrategyWeights("cleanup"),
    };
  }

  if (overdueTasks >= 5 || staleContacts >= 6) {
    return {
      strategy: "stability",
      reason: "System pressure suggests a stability-first operating mode.",
      weights: getStrategyWeights("stability"),
    };
  }

  return {
    strategy: "balanced",
    reason: "No single domain dominates, so balanced mode is appropriate.",
    weights: getStrategyWeights("balanced"),
  };
}