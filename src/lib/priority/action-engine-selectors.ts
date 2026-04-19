import {
  ActionBucket,
  ActionEngineResult,
  ActionItem,
} from "@/lib/priority/action-engine";
import {
  buildDomainScores,
  getDomainPriorityHeadline,
  getDomainPrioritySubheadline,
  type DomainScore,
} from "@/lib/priority/domain-priority";

export interface ActionEngineHeroData {
  headline: string;
  subheadline: string;
  primaryAction: ActionItem | null;
}

export interface ActionEngineDomainData {
  headline: string;
  subheadline: string;
  topDomain: DomainScore | null;
  domains: DomainScore[];
}

export interface ActionEnginePageData {
  hero: ActionEngineHeroData;
  domainPriority: ActionEngineDomainData;
  topActions: ActionItem[];
  buckets: Record<ActionBucket, ActionItem[]>;
}

function getImmediateActions(result: ActionEngineResult): ActionItem[] {
  return result.buckets.fix_now.slice(0, 5);
}

function getTopActionsByBucket(
  result: ActionEngineResult,
  bucket: ActionBucket,
  limit = 5
): ActionItem[] {
  return result.buckets[bucket]?.slice(0, limit) ?? [];
}
function buildHero(result: ActionEngineResult): ActionEngineHeroData {
  const immediate = getImmediateActions(result);

  if (immediate.length === 0) {
    return {
      headline: "System is stable",
      subheadline: "No urgent actions detected. Continue monitoring.",
      primaryAction: null,
    };
  }

  const primary = immediate[0];

  return {
    headline: "Immediate action required",
    subheadline: primary.summary,
    primaryAction: primary,
  };
}

function buildDomainPriority(result: ActionEngineResult): ActionEngineDomainData {
  const domains = buildDomainScores(result.actions);
  const topDomain = domains[0] ?? null;

  return {
    headline: getDomainPriorityHeadline(result.actions),
    subheadline: getDomainPrioritySubheadline(result.actions),
    topDomain,
    domains,
  };
}
export function getActionEnginePageData(
  result: ActionEngineResult
): ActionEnginePageData {
  return {
    hero: buildHero(result),
    domainPriority: buildDomainPriority(result),
    topActions: result.topActions.slice(0, 10),
    buckets: result.buckets,
  };
}
export function getTopDomainPriority(
  result: ActionEngineResult
): DomainScore | null {
  return buildDomainPriority(result).topDomain;
}