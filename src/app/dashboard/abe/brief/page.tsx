"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
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
import { AbeBriefing, buildCampaignBriefing } from "@/lib/abe/abe-briefing";
import { updateAbeMemory } from "@/lib/abe/update-abe-memory";
import type { AbeCampaignStage } from "@/lib/abe/abe-strategy";

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

function buildBriefActions(input: {
  primaryLane: AbeDepartment;
  opportunityLane: AbeDepartment;
  pressureLane: AbeDepartment;
  financeSnapshot: FinanceSnapshot;
  fieldAverageCompletion: number;
  digitalSentimentNegative: number;
  printSnapshot: PrintSnapshot;
}) {
  const actions: string[] = [];

  if (input.primaryLane === "finance") {
    actions.push(
      "Start with finance capacity: verify dollars in, open pledges, and the next donor follow-through move."
    );
  } else {
    actions.push(
      `Anchor the day in ${departmentLabel(
        input.primaryLane
      )}, but keep finance attached to the read so momentum turns into usable capacity.`
    );
  }

  if (input.opportunityLane === "digital") {
    actions.push(
      "Route digital visibility toward fundraising, volunteer growth, or voter-contact lift before treating reach as a win by itself."
    );
  } else {
    actions.push(
      `Protect the opportunity inside ${departmentLabel(
        input.opportunityLane
      )} before expanding fresh work.`
    );
  }

  if (input.financeSnapshot.pledges > 0) {
    actions.push(
      "Tighten donor follow-through where pledged dollars are still waiting."
    );
  } else if (input.fieldAverageCompletion < 65 && input.fieldAverageCompletion > 0) {
    actions.push("Support field coverage before completion pace slips further.");
  } else if (input.digitalSentimentNegative >= 30) {
    actions.push("Monitor digital sentiment before pushing harder on spend.");
  } else if (input.printSnapshot.approvalReady > 0) {
    actions.push("Unlock ready print assets so downstream lanes keep moving.");
  } else {
    actions.push(
      `Watch ${departmentLabel(
        input.pressureLane
      )} for drag, delay, or handoff failure.`
    );
  }

  return actions.slice(0, 3);
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
  const [campaignStage, setCampaignStage] = useState<AbeCampaignStage>("early");
  const [, setAbeMemory] = useState<AbeGlobalMemory>({
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
        setMessage(err?.message || "Failed to load Abe brief");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const rawData = useMemo<DashboardData>(
    () => ({ contacts, lists, logs, tasks }),
    [contacts, lists, logs, tasks]
  );

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

    return {
      positive: Math.max(100 - negativeWeight, 0),
      negative: negativeWeight,
    };
  }, [digitalSnapshot]);

  const laneMetrics = useMemo(() => {
    const pendingFollowUps = (filteredData.tasks ?? []).filter((task: any) => {
      const title = String(task.title || "").toLowerCase();
      const status = normalizeTaskStatus(task.status);

      return (
        status !== "completed" &&
        (title.includes("follow-up") || title.includes("follow up"))
      );
    }).length;

    const contactsNeedingFollowUp = (filteredData.contacts ?? []).filter(
      (contact: any) => Boolean(contact.needs_follow_up)
    ).length;

    const staleContacts = (filteredData.contacts ?? []).filter((contact: any) =>
      Boolean(contact.is_stale)
    ).length;

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

    const financePledgeScore = getFinanceAmountScore(financeSnapshot.pledges);
    const financeRevenueScore = getFinanceAmountScore(financeSnapshot.moneyIn);
    const highValueDonorsPending = (filteredData.contacts ?? []).filter(
      (contact: any) =>
        Number(contact.donation_total ?? 0) >= 500 ||
        Number(contact.pledge_amount ?? 0) >= 500
    ).length;

    const outreachPressure = pendingFollowUps + contactsNeedingFollowUp;
    const outreachOpportunity = positiveContacts;

    const financePressure =
      Math.max(
        0,
        Math.round(financeSnapshot.moneyOut > financeSnapshot.moneyIn ? 2 : 0)
      ) + financePledgeScore;
    const financeOpportunity =
      financeRevenueScore + (financeSnapshot.pledges > 0 ? 1 : 0);

    const fieldPressure = Math.max(0, 100 - fieldAverageCompletion);
    const fieldOpportunity = Math.max(
      0,
      Math.round(fieldSnapshot.conversations / 10)
    );

    const digitalPressure = digitalSentimentRatio.negative;
    const digitalOpportunity = Math.max(
      0,
      Math.round(digitalSnapshot.impressions / 5000)
    );

    const printPressure = Math.max(
      0,
      printSnapshot.orders * 8 - printSnapshot.approvalReady * 3
    );
    const printOpportunity = Math.max(0, printSnapshot.approvalReady * 10);

    return {
      pendingFollowUps,
      positiveContacts,
      staleContacts,
      uncontactedContacts,
      highValueDonorsPending,
      outreachPressure,
      outreachOpportunity,
      financePressure,
      financeOpportunity,
      fieldPressure,
      fieldOpportunity,
      digitalPressure,
      digitalOpportunity,
      printPressure,
      printOpportunity,
    };
  }, [
    filteredData.contacts,
    filteredData.logs,
    filteredData.tasks,
    financeSnapshot.moneyIn,
    financeSnapshot.moneyOut,
    financeSnapshot.pledges,
    fieldAverageCompletion,
    fieldSnapshot.conversations,
    digitalSentimentRatio.negative,
    digitalSnapshot.impressions,
    printSnapshot.orders,
    printSnapshot.approvalReady,
  ]);

  const outreachBundle = useMemo(() => {
    return getOutreachSignals({
      staleContacts: laneMetrics.staleContacts,
      pendingFollowUps: laneMetrics.pendingFollowUps,
      positiveContacts: laneMetrics.positiveContacts,
      uncontactedContacts: laneMetrics.uncontactedContacts,
    });
  }, [laneMetrics]);

  const financeBundle = useMemo(() => {
    return getFinanceSignals({
      missingComplianceRecords: 0,
      overduePledges: getFinanceAmountScore(financeSnapshot.pledges),
      highValueDonorsPending: laneMetrics.highValueDonorsPending,
      cashOnHandPressure:
        financeSnapshot.moneyIn > 0 || financeSnapshot.moneyOut > 0
          ? financeSnapshot.moneyOut > financeSnapshot.moneyIn
            ? 8
            : 0
          : 0,
    });
  }, [financeSnapshot, laneMetrics.highValueDonorsPending]);

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
    const hasDigitalData =
      digitalSnapshot.impressions > 0 ||
      digitalSnapshot.engagement > 0 ||
      digitalSnapshot.spend > 0;

    return getDigitalSignals({
      fallingCtrPlatforms: hasDigitalData && issueText.includes("issue") ? 1 : 0,
      strongPerformingPlatforms:
        hasDigitalData && digitalSnapshot.bestPlatform !== "No platform data"
          ? 1
          : 0,
      negativeSentimentThreads:
        hasDigitalData && issueText.includes("sentiment") ? 1 : 0,
      contentBacklogCount:
        digitalSnapshot.engagement > 0
          ? Math.max(1, Math.round(digitalSnapshot.engagement / 5000))
          : 0,
    });
  }, [digitalSnapshot]);

  const printBundle = useMemo(() => {
    return getPrintSignals({
      approvalBlocks: printSnapshot.approvalReady > 0 ? 1 : 0,
      nearReorderItems:
        printSnapshot.onHand > 0
          ? Math.max(1, Math.round(printSnapshot.onHand / 4000))
          : 0,
      deliveryRisks:
        printSnapshot.orders > 0
          ? Math.max(1, Math.round(printSnapshot.orders / 2))
          : 0,
      readyAssets: printSnapshot.approvalReady,
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

  const strategicRead = campaignBriefing;

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

  const abeBriefing = useMemo<AbeBriefing>(() => {
    return campaignBriefing;
  }, [campaignBriefing]);

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
    () =>
      (filteredData.tasks ?? []).filter(
        (task: any) => normalizeTaskStatus(task.status) !== "completed"
      ).length,
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
    if (!hasLiveSignal) {
      return [
        "Abe is waiting for live campaign signal before making a strategic read.",
        "Once contacts, tasks, logs, donations, field activity, digital metrics, or print records exist, the brief will focus on the strongest campaign-stage signal.",
      ];
    }

    return [
      strategicRead.body,
      `${departmentLabel(
        strategicRead.primaryLane
      )} is the lane Abe would anchor around first this morning. ${departmentLabel(
        strategicRead.opportunityLane
      )} is carrying the strongest opportunity signal. ${departmentLabel(
        strategicRead.pressureLane
      )} is the lane most likely to create drag if it is left unmanaged.`,
      "This is not a signal to slow down. It is a signal to make sure campaign activity compounds into usable capacity instead of splintering into disconnected departmental motion.",
      "The job today is simple: protect what is working, relieve what is building pressure, and make sure visibility, relationships, and operations feed the campaign engine.",
    ];
  }, [hasLiveSignal, strategicRead]);

  const morningChecklist = useMemo(() => {
    return [
      `Start with ${departmentLabel(
        strategicRead.primaryLane
      )} and verify the read against the live numbers.`,
      `Protect the opportunity inside ${departmentLabel(
        strategicRead.opportunityLane
      )} before expanding fresh work.`,
      `Watch ${departmentLabel(
        strategicRead.pressureLane
      )} for drag, delay, or handoff failure.`,
      "Confirm that today’s work feeds money, volunteers, voter contact, or delivery capacity.",
    ];
  }, [strategicRead]);

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
  }, [
    openTasks,
    overdueTasks,
    financeSnapshot.moneyIn,
    financeSnapshot.moneyOut,
    fieldAverageCompletion,
  ]);

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
                {hasLiveSignal
                  ? strategicRead.headline
                  : "Abe is waiting for live campaign signal."}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                This is Abe’s morning brief — a live strategic read built from the shared Abe strategy layer. When there is no live data, Abe stays quiet instead of inventing pressure.
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
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900 shadow-sm">
          {message}
        </section>
      ) : null}

      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span
              className={`inline-flex rounded-full border px-3 py-1 font-medium ${getTone(
                abeBriefing.health
              )}`}
            >
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
            {hasLiveSignal ? strategicRead.headline : "No live campaign signal is available yet."}
          </h2>

          <p className="text-lg font-semibold text-fuchsia-950">
            {hasLiveSignal
              ? strategicRead.stickyLine
              : "Abe will wait for real data before making a strategic claim."}
          </p>

          <div className="max-w-4xl space-y-4 text-base leading-7 text-slate-800">
            {strategistRead.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <p className="max-w-4xl text-sm italic text-slate-600">
            Why now: {hasLiveSignal ? abeBriefing.whyNow : "No live data is strong enough to justify a strategic read yet."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {keyNumbers.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {item.value}
            </p>
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
              <div
                key={`${move}-${index}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
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
            Opportunity Lane
          </div>
          <p className="mt-3 text-xl font-semibold text-emerald-950">
            {departmentLabel(abeBriefing.opportunityLane)}
          </p>
          <p className="mt-2 text-sm text-emerald-900/90">
            This lane has the cleanest campaign-stage opportunity signal. Protect it so momentum turns into capacity instead of noise.
          </p>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-rose-800">
            <TrendingDown className="h-4 w-4" />
            Pressure Lane
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
            {abeBriefing.crossDomainSignal ||
              "No major cross-domain signal is dominating the read right now."}
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
