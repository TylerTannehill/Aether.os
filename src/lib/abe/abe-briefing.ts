// src/lib/abe/abe-briefing.ts

import { AbeDepartment, departmentLabel } from "./abe-memory";
import { buildAbeActionSet } from "./abe-actions";
import {
  buildAbeStrategicRead,
  type AbeCampaignStage,
  type AbeDepartmentWeights,
  type AbeStrategicLane,
} from "./abe-strategy";
import type { FollowThroughSignals } from "./abe-follow-through";

type AbeRole = "admin" | "director" | "general_user";

type OutcomeSignals = {
  trend: "improving" | "flat" | "declining";
  delta: number;
  meaningful: boolean;
};

type FinanceSnapshotLike = {
  moneyIn: number;
  moneyOut: number;
  net?: number;
  pledges: number;
};

type FieldSnapshotLike = {
  doors: number;
  conversations: number;
  ids?: number;
};

type PrintSnapshotLike = {
  onHand?: number;
  orders: number;
  approvalReady: number;
};

type DigitalSnapshotLike = {
  impressions: number;
  engagement: number;
  spend?: number;
};

export type AbeBriefing = {
  health: string;
  strongest: AbeDepartment;
  weakest: AbeDepartment;
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  campaignStatus: string;
  whyNow: string;
  supportText: string;
  actions: string[];
  crossDomainSignal?: string;
};

export type CampaignBriefing = AbeBriefing & {
  stage: AbeCampaignStage;
  stageLabel: string;
  stageMission: string;
  weights: AbeDepartmentWeights;
  lanes: AbeStrategicLane[];
  pressureLane: AbeDepartment;
  supportLane: AbeDepartment;
  headline: string;
  body: string;
  stickyLine: string;
  weightText: string;
};

export type BuildCampaignBriefingInput = {
  role: AbeRole;
  effectiveDepartment: AbeDepartment;
  campaignStage?: AbeCampaignStage | string | null;
  financeSnapshot: FinanceSnapshotLike;
  fieldSnapshot: FieldSnapshotLike;
  printSnapshot: PrintSnapshotLike;
  digitalSnapshot: DigitalSnapshotLike;
  fieldAverageCompletion: number;
  digitalSentimentNegative: number;
  filteredTasks: any[];
  filteredContacts: any[];
  filteredLogs: any[];
  intelligenceHeadline?: string | null;
  intelligenceBody?: string | null;
  intelligenceCrossDomain?: string | null;
  repeatedPressureCount?: number;
  repeatedOpportunityCount?: number;
  repeatedPrimaryCount?: number;
  followThrough?: FollowThroughSignals;
  outcomeSignals?: OutcomeSignals;
};

function normalizeAbeCampaignStage(value?: string | null): AbeCampaignStage {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "mid") return "mid";
  if (normalized === "late") return "late";

  return "early";
}

export function getAbeCampaignStageLabel(stage: AbeCampaignStage) {
  if (stage === "mid") return "Mid Stage";
  if (stage === "late") return "Late Stage";

  return "Early Stage";
}

export function getAbeCampaignStageMission(stage: AbeCampaignStage) {
  if (stage === "mid") {
    return "balance capacity growth with disciplined execution";
  }

  if (stage === "late") {
    return "convert existing capacity into votes, turnout, and completed execution";
  }

  return "build the capacity the rest of the campaign depends on";
}

export function formatAbeStageWeightText(weights: AbeDepartmentWeights): string {
  return (["finance", "digital", "field", "print", "outreach"] as AbeDepartment[])
    .map((department) => `${departmentLabel(department)} ${weights[department] ?? 0}%`)
    .join(", ");
}

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in_progress", "in progress", "active"].includes(value)) {
    return "in_progress";
  }

  return value || "open";
}

function getFinanceAmountScore(amount: number) {
  if (amount >= 1000) return 4;
  if (amount >= 500) return 3;
  if (amount >= 100) return 2;
  if (amount > 0) return 1;

  return 0;
}

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);

  if (!cleanModifiers.length) {
    return base;
  }

  return `${base} ${cleanModifiers[0]}`;
}

function buildHealth(input: {
  financeSnapshot: FinanceSnapshotLike;
  totalPressure: number;
  totalOpportunity: number;
}) {
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    return "Under financial pressure";
  }

  if (input.totalOpportunity >= input.totalPressure * 1.35) {
    return "Momentum building";
  }

  if (input.totalPressure > input.totalOpportunity * 1.1) {
    return "Pressure is rising";
  }

  return "Stable overall";
}

