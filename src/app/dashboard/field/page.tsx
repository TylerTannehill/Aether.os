"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
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
import {
  getFieldMetricRows,
  type FieldMetricRow,
} from "@/lib/data/field";

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


function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function buildTurfRowsFromMetrics(rows: FieldMetricRow[]): TurfRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: row.turf_name || "Unnamed Turf",
    region: row.region || "Unassigned Region",
    doors: toNumber(row.doors),
    conversations: toNumber(row.conversations),
    ids: toNumber(row.ids),
    completion: toNumber(row.completion),
    owner: row.canvasser_name || "Unassigned",
  }));
}

function buildCanvasserRowsFromMetrics(rows: FieldMetricRow[]): CanvasserRow[] {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      doors: number;
      conversations: number;
      ids: number;
      shifts: number;
    }
  >();

  for (const row of rows) {
    const name = row.canvasser_name || "Unassigned";
    const existing =
      grouped.get(name) ??
      {
        id: `canvasser-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        doors: 0,
        conversations: 0,
        ids: 0,
        shifts: 0,
      };

    existing.doors += toNumber(row.doors);
    existing.conversations += toNumber(row.conversations);
    existing.ids += toNumber(row.ids);
    existing.shifts += 1;

    grouped.set(name, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => b.doors - a.doors);
}

function buildFieldFocusQueueFromTurf(turfRows: TurfRow[]): FieldFocusTask[] {
  const tasks: FieldFocusTask[] = [];

  const lowestCompletion = [...turfRows]
    .filter((turf) => turf.completion < 100)
    .sort((a, b) => a.completion - b.completion)[0];

  const highestIdTurf = [...turfRows].sort((a, b) => b.ids - a.ids)[0];

  const bestConversationTurf = [...turfRows].sort(
    (a, b) => b.conversations - a.conversations
  )[0];

  if (lowestCompletion) {
    tasks.push({
      id: `focus-turf-${lowestCompletion.id}`,
      title: `Finish ${lowestCompletion.name}`,
      type: "turf",
      priority: lowestCompletion.completion < 60 ? "high" : "medium",
      summary: `${lowestCompletion.name} is ${lowestCompletion.completion}% complete and should move before it creates field drag.`,
      linkedListId: lowestCompletion.linkedListId,
      linkedListName: lowestCompletion.linkedListName,
    });
  }

  if (highestIdTurf && highestIdTurf.ids > 0) {
    tasks.push({
      id: `focus-id-${highestIdTurf.id}`,
      title: `Review high-ID movement in ${highestIdTurf.name}`,
      type: "canvass",
      priority: "high",
      summary: `${highestIdTurf.name} is carrying the strongest ID signal in the uploaded field metrics.`,
      linkedListId: highestIdTurf.linkedListId,
      linkedListName: highestIdTurf.linkedListName,
    });
  }

  if (bestConversationTurf && bestConversationTurf.conversations > 0) {
    tasks.push({
      id: `focus-followup-${bestConversationTurf.id}`,
      title: `Convert conversations from ${bestConversationTurf.name}`,
      type: "follow_up",
      priority: "medium",
      summary: `${bestConversationTurf.name} has the strongest conversation volume and may be ready for follow-up routing.`,
      linkedListId: bestConversationTurf.linkedListId,
      linkedListName: bestConversationTurf.linkedListName,
    });
  }

  return tasks.slice(0, 3);
}

function buildFieldChartData(rows: FieldMetricRow[]) {
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
      doors: toNumber(row.doors),
      conversations: toNumber(row.conversations),
      ids: toNumber(row.ids),
      completion: toNumber(row.completion),
    }));
}

function getBestOutputName(canvasserRows: CanvasserRow[]) {
  const winner = [...canvasserRows].sort((a, b) => b.ids - a.ids)[0];
  return winner?.name || "No canvasser data";
}


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
  const [fieldMetricRows, setFieldMetricRows] = useState<FieldMetricRow[]>([]);
  const [fieldLoading, setFieldLoading] = useState(true);
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState("");
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

  useEffect(() => {
    let mounted = true;

    async function loadFieldRows() {
      try {
        setFieldLoading(true);
        const rows = await getFieldMetricRows();

        if (!mounted) return;

        setFieldMetricRows(rows);
      } catch (error) {
        console.error("Failed to load field page metrics:", error);

        if (!mounted) return;

        setFieldMetricRows([]);
      } finally {
        if (mounted) {
          setFieldLoading(false);
        }
      }
    }

    loadFieldRows();

    return () => {
      mounted = false;
    };
  }, []);

  const turfRows = useMemo<TurfRow[]>(() => {
    return buildTurfRowsFromMetrics(fieldMetricRows);
  }, [fieldMetricRows]);

  const canvasserRows = useMemo<CanvasserRow[]>(() => {
    return buildCanvasserRowsFromMetrics(fieldMetricRows);
  }, [fieldMetricRows]);

    const focusQueue = useMemo<FieldFocusTask[]>(() => {
    return buildFieldFocusQueueFromTurf(turfRows);
  }, [turfRows]);

  const selectedFocusTask = useMemo(() => {
    return (
      focusQueue.find((item) => item.id === selectedFocusTaskId) ||
      focusQueue[0] ||
      null
    );
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

  const chartData = useMemo(() => {
    return buildFieldChartData(fieldMetricRows);
  }, [fieldMetricRows]);

  const chartMax = Math.max(...chartData.map((point) => point[trendView]), 1);

  const aiSummary = useMemo(() => {
    if (!turfRows.length) {
      return {
        headline: "No field metrics uploaded yet.",
        body: "Field will stay quiet until turf or canvass metrics are available for this campaign.",
        recommendation:
          "Upload field metrics to activate turf, canvasser, completion, and follow-up reads.",
        action: "Upload field data to activate field intelligence.",
      };
    }

    const lowestCompletion = [...turfRows]
      .filter((turf) => turf.completion < 100)
      .sort((a, b) => a.completion - b.completion)[0];

    const bestIdTurf = [...turfRows].sort((a, b) => b.ids - a.ids)[0];

    return {
      headline: lowestCompletion
        ? `${lowestCompletion.name} is the clearest completion pressure.`
        : "Field activity is available for review.",
      body: lowestCompletion
        ? `${lowestCompletion.name} is ${lowestCompletion.completion}% complete in the uploaded field metrics.`
        : "Uploaded field metrics are available for review.",
      recommendation: bestIdTurf
        ? `Review ${bestIdTurf.name} for ID movement and follow-up conversion.`
        : "Review the uploaded turf metrics and decide the next field move.",
      action:
        focusQueue[0]?.summary ||
        "Review field metrics and move the next field priority.",
    };
  }, [turfRows, focusQueue]);

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

  const trendHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Weekly Trend";
    }

    if (demoRole === "director") {
      return "Lane Trend";
    }

    return "Active Trend";
  }, [demoRole]);

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

          {chartData.length > 0 ? (
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
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No field trend data available yet.
            </div>
          )}
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
        {visibleTurfRows.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm xl:col-span-4">
            {fieldLoading
              ? "Loading field metrics..."
              : "No field turf metrics available for this campaign yet."}
          </div>
        ) : null}

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
              {visibleCanvasserRows.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No canvasser output is connected yet.
                </div>
              ) : null}

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
              {visibleTurfRows.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No active field priorities are available yet.
                </div>
              ) : null}

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
            {visibleFocusQueue.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No field focus queue items are available from live metrics yet.
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
            <div>Best output: {getBestOutputName(canvasserRows)}</div>
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
              <div>Conversation clusters to review: 0</div>
              <div>Immediate action items: {visibleFocusQueue.length}</div>
            </div>
          </div>
        ) : null}
      </section>

    </div>
  );
}