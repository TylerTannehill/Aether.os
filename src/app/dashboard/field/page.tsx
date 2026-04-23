"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  ListChecks,
  MapPinned,
  Route,
  Sparkles,
  Users,
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

type FieldTrendView = "doors" | "conversations" | "ids" | "completion";

type TurfRow = {
  id: string;
  name: string;
  region: string;
  doors: number;
  conversations: number;
  ids: number;
  completion: number;
  owner: string;
  linkedListId?: string;
  linkedListName?: string;
};

type CanvasserRow = {
  id: string;
  name: string;
  doors: number;
  conversations: number;
  ids: number;
  shifts: number;
};

type FieldFocusTask = {
  id: string;
  title: string;
  type: "turf" | "canvass" | "follow_up";
  priority: "high" | "medium" | "low";
  summary: string;
  linkedListId?: string;
  linkedListName?: string;
};

type GeneratedFieldList = {
  id: string;
  name: string;
  source: string;
  created: string;
};

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

function priorityTone(priority: FieldFocusTask["priority"]) {
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

function typeTone(type: FieldFocusTask["type"]) {
  switch (type) {
    case "turf":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "canvass":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "follow_up":
    default:
      return "bg-purple-100 text-purple-700 border border-purple-200";
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

function getFieldAbeBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  turfRows: TurfRow[];
  canvasserRows: CanvasserRow[];
  generatedLists: GeneratedFieldList[];
  averageCompletion: number;
  topLine: {
    doors: number;
    conversations: number;
    ids: number;
    completion: number;
  };
  fieldCommandSignal: {
    title: string;
    detail: string;
    priority: "high" | "low";
    category: "follow_up" | "turf" | "review";
  };
  orgContext?: ReturnType<typeof getOrgContextForDepartment>;
}): AbeBriefing {
  const highPressureTurfs = input.turfRows.filter((turf) => turf.completion < 60);
  const highCompletionTurfs = input.turfRows.filter((turf) => turf.completion >= 75);
  const highIdCanvassers = input.canvasserRows.filter((row) => row.ids >= 40);

  const weakest: AbeDepartment =
    input.averageCompletion < 65
      ? "field"
      : input.generatedLists.length > 0
      ? "outreach"
      : "field";

  const strongest: AbeDepartment =
    input.topLine.ids >= 300 || highCompletionTurfs.length >= 2 ? "field" : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? input.generatedLists.length > 0
        ? "field"
        : "field"
      : input.demoDepartment === "field"
      ? "field"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.generatedLists.length > 0 ? "outreach" : "field";

  let health = "Stable overall";
  if (input.averageCompletion < 55) {
    health = "Pressure is rising";
  } else if (input.averageCompletion >= 72 && input.topLine.ids >= 300) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (input.averageCompletion < 55) {
    campaignStatus = "Completion risk is building";
  } else if (input.generatedLists.length > 0) {
    campaignStatus = "Stable with follow-up opportunity";
  } else if (input.averageCompletion >= 70) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Field output is moving, but the lane needs clean completion and fast conversion of good conversations.";

  if (input.generatedLists.length > 0) {
    whyNow =
      "Field is no longer just producing conversations — it is creating follow-up value that should move into outreach while turf completion stays on pace.";
  } else if (input.averageCompletion < 60) {
    whyNow =
      "Lagging turf completion is starting to drag on the lane, which makes deployment and finishing pressure the immediate issue.";
  } else if (highIdCanvassers.length >= 2) {
    whyNow =
      "The lane has real production strength right now, so the priority is converting strong canvassing output into completion and follow-up momentum.";
  }

  const whyNowModifiers:string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Field is carrying the most campaign-wide pressure right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Field is acting as a steadier campaign-wide support lane.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this field signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  const baseSupportText =
    input.role === "admin"
      ? "Use Field Focus to tighten completion and protect momentum."
      : input.role === "director"
      ? "Use Field Focus to tighten deployment and move follow-up."
      : "Finish active turf and keep next actions simple.";

  const supportText = [baseSupportText, input.orgContext?.orgSupportLine]
    .filter(Boolean)
    .join(" ");

  const actions: string[] = [];

  if (input.averageCompletion < 60) {
    actions.push("Finish the lagging turf before completion drag spreads.");
  }

  if (highIdCanvassers.length >= 2) {
    actions.push("Route your strongest canvassers into the highest-ID opportunity.");
  }

  if (input.generatedLists.length > 0) {
    actions.push("Move new field-generated follow-up lists into outreach quickly.");
  } else {
    actions.push("Convert the strongest recent conversations into follow-up actions.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next field action tight and move to the next lane signal.");
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
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal:
      input.generatedLists.length > 0
        ? "FIELD is generating follow-up work that OUTREACH should absorb quickly."
        : input.fieldCommandSignal.category === "turf"
        ? "FIELD completion is the primary constraint before downstream conversion improves."
        : undefined,
  };
}

export default function FieldDashboardPage() {
  const [trendView, setTrendView] = useState<FieldTrendView>("doors");
  const [fieldLoopMode, setFieldLoopMode] = useState(false);
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState("focus-1");
  const [fieldResult, setFieldResult] = useState("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [fieldMessage, setFieldMessage] = useState("");
  const [completedLoopCount, setCompletedLoopCount] = useState(0);
  const [generatedLists, setGeneratedLists] = useState<GeneratedFieldList[]>([]);
  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("field");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const turfRows = useMemo<TurfRow[]>(
    () => [
      {
        id: "turf-1",
        name: "North Aurora East",
        region: "Aurora",
        doors: 820,
        conversations: 214,
        ids: 92,
        completion: 71,
        owner: "Maya",
        linkedListId: "field-north-aurora-east",
        linkedListName: "North Aurora East",
      },
      {
        id: "turf-2",
        name: "Ward 4 River Block",
        region: "Naperville",
        doors: 610,
        conversations: 163,
        ids: 68,
        completion: 58,
        owner: "Jordan",
        linkedListId: "field-ward-4-river-block",
        linkedListName: "Ward 4 River Block",
      },
      {
        id: "turf-3",
        name: "Central Walk Packet",
        region: "Evanston",
        doors: 940,
        conversations: 255,
        ids: 121,
        completion: 84,
        owner: "Tyler",
        linkedListId: "field-central-walk-packet",
        linkedListName: "Central Walk Packet",
      },
      {
        id: "turf-4",
        name: "South Persuasion Universe",
        region: "Chicago",
        doors: 500,
        conversations: 119,
        ids: 44,
        completion: 39,
        owner: "Avery",
        linkedListId: "field-south-persuasion-universe",
        linkedListName: "South Persuasion Universe",
      },
    ],
    []
  );

  const canvasserRows = useMemo<CanvasserRow[]>(
    () => [
      {
        id: "canvasser-1",
        name: "Maya",
        doors: 410,
        conversations: 118,
        ids: 46,
        shifts: 5,
      },
      {
        id: "canvasser-2",
        name: "Jordan",
        doors: 355,
        conversations: 91,
        ids: 39,
        shifts: 4,
      },
      {
        id: "canvasser-3",
        name: "Tyler",
        doors: 520,
        conversations: 146,
        ids: 63,
        shifts: 6,
      },
      {
        id: "canvasser-4",
        name: "Avery",
        doors: 280,
        conversations: 67,
        ids: 24,
        shifts: 3,
      },
    ],
    []
  );
    const focusQueue = useMemo<FieldFocusTask[]>(
    () => [
      {
        id: "focus-1",
        title: "Finish South Persuasion Universe turf",
        type: "turf",
        priority: "high",
        summary:
          "This turf is lagging on completion and needs immediate attention to stay on pacing goals.",
        linkedListId: "field-south-persuasion-universe",
        linkedListName: "South Persuasion Universe",
      },
      {
        id: "focus-2",
        title: "Shift strongest canvassers into high-ID turf",
        type: "canvass",
        priority: "high",
        summary:
          "Move top performers into the highest-opportunity universe to increase IDs before the next reporting cycle.",
        linkedListId: "field-high-id-packet",
        linkedListName: "Highest-ID Packet",
      },
      {
        id: "focus-3",
        title: "Build follow-up list from engaged conversations",
        type: "follow_up",
        priority: "medium",
        summary:
          "Recent conversations are generating good engagement. Convert those into organized follow-up actions.",
        linkedListId: "field-engaged-follow-up",
        linkedListName: "Field Engaged Follow-Up",
      },
    ],
    []
  );

  const selectedFocusTask = useMemo(() => {
    return focusQueue.find((item) => item.id === selectedFocusTaskId) || null;
  }, [focusQueue, selectedFocusTaskId]);

  const topLine = useMemo(() => {
    return turfRows.reduce(
      (acc, turf) => {
        acc.doors += turf.doors;
        acc.conversations += turf.conversations;
        acc.ids += turf.ids;
        acc.completion += turf.completion;
        return acc;
      },
      { doors: 0, conversations: 0, ids: 0, completion: 0 }
    );
  }, [turfRows]);

  const averageCompletion = useMemo(() => {
    if (turfRows.length === 0) return 0;
    return Math.round(topLine.completion / turfRows.length);
  }, [topLine.completion, turfRows.length]);

  const turfPressure = useMemo(() => {
    const underSixty = turfRows.filter((turf) => turf.completion < 60);
    const unfinished = turfRows.filter((turf) => turf.completion < 100);

    return {
      underSixtyCount: underSixty.length,
      unfinishedCount: unfinished.length,
      highestPressureTurf: underSixty[0] || unfinished[0] || null,
    };
  }, [turfRows]);

  const chartData = useMemo(
    () => [
      {
        label: "Week 1",
        doors: 980,
        conversations: 240,
        ids: 96,
        completion: 48,
      },
      {
        label: "Week 2",
        doors: 1280,
        conversations: 322,
        ids: 121,
        completion: 57,
      },
      {
        label: "Week 3",
        doors: 1660,
        conversations: 418,
        ids: 174,
        completion: 69,
      },
      {
        label: "Week 4",
        doors: 2010,
        conversations: 521,
        ids: 233,
        completion: 78,
      },
    ],
    []
  );

  const chartMax = Math.max(...chartData.map((point) => point[trendView]), 1);

  const aiSummary = useMemo(() => {
    if (demoRole === "admin") {
      return {
        headline:
          "Field production is healthy, but turf completion needs tightening.",
        body:
          "Strong canvassing volume is being slowed by completion drag.",
        recommendation:
          "Concentrate stronger canvassers in lagging turf, push unfinished packets to completion, and convert the highest-quality conversations into follow-up actions.",
        action:
          "Focus next on unfinished turf, strongest-canvasser allocation, and conversation-driven follow-up.",
      };
    }

    if (demoRole === "director") {
      return {
        headline:
          "Your field lane is productive, but lagging turf needs tighter control.",
        body:
          "Field production is moving, but lagging turf needs tighter deployment.",
        recommendation:
          "Tighten canvasser allocation, complete lagging packets, and convert stronger conversations into follow-up.",
        action:
          "Focus next on coverage pressure, deployment, and follow-up generation.",
      };
    }

    return {
      headline: "Your field lane needs clean completion and quick follow-up.",
      body:
        "Keep the next field actions tight and completion clean.",
      recommendation:
        "Stay on the active turf, log good conversations clearly, and move the best interactions into follow-up.",
      action: "Focus next on completion, IDs, and immediate follow-up.",
    };
  }, [demoRole]);

  const fieldCommandSignal = useMemo(() => {
    if (generatedLists.length > 0) {
      return {
        title: "Follow-up lists ready for outreach",
        detail: `${generatedLists.length} field-generated list${
          generatedLists.length === 1 ? "" : "s"
        } should now be worked by outreach.`,
        priority: "high",
        category: "follow_up",
      } as const;
    }

    if (turfPressure.highestPressureTurf) {
      return {
        title: "Complete lagging turf now",
        detail: `${turfPressure.highestPressureTurf.name} is still under target completion and should move first.`,
        priority: "high",
        category: "turf",
      } as const;
    }

    return {
      title: "Field system stable",
      detail: "No urgent turf or follow-up bottleneck is visible right now.",
      priority: "low",
      category: "review",
    } as const;
  }, [generatedLists.length, turfPressure]);

  const fieldOrgLayer = useMemo(() => {
    const highCompletionTurfs = turfRows.filter((turf) => turf.completion >= 75);

    return buildAbeOrgLayer({
      lanes: [
        {
          department: "field",
          strongest:
            topLine.ids >= 300 || highCompletionTurfs.length >= 2
              ? "field"
              : "outreach",
          weakest:
            averageCompletion < 65
              ? "field"
              : generatedLists.length > 0
              ? "outreach"
              : "field",
          primaryLane: "field",
          opportunityLane: generatedLists.length > 0 ? "outreach" : "field",
          health:
            averageCompletion < 55
              ? "Pressure is rising"
              : averageCompletion >= 72 && topLine.ids >= 300
              ? "Momentum building"
              : "Stable overall",
          campaignStatus:
            averageCompletion < 55
              ? "Completion risk is building"
              : generatedLists.length > 0
              ? "Stable with follow-up opportunity"
              : averageCompletion >= 70
              ? "Stable with opportunity"
              : "Stable overall",
          crossDomainSignal:
            generatedLists.length > 0
              ? "FIELD is generating follow-up work that OUTREACH should absorb quickly."
              : fieldCommandSignal.category === "turf"
              ? "FIELD completion is the primary constraint before downstream conversion improves."
              : undefined,
        },
      ],
    });
  }, [turfRows, topLine.ids, averageCompletion, generatedLists.length, fieldCommandSignal.category]);

  const fieldOrgContext = useMemo(() => {
    return getOrgContextForDepartment(fieldOrgLayer, "field");
  }, [fieldOrgLayer]);

  const fieldAbeBriefing = useMemo(() => {
    return getFieldAbeBriefing({
      role: demoRole,
      demoDepartment,
      turfRows,
      canvasserRows,
      generatedLists,
      averageCompletion,
      topLine,
      fieldCommandSignal,
      orgContext: fieldOrgContext,
    });
  }, [
    demoRole,
    demoDepartment,
    turfRows,
    canvasserRows,
    generatedLists,
    averageCompletion,
    topLine,
    fieldCommandSignal,
    fieldOrgContext,
  ]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, fieldAbeBriefing));
  }, [
    fieldAbeBriefing.health,
    fieldAbeBriefing.campaignStatus,
    fieldAbeBriefing.primaryLane,
    fieldAbeBriefing.strongest,
    fieldAbeBriefing.weakest,
    fieldAbeBriefing.opportunityLane,
    fieldAbeBriefing.crossDomainSignal,
  ]);

  const fieldPatternWatch = useMemo(() => {
    const patterns = buildAbePatternInsights({
      role: demoRole,
      demoDepartment: "field",
      briefing: fieldAbeBriefing,
      memory: abeMemory,
    });

    return filterPatternsForDepartment(patterns, "field");
  }, [demoRole, fieldAbeBriefing, abeMemory]);

  const fieldAbeInsight = useMemo(() => {
    if (fieldPatternWatch.length > 0) {
      return fieldPatternWatch[0].detail;
    }

    return fieldAbeBriefing.whyNow;
  }, [fieldPatternWatch, fieldAbeBriefing.whyNow]);

  const selectedFocusPatternHint = useMemo(() => {
    if (!selectedFocusTask) return null;

    if (selectedFocusTask.type === "turf" && averageCompletion < 60) {
      return "Pattern: turf completion pressure has remained active across recent reads.";
    }

    if (selectedFocusTask.type === "canvass" && topLine.ids >= 300) {
      return "Pattern: stronger canvassing output is creating a repeated ID opportunity.";
    }

    if (selectedFocusTask.type === "follow_up" && generatedLists.length > 0) {
      return "Pattern: field conversations are repeatedly creating follow-up work for outreach.";
    }

    return null;
  }, [selectedFocusTask, averageCompletion, topLine.ids, generatedLists.length]);

  function getFieldRecommendation(task: FieldFocusTask | null) {
    if (!task) return "Select a field priority to begin execution.";

    if (task.type === "turf") {
      return "Push unfinished turf to completion first to protect pacing and coverage.";
    }

    if (task.type === "canvass") {
      return "Reallocate the strongest canvassers into the highest-opportunity turf now.";
    }

    return "Convert live field conversations into immediate follow-up actions before they cool off.";
  }

  function moveToNextFieldTask() {
    const currentIndex = focusQueue.findIndex((item) => item.id === selectedFocusTaskId);
    const nextTask = currentIndex >= 0 ? focusQueue[currentIndex + 1] : null;

    if (nextTask) {
      setTimeout(() => {
        setSelectedFocusTaskId(nextTask.id);
      }, 150);
    }
  }

  function saveFieldLoop() {
    if (!selectedFocusTask) {
      setFieldMessage("Select a field priority first.");
      return;
    }

    if (!fieldResult.trim()) {
      setFieldMessage("Choose an execution result before saving.");
      return;
    }

    if (selectedFocusTask.type === "follow_up") {
      const nextList: GeneratedFieldList = {
        id: `generated-${Date.now()}`,
        name: `${selectedFocusTask.linkedListName || "Field Follow-Up"} ${
          generatedLists.length + 1
        }`,
        source: selectedFocusTask.title,
        created: new Date().toLocaleString(),
      };

      setGeneratedLists((current) => [nextList, ...current]);
    }

    setCompletedLoopCount((value) => value + 1);

    setFieldMessage(
      `Saved: ${selectedFocusTask.title} marked as "${fieldResult}".`
    );

    setFieldResult("");
    setFieldNotes("");

    moveToNextFieldTask();
  }

  const visibleTurfRows = useMemo(() => {
    if (demoRole === "admin") {
      return turfRows;
    }

    if (demoRole === "director") {
      return turfRows.slice(0, 3);
    }

    return turfRows.slice(0, 2);
  }, [turfRows, demoRole]);

  const visibleCanvasserRows = useMemo(() => {
    if (demoRole === "admin") {
      return canvasserRows;
    }

    if (demoRole === "director") {
      return canvasserRows.slice(0, 3);
    }

    return canvasserRows.slice(0, 2);
  }, [canvasserRows, demoRole]);

  const visibleFocusQueue = useMemo(() => {
    if (demoRole === "admin") {
      return focusQueue;
    }

    if (demoRole === "director") {
      return focusQueue.slice(0, 2);
    }

    return focusQueue.slice(0, 1);
  }, [focusQueue, demoRole]);

  const visibleStats = useMemo(() => {
    const allStats = [
      {
        id: "doors",
        label: "Doors Knocked",
        value: topLine.doors,
      },
      {
        id: "conversations",
        label: "Conversations",
        value: topLine.conversations,
      },
      {
        id: "ids",
        label: "IDs Collected",
        value: topLine.ids,
      },
      {
        id: "completion",
        label: "Avg Completion",
        value: `${averageCompletion}%`,
      },
    ];

    if (demoRole === "admin") return allStats;
    if (demoRole === "director") return allStats.slice(0, 3);
    return allStats.filter(
      (item) => item.id === "conversations" || item.id === "completion"
    );
  }, [topLine.doors, topLine.conversations, topLine.ids, averageCompletion, demoRole]);
    const perspectiveHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Coverage, conversations, and IDs";
    }

    if (demoRole === "director") {
      return "Field lane coverage and deployment";
    }

    return "Your next field actions";
  }, [demoRole]);

  const perspectiveSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Field tracks turf completion, canvasser output, and conversation quality while routing high-value interactions into follow-up and outreach.";
    }

    if (demoRole === "director") {
      return "Lead the field lane with tighter visibility into turf pressure, canvasser allocation, and conversation quality.";
    }

    return "Stay focused on the immediate field work that needs to move right now without carrying the full department surface.";
  }, [demoRole]);

  const commandSignalCtaLabel = useMemo(() => {
    if (demoRole === "general_user") {
      return "Start Field Work";
    }

    if (demoRole === "director") {
      return "Run Field Lane";
    }

    return "Open Field Focus Mode";
  }, [demoRole]);

  const trendHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Weekly Trend";
    }

    if (demoRole === "director") {
      return "Lane Trend";
    }

    return "Active Trend";
  }, [demoRole]);

  const fieldLoopButtonLabel = useMemo(() => {
    if (fieldLoopMode) {
      return demoRole === "general_user" ? "Exit Work Mode" : "Exit Loop Mode";
    }

    if (demoRole === "general_user") {
      return "Start Work Mode";
    }

    return "Enter Loop Mode";
  }, [fieldLoopMode, demoRole]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Field Dashboard
            </p>

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
              href="/dashboard/field/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-yellow-300 bg-yellow-100 px-4 py-3 text-sm font-medium text-yellow-900 transition hover:bg-yellow-200"
            >
              <Zap className="h-4 w-4" />
              Open Focus Mode
            </Link>

            <button
              onClick={() => setFieldLoopMode((value) => !value)}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                fieldLoopMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {fieldLoopButtonLabel}
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
          This field surface narrows around who is using Aether and how much of
          the deployment lane they should see.
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
                  {fieldAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Strongest:</span>{" "}
                  {departmentLabel(fieldAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Weakest:</span>{" "}
                  {departmentLabel(fieldAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Status:</span>{" "}
                  {fieldAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-amber-900">
                {fieldAbeBriefing.primaryLane === "field"
                  ? "Field is the operating lane that needs attention right now."
                  : `${departmentLabel(
                      fieldAbeBriefing.primaryLane
                    )} is shaping what field should do next.`}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                {aiSummary.body}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600">
                Why now: {fieldAbeInsight}
              </p>

              {fieldAbeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-amber-900/80">
                  {fieldAbeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600">
                {fieldAbeBriefing.supportText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {fieldAbeBriefing.actions.map((move, index) => (
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

        {fieldPatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Pattern Watch
            </p>

            <div className="mt-3 space-y-3">
              {fieldPatternWatch.map((insight, index) => (
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
            : "md:grid-cols-4"
        }`}
      >
        {visibleStats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {demoRole !== "general_user" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {trendHeadline}
            </h2>

            <div className="flex flex-wrap gap-2">
              {(["doors", "conversations", "ids", "completion"] as FieldTrendView[]).map(
                (view) => (
                  <button
                    key={view}
                    onClick={() => setTrendView(view)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                      trendView === view
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {view}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="h-48 flex items-end gap-2">
            {chartData.map((point) => {
              const height = Math.max((point[trendView] / chartMax) * 100, 6);

              return (
                <div key={point.label} className="flex-1">
                  <div
                    className="rounded-t-lg bg-slate-900 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {point.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Field Command Signal
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              {fieldCommandSignal.title}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              {fieldCommandSignal.detail}
            </p>
          </div>
        </div>
      </section>

      {generatedLists.length > 0 &&
      (demoRole === "admin" || demoRole === "director") ? (
        <section className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">
              Generated Follow-Up Lists
            </h2>
            <span className="text-sm font-medium text-purple-700">
              {generatedLists.length} created
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {generatedLists.map((list) => (
              <div
                key={list.id}
                className="rounded-2xl border border-purple-200 bg-white p-4"
              >
                <p className="font-semibold text-slate-900">{list.name}</p>
                <p className="mt-1 text-sm text-slate-600">{list.source}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Created: {list.created}
                </p>

                <div className="mt-3 flex gap-2">
                  <Link
                    href="/dashboard/lists"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Open Lists
                  </Link>
                  <Link
                    href="/dashboard/outreach"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Send to Outreach
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={`grid gap-6 ${
          visibleTurfRows.length === 2
            ? "xl:grid-cols-2"
            : visibleTurfRows.length === 3
            ? "xl:grid-cols-3"
            : "xl:grid-cols-4"
        }`}
      >
        {visibleTurfRows.map((turf) => (
          <div
            key={turf.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {turf.name}
              </h3>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {turf.region}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Doors</span>
                <span className="font-semibold">{turf.doors}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Conversations</span>
                <span className="font-semibold">{turf.conversations}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>IDs</span>
                <span className="font-semibold">{turf.ids}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Completion</span>
                <span className="font-semibold">{turf.completion}%</span>
              </div>

              {demoRole !== "general_user" ? (
                <div className="flex items-center justify-between">
                  <span>Owner</span>
                  <span className="font-semibold">{turf.owner}</span>
                </div>
              ) : null}

              {turf.linkedListName && demoRole !== "general_user" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Linked List
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {turf.linkedListName}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {demoRole !== "general_user" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Team Output</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Canvasser Performance
                </h2>
              </div>

              <Users className="h-5 w-5 text-slate-500" />
            </div>

            <div className="space-y-4">
              {visibleCanvasserRows.map((canvasser) => (
                <div
                  key={canvasser.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {canvasser.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {canvasser.shifts} shift
                        {canvasser.shifts === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 lg:min-w-[320px]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Doors
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {canvasser.doors}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Convos
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {canvasser.conversations}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          IDs
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {canvasser.ids}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Work Output</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Active Field Priorities
                </h2>
              </div>

              <MapPinned className="h-5 w-5 text-slate-500" />
            </div>

            <div className="space-y-4">
              {visibleTurfRows.map((turf) => (
                <div
                  key={turf.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{turf.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {turf.completion}% complete · {turf.conversations} conversations
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Focus Queue</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Field Priorities
              </h2>
            </div>

            <ClipboardList className="h-5 w-5 text-slate-500" />
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
                    {item.linkedListName && demoRole !== "general_user" ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Linked list: {item.linkedListName}
                      </p>
                    ) : null}
                    {selectedFocusTaskId === item.id && selectedFocusPatternHint ? (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        {selectedFocusPatternHint}
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

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                        item.type
                      )}`}
                    >
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
                ? "Field focus mode should narrow execution to turf completion, strongest-canvasser allocation, and immediate follow-up generation from high-value conversations."
                : demoRole === "director"
                ? "Field focus mode should help lane leaders complete lagging turf, allocate canvassers, and move quality conversations into follow-up."
                : "Field focus mode should keep the next turf and follow-up actions clear and easy to work."}
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
              Turf Pressure
            </div>
            <Route className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>Active turf: {visibleTurfRows.length}</div>
            <div>Under 60% complete: {turfPressure.underSixtyCount}</div>
            <div>Unfinished turf: {turfPressure.unfinishedCount}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">
              Conversation Yield
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              Avg conversation rate:{" "}
              {topLine.doors > 0
                ? `${Math.round((topLine.conversations / topLine.doors) * 100)}%`
                : "0%"}
            </div>
            <div>
              Avg ID rate:{" "}
              {topLine.conversations > 0
                ? `${Math.round((topLine.ids / topLine.conversations) * 100)}%`
                : "0%"}
            </div>
            <div>Best output: Tyler</div>
          </div>
        </div>

        {demoRole !== "general_user" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-500">
                Follow-Up Signal
              </div>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div>Generated follow-up lists: {generatedLists.length}</div>
              <div>Conversation clusters to review: 3</div>
              <div>Immediate action items: {visibleFocusQueue.length}</div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {demoRole === "general_user" ? "Field Work Loop" : "Field Loop"}
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              {demoRole === "general_user"
                ? "Work Through The Next Field Moves"
                : "Identify → Work → Convert → Move"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {demoRole === "admin"
                ? "Work through lagging turf, deployment, and follow-up generation without losing momentum."
                : demoRole === "director"
                ? "Keep the field lane moving through completion, deployment, and follow-up generation."
                : "Stay inside the immediate field actions that need to move right now."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFieldLoopMode((value) => !value)}
            className={
              fieldLoopMode
                ? "rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            }
          >
            {fieldLoopButtonLabel}
          </button>
        </div>

        {fieldLoopMode ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3">
              {visibleFocusQueue.map((task) => {
                const isSelected = selectedFocusTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedFocusTaskId(task.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.summary}
                        </p>
                        {task.linkedListName && demoRole !== "general_user" ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Linked list: {task.linkedListName}
                          </p>
                        ) : null}
                        {isSelected && selectedFocusPatternHint ? (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            {selectedFocusPatternHint}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                            task.type
                          )}`}
                        >
                          {task.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              {selectedFocusTask ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Aether Recommendation
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {getFieldRecommendation(selectedFocusTask)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Save cleanly, move the best field signal forward, then continue.
                  </p>
                  {selectedFocusPatternHint ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      {selectedFocusPatternHint}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {fieldMessage ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {fieldMessage}
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Execution Result
                  </p>
                  <select
                    value={fieldResult}
                    onChange={(e) => setFieldResult(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Select result</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="needs_follow_up">Needs Follow-Up</option>
                    <option value="reassigned">Reassigned</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  <textarea
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveFieldLoop}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {demoRole === "general_user" ? "Save & Continue" : "Save & Move"}
                  </button>

                  <button
                    onClick={moveToNextFieldTask}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Next Priority
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {demoRole === "general_user"
              ? "Enable Field Work to move through the next field actions in sequence."
              : "Enable Field Loop to work through turf completion, canvasser allocation, and follow-up generation in sequence."}
          </div>
        )}
      </section>
    </div>
  );
}