function buildCampaignStatus(input: {
  financeSnapshot: FinanceSnapshotLike;
  totalPressure: number;
  totalOpportunity: number;
}) {
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    return "At risk with financial pressure";
  }

  if (input.totalOpportunity >= input.totalPressure * 1.2) {
    return "Stable with opportunity";
  }

  if (input.totalPressure > input.totalOpportunity) {
    return "Stable, but pressure is rising";
  }

  return "Stable overall";
}

function buildScopedWhyNow(input: {
  primaryLane: AbeDepartment;
  strategicBody: string;
  role: AbeRole;
}) {
  if (input.role === "admin") {
    return input.strategicBody;
  }

  if (input.primaryLane === "outreach") {
    return "Relationship management is becoming a constraint, but Abe is watching whether that pressure converts into finance, digital, field, or print movement.";
  }

  if (input.primaryLane === "finance") {
    return "Available dollars and pending pledges need tighter follow-through before revenue momentum softens.";
  }

  if (input.primaryLane === "field") {
    return "Coverage pace is uneven, so field movement needs support before completion falls further behind.";
  }

  if (input.primaryLane === "digital") {
    return "Digital reach is creating visibility, but sentiment and follow-through will determine whether that momentum converts.";
  }

  if (input.primaryLane === "print") {
    return "Print readiness can unlock downstream movement, but delivery timing is becoming the constraint.";
  }

  return "Multiple campaign lanes are moving at once, and pressure is starting to concentrate.";
}

function buildWhyNowModifiers(input: {
  followThrough?: FollowThroughSignals;
  outcomeSignals?: OutcomeSignals;
}) {
  const modifiers: string[] = [];

  if (input.followThrough) {
    const behavior = input.followThrough.dominantBehavior;

    if (behavior === "ignored") {
      modifiers.push("Some work in this lane is not getting picked up.");
    } else if (behavior === "attempted") {
      modifiers.push("Effort is active, but pressure is not resolving yet.");
    } else if (
      behavior === "completed" &&
      input.followThrough.completionRate > 0.7
    ) {
      modifiers.push("Follow-through is starting to stabilize the lane.");
    }
  }

  if (input.outcomeSignals?.meaningful) {
    if (input.outcomeSignals.trend === "declining") {
      modifiers.push("Activity is not translating into resolution yet.");
    } else if (input.outcomeSignals.trend === "improving") {
      modifiers.push("Recent follow-through is starting to create lift.");
    }
  }

  return modifiers;
}

function buildFollowThroughNote(followThrough?: FollowThroughSignals) {
  if (!followThrough) return "";

  if (followThrough.dominantBehavior === "ignored") {
    return " There are also a few tasks in this lane that don’t appear to be getting picked up right now.";
  }

  if (followThrough.dominantBehavior === "attempted") {
    return " There is movement in this lane, but it does not look like that effort is resolving the pressure yet.";
  }

  if (followThrough.completionRate > 0.7) {
    return " Follow-through in this lane looks steadier right now.";
  }

  return "";
}

function buildSupportText(input: {
  role: AbeRole;
  primaryLane: AbeDepartment;
  effectiveDepartment: AbeDepartment;
  followThrough?: FollowThroughSignals;
}) {
  const followThroughNote = buildFollowThroughNote(input.followThrough);

  if (input.role === "admin") {
    return `Open ${departmentLabel(input.primaryLane)} to review the supporting analytics behind this read and keep the campaign aligned around the right lane.${followThroughNote}`;
  }

  return `Open ${departmentLabel(
    input.effectiveDepartment
  )} to review the supporting analytics behind this read and keep your lane moving with the right context.${followThroughNote}`;
}

