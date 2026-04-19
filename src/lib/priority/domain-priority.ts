import { ActionItem } from "@/lib/priority/action-engine";
import { getImpactAdjustedScore } from "@/lib/priority/impact-scoring";

export type Domain =
  | "outreach"
  | "contacts"
  | "tasks"
  | "finance"
  | "digital"
  | "field"
  | "print"
  | "system";

export interface DomainScore {
  domain: Domain;
  totalImpact: number;
  actionCount: number;
  averageImpact: number;
  highestImpact: number;
  pressureScore: number;
}

function detectDomain(action: ActionItem): Domain {
  const type = action.type;

  if (type === "work_opportunity") return "finance";
  if (type === "follow_up_contact") return "outreach";
  if (type === "fix_contact_data") return "contacts";
  if (type === "complete_task" || type === "unblock_work") return "tasks";
  if (type === "review_routing") return "system";
  if (type === "reduce_owner_pressure" || type === "rebalance_queue") return "system";

  return "tasks";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
function getPressureScore(actions: ActionItem[]): number {
  if (!actions.length) return 0;

  let pressure = 0;

  for (const action of actions) {
    const impact = getImpactAdjustedScore(action);

    pressure += impact * 0.6;

    if (action.level === "critical") pressure += 16;
    if (action.level === "high") pressure += 10;
    if (action.level === "medium") pressure += 4;

    if (action.bucket === "fix_now") pressure += 10;
    if (action.bucket === "owner") pressure += 6;
    if (action.bucket === "pipeline") pressure += 5;

    if (action.badges.some((badge) => badge.toLowerCase().includes("blocked"))) {
      pressure += 6;
    }

    if (action.badges.some((badge) => badge.toLowerCase().includes("fallback"))) {
      pressure += 5;
    }
  }

  return clamp(Math.round(pressure / actions.length));
}

function buildDomainScore(
  domain: Domain,
  actions: ActionItem[]
): DomainScore {
  const impacts = actions.map((action) => getImpactAdjustedScore(action));
  const totalImpact = impacts.reduce((sum, value) => sum + value, 0);
  const highestImpact = impacts.length ? Math.max(...impacts) : 0;
  const averageImpact = actions.length ? Math.round(totalImpact / actions.length) : 0;
  const pressureScore = getPressureScore(actions);

  return {
    domain,
    totalImpact,
    actionCount: actions.length,
    averageImpact,
    highestImpact,
    pressureScore,
  };
}
export function buildDomainScores(actions: ActionItem[]): DomainScore[] {
  const grouped = new Map<Domain, ActionItem[]>();

  for (const action of actions) {
    const domain = detectDomain(action);
    const existing = grouped.get(domain) ?? [];
    existing.push(action);
    grouped.set(domain, existing);
  }

  const scores = Array.from(grouped.entries()).map(([domain, domainActions]) =>
    buildDomainScore(domain, domainActions)
  );

  return scores.sort((a, b) => {
    if (b.pressureScore !== a.pressureScore) {
      return b.pressureScore - a.pressureScore;
    }

    if (b.highestImpact !== a.highestImpact) {
      return b.highestImpact - a.highestImpact;
    }

    if (b.totalImpact !== a.totalImpact) {
      return b.totalImpact - a.totalImpact;
    }

    return a.domain.localeCompare(b.domain);
  });
}

export function getTopPriorityDomain(actions: ActionItem[]): DomainScore | null {
  const scores = buildDomainScores(actions);
  return scores[0] ?? null;
}
export function getDomainPriorityHeadline(actions: ActionItem[]): string {
  const top = getTopPriorityDomain(actions);

  if (!top) {
    return "No dominant domain pressure detected.";
  }

  return `${top.domain.charAt(0).toUpperCase() + top.domain.slice(1)} is the top priority domain right now.`;
}

export function getDomainPrioritySubheadline(actions: ActionItem[]): string {
  const top = getTopPriorityDomain(actions);

  if (!top) {
    return "Action load is currently balanced across domains.";
  }

  return `${top.actionCount} actions are driving a pressure score of ${top.pressureScore} in ${top.domain}.`;
}