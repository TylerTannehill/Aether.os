"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  DollarSign,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Settings,
  Zap,
} from "lucide-react";
import {
  computeDashboardMetrics,
  filterDashboardDataByOwner,
  getDashboardData,
  getOwnerDashboardSignals,
} from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
import {
  getDigitalSnapshot,
  type DigitalSnapshot,
} from "@/lib/data/digital";
import {
  getFieldSnapshot,
  type FieldSnapshot,
} from "@/lib/data/field";
import {
  getPrintSnapshot,
  type PrintSnapshot,
} from "@/lib/data/print";
import {
  getFinanceSnapshot,
  type FinanceSnapshot,
} from "@/lib/data/finance";
import CrossDomainChart from "@/components/dashboard/cross-domain-chart";
import { useDashboardOwner } from "./owner-context";
import { useFocusContext } from "@/lib/focus/focus-context";
import { buildCommandCenterAdapterResult } from "@/lib/priority/command-center-adapter";
import { getCommandCenterPageData } from "@/lib/priority/command-center-selectors";
import { getActionEnginePageData } from "@/lib/priority/action-engine-selectors";
import { buildUnifiedActionEngineAdapterResult } from "@/lib/priority/action-engine-adapter";
import {
  getOutreachSignals,
  getFinanceSignals,
  getFieldSignals,
  getDigitalSignals,
  getPrintSignals,
} from "@/lib/intelligence/signals";
import {
  aggregateAetherIntelligence,
  buildAetherSummaryText,
} from "@/lib/intelligence/aggregator";
import {
  getTopTriggerActions,
  buildActionItemsFromTriggers,
} from "@/lib/intelligence/action-triggers";
import { getGovernedExecutionDecision } from "@/lib/priority/action-execution-client";
import {
  AbeDepartment,
  AbeGlobalMemory,
  AbePatternInsight,
  departmentLabel,
} from "@/lib/abe/abe-memory";
import { AbeBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";
import { buildAbePatternInsights } from "@/lib/abe/abe-patterns";

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in_progress", "in progress", "active"].includes(value)) {
    return "in_progress";
  }

  return value || "open";
}

function getActionTitle(action: any) {
  return String(
    action?.title ??
      action?.label ??
      action?.headline ??
      action?.name ??
      "Untitled action"
  );
}

function getActionWhyNow(action: any) {
  return String(
    action?.whyNow ??
      action?.reason ??
      action?.summary ??
      action?.description ??
      "Priority action surfaced by the engine."
  );
}

function getActionDomain(action: any) {
  return String(action?.domain ?? action?.department ?? "system").toLowerCase();
}