export function buildCampaignBriefing(
  input: BuildCampaignBriefingInput
): CampaignBriefing {
  const stage = normalizeAbeCampaignStage(input.campaignStage);

  const outreachPressure =
    input.filteredTasks.filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);

      return (
        status !== "completed" &&
        (title.includes("follow-up") || title.includes("follow up"))
      );
    }).length +
    Math.max(
      0,
      input.filteredContacts.filter((contact: any) =>
        Boolean(contact.needs_follow_up)
      ).length
    );

  const outreachOpportunity = input.filteredLogs.filter((log: any) => {
    const result = String(log.result || "").toLowerCase();

    return (
      result.includes("positive") ||
      result.includes("support") ||
      result.includes("interested") ||
      result.includes("pledge")
    );
  }).length;

  const financePledgeScore = getFinanceAmountScore(
    input.financeSnapshot.pledges
  );
  const financeRevenueScore = getFinanceAmountScore(
    input.financeSnapshot.moneyIn
  );

  const financePressure =
    Math.max(
      0,
      Math.round(
        input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn ? 2 : 0
      )
    ) + financePledgeScore;

  const financeOpportunity =
    financeRevenueScore + (input.financeSnapshot.pledges > 0 ? 1 : 0);

  const fieldPressure = Math.max(0, 100 - input.fieldAverageCompletion);
  const fieldOpportunity = Math.max(
    0,
    Math.round(input.fieldSnapshot.conversations / 10)
  );

  const digitalPressure = input.digitalSentimentNegative;
  const digitalOpportunity = Math.max(
    0,
    Math.round(input.digitalSnapshot.impressions / 5000)
  );

  const printPressure = Math.max(
    0,
    input.printSnapshot.orders * 8 - input.printSnapshot.approvalReady * 3
  );
  const printOpportunity = Math.max(0, input.printSnapshot.approvalReady * 10);

  const rawLanes = [
    {
      key: "outreach" as const,
      pressure: outreachPressure,
      opportunity: outreachOpportunity,
      activity: outreachPressure + outreachOpportunity,
    },
    {
      key: "finance" as const,
      pressure: financePressure,
      opportunity: financeOpportunity,
      activity:
        financePressure +
        financeOpportunity +
        (input.financeSnapshot.moneyIn > 0 ? 1 : 0) +
        (input.financeSnapshot.pledges > 0 ? 1 : 0),
    },
    {
      key: "field" as const,
      pressure: fieldPressure,
      opportunity: fieldOpportunity,
      activity: fieldOpportunity,
    },
    {
      key: "digital" as const,
      pressure: digitalPressure,
      opportunity: digitalOpportunity,
      activity: Math.min(
        10,
        Math.round(input.digitalSnapshot.engagement / 5000)
      ),
    },
    {
      key: "print" as const,
      pressure: printPressure,
      opportunity: printOpportunity,
      activity: input.printSnapshot.orders + input.printSnapshot.approvalReady,
    },
  ];

  const strategicRead = buildAbeStrategicRead({
    stage,
    lanes: rawLanes.map((lane) => ({
      department: lane.key,
      pressure: lane.pressure,
      opportunity: lane.opportunity,
      activity: lane.activity,
    })),
    existingCrossDomainSignal: input.intelligenceCrossDomain,
  });

  const totalPressure = rawLanes.reduce((sum, lane) => sum + lane.pressure, 0);
  const totalOpportunity = rawLanes.reduce(
    (sum, lane) => sum + lane.opportunity,
    0
  );

  const health = buildHealth({
    financeSnapshot: input.financeSnapshot,
    totalPressure,
    totalOpportunity,
  });

  const campaignStatus = buildCampaignStatus({
    financeSnapshot: input.financeSnapshot,
    totalPressure,
    totalOpportunity,
  });

  const primaryLane =
    input.role === "admin"
      ? strategicRead.primaryLane
      : input.effectiveDepartment;

  const whyNow = applyWhyNowGovernor(
    buildScopedWhyNow({
      primaryLane,
      strategicBody: strategicRead.body,
      role: input.role,
    }),
    buildWhyNowModifiers({
      followThrough: input.followThrough,
      outcomeSignals: input.outcomeSignals,
    })
  );

  const supportText = buildSupportText({
    role: input.role,
    primaryLane,
    effectiveDepartment: input.effectiveDepartment,
    followThrough: input.followThrough,
  });

  const actions = buildAbeActionSet({
    role: input.role,
    department: input.role === "admin" ? primaryLane : input.effectiveDepartment,
    repeatedPressureCount: input.repeatedPressureCount,
    repeatedOpportunityCount: input.repeatedOpportunityCount,
    repeatedPrimaryCount: input.repeatedPrimaryCount,
    dominantBehavior: input.followThrough?.dominantBehavior,
    outcomeTrend: input.outcomeSignals?.trend,
  });

  const crossDomainSignal =
    input.role === "admin"
      ? strategicRead.crossDomainSignal
      : input.intelligenceCrossDomain || undefined;

  return {
    stage,
    stageLabel: getAbeCampaignStageLabel(stage),
    stageMission: getAbeCampaignStageMission(stage),
    weights: strategicRead.weights,
    lanes: strategicRead.lanes,
    pressureLane: strategicRead.pressureLane,
    supportLane: strategicRead.supportLane,
    headline: strategicRead.headline,
    body: strategicRead.body,
    stickyLine: strategicRead.stickyLine,
    weightText: formatAbeStageWeightText(strategicRead.weights),

    health,
    strongest: strategicRead.opportunityLane,
    weakest: strategicRead.pressureLane,
    primaryLane,
    opportunityLane: strategicRead.opportunityLane,
    campaignStatus,
    whyNow,
    supportText,
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal,
  };
}
