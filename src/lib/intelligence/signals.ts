export type AetherDomain =
  | "outreach"
  | "finance"
  | "field"
  | "digital"
  | "print";

export type AetherSignalSeverity = "low" | "medium" | "high";

export type AetherSignal = {
  id: string;
  domain: AetherDomain;
  label: string;
  description: string;
  severity: AetherSignalSeverity;
  score: number;
  kind: "risk" | "opportunity" | "status";
  metadata?: Record<string, string | number | boolean | null>;
};

export type DomainSignalBundle = {
  domain: AetherDomain;
  pressureScore: number;
  risks: AetherSignal[];
  opportunities: AetherSignal[];
  statuses: AetherSignal[];
  suggestedActions: string[];
};

export type OutreachSignalInput = {
  staleContacts: number;
  pendingFollowUps: number;
  positiveContacts: number;
  uncontactedContacts: number;
};

export type FinanceSignalInput = {
  missingComplianceRecords: number;
  overduePledges: number;
  highValueDonorsPending: number;
  cashOnHandPressure: number;
};

export type FieldSignalInput = {
  incompleteTurfs: number;
  highPriorityTurfs: number;
  strongIdRateZones: number;
  weakCoverageZones: number;
};

export type DigitalSignalInput = {
  fallingCtrPlatforms: number;
  strongPerformingPlatforms: number;
  negativeSentimentThreads: number;
  contentBacklogCount: number;
};

export type PrintSignalInput = {
  approvalBlocks: number;
  nearReorderItems: number;
  deliveryRisks: number;
  readyAssets: number;
};

