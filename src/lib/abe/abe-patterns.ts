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

function countMatches<T>(items: T[], value: T) {
  return items.filter((item) => item === value).length;
}

function buildPressureDetail(
  lane: AbeDepartment,
  count: number,
  role: BuildPatternsInput["role"]
) {
  const label = departmentLabel(lane);

  if (count >= 4) {
    if (role === "admin") {
      return `${label} has stayed under pressure across several recent reads, which makes it look more like a campaign pattern than a one-cycle dip.`;
    }

    return `${label} has kept resurfacing as a soft lane across several recent reads, which suggests the pressure there may be lingering rather than passing.`;
  }

  if (role === "admin") {
    return `${label} has appeared as the weaker lane more than once recently, so it may be worth treating it as a recurring drag instead of a one-off fluctuation.`;
  }

  return `${label} has shown up as a softer lane more than once recently, which may be a sign that the underlying pressure is sticking around.`;
}

function buildPrimaryLaneDetail(
  lane: AbeDepartment,
  count: number,
  role: BuildPatternsInput["role"]
) {
  const label = departmentLabel(lane);

  if (count >= 4) {
    if (role === "admin") {
      return `${label} has led Abe's read across several cycles now, which suggests the campaign keeps rotating back to the same center of gravity.`;
    }

    return `${label} has kept sitting at the center of Abe's read, which suggests your current lane is shaping more of the campaign picture than usual.`;
  }

  if (role === "admin") {
    return `${label} has led Abe's read more than once recently, which may mean the campaign is still orbiting the same core pressure-and-opportunity mix.`;
  }

  return `${label} has remained central in recent reads, which suggests this lane is still carrying more weight than it might seem at first glance.`;
}

function buildOpportunityDetail(
  lane: AbeDepartment,
  count: number,
  role: BuildPatternsInput["role"]
) {
  const label = departmentLabel(lane);

  if (count >= 4) {
    if (role === "admin") {
      return `${label} has kept surfacing as the strongest opportunity lane, which suggests there may be durable momentum there rather than a temporary spike.`;
    }

    return `${label} has kept surfacing as a strong opportunity lane, which may mean there is steadier momentum there than the campaign is fully using yet.`;
  }

  if (role === "admin") {
    return `${label} has shown up more than once as the cleanest opportunity lane, which may be a sign of repeatable strength rather than a lucky cycle.`;
  }

  return `${label} has shown up more than once as a stronger opportunity lane, which may be worth leaning into while the signal is still healthy.`;
}

function buildHealthShiftDetail(
  previousHealth: string,
  nextHealth: string,
  role: BuildPatternsInput["role"]
) {
  if (role === "admin") {
    return `Campaign health moved from "${previousHealth}" to "${nextHealth}", which changes the tone of the brief even if the underlying lanes still look familiar.`;
  }

  return `The campaign's health read shifted from "${previousHealth}" to "${nextHealth}", which slightly changes how the current lane should be interpreted.`;
}

function buildStatusShiftDetail(
  previousStatus: string,
  nextStatus: string,
  role: BuildPatternsInput["role"]
) {
  if (role === "admin") {
    return `Campaign status changed from "${previousStatus}" to "${nextStatus}", which suggests the broader operating picture has moved, not just the surface metrics.`;
  }

  return `Campaign status changed from "${previousStatus}" to "${nextStatus}", which may be worth reading as a broader shift rather than isolated movement.`;
}

function buildCrossDomainDetail(role: BuildPatternsInput["role"]) {
  if (role === "admin") {
    return "The same cross-domain dependency keeps appearing in the brief, which makes it look more structural than incidental.";
  }

  return "A similar cross-domain dependency keeps resurfacing, which suggests this may be more than a one-off coordination issue.";
}

export function buildAbePatternInsights(
  input: BuildPatternsInput
): AbePatternInsight[] {
  const insights: AbePatternInsight[] = [];

  const repeatedPrimaryCount = countMatches(
    input.memory.recentPrimaryLanes,
    input.briefing.primaryLane
  );

  const repeatedPressureCount = countMatches(
    input.memory.recentPressureLanes,
    input.briefing.weakest
  );

  const repeatedOpportunityCount = countMatches(
    input.memory.recentOpportunityLanes,
    input.briefing.opportunityLane
  );

  if (repeatedPressureCount >= 2) {
    insights.push({
      label:
        repeatedPressureCount >= 4
          ? "Pressure keeps hanging around"
          : "Pressure is resurfacing",
      detail: buildPressureDetail(
        input.briefing.weakest,
        repeatedPressureCount,
        input.role
      ),
      severity: repeatedPressureCount >= 4 ? "important" : "watch",
      lane: input.briefing.weakest,
      kind: "pressure_pattern",
    });
  }

  if (repeatedPrimaryCount >= 2) {
    insights.push({
      label:
        repeatedPrimaryCount >= 4
          ? "Same lane keeps shaping the read"
          : "Abe keeps returning to the same lane",
      detail: buildPrimaryLaneDetail(
        input.briefing.primaryLane,
        repeatedPrimaryCount,
        input.role
      ),
      severity: repeatedPrimaryCount >= 4 ? "important" : "watch",
      lane: input.briefing.primaryLane,
      kind: "lane_pattern",
    });
  }

  if (repeatedOpportunityCount >= 2) {
    insights.push({
      label:
        repeatedOpportunityCount >= 4
          ? "Opportunity looks steadier now"
          : "Opportunity keeps surfacing here",
      detail: buildOpportunityDetail(
        input.briefing.opportunityLane,
        repeatedOpportunityCount,
        input.role
      ),
      severity: repeatedOpportunityCount >= 4 ? "important" : "watch",
      lane: input.briefing.opportunityLane,
      kind: "opportunity_pattern",
    });
  }

  if (
    input.memory.previousHealth &&
    input.memory.previousHealth !== input.briefing.health
  ) {
    insights.push({
      label: "Health read shifted",
      detail: buildHealthShiftDetail(
        input.memory.previousHealth,
        input.briefing.health,
        input.role
      ),
      severity: "watch",
      kind: "stability_shift",
    });
  }

  if (
    input.memory.previousCampaignStatus &&
    input.memory.previousCampaignStatus !== input.briefing.campaignStatus
  ) {
    insights.push({
      label: "Campaign tone changed",
      detail: buildStatusShiftDetail(
        input.memory.previousCampaignStatus,
        input.briefing.campaignStatus,
        input.role
      ),
      severity: "watch",
      kind: "stability_shift",
    });
  }

  const repeatedCrossDomainCount = input.briefing.crossDomainSignal
    ? countMatches(
        input.memory.recentCrossDomainSignals,
        input.briefing.crossDomainSignal
      )
    : 0;

  if (input.briefing.crossDomainSignal && repeatedCrossDomainCount >= 2) {
    insights.push({
      label:
        repeatedCrossDomainCount >= 3
          ? "Dependency is becoming a theme"
          : "Dependency is showing up again",
      detail: buildCrossDomainDetail(input.role),
      severity: repeatedCrossDomainCount >= 3 ? "important" : "watch",
      kind: "cross_domain_pattern",
    });
  }

  return insights.slice(0, 4);
}