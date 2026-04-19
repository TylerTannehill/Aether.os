import {
  AetherDomain,
  AetherSignal,
  DomainSignalBundle,
} from "./signals";
import {
  buildCrossDomainLinks,
  CrossDomainContext,
  CrossDomainLink,
} from "./cross-domain";

export type AetherSystemSnapshot = {
  topDomains: Array<{
    domain: AetherDomain;
    pressureScore: number;
  }>;
  topSignals: AetherSignal[];
  crossDomainLinks: CrossDomainLink[];
  systemRiskLevel: number;
  summary: {
    totalRisks: number;
    totalOpportunities: number;
    totalStatuses: number;
  };
};

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function aggregateAetherIntelligence(
  bundles: DomainSignalBundle[],
  crossDomainContext: CrossDomainContext
): AetherSystemSnapshot {
  const topDomains = [...bundles]
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .map((bundle) => ({
      domain: bundle.domain,
      pressureScore: bundle.pressureScore,
    }));

  const allRisks = bundles.flatMap((bundle) => bundle.risks);
  const allOpportunities = bundles.flatMap((bundle) => bundle.opportunities);
  const allStatuses = bundles.flatMap((bundle) => bundle.statuses);

  const topSignals = [...allRisks, ...allOpportunities, ...allStatuses]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const crossDomainLinks = buildCrossDomainLinks(
    crossDomainContext,
    bundles
  );

  const systemRiskLevel = clampScore(
    allRisks.reduce((sum, item) => sum + item.score, 0) /
      Math.max(allRisks.length, 1)
  );

  return {
    topDomains,
    topSignals,
    crossDomainLinks,
    systemRiskLevel,
    summary: {
      totalRisks: allRisks.length,
      totalOpportunities: allOpportunities.length,
      totalStatuses: allStatuses.length,
    },
  };
}

export function buildAetherSummaryText(snapshot: AetherSystemSnapshot) {
  const topDomain = snapshot.topDomains[0];
  const topSignal = snapshot.topSignals[0];
  const topLink = snapshot.crossDomainLinks[0];

  return {
    headline: topDomain
      ? `${topDomain.domain.toUpperCase()} is carrying the most pressure right now.`
      : "System pressure is currently low.",

    body: topSignal
      ? `${topSignal.description}`
      : "No major signals are currently surfaced by the system.",

    crossDomain: topLink
      ? `${topLink.from.toUpperCase()} is affecting ${topLink.to.toUpperCase()}: ${topLink.action}`
      : "No major cross-domain dependency is currently surfaced.",

    risk: `System risk level is ${snapshot.systemRiskLevel}/10 with ${snapshot.summary.totalRisks} active risks detected.`,
  };
}