function severityFromScore(score: number): AetherSignalSeverity {
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function signal(
  id: string,
  domain: AetherDomain,
  label: string,
  description: string,
  kind: "risk" | "opportunity" | "status",
  score: number,
  metadata?: Record<string, string | number | boolean | null>
): AetherSignal {
  return {
    id,
    domain,
    label,
    description,
    kind,
    score: clampScore(score),
    severity: severityFromScore(score),
    metadata,
  };
}
export function getOutreachSignals(
  input: OutreachSignalInput
): DomainSignalBundle {
  const risks: AetherSignal[] = [];
  const opportunities: AetherSignal[] = [];
  const statuses: AetherSignal[] = [];

  if (input.staleContacts > 0) {
    risks.push(
      signal(
        "outreach-stale-contacts",
        "outreach",
        "Stale contacts",
        `${input.staleContacts} contacts have gone stale and need renewed outreach.`,
        "risk",
        Math.min(10, input.staleContacts),
        { staleContacts: input.staleContacts }
      )
    );
  }

  if (input.pendingFollowUps > 0) {
    risks.push(
      signal(
        "outreach-pending-followups",
        "outreach",
        "Pending follow-ups",
        `${input.pendingFollowUps} outreach follow-ups are still unresolved.`,
        "risk",
        Math.min(10, input.pendingFollowUps + 2),
        { pendingFollowUps: input.pendingFollowUps }
      )
    );
  }

  if (input.positiveContacts > 0) {
    opportunities.push(
      signal(
        "outreach-positive-contacts",
        "outreach",
        "Positive contact momentum",
        `${input.positiveContacts} recent contacts show positive engagement and may be ready for the next ask.`,
        "opportunity",
        Math.min(10, input.positiveContacts + 1),
        { positiveContacts: input.positiveContacts }
      )
    );
  }

  statuses.push(
    signal(
      "outreach-uncontacted",
      "outreach",
      "Uncontacted universe",
      `${input.uncontactedContacts} contacts remain untouched in the current outreach universe.`,
      "status",
      Math.min(10, Math.ceil(input.uncontactedContacts / 5)),
      { uncontactedContacts: input.uncontactedContacts }
    )
  );

  const pressureScore = clampScore(
    risks.reduce((sum, item) => sum + item.score, 0) / Math.max(risks.length, 1)
  );

  return {
    domain: "outreach",
    pressureScore,
    risks,
    opportunities,
    statuses,
    suggestedActions: [
      "Call the most stale high-value contacts first.",
      "Clear pending follow-up actions before starting lower-priority outreach.",
      "Promote strong outreach responses into finance, volunteer, or field follow-up where relevant.",
    ],
  };
}

export function getFinanceSignals(
  input: FinanceSignalInput
): DomainSignalBundle {
  const risks: AetherSignal[] = [];
  const opportunities: AetherSignal[] = [];
  const statuses: AetherSignal[] = [];

  if (input.missingComplianceRecords > 0) {
    risks.push(
      signal(
        "finance-compliance-missing",
        "finance",
        "Compliance risk",
        `${input.missingComplianceRecords} finance records are missing compliance data.`,
        "risk",
        Math.min(10, input.missingComplianceRecords + 3),
        { missingComplianceRecords: input.missingComplianceRecords }
      )
    );
  }

  if (input.overduePledges > 0) {
    risks.push(
      signal(
        "finance-overdue-pledges",
        "finance",
        "Overdue pledge follow-up",
        `${input.overduePledges} pledges need immediate follow-up before momentum fades.`,
        "risk",
        Math.min(10, input.overduePledges + 2),
        { overduePledges: input.overduePledges }
      )
    );
  }

  if (input.highValueDonorsPending > 0) {
    opportunities.push(
      signal(
        "finance-high-value-donors",
        "finance",
        "High-value donor opportunity",
        `${input.highValueDonorsPending} high-value donor opportunities are waiting on action.`,
        "opportunity",
        Math.min(10, input.highValueDonorsPending + 3),
        { highValueDonorsPending: input.highValueDonorsPending }
      )
    );
  }

  statuses.push(
    signal(
      "finance-cash-pressure",
      "finance",
      "Cash flow pressure",
      `Finance pressure score is currently ${input.cashOnHandPressure}/10.`,
      "status",
      input.cashOnHandPressure,
      { cashOnHandPressure: input.cashOnHandPressure }
    )
  );

  const pressureScore = clampScore(
    risks.reduce((sum, item) => sum + item.score, 0) / Math.max(risks.length, 1)
  );

  return {
    domain: "finance",
    pressureScore,
    risks,
    opportunities,
    statuses,
    suggestedActions: [
      "Resolve compliance issues before export or reporting deadlines.",
      "Call overdue pledges before lower-priority donor work.",
      "Route warm donor opportunities into outreach and finance follow-up immediately.",
    ],
  };
}
export function getFieldSignals(input: FieldSignalInput): DomainSignalBundle {
  const risks: AetherSignal[] = [];
  const opportunities: AetherSignal[] = [];
  const statuses: AetherSignal[] = [];

  if (input.incompleteTurfs > 0) {
    risks.push(
      signal(
        "field-incomplete-turfs",
        "field",
        "Incomplete turf pressure",
        `${input.incompleteTurfs} active turf packets remain unfinished.`,
        "risk",
        Math.min(10, input.incompleteTurfs + 2),
        { incompleteTurfs: input.incompleteTurfs }
      )
    );
  }

  if (input.weakCoverageZones > 0) {
    risks.push(
      signal(
        "field-coverage-weakness",
        "field",
        "Coverage weakness",
        `${input.weakCoverageZones} field zones are under-covered right now.`,
        "risk",
        Math.min(10, input.weakCoverageZones + 3),
        { weakCoverageZones: input.weakCoverageZones }
      )
    );
  }

  if (input.strongIdRateZones > 0) {
    opportunities.push(
      signal(
        "field-strong-id-zones",
        "field",
        "Strong ID zone opportunity",
        `${input.strongIdRateZones} field zones are converting well and may deserve more canvasser allocation.`,
        "opportunity",
        Math.min(10, input.strongIdRateZones + 2),
        { strongIdRateZones: input.strongIdRateZones }
      )
    );
  }

  statuses.push(
    signal(
      "field-high-priority-turfs",
      "field",
      "High-priority turf count",
      `${input.highPriorityTurfs} turf areas are classified as high priority.`,
      "status",
      Math.min(10, input.highPriorityTurfs + 1),
      { highPriorityTurfs: input.highPriorityTurfs }
    )
  );

  const pressureScore = clampScore(
    risks.reduce((sum, item) => sum + item.score, 0) / Math.max(risks.length, 1)
  );

  return {
    domain: "field",
    pressureScore,
    risks,
    opportunities,
    statuses,
    suggestedActions: [
      "Finish incomplete turf before lower-value field work.",
      "Move top canvassers into strongest ID zones.",
      "Convert valuable field conversations into structured follow-up lists.",
    ],
  };
}

export function getDigitalSignals(
  input: DigitalSignalInput
): DomainSignalBundle {
  const risks: AetherSignal[] = [];
  const opportunities: AetherSignal[] = [];
  const statuses: AetherSignal[] = [];

  if (input.fallingCtrPlatforms > 0) {
    risks.push(
      signal(
        "digital-falling-ctr",
        "digital",
        "Creative fatigue risk",
        `${input.fallingCtrPlatforms} platforms are showing declining click-through performance.`,
        "risk",
        Math.min(10, input.fallingCtrPlatforms + 3),
        { fallingCtrPlatforms: input.fallingCtrPlatforms }
      )
    );
  }

  if (input.negativeSentimentThreads > 0) {
    risks.push(
      signal(
        "digital-negative-sentiment",
        "digital",
        "Negative sentiment pressure",
        `${input.negativeSentimentThreads} digital threads may require response handling.`,
        "risk",
        Math.min(10, input.negativeSentimentThreads + 2),
        { negativeSentimentThreads: input.negativeSentimentThreads }
      )
    );
  }

  if (input.strongPerformingPlatforms > 0) {
    opportunities.push(
      signal(
        "digital-strong-platforms",
        "digital",
        "Strong platform opportunity",
        `${input.strongPerformingPlatforms} digital platforms are outperforming and may deserve more investment.`,
        "opportunity",
        Math.min(10, input.strongPerformingPlatforms + 2),
        { strongPerformingPlatforms: input.strongPerformingPlatforms }
      )
    );
  }

  statuses.push(
    signal(
      "digital-content-backlog",
      "digital",
      "Content backlog",
      `${input.contentBacklogCount} content items are still in drafting or review.`,
      "status",
      Math.min(10, input.contentBacklogCount + 1),
      { contentBacklogCount: input.contentBacklogCount }
    )
  );

  const pressureScore = clampScore(
    risks.reduce((sum, item) => sum + item.score, 0) / Math.max(risks.length, 1)
  );

  return {
    domain: "digital",
    pressureScore,
    risks,
    opportunities,
    statuses,
    suggestedActions: [
      "Refresh underperforming creative before efficiency drops further.",
      "Shift budget into the strongest-performing platform.",
      "Route strong digital messaging into field and outreach talking points.",
    ],
  };
}

export function getPrintSignals(input: PrintSignalInput): DomainSignalBundle {
  const risks: AetherSignal[] = [];
  const opportunities: AetherSignal[] = [];
  const statuses: AetherSignal[] = [];

  if (input.approvalBlocks > 0) {
    risks.push(
      signal(
        "print-approval-blocks",
        "print",
        "Approval bottleneck",
        `${input.approvalBlocks} print assets are blocked waiting for approval.`,
        "risk",
        Math.min(10, input.approvalBlocks + 3),
        { approvalBlocks: input.approvalBlocks }
      )
    );
  }

  if (input.nearReorderItems > 0) {
    risks.push(
      signal(
        "print-reorder-risk",
        "print",
        "Inventory depletion risk",
        `${input.nearReorderItems} print inventory items are near reorder threshold.`,
        "risk",
        Math.min(10, input.nearReorderItems + 2),
        { nearReorderItems: input.nearReorderItems }
      )
    );
  }

  if (input.readyAssets > 0) {
    opportunities.push(
      signal(
        "print-ready-assets",
        "print",
        "Ready-to-deploy assets",
        `${input.readyAssets} print assets are ready to move into production or deployment.`,
        "opportunity",
        Math.min(10, input.readyAssets + 1),
        { readyAssets: input.readyAssets }
      )
    );
  }

  statuses.push(
    signal(
      "print-delivery-risks",
      "print",
      "Delivery timing pressure",
      `${input.deliveryRisks} active print deliveries may need tracking or confirmation.`,
      "status",
      Math.min(10, input.deliveryRisks + 1),
      { deliveryRisks: input.deliveryRisks }
    )
  );

  const pressureScore = clampScore(
    risks.reduce((sum, item) => sum + item.score, 0) / Math.max(risks.length, 1)
  );

  return {
    domain: "print",
    pressureScore,
    risks,
    opportunities,
    statuses,
    suggestedActions: [
      "Clear approval bottlenecks before production timing slips.",
      "Protect inventory before field teams run short on materials.",
      "Confirm deliveries early enough to trigger downstream field activation.",
    ],
  };
}