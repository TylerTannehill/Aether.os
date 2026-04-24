import {
  Contact,
  ContactDonorIntelligence,
  ContributionRecord,
  FecContactMatch,
  FecDonorTier,
  FecMatchStatus,
  FecRawRecord,
  JackpotAnomalyType,
  OutreachLog,
  PledgeRecord,
} from "@/lib/data/types";

type DonorTierInput = {
  fecTotalGiven?: number | null;
  directContributionTotal?: number | null;
};

type JackpotInput = {
  donorTier: FecDonorTier;
  fecTotalGiven?: number | null;
  fecLastDonationDate?: string | null;
  fecRecentActivity?: boolean | null;
  activePledgeTotal?: number | null;
  nonCompliantContributionCount?: number | null;
  latestLog?: OutreachLog | null;
};

type BuildContactDonorIntelligenceInput = {
  contact: Contact | null;
  contributionHistory?: ContributionRecord[];
  pledgeHistory?: PledgeRecord[];
  latestLog?: OutreachLog | null;
  fecMatches?: FecContactMatch[];
  fecRecords?: FecRawRecord[];
};

export function formatFecMatchStatus(
  status?: FecMatchStatus | null
): string {
  switch (status) {
    case "matched":
      return "Matched";
    case "probable":
      return "Probable";
    case "unresolved":
      return "Unresolved";
    case "none":
    default:
      return "No Match";
  }
}

export function formatDonorTier(tier?: FecDonorTier | null): string {
  switch (tier) {
    case "maxed":
      return "Maxed";
    case "major":
      return "Major";
    case "mid":
      return "Mid-Level";
    case "base":
      return "Base";
    case "none":
    default:
      return "None";
  }
}

export function getFecMatchStatusFromConfidence(
  confidenceScore?: number | null
): FecMatchStatus {
  if (confidenceScore === null || confidenceScore === undefined) {
    return "none";
  }

  if (confidenceScore >= 90) return "matched";
  if (confidenceScore >= 65) return "probable";
  if (confidenceScore > 0) return "unresolved";

  return "none";
}

export function calculateFecTotalGiven(records: FecRawRecord[] = []): number {
  return records.reduce((sum, record) => {
    return sum + Number(record.donation_amount || 0);
  }, 0);
}

export function getLastFecDonationDate(
  records: FecRawRecord[] = []
): string | null {
  if (!records.length) return null;

  const sorted = [...records].sort((a, b) => {
    return (
      new Date(b.donation_date).getTime() -
      new Date(a.donation_date).getTime()
    );
  });

  return sorted[0]?.donation_date || null;
}

