"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
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
  AbeGlobalMemory,
  AbePatternInsight,
  departmentLabel,
} from "@/lib/abe/abe-memory";
import type { AbeBriefing } from "@/lib/abe/abe-briefing";
import { buildCampaignBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";
import { buildAbePatternInsights } from "@/lib/abe/abe-patterns";
import { buildAbeStrategicRead, type AbeCampaignStage } from "@/lib/abe/abe-strategy";

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();
  if (["done", "completed", "complete"].includes(value)) return "completed";
  if (["in_progress", "in progress", "active"].includes(value)) return "in_progress";
  return value || "open";
}

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

function getFinanceAmountScore(amount: number) {
  if (amount >= 1000) return 4;
  if (amount >= 500) return 3;
  if (amount >= 100) return 2;
  if (amount > 0) return 1;

  return 0;
}

function normalizeAbeCampaignStage(value?: string | null): AbeCampaignStage {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "mid") return "mid";
  if (normalized === "late") return "late";

  return "early";
}

function buildStrategicHealth(input: {
  financeSnapshot: FinanceSnapshot;
  pressure: number;
  opportunity: number;
}) {
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    return "Under financial pressure";
  }

  if (input.opportunity >= input.pressure * 1.35) {
    return "Momentum building";
  }

  if (input.pressure > input.opportunity * 1.1) {
    return "Pressure is rising";
  }

  return "Stable overall";
}

function buildStrategicStatus(input: {
  financeSnapshot: FinanceSnapshot;
  pressure: number;
  opportunity: number;
}) {
  if (input.financeSnapshot.moneyOut > input.financeSnapshot.moneyIn) {
    return "At risk with financial pressure";
  }

  if (input.opportunity >= input.pressure * 1.2) {
    return "Stable with opportunity";
  }

  if (input.pressure > input.opportunity) {
    return "Stable, but pressure is rising";
  }

  return "Stable overall";
}

