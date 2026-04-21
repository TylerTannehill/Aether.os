// src/lib/abe/abe-memory.ts

export type AbeDepartment =
  | "outreach"
  | "finance"
  | "field"
  | "digital"
  | "print";

export type AbeGlobalMemory = {
  previousPrimaryLane?: AbeDepartment;
  previousStrongest?: AbeDepartment;
  previousWeakest?: AbeDepartment;
  previousHealth?: string;
  previousCampaignStatus?: string;

  recentPrimaryLanes: AbeDepartment[];
  recentPressureLanes: AbeDepartment[];
  recentOpportunityLanes: AbeDepartment[];
  recentCrossDomainSignals: string[];
};

export type AbePatternInsight = {
  label: string;
  detail: string;
  severity: "watch" | "important" | "critical";
  lane?: AbeDepartment;
  kind?:
    | "pressure_pattern"
    | "opportunity_pattern"
    | "stability_shift"
    | "cross_domain_pattern"
    | "lane_pattern";
};

// helpers (reusable everywhere)

export function appendRecentDepartment(
  current: AbeDepartment[],
  next: AbeDepartment,
  max = 4
) {
  return [...current, next].slice(-max);
}

export function appendRecentSignal(
  current: string[],
  next?: string | null,
  max = 4
) {
  if (!next) return current;
  return [...current, next].slice(-max);
}

export function departmentLabel(department: AbeDepartment) {
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