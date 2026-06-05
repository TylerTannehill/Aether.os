// src/lib/abe/abe-strategy.ts

import type { AbeDepartment } from "./abe-memory";

export type AbeCampaignStage = "early" | "mid" | "late";

export type AbeDepartmentWeights = Record<AbeDepartment, number>;

export type AbeLaneSignal = {
  department: AbeDepartment;
  pressure: number;
  opportunity: number;
  activity?: number;
};

export type AbeStrategicLane = {
  department: AbeDepartment;
  pressure: number;
  opportunity: number;
  activity: number;
  weight: number;
  weightedPressure: number;
  weightedOpportunity: number;
  strategicScore: number;
};

export type AbeStrategicRead = {
  stage: AbeCampaignStage;
  weights: AbeDepartmentWeights;
  lanes: AbeStrategicLane[];
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  pressureLane: AbeDepartment;
  supportLane: AbeDepartment;
  headline: string;
  body: string;
  stickyLine: string;
  crossDomainSignal?: string;
};

export const ABE_STAGE_WEIGHTS: Record<AbeCampaignStage, AbeDepartmentWeights> = {
  early: {
    finance: 45,
    digital: 20,
    field: 15,
    print: 15,
    outreach: 5,
  },
  mid: {
    finance: 25,
    digital: 25,
    field: 25,
    print: 15,
    outreach: 10,
  },
  late: {
    finance: 5,
    digital: 30,
    field: 30,
    print: 20,
    outreach: 15,
  },
};

export function getAbeStageWeights(stage: AbeCampaignStage = "early") {
  return ABE_STAGE_WEIGHTS[stage] ?? ABE_STAGE_WEIGHTS.early;
}

function normalizeScore(value?: number | null) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, numeric);
}