export default function ExploreAbePage() {
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
  const [campaignStage, setCampaignStage] = useState<AbeCampaignStage>("early");
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
        const [
          data,
          liveDigital,
          liveField,
          livePrint,
          liveFinance,
          contextResponse,
        ] = await Promise.all([
          getDashboardData(),
          getDigitalSnapshot(),
          getFieldSnapshot(),
          getPrintSnapshot(),
          getFinanceSnapshot(),
          fetch("/api/auth/current-context"),
        ]);

        const contextResult = await contextResponse.json().catch(() => null);
        const nextCampaignStage = normalizeAbeCampaignStage(
          contextResult?.organization?.abe_stage
        );
        setContacts(data.contacts ?? []);
        setLists(data.lists ?? []);
        setLogs(data.logs ?? []);
        setTasks(data.tasks ?? []);
        setDigitalSnapshot(liveDigital);
        setFieldSnapshot(liveField);
        setPrintSnapshot(livePrint);
        setFinanceSnapshot(liveFinance);
        setCampaignStage(nextCampaignStage);
      } catch (err: any) {
        setMessage(err?.message || "Failed to load Explore Abe");
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
    const hasDigitalData =
      digitalSnapshot.impressions > 0 ||
      digitalSnapshot.engagement > 0 ||
      digitalSnapshot.spend > 0;

    if (!hasDigitalData) {
      return { positive: 0, negative: 0 };
    }

    const negativeWeight = String(digitalSnapshot.issue || "")
      .toLowerCase()
      .includes("negative")
      ? 38
      : 24;

    const positiveWeight = Math.max(100 - negativeWeight, 0);

    return { positive: positiveWeight, negative: negativeWeight };
  }, [digitalSnapshot]);

  const outreachPressure = useMemo(() => {
    return (
      (filteredData.tasks ?? []).filter((task: any) => {
        const title = String(task.title || "").toLowerCase();
        const status = normalizeTaskStatus(task.status);
        return status !== "completed" && (title.includes("follow-up") || title.includes("follow up"));
      }).length +
      Math.max(
        0,
        (filteredData.contacts ?? []).filter((contact: any) => Boolean(contact.needs_follow_up)).length
      )
    );
  }, [filteredData.tasks, filteredData.contacts]);

  const outreachOpportunity = useMemo(() => {
    return (filteredData.logs ?? []).filter((log: any) => {
      const result = String(log.result || "").toLowerCase();
      return (
        result.includes("positive") ||
        result.includes("support") ||
        result.includes("interested") ||
        result.includes("pledge")
      );
    }).length;
  }, [filteredData.logs]);

  const financePressure = useMemo(() => {
    const pledgeScore = getFinanceAmountScore(financeSnapshot.pledges);
    const spendPressure = financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 2 : 0;
    return Math.max(0, spendPressure + pledgeScore);
  }, [financeSnapshot.moneyIn, financeSnapshot.moneyOut, financeSnapshot.pledges]);

  const financeOpportunity = useMemo(() => {
    return (
      getFinanceAmountScore(financeSnapshot.moneyIn) +
      (financeSnapshot.pledges > 0 ? 1 : 0)
    );
  }, [financeSnapshot.moneyIn, financeSnapshot.pledges]);

  const fieldPressure = useMemo(() => Math.max(0, 100 - fieldAverageCompletion), [fieldAverageCompletion]);

  const fieldOpportunity = useMemo(() => {
    return Math.max(0, Math.round(fieldSnapshot.conversations / 10));
  }, [fieldSnapshot.conversations]);

  const digitalPressure = digitalSentimentRatio.negative;

  const digitalOpportunity = useMemo(() => {
    return Math.max(0, Math.round(digitalSnapshot.impressions / 5000));
  }, [digitalSnapshot.impressions]);

  const printPressure = useMemo(() => {
    return Math.max(0, printSnapshot.orders * 8 - printSnapshot.approvalReady * 3);
  }, [printSnapshot.orders, printSnapshot.approvalReady]);

  const printOpportunity = useMemo(() => {
    return Math.max(0, printSnapshot.approvalReady * 10);
  }, [printSnapshot.approvalReady]);

  const outreachBundle = useMemo(() => {
    const staleContacts = (filteredData.contacts ?? []).filter((contact: any) => Boolean(contact.is_stale)).length;
    const pendingFollowUps = (filteredData.tasks ?? []).filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);
      return status !== "completed" && (title.includes("follow-up") || title.includes("follow up"));
    }).length;
    const positiveContacts = outreachOpportunity;
    const uncontactedContacts = Math.max(0, (filteredData.contacts ?? []).length - (filteredData.logs ?? []).length);
    return getOutreachSignals({ staleContacts, pendingFollowUps, positiveContacts, uncontactedContacts });
  }, [filteredData, outreachOpportunity]);

  const financeBundle = useMemo(() => {
    const missingComplianceRecords = 0;
    const overduePledges = getFinanceAmountScore(financeSnapshot.pledges);
    const highValueDonorsPending = (filteredData.contacts ?? []).filter(
      (contact: any) => Number(contact.donation_total ?? 0) >= 500 || Number(contact.pledge_amount ?? 0) >= 500
    ).length;
    const cashOnHandPressure = financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 8 : 4;
    return getFinanceSignals({ missingComplianceRecords, overduePledges, highValueDonorsPending, cashOnHandPressure });
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
    const hasDigitalData =
      digitalSnapshot.impressions > 0 ||
      digitalSnapshot.engagement > 0 ||
      digitalSnapshot.spend > 0;

    const fallingCtrPlatforms = hasDigitalData && issueText.includes("issue") ? 1 : 0;
    const strongPerformingPlatforms =
      hasDigitalData && digitalSnapshot.bestPlatform !== "No platform data" ? 1 : 0;
    const negativeSentimentThreads = hasDigitalData && issueText.includes("sentiment") ? 1 : 0;
    const contentBacklogCount =
      digitalSnapshot.engagement > 0
        ? Math.max(1, Math.round(digitalSnapshot.engagement / 5000))
        : 0;
    return getDigitalSignals({ fallingCtrPlatforms, strongPerformingPlatforms, negativeSentimentThreads, contentBacklogCount });
  }, [digitalSnapshot]);

  const printBundle = useMemo(() => {
    const approvalBlocks = printSnapshot.approvalReady > 0 ? 1 : 0;
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

  const intelligenceSummary = useMemo(() => buildAetherSummaryText(intelligenceSnapshot), [intelligenceSnapshot]);

  const strategicRead = useMemo(() => {
    return buildAbeStrategicRead({
      stage: campaignStage,
      existingCrossDomainSignal: intelligenceSummary.crossDomain,
      lanes: [
        {
          department: "finance",
          pressure: financePressure,
          opportunity: financeOpportunity,
          activity: financeSnapshot.moneyIn > 0 || financeSnapshot.pledges > 0 ? 1 : 0,
        },
        {
          department: "digital",
          pressure: digitalPressure,
          opportunity: digitalOpportunity,
          activity: digitalSnapshot.impressions > 0 || digitalSnapshot.engagement > 0 ? 1 : 0,
        },
        {
          department: "field",
          pressure: fieldPressure,
          opportunity: fieldOpportunity,
          activity: fieldSnapshot.doors > 0 || fieldSnapshot.conversations > 0 ? 1 : 0,
        },
        {
          department: "print",
          pressure: printPressure,
          opportunity: printOpportunity,
          activity: printSnapshot.orders > 0 || printSnapshot.approvalReady > 0 ? 1 : 0,
        },
        {
          department: "outreach",
          pressure: outreachPressure,
          opportunity: outreachOpportunity,
          activity: outreachPressure + outreachOpportunity,
        },
      ],
    });
  }, [
    campaignStage,
    intelligenceSummary.crossDomain,
    financePressure,
    financeOpportunity,
    financeSnapshot.moneyIn,
    financeSnapshot.pledges,
    digitalPressure,
    digitalOpportunity,
    digitalSnapshot.impressions,
    digitalSnapshot.engagement,
    fieldPressure,
    fieldOpportunity,
    fieldSnapshot.doors,
    fieldSnapshot.conversations,
    printPressure,
    printOpportunity,
    printSnapshot.orders,
    printSnapshot.approvalReady,
    outreachPressure,
    outreachOpportunity,
  ]);

  const totalPressure = strategicRead.lanes.reduce((sum, lane) => sum + lane.pressure, 0);
  const totalOpportunity = strategicRead.lanes.reduce((sum, lane) => sum + lane.opportunity, 0);

  const campaignBriefing = useMemo(() => {
    return buildCampaignBriefing({
      role: "admin",
      effectiveDepartment: "outreach",
      campaignStage,
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
    campaignStage,
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

  const abeBriefing = useMemo<AbeBriefing>(() => {
    const health = buildStrategicHealth({
      financeSnapshot,
      pressure: totalPressure,
      opportunity: totalOpportunity,
    });
    const campaignStatus = buildStrategicStatus({
      financeSnapshot,
      pressure: totalPressure,
      opportunity: totalOpportunity,
    });

    const actions = [
      `Anchor first in ${departmentLabel(strategicRead.primaryLane)} because that is Abe's current campaign-stage strategic center of gravity.`,
      `Protect the opportunity inside ${departmentLabel(strategicRead.opportunityLane)} and make sure it converts into usable campaign capacity.`,
      `Watch ${departmentLabel(strategicRead.pressureLane)} for drag, timing slippage, or missed handoffs.`,
    ];

    return {
      health,
      strongest: strategicRead.opportunityLane,
      weakest: strategicRead.pressureLane,
      primaryLane: strategicRead.primaryLane,
      opportunityLane: strategicRead.opportunityLane,
      campaignStatus,
      whyNow: strategicRead.stickyLine,
      supportText:
        campaignBriefing.supportText ||
        "Use Explore Abe to understand the deeper campaign logic, the relationships between lanes, and where momentum could either compound or leak.",
      actions: campaignBriefing.actions?.length ? campaignBriefing.actions : actions,
      crossDomainSignal: campaignBriefing.crossDomainSignal || strategicRead.crossDomainSignal,
    };
  }, [
    strategicRead,
    financeSnapshot,
    totalPressure,
    totalOpportunity,
    campaignBriefing,
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

  const hasLiveSignal = useMemo(() => {
    return (
      filteredData.contacts.length > 0 ||
      filteredData.tasks.length > 0 ||
      filteredData.logs.length > 0 ||
      financeSnapshot.moneyIn > 0 ||
      financeSnapshot.moneyOut > 0 ||
      financeSnapshot.pledges > 0 ||
      fieldSnapshot.doors > 0 ||
      fieldSnapshot.conversations > 0 ||
      fieldSnapshot.ids > 0 ||
      digitalSnapshot.impressions > 0 ||
      digitalSnapshot.engagement > 0 ||
      digitalSnapshot.spend > 0 ||
      printSnapshot.onHand > 0 ||
      printSnapshot.orders > 0 ||
      printSnapshot.approvalReady > 0
    );
  }, [
    filteredData.contacts.length,
    filteredData.tasks.length,
    filteredData.logs.length,
    financeSnapshot.moneyIn,
    financeSnapshot.moneyOut,
    financeSnapshot.pledges,
    fieldSnapshot.doors,
    fieldSnapshot.conversations,
    fieldSnapshot.ids,
    digitalSnapshot.impressions,
    digitalSnapshot.engagement,
    digitalSnapshot.spend,
    printSnapshot.onHand,
    printSnapshot.orders,
    printSnapshot.approvalReady,
  ]);

  const patternWatch = useMemo(() => {
    if (!hasLiveSignal) {
      return [];
    }

    return buildAbePatternInsights({
      role: "admin",
      demoDepartment: abeBriefing.primaryLane,
      briefing: abeBriefing,
      memory: abeMemory,
    });
  }, [abeBriefing, abeMemory, hasLiveSignal]);

  const laneReads = useMemo(() => {
    if (!hasLiveSignal) {
      return [
        {
          lane: "Outreach",
          read: "No live outreach contacts, logs, or follow-up tasks are available yet.",
        },
        {
          lane: "Finance",
          read: "No live finance dollars, pledges, or donor pressure are available yet.",
        },
        {
          lane: "Field",
          read: "No live field doors, conversations, or ID signals are available yet.",
        },
        {
          lane: "Digital",
          read: "No live digital impressions, engagement, spend, or sentiment signals are available yet.",
        },
        {
          lane: "Print",
          read: "No live print inventory, orders, approvals, or delivery signals are available yet.",
        },
      ];
    }

    return [
      {
        lane: "Finance",
        read: `$${financeSnapshot.pledges.toLocaleString()} in pending pledges and a net position of $${financeSnapshot.net.toLocaleString()} define the finance read right now. Finance remains the capacity lane: it creates the room every other department needs to execute the campaign-stage strategy.`,
      },
      {
        lane: "Digital",
        read: `${digitalSnapshot.impressions.toLocaleString()} impressions with a ${digitalSentimentRatio.positive}% / ${digitalSentimentRatio.negative}% sentiment split define the digital context. Digital is the strongest opportunity lane when reach can convert into fundraising, volunteer growth, or voter-contact lift.`,
      },
      {
        lane: "Field",
        read: `${fieldSnapshot.conversations.toLocaleString()} conversations and ${fieldAverageCompletion}% estimated completion show the current field balance between output and pace. Field matters when ground signal validates the campaign plan or starts creating operational pressure.`,
      },
      {
        lane: "Print",
        read: `${printSnapshot.approvalReady} ready assets and ${printSnapshot.orders} active order signals make print primarily a timing lane today. Print becomes strategic when materials, approvals, or inventory affect execution capacity.`,
      },
      {
        lane: "Outreach",
        read: `${outreachPressure} active relationship-management pressure points are visible. Outreach matters as support infrastructure: it should reinforce finance, digital, field, and print instead of becoming detached relationship-management noise.`,
      },
    ];
  }, [
    hasLiveSignal,
    financeSnapshot,
    digitalSnapshot,
    digitalSentimentRatio,
    fieldSnapshot,
    fieldAverageCompletion,
    printSnapshot,
    outreachPressure,
  ]);

  const deeperRead = useMemo(() => {
    if (!hasLiveSignal) {
      return "Explore Abe is waiting for live campaign signal. Once contacts, tasks, logs, donations, field activity, digital metrics, or print records exist, this read will expand into real cross-lane interpretation.";
    }

    return `${strategicRead.body} Abe’s deeper interpretation is that the campaign should not confuse movement with strategic importance. Abe's current campaign-stage read shapes how finance, digital, field, print, and outreach should reinforce each other without confusing movement for strategic importance.`;
  }, [hasLiveSignal, strategicRead.body]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading Explore Abe...</p>
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
              Explore Abe
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Deeper campaign intelligence
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                This expands on Abe’s Brief — same campaign-stage strategic read, deeper interpretation of how the campaign is behaving across lanes. When the campaign is empty, Abe stays quiet instead of inventing motion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/abe/brief"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Abe’s Brief
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BarChart3 className="h-4 w-4" />
          Strategic Read
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          {hasLiveSignal ? campaignBriefing.headline : "No live campaign signal is available yet."}
        </h2>
        <p className="mt-3 text-lg font-semibold text-slate-900">
          {hasLiveSignal
            ? campaignBriefing.stickyLine
            : "Abe will stay quiet until real campaign data exists."}
        </p>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-800">
          {deeperRead}
        </p>
        <p className="mt-3 max-w-4xl text-sm italic text-slate-600">
          Why Abe thinks this: {hasLiveSignal ? abeBriefing.whyNow : "No live data is strong enough to justify a deeper strategic read yet."}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Layers className="h-4 w-4" />
            Lane-by-Lane Interpretation
          </div>
          <div className="mt-4 space-y-4">
            {laneReads.map((lane) => (
              <div key={lane.lane} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{lane.lane}</p>
                <p className="mt-1 text-sm text-slate-600">{lane.read}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            Pattern Watch
          </div>
          <div className="mt-4 space-y-4">
            {patternWatch.length > 0 ? (
              patternWatch.map((insight, index) => (
                <div key={`${insight.label}-${index}`} className={`rounded-2xl border p-4 ${getPatternSeverityTone(insight.severity)}`}>
                  <p className="text-sm font-semibold">{insight.label}</p>
                  <p className="mt-1 text-sm opacity-90">{insight.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No major pattern clusters are dominating the read right now.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
          Cross-Domain Signal
        </p>
        <p className="mt-3 text-base font-medium text-indigo-950">
          {hasLiveSignal
            ? abeBriefing.crossDomainSignal || "No single cross-domain dependency is overpowering the read right now."
            : "No cross-domain signal is available yet."}
        </p>
      </section>
    </div>
  );
}
