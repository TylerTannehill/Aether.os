import type { AetherSystemSnapshot } from "@/lib/intelligence/aggregator";

export type AetherSuggestedStrategy =
  | "balanced"
  | "cleanup"
  | "fundraising_push"
  | "outreach_push"
  | "stability";

export type AetherStrategyHook = {
  strategy: AetherSuggestedStrategy;
  reason: string;
  confidence: number;
};

export function suggestStrategyFromIntelligence(
  snapshot: AetherSystemSnapshot
): AetherStrategyHook {
  const topDomain = snapshot.topDomains[0]?.domain;
  const topSignal = snapshot.topSignals[0];

  if (topDomain === "finance") {
    return {
      strategy: "fundraising_push",
      reason:
        "Finance is carrying the most pressure, so fundraising and pledge follow-up should take priority.",
      confidence: 0.84,
    };
  }

  if (topDomain === "outreach") {
    return {
      strategy: "outreach_push",
      reason:
        "Outreach pressure is highest, so contact attempts and follow-up should be prioritized.",
      confidence: 0.8,
    };
  }

  if (
    topSignal?.kind === "risk" &&
    snapshot.systemRiskLevel >= 7
  ) {
    return {
      strategy: "cleanup",
      reason:
        "System risk is elevated, so clearing friction and resolving risk should come before expansion work.",
      confidence: 0.77,
    };
  }

  if (snapshot.systemRiskLevel <= 3) {
    return {
      strategy: "balanced",
      reason:
        "System pressure is relatively contained, so a balanced strategy is appropriate.",
      confidence: 0.7,
    };
  }

  return {
    strategy: "stability",
    reason:
      "The system is showing moderate pressure and should hold a stable operating posture.",
    confidence: 0.66,
  };
}
export function shouldAutoShiftStrategy(
  currentStrategy: AetherSuggestedStrategy,
  nextSuggestion: AetherStrategyHook
) {
  return {
    shouldShift: currentStrategy !== nextSuggestion.strategy && nextSuggestion.confidence >= 0.75,
    nextStrategy: nextSuggestion.strategy,
    reason: nextSuggestion.reason,
    confidence: nextSuggestion.confidence,
  };
}