// src/lib/abe/update-abe-memory.ts

import {
  AbeGlobalMemory,
  appendRecentDepartment,
  appendRecentSignal,
} from "./abe-memory";
import { AbeBriefing } from "./abe-briefing";

export function updateAbeMemory(
  current: AbeGlobalMemory,
  briefing: AbeBriefing
): AbeGlobalMemory {
  return {
    previousPrimaryLane: current.recentPrimaryLanes.at(-1),
    previousStrongest: current.recentOpportunityLanes.at(-1),
    previousWeakest: current.recentPressureLanes.at(-1),
    previousHealth: briefing.health,
    previousCampaignStatus: briefing.campaignStatus,

    recentPrimaryLanes: appendRecentDepartment(
      current.recentPrimaryLanes,
      briefing.primaryLane
    ),
    recentPressureLanes: appendRecentDepartment(
      current.recentPressureLanes,
      briefing.weakest
    ),
    recentOpportunityLanes: appendRecentDepartment(
      current.recentOpportunityLanes,
      briefing.opportunityLane
    ),
    recentCrossDomainSignals: appendRecentSignal(
      current.recentCrossDomainSignals,
      briefing.crossDomainSignal
    ),
  };
}