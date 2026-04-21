// src/lib/abe/abe-org-layer.ts

import { AbeDepartment } from "./abe-memory";
import { AbeBriefing } from "./abe-briefing";

export type AbeOrgLaneSnapshot = {
  department: AbeDepartment;
  strongest?: AbeDepartment | null;
  weakest?: AbeDepartment | null;
  primaryLane?: AbeDepartment | null;
  opportunityLane?: AbeDepartment | null;
  health?: string | null;
  campaignStatus?: string | null;
  whyNow?: string | null;
  crossDomainSignal?: string | null;
};

export type AbeOrgLayerInput = {
  lanes: AbeOrgLaneSnapshot[];
};

export type AbeOrgLayerResult = {
  orgStrongestLane: AbeDepartment;
  orgWeakestLane: AbeDepartment;
  orgPressureLeader: AbeDepartment;
  orgMomentumLeader: AbeDepartment;
  imbalanceDetected: boolean;
  crossLaneTension: boolean;
  repeatedWeakLaneCount: number;
  repeatedStrongLaneCount: number;
  orgNarrative: string;
  orgSupportLine: string;
};

const ALL_LANES: AbeDepartment[] = [
  "outreach",
  "finance",
  "field",
  "digital",
  "print",
];

function createLaneCounter(initial = 0) {
  return {
    outreach: initial,
    finance: initial,
    field: initial,
    digital: initial,
    print: initial,
  } as Record<AbeDepartment, number>;
}

function bump(
  counter: Record<AbeDepartment, number>,
  lane?: AbeDepartment | null,
  amount = 1
) {
  if (!lane) return;
  counter[lane] += amount;
}

