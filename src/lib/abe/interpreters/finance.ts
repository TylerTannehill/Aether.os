import type { AbeBriefing } from "@/lib/abe/abe-briefing";
import type { AbeDepartment } from "@/lib/abe/abe-memory";
import { getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type FinanceCommandSignal = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  category: "conversion" | "task" | "retry" | "review";
  autoReady: boolean;
};

type ContributionRecord = {
  id:string; amount:number; method:"online"|"check"|"cash"; date:string;
  compliant:boolean; employer?:string|null; occupation?:string|null; notes?:string|null;
};

type PledgeRecord = {
  id:string; amount:number; status:"pledged"|"follow_up"|"converted";
  created_at:string; converted_at?:string|null; notes?:string|null;
};

type FinanceContactRow = {
  id:string; name:string; city?:string|null; state?:string|null;
  candidateApproved?:boolean;
  contributions:ContributionRecord[];
  pledges:PledgeRecord[];
};


function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

export function buildFinanceBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  pledgeQueueLength: number;
  complianceIssuesLength: number;
  workflowOpenCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  financeCommandSignal: FinanceCommandSignal;
  selectedContact: FinanceContactRow | null;
  orgContext?: ReturnType<typeof getOrgContextForDepartment>;
}): AbeBriefing {
  const strongest: AbeDepartment =
    input.totalMoneyIn > input.totalMoneyOut ? "finance" : "outreach";

  const weakest: AbeDepartment =
    input.complianceIssuesLength > 0 || input.pledgeQueueLength > 0
      ? "finance"
      : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? "finance"
      : input.demoDepartment === "finance"
      ? "finance"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.pledgeQueueLength > 0 ? "finance" : "outreach";

  let health = "Stable overall";
  if (input.complianceIssuesLength > 0 && input.pledgeQueueLength > 0) {
    health = "Pressure is rising";
  } else if (input.totalMoneyIn > input.totalMoneyOut * 1.5) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (input.pledgeQueueLength > 0 && input.complianceIssuesLength > 0) {
    campaignStatus = "Pledge and compliance pressure are active";
  } else if (input.pledgeQueueLength > 0) {
    campaignStatus = "Stable with pledge pressure";
  } else if (input.complianceIssuesLength > 0) {
    campaignStatus = "Stable with compliance pressure";
  } else if (input.totalMoneyIn > input.totalMoneyOut) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Finance is moving money, but the lane needs clean collection and compliance discipline to stay trustworthy.";

  if (input.pledgeQueueLength > 0 && input.complianceIssuesLength > 0) {
    whyNow =
      "Finance has money available in the pipeline, but open pledges and incomplete donor records are creating the risk that matters right now.";
  } else if (input.pledgeQueueLength > 0) {
    whyNow =
      "Pledged dollars are sitting uncollected, which means finance needs tighter follow-through before momentum softens.";
  } else if (input.complianceIssuesLength > 0) {
    whyNow =
      "Missing employer and occupation details are blocking clean reporting, so finance needs cleanup before exports can be trusted.";
  }

  const whyNowModifiers:string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Finance is carrying the most campaign-wide pressure right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Finance is acting as a steadier campaign-wide support lane.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this finance signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  const baseSupportText =
    input.role === "admin"
      ? "Use Finance Focus to clear collection pressure and protect compliance."
      : input.role === "director"
      ? "Use Finance Focus to sequence collection and compliance cleanly."
      : "Finish the next finance action cleanly and move on.";

  const supportText = [baseSupportText, input.orgContext?.orgSupportLine]
    .filter(Boolean)
    .join(" ");

  const actions: string[] = [];

  if (input.pledgeQueueLength > 0) {
    actions.push("Convert active pledges before opening fresh finance work.");
  }

  if (input.complianceIssuesLength > 0) {
    actions.push("Fix incomplete donor records before export readiness slips.");
  }

  if (input.workflowOpenCount > 0) {
    actions.push("Clear the finance workflow queue in priority order.");
  } else {
    actions.push("Keep contributions logged cleanly so the lane stays audit-ready.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next finance action tight and move to the next record.");
  }

  return {
    health,
    strongest,
    weakest,
    primaryLane,
    opportunityLane,
    campaignStatus,
    whyNow,
    supportText,
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal:
      input.pledgeQueueLength > 0
        ? "FINANCE has collection work active that could spill into OUTREACH follow-up if not cleared."
        : undefined,
  };
}

