"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  Clock3,
  MessageSquare,
  Megaphone,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  AbeDepartment,
  AbeGlobalMemory,
  AbePatternInsight,
  departmentLabel,
} from "@/lib/abe/abe-memory";
import { buildAbePatternInsights } from "@/lib/abe/abe-patterns";
import { filterPatternsForDepartment } from "@/lib/abe/abe-filters";
import { AbeBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";
import { buildAbeOrgLayer, getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";
import { getOrgContextTheme } from "@/lib/org-context-theme";
import {
  getDigitalPlatformRows,
  type DigitalPlatformRow,
} from "@/lib/data/digital";
import {
  getDashboardStateTone,
  getDashboardStateTextTone,
  getDepartmentHealthState,
} from "@/lib/intelligence/dashboard-tones";

type PlatformKey = "meta" | "instagram" | "x" | "tiktok" | "unknown";
type TrendView = "impressions" | "engagement" | "spend" | "sentiment";

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

type ContentItem = {
  id: string;
  title: string;
  platform: PlatformKey;
  status: "drafting" | "review" | "scheduled" | "live";
  publish_at?: string | null;
  owner: string;
};

type FocusTask = {
  id: string;
  title: string;
  type: "content" | "spend" | "reply";
  priority: "high" | "medium" | "low";
  summary: string;
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

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});


function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizePlatform(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function platformKeyFromValue(value?: string | null): PlatformKey {
  const normalized = normalizePlatform(value);

  if (normalized === "meta" || normalized === "facebook") return "meta";
  if (normalized === "instagram" || normalized === "ig") return "instagram";
  if (normalized === "x" || normalized === "twitter") return "x";
  if (normalized === "tiktok" || normalized === "tik tok") return "tiktok";

  return "unknown";
}

function platformLabelFromKey(key: PlatformKey, fallback?: string | null) {
  if (key === "meta") return "Meta";
  if (key === "instagram") return "Instagram";
  if (key === "x") return "X";
  if (key === "tiktok") return "TikTok";

  return fallback?.trim() || "Unknown";
}

function buildPlatformMetrics(rows: DigitalPlatformRow[]): PlatformMetric[] {
  const grouped = new Map<
    PlatformKey,
    {
      key: PlatformKey;
      label: string;
      impressions: number;
      engagement: number;
      spend: number;
      positiveTotal: number;
      negativeTotal: number;
      ctrTotal: number;
      sentimentRows: number;
      ctrRows: number;
    }
  >();

  for (const row of rows) {
    const key = platformKeyFromValue(row.platform);
    const existing =
      grouped.get(key) ??
      {
        key,
        label: platformLabelFromKey(key, row.platform),
        impressions: 0,
        engagement: 0,
        spend: 0,
        positiveTotal: 0,
        negativeTotal: 0,
        ctrTotal: 0,
        sentimentRows: 0,
        ctrRows: 0,
      };

    existing.impressions += toNumber(row.impressions);
    existing.engagement += toNumber(row.engagement);
    existing.spend += toNumber(row.spend);

    if (row.positive_sentiment !== null || row.negative_sentiment !== null) {
      existing.positiveTotal += toNumber(row.positive_sentiment);
      existing.negativeTotal += toNumber(row.negative_sentiment);
      existing.sentimentRows += 1;
    }

    if (row.ctr !== null) {
      existing.ctrTotal += toNumber(row.ctr);
      existing.ctrRows += 1;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      key: item.key,
      label: item.label,
      impressions: item.impressions,
      engagement: item.engagement,
      spend: item.spend,
      positive:
        item.sentimentRows > 0
          ? Math.round(item.positiveTotal / item.sentimentRows)
          : 0,
      negative:
        item.sentimentRows > 0
          ? Math.round(item.negativeTotal / item.sentimentRows)
          : 0,
      ctr:
        item.ctrRows > 0
          ? Number((item.ctrTotal / item.ctrRows).toFixed(1))
          : 0,
    }))
    .sort(
      (a, b) =>
        b.engagement + b.impressions / 100 - (a.engagement + a.impressions / 100)
    );
}

function buildChartData(rows: DigitalPlatformRow[]) {
  return rows
    .slice(0, 4)
    .reverse()
    .map((row, index) => ({
      label: row.created_at
        ? new Date(row.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : `Entry ${index + 1}`,
      impressions: toNumber(row.impressions),
      engagement: toNumber(row.engagement),
      spend: toNumber(row.spend),
      sentiment: Math.max(
        0,
        toNumber(row.positive_sentiment) - toNumber(row.negative_sentiment)
      ),
    }));
}

function buildFocusQueueFromMetrics(platformMetrics: PlatformMetric[]): FocusTask[] {
  const tasks: FocusTask[] = [];

  const strongestEngagement = [...platformMetrics].sort(
    (a, b) => b.engagement - a.engagement
  )[0];

  const weakestSentiment = [...platformMetrics].sort(
    (a, b) => b.negative - a.negative
  )[0];

  const inefficientSpend = [...platformMetrics]
    .filter((platform) => platform.spend > 0)
    .sort((a, b) => {
      const aEfficiency = a.engagement / Math.max(a.spend, 1);
      const bEfficiency = b.engagement / Math.max(b.spend, 1);
      return aEfficiency - bEfficiency;
    })[0];

  if (strongestEngagement && strongestEngagement.engagement > 0) {
    tasks.push({
      id: `focus-amplify-${strongestEngagement.key}`,
      title: `Review ${strongestEngagement.label} momentum`,
      type: "spend",
      priority: "high",
      summary: `${strongestEngagement.label} is carrying the strongest engagement signal in the current uploaded data.`,
    });
  }

  if (weakestSentiment && weakestSentiment.negative > 0) {
    tasks.push({
      id: `focus-sentiment-${weakestSentiment.key}`,
      title: `Review ${weakestSentiment.label} sentiment pressure`,
      type: "reply",
      priority: weakestSentiment.negative >= 35 ? "high" : "medium",
      summary: `${weakestSentiment.label} has the highest negative sentiment in the current uploaded data.`,
    });
  }

  if (inefficientSpend && inefficientSpend.spend > 0) {
    tasks.push({
      id: `focus-efficiency-${inefficientSpend.key}`,
      title: `Audit ${inefficientSpend.label} spend efficiency`,
      type: "spend",
      priority: "medium",
      summary: `${inefficientSpend.label} has spend attached and should be checked against engagement efficiency.`,
    });
  }

  return tasks.slice(0, 3);
}

function getBestSpendCandidate(platformMetrics: PlatformMetric[]) {
  const winner = [...platformMetrics].sort((a, b) => {
    const aScore = a.engagement / Math.max(a.spend, 1);
    const bScore = b.engagement / Math.max(b.spend, 1);
    return bScore - aScore;
  })[0];

  return winner?.label || "No platform data";
}

function getCreativeRefreshCandidate(platformMetrics: PlatformMetric[]) {
  const candidate = [...platformMetrics].sort((a, b) => a.ctr - b.ctr)[0];
  return candidate?.label || "No platform data";
}

function getWeakestSentimentCandidate(platformMetrics: PlatformMetric[]) {
  const candidate = [...platformMetrics].sort((a, b) => b.negative - a.negative)[0];
  return candidate?.label || "No platform data";
}

function getDigitalStatState(input: {
  id: string;
  impressions: number;
  engagement: number;
  spend: number;
  sentimentNegative: number;
}) {
  if (input.id === "sentiment") {
    return getDepartmentHealthState({
      pressure: input.sentimentNegative,
      opportunity: Math.max(0, 100 - input.sentimentNegative),
    });
  }

  if (input.id === "spend") {
    return getDepartmentHealthState({
      pressure: input.spend > 0 ? Math.round(input.spend / 1000) : 0,
      opportunity:
        input.engagement > 0 ? Math.round(input.engagement / 5000) : 0,
    });
  }

  if (input.id === "engagement") {
    return getDepartmentHealthState({
      pressure: input.engagement > 0 ? 1 : 2,
      opportunity:
        input.engagement > 0 ? Math.round(input.engagement / 5000) : 0,
    });
  }

  return getDepartmentHealthState({
    pressure: input.impressions > 0 ? 1 : 2,
    opportunity:
      input.impressions > 0 ? Math.round(input.impressions / 5000) : 0,
  });
}


function platformTone(platform: PlatformKey) {
  switch (platform) {
    case "meta":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "instagram":
      return "bg-pink-100 text-pink-700 border border-pink-200";
    case "x":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "tiktok":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function statusTone(status: ContentItem["status"]) {
  switch (status) {
    case "drafting":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "review":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "scheduled":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "live":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function priorityTone(priority: FocusTask["priority"]) {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function patternSeverityTone(severity: AbePatternInsight["severity"]) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "important":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "watch":
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function getRoleLabel(role: DemoRole) {
  if (role === "admin") return "Admin View";
  if (role === "director") return "Director View";
  return "Operator View";
}

function getDepartmentLabel(department: DemoDepartment) {
  switch (department) {
    case "finance":
      return "Finance";
    case "field":
      return "Field";
    case "digital":
      return "Digital";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

function getDigitalAbeBriefing(input: {
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

export default function DigitalDashboardPage() {
  const [trendView, setTrendView] = useState<TrendView>("impressions");
  const [digitalRows, setDigitalRows] = useState<DigitalPlatformRow[]>([]);
  const [digitalLoading, setDigitalLoading] = useState(true);

  const [selectedTaskId, setSelectedTaskId] = useState("");

  const [contentDrops, setContentDrops] = useState<ContentDrop[]>([]);
  const [engagementSpikes, setEngagementSpikes] = useState<EngagementSpike[]>(
    []
  );
  const [sentimentShifts, setSentimentShifts] = useState<SentimentShift[]>([]);

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("digital");
  const [contextMode, setContextMode] = useState("default");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(
          data?.organization?.context_mode || "default"
        );
      } catch (error) {
        console.error("Failed to load org context", error);
      }
    }

    loadOrgContext();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDigitalRows() {
      try {
        setDigitalLoading(true);
        const rows = await getDigitalPlatformRows();

        if (!mounted) return;

        setDigitalRows(rows);
      } catch (error) {
        console.error("Failed to load digital page metrics:", error);

        if (!mounted) return;

        setDigitalRows([]);
      } finally {
        if (mounted) {
          setDigitalLoading(false);
        }
      }
    }

    loadDigitalRows();

    return () => {
      mounted = false;
    };
  }, []);

  const platformMetrics = useMemo<PlatformMetric[]>(() => {
    return buildPlatformMetrics(digitalRows);
  }, [digitalRows]);

  const contentPipeline = useMemo<ContentItem[]>(() => {
    return [];
  }, []);

    const focusQueue = useMemo<FocusTask[]>(() => {
    return buildFocusQueueFromMetrics(platformMetrics);
  }, [platformMetrics]);

  const selectedTask = useMemo(() => {
    return (
      focusQueue.find((item) => item.id === selectedTaskId) ||
      focusQueue[0] ||
      null
    );
  }, [focusQueue, selectedTaskId]);

  const topLine = useMemo(() => {
    return platformMetrics.reduce(
      (acc, platform) => {
        acc.impressions += platform.impressions;
        acc.engagement += platform.engagement;
        acc.spend += platform.spend;
        return acc;
      },
      { impressions: 0, engagement: 0, spend: 0 }
    );
  }, [platformMetrics]);

  const sentimentSnapshot = useMemo(() => {
    if (!platformMetrics.length) {
      return {
        positive: 0,
        negative: 0,
      };
    }

    const positive =
      platformMetrics.reduce((sum, platform) => sum + platform.positive, 0) /
      platformMetrics.length;
    const negative =
      platformMetrics.reduce((sum, platform) => sum + platform.negative, 0) /
      platformMetrics.length;

    return {
      positive: Math.round(positive),
      negative: Math.round(negative),
    };
  }, [platformMetrics]);

  const chartData = useMemo(() => {
    return buildChartData(digitalRows);
  }, [digitalRows]);

  const chartMax = Math.max(
    ...chartData.map((point) => point[trendView]),
    1
  );

  const aiSummary = useMemo(() => {
    if (!platformMetrics.length) {
      return {
        headline: "No digital metrics uploaded yet.",
        body: "Digital will stay quiet until platform metrics are available for this campaign.",
        recommendation: "Upload digital metrics to activate platform, spend, sentiment, and content reads.",
      };
    }

    const strongest = [...platformMetrics].sort(
      (a, b) => b.engagement - a.engagement
    )[0];

    const weakestSentiment = [...platformMetrics].sort(
      (a, b) => b.negative - a.negative
    )[0];

    return {
      headline: `${strongest?.label || "Digital"} is carrying the strongest engagement signal.`,
      body:
        weakestSentiment && weakestSentiment.negative > 0
          ? `${weakestSentiment.label} has the highest sentiment pressure in the uploaded metrics.`
          : "Uploaded digital metrics are available for review.",
      recommendation:
        focusQueue[0]?.summary ||
        "Review the uploaded platform metrics and decide the next digital move.",
    };
  }, [platformMetrics, focusQueue]);



  const digitalAbeBriefing = useMemo(() => {
    return getDigitalAbeBriefing({
      role: demoRole,
      demoDepartment,
      platformMetrics,
      contentDrops,
      engagementSpikes,
      sentimentShifts,
      sentimentSnapshot,
      selectedTask,
    });
  }, [
    demoRole,
    demoDepartment,
    platformMetrics,
    contentDrops,
    engagementSpikes,
    sentimentShifts,
    sentimentSnapshot,
    selectedTask,
  ]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, digitalAbeBriefing));
  }, [
    digitalAbeBriefing.health,
    digitalAbeBriefing.campaignStatus,
    digitalAbeBriefing.primaryLane,
    digitalAbeBriefing.strongest,
    digitalAbeBriefing.weakest,
    digitalAbeBriefing.opportunityLane,
    digitalAbeBriefing.crossDomainSignal,
  ]);

  const digitalPatternWatch = useMemo(() => {
    const patterns = buildAbePatternInsights({
      role: demoRole,
      demoDepartment: "digital",
      briefing: digitalAbeBriefing,
      memory: abeMemory,
    });

    return filterPatternsForDepartment(patterns, "digital");
  }, [demoRole, digitalAbeBriefing, abeMemory]);

  const digitalAbeInsight = useMemo(() => {
    if (digitalPatternWatch.length > 0) {
      return digitalPatternWatch[0].detail;
    }

    return digitalAbeBriefing.whyNow;
  }, [digitalPatternWatch, digitalAbeBriefing.whyNow]);

  const selectedDigitalPatternHint = useMemo(() => {
    if (!selectedTask) return null;

    if (selectedTask.type === "spend" && engagementSpikes.length > 0) {
      return "Pattern: strong-performing platform momentum is repeating and should be reinforced.";
    }

    if (selectedTask.type === "reply" || sentimentShifts.length > 0) {
      return "Pattern: narrative pressure is active and weaker sentiment needs tighter handling.";
    }

    if (selectedTask.type === "content") {
      return "Pattern: creative refresh pressure is repeating as performance efficiency softens.";
    }

    return null;
  }, [selectedTask, engagementSpikes.length, sentimentShifts.length]);


  const visibleStats = useMemo(() => {
    const allStats = [
      {
        id: "impressions",
        label: "Impressions",
        value: topLine.impressions.toLocaleString(),
        tone: `${getDashboardStateTone(
          getDigitalStatState({
            id: "impressions",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )} ${getDashboardStateTextTone(
          getDigitalStatState({
            id: "impressions",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )}`,
        helper: "Cross-platform reach",
      },
      {
        id: "engagement",
        label: "Engagement",
        value: topLine.engagement.toLocaleString(),
        tone: `${getDashboardStateTone(
          getDigitalStatState({
            id: "engagement",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )} ${getDashboardStateTextTone(
          getDigitalStatState({
            id: "engagement",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )}`,
        helper: "Total audience interactions",
      },
      {
        id: "spend",
        label: "Spend",
        value: currency.format(topLine.spend),
        tone: `${getDashboardStateTone(
          getDigitalStatState({
            id: "spend",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )} ${getDashboardStateTextTone(
          getDigitalStatState({
            id: "spend",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )}`,
        helper: "Paid media spend",
      },
      {
        id: "sentiment",
        label: "Sentiment",
        value: `${sentimentSnapshot.positive}% / ${sentimentSnapshot.negative}%`,
        tone: `${getDashboardStateTone(
          getDigitalStatState({
            id: "sentiment",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )} ${getDashboardStateTextTone(
          getDigitalStatState({
            id: "sentiment",
            impressions: topLine.impressions,
            engagement: topLine.engagement,
            spend: topLine.spend,
            sentimentNegative: sentimentSnapshot.negative,
          })
        )}`,
        helper: "Positive vs negative response",
      },
    ];

    if (demoRole === "admin") return allStats;
    if (demoRole === "director") return allStats.slice(0, 3);

    return allStats.filter(
      (item) => item.id === "engagement" || item.id === "sentiment"
    );
  }, [
    topLine.impressions,
    topLine.engagement,
    topLine.spend,
    sentimentSnapshot,
    demoRole,
  ]);

  const visiblePlatformMetrics = useMemo(() => {
    if (demoRole === "admin") {
      return platformMetrics;
    }

    if (demoRole === "director") {
      return platformMetrics.slice(0, 3);
    }

    return platformMetrics.filter(
      (platform) => platform.key === "tiktok" || platform.key === "instagram"
    );
  }, [platformMetrics, demoRole]);

  const visibleContentPipeline = useMemo(() => {
    if (demoRole === "admin") {
      return contentPipeline;
    }

    if (demoRole === "director") {
      return contentPipeline.slice(0, 3);
    }

    return contentPipeline.slice(0, 2);
  }, [contentPipeline, demoRole]);
    const visibleFocusQueue = useMemo(() => {
    if (demoRole === "admin") {
      return focusQueue;
    }

    if (demoRole === "director") {
      return focusQueue.slice(0, 2);
    }

    return focusQueue.slice(0, 1);
  }, [focusQueue, demoRole]);

  const perspectiveHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Digital Command Center";
    }

    if (demoRole === "director") {
      return "Digital Director View";
    }

    return "Digital Work Lane";
  }, [demoRole]);

  const perspectiveSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Manage platform performance, content pipeline, sentiment, spend, and response pressure from one digital operations surface.";
    }

    if (demoRole === "director") {
      return "Lead the digital lane with tighter visibility into performance, allocation, content pressure, and response quality.";
    }

    return "Stay focused on the immediate digital work that needs to move right now without carrying the full department surface.";
  }, [demoRole]);


  const focusButtonLabel = useMemo(() => {
    if (demoRole === "general_user") {
      return "Start Work";
    }

    if (demoRole === "director") {
      return "Run Digital Lane";
    }

    return "Open Focus Mode";
  }, [demoRole]);

  const visibleActivation = useMemo(() => {
    if (demoRole === "admin") {
      return {
        show:
          contentDrops.length > 0 ||
          engagementSpikes.length > 0 ||
          sentimentShifts.length > 0,
        drops: contentDrops,
        spikes: engagementSpikes,
        shifts: sentimentShifts,
      };
    }

    if (demoRole === "director") {
      return {
        show:
          contentDrops.length > 0 ||
          engagementSpikes.length > 0 ||
          sentimentShifts.length > 0,
        drops: contentDrops.slice(0, 2),
        spikes: engagementSpikes.slice(0, 2),
        shifts: sentimentShifts.slice(0, 2),
      };
    }

    return {
      show: false,
      drops: [],
      spikes: [],
      shifts: [],
    };
  }, [contentDrops, engagementSpikes, sentimentShifts, demoRole]);

  const orgTheme = getOrgContextTheme(contextMode);

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Megaphone className="h-4 w-4" />
              Media + paid performance center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {perspectiveHeadline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {perspectiveSubheadline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/digital/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200"
            >
              <Zap className="h-4 w-4 text-slate-950" />
              <span className="text-slate-950">{focusButtonLabel}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Demo role perspective
            </p>
            <div className="flex flex-wrap gap-2">
              {(["admin", "director", "general_user"] as DemoRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setDemoRole(role)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    demoRole === role
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Demo department perspective
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                ["outreach", "finance", "field", "digital", "print"] as DemoDepartment[]
              ).map((department) => (
                <button
                  key={department}
                  onClick={() => setDemoDepartment(department)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    demoDepartment === department
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            {getRoleLabel(demoRole)}:
          </span>{" "}
          This digital surface narrows around who is using Aether and how much
          of the media lane they should see.
        </div>
      </section>

      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-fuchsia-800">
              <Sparkles className="h-4 w-4" />
              Honest Abe
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-fuchsia-700/80">
                {getRoleLabel(demoRole)}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-fuchsia-900">
                <div>
                  <span className="font-medium text-fuchsia-700">Health:</span>{" "}
                  {digitalAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Strongest:</span>{" "}
                  {departmentLabel(digitalAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Weakest:</span>{" "}
                  {departmentLabel(digitalAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Status:</span>{" "}
                  {digitalAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-fuchsia-900">
                {digitalAbeBriefing.primaryLane === "digital"
                  ? "Digital is the lane that needs active shaping right now."
                  : `${departmentLabel(
                      digitalAbeBriefing.primaryLane
                    )} is shaping what digital should do next.`}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                {aiSummary.body}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600">
                Why now: {digitalAbeInsight}
              </p>

              {digitalAbeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-fuchsia-900/80">
                  {digitalAbeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600">
                {digitalAbeBriefing.supportText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {digitalAbeBriefing.actions.map((move, index) => (
              <div
                key={`${move}-${index}`}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-fuchsia-200 bg-fuchsia-100 text-xs font-semibold text-fuchsia-800">
                  {index + 1}
                </div>
                <p>{move}</p>
              </div>
            ))}
          </div>
        </div>

        {digitalPatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
              Pattern Watch
            </p>

            <div className="mt-3 space-y-3">
              {digitalPatternWatch.map((insight, index) => (
                <div
                  key={`${insight.label}-${index}`}
                  className={`rounded-2xl border p-4 ${patternSeverityTone(
                    insight.severity
                  )}`}
                >
                  <p className="text-sm font-semibold">{insight.label}</p>
                  <p className="mt-1 text-sm opacity-90">{insight.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`grid gap-4 ${
          visibleStats.length === 2
            ? "md:grid-cols-2"
            : visibleStats.length === 3
            ? "md:grid-cols-3"
            : "md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visibleStats.map((stat) => (
          <div
            key={stat.id}
            className={`rounded-3xl border p-6 shadow-sm ${stat.tone}`}
          >
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
            <p className="mt-2 text-sm opacity-90">{stat.helper}</p>
          </div>
        ))}
      </section>

      {visibleActivation.show ? (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">
                Campaign Activation
              </p>
              <h2 className="text-xl font-semibold text-indigo-950">
                Digital → Campaign Outputs
              </h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-800">
              {visibleActivation.drops.length} content drop
              {visibleActivation.drops.length === 1 ? "" : "s"} •{" "}
              {visibleActivation.spikes.length} spend move
              {visibleActivation.spikes.length === 1 ? "" : "s"} •{" "}
              {visibleActivation.shifts.length} sentiment shift
              {visibleActivation.shifts.length === 1 ? "" : "s"}
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              demoRole === "director" ? "lg:grid-cols-2" : "lg:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Content Drops
              </p>
              <div className="mt-3 space-y-3">
                {visibleActivation.drops.map((drop) => (
                  <div
                    key={drop.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">{drop.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {drop.platform} • {drop.goal}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {drop.audience} • {drop.narrative}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Spend Moves
              </p>
              <div className="mt-3 space-y-3">
                {visibleActivation.spikes.map((spike) => (
                  <div
                    key={spike.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {spike.platform} · {spike.budgetShift}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {spike.goal} • {spike.audience}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {spike.narrative}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {demoRole === "admin" ? (
              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Sentiment Shifts
                </p>
                <div className="mt-3 space-y-3">
                  {visibleActivation.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-medium text-slate-900">
                        {shift.platform} · {shift.tone}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {shift.goal} • {shift.audience}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {shift.narrative}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section
        className={`grid gap-6 ${
          demoRole === "general_user" ? "lg:grid-cols-2" : "lg:grid-cols-3"
        }`}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">
              Creative Pressure
            </div>
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              Drafting: {contentPipeline.filter((i) => i.status === "drafting").length}
            </div>
            <div>
              Review: {contentPipeline.filter((i) => i.status === "review").length}
            </div>
            <div>
              Scheduled:{" "}
              {contentPipeline.filter((i) => i.status === "scheduled").length}
            </div>
            <div>Live: {contentPipeline.filter((i) => i.status === "live").length}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">
              Paid Media Signal
            </div>
            <CircleDollarSign className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>Best spend candidate: {getBestSpendCandidate(platformMetrics)}</div>
            <div>Needs creative refresh: {getCreativeRefreshCandidate(platformMetrics)}</div>
            <div>Weakest sentiment: {getWeakestSentimentCandidate(platformMetrics)}</div>
          </div>
        </div>

        {demoRole !== "general_user" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-500">
                Response Queue
              </div>
              <MessageSquare className="h-4 w-4 text-slate-500" />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div>Comments needing review: 0</div>
              <div>Suggested replies queued: 0</div>
              <div>Rapid response item: 0</div>
            </div>
          </div>
        ) : null}
      </section>

      {demoRole !== "general_user" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Performance Trend
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {demoRole === "admin"
                  ? "Cross-Platform Trend View"
                  : "Lane Trend View"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {["impressions", "engagement", "spend", "sentiment"].map((view) => (
                <button
                  key={view}
                  onClick={() =>
                    setTrendView(
                      view as "impressions" | "engagement" | "spend" | "sentiment"
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    trendView === view
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {view.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {chartData.map((point, index) => {
                const value = point[trendView];
                const height = (value / chartMax) * 120;

                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex h-32 items-end">
                      <div
                        style={{ height }}
                        className="w-10 rounded-2xl bg-slate-900"
                      />
                    </div>
                    <p className="text-xs text-slate-500">{point.label}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No digital trend data available yet.
            </div>
          )}
        </section>
      ) : null}

      <section
        className={`grid gap-6 ${
          visiblePlatformMetrics.length === 2
            ? "xl:grid-cols-2"
            : visiblePlatformMetrics.length === 3
            ? "xl:grid-cols-3"
            : "xl:grid-cols-4"
        }`}
      >
        {visiblePlatformMetrics.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm xl:col-span-4">
            {digitalLoading
              ? "Loading digital metrics..."
              : "No digital platform metrics available for this campaign yet."}
          </div>
        ) : null}

        {visiblePlatformMetrics.map((platform) => (
          <div
            key={platform.key}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {platform.label}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${platformTone(
                  platform.key
                )}`}
              >
                {platform.key}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Impressions</span>
                <span className="font-semibold">
                  {platform.impressions.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Engagement</span>
                <span className="font-semibold">
                  {platform.engagement.toLocaleString()}
                </span>
              </div>

              {demoRole !== "general_user" ? (
                <div className="flex items-center justify-between">
                  <span>Spend</span>
                  <span className="font-semibold">
                    {currency.format(platform.spend)}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span>CTR</span>
                <span className="font-semibold">{platform.ctr}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Sentiment</span>
                <span className="font-semibold">
                  {platform.positive}% / {platform.negative}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Content Pipeline
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {demoRole === "general_user"
                  ? "Active Content Schedule"
                  : "Content Schedule"}
              </h2>
            </div>

            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
            {visibleContentPipeline.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No live content pipeline items are connected yet.
              </div>
            ) : null}

            {visibleContentPipeline.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    {demoRole !== "general_user" ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Owner: {item.owner}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-500">
                      {item.publish_at
                        ? `Publish: ${item.publish_at}`
                        : "No publish time set"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${platformTone(
                        item.platform
                      )}`}
                    >
                      {item.platform}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Today&apos;s Touchpoints
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {demoRole === "general_user"
                  ? "Next Digital Actions"
                  : "Content + Spend Priorities"}
              </h2>
            </div>

            <Zap className="h-5 w-5 text-amber-500" />
          </div>

          <div className="space-y-4">
            {visibleFocusQueue.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No digital touchpoints are available from live metrics yet.
              </div>
            ) : null}

            {visibleFocusQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.summary}</p>
                    {selectedTaskId === item.id && selectedDigitalPatternHint ? (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        {selectedDigitalPatternHint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Touchpoint Intent
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {demoRole === "admin"
                ? "Today&apos;s touchpoints should narrow attention to content creation, spend movement, and response handling based on what is actually performing."
                : demoRole === "director"
                ? "Today&apos;s touchpoints should help lane leaders manage content pressure, spend shifts, and weaker response lanes."
                : "Today&apos;s touchpoints should keep the next content, spend, and response actions clear and easy to work."}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}