export function hasRecentFecActivity(
  lastDonationDate?: string | null,
  windowDays = 180
): boolean {
  if (!lastDonationDate) return false;

  const lastDate = new Date(lastDonationDate);
  if (Number.isNaN(lastDate.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= windowDays;
}

export function calculateDonorTier(input: DonorTierInput): FecDonorTier {
  const total = Math.max(
    Number(input.fecTotalGiven || 0),
    Number(input.directContributionTotal || 0)
  );

  if (total >= 6600) return "maxed";
  if (total >= 2500) return "major";
  if (total >= 500) return "mid";
  if (total > 0) return "base";

  return "none";
}

export function getBestFecMatch(
  matches: FecContactMatch[] = []
): FecContactMatch | null {
  if (!matches.length) return null;

  return [...matches].sort((a, b) => {
    return Number(b.confidence_score || 0) - Number(a.confidence_score || 0);
  })[0];
}

export function detectJackpotAnomaly(input: JackpotInput): {
  jackpot_candidate: boolean;
  jackpot_anomaly_type: JackpotAnomalyType;
  jackpot_reason: string | null;
} {
  const fecTotalGiven = Number(input.fecTotalGiven || 0);
  const activePledgeTotal = Number(input.activePledgeTotal || 0);
  const nonCompliantContributionCount = Number(
    input.nonCompliantContributionCount || 0
  );

  const hasLatestLog = Boolean(input.latestLog);

  if (activePledgeTotal > 0 && nonCompliantContributionCount > 0) {
    return {
      jackpot_candidate: true,
      jackpot_anomaly_type: "pledge_gap",
      jackpot_reason:
        "Active pledge and compliance pressure make this contact worth working now.",
    };
  }

  if (
    input.fecRecentActivity &&
    input.donorTier !== "none" &&
    !hasLatestLog
  ) {
    return {
      jackpot_candidate: true,
      jackpot_anomaly_type: "recent_external_giving",
      jackpot_reason:
        "Recent giving activity is visible, but this contact has no recent outreach touch.",
    };
  }

  if (fecTotalGiven >= 2500 && !hasLatestLog) {
    return {
      jackpot_candidate: true,
      jackpot_anomaly_type: "high_value_unworked",
      jackpot_reason:
        "High giving capacity is visible, but recent outreach is not.",
    };
  }

  if (fecTotalGiven >= 2500 && input.donorTier === "major") {
    return {
      jackpot_candidate: true,
      jackpot_anomaly_type: "dormant_high_value_donor",
      jackpot_reason:
        "Major donor capacity is present and should be protected from going cold.",
    };
  }

  if (nonCompliantContributionCount > 0) {
    return {
      jackpot_candidate: true,
      jackpot_anomaly_type: "compliance_blocked",
      jackpot_reason:
        "Compliance cleanup is blocking a cleaner donor read on this contact.",
    };
  }

  return {
    jackpot_candidate: false,
    jackpot_anomaly_type: "none",
    jackpot_reason: null,
  };
}

export function buildContactDonorIntelligence(
  input: BuildContactDonorIntelligenceInput
): ContactDonorIntelligence {
  const {
    contact,
    contributionHistory = [],
    pledgeHistory = [],
    latestLog = null,
    fecMatches = [],
    fecRecords = [],
  } = input;

  if (contact?.donor_intelligence) {
    return contact.donor_intelligence;
  }

  const directContributionTotal = contributionHistory.reduce(
    (sum, contribution) => sum + Number(contribution.amount || 0),
    0
  );

  const activePledgeTotal = pledgeHistory
    .filter((pledge) => pledge.status !== "converted")
    .reduce((sum, pledge) => sum + Number(pledge.amount || 0), 0);

  const nonCompliantContributionCount = contributionHistory.filter(
    (contribution) => !contribution.compliant
  ).length;

  const bestMatch = getBestFecMatch(fecMatches);
  const fecTotalGiven =
    Number(contact?.fec_total_given || 0) || calculateFecTotalGiven(fecRecords);

  const fecLastDonationDate =
    contact?.fec_last_donation_date || getLastFecDonationDate(fecRecords);

  const fecRecentActivity =
    contact?.fec_recent_activity ?? hasRecentFecActivity(fecLastDonationDate);

  const confidenceScore =
    contact?.fec_confidence_score ?? bestMatch?.confidence_score ?? null;

  const matchStatus =
    contact?.fec_match_status ||
    bestMatch?.match_status ||
    getFecMatchStatusFromConfidence(confidenceScore);

  const donorTier =
    contact?.fec_donor_tier ||
    calculateDonorTier({
      fecTotalGiven,
      directContributionTotal,
    });

  const jackpot = detectJackpotAnomaly({
    donorTier,
    fecTotalGiven,
    fecLastDonationDate,
    fecRecentActivity,
    activePledgeTotal,
    nonCompliantContributionCount,
    latestLog,
  });

  return {
    fec_match_status: matchStatus,
    fec_confidence_score: confidenceScore,
    fec_total_given: fecTotalGiven || directContributionTotal || null,
    fec_last_donation_date: fecLastDonationDate,
    fec_recent_activity: fecRecentActivity,
    fec_donor_tier: donorTier,
    jackpot_candidate: contact?.jackpot_candidate ?? jackpot.jackpot_candidate,
    jackpot_anomaly_type:
      contact?.jackpot_anomaly_type ?? jackpot.jackpot_anomaly_type,
    jackpot_reason: contact?.jackpot_reason ?? jackpot.jackpot_reason,
  };
}

export function buildDonorOpportunitySummary(
  intelligence: ContactDonorIntelligence
): string {
  if (intelligence.jackpot_candidate && intelligence.jackpot_reason) {
    return intelligence.jackpot_reason;
  }

  if (intelligence.fec_donor_tier === "maxed") {
    return "This contact appears to be a maxed donor; protect relationship quality and compliance.";
  }

  if (intelligence.fec_donor_tier === "major") {
    return "This contact has major donor capacity and should stay visible to finance.";
  }

  if (intelligence.fec_recent_activity) {
    return "Recent giving activity is visible; consider timely follow-up.";
  }

  if (intelligence.fec_match_status === "unresolved") {
    return "FEC match is unresolved; review before using this donor signal.";
  }

  return "No urgent donor anomaly is active right now.";
}
