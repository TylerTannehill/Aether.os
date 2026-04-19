// src/lib/abe/abe-briefing.ts

import { AbeDepartment } from "./abe-memory";

export type AbeBriefing = {
  health: string;
  strongest: AbeDepartment;
  weakest: AbeDepartment;
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  campaignStatus: string;
  whyNow: string;
  supportText: string;
  actions: string[];
  crossDomainSignal?: string;
};