function getActionScore(action: any) {
  const raw = Number(
    action?.score ??
      action?.priorityScore ??
      action?.pressureScore ??
      action?.rank ??
      0
  );

  if (Number.isNaN(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

function getActionMode(action: any): "auto" | "manual" | "blocked" {
  const policyStatus = String(
    action?.policyStatus ?? action?.governanceStatus ?? action?.status ?? ""
  ).toLowerCase();

  if (
    Boolean(action?.blocked) ||
    policyStatus.includes("blocked") ||
    policyStatus.includes("deny")
  ) {
    return "blocked";
  }

  if (
    Boolean(action?.autoExecutable) ||
    Boolean(action?.canAutoExecute) ||
    Boolean(action?.auto_execute) ||
    policyStatus.includes("auto")
  ) {
    return "auto";
  }

  return "manual";
}

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = AbeDepartment;

function getPatternSeverityTone(severity: AbePatternInsight["severity"]) {
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

function getAbePrimaryDepartmentFromSummary(input: {
  headline?: string | null;
  body?: string | null;
  crossDomain?: string | null;
}): AbeDepartment {
  const text = `${input.headline ?? ""} ${input.body ?? ""} ${
    input.crossDomain ?? ""
  }`.toLowerCase();

  const score = {
    outreach: 0,
    finance: 0,
    field: 0,
    digital: 0,
    print: 0,
  };

  const applyMatches = (department: AbeDepartment, patterns: string[]) => {
    patterns.forEach((pattern) => {
      if (text.includes(pattern)) {
        score[department] += 1;
      }
    });
  };

  applyMatches("outreach", [
    "outreach",
    "follow-up",
    "follow up",
    "call",
    "calls",
    "contact",
    "contacts",
    "engagement",
    "ready for the next ask",
    "list",
    "lists",
  ]);

  applyMatches("finance", [
    "finance",
    "donor",
    "donors",
    "pledge",
    "pledges",
    "money",
    "revenue",
    "cash",
    "compliance",
    "fundraising",
  ]);

  applyMatches("field", [
    "field",
    "doors",
    "door",
    "canvass",
    "canvasser",
    "conversations",
    "turf",
    "turfs",
    "deployment",
    "zone",
  ]);

  applyMatches("digital", [
    "digital",
    "content",
    "paid",
    "impressions",
    "engagement",
    "sentiment",
    "platform",
    "platforms",
    "ctr",
  ]);

  applyMatches("print", [
    "print",
    "mail",
    "mailer",
    "mailers",
    "asset",
    "assets",
    "materials",
    "inventory",
    "delivery",
    "approval",
  ]);

  const ranked = (Object.entries(score) as [AbeDepartment, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([department]) => department);

  return ranked[0] ?? "outreach";
}

function getAbeDepartmentMeta(department: AbeDepartment) {
  switch (department) {
    case "finance":
      return {
        label: "Finance",
        route: "/dashboard/finance",
        cta: "Open Finance Overview",
      };
    case "field":
      return {
        label: "Field",
        route: "/dashboard/field",
        cta: "Open Field Overview",
      };
    case "digital":
      return {
        label: "Digital",
        route: "/dashboard/digital",
        cta: "Open Digital Overview",
      };
    case "print":
      return {
        label: "Print",
        route: "/dashboard/print",
        cta: "Open Print Overview",
      };
    case "outreach":
    default:
      return {
        label: "Outreach",
        route: "/dashboard/outreach",
        cta: "Open Outreach Overview",
      };
  }
}

function buildAbeV1Briefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  financeSnapshot: FinanceSnapshot;
  fieldSnapshot: FieldSnapshot;
  printSnapshot: PrintSnapshot;
  digitalSnapshot: DigitalSnapshot;
  fieldAverageCompletion: number;
  digitalSentimentNegative: number;
  filteredTasks: any[];
  filteredContacts: any[];
  filteredLogs: any[];
  intelligenceHeadline?: string | null;
  intelligenceBody?: string | null;
  intelligenceCrossDomain?: string | null;
}): AbeBriefing {
  const outreachPressure =
    input.filteredTasks.filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);

      return (
        status !== "completed" &&
        (title.includes("follow-up") || title.includes("follow up"))
      );
    }).length +
    Math.max(
      0,
      input.filteredContacts.filter((contact: any) =>
        Boolean(contact.needs_follow_up)
      ).length
    );

  const outreachOpportunity = input.filteredLogs.filter((log: any) => {
    const result = String(log.result || "").toLowerCase();

    return (
      result.includes("positive") ||
      result.includes("support") ||
      result.includes("interested") ||
      result.includes("pledge")
    );
  }).length;

  const financePressure =
    Math.max(
      0,
      Math.round(
        input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn ? 2 : 0
      )
    ) + Math.max(0, Math.round(input.financeSnapshot.pledges / 1000));

  const financeOpportunity = Math.max(
    0,
    Math.round(input.financeSnapshot.moneyIn / 1000)
  );

  const fieldPressure = Math.max(0, 100 - input.fieldAverageCompletion);
  const fieldOpportunity = Math.max(
    0,
    Math.round(input.fieldSnapshot.conversations / 10)
  );

  const digitalPressure = input.digitalSentimentNegative;
  const digitalOpportunity = Math.max(
    0,
    Math.round(input.digitalSnapshot.impressions / 5000)
  );

  const printPressure = Math.max(
    0,
    input.printSnapshot.orders * 8 - input.printSnapshot.approvalReady * 3
  );
  const printOpportunity = Math.max(0, input.printSnapshot.approvalReady * 10);

  const lanes: {
    key: AbeDepartment;
    label: string;
    pressure: number;
    opportunity: number;
  }[] = [
    {
      key: "outreach",
      label: "Outreach",
      pressure: outreachPressure,
      opportunity: outreachOpportunity,
    },
    {
      key: "finance",
      label: "Finance",
      pressure: financePressure,
      opportunity: financeOpportunity,
    },
    {
      key: "field",
      label: "Field",
      pressure: fieldPressure,
      opportunity: fieldOpportunity,
    },
    {
      key: "digital",
      label: "Digital",
      pressure: digitalPressure,
      opportunity: digitalOpportunity,
    },
    {
      key: "print",
      label: "Print",
      pressure: printPressure,
      opportunity: printOpportunity,
    },
  ];

  const strongestLane =
    [...lanes].sort((a, b) => {
      const aScore = a.opportunity - a.pressure * 0.35;
      const bScore = b.opportunity - b.pressure * 0.35;
      return bScore - aScore;
    })[0]?.key ?? "digital";

  const weakestLane =
    [...lanes].sort((a, b) => {
      const aScore = a.pressure - a.opportunity * 0.2;
      const bScore = b.pressure - b.opportunity * 0.2;
      return bScore - aScore;
    })[0]?.key ?? "outreach";

  const summaryPrimary = getAbePrimaryDepartmentFromSummary({
    headline: input.intelligenceHeadline,
    body: input.intelligenceBody,
    crossDomain: input.intelligenceCrossDomain,
  });

  const primaryLane =
    input.role === "admin" ? summaryPrimary : input.demoDepartment;

  const opportunityLane =
    [...lanes].sort((a, b) => b.opportunity - a.opportunity)[0]?.key ??
    strongestLane;

  const totalPressure = lanes.reduce((sum, lane) => sum + lane.pressure, 0);
  const totalOpportunity = lanes.reduce(
    (sum, lane) => sum + lane.opportunity,
    0
  );

  let health = "Stable overall";
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    health = "Under financial pressure";
  } else if (totalOpportunity >= totalPressure * 1.35) {
    health = "Momentum building";
  } else if (totalPressure > totalOpportunity * 1.1) {
    health = "Pressure is rising";
  }

  let campaignStatus = "Stable overall";
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    campaignStatus = "At risk with financial pressure";
  } else if (totalOpportunity >= totalPressure * 1.2) {
    campaignStatus = "Stable with opportunity";
  } else if (totalPressure > totalOpportunity) {
    campaignStatus = "Stable, but pressure is rising";
  }

  let whyNow =
    "Multiple campaign lanes are moving at once, and pressure is starting to concentrate.";

  if (primaryLane === "outreach") {
    whyNow =
      "Positive engagement is building faster than follow-up capacity, which makes responsiveness the immediate risk.";
  } else if (primaryLane === "finance") {
    whyNow =
      "Available dollars and pending pledges need tighter follow-through before revenue momentum softens.";
  } else if (primaryLane === "field") {
    whyNow =
      "Coverage pace is uneven, so field movement needs support before completion falls further behind.";
  } else if (primaryLane === "digital") {
    whyNow =
      "Digital reach is creating visibility, but sentiment and follow-through will determine whether that momentum converts.";
  } else if (primaryLane === "print") {
    whyNow =
      "Print readiness can unlock downstream movement, but delivery timing is becoming the constraint.";
  }

  const supportText =
    input.role === "admin"
      ? `Open ${departmentLabel(primaryLane)} to review the supporting analytics behind this read and keep the campaign aligned around the right lane.`
      : `Open ${departmentLabel(
          input.demoDepartment
        )} to review the supporting analytics behind this read and keep your lane moving with the right context.`;

  const actions: string[] = [];

  if (input.role === "admin") {
    if (primaryLane === "outreach") {
      actions.push(
        "Clear the follow-up queue before active engagement cools."
      );
    }
    if (input.financeSnapshot.pledges > 0) {
      actions.push(
        "Tighten donor follow-through where pledge dollars are still waiting."
      );
    }
    if (input.fieldAverageCompletion < 65) {
      actions.push(
        "Support field coverage before completion pace slips further."
      );
    }
    if (input.digitalSentimentNegative >= 30) {
      actions.push("Monitor digital sentiment before pushing harder on spend.");
    }
    if (input.printSnapshot.approvalReady > 0) {
      actions.push(
        "Unlock ready print assets so downstream lanes keep moving."
      );
    }
  } else if (input.role === "director") {
    if (input.demoDepartment === "outreach") {
      actions.push("Clear lane follow-up before responsiveness slips.");
      actions.push("Work the warmest contacts before momentum cools.");
    } else if (input.demoDepartment === "finance") {
      actions.push("Collect high-probability pledges before they stall.");
      actions.push("Tighten finance follow-through and compliance cleanup.");
    } else if (input.demoDepartment === "field") {
      actions.push("Push lagging turf to completion before pace falls behind.");
      actions.push(
        "Shift stronger canvassers into the highest-opportunity lane."
      );
    } else if (input.demoDepartment === "digital") {
      actions.push("Refresh weak creative before spend efficiency softens.");
      actions.push("Protect momentum on the strongest-performing platform.");
    } else if (input.demoDepartment === "print") {
      actions.push("Push approvals faster so production timing holds.");
      actions.push("Protect exposed material inventory before drawdown hits.");
    }
  } else {
    if (input.demoDepartment === "outreach") {
      actions.push("Work the next follow-up now.");
      actions.push("Keep the queue moving while contact energy is still warm.");
    } else if (input.demoDepartment === "finance") {
      actions.push("Collect the next available pledge.");
      actions.push("Fix incomplete donor details before they become a block.");
    } else if (input.demoDepartment === "field") {
      actions.push("Finish the active turf before switching lanes.");
      actions.push("Move the strongest conversation into follow-up quickly.");
    } else if (input.demoDepartment === "digital") {
      actions.push("Ship the next creative or spend decision now.");
      actions.push("Handle weak sentiment before it spreads.");
    } else if (input.demoDepartment === "print") {
      actions.push("Move the next approval or inventory action now.");
      actions.push("Confirm timing before downstream work waits on print.");
    }
  }

  if (actions.length === 0) {
    actions.push(
      "Keep execution tight across active lanes and maintain momentum."
    );
  }

  return {
    health,
    strongest: strongestLane,
    weakest: weakestLane,
    primaryLane,
    opportunityLane,
    campaignStatus,
    whyNow,
    supportText,
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal: input.intelligenceCrossDomain || undefined,
  };
}

