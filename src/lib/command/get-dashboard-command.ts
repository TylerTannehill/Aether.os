// src/lib/command/get-dashboard-command.ts

export type CommandDepartment =
  | "outreach"
  | "finance"
  | "field"
  | "digital"
  | "print";

export type CommandSeverity = "watch" | "important" | "critical";

export type DashboardCommandInput = {
  abeBriefing: {
    health: string;
    strongest: CommandDepartment;
    weakest: CommandDepartment;
    primaryLane: CommandDepartment;
    opportunityLane: CommandDepartment;
    campaignStatus: string;
    whyNow: string;
    supportText: string;
    actions: string[];
    crossDomainSignal?: string;
  };
  patterns?: Array<{
    label: string;
    detail: string;
    severity: CommandSeverity;
    lane?: CommandDepartment;
  }>;
  intelligence?: {
    headline?: string | null;
    body?: string | null;
    crossDomain?: string | null;
  };
  topActions?: Array<{
    title?: string | null;
    whyNow?: string | null;
    domain?: string | null;
    score?: number | null;
    mode?: "auto" | "manual" | "blocked" | string | null;
  }>;
};

export type DashboardCommandOutput = {
  thesis: string;
  primaryConstraint: {
    lane: CommandDepartment;
    label: string;
    detail: string;
  };
  opportunity: {
    lane: CommandDepartment;
    label: string;
    detail: string;
  };
  tension: {
    label: string;
    detail: string;
  };
  consequence: {
    label: string;
    detail: string;
  };
  recommendedSequence: string[];
};

