import {
  AetherDomain,
  DomainSignalBundle,
} from "./signals";

export type CrossDomainLink = {
  id: string;
  from: AetherDomain;
  to: AetherDomain;
  label: string;
  reason: string;
  action: string;
  score: number;
};

export type CrossDomainContext = {
  finance: {
    overduePledges: number;
    highValueDonorsPending: number;
  };
  outreach: {
    pendingFollowUps: number;
    positiveContacts: number;
  };
  field: {
    strongIdRateZones: number;
    incompleteTurfs: number;
  };
  digital: {
    strongPerformingPlatforms: number;
    negativeSentimentThreads: number;
  };
  print: {
    readyAssets: number;
    deliveryRisks: number;
  };
};

function link(
  id: string,
  from: AetherDomain,
  to: AetherDomain,
  label: string,
  reason: string,
  action: string,
  score: number
): CrossDomainLink {
  return {
    id,
    from,
    to,
    label,
    reason,
    action,
    score,
  };
}
export function buildCrossDomainLinks(
  context: CrossDomainContext,
  bundles: DomainSignalBundle[]
): CrossDomainLink[] {
  const links: CrossDomainLink[] = [];

  if (
    context.finance.highValueDonorsPending > 0 &&
    context.outreach.pendingFollowUps < context.finance.highValueDonorsPending
  ) {
    links.push(
      link(
        "finance-to-outreach-donor-followup",
        "finance",
        "outreach",
        "Finance opportunity needs outreach follow-up",
        "High-value donors are waiting in finance, but outreach follow-up is not keeping pace.",
        "Create donor outreach follow-up priorities immediately.",
        9
      )
    );
  }

  if (context.digital.strongPerformingPlatforms > 0 && context.field.strongIdRateZones > 0) {
    links.push(
      link(
        "digital-to-field-message-sync",
        "digital",
        "field",
        "Digital message should reinforce field script",
        "Winning digital messaging should inform canvass and field talking points.",
        "Push top-performing digital message into field script guidance.",
        7
      )
    );
  }

  if (context.print.readyAssets > 0 && context.field.incompleteTurfs > 0) {
    links.push(
      link(
        "print-to-field-material-activation",
        "print",
        "field",
        "Print readiness can unblock field execution",
        "Print materials are available while field still has incomplete turf to work.",
        "Trigger field deployment with newly ready print assets.",
        8
      )
    );
  }

  if (context.outreach.positiveContacts > 0 && context.finance.highValueDonorsPending > 0) {
    links.push(
      link(
        "outreach-to-finance-donor-conversion",
        "outreach",
        "finance",
        "Positive outreach responses may convert in finance",
        "Recent positive outreach momentum can be converted into finance asks.",
        "Promote strongest positive outreach contacts into finance follow-up.",
        8
      )
    );
  }

  if (context.digital.negativeSentimentThreads > 0 && context.outreach.pendingFollowUps > 0) {
    links.push(
      link(
        "digital-to-outreach-message-protection",
        "digital",
        "outreach",
        "Negative digital sentiment may affect outreach conversations",
        "Weak digital sentiment can spill into direct outreach unless messaging is tightened.",
        "Brief outreach team on current digital response risks and approved language.",
        6
      )
    );
  }

  return links.sort((a, b) => b.score - a.score);
}