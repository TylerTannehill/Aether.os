import {
  CommandCenterAlert,
  CommandCenterFocusItem,
  CommandCenterMetricCard,
  CommandCenterSnapshot,
  getPrimaryCommandCenterAlert,
  getTopFocusByLevel,
  getTopOwnerRisks,
} from "@/lib/priority/command-center";
import { PriorityLevel } from "@/lib/priority/priority-engine";
import { OwnerSignalsResult } from "@/lib/priority/owner-signals";

export interface CommandCenterHeroData {
  primaryAlert: CommandCenterAlert | null;
  headline: string;
  subheadline: string;
  action: string;
}

export interface CommandCenterOverviewData {
  metricCards: CommandCenterMetricCard[];
  totalAlerts: number;
  totalFocusItems: number;
  criticalCount: number;
  highCount: number;
  criticalOwnerCount: number;
  highRiskOwnerCount: number;
}

export interface CommandCenterRiskBoardData {
  highestRiskOwners: OwnerSignalsResult[];
  criticalFocusItems: CommandCenterFocusItem[];
  highFocusItems: CommandCenterFocusItem[];
}

export interface CommandCenterExecutionData {
  topAlerts: CommandCenterAlert[];
  topFocus: CommandCenterFocusItem[];
  redistributionTargets: OwnerSignalsResult[];
}

function fallbackHeadline(snapshot: CommandCenterSnapshot): string {
  if (snapshot.summary.criticalCount > 0) {
    return `${snapshot.summary.criticalCount} critical item(s) need attention`;
  }

  if (snapshot.summary.highCount > 0) {
    return `${snapshot.summary.highCount} high-priority item(s) are active`;
  }

  if (snapshot.summary.highRiskOwnerCount > 0) {
    return `${snapshot.summary.highRiskOwnerCount} owner queue(s) are under pressure`;
  }

  return "System is stable";
}

function fallbackSubheadline(snapshot: CommandCenterSnapshot): string {
  if (snapshot.metricCards.length > 0) {
    const topMetric = [...snapshot.metricCards].sort((a, b) => b.value - a.value)[0];
    if (topMetric) {
      return `${topMetric.label}: ${topMetric.value} • ${topMetric.detail}`;
    }
  }

  return "No major command-center alerts detected";
}
export function getCommandCenterHeroData(
  snapshot: CommandCenterSnapshot,
): CommandCenterHeroData {
  const primaryAlert = getPrimaryCommandCenterAlert(snapshot);

  if (primaryAlert) {
    return {
      primaryAlert,
      headline: primaryAlert.title,
      subheadline: primaryAlert.message,
      action: primaryAlert.action,
    };
  }

  return {
    primaryAlert: null,
    headline: fallbackHeadline(snapshot),
    subheadline: fallbackSubheadline(snapshot),
    action: "Review command center",
  };
}

export function getCommandCenterOverviewData(
  snapshot: CommandCenterSnapshot,
): CommandCenterOverviewData {
  return {
    metricCards: snapshot.metricCards,
    totalAlerts: snapshot.alerts.length,
    totalFocusItems: snapshot.topFocus.length,
    criticalCount: snapshot.summary.criticalCount,
    highCount: snapshot.summary.highCount,
    criticalOwnerCount: snapshot.summary.criticalOwnerCount,
    highRiskOwnerCount: snapshot.summary.highRiskOwnerCount,
  };
}

export function getCommandCenterRiskBoardData(
  snapshot: CommandCenterSnapshot,
): CommandCenterRiskBoardData {
  return {
    highestRiskOwners: getTopOwnerRisks(snapshot, 6),
    criticalFocusItems: getTopFocusByLevel(snapshot, "critical", 8),
    highFocusItems: getTopFocusByLevel(snapshot, "high", 8),
  };
}

export function getCommandCenterExecutionData(
  snapshot: CommandCenterSnapshot,
): CommandCenterExecutionData {
  return {
    topAlerts: snapshot.alerts.slice(0, 8),
    topFocus: snapshot.topFocus.slice(0, 12),
    redistributionTargets: snapshot.redistributionTargets.slice(0, 6),
  };
}
export function getFocusItemsByLevel(
  snapshot: CommandCenterSnapshot,
  level: PriorityLevel,
  limit = 10,
): CommandCenterFocusItem[] {
  return snapshot.topFocus.filter((item) => item.level === level).slice(0, limit);
}

export function getAlertsByLevel(
  snapshot: CommandCenterSnapshot,
  level: PriorityLevel,
  limit = 10,
): CommandCenterAlert[] {
  return snapshot.alerts.filter((alert) => alert.level === level).slice(0, limit);
}

export function getMetricCardById(
  snapshot: CommandCenterSnapshot,
  metricId: string,
): CommandCenterMetricCard | null {
  return snapshot.metricCards.find((card) => card.id === metricId) ?? null;
}

export function getHighestRiskOwner(
  snapshot: CommandCenterSnapshot,
): OwnerSignalsResult | null {
  return snapshot.ownerRisks.length ? snapshot.ownerRisks[0] : null;
}

export function getHealthyRedistributionTargets(
  snapshot: CommandCenterSnapshot,
  limit = 5,
): OwnerSignalsResult[] {
  return snapshot.redistributionTargets.slice(0, limit);
}
export function getCommandCenterPageData(snapshot: CommandCenterSnapshot) {
  return {
    hero: getCommandCenterHeroData(snapshot),
    overview: getCommandCenterOverviewData(snapshot),
    riskBoard: getCommandCenterRiskBoardData(snapshot),
    execution: getCommandCenterExecutionData(snapshot),
  };
}

export function hasCommandCenterPressure(snapshot: CommandCenterSnapshot): boolean {
  return (
    snapshot.summary.criticalCount > 0 ||
    snapshot.summary.highCount > 0 ||
    snapshot.summary.criticalOwnerCount > 0 ||
    snapshot.summary.highRiskOwnerCount > 0
  );
}

export function isCommandCenterStable(snapshot: CommandCenterSnapshot): boolean {
  return !hasCommandCenterPressure(snapshot);
}