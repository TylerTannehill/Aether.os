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

type PlatformKey = "meta" | "instagram" | "x" | "tiktok";
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

  const supportText =
    input.role === "admin"
      ? "Use Digital Focus Mode to move content creation, spend shifts, and response handling in the right sequence while protecting performance."
      : input.role === "director"
      ? "Use Digital Focus Mode to manage content pressure, spend movement, and weaker response lanes without losing control of momentum."
      : "Use Digital Work to keep the next content, spend, or response action clear and easy to execute.";

  const actions: string[] = [];

  if (bestPlatform?.key === "tiktok") {
    actions.push("Shift more weight toward TikTok while engagement is strongest.");
  }

  if (weakestSentimentPlatform?.key === "x") {
    actions.push("Tighten response handling on X before sentiment spreads.");
  }

  if (
    input.selectedTask?.type === "content" ||
    input.contentDrops.length === 0
  ) {
    actions.push("Refresh creative before Meta efficiency softens further.");
  } else {
    actions.push("Keep the next digital action tight and move to the next signal.");
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
    crossDomainSignal:
      input.engagementSpikes.length > 0
        ? "DIGITAL momentum is active and may need downstream OUTREACH capture if it keeps building."
        : undefined,
  };
}

export default function DigitalDashboardPage() {
  const [trendView, setTrendView] = useState<TrendView>("impressions");

  const [digitalLoopMode, setDigitalLoopMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("focus-1");
  const [loopResult, setLoopResult] = useState("");
  const [loopNotes, setLoopNotes] = useState("");
  const [loopMessage, setLoopMessage] = useState("");
  const [completedLoopCount, setCompletedLoopCount] = useState(0);

  const [contentDrops, setContentDrops] = useState<ContentDrop[]>([]);
  const [engagementSpikes, setEngagementSpikes] = useState<EngagementSpike[]>(
    []
  );
  const [sentimentShifts, setSentimentShifts] = useState<SentimentShift[]>([]);

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("digital");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const platformMetrics = useMemo<PlatformMetric[]>(
    () => [
      {
        key: "meta",
        label: "Meta",
        impressions: 182000,
        engagement: 9400,
        spend: 4200,
        positive: 71,
        negative: 29,
        ctr: 3.6,
      },
      {
        key: "instagram",
        label: "Instagram",
        impressions: 96400,
        engagement: 6100,
        spend: 1700,
        positive: 76,
        negative: 24,
        ctr: 4.1,
      },
      {
        key: "x",
        label: "X",
        impressions: 68400,
        engagement: 2900,
        spend: 600,
        positive: 54,
        negative: 46,
        ctr: 1.9,
      },
      {
        key: "tiktok",
        label: "TikTok",
        impressions: 143000,
        engagement: 12100,
        spend: 2500,
        positive: 81,
        negative: 19,
        ctr: 4.8,
      },
    ],
    []
  );

  const contentPipeline = useMemo<ContentItem[]>(
    () => [
      {
        id: "content-1",
        title: "Education contrast graphic",
        platform: "instagram",
        status: "review",
        publish_at: "2026-04-08 11:00 AM",
        owner: "Maya",
      },
      {
        id: "content-2",
        title: "30-sec candidate clip on public safety",
        platform: "tiktok",
        status: "drafting",
        publish_at: null,
        owner: "Jordan",
      },
      {
        id: "content-3",
        title: "Fundraising push creative refresh",
        platform: "meta",
        status: "scheduled",
        publish_at: "2026-04-09 2:00 PM",
        owner: "Tyler",
      },
      {
        id: "content-4",
        title: "Rapid response quote post",
        platform: "x",
        status: "live",
        publish_at: "2026-04-07 9:10 AM",
        owner: "Avery",
      },
    ],
    []
  );
    const focusQueue = useMemo<FocusTask[]>(
    () => [
      {
        id: "focus-1",
        title: "Create 2 new top-funnel ad creatives",
        type: "content",
        priority: "high",
        summary:
          "Meta CTR is flattening. Refresh hooks and visual framing before spend efficiency drops further.",
      },
      {
        id: "focus-2",
        title: "Increase TikTok spend by 15%",
        type: "spend",
        priority: "high",
        summary:
          "TikTok is leading on engagement and positive response. Shift budget into the strongest performer.",
      },
      {
        id: "focus-3",
        title: "Draft replies for negative X thread",
        type: "reply",
        priority: "medium",
        summary:
          "X sentiment is weaker than other channels. Prepare tighter messaging and selective response handling.",
      },
    ],
    []
  );

  const selectedTask = useMemo(() => {
    return focusQueue.find((item) => item.id === selectedTaskId) || null;
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

  const chartData = useMemo(
    () => [
      {
        label: "Week 1",
        impressions: 92000,
        engagement: 5100,
        spend: 1800,
        sentiment: 61,
      },
      {
        label: "Week 2",
        impressions: 118000,
        engagement: 6800,
        spend: 2300,
        sentiment: 66,
      },
      {
        label: "Week 3",
        impressions: 143000,
        engagement: 8900,
        spend: 3100,
        sentiment: 69,
      },
      {
        label: "Week 4",
        impressions: 176000,
        engagement: 10800,
        spend: 3900,
        sentiment: 71,
      },
    ],
    []
  );

  const chartMax = Math.max(...chartData.map((point) => point[trendView]), 1);

  const aiSummary = useMemo(() => {
    if (demoRole === "admin") {
      return {
        headline:
          "Digital momentum is positive, but allocation needs refinement.",
        body:
          "TikTok and Instagram are carrying engagement strength, while X is underperforming on sentiment and Meta likely needs fresh creative to protect spend efficiency.",
        recommendation:
          "Create new creative for Meta, move additional spend toward TikTok, and tighten response strategy on X.",
      };
    }

    if (demoRole === "director") {
      return {
        headline:
          "Your digital lane is moving, but allocation and response strategy need tightening.",
        body:
          "The strongest digital momentum is sitting in TikTok and Instagram, while X needs better response handling and Meta needs fresher creative.",
        recommendation:
          "Refresh Meta creative, keep budget moving toward TikTok, and control the weaker response lane on X.",
      };
    }

    return {
      headline: "Your digital lane needs clear content and spend decisions.",
      body:
        "Focus on the immediate digital work that protects momentum and keeps weaker channels from dragging performance down.",
      recommendation:
        "Ship stronger content, protect spend efficiency, and handle weak sentiment carefully.",
    };
  }, [demoRole]);

  const activationSummary = useMemo(() => {
    return {
      contentDrops: contentDrops.length,
      engagementSpikes: engagementSpikes.length,
      sentimentShifts: sentimentShifts.length,
    };
  }, [contentDrops.length, engagementSpikes.length, sentimentShifts.length]);

  const digitalCommandSignal = useMemo(() => {
    if (engagementSpikes.length > 0) {
      return {
        title: "Momentum is building — reinforce the winner",
        detail:
          "Recent spend moves suggest a strong-performing platform is pulling ahead. Lean into that advantage while engagement is hot.",
      };
    }

    if (contentDrops.length > 0) {
      return {
        title: "Fresh creative is entering the system",
        detail:
          "New content has been produced and should be watched closely for amplification, reuse, or message refinement.",
      };
    }

    if (sentimentShifts.length > 0) {
      return {
        title: "Narrative pressure is being managed",
        detail:
          "Response handling is now actively shaping the conversation. Keep monitoring tone, thread quality, and escalation risk.",
      };
    }

    return {
      title: "Digital system stable",
      detail:
        "No major digital bottleneck is surfaced right now. Keep content shipping and continue disciplined allocation.",
    };
  }, [engagementSpikes.length, contentDrops.length, sentimentShifts.length]);

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

  function getDigitalRecommendation(task: FocusTask | null) {
    if (!task) return "Select a digital priority to begin execution.";

    if (task.type === "content") {
      return "Refresh creative immediately to protect performance and improve click-through rate.";
    }

    if (task.type === "spend") {
      return "Shift budget toward the strongest performer now while momentum is working in your favor.";
    }

    return "Draft and control the response carefully so weak sentiment does not spread further.";
  }

  function moveToNextDigitalTask() {
    const currentIndex = focusQueue.findIndex((item) => item.id === selectedTaskId);
    const nextTask = currentIndex >= 0 ? focusQueue[currentIndex + 1] : null;

    if (nextTask) {
      setTimeout(() => {
        setSelectedTaskId(nextTask.id);
      }, 150);
    }
  }

  function saveDigitalLoop() {
    if (!selectedTask) {
      setLoopMessage("Select a digital priority first.");
      return;
    }

    if (!loopResult.trim()) {
      setLoopMessage("Choose an execution result before saving.");
      return;
    }

    if (selectedTask.type === "content" && loopResult === "completed") {
      const nextDrop: ContentDrop = {
        id: `content-drop-${Date.now()}`,
        title: selectedTask.title,
        platform: "Meta",
        audience: "Top-funnel persuadables",
        goal: "Lead generation",
        narrative: "Education contrast",
        createdAt: new Date().toLocaleString(),
      };

      setContentDrops((current) => [nextDrop, ...current]);
    }

    if (selectedTask.type === "spend" && loopResult === "completed") {
      const nextSpike: EngagementSpike = {
        id: `engagement-spike-${Date.now()}`,
        platform: "TikTok",
        budgetShift: "15%",
        audience: "Young persuadables",
        goal: "Engagement growth",
        narrative: "Momentum push",
        createdAt: new Date().toLocaleString(),
      };

      setEngagementSpikes((current) => [nextSpike, ...current]);
    }

    if (selectedTask.type === "reply" && loopResult === "completed") {
      const nextShift: SentimentShift = {
        id: `sentiment-shift-${Date.now()}`,
        platform: "X",
        tone: "Controlled",
        audience: "Issue-aware voters",
        goal: "Narrative control",
        narrative: "Public safety response",
        createdAt: new Date().toLocaleString(),
      };

      setSentimentShifts((current) => [nextShift, ...current]);
    }

    const nextActionMessage =
      loopResult === "completed"
        ? "Priority completed. Move immediately to the next digital action."
        : loopResult === "adjusted"
        ? "Adjustment logged. Monitor this lane closely and continue execution."
        : "Needs follow-up. Keep this item active while you continue applying pressure.";

    setCompletedLoopCount((value) => value + 1);
    setLoopMessage(`Saved successfully. ${nextActionMessage}`);
    setLoopResult("");
    setLoopNotes("");

    moveToNextDigitalTask();
  }

  const visibleStats = useMemo(() => {
    const allStats = [
      {
        id: "impressions",
        label: "Impressions",
        value: topLine.impressions.toLocaleString(),
        tone: "border-sky-200 bg-sky-50 text-sky-900",
        helper: "Cross-platform reach",
      },
      {
        id: "engagement",
        label: "Engagement",
        value: topLine.engagement.toLocaleString(),
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        helper: "Total audience interactions",
      },
      {
        id: "spend",
        label: "Spend",
        value: currency.format(topLine.spend),
        tone: "border-amber-200 bg-amber-50 text-amber-900",
        helper: "Paid media spend",
      },
      {
        id: "sentiment",
        label: "Sentiment",
        value: `${sentimentSnapshot.positive}% / ${sentimentSnapshot.negative}%`,
        tone: "border-purple-200 bg-purple-50 text-purple-900",
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

  const loopButtonLabel = useMemo(() => {
    if (digitalLoopMode) {
      return demoRole === "general_user" ? "Exit Work Mode" : "Digital Loop On";
    }

    if (demoRole === "general_user") {
      return "Start Work Mode";
    }

    return "Enable Digital Loop";
  }, [digitalLoopMode, demoRole]);

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

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Megaphone className="h-4 w-4" />
              Media + paid performance center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                {perspectiveHeadline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                {perspectiveSubheadline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/digital/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              {focusButtonLabel}
            </Link>

            <button
              type="button"
              onClick={() => setDigitalLoopMode((prev) => !prev)}
              className={
                digitalLoopMode
                  ? "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              }
            >
              {loopButtonLabel}
            </button>
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

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Sparkles className="h-4 w-4" />
              Honest Abe
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-700/80">
                {getRoleLabel(demoRole)}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-amber-900">
                <div>
                  <span className="font-medium text-amber-700">Health:</span>{" "}
                  {digitalAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Strongest:</span>{" "}
                  {departmentLabel(digitalAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Weakest:</span>{" "}
                  {departmentLabel(digitalAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Status:</span>{" "}
                  {digitalAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-amber-900">
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
                <p className="max-w-3xl text-sm text-amber-900/80">
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {digitalAbeBriefing.actions.map((move, index) => (
              <div
                key={`${move}-${index}`}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800">
                  {index + 1}
                </div>
                <p>{move}</p>
              </div>
            ))}
          </div>
        </div>

        {digitalPatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
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

      {digitalLoopMode ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div
            className={`mb-6 grid gap-4 ${
              demoRole === "general_user" ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Digital Loop Progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {visibleFocusQueue.findIndex((item) => item.id === selectedTaskId) + 1 > 0
                  ? visibleFocusQueue.findIndex((item) => item.id === selectedTaskId) + 1
                  : 1}
                <span className="text-base font-medium text-slate-500">
                  {" "}
                  / {visibleFocusQueue.length}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Loop Actions Saved
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {completedLoopCount}
              </p>
            </div>

            {demoRole !== "general_user" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Highest Priority
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {visibleFocusQueue[0]?.title || "No task available"}
                </p>
              </div>
            ) : null}
          </div>
                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Highest Priority Digital Task
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {visibleFocusQueue[0]?.title || "No priority available"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {visibleFocusQueue[0]?.summary ||
                    "System recommends immediate digital action."}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500">
                  Digital Loop Queue
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {demoRole === "general_user"
                    ? "Active Digital Work"
                    : "Content + Spend Execution"}
                </h2>
              </div>

              <div className="space-y-4">
                {visibleFocusQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTaskId(item.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      item.id === selectedTaskId
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {item.summary}
                        </p>
                        {item.id === selectedTaskId && selectedDigitalPatternHint ? (
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              {selectedTask ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Aether Recommendation
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {getDigitalRecommendation(selectedTask)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Save the execution decision and move immediately to the next
                    digital priority.
                  </p>
                  {selectedDigitalPatternHint ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      {selectedDigitalPatternHint}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {demoRole === "general_user"
                    ? "Digital Work"
                    : "Digital Execution"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {demoRole === "general_user"
                    ? "Record the result and keep the next digital action moving."
                    : "Record the result, reinforce the next move, and keep momentum going."}
                </p>
              </div>

              {selectedTask ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Selected Priority</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedTask.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTask.summary}
                  </p>
                </div>
              ) : null}

              {loopMessage ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {loopMessage}
                </div>
              ) : null}

              <div className="space-y-4">
                <select
                  value={loopResult}
                  onChange={(e) => setLoopResult(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">Select an execution result</option>
                  <option value="completed">Completed</option>
                  <option value="adjusted">Adjusted</option>
                  <option value="needs_follow_up">Needs Follow-Up</option>
                </select>

                <textarea
                  value={loopNotes}
                  onChange={(e) => setLoopNotes(e.target.value)}
                  placeholder="Digital notes..."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />

                <button
                  type="button"
                  onClick={saveDigitalLoop}
                  disabled={!selectedTask}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {demoRole === "general_user" ? "Save & Continue" : "Save & Next"}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

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

          <div className="grid grid-cols-4 gap-4">
            {chartData.map((point) => {
              const value = point[trendView];
              const height = (value / chartMax) * 120;

              return (
                <div key={point.label} className="flex flex-col items-center gap-2">
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
                  ? "Active Content Work"
                  : "Creation + Release Queue"}
              </h2>
            </div>

            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
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
                Focus Mode Queue
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
              Focus Mode Intent
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {demoRole === "admin"
                ? "Digital focus mode should narrow the operator view to content creation, spend movement, and response handling based on what is actually performing."
                : demoRole === "director"
                ? "Digital focus mode should help lane leaders manage content pressure, spend shifts, and weaker response lanes."
                : "Digital focus mode should keep the next content, spend, and response actions clear and easy to work."}
            </p>
          </div>
        </div>
      </section>

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
            <div>Best spend candidate: TikTok</div>
            <div>Needs creative refresh: Meta</div>
            <div>Weakest sentiment: X</div>
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
              <div>Comments needing review: 18</div>
              <div>Suggested replies queued: 6</div>
              <div>Rapid response item: 1</div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}