function departmentLabel(department: CommandDepartment) {
  switch (department) {
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

function normalizeText(value?: string | null) {
  return String(value ?? "").trim();
}

function normalizeDomain(value?: string | null): CommandDepartment | null {
  const text = String(value ?? "").trim().toLowerCase();

  if (text.includes("finance")) return "finance";
  if (text.includes("field")) return "field";
  if (text.includes("digital")) return "digital";
  if (text.includes("print")) return "print";
  if (text.includes("outreach")) return "outreach";

  return null;
}

function getHighestSeverityPattern(
  patterns: DashboardCommandInput["patterns"],
  lane?: CommandDepartment
) {
  const pool = (patterns ?? []).filter((pattern) => {
    if (!lane) return true;
    return !pattern.lane || pattern.lane === lane;
  });

  const severityRank: Record<CommandSeverity, number> = {
    critical: 3,
    important: 2,
    watch: 1,
  };

  return [...pool].sort((a, b) => {
    return severityRank[b.severity] - severityRank[a.severity];
  })[0];
}

function getBestTopAction(
  topActions: DashboardCommandInput["topActions"],
  lane: CommandDepartment
) {
  const matching = (topActions ?? []).filter((action) => {
    return normalizeDomain(action.domain) === lane;
  });

  return [...matching].sort((a, b) => {
    return Number(b.score ?? 0) - Number(a.score ?? 0);
  })[0];
}

function buildConstraintDetail(input: DashboardCommandInput) {
  const lane = input.abeBriefing.primaryLane;
  const laneLabel = departmentLabel(lane);
  const pattern = getHighestSeverityPattern(input.patterns, lane);
  const bestAction = getBestTopAction(input.topActions, lane);

  if (pattern) {
    return {
      lane,
      label: `${laneLabel} is the primary constraint`,
      detail: pattern.detail,
    };
  }

  if (bestAction?.whyNow) {
    return {
      lane,
      label: `${laneLabel} is the primary constraint`,
      detail: normalizeText(bestAction.whyNow),
    };
  }

  return {
    lane,
    label: `${laneLabel} is the primary constraint`,
    detail: input.abeBriefing.whyNow,
  };
}

function buildOpportunityDetail(input: DashboardCommandInput) {
  const lane = input.abeBriefing.opportunityLane;
  const laneLabel = departmentLabel(lane);
  const bestAction = getBestTopAction(input.topActions, lane);
  const intelligenceBody = normalizeText(input.intelligence?.body);

  if (bestAction?.whyNow) {
    return {
      lane,
      label: `${laneLabel} is the strongest opportunity`,
      detail: normalizeText(bestAction.whyNow),
    };
  }

  if (lane === input.abeBriefing.strongest) {
    return {
      lane,
      label: `${laneLabel} is the strongest opportunity`,
      detail: `${laneLabel} currently has the best mix of usable momentum and lowest relative drag.`,
    };
  }

  if (intelligenceBody) {
    return {
      lane,
      label: `${laneLabel} is the strongest opportunity`,
      detail: intelligenceBody,
    };
  }

  return {
    lane,
    label: `${laneLabel} is the strongest opportunity`,
    detail: `${laneLabel} is the lane most likely to create immediate forward movement if reinforced now.`,
  };
}

function buildTensionDetail(input: DashboardCommandInput) {
  const primary = departmentLabel(input.abeBriefing.primaryLane);
  const opportunity = departmentLabel(input.abeBriefing.opportunityLane);
  const crossDomain = normalizeText(
    input.abeBriefing.crossDomainSignal ?? input.intelligence?.crossDomain
  );

  if (crossDomain) {
    return {
      label: "Cross-domain tension is active",
      detail: crossDomain,
    };
  }

  if (input.abeBriefing.primaryLane !== input.abeBriefing.opportunityLane) {
    return {
      label: "Constraint and opportunity are in different lanes",
      detail: `${primary} is demanding attention while ${opportunity} is the clearest opportunity lane, which creates a sequencing problem rather than a simple single-lane fix.`,
    };
  }

  return {
    label: "Pressure and opportunity are concentrated in one lane",
    detail: `${primary} is both the immediate pressure point and the place where the next strongest movement can happen, so execution order matters more than lane switching.`,
  };
}

function buildConsequenceDetail(input: DashboardCommandInput) {
  const weakest = departmentLabel(input.abeBriefing.weakest);
  const primary = departmentLabel(input.abeBriefing.primaryLane);
  const pattern = getHighestSeverityPattern(input.patterns, input.abeBriefing.primaryLane);

  if (pattern?.severity === "critical") {
    return {
      label: "If ignored, pressure likely compounds",
      detail: `${primary} is already showing repeating critical pressure. If it stays untreated, drag is likely to spread outward and slow neighboring lanes.`,
    };
  }

  if (input.abeBriefing.crossDomainSignal) {
    return {
      label: "If ignored, drag likely spreads cross-domain",
      detail: `The current signal already links multiple lanes. Ignoring ${primary} increases the chance that ${weakest} or another dependent lane absorbs the next hit.`,
    };
  }

  return {
    label: "If ignored, the weakest lane gets harder to recover",
    detail: `${weakest} is already the weakest lane in Abe's read. Delayed action increases recovery cost and makes later routing decisions heavier.`,
  };
}

function buildSequence(input: DashboardCommandInput) {
  const sequence: string[] = [];
  const primaryLabel = departmentLabel(input.abeBriefing.primaryLane);
  const opportunityLabel = departmentLabel(input.abeBriefing.opportunityLane);

  sequence.push(`Stabilize ${primaryLabel} enough to stop further drag.`);
  sequence.push(`Exploit the immediate opening in ${opportunityLabel}.`);

  if (input.abeBriefing.crossDomainSignal) {
    sequence.push("Resolve the active cross-domain dependency before scaling pressure.");
  }

  const abeActions = (input.abeBriefing.actions ?? [])
    .map((action) => normalizeText(action))
    .filter(Boolean);

  for (const action of abeActions) {
    if (!sequence.includes(action)) {
      sequence.push(action);
    }
    if (sequence.length >= 5) break;
  }

  if (sequence.length < 5) {
    sequence.push("Re-read the board after movement and route the next action from the updated state.");
  }

  return sequence.slice(0, 5);
}

function buildThesis(input: DashboardCommandInput) {
  const primary = departmentLabel(input.abeBriefing.primaryLane);
  const opportunity = departmentLabel(input.abeBriefing.opportunityLane);

  if (input.abeBriefing.primaryLane === input.abeBriefing.opportunityLane) {
    return `${primary} is both the constraint and the best opening, so the command priority is to execute cleanly inside that lane before switching attention elsewhere.`;
  }

  return `${primary} is the constraint, but ${opportunity} is the best opening, so the command priority is to stabilize drag first and then exploit the strongest available movement.`;
}

export function getDashboardCommand(
  input: DashboardCommandInput
): DashboardCommandOutput {
  return {
    thesis: buildThesis(input),
    primaryConstraint: buildConstraintDetail(input),
    opportunity: buildOpportunityDetail(input),
    tension: buildTensionDetail(input),
    consequence: buildConsequenceDetail(input),
    recommendedSequence: buildSequence(input),
  };
}