import type { AbeBriefing } from "@/lib/abe/abe-briefing";
import type { AbeDepartment } from "@/lib/abe/abe-memory";
import type { Contact, OutreachLog } from "@/lib/data/types";

type DemoRole = "admin" | "director" | "general_user";

type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type OutreachCommandSignal = {
  title: string;
  detail: string;
  instruction: string;
  priority: "high" | "medium" | "low";
  category:
    | "conversion"
    | "retry"
    | "task"
    | "review"
    | "finance"
    | "execution";
  autoReady: boolean;
};

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

export function buildOutreachBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  ownerScopedContacts: Contact[];
  ownerScopedLogs: OutreachLog[];
  visibleFilteredContactsLength: number;
  financeTriggeredDraftTasksLength: number;
  positiveEngagement: number;
  staleContacts: number;
  followUpPressure: number;
  outreachCommandSignal: OutreachCommandSignal;
}): AbeBriefing {
  const financeTriggeredActive = input.financeTriggeredDraftTasksLength > 0;
  const conversionReady = input.positiveEngagement >= Math.max(2, input.followUpPressure);
  const reactivationPressure =
    input.staleContacts + Math.max(0, input.visibleFilteredContactsLength - input.positiveEngagement);

  const strongest: AbeDepartment =
    financeTriggeredActive || conversionReady ? "outreach" : "finance";

  const weakest: AbeDepartment =
    input.followUpPressure + input.staleContacts > input.positiveEngagement + 1
      ? "outreach"
      : financeTriggeredActive
      ? "finance"
      : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? financeTriggeredActive
        ? "outreach"
        : "outreach"
      : input.demoDepartment === "outreach"
      ? "outreach"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    financeTriggeredActive ? "finance" : "outreach";

  let health = "Stable overall";
  if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    health = "Pressure is rising";
  } else if (conversionReady || financeTriggeredActive) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (financeTriggeredActive) {
    campaignStatus = "Stable with finance-triggered opportunity";
  } else if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    campaignStatus = "Follow-up pressure is building";
  } else if (conversionReady) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Outreach has active engagement in motion, but queue discipline and conversion speed will determine whether momentum sticks.";

  if (financeTriggeredActive) {
    whyNow =
      "Finance is surfacing donor-related contacts into Outreach, which means this lane needs to absorb high-value follow-up before the opportunity cools.";
  } else if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    whyNow =
      "Follow-up demand is building faster than the lane is clearing it, which makes responsiveness the immediate risk.";
  } else if (conversionReady) {
    whyNow =
      "Positive engagement is active, so Outreach has a real conversion window right now if the warmest contacts get worked first.";
  } else if (reactivationPressure > 0) {
    whyNow =
      "Most available contacts need another attempt, retry, or reconnect before momentum can build again.";
  }

  const supportText =
    input.role === "admin"
      ? "Use Outreach Focus to clear pressure and work warm contacts first."
      : input.role === "director"
      ? "Use Outreach Focus to keep queue health tight and sequence warm contacts."
      : "Stay on the next contact and keep the lane moving.";

  const actions: string[] = [];

  if (financeTriggeredActive) {
    actions.push("Work the finance-triggered outreach contacts before they cool.");
  }

  if (input.followUpPressure + input.staleContacts > input.positiveEngagement + 1) {
    actions.push("Clear the oldest follow-ups before queue pressure spreads.");
  }

  if (conversionReady) {
    actions.push("Convert the warmest contacts while engagement is still active.");
  } else {
    actions.push("Reconnect stale contacts to rebuild lane momentum.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next outreach action tight and move to the next contact.");
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
    crossDomainSignal: financeTriggeredActive
      ? "FINANCE is feeding high-value follow-up work directly into OUTREACH."
      : undefined,
  };
}