function pickTopLane(counter: Record<AbeDepartment, number>, fallback: AbeDepartment) {
  return (Object.entries(counter) as [AbeDepartment, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

function countTopValue(counter: Record<AbeDepartment, number>, lane: AbeDepartment) {
  return counter[lane] ?? 0;
}

function hasPressureLanguage(value?: string | null) {
  const text = String(value || "").toLowerCase();
  return (
    text.includes("pressure") ||
    text.includes("risk") ||
    text.includes("drag") ||
    text.includes("constraint") ||
    text.includes("lag") ||
    text.includes("soft")
  );
}

function hasMomentumLanguage(value?: string | null) {
  const text = String(value || "").toLowerCase();
  return (
    text.includes("momentum") ||
    text.includes("opportunity") ||
    text.includes("stabil") ||
    text.includes("strength") ||
    text.includes("lift") ||
    text.includes("building")
  );
}

function laneLabel(lane: AbeDepartment) {
  switch (lane) {
    case "finance":
      return "Finance";
    case "field":
      return "Field";
    case "digital":
      return "Digital";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

function buildOrgNarrative(input: {
  orgPressureLeader: AbeDepartment;
  orgMomentumLeader: AbeDepartment;
  imbalanceDetected: boolean;
  crossLaneTension: boolean;
  repeatedWeakLaneCount: number;
  repeatedStrongLaneCount: number;
}) {
  const pressureLabel = laneLabel(input.orgPressureLeader);
  const momentumLabel = laneLabel(input.orgMomentumLeader);

  if (input.crossLaneTension && input.imbalanceDetected) {
    return `${pressureLabel} is shaping the campaign's pressure picture right now, while ${momentumLabel} appears to be carrying more of the usable momentum.`;
  }

  if (input.imbalanceDetected && input.repeatedWeakLaneCount >= 2) {
    return `${pressureLabel} keeps showing up as the softer lane in the broader campaign read, which makes the current imbalance look more structural than temporary.`;
  }

  if (input.repeatedStrongLaneCount >= 2) {
    return `${momentumLabel} keeps surfacing as one of the steadier lanes in the campaign-wide read, which suggests it may be carrying more organizational weight than usual.`;
  }

  if (input.orgPressureLeader === input.orgMomentumLeader) {
    return `${pressureLabel} is carrying both pressure and opportunity signals right now, which makes it the lane most likely to shape the next campaign-wide shift.`;
  }

  return `${pressureLabel} looks like the main pressure lane in the broader campaign read, while ${momentumLabel} appears to be offering the clearest near-term support.`;
}

function buildOrgSupportLine(input: {
  orgPressureLeader: AbeDepartment;
  orgMomentumLeader: AbeDepartment;
  imbalanceDetected: boolean;
  crossLaneTension: boolean;
}) {
  const pressureLabel = laneLabel(input.orgPressureLeader);
  const momentumLabel = laneLabel(input.orgMomentumLeader);

  if (input.crossLaneTension) {
    return `Abe should read ${pressureLabel} in the context of what ${momentumLabel} is doing, not as an isolated lane.`;
  }

  if (input.imbalanceDetected) {
    return `Abe should treat ${pressureLabel} as the lane most likely to drag the broader campaign unless ${momentumLabel} can keep offsetting it.`;
  }

  return `Abe should keep ${pressureLabel} and ${momentumLabel} in view together when interpreting the campaign-wide picture.`;
}

export function buildAbeOrgLayer(input: AbeOrgLayerInput): AbeOrgLayerResult {
  const strongestCounter = createLaneCounter();
  const weakestCounter = createLaneCounter();
  const pressureCounter = createLaneCounter();
  const momentumCounter = createLaneCounter();

  let crossLaneTension = false;

  for (const lane of input.lanes) {
    bump(strongestCounter, lane.strongest);
    bump(weakestCounter, lane.weakest);

    if (lane.weakest) {
      bump(pressureCounter, lane.weakest, 2);
    }

    if (lane.strongest) {
      bump(momentumCounter, lane.strongest, 2);
    }

    if (lane.opportunityLane) {
      bump(momentumCounter, lane.opportunityLane, 1);
    }

    if (lane.primaryLane) {
      bump(pressureCounter, lane.primaryLane, 1);
      bump(momentumCounter, lane.primaryLane, 1);
    }

    if (hasPressureLanguage(lane.health) || hasPressureLanguage(lane.campaignStatus)) {
      bump(pressureCounter, lane.department, 1);
    }

    if (hasMomentumLanguage(lane.health) || hasMomentumLanguage(lane.campaignStatus)) {
      bump(momentumCounter, lane.department, 1);
    }

    if (lane.crossDomainSignal) {
      crossLaneTension = true;
      bump(pressureCounter, lane.department, 1);
    }
  }

  const orgStrongestLane = pickTopLane(strongestCounter, "digital");
  const orgWeakestLane = pickTopLane(weakestCounter, "outreach");
  const orgPressureLeader = pickTopLane(pressureCounter, orgWeakestLane);
  const orgMomentumLeader = pickTopLane(momentumCounter, orgStrongestLane);

  const repeatedWeakLaneCount = countTopValue(weakestCounter, orgWeakestLane);
  const repeatedStrongLaneCount = countTopValue(strongestCounter, orgStrongestLane);

  const imbalanceDetected =
    orgPressureLeader !== orgMomentumLeader ||
    repeatedWeakLaneCount >= 2 ||
    repeatedStrongLaneCount >= 2;

  const orgNarrative = buildOrgNarrative({
    orgPressureLeader,
    orgMomentumLeader,
    imbalanceDetected,
    crossLaneTension,
    repeatedWeakLaneCount,
    repeatedStrongLaneCount,
  });

  const orgSupportLine = buildOrgSupportLine({
    orgPressureLeader,
    orgMomentumLeader,
    imbalanceDetected,
    crossLaneTension,
  });

  return {
    orgStrongestLane,
    orgWeakestLane,
    orgPressureLeader,
    orgMomentumLeader,
    imbalanceDetected,
    crossLaneTension,
    repeatedWeakLaneCount,
    repeatedStrongLaneCount,
    orgNarrative,
    orgSupportLine,
  };
}

export function buildAbeOrgLayerFromBriefings(
  briefings: Array<Pick<
    AbeBriefing,
    | "strongest"
    | "weakest"
    | "primaryLane"
    | "opportunityLane"
    | "health"
    | "campaignStatus"
    | "whyNow"
    | "crossDomainSignal"
  > & { department: AbeDepartment }>
) {
  return buildAbeOrgLayer({
    lanes: briefings.map((briefing) => ({
      department: briefing.department,
      strongest: briefing.strongest,
      weakest: briefing.weakest,
      primaryLane: briefing.primaryLane,
      opportunityLane: briefing.opportunityLane,
      health: briefing.health,
      campaignStatus: briefing.campaignStatus,
      whyNow: briefing.whyNow,
      crossDomainSignal: briefing.crossDomainSignal,
    })),
  });
}

export function getOrgContextForDepartment(
  orgLayer: AbeOrgLayerResult,
  department: AbeDepartment
) {
  return {
    department,
    departmentIsPressureLeader: orgLayer.orgPressureLeader === department,
    departmentIsMomentumLeader: orgLayer.orgMomentumLeader === department,
    departmentMatchesOrgWeakest: orgLayer.orgWeakestLane === department,
    departmentMatchesOrgStrongest: orgLayer.orgStrongestLane === department,
    orgNarrative: orgLayer.orgNarrative,
    orgSupportLine: orgLayer.orgSupportLine,
    imbalanceDetected: orgLayer.imbalanceDetected,
    crossLaneTension: orgLayer.crossLaneTension,
  };
}
