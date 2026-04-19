"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  filterDashboardDataByOwner,
  getDashboardData,
} from "@/lib/data/dashboard";
import type { DashboardData } from "@/lib/data/types";
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
import { useDashboardOwner } from "../../owner-context";
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
  AbeDepartment,
  AbeGlobalMemory,
  departmentLabel,
} from "@/lib/abe/abe-memory";
import { AbeBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";

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

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = AbeDepartment;

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
    "canvass",
    "conversations",
    "turf",
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
    "ctr",
  ]);

  applyMatches("print", [
    "print",
    "mail",
    "mailer",
    "asset",
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
    pressure: number;
    opportunity: number;
  }[] = [
    { key: "outreach", pressure: outreachPressure, opportunity: outreachOpportunity },
    { key: "finance", pressure: financePressure, opportunity: financeOpportunity },
    { key: "field", pressure: fieldPressure, opportunity: fieldOpportunity },
    { key: "digital", pressure: digitalPressure, opportunity: digitalOpportunity },
    { key: "print", pressure: printPressure, opportunity: printOpportunity },
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

  const primaryLane = input.role === "admin" ? summaryPrimary : input.demoDepartment;
  const opportunityLane =
    [...lanes].sort((a, b) => b.opportunity - a.opportunity)[0]?.key ?? strongestLane;

  const totalPressure = lanes.reduce((sum, lane) => sum + lane.pressure, 0);
  const totalOpportunity = lanes.reduce((sum, lane) => sum + lane.opportunity, 0);

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
      ? `Open ${departmentLabel(primaryLane)} after this brief to review the supporting analytics and move into execution with the right context.`
      : `Open ${departmentLabel(input.demoDepartment)} after this brief to move directly into the next work lane.`;

  const actions: string[] = [];

  if (input.role === "admin") {
    if (primaryLane === "outreach") {
      actions.push("Clear the follow-up queue before active engagement cools.");
    }
    if (input.financeSnapshot.pledges > 0) {
      actions.push("Tighten donor follow-through where pledge dollars are still waiting.");
    }
    if (input.fieldAverageCompletion < 65) {
      actions.push("Support field coverage before completion pace slips further.");
    }
    if (input.digitalSentimentNegative >= 30) {
      actions.push("Monitor digital sentiment before pushing harder on spend.");
    }
    if (input.printSnapshot.approvalReady > 0) {
      actions.push("Unlock ready print assets so downstream lanes keep moving.");
    }
  }

  if (actions.length === 0) {
    actions.push("Keep execution tight across active lanes and maintain momentum.");
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

function getTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("risk") || normalized.includes("pressure")) {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  if (normalized.includes("momentum") || normalized.includes("opportunity")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-900";
}

export default function AbeBriefPage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardData["tasks"]>([]);
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
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const { ownerFilter } = useDashboardOwner();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setMessage("");
        const [data, liveDigital, liveField, livePrint, liveFinance] = await Promise.all([
          getDashboardData(),
          getDigitalSnapshot(),
          getFieldSnapshot(),
          getPrintSnapshot(),
          getFinanceSnapshot(),
        ]);
        setContacts(data.contacts ?? []);
        setLists(data.lists ?? []);
        setLogs(data.logs ?? []);
        setTasks(data.tasks ?? []);
        setDigitalSnapshot(liveDigital);
        setFieldSnapshot(liveField);
        setPrintSnapshot(livePrint);
        setFinanceSnapshot(liveFinance);
      } catch (err: any) {
        setMessage(err?.message || "Failed to load Abe brief");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const rawData = useMemo<DashboardData>(() => ({ contacts, lists, logs, tasks }), [
    contacts,
    lists,
    logs,
    tasks,
  ]);

  const filteredData = useMemo<DashboardData>(() => {
    const result = filterDashboardDataByOwner(rawData, ownerFilter);
    return {
      contacts: result?.contacts ?? [],
      lists: result?.lists ?? [],
      logs: result?.logs ?? [],
      tasks: result?.tasks ?? [],
    };
  }, [rawData, ownerFilter]);

  const fieldAverageCompletion = useMemo(() => {
    if (fieldSnapshot.doors <= 0) return 0;
    const estimatedCapacity = Math.max(fieldSnapshot.doors, fieldSnapshot.doors + 200);
    return Math.min(100, Math.max(0, Math.round((fieldSnapshot.doors / estimatedCapacity) * 100)));
  }, [fieldSnapshot]);

  const digitalSentimentRatio = useMemo(() => {
    const negativeWeight = String(digitalSnapshot.issue || "").toLowerCase().includes("negative")
      ? 38
      : 24;
    const positiveWeight = Math.max(100 - negativeWeight, 0);
    return { positive: positiveWeight, negative: negativeWeight };
  }, [digitalSnapshot]);

  const outreachBundle = useMemo(() => {
    const staleContacts = (filteredData.contacts ?? []).filter((contact: any) => Boolean(contact.is_stale)).length;
    const pendingFollowUps = (filteredData.tasks ?? []).filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);
      return status !== "completed" && (title.includes("follow-up") || title.includes("follow up"));
    }).length;
    const positiveContacts = (filteredData.logs ?? []).filter((log: any) => {
      const result = String(log.result || "").toLowerCase();
      return result.includes("positive") || result.includes("support") || result.includes("interested") || result.includes("pledge");
    }).length;
    const uncontactedContacts = Math.max(0, (filteredData.contacts ?? []).length - (filteredData.logs ?? []).length);
    return getOutreachSignals({ staleContacts, pendingFollowUps, positiveContacts, uncontactedContacts });
  }, [filteredData]);

  const financeBundle = useMemo(() => {
    const missingComplianceRecords = Math.max(0, Math.round(financeSnapshot.pledges / 1000));
    const overduePledges = Math.max(0, Math.round(financeSnapshot.pledges / 2500));
    const highValueDonorsPending = (filteredData.contacts ?? []).filter(
      (contact: any) => Number(contact.donation_total ?? 0) >= 500 || Number(contact.pledge_amount ?? 0) >= 500
    ).length;
    const cashOnHandPressure = financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 8 : 4;
    return getFinanceSignals({
      missingComplianceRecords,
      overduePledges,
      highValueDonorsPending,
      cashOnHandPressure,
    });
  }, [financeSnapshot, filteredData.contacts]);

  const fieldBundle = useMemo(() => {
    const incompleteTurfs = fieldSnapshot.doors > 0 ? Math.max(1, Math.round(fieldSnapshot.doors / 700)) : 0;
    const highPriorityTurfs = fieldSnapshot.ids > 0 ? Math.max(1, Math.round(fieldSnapshot.ids / 80)) : 0;
    const strongIdRateZones =
      fieldSnapshot.ids > 0 && fieldSnapshot.conversations > 0
        ? Math.max(1, Math.round((fieldSnapshot.ids / fieldSnapshot.conversations) * 4))
        : 0;
    const weakCoverageZones = fieldSnapshot.doors > 0 ? Math.max(1, Math.round(fieldSnapshot.doors / 1200)) : 0;
    return getFieldSignals({ incompleteTurfs, highPriorityTurfs, strongIdRateZones, weakCoverageZones });
  }, [fieldSnapshot]);

  const digitalBundle = useMemo(() => {
    const issueText = String(digitalSnapshot.issue || "").toLowerCase();
    const fallingCtrPlatforms = issueText.includes("issue") ? 1 : 0;
    const strongPerformingPlatforms = digitalSnapshot.bestPlatform ? 1 : 0;
    const negativeSentimentThreads = issueText.includes("sentiment") ? 1 : 0;
    const contentBacklogCount = Math.max(1, Math.round(digitalSnapshot.engagement / 5000));
    return getDigitalSignals({
      fallingCtrPlatforms,
      strongPerformingPlatforms,
      negativeSentimentThreads,
      contentBacklogCount,
    });
  }, [digitalSnapshot]);

  const printBundle = useMemo(() => {
    const approvalBlocks = printSnapshot.approvalReady > 0 ? 1 : 2;
    const nearReorderItems = printSnapshot.onHand > 0 ? Math.max(1, Math.round(printSnapshot.onHand / 4000)) : 0;
    const deliveryRisks = printSnapshot.orders > 0 ? Math.max(1, Math.round(printSnapshot.orders / 2)) : 0;
    const readyAssets = printSnapshot.approvalReady;
    return getPrintSignals({ approvalBlocks, nearReorderItems, deliveryRisks, readyAssets });
  }, [printSnapshot]);

  const intelligenceSnapshot = useMemo(() => {
    return aggregateAetherIntelligence(
      [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle],
      {
        finance: {
          overduePledges:
            (financeBundle.risks.find((item) => item.id === "finance-overdue-pledges")?.metadata?.overduePledges as number) || 0,
          highValueDonorsPending:
            (financeBundle.opportunities.find((item) => item.id === "finance-high-value-donors")?.metadata?.highValueDonorsPending as number) || 0,
        },
        outreach: {
          pendingFollowUps:
            (outreachBundle.risks.find((item) => item.id === "outreach-pending-followups")?.metadata?.pendingFollowUps as number) || 0,
          positiveContacts:
            (outreachBundle.opportunities.find((item) => item.id === "outreach-positive-contacts")?.metadata?.positiveContacts as number) || 0,
        },
        field: {
          strongIdRateZones:
            (fieldBundle.opportunities.find((item) => item.id === "field-strong-id-zones")?.metadata?.strongIdRateZones as number) || 0,
          incompleteTurfs:
            (fieldBundle.risks.find((item) => item.id === "field-incomplete-turfs")?.metadata?.incompleteTurfs as number) || 0,
        },
        digital: {
          strongPerformingPlatforms:
            (digitalBundle.opportunities.find((item) => item.id === "digital-strong-platforms")?.metadata?.strongPerformingPlatforms as number) || 0,
          negativeSentimentThreads:
            (digitalBundle.risks.find((item) => item.id === "digital-negative-sentiment")?.metadata?.negativeSentimentThreads as number) || 0,
        },
        print: {
          readyAssets:
            (printBundle.opportunities.find((item) => item.id === "print-ready-assets")?.metadata?.readyAssets as number) || 0,
          deliveryRisks:
            (printBundle.statuses.find((item) => item.id === "print-delivery-risks")?.metadata?.deliveryRisks as number) || 0,
        },
      }
    );
  }, [outreachBundle, financeBundle, fieldBundle, digitalBundle, printBundle]);

  const intelligenceSummary = useMemo(() => {
    return buildAetherSummaryText(intelligenceSnapshot);
  }, [intelligenceSnapshot]);

  const abeBriefing = useMemo(() => {
    return buildAbeV1Briefing({
      role: "admin",
      demoDepartment: "outreach",
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

  const openTasks = useMemo(
    () => (filteredData.tasks ?? []).filter((task: any) => normalizeTaskStatus(task.status) !== "completed").length,
    [filteredData.tasks]
  );

  const overdueTasks = useMemo(
    () =>
      (filteredData.tasks ?? []).filter((task: any) => {
        const status = normalizeTaskStatus(task.status);
        const dueDate = task.due_date || task.due_at;
        return status !== "completed" && !!dueDate && new Date(dueDate) < new Date();
      }).length,
    [filteredData.tasks]
  );

  const strategistRead = useMemo(() => {
    const primary = departmentLabel(abeBriefing.primaryLane);
    const strongest = departmentLabel(abeBriefing.strongest);
    const weakest = departmentLabel(abeBriefing.weakest);
    const hasCrossDomain = Boolean(abeBriefing.crossDomainSignal);

    const paragraph1 =
      "Right now, the campaign is moving. That matters. But the real story is not raw activity — it is whether that activity is being reinforced cleanly enough to compound.";

    const paragraph2 =
      `${primary} is the lane Abe would anchor around first this morning. ${strongest} is carrying the strongest momentum signal. ${weakest} is the lane most likely to create drag if it is left unmanaged.`;

    const paragraph3 = hasCrossDomain
      ? "This is where campaigns either tighten or leak. The frontline lanes can keep producing, but if the supporting lanes are late, disconnected, or underpowered, progress starts turning into friction instead of advantage."
      : "This is not a signal to slow down. It is a signal to tighten coordination now, while momentum still belongs to you.";

    const paragraph4 =
      "The job today is simple: protect what is working, relieve what is building pressure, and keep the campaign from splintering into disconnected departmental effort.";

    return [paragraph1, paragraph2, paragraph3, paragraph4];
  }, [abeBriefing]);

  const morningChecklist = useMemo(() => {
    return [
      `Start with ${departmentLabel(abeBriefing.primaryLane)} and verify the read against the live numbers.`,
      "Identify the one constraint that can slow clean execution today.",
      `Protect the strength inside ${departmentLabel(abeBriefing.strongest)} before expanding fresh work.`,
      `Watch ${departmentLabel(abeBriefing.weakest)} for drag, delay, or handoff failure.`,
    ];
  }, [abeBriefing]);

  const keyNumbers = useMemo(() => {
    return [
      {
        label: "Open Tasks",
        value: openTasks.toLocaleString(),
        helper: "Work still moving across the campaign",
      },
      {
        label: "Overdue Tasks",
        value: overdueTasks.toLocaleString(),
        helper: "Items already dragging execution",
      },
      {
        label: "Money In / Out",
        value: `$${financeSnapshot.moneyIn.toLocaleString()} / $${financeSnapshot.moneyOut.toLocaleString()}`,
        helper: "Cash flow read right now",
      },
      {
        label: "Field Completion",
        value: `${fieldAverageCompletion}%`,
        helper: "Estimated coverage pace",
      },
    ];
  }, [openTasks, overdueTasks, financeSnapshot.moneyIn, financeSnapshot.moneyOut, fieldAverageCompletion]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading Abe’s brief...</p>
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
              <Sparkles className="h-4 w-4" />
              Abe’s Brief
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                The campaign is moving. Coordination is the gap.
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                This is Abe’s morning brief — a live strategic read built from the same intelligence layer as the dashboard. This is the fast read. Explore Abe expands it into deeper campaign intelligence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <Link
              href="/dashboard/abe/explore"
              className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm font-medium text-fuchsia-900 transition hover:bg-fuchsia-100"
            >
              Explore Abe
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm text-sm text-rose-900">
          {message}
        </section>
      ) : null}

      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`inline-flex rounded-full border px-3 py-1 font-medium ${getTone(abeBriefing.health)}`}>
              {abeBriefing.health}
            </span>
            <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium text-fuchsia-900">
              Primary Lane: {departmentLabel(abeBriefing.primaryLane)}
            </span>
            <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium text-fuchsia-900">
              Opportunity: {departmentLabel(abeBriefing.opportunityLane)}
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-fuchsia-950">
            {intelligenceSummary.headline}
          </h2>

          <p className="text-lg font-semibold text-fuchsia-950">
            Right now, coordination matters more than expansion.
          </p>

          <div className="max-w-4xl space-y-4 text-base leading-7 text-slate-800">
            {strategistRead.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <p className="max-w-4xl text-sm italic text-slate-600">
            Why now: {abeBriefing.whyNow}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {keyNumbers.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            What Abe Would Do This Morning
          </p>

          <div className="mt-4 space-y-4">
            {abeBriefing.actions.map((move, index) => (
              <div key={`${move}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-fuchsia-200 bg-fuchsia-100 text-xs font-semibold text-fuchsia-800">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700">{move}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Morning Checklist
          </p>

          <div className="mt-4 space-y-4">
            {morningChecklist.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 text-amber-600" />
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <TrendingUp className="h-4 w-4" />
            Strongest Lane
          </div>
          <p className="mt-3 text-xl font-semibold text-emerald-950">
            {departmentLabel(abeBriefing.strongest)}
          </p>
          <p className="mt-2 text-sm text-emerald-900/90">
            This lane has the best current momentum signal. Protect it so momentum turns into efficiency instead of noise.
          </p>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-rose-800">
            <TrendingDown className="h-4 w-4" />
            Weakest Lane
          </div>
          <p className="mt-3 text-xl font-semibold text-rose-950">
            {departmentLabel(abeBriefing.weakest)}
          </p>
          <p className="mt-2 text-sm text-rose-900/90">
            This is the lane most likely to create drag if it is left unmanaged through the day.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Cross-Domain Read
          </div>
          <p className="mt-3 text-sm font-medium text-amber-950">
            {abeBriefing.crossDomainSignal || "No major cross-domain signal is dominating the read right now."}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Abe’s Closing Read
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
          {abeBriefing.supportText}
        </p>
      </section>
    </div>
  );
}
