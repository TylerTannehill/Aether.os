// src/lib/abe/abe-patterns.ts

import {
  AbeGlobalMemory,
  AbePatternInsight,
  AbeDepartment,
  departmentLabel,
} from "./abe-memory";

type BuildPatternsInput = {
  role: "admin" | "director" | "general_user";
  demoDepartment: AbeDepartment;
  briefing: {
    primaryLane: AbeDepartment;
    weakest: AbeDepartment;
    opportunityLane: AbeDepartment;
    health: string;
    campaignStatus: string;
    crossDomainSignal?: string;
  };
  memory: AbeGlobalMemory;
};

export function buildAbePatternInsights(
  input: BuildPatternsInput
): AbePatternInsight[] {
  const insights: AbePatternInsight[] = [];

  const repeatedPrimaryCount = input.memory.recentPrimaryLanes.filter(
    (lane) => lane === input.briefing.primaryLane
  ).length;

  const repeatedPressureCount = input.memory.recentPressureLanes.filter(
    (lane) => lane === input.briefing.weakest
  ).length;

  const repeatedOpportunityCount =
    input.memory.recentOpportunityLanes.filter(
      (lane) => lane === input.briefing.opportunityLane
    ).length;

  // 🔴 pressure repeating
  if (repeatedPressureCount >= 3) {
    insights.push({
      label: "Pressure is not clearing",
      detail: `${departmentLabel(
        input.briefing.weakest
      )} has remained the weakest lane across multiple reads.`,
      severity: "critical",
      lane: input.briefing.weakest,
    });
  }

  // 🟠 primary lane repeating
  if (repeatedPrimaryCount >= 3) {
    insights.push({
      label: "Repeating primary lane",
      detail: `${departmentLabel(
        input.briefing.primaryLane
      )} has led Abe's read across multiple cycles.`,
      severity: "important",
      lane: input.briefing.primaryLane,
    });
  }

  // 🟡 opportunity repeating
  if (repeatedOpportunityCount >= 3) {
    insights.push({
      label: "Opportunity repeating",
      detail: `${departmentLabel(
        input.briefing.opportunityLane
      )} keeps surfacing as the strongest opportunity lane.`,
      severity: "important",
      lane: input.briefing.opportunityLane,
    });
  }

  // 🔄 health shift
  if (
    input.memory.previousHealth &&
    input.memory.previousHealth !== input.briefing.health
  ) {
    insights.push({
      label: "Health shifted",
      detail: `Campaign moved from "${input.memory.previousHealth}" to "${input.briefing.health}".`,
      severity: "watch",
    });
  }

  // 🔄 status shift
  if (
    input.memory.previousCampaignStatus &&
    input.memory.previousCampaignStatus !==
      input.briefing.campaignStatus
  ) {
    insights.push({
      label: "Status changed",
      detail: `Campaign status changed from "${input.memory.previousCampaignStatus}" to "${input.briefing.campaignStatus}".`,
      severity: "watch",
    });
  }

  // 🔁 cross-domain repeating
  const repeatedCrossDomainCount = input.briefing.crossDomainSignal
    ? input.memory.recentCrossDomainSignals.filter(
        (s) => s === input.briefing.crossDomainSignal
      ).length
    : 0;

  if (input.briefing.crossDomainSignal && repeatedCrossDomainCount >= 2) {
    insights.push({
      label: "Dependency repeating",
      detail:
        "The same cross-domain dependency keeps appearing and likely isn’t resolved.",
      severity: "important",
    });
  }

  return insights.slice(0, 4);
}