function labelDepartment(department: AbeDepartment) {
  switch (department) {
    case "finance":
      return "Finance";
    case "digital":
      return "Digital";
    case "field":
      return "Field";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

function compareByStrategicScore(a: AbeStrategicLane, b: AbeStrategicLane) {
  if (b.strategicScore !== a.strategicScore) {
    return b.strategicScore - a.strategicScore;
  }

  if (b.weight !== a.weight) {
    return b.weight - a.weight;
  }

  return b.opportunity + b.pressure - (a.opportunity + a.pressure);
}

function compareByOpportunity(a: AbeStrategicLane, b: AbeStrategicLane) {
  if (b.weightedOpportunity !== a.weightedOpportunity) {
    return b.weightedOpportunity - a.weightedOpportunity;
  }

  if (b.opportunity !== a.opportunity) {
    return b.opportunity - a.opportunity;
  }

  return b.weight - a.weight;
}

function compareByPressure(a: AbeStrategicLane, b: AbeStrategicLane) {
  if (b.weightedPressure !== a.weightedPressure) {
    return b.weightedPressure - a.weightedPressure;
  }

  if (b.pressure !== a.pressure) {
    return b.pressure - a.pressure;
  }

  return b.weight - a.weight;
}

function getRequiredLane(stage: AbeCampaignStage): AbeDepartment {
  if (stage === "late") return "field";
  if (stage === "mid") return "digital";
  return "finance";
}

function buildEarlyStageHeadline(input: {
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
}) {
  if (input.primaryLane === "finance") {
    if (input.opportunityLane === "digital") {
      return "Finance remains the early-stage center of gravity, while digital is creating the strongest opportunity signal.";
    }

    return `Finance remains the early-stage center of gravity, with ${labelDepartment(
      input.opportunityLane
    ).toLowerCase()} creating the strongest support signal.`;
  }

  return `${labelDepartment(
    input.primaryLane
  )} is pulling Abe's early-stage read, but finance still remains the campaign's center of gravity.`;
}

function buildEarlyStageBody(input: {
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  pressureLane: AbeDepartment;
}) {
  if (input.primaryLane === "finance" && input.opportunityLane === "digital") {
    return "Abe is reading the campaign through an early-stage lens: money creates capacity, and digital reach can expand the audience that feeds fundraising, volunteers, and voter contact. The question is whether visibility converts into usable campaign strength.";
  }

  if (input.primaryLane === "finance") {
    return `Abe is reading the campaign through an early-stage lens: finance creates the capacity that lets ${labelDepartment(
      input.opportunityLane
    ).toLowerCase()} momentum turn into real execution. ${labelDepartment(
      input.pressureLane
    )} is the lane most likely to create drag if it is left unsupported.`;
  }

  return `Abe is reading ${labelDepartment(
    input.primaryLane
  ).toLowerCase()} as the loudest strategic signal right now, but early-stage campaigns still depend on finance to turn that movement into capacity. ${labelDepartment(
    input.opportunityLane
  )} is the cleanest opportunity lane, while ${labelDepartment(
    input.pressureLane
  )} needs attention before it becomes drag.`;
}

function buildStickyLine(input: {
  stage: AbeCampaignStage;
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
}) {
  if (input.stage === "early") {
    if (input.primaryLane === "finance" && input.opportunityLane === "digital") {
      return "Right now, visibility only matters if it feeds money, volunteers, or voter contact.";
    }

    return "Right now, capacity matters more than raw activity.";
  }

  if (input.stage === "mid") {
    return "Right now, balance matters more than isolated wins.";
  }

  return "Right now, conversion matters more than expansion.";
}

function buildCrossDomainSignal(input: {
  stage: AbeCampaignStage;
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  existingCrossDomainSignal?: string | null;
}) {
  if (input.existingCrossDomainSignal) {
    return input.existingCrossDomainSignal;
  }

  if (input.stage === "early" && input.primaryLane === "finance" && input.opportunityLane === "digital") {
    return "DIGITAL visibility should be routed toward FINANCE capacity, volunteer growth, and voter-contact lift.";
  }

  if (input.stage === "early" && input.primaryLane === "finance") {
    return `FINANCE capacity is shaping whether ${labelDepartment(
      input.opportunityLane
    ).toUpperCase()} momentum can become usable campaign movement.`;
  }

  return undefined;
}

export function buildAbeStrategicRead(input: {
  stage?: AbeCampaignStage;
  lanes: AbeLaneSignal[];
  existingCrossDomainSignal?: string | null;
}): AbeStrategicRead {
  const stage = input.stage ?? "early";
  const weights = getAbeStageWeights(stage);
  const requiredLane = getRequiredLane(stage);

  const lanes: AbeStrategicLane[] = input.lanes.map((lane) => {
    const pressure = normalizeScore(lane.pressure);
    const opportunity = normalizeScore(lane.opportunity);
    const activity = normalizeScore(lane.activity);
    const weight = weights[lane.department] ?? 0;
    const weightedPressure = pressure * (weight / 100);
    const weightedOpportunity = opportunity * (weight / 100);

    return {
      department: lane.department,
      pressure,
      opportunity,
      activity,
      weight,
      weightedPressure,
      weightedOpportunity,
      strategicScore: (pressure + opportunity + activity * 0.25) * (weight / 100),
    };
  });

  const rankedByStrategy = [...lanes].sort(compareByStrategicScore);
  const rankedByOpportunity = [...lanes].sort(compareByOpportunity);
  const rankedByPressure = [...lanes].sort(compareByPressure);

  const requiredStrategicLane =
    lanes.find((lane) => lane.department === requiredLane) ?? null;

  const rawPrimaryLane = rankedByStrategy[0]?.department ?? requiredLane;
  const opportunityLane = rankedByOpportunity[0]?.department ?? rawPrimaryLane;
  const pressureLane = rankedByPressure[0]?.department ?? rawPrimaryLane;

  const requiredLaneHasSignal = Boolean(
    requiredStrategicLane &&
      (requiredStrategicLane.pressure > 0 ||
        requiredStrategicLane.opportunity > 0 ||
        (requiredStrategicLane.activity ?? 0) > 0)
  );

  const primaryLane =
    stage === "early" && requiredLaneHasSignal ? requiredLane : rawPrimaryLane;

  const supportLane =
    opportunityLane !== primaryLane
      ? opportunityLane
      : rankedByOpportunity.find((lane) => lane.department !== primaryLane)
          ?.department ?? pressureLane;

  const headline =
    stage === "early"
      ? buildEarlyStageHeadline({ primaryLane, opportunityLane })
      : `${labelDepartment(primaryLane)} is the strategic priority lane right now.`;

  const body =
    stage === "early"
      ? buildEarlyStageBody({ primaryLane, opportunityLane, pressureLane })
      : `${labelDepartment(primaryLane)} is carrying the strongest strategic read, while ${labelDepartment(
          opportunityLane
        ).toLowerCase()} is the cleanest opportunity lane and ${labelDepartment(
          pressureLane
        ).toLowerCase()} is the pressure lane to watch.`;

  const stickyLine = buildStickyLine({ stage, primaryLane, opportunityLane });
  const crossDomainSignal = buildCrossDomainSignal({
    stage,
    primaryLane,
    opportunityLane,
    existingCrossDomainSignal: input.existingCrossDomainSignal,
  });

  return {
    stage,
    weights,
    lanes,
    primaryLane,
    opportunityLane,
    pressureLane,
    supportLane,
    headline,
    body,
    stickyLine,
    crossDomainSignal,
  };
}
