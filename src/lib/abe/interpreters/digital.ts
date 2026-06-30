import {
  AbeBriefing,
} from "@/lib/abe/abe-briefing";
import {
  AbeDepartment,
} from "@/lib/abe/abe-memory";
import { buildAbeOrgLayer, getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";


type DemoRole = "admin" | "director" | "general_user";

type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type PlatformKey = "meta" | "instagram" | "x" | "tiktok" | "unknown";

type PlatformMetric = {
  key: PlatformKey;
  label: string;
  impressions: number;
  engagement: number;
  spend: number;
  positive: number;
  negative: number;
  ctr: number;
};

type ContentDrop = {
  id: string;
  title: string;
  platform: string;
  audience: string;
  goal: string;
  narrative: string;
  createdAt: string;
};

type EngagementSpike = {
  id: string;
  platform: string;
  budgetShift: string;
  audience: string;
  goal: string;
  narrative: string;
  createdAt: string;
};

type SentimentShift = {
  id: string;
  platform: string;
  tone: string;
  audience: string;
  goal: string;
  narrative: string;
  createdAt: string;
};

type FocusTask = {
  id: string;
  title: string;
  type: "content" | "spend" | "reply";
  priority: "high" | "medium" | "low";
  summary: string;
};


function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

export function buildDigitalBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  platformMetrics: PlatformMetric[];
  contentDrops: ContentDrop[];
  engagementSpikes: EngagementSpike[];
  sentimentShifts: SentimentShift[];
  sentimentSnapshot: { positive: number; negative: number };
  selectedTask: FocusTask | null;
}): AbeBriefing {
  const bestPlatform =
    [...input.platformMetrics].sort((a, b) => b.engagement - a.engagement)[0] ??
    input.platformMetrics[0];

  const weakestSentimentPlatform =
    [...input.platformMetrics].sort((a, b) => b.negative - a.negative)[0] ??
    input.platformMetrics[0];

  const strongest: AbeDepartment =
    input.engagementSpikes.length > 0 || input.sentimentSnapshot.positive >= 70
      ? "digital"
      : "outreach";

  const weakest: AbeDepartment =
    weakestSentimentPlatform?.key === "x" ||
    input.sentimentSnapshot.negative >= 35
      ? "digital"
      : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? "digital"
      : input.demoDepartment === "digital"
      ? "digital"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.engagementSpikes.length > 0 || bestPlatform?.key === "tiktok"
      ? "digital"
      : "outreach";

  let health = "Stable overall";
  if (input.sentimentSnapshot.negative >= 35) {
    health = "Pressure is rising";
  } else if (
    input.sentimentSnapshot.positive >= 70 ||
    input.engagementSpikes.length > 0
  ) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (input.contentDrops.length > 0 && input.engagementSpikes.length > 0) {
    campaignStatus = "Stable with opportunity";
  } else if (input.sentimentShifts.length > 0) {
    campaignStatus = "Narrative pressure is active";
  } else if (input.sentimentSnapshot.negative >= 35) {
    campaignStatus = "Sentiment pressure is rising";
  }

  let whyNow =
    "Digital momentum is moving, but content quality, spend allocation, and response handling will determine whether it keeps working.";

  if (input.engagementSpikes.length > 0) {
    whyNow =
      "A strong-performing platform is pulling ahead, so digital should reinforce that winner while engagement is active.";
  } else if (input.contentDrops.length > 0) {
    whyNow =
      "Fresh creative has entered the system, which means digital should monitor performance closely and amplify what works.";
  } else if (input.sentimentShifts.length > 0) {
    whyNow =
      "Narrative pressure is active, so digital needs tighter response handling before weak sentiment spreads further.";
  } else if (weakestSentimentPlatform?.key === "x") {
    whyNow =
      "X is weaker on sentiment than the rest of the lane, which means digital should protect momentum while containing the weakest response channel.";
  }

  const crossDomainSignal =
    input.engagementSpikes.length > 0
      ? "DIGITAL momentum is active and may need downstream OUTREACH capture if it keeps building."
      : undefined;

  const orgLayer = buildAbeOrgLayer({
    lanes: [
      {
        department: "digital",
        strongest,
        weakest,
        primaryLane,
        opportunityLane,
        health,
        campaignStatus,
        whyNow,
        crossDomainSignal,
      },
      {
        department: "outreach",
        strongest: input.engagementSpikes.length > 0 ? "outreach" : "digital",
        weakest: input.sentimentShifts.length > 0 ? "outreach" : "digital",
        primaryLane: "outreach",
        opportunityLane: input.engagementSpikes.length > 0 ? "outreach" : "digital",
        health:
          input.engagementSpikes.length > 0 ? "Momentum building" : "Stable overall",
        campaignStatus:
          input.engagementSpikes.length > 0
            ? "Stable with downstream capture opportunity"
            : "Stable overall",
        whyNow:
          input.engagementSpikes.length > 0
            ? "Digital movement may need downstream outreach capture while engagement is active."
            : "Outreach remains the downstream conversion lane for digital movement.",
        crossDomainSignal,
      },
    ],
  });

  const orgContext = getOrgContextForDepartment(orgLayer, "digital");

  const whyNowModifiers:string[] = [];

  if (orgContext.departmentIsPressureLeader) {
    whyNowModifiers.push("Digital is carrying more of the broader campaign pressure picture right now.");
  } else if (orgContext.departmentIsMomentumLeader) {
    whyNowModifiers.push("Digital is doing more of the broader momentum-building work right now.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  const supportTextBase =
    input.role === "admin"
      ? "Use Digital Focus to shape allocation and protect momentum."
      : input.role === "director"
      ? "Use Digital Focus to manage pressure and reinforce momentum."
      : "Keep the next digital action clear and easy to execute.";

  const supportText = `${supportTextBase} ${orgContext.orgSupportLine}`;

  const actions: string[] = [];

  if (bestPlatform && bestPlatform.engagement > 0) {
    actions.push(`Review ${bestPlatform.label} while engagement is strongest.`);
  }

  if (weakestSentimentPlatform && weakestSentimentPlatform.negative > 0) {
    actions.push(`Tighten response handling on ${weakestSentimentPlatform.label} before sentiment spreads.`);
  }

  if (input.selectedTask) {
    actions.push(input.selectedTask.summary);
  } else {
    actions.push("Upload digital metrics to activate the next digital action.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next digital action tight and move to the next signal.");
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
    actions: actions
      .filter((action, index, array) => array.indexOf(action) === index)
      .slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal,
  };
}