type DashboardTask = DashboardData["tasks"][number];

type TopActionView = {
  raw: any;
  id: string;
  title: string;
  whyNow: string;
  domain: string;
  score: number;
  mode: "auto" | "manual" | "blocked";
  governance: {
    allowed: boolean;
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    reason: string;
  };
};

export default function DashboardPage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [digitalSnapshot, setDigitalSnapshot] = useState<DigitalSnapshot>({
    impressions: 0,
    engagement: 0,
    spend: 0,
    bestPlatform: "No platform data",
    issue: "No digital issues detected yet.",
  });

  const [fieldSnapshot, setFieldSnapshot] = useState<FieldSnapshot>({
    doors: 0,
    conversations: 0,
    ids: 0,
    strongestCanvasser: "No canvasser data",
    issue: "No field issues detected yet.",
  });

  const [printSnapshot, setPrintSnapshot] = useState<PrintSnapshot>({
    onHand: 0,
    orders: 0,
    approvalReady: 0,
    pressureItem: "No print inventory data",
    issue: "No print issues detected yet.",
  });

  const [financeSnapshot, setFinanceSnapshot] = useState<FinanceSnapshot>({
    moneyIn: 0,
    moneyOut: 0,
    net: 0,
    pledges: 0,
  });

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("outreach");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const router = useRouter();
  const { ownerFilter, applyMyDashboard } = useDashboardOwner();
  const { setFocusContext } = useFocusContext();

  function openFocusBucket(
    bucket:
      | "immediate"
      | "fixNow"
      | "followUp"
      | "routing"
      | "owner"
      | "pipeline",
    domain?: "finance" | "field" | "outreach" | "digital" | "print",
    trigger?: string
  ) {
    setFocusContext({
      bucket,
      domain,
      trigger,
      source: "dashboard",
    });

    router.push("/dashboard/focus");
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [
        data,
        liveDigitalSnapshot,
        liveFieldSnapshot,
        livePrintSnapshot,
        liveFinanceSnapshot,
      ] = await Promise.all([
        getDashboardData(),
        getDigitalSnapshot(),
        getFieldSnapshot(),
        getPrintSnapshot(),
        getFinanceSnapshot(),
      ]);

      setContacts(data.contacts ?? []);
      setLists(data.lists ?? []);
      setLogs(data.logs ?? []);
      setTasks((data.tasks as DashboardTask[]) ?? []);
      setDigitalSnapshot(liveDigitalSnapshot);
      setFieldSnapshot(liveFieldSnapshot);
      setPrintSnapshot(livePrintSnapshot);
      setFinanceSnapshot(liveFinanceSnapshot);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }
    const rawData = useMemo<DashboardData>(() => {
    return {
      contacts: contacts ?? [],
      lists: lists ?? [],
      logs: logs ?? [],
      tasks: tasks ?? [],
    };
  }, [contacts, lists, logs, tasks]);

  const filteredData = useMemo<DashboardData>(() => {
    const result = filterDashboardDataByOwner(rawData, ownerFilter);

    return {
      contacts: result?.contacts ?? [],
      lists: result?.lists ?? [],
      logs: result?.logs ?? [],
      tasks: result?.tasks ?? [],
    };
  }, [rawData, ownerFilter]);

  const metrics = useMemo(() => {
    return computeDashboardMetrics(
      filteredData.contacts ?? [],
      filteredData.lists ?? [],
      filteredData.logs ?? []
    );
  }, [filteredData]);

  const ownerSignalsRaw = useMemo(() => {
    return getOwnerDashboardSignals(filteredData.tasks ?? []);
  }, [filteredData]);

  const ownerSignals = useMemo(() => {
    if (Array.isArray(ownerSignalsRaw)) {
      return ownerSignalsRaw;
    }

    if (ownerSignalsRaw && typeof ownerSignalsRaw === "object") {
      const values = Object.values(ownerSignalsRaw as Record<string, unknown>);
      return values.filter(
        (value): value is { owner?: string; summary?: string } =>
          Boolean(value) && typeof value === "object"
      );
    }

    return [];
  }, [ownerSignalsRaw]);

  const openTasks = useMemo(
    () =>
      (filteredData.tasks ?? []).filter(
        (task: any) => normalizeTaskStatus(task.status) !== "completed"
      ).length,
    [filteredData]
  );

  const completedTasks = useMemo(
    () =>
      (filteredData.tasks ?? []).filter(
        (task: any) => normalizeTaskStatus(task.status) === "completed"
      ).length,
    [filteredData]
  );

  const overdueTasks = useMemo(
    () =>
      (filteredData.tasks ?? []).filter((task: any) => {
        const status = normalizeTaskStatus(task.status);
        const dueDate = task.due_date || task.due_at;

        return (
          status !== "completed" && !!dueDate && new Date(dueDate) < new Date()
        );
      }).length,
    [filteredData]
  );

  const priorityTasks = useMemo(() => {
    return (filteredData.tasks ?? []).map((task: any) => ({
      id: String(task.id),
      title: task.title ?? "Untitled task",
      status: normalizeTaskStatus(task.status),
      priority: task.priority ?? null,
      due_at: task.due_at ?? task.due_date ?? null,
      created_at: task.created_at ?? null,
      updated_at: task.updated_at ?? null,
      completed_at:
        normalizeTaskStatus(task.status) === "completed"
          ? task.updated_at ?? task.completed_at ?? null
          : task.completed_at ?? null,
      assigned_to: task.assigned_to ?? null,
      owner_id: task.owner_id ?? null,
      department: task.department ?? null,
      blocked: Boolean(task.blocked),
      contact_id: task.contact_id ?? null,
      estimated_value: Number(task.estimated_value ?? 0) || null,
    }));
  }, [filteredData.tasks]);

  const priorityContacts = useMemo(() => {
    return (filteredData.contacts ?? []).map((contact: any) => ({
      id: String(contact.id),
      first_name: contact.first_name ?? null,
      last_name: contact.last_name ?? null,
      full_name:
        contact.full_name ??
        `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
      owner_id: contact.owner_id ?? null,
      assigned_to: contact.assigned_to ?? contact.owner ?? null,
      last_contacted_at:
        contact.last_contacted_at ??
        contact.last_outreach_at ??
        contact.updated_at ??
        null,
      updated_at: contact.updated_at ?? null,
      created_at: contact.created_at ?? null,
      phone: contact.phone ?? null,
      email: contact.email ?? null,
      city: contact.city ?? null,
      state: contact.state ?? null,
      employer: contact.employer ?? null,
      occupation: contact.occupation ?? null,
      donor_status: contact.donor_status ?? null,
      pledge_amount: Number(contact.pledge_amount ?? 0) || null,
      donation_total: Number(contact.donation_total ?? 0) || null,
      lifetime_value:
        Number(contact.lifetime_value ?? contact.donation_total ?? 0) || null,
      support_score: Number(contact.support_score ?? 0) || null,
      engagement_score: Number(contact.engagement_score ?? 0) || null,
      needs_follow_up: Boolean(contact.needs_follow_up),
      is_stale: Boolean(contact.is_stale),
    }));
  }, [filteredData.contacts]);

  const ownerDirectory = useMemo(() => {
    const map: Record<string, string> = {};

    (filteredData.contacts ?? []).forEach((contact: any) => {
      const ownerId =
        contact.owner_id ??
        contact.assigned_to ??
        contact.owner ??
        contact.owner_name;

      const ownerName =
        contact.owner_name ??
        contact.owner ??
        contact.assigned_to ??
        contact.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    (filteredData.tasks ?? []).forEach((task: any) => {
      const ownerId = task.owner_id ?? task.assigned_to;
      const ownerName = task.owner_name ?? task.assigned_to ?? task.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    return map;
  }, [filteredData]);

  const commandCenterInput = useMemo(() => {
    return {
      tasks: priorityTasks,
      contacts: priorityContacts,
      opportunities: [],
      ownerDirectory,
    };
  }, [priorityTasks, priorityContacts, ownerDirectory]);

  const commandCenterFull = useMemo(() => {
    return buildCommandCenterAdapterResult(commandCenterInput);
  }, [commandCenterInput]);

  const commandCenterPage = useMemo(() => {
    return getCommandCenterPageData(commandCenterFull.snapshot);
  }, [commandCenterFull]);

  const fieldAverageCompletion = useMemo(() => {
    if (fieldSnapshot.doors <= 0) return 0;

    const estimatedCapacity = Math.max(
      fieldSnapshot.doors,
      fieldSnapshot.doors + 200
    );

    return Math.min(
      100,
      Math.max(0, Math.round((fieldSnapshot.doors / estimatedCapacity) * 100))
    );
  }, [fieldSnapshot]);

  const digitalSentimentRatio = useMemo(() => {
    const negativeWeight = String(digitalSnapshot.issue || "")
      .toLowerCase()
      .includes("negative")
      ? 38
      : 24;

    const positiveWeight = Math.max(100 - negativeWeight, 0);

    return {
      positive: positiveWeight,
      negative: negativeWeight,
    };
  }, [digitalSnapshot]);

  const outreachBundle = useMemo(() => {
    const staleContacts = (filteredData.contacts ?? []).filter((contact: any) =>
      Boolean(contact.is_stale)
    ).length;

    const pendingFollowUps = (filteredData.tasks ?? []).filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);

      return (
        status !== "completed" &&
        (title.includes("follow-up") || title.includes("follow up"))
      );
    }).length;

    const positiveContacts = (filteredData.logs ?? []).filter((log: any) => {
      const result = String(log.result || "").toLowerCase();

      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
      );
    }).length;

    const uncontactedContacts = Math.max(
      0,
      (filteredData.contacts ?? []).length - (filteredData.logs ?? []).length
    );

    return getOutreachSignals({
      staleContacts,
      pendingFollowUps,
      positiveContacts,
      uncontactedContacts,
    });
  }, [filteredData]);

  const financeBundle = useMemo(() => {
    const missingComplianceRecords = Math.max(
      0,
      Math.round(financeSnapshot.pledges / 1000)
    );

    const overduePledges = Math.max(
      0,
      Math.round(financeSnapshot.pledges / 2500)
    );

    const highValueDonorsPending = (filteredData.contacts ?? []).filter(
      (contact: any) =>
        Number(contact.donation_total ?? 0) >= 500 ||
        Number(contact.pledge_amount ?? 0) >= 500
    ).length;

    const cashOnHandPressure =
      financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 8 : 4;

    return getFinanceSignals({
      missingComplianceRecords,
      overduePledges,
      highValueDonorsPending,
      cashOnHandPressure,
    });
  }, [financeSnapshot, filteredData.contacts]);

  const fieldBundle = useMemo(() => {
    const incompleteTurfs =
      fieldSnapshot.doors > 0
        ? Math.max(1, Math.round(fieldSnapshot.doors / 700))
        : 0;

    const highPriorityTurfs =
      fieldSnapshot.ids > 0
        ? Math.max(1, Math.round(fieldSnapshot.ids / 80))
        : 0;

    const strongIdRateZones =
      fieldSnapshot.ids > 0 && fieldSnapshot.conversations > 0
        ? Math.max(
            1,
            Math.round((fieldSnapshot.ids / fieldSnapshot.conversations) * 4)
          )
        : 0;

    const weakCoverageZones =
      fieldSnapshot.doors > 0
        ? Math.max(1, Math.round(fieldSnapshot.doors / 1200))
        : 0;

    return getFieldSignals({
      incompleteTurfs,
      highPriorityTurfs,
      strongIdRateZones,
      weakCoverageZones,
    });
  }, [fieldSnapshot]);
    const digitalBundle = useMemo(() => {
    const issueText = String(digitalSnapshot.issue || "").toLowerCase();
    const fallingCtrPlatforms = issueText.includes("issue") ? 1 : 0;
    const strongPerformingPlatforms = digitalSnapshot.bestPlatform ? 1 : 0;
    const negativeSentimentThreads = issueText.includes("sentiment") ? 1 : 0;
    const contentBacklogCount = Math.max(
      1,
      Math.round(digitalSnapshot.engagement / 5000)
    );

    return getDigitalSignals({
      fallingCtrPlatforms,
      strongPerformingPlatforms,
      negativeSentimentThreads,
      contentBacklogCount,
    });
  }, [digitalSnapshot]);

  const printBundle = useMemo(() => {
    const approvalBlocks = printSnapshot.approvalReady > 0 ? 1 : 2;
    const nearReorderItems =
      printSnapshot.onHand > 0
        ? Math.max(1, Math.round(printSnapshot.onHand / 4000))
        : 0;
    const deliveryRisks =
      printSnapshot.orders > 0
        ? Math.max(1, Math.round(printSnapshot.orders / 2))
        : 0;
    const readyAssets = printSnapshot.approvalReady;

    return getPrintSignals({
      approvalBlocks,
      nearReorderItems,
      deliveryRisks,
      readyAssets,
    });
  }, [printSnapshot]);

  const intelligenceSnapshot = useMemo(() => {
    return aggregateAetherIntelligence(
      [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle],
      {
        finance: {
          overduePledges:
            (financeBundle.risks.find(
              (item) => item.id === "finance-overdue-pledges"
            )?.metadata?.overduePledges as number) || 0,
          highValueDonorsPending:
            (financeBundle.opportunities.find(
              (item) => item.id === "finance-high-value-donors"
            )?.metadata?.highValueDonorsPending as number) || 0,
        },
        outreach: {
          pendingFollowUps:
            (outreachBundle.risks.find(
              (item) => item.id === "outreach-pending-followups"
            )?.metadata?.pendingFollowUps as number) || 0,
          positiveContacts:
            (outreachBundle.opportunities.find(
              (item) => item.id === "outreach-positive-contacts"
            )?.metadata?.positiveContacts as number) || 0,
        },
        field: {
          strongIdRateZones:
            (fieldBundle.opportunities.find(
              (item) => item.id === "field-strong-id-zones"
            )?.metadata?.strongIdRateZones as number) || 0,
          incompleteTurfs:
            (fieldBundle.risks.find(
              (item) => item.id === "field-incomplete-turfs"
            )?.metadata?.incompleteTurfs as number) || 0,
        },
        digital: {
          strongPerformingPlatforms:
            (digitalBundle.opportunities.find(
              (item) => item.id === "digital-strong-platforms"
            )?.metadata?.strongPerformingPlatforms as number) || 0,
          negativeSentimentThreads:
            (digitalBundle.risks.find(
              (item) => item.id === "digital-negative-sentiment"
            )?.metadata?.negativeSentimentThreads as number) || 0,
        },
        print: {
          readyAssets:
            (printBundle.opportunities.find(
              (item) => item.id === "print-ready-assets"
            )?.metadata?.readyAssets as number) || 0,
          deliveryRisks:
            (printBundle.statuses.find(
              (item) => item.id === "print-delivery-risks"
            )?.metadata?.deliveryRisks as number) || 0,
        },
      }
    );
  }, [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle]);

  const intelligenceSummary = useMemo(() => {
    return buildAetherSummaryText(intelligenceSnapshot);
  }, [intelligenceSnapshot]);

  const abeBriefing = useMemo(() => {
    return buildAbeV1Briefing({
      role: demoRole,
      demoDepartment,
      financeSnapshot,
      fieldSnapshot,
      printSnapshot,
      digitalSnapshot,
      fieldAverageCompletion,
      digitalSentimentNegative: digitalSentimentRatio.negative,
      filteredTasks: filteredData.tasks ?? [],
      filteredContacts: filteredData.contacts ?? [],
      filteredLogs: filteredData.logs ?? [],
      intelligenceHeadline: intelligenceSummary.headline,
      intelligenceBody: intelligenceSummary.body,
      intelligenceCrossDomain: intelligenceSummary.crossDomain,
    });
  }, [
    demoRole,
    demoDepartment,
    financeSnapshot,
    fieldSnapshot,
    printSnapshot,
    digitalSnapshot,
    fieldAverageCompletion,
    digitalSentimentRatio.negative,
    filteredData.tasks,
    filteredData.contacts,
    filteredData.logs,
    intelligenceSummary.headline,
    intelligenceSummary.body,
    intelligenceSummary.crossDomain,
  ]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, abeBriefing));
  }, [
    abeBriefing.health,
    abeBriefing.campaignStatus,
    abeBriefing.primaryLane,
    abeBriefing.strongest,
    abeBriefing.weakest,
    abeBriefing.opportunityLane,
    abeBriefing.crossDomainSignal,
  ]);

  const abePatternWatch = useMemo(() => {
    return buildAbePatternInsights({
      role: demoRole,
      demoDepartment,
      briefing: abeBriefing,
      memory: abeMemory,
    });
  }, [demoRole, demoDepartment, abeBriefing, abeMemory]);

  const abeOverview = useMemo(() => {
    const meta = getAbeDepartmentMeta(abeBriefing.primaryLane);

    return {
      department: abeBriefing.primaryLane,
      label: meta.label,
      route: meta.route,
      cta: meta.cta,
      supportText: abeBriefing.supportText,
    };
  }, [abeBriefing]);

  const intelligenceTriggerActions = useMemo(() => {
    const highValueContacts = (filteredData.contacts ?? []).map(
      (contact: any) => ({
        id: String(contact.id),
        full_name:
          contact.full_name ??
          `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
        donation_total: Number(contact.donation_total ?? 0),
        pledge_amount: Number(contact.pledge_amount ?? 0),
        last_contacted_at:
          contact.last_contacted_at ?? contact.last_outreach_at ?? null,
      })
    );

    return getTopTriggerActions(intelligenceSnapshot, 6, {
      highValueContacts,
    });
  }, [intelligenceSnapshot, filteredData.contacts]);

  const intelligenceActionItems = useMemo(() => {
    return buildActionItemsFromTriggers(intelligenceTriggerActions);
  }, [intelligenceTriggerActions]);

  const actionEngineFull = useMemo(() => {
    return buildUnifiedActionEngineAdapterResult(
      commandCenterInput,
      intelligenceActionItems
    );
  }, [commandCenterInput, intelligenceActionItems]);

  const actionEnginePage = useMemo(() => {
    return getActionEnginePageData(actionEngineFull.actionEngine);
  }, [actionEngineFull]);

  const allTopActions = useMemo<TopActionView[]>(() => {
    return (actionEngineFull.actionEngine.topActions ?? []).map(
      (action: any) => {
        const score = getActionScore(action);
        const mode = getActionMode(action);
        const governance = getGovernedExecutionDecision(action);

        return {
          raw: action,
          id: String(
            action?.id ??
              `${getActionDomain(action)}-${getActionTitle(action)}`
          ),
          title: getActionTitle(action),
          whyNow: getActionWhyNow(action),
          domain: getActionDomain(action),
          score,
          mode,
          governance,
        };
      }
    );
  }, [actionEngineFull]);

  const scopedTopActions = useMemo(() => {
    if (demoRole === "admin") {
      return allTopActions.slice(0, 3);
    }

    if (demoRole === "director") {
      return allTopActions
        .filter((action) => action.domain === demoDepartment)
        .slice(0, 3);
    }

    return allTopActions
      .filter((action) => action.domain === demoDepartment)
      .slice(0, 2);
  }, [allTopActions, demoRole, demoDepartment]);

  const abeSignals = useMemo(() => {
    const signals: {
      type: "pressure" | "opportunity" | "cross_domain";
      label: string;
      value: string;
      sub: string;
      route: string;
      rank: number;
    }[] = [];
        if (abeBriefing.primaryLane === "outreach") {
      const followUpLoad =
        (filteredData.tasks ?? []).filter((task: any) => {
          const title = String(task.title || "").toLowerCase();
          const status = normalizeTaskStatus(task.status);

          return (
            status !== "completed" &&
            (title.includes("follow-up") || title.includes("follow up"))
          );
        }).length +
        Math.max(
          0,
          (filteredData.contacts ?? []).filter((contact: any) =>
            Boolean(contact.needs_follow_up)
          ).length
        );

      signals.push({
        type: "pressure",
        label: "Outreach Pressure",
        value: `${followUpLoad}`,
        sub: "Follow-up demand is building inside the outreach lane.",
        route: "/dashboard/outreach",
        rank: followUpLoad,
      });
    }

    if (abeBriefing.primaryLane === "finance") {
      signals.push({
        type: "pressure",
        label: "Pledge Pressure",
        value: `$${financeSnapshot.pledges.toLocaleString()}`,
        sub: "Pending pledged dollars are still sitting uncollected.",
        route: "/dashboard/finance",
        rank: Math.round(financeSnapshot.pledges / 1000),
      });
    }

    if (abeBriefing.primaryLane === "field") {
      signals.push({
        type: "pressure",
        label: "Turf Completion",
        value: `${fieldAverageCompletion}%`,
        sub: "Coverage pace needs support inside the field lane.",
        route: "/dashboard/field",
        rank: 100 - fieldAverageCompletion,
      });
    }

    if (abeBriefing.primaryLane === "digital") {
      signals.push({
        type: "pressure",
        label: "Sentiment Pressure",
        value: `${digitalSentimentRatio.positive}% / ${digitalSentimentRatio.negative}%`,
        sub: "Public-facing pressure is sitting in sentiment balance.",
        route: "/dashboard/digital",
        rank: digitalSentimentRatio.negative,
      });
    }

    if (abeBriefing.primaryLane === "print") {
      signals.push({
        type: "pressure",
        label: "Delivery Risk",
        value: `${printSnapshot.orders}`,
        sub: "Delivery timing is the pressure point in print right now.",
        route: "/dashboard/print",
        rank: printSnapshot.orders * 10,
      });
    }

    const opportunityCandidates = [
      {
        type: "opportunity" as const,
        label: "Digital Momentum",
        value: digitalSnapshot.impressions.toLocaleString(),
        sub: "Reach volume is helping expand top-of-funnel opportunity.",
        route: "/dashboard/digital",
        rank: Math.round(digitalSnapshot.impressions / 5000),
      },
      {
        type: "opportunity" as const,
        label: "Field Activity",
        value: fieldSnapshot.conversations.toLocaleString(),
        sub: "Conversation volume shows field still has usable movement.",
        route: "/dashboard/field",
        rank: Math.round(fieldSnapshot.conversations / 10),
      },
      {
        type: "opportunity" as const,
        label: "Finance Momentum",
        value: `$${financeSnapshot.moneyIn.toLocaleString()}`,
        sub: "Incoming dollars are still giving finance workable strength.",
        route: "/dashboard/finance",
        rank: Math.round(financeSnapshot.moneyIn / 1000),
      },
      {
        type: "opportunity" as const,
        label: "Print Readiness",
        value: `${printSnapshot.approvalReady}`,
        sub: "Ready assets can unlock movement in downstream work lanes.",
        route: "/dashboard/print",
        rank: printSnapshot.approvalReady * 10,
      },
    ];

    const bestOpportunity = [...opportunityCandidates].sort(
      (a, b) => b.rank - a.rank
    )[0];

    if (bestOpportunity) {
      signals.push(bestOpportunity);
    }

    if (abeBriefing.crossDomainSignal) {
      const crossRoute = abeBriefing.crossDomainSignal
        .toLowerCase()
        .includes("print")
        ? "/dashboard/print"
        : abeBriefing.crossDomainSignal.toLowerCase().includes("field")
        ? "/dashboard/field"
        : abeBriefing.crossDomainSignal.toLowerCase().includes("digital")
        ? "/dashboard/digital"
        : abeBriefing.crossDomainSignal.toLowerCase().includes("finance")
        ? "/dashboard/finance"
        : "/dashboard/outreach";

      signals.push({
        type: "cross_domain",
        label: "Cross-Domain Signal",
        value: "Active",
        sub: abeBriefing.crossDomainSignal,
        route: crossRoute,
        rank: 999,
      });
    }

    const pressureSignal = signals
      .filter((signal) => signal.type === "pressure")
      .sort((a, b) => b.rank - a.rank)[0];

    const opportunitySignal = signals
      .filter((signal) => signal.type === "opportunity")
      .sort((a, b) => b.rank - a.rank)[0];

    const crossDomainSignal = signals.find(
      (signal) => signal.type === "cross_domain"
    );

    return [pressureSignal, opportunitySignal, crossDomainSignal].filter(
      Boolean
    ) as {
      type: "pressure" | "opportunity" | "cross_domain";
      label: string;
      value: string;
      sub: string;
      route: string;
      rank: number;
    }[];
  }, [
    abeBriefing,
    filteredData.tasks,
    filteredData.contacts,
    financeSnapshot.pledges,
    financeSnapshot.moneyIn,
    fieldAverageCompletion,
    fieldSnapshot.conversations,
    digitalSentimentRatio,
    digitalSnapshot.impressions,
    printSnapshot.orders,
    printSnapshot.approvalReady,
  ]);

  const visibleAbeSignals = useMemo(() => {
    if (demoRole === "admin") {
      return abeSignals;
    }

    return abeSignals.filter((signal) =>
      signal.route.includes(demoDepartment)
    );
  }, [abeSignals, demoRole, demoDepartment]);

  const visibleSnapshotCards = useMemo(() => {
    const allCards = [
      {
        id: "digital",
        label: "Content + Paid Snapshot",
        body: digitalSnapshot.issue,
        href: "/dashboard/digital",
        tone: "border-sky-200 bg-sky-50",
      },
      {
        id: "field",
        label: "Turf + Canvass Snapshot",
        body: fieldSnapshot.issue,
        href: "/dashboard/field",
        tone: "border-emerald-200 bg-emerald-50",
      },
      {
        id: "print",
        label: "Materials + Delivery Snapshot",
        body: printSnapshot.issue,
        href: "/dashboard/print",
        tone: "border-amber-200 bg-amber-50",
      },
      {
        id: "finance",
        label: "Revenue + Compliance Snapshot",
        body:
          financeSnapshot.moneyOut > financeSnapshot.moneyIn
            ? "Spending pressure is outpacing revenue."
            : "Revenue flow is healthy.",
        href: "/dashboard/finance",
        tone: "border-emerald-200 bg-emerald-50",
      },
    ];

    if (demoRole === "admin") return allCards;
    if (demoRole === "director") {
      return allCards.filter((card) => card.id === demoDepartment);
    }

    return allCards.filter((card) => card.id === demoDepartment).slice(0, 1);
  }, [
    demoRole,
    demoDepartment,
    digitalSnapshot.issue,
    fieldSnapshot.issue,
    printSnapshot.issue,
    financeSnapshot.moneyIn,
    financeSnapshot.moneyOut,
  ]);

  const visibleLaneIds = useMemo(() => {
    if (demoRole === "admin") {
      return ["digital", "field", "print", "finance"];
    }

    if (demoRole === "director") {
      return demoDepartment === "outreach" ? ["finance"] : [demoDepartment];
    }

    if (demoDepartment === "outreach") {
      return ["finance"];
    }

    return [demoDepartment];
  }, [demoRole, demoDepartment]);

  const abeRoleLabel = useMemo(() => {
    if (demoRole === "admin") return "Admin View";
    if (demoRole === "director") return "Director View";
    return "Operator View";
  }, [demoRole]);

  const abeRoleHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return intelligenceSummary.headline;
    }

    if (demoRole === "director") {
      return `${departmentLabel(
        demoDepartment
      )} is your primary operating lane right now.`;
    }

    return `Your ${departmentLabel(
      demoDepartment
    ).toLowerCase()} work lane is what matters most right now.`;
  }, [demoRole, demoDepartment, intelligenceSummary.headline]);

  const abeRoleBody = useMemo(() => {
    if (demoRole === "admin") {
      return intelligenceSummary.body;
    }

    if (demoRole === "director") {
      return `This view narrows the dashboard around ${departmentLabel(
        demoDepartment
      ).toLowerCase()} so department leaders can focus on pressure, opportunity, and execution movement inside their own lane.`;
    }

    return `This view strips away cross-org noise and keeps attention on the immediate ${departmentLabel(
      demoDepartment
    ).toLowerCase()} work that an individual operator should understand and act on.`;
  }, [demoRole, demoDepartment, intelligenceSummary.body]);

  const abeWhyNowText = useMemo(() => {
    if (demoRole === "admin") {
      return abeBriefing.whyNow;
    }

    if (demoRole === "director") {
      return `This perspective is scoped to ${departmentLabel(
        demoDepartment
      ).toLowerCase()} so the user can focus on pressure, opportunity, and execution movement inside that lane.`;
    }

    return `This perspective is scoped to ${departmentLabel(
      demoDepartment
    ).toLowerCase()} so the operator can stay focused on the next actions that matter most.`;
  }, [demoRole, demoDepartment, abeBriefing.whyNow]);

  const abeStickyLine = useMemo(() => {
    if (abeBriefing.crossDomainSignal) {
      return "Right now, coordination matters more than expansion.";
    }

    if (abeBriefing.primaryLane === "outreach") {
      return "Right now, follow-through matters more than fresh volume.";
    }

    if (abeBriefing.primaryLane === "finance") {
      return "Right now, collection matters more than new asks.";
    }

    if (abeBriefing.primaryLane === "field") {
      return "Right now, completion matters more than spread.";
    }

    if (abeBriefing.primaryLane === "digital") {
      return "Right now, conversion matters more than visibility alone.";
    }

    if (abeBriefing.primaryLane === "print") {
      return "Right now, timing matters more than output volume.";
    }

    return "Right now, coordination matters more than expansion.";
  }, [abeBriefing.primaryLane, abeBriefing.crossDomainSignal]);

  const abeConfidence = useMemo(() => {
    const agreementScore = Number(Boolean(abeBriefing.crossDomainSignal)) + Number(abeBriefing.primaryLane === abeBriefing.strongest);

    if (agreementScore >= 2 || abePatternWatch.length >= 2) {
      return "High";
    }

    if (agreementScore >= 1 || abePatternWatch.length >= 1) {
      return "Medium";
    }

    return "Developing";
  }, [abeBriefing.crossDomainSignal, abeBriefing.primaryLane, abeBriefing.strongest, abePatternWatch.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Activity className="h-4 w-4" />
              Executive command center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Daily Command Center
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                See org health, spot pressure fast, and move directly into the
                work that needs attention.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadData}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                applyMyDashboard();
                router.push("/dashboard/profile");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              My Profile
            </button>

            <button
              type="button"
              onClick={() =>
                openFocusBucket("immediate", undefined, "overview_focus_entry")
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              Open Focus Mode
            </button>

            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900 transition hover:bg-indigo-100"
            >
              <Settings className="h-4 w-4" />
              Admin Control
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
          <span className="font-medium text-slate-900">{abeRoleLabel}:</span>{" "}
          This demo layer lets viewers switch roles and departments to see how
          the dashboard shifts based on who is inside Aether.
        </div>
      </section>

      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-fuchsia-800">
              <Sparkles className="h-4 w-4" />
              Honest Abe
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-700/80">
                {abeRoleLabel}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-fuchsia-900">
                <div>
                  <span className="font-medium text-fuchsia-700">Health:</span>{" "}
                  {abeBriefing.health}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">Strongest:</span>{" "}
                  {departmentLabel(abeBriefing.strongest)}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">Weakest:</span>{" "}
                  {departmentLabel(abeBriefing.weakest)}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">
                    Campaign Status:
                  </span>{" "}
                  {abeBriefing.campaignStatus}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">
                    Primary Lane:
                  </span>{" "}
                  {departmentLabel(
                    demoRole === "admin"
                      ? abeBriefing.primaryLane
                      : demoDepartment
                  )}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">
                    Opportunity Lane:
                  </span>{" "}
                  {departmentLabel(abeBriefing.opportunityLane)}
                </div>

                <div>
                  <span className="font-medium text-fuchsia-700">Confidence:</span>{" "}
                  {abeConfidence}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-fuchsia-900">
                {abeRoleHeadline}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                {abeRoleBody}
              </p>

              <p className="max-w-3xl text-lg font-semibold text-fuchsia-950">
                {abeStickyLine}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600">
                Why now: {abeWhyNowText}
              </p>

              {demoRole === "admin" && abeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-fuchsia-900/80">
                  {abeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600">
                {abeBriefing.supportText}
              </p>

              <p className="max-w-3xl text-xs text-slate-500">
                Abe’s Brief is the fast read. Explore Abe expands the same read into deeper campaign intelligence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/abe/brief")}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              Abe’s Brief
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/abe/explore")}
              className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-sm font-medium text-fuchsia-900 transition hover:bg-fuchsia-100"
            >
              Explore Abe
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {abeBriefing.actions.map((move, index) => (
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

        {abePatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
              Pattern Watch
            </p>

            <div className="mt-3 space-y-3">
              {abePatternWatch.map((insight, index) => (
                <div
                  key={`${insight.label}-${index}`}
                  className={`rounded-2xl border p-4 ${getPatternSeverityTone(
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

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BarChart3 className="h-4 w-4" />
          Key Signals Right Now
        </div>

        <section className="grid gap-4 xl:grid-cols-3">
          {visibleAbeSignals.map((signal, index) => (
            <button
              key={`${signal.label}-${index}`}
              type="button"
              onClick={() => router.push(signal.route)}
              className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-600">
                {signal.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {signal.value}
              </p>
              <p className="mt-2 text-sm text-slate-600">{signal.sub}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-fuchsia-700">
                Open overview
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </section>
      </section>

      {demoRole === "admin" ? (
        <CrossDomainChart
          finance={{
            moneyIn: financeSnapshot.moneyIn,
            moneyOut: financeSnapshot.moneyOut,
            net: financeSnapshot.net,
            pledges: financeSnapshot.pledges,
          }}
          digital={{
            impressions: digitalSnapshot.impressions,
            engagement: digitalSnapshot.engagement,
            spend: digitalSnapshot.spend,
            sentimentPositive: digitalSentimentRatio.positive,
            sentimentNegative: digitalSentimentRatio.negative,
          }}
          field={{
            doors: fieldSnapshot.doors,
            conversations: fieldSnapshot.conversations,
            ids: fieldSnapshot.ids,
            completion: fieldAverageCompletion,
          }}
          print={{
            onHand: printSnapshot.onHand,
            orders: printSnapshot.orders,
            approvalReady: printSnapshot.approvalReady,
            deliveryRisk: Math.max(0, Math.round(printSnapshot.orders / 2)),
          }}
        />
      ) : null}

      <section
        className={`grid gap-4 ${
          visibleSnapshotCards.length === 1
            ? "xl:grid-cols-1"
            : visibleSnapshotCards.length === 2
            ? "xl:grid-cols-2"
            : visibleSnapshotCards.length === 3
            ? "xl:grid-cols-3"
            : "xl:grid-cols-4"
        }`}
      >
        {visibleSnapshotCards.map((card) => (
          <div
            key={card.id}
            className={`rounded-3xl border p-6 shadow-sm ${card.tone}`}
          >
            <p className="font-semibold">{card.label}</p>
            <p className="mt-2 text-sm">{card.body}</p>
            <Link href={card.href}>Open →</Link>
          </div>
        ))}
      </section>

      <section
        className={`grid gap-6 ${
          visibleLaneIds.length === 1
            ? "xl:grid-cols-1"
            : visibleLaneIds.length === 2
            ? "xl:grid-cols-2"
            : visibleLaneIds.length === 3
            ? "xl:grid-cols-3"
            : "xl:grid-cols-4"
        }`}
      >
        {visibleLaneIds.includes("digital") ? (
          <div className="space-y-4">
            <button
              onClick={() =>
                openFocusBucket("pipeline", "digital", "digital_total_impressions")
              }
              className="min-h-[160px] rounded-3xl border border-violet-200 bg-violet-50 p-6 text-left shadow-sm transition hover:bg-violet-100"
            >
              <p className="text-sm font-medium text-violet-800">
                Digital Reach Momentum
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {digitalSnapshot.impressions.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-violet-800">
                Reach volume shaping digital opportunity
              </p>
            </button>

            <button
              onClick={() =>
                openFocusBucket("fixNow", "digital", "digital_sentiment_pressure")
              }
              className="min-h-[160px] rounded-3xl border border-rose-200 bg-rose-50 p-6 text-left shadow-sm transition hover:bg-rose-100"
            >
              <p className="text-sm font-medium text-rose-800">
                Sentiment Pressure
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {digitalSentimentRatio.positive}% / {digitalSentimentRatio.negative}%
              </p>
              <p className="mt-2 text-sm text-rose-800">
                Negative signal that may need intervention
              </p>
            </button>
          </div>
        ) : null}

        {visibleLaneIds.includes("field") ? (
          <div className="space-y-4">
            <button
              onClick={() =>
                openFocusBucket("immediate", "field", "field_doors_knocked")
              }
              className="min-h-[160px] rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-left shadow-sm transition hover:bg-emerald-100"
            >
              <p className="text-sm font-medium text-emerald-800">
                Field Contact Rate
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {fieldSnapshot.doors.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-emerald-800">
                Active turf volume pushing field progress
              </p>
            </button>

            <button
              onClick={() =>
                openFocusBucket("routing", "field", "field_turf_completion")
              }
              className="min-h-[160px] rounded-3xl border border-sky-200 bg-sky-50 p-6 text-left shadow-sm transition hover:bg-sky-100"
            >
              <p className="text-sm font-medium text-sky-800">
                Turf Completion Pressure
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {fieldAverageCompletion}%
              </p>
              <p className="mt-2 text-sm text-sky-800">
                Coverage pace that may require rebalancing
              </p>
            </button>
          </div>
        ) : null}

        {visibleLaneIds.includes("print") ? (
          <div className="space-y-4">
            <button
              onClick={() =>
                openFocusBucket("routing", "print", "print_inventory_pressure")
              }
              className="min-h-[160px] rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left shadow-sm transition hover:bg-amber-100"
            >
              <p className="text-sm font-medium text-amber-800">
                Inventory Pressure
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {printSnapshot.onHand.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Materials currently available on hand
              </p>
            </button>

            <button
              onClick={() =>
                openFocusBucket("fixNow", "print", "print_delivery_risk")
              }
              className="min-h-[160px] rounded-3xl border border-rose-200 bg-rose-50 p-6 text-left shadow-sm transition hover:bg-rose-100"
            >
              <p className="text-sm font-medium text-rose-800">
                Delivery Risk
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {printSnapshot.orders}
              </p>
              <p className="mt-2 text-sm text-rose-800">
                Orders that may impact timelines
              </p>
            </button>
          </div>
        ) : null}

        {visibleLaneIds.includes("finance") ? (
          <div className="grid auto-rows-fr gap-4">
            <button
              onClick={() =>
                openFocusBucket("routing", "finance", "finance_net_position")
              }
              className="flex h-full min-h-[176px] flex-col justify-between rounded-3xl border border-sky-200 bg-sky-50 p-6 text-left shadow-sm transition hover:bg-sky-100"
            >
              <div>
                <p className="text-sm font-medium text-sky-800">Net Position</p>
                <p className="mt-2 text-2xl font-semibold">
                  ${financeSnapshot.net.toLocaleString()}
                </p>
              </div>

              <p className="mt-4 text-sm text-sky-800">
                Balance between incoming and outgoing cash
              </p>
            </button>

            <button
              onClick={() =>
                openFocusBucket("followUp", "finance", "finance_pledges_pending")
              }
              className="flex h-full min-h-[176px] flex-col justify-between rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left shadow-sm transition hover:bg-amber-100"
            >
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Pledge Follow-Up Pressure
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  ${financeSnapshot.pledges.toLocaleString()}
                </p>
              </div>

              <p className="mt-4 text-sm text-amber-800">
                Dollars still waiting to be collected
              </p>
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}