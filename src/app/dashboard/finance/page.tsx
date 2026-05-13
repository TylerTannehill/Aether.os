"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { getFinanceCallTargets } from "@/lib/finance/call-targets";
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

type FinanceMetricCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  trend?: "up" | "down" | "neutral";
};

type ContributionRecord = {
  id: string;
  amount: number;
  method: "online" | "check" | "cash";
  date: string;
  compliant: boolean;
  employer?: string | null;
  occupation?: string | null;
  notes?: string | null;
};

type PledgeRecord = {
  id: string;
  amount: number;
  status: "pledged" | "follow_up" | "converted";
  created_at: string;
  converted_at?: string | null;
  notes?: string | null;
};

type FinanceContactRow = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  candidateApproved?: boolean;
  contributions: ContributionRecord[];
  pledges: PledgeRecord[];
};

type FinanceCallRow = {
  id: string;
  caller: string;
  calls: number;
  connects: number;
  pledged: number;
  raised: number;
};

type FinanceWorkflowItem = {
  id: string;
  title: string;
  owner: string;
  type: "pledge_follow_up" | "missing_compliance" | "contribution_entry";
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done";
  contactId?: string;
  pledgeId?: string;
  contributionId?: string;
};

type FinanceCommandSignal = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  category: "conversion" | "task" | "retry" | "review";
  autoReady: boolean;
};

type FinanceChartView = "money_in" | "money_out" | "net" | "pledges";
type FinanceTimeframe = "today" | "week" | "month" | "quarter" | "cycle";

type FinanceChartPoint = {
  label: string;
  money_in: number;
  money_out: number;
  net: number;
  pledges: number;
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

function toCurrency(value: unknown) {
  return currency.format(toNumber(value));
}

function normalizeContactName(target: any) {
  const full =
    target?.name ||
    target?.full_name ||
    [target?.first_name, target?.last_name].filter(Boolean).join(" ");

  return String(full || "Unnamed Finance Contact");
}

function buildFinanceContactRows(targets: any[]): FinanceContactRow[] {
  return targets.map((target, index) => {
    const donationTotal = toNumber(
      target?.donation_total ??
        target?.total_given ??
        target?.fec_total_given ??
        target?.amount
    );

    const pledgeAmount = toNumber(target?.pledge_amount ?? target?.pledge ?? 0);

    const employer = target?.employer ?? null;
    const occupation = target?.occupation ?? null;
    const compliant =
      donationTotal <= 0 || Boolean(String(employer || "").trim() && String(occupation || "").trim());

    return {
      id: String(target?.id || target?.contact_id || `finance-contact-${index}`),
      name: normalizeContactName(target),
      city: target?.city ?? null,
      state: target?.state ?? null,
      candidateApproved: Boolean(target?.candidate_approved ?? target?.candidateApproved ?? false),
      contributions:
        donationTotal > 0
          ? [
              {
                id: `contribution-${target?.id || index}`,
                amount: donationTotal,
                method: "online",
                date:
                  target?.last_donation_date ||
                  target?.fec_last_donation_date ||
                  target?.created_at ||
                  new Date().toISOString(),
                compliant,
                employer,
                occupation,
                notes: target?.notes ?? null,
              },
            ]
          : [],
      pledges:
        pledgeAmount > donationTotal
          ? [
              {
                id: `pledge-${target?.id || index}`,
                amount: pledgeAmount,
                status: "pledged",
                created_at: target?.created_at || new Date().toISOString(),
                converted_at: null,
                notes: target?.notes ?? null,
              },
            ]
          : [],
    };
  });
}

function buildFinanceWorkflowItems(contactRows: FinanceContactRow[]): FinanceWorkflowItem[] {
  const items: FinanceWorkflowItem[] = [];

  for (const contact of contactRows) {
    for (const pledge of contact.pledges) {
      if (pledge.status !== "converted") {
        items.push({
          id: `workflow-pledge-${pledge.id}`,
          title: `Collect ${contact.name} pledge`,
          owner: "Finance Team",
          type: "pledge_follow_up",
          priority: pledge.amount >= 1000 ? "high" : "medium",
          status: "open",
          contactId: contact.id,
          pledgeId: pledge.id,
        });
      }
    }

    for (const contribution of contact.contributions) {
      if (!contribution.compliant) {
        items.push({
          id: `workflow-compliance-${contribution.id}`,
          title: `Fix ${contact.name} compliance data`,
          owner: "Finance Team",
          type: "missing_compliance",
          priority: "high",
          status: "open",
          contactId: contact.id,
          contributionId: contribution.id,
        });
      }
    }
  }

  return items;
}

function buildFinanceCallRows(targets: any[]): FinanceCallRow[] {
  const grouped = new Map<string, FinanceCallRow>();

  for (const target of targets) {
    const caller = String(target?.owner_name || target?.caller || "Unassigned");

    const existing =
      grouped.get(caller) ??
      {
        id: `caller-${caller.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        caller,
        calls: 0,
        connects: 0,
        pledged: 0,
        raised: 0,
      };

    existing.calls += toNumber(target?.calls ?? target?.call_count ?? 0);
    existing.connects += toNumber(target?.connects ?? target?.connect_count ?? 0);
    existing.pledged += toNumber(target?.pledge_amount ?? target?.pledged ?? 0);
    existing.raised += toNumber(
      target?.donation_total ??
        target?.total_given ??
        target?.fec_total_given ??
        target?.raised ??
        0
    );

    grouped.set(caller, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => b.raised - a.raised);
}

function buildFinanceChartData(contactRows: FinanceContactRow[]): FinanceChartPoint[] {
  const rowsWithValue = contactRows
    .map((contact) => {
      const moneyIn = contact.contributions.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const pledges = contact.pledges
        .filter((pledge) => pledge.status !== "converted")
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        moneyIn,
        pledges,
      };
    })
    .filter((row) => row.moneyIn > 0 || row.pledges > 0);

  const totalMoneyIn = rowsWithValue.reduce(
    (sum, row) => sum + row.moneyIn,
    0
  );

  const totalPledges = rowsWithValue.reduce(
    (sum, row) => sum + row.pledges,
    0
  );

  if (totalMoneyIn === 0 && totalPledges === 0) {
    return [];
  }

  const weekWeights = [0.76, 0.89, 0.96, 1];

  return weekWeights.map((weight, index) => {
    const moneyIn = Math.round(totalMoneyIn * weight);
    const pledges = Math.round(totalPledges * weight);

    return {
      label: `W${index + 1}`,
      money_in: moneyIn,
      money_out: 0,
      net: moneyIn,
      pledges,
    };
  });
}

function buildFinanceMetrics(input: {
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalNet: number;
  totalPledges: number;
}): FinanceMetricCard[] {
  return [
    {
      id: "money_in",
      label: "Money In",
      value: currency.format(input.totalMoneyIn),
      helper: "Current live records",
      trend: input.totalMoneyIn > 0 ? "up" : "neutral",
    },
    {
      id: "money_out",
      label: "Money Out",
      value: currency.format(input.totalMoneyOut),
      helper: "Current live records",
      trend: input.totalMoneyOut > 0 ? "down" : "neutral",
    },
    {
      id: "net",
      label: "Net",
      value: currency.format(input.totalNet),
      helper: "Current balance flow",
      trend: input.totalNet > 0 ? "up" : input.totalNet < 0 ? "down" : "neutral",
    },
    {
      id: "pledges",
      label: "Pledges",
      value: currency.format(input.totalPledges),
      helper: "Awaiting collection",
      trend: input.totalPledges > 0 ? "neutral" : "neutral",
    },
  ];
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

function getChartViewLabel(view: FinanceChartView) {
  switch (view) {
    case "money_in":
      return "Money In";
    case "money_out":
      return "Money Out";
    case "net":
      return "Net";
    case "pledges":
    default:
      return "Pledges";
  }
}

function getTimeframeLabel(timeframe: FinanceTimeframe) {
  switch (timeframe) {
    case "today":
      return "Today";
    case "week":
      return "Week";
    case "month":
      return "Month";
    case "quarter":
      return "Quarter";
    case "cycle":
    default:
      return "Cycle";
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

function getChartDataForTimeframe(
  timeframe: FinanceTimeframe
): FinanceChartPoint[] {
  return [];
}

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

function getFinanceAbeBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  pledgeQueueLength: number;
  complianceIssuesLength: number;
  workflowOpenCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  financeCommandSignal: FinanceCommandSignal;
  selectedContact: FinanceContactRow | null;
  orgContext?: ReturnType<typeof getOrgContextForDepartment>;
}): AbeBriefing {
  const strongest: AbeDepartment =
    input.totalMoneyIn > input.totalMoneyOut ? "finance" : "outreach";

  const weakest: AbeDepartment =
    input.complianceIssuesLength > 0 || input.pledgeQueueLength > 0
      ? "finance"
      : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? "finance"
      : input.demoDepartment === "finance"
      ? "finance"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.pledgeQueueLength > 0 ? "finance" : "outreach";

  let health = "Stable overall";
  if (input.complianceIssuesLength > 0 && input.pledgeQueueLength > 0) {
    health = "Pressure is rising";
  } else if (input.totalMoneyIn > input.totalMoneyOut * 1.5) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (input.pledgeQueueLength > 0 && input.complianceIssuesLength > 0) {
    campaignStatus = "Pledge and compliance pressure are active";
  } else if (input.pledgeQueueLength > 0) {
    campaignStatus = "Stable with pledge pressure";
  } else if (input.complianceIssuesLength > 0) {
    campaignStatus = "Stable with compliance pressure";
  } else if (input.totalMoneyIn > input.totalMoneyOut) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Finance is moving money, but the lane needs clean collection and compliance discipline to stay trustworthy.";

  if (input.pledgeQueueLength > 0 && input.complianceIssuesLength > 0) {
    whyNow =
      "Finance has money available in the pipeline, but open pledges and incomplete donor records are creating the risk that matters right now.";
  } else if (input.pledgeQueueLength > 0) {
    whyNow =
      "Pledged dollars are sitting uncollected, which means finance needs tighter follow-through before momentum softens.";
  } else if (input.complianceIssuesLength > 0) {
    whyNow =
      "Missing employer and occupation details are blocking clean reporting, so finance needs cleanup before exports can be trusted.";
  }

  const whyNowModifiers:string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Finance is carrying the most campaign-wide pressure right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Finance is acting as a steadier campaign-wide support lane.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this finance signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  const baseSupportText =
    input.role === "admin"
      ? "Use Finance Focus to clear collection pressure and protect compliance."
      : input.role === "director"
      ? "Use Finance Focus to sequence collection and compliance cleanly."
      : "Finish the next finance action cleanly and move on.";

  const supportText = [baseSupportText, input.orgContext?.orgSupportLine]
    .filter(Boolean)
    .join(" ");

  const actions: string[] = [];

  if (input.pledgeQueueLength > 0) {
    actions.push("Convert active pledges before opening fresh finance work.");
  }

  if (input.complianceIssuesLength > 0) {
    actions.push("Fix incomplete donor records before export readiness slips.");
  }

  if (input.workflowOpenCount > 0) {
    actions.push("Clear the finance workflow queue in priority order.");
  } else {
    actions.push("Keep contributions logged cleanly so the lane stays audit-ready.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next finance action tight and move to the next record.");
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
      input.pledgeQueueLength > 0
        ? "FINANCE has collection work active that could spill into OUTREACH follow-up if not cleared."
        : undefined,
  };
}

export default function FinanceDashboardPage() {
  const [chartView, setChartView] = useState<FinanceChartView>("money_in");
  const [chartTimeframe, setChartTimeframe] =
    useState<FinanceTimeframe>("month");

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("finance");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const [financeTargets, setFinanceTargets] = useState<any[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);

  const [contactRows, setContactRows] = useState<FinanceContactRow[]>([]);
  const [workflowItems, setWorkflowItems] = useState<FinanceWorkflowItem[]>([]);

  const [newContactName, setNewContactName] = useState("");
  const [newContributionAmount, setNewContributionAmount] = useState("");
  const [newEntryMethod, setNewEntryMethod] = useState<
    "online" | "check" | "cash" | "pledge"
  >("online");

  const [financeFocusMode, setFinanceFocusMode] = useState(false);
  const [selectedFinanceContactId, setSelectedFinanceContactId] = useState("");
  const [loopAmount, setLoopAmount] = useState("");
  const [loopMethod, setLoopMethod] = useState<"online" | "check" | "cash">(
    "check"
  );
  const [loopEmployer, setLoopEmployer] = useState("");
  const [loopOccupation, setLoopOccupation] = useState("");
  const [loopMessage, setLoopMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFinanceTargets() {
      try {
        setFinanceLoading(true);
        const targets = await getFinanceCallTargets();

        if (!mounted) return;

        const safeTargets = Array.isArray(targets) ? targets : [];
        const nextContactRows = buildFinanceContactRows(safeTargets);

        setFinanceTargets(safeTargets);
        setContactRows(nextContactRows);
        setWorkflowItems(buildFinanceWorkflowItems(nextContactRows));

        if (nextContactRows.length > 0) {
          setSelectedFinanceContactId((current) =>
            nextContactRows.some((contact) => contact.id === current)
              ? current
              : nextContactRows[0].id
          );
        } else {
          setSelectedFinanceContactId("");
        }
      } catch (error) {
        console.error("Failed to load finance targets:", error);

        if (!mounted) return;

        setFinanceTargets([]);
        setContactRows([]);
        setWorkflowItems([]);
        setSelectedFinanceContactId("");
      } finally {
        if (mounted) {
          setFinanceLoading(false);
        }
      }
    }

    loadFinanceTargets();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    return buildFinanceChartData(contactRows);
  }, [contactRows]);

  const totalMoneyIn = useMemo(
    () => contactRows.reduce(
      (sum, contact) =>
        sum + contact.contributions.reduce((contactSum, item) => contactSum + item.amount, 0),
      0
    ),
    [contactRows]
  );

  const totalMoneyOut = useMemo(() => 0, []);

  const totalNet = useMemo(
    () => totalMoneyIn - totalMoneyOut,
    [totalMoneyIn, totalMoneyOut]
  );

  const totalPledges = useMemo(
    () => contactRows.reduce(
      (sum, contact) =>
        sum +
        contact.pledges
          .filter((pledge) => pledge.status !== "converted")
          .reduce((pledgeSum, item) => pledgeSum + item.amount, 0),
      0
    ),
    [contactRows]
  );

  const metrics = useMemo<FinanceMetricCard[]>(() => {
    return buildFinanceMetrics({
      totalMoneyIn,
      totalMoneyOut,
      totalNet,
      totalPledges,
    });
  }, [totalMoneyIn, totalMoneyOut, totalNet, totalPledges]);

  const callRows = useMemo<FinanceCallRow[]>(() => {
    return buildFinanceCallRows(financeTargets);
  }, [financeTargets]);

  const selectedChartValues = useMemo(() => {
    return chartData.map((point) => point[chartView]);
  }, [chartData, chartView]);

  const maxChartValue = useMemo(() => {
    return Math.max(...selectedChartValues, 0);
  }, [selectedChartValues]);

  const minChartValue = useMemo(() => {
    return Math.min(...selectedChartValues, 0);
  }, [selectedChartValues]);

  const range = maxChartValue - minChartValue || 1;

  const getChartY = (value: number) => {
    const normalized = (value - minChartValue) / range;
    return 86 - normalized * 64;
  };

  const linePath = useMemo(() => {
    if (chartData.length === 0) return "";

    if (chartData.length === 1) {
      const y = getChartY(chartData[0][chartView]);
      return `M 8 ${y} L 92 ${y}`;
    }

    return chartData
      .map((point, index) => {
        const x = 8 + (index / (chartData.length - 1)) * 84;
        const y = getChartY(point[chartView]);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartData, chartView, maxChartValue, minChartValue]);

  const areaPath = useMemo(() => {
    if (!linePath || chartData.length === 0) return "";

    const firstX = 8;
    const lastX = 92;

    return `${linePath} L ${lastX} 90 L ${firstX} 90 Z`;
  }, [linePath, chartData.length]);

  const financeCommandSignal = useMemo<FinanceCommandSignal>(() => {
    const highPriorityPledges = workflowItems.filter(
      (item) => item.type === "pledge_follow_up" && item.priority === "high"
    );

    const missingCompliance = workflowItems.filter(
      (item) => item.type === "missing_compliance"
    );

    const backlogEntries = workflowItems.filter(
      (item) => item.type === "contribution_entry"
    );

    if (highPriorityPledges.length > 0) {
      return {
        title: "Prioritize pledge conversion",
        detail:
          "High-value pledges are sitting uncollected. Convert these before new outreach.",
        priority: "high",
        category: "conversion",
        autoReady: true,
      };
    }

    if (missingCompliance.length > 0) {
      return {
        title: "Fix compliance gaps",
        detail:
          "Incomplete donor records will block exports and reporting accuracy.",
        priority: "high",
        category: "task",
        autoReady: true,
      };
    }

    if (backlogEntries.length > 0) {
      return {
        title: "Clear contribution backlog",
        detail:
          "Manual entry is falling behind. Process contributions to keep books clean.",
        priority: "medium",
        category: "task",
        autoReady: true,
      };
    }

    return {
      title: "Finance stable",
      detail: "No immediate pressure in pledges, compliance, or entry.",
      priority: "low",
      category: "review",
      autoReady: false,
    };
  }, [workflowItems]);

  const selectedContact = useMemo(() => {
    return (
      contactRows.find((contact) => contact.id === selectedFinanceContactId) ||
      null
    );
  }, [contactRows, selectedFinanceContactId]);

  const pledgeQueue = useMemo(() => {
    return contactRows
      .flatMap((contact) =>
        contact.pledges.map((pledge) => ({
          ...pledge,
          contactName: contact.name,
          contactId: contact.id,
        }))
      )
      .filter((pledge) => pledge.status !== "converted");
  }, [contactRows]);

  const complianceIssues = useMemo(() => {
    return contactRows.flatMap((contact) =>
      contact.contributions
        .filter((c) => !c.compliant)
        .map((c) => ({
          ...c,
          contactName: contact.name,
          contactId: contact.id,
        }))
    );
  }, [contactRows]);

  const financeOrgLayer = useMemo(() => {
    return buildAbeOrgLayer({
      lanes: [
        {
          department: "finance",
          strongest: totalMoneyIn > totalMoneyOut ? "finance" : "outreach",
          weakest:
            pledgeQueue.length > 0 || complianceIssues.length > 0
              ? "finance"
              : "outreach",
          primaryLane: "finance",
          opportunityLane: pledgeQueue.length > 0 ? "finance" : "outreach",
          health:
            pledgeQueue.length > 0 && complianceIssues.length > 0
              ? "Pressure is rising"
              : totalMoneyIn > totalMoneyOut * 1.5
              ? "Momentum building"
              : "Stable overall",
          campaignStatus:
            pledgeQueue.length > 0 && complianceIssues.length > 0
              ? "Pledge and compliance pressure are active"
              : pledgeQueue.length > 0
              ? "Stable with pledge pressure"
              : complianceIssues.length > 0
              ? "Stable with compliance pressure"
              : totalMoneyIn > totalMoneyOut
              ? "Stable with opportunity"
              : "Stable overall",
          crossDomainSignal:
            pledgeQueue.length > 0
              ? "FINANCE has collection work active that could spill into OUTREACH follow-up if not cleared."
              : undefined,
        },
        {
          department: "outreach",
          strongest: pledgeQueue.length > 0 ? "outreach" : "finance",
          weakest:
            workflowItems.filter((item) => item.status !== "done").length > 4
              ? "outreach"
              : "finance",
          primaryLane: "outreach",
          opportunityLane: pledgeQueue.length > 0 ? "finance" : "outreach",
          health:
            pledgeQueue.length > 0 ? "Momentum building" : "Stable overall",
          campaignStatus:
            pledgeQueue.length > 0
              ? "Stable with finance-triggered opportunity"
              : "Stable overall",
          crossDomainSignal:
            pledgeQueue.length > 0
              ? "OUTREACH may need to absorb finance-triggered follow-up if the queue keeps building."
              : undefined,
        },
      ],
    });
  }, [
    totalMoneyIn,
    totalMoneyOut,
    pledgeQueue.length,
    complianceIssues.length,
    workflowItems,
  ]);

  const financeOrgContext = useMemo(() => {
    return getOrgContextForDepartment(financeOrgLayer, "finance");
  }, [financeOrgLayer]);

  const financeAbeBriefing = useMemo(() => {
    return getFinanceAbeBriefing({
      role: demoRole,
      demoDepartment,
      pledgeQueueLength: pledgeQueue.length,
      complianceIssuesLength: complianceIssues.length,
      workflowOpenCount: workflowItems.filter((item) => item.status !== "done")
        .length,
      totalMoneyIn,
      totalMoneyOut,
      financeCommandSignal,
      selectedContact,
      orgContext: financeOrgContext,
    });
  }, [
    demoRole,
    demoDepartment,
    pledgeQueue.length,
    complianceIssues.length,
    workflowItems,
    totalMoneyIn,
    totalMoneyOut,
    financeCommandSignal,
    selectedContact,
    financeOrgContext,
  ]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, financeAbeBriefing));
  }, [
    financeAbeBriefing.health,
    financeAbeBriefing.campaignStatus,
    financeAbeBriefing.primaryLane,
    financeAbeBriefing.strongest,
    financeAbeBriefing.weakest,
    financeAbeBriefing.opportunityLane,
    financeAbeBriefing.crossDomainSignal,
  ]);

  const financePatternWatch = useMemo(() => {
    const patterns = buildAbePatternInsights({
      role: demoRole,
      demoDepartment: "finance",
      briefing: financeAbeBriefing,
      memory: abeMemory,
    });

    return filterPatternsForDepartment(patterns, "finance");
  }, [demoRole, financeAbeBriefing, abeMemory]);

  const financeAbeInsight = useMemo(() => {
    if (financePatternWatch.length > 0) {
      return financePatternWatch[0].detail;
    }

    return financeAbeBriefing.whyNow;
  }, [financePatternWatch, financeAbeBriefing.whyNow]);

  const selectedFinancePatternHint = useMemo(() => {
    if (!selectedContact) return null;

    if (selectedContact.pledges.some((pledge) => pledge.status !== "converted")) {
      return "Pattern: active pledges are remaining open and need tighter conversion.";
    }

    if (selectedContact.contributions.some((contribution) => !contribution.compliant)) {
      return "Pattern: compliance cleanup is repeating inside finance records.";
    }

    return "Pattern: finance needs clean entry discipline to stay audit-ready.";
  }, [selectedContact]);

  const visibleMetrics = useMemo(() => {
    if (demoRole === "admin") {
      return metrics;
    }

    if (demoRole === "director") {
      return metrics.filter((metric) =>
        ["money_in", "net", "pledges"].includes(metric.id)
      );
    }

    return metrics.filter((metric) =>
      ["pledges", "money_in"].includes(metric.id)
    );
  }, [metrics, demoRole]);

  const visibleWorkflowItems = useMemo(() => {
    if (demoRole === "admin") {
      return workflowItems;
    }

    if (demoRole === "director") {
      return workflowItems.filter((item) =>
        ["pledge_follow_up", "missing_compliance"].includes(item.type)
      );
    }

    return workflowItems.filter((item) => item.type === "pledge_follow_up");
  }, [workflowItems, demoRole]);

  const visibleCallRows = useMemo(() => {
    if (demoRole === "admin") {
      return callRows;
    }

    if (demoRole === "director") {
      return callRows.slice(0, 2);
    }

    return callRows.slice(0, 1);
  }, [callRows, demoRole]);

  const perspectiveHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Finance Command Center";
    }

    if (demoRole === "director") {
      return "Finance Director View";
    }

    return "Finance Work Lane";
  }, [demoRole]);

  const perspectiveSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Track money in, money out, net flow, pledges, contribution history, and compliance across your contacts.";
    }

    if (demoRole === "director") {
      return "Lead the finance lane with tighter visibility into pledge conversion, compliance cleanup, and team finance performance.";
    }

    return "Stay focused on the finance work that needs to move right now without carrying the full administrative surface.";
  }, [demoRole]);

  const aiSummaryHeadline = useMemo(() => {
    if (!contactRows.length) {
      return "No finance records uploaded yet.";
    }

    if (pledgeQueue.length > 0 && complianceIssues.length > 0) {
      return "Finance has active pledge and compliance pressure.";
    }

    if (pledgeQueue.length > 0) {
      return "Finance has pledge collection work ready.";
    }

    if (complianceIssues.length > 0) {
      return "Finance has compliance cleanup ready.";
    }

    return "Finance records are available for review.";
  }, [contactRows.length, pledgeQueue.length, complianceIssues.length]);

  const aiSummaryBody = useMemo(() => {
    if (!contactRows.length) {
      return "Finance will stay quiet until donor, contribution, or pledge records are available for this campaign.";
    }

    if (pledgeQueue.length > 0 || complianceIssues.length > 0) {
      return "Open pledges and compliance gaps are shaping the current finance read.";
    }

    return "Uploaded finance records are available and no immediate pledge or compliance pressure is visible.";
  }, [contactRows.length, pledgeQueue.length, complianceIssues.length]);

  const aiSummaryNext = useMemo(() => {
    if (!contactRows.length) {
      return "Upload finance data to activate donor, pledge, and compliance intelligence.";
    }

    if (visibleWorkflowItems.length > 0) {
      return "Focus next on clearing the live finance workflow queue.";
    }

    return "Review finance records and keep contribution entry clean.";
  }, [contactRows.length, visibleWorkflowItems.length]);

  const commandSignalCtaLabel = useMemo(() => {
    if (demoRole === "general_user") {
      return "Open Finance Work";
    }

    return "Open Finance Focus";
  }, [demoRole]);

  const handleAddEntry = () => {
    if (!newContactName.trim() || !newContributionAmount) return;

    const newId = `c-${Date.now()}`;
    const amount = Number(newContributionAmount);

    const newContact: FinanceContactRow = {
      id: newId,
      name: newContactName,
      contributions:
        newEntryMethod === "pledge"
          ? []
          : [
              {
                id: `ctrb-${Date.now()}`,
                amount,
                method: newEntryMethod,
                date: new Date().toISOString(),
                compliant: false,
                employer: null,
                occupation: null,
              },
            ],
      pledges:
        newEntryMethod === "pledge"
          ? [
              {
                id: `plg-${Date.now()}`,
                amount,
                status: "pledged",
                created_at: new Date().toISOString(),
              },
            ]
          : [],
    };

    setContactRows((prev) => [newContact, ...prev]);
    setNewContactName("");
    setNewContributionAmount("");
  };

  const handleCompleteWorkflow = (id: string) => {
    setWorkflowItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "done" } : item
      )
    );
  };

  const handleFocusSave = () => {
    if (!selectedContact || !loopAmount) return;

    const amount = Number(loopAmount);

    setContactRows((prev) =>
      prev.map((contact) => {
        if (contact.id !== selectedContact.id) return contact;

        return {
          ...contact,
          contributions: [
            ...contact.contributions,
            {
              id: `ctrb-${Date.now()}`,
              amount,
              method: loopMethod,
              date: new Date().toISOString(),
              compliant: Boolean(loopEmployer && loopOccupation),
              employer: loopEmployer,
              occupation: loopOccupation,
              notes: loopMessage,
            },
          ],
          pledges: contact.pledges.map((pledge) =>
            pledge.status === "pledged"
              ? {
                  ...pledge,
                  status: "converted",
                  converted_at: new Date().toISOString(),
                }
              : pledge
          ),
        };
      })
    );

    setLoopAmount("");
    setLoopEmployer("");
    setLoopOccupation("");
    setLoopMessage("");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Landmark className="h-4 w-4" />
              Revenue + compliance engine
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
              href="/dashboard/finance/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              Open Focus Mode
            </Link>

            {demoRole !== "general_user" ? (
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <FileSpreadsheet className="h-4 w-4" />
                Export Finance
              </button>
            ) : null}

            {demoRole !== "general_user" ? (
              <button className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100">
                <AlertTriangle className="h-4 w-4" />
                Compliance Review Needed
              </button>
            ) : null}
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
          This finance surface narrows around who is using Aether and how much
          of the lane they should see.
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
                  {financeAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Strongest:</span>{" "}
                  {departmentLabel(financeAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Weakest:</span>{" "}
                  {departmentLabel(financeAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Status:</span>{" "}
                  {financeAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-amber-900">
                {financeAbeBriefing.primaryLane === "finance"
                  ? "Finance is the lane that needs tight control right now."
                  : `${departmentLabel(
                      financeAbeBriefing.primaryLane
                    )} is shaping what finance should do next.`}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                {aiSummaryBody}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600">
                Why now: {financeAbeInsight}
              </p>

              {financeAbeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-amber-900/80">
                  {financeAbeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600">
                {financeAbeBriefing.supportText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {financeAbeBriefing.actions.map((move, index) => (
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

        {financePatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Pattern Watch
            </p>
                        <div className="mt-3 space-y-3">
              {financePatternWatch.map((insight, index) => (
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
          visibleMetrics.length === 2
            ? "md:grid-cols-2"
            : visibleMetrics.length === 3
            ? "md:grid-cols-3"
            : "md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visibleMetrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              {metric.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : metric.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              ) : null}
            </div>

            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {metric.value}
            </p>

            <p className="mt-2 text-sm text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Finance Trend
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              {getChartViewLabel(chartView)} · {getTimeframeLabel(chartTimeframe)}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              ["money_in", "money_out", "net", "pledges"] as FinanceChartView[]
            ).map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  chartView === view
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {getChartViewLabel(view)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              ["today", "week", "month", "quarter", "cycle"] as FinanceTimeframe[]
            ).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setChartTimeframe(timeframe)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  chartTimeframe === timeframe
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {getTimeframeLabel(timeframe)}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 && maxChartValue > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-white">
              <div className="absolute inset-x-0 top-1/3 border-t border-dotted border-slate-200" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dotted border-slate-200" />
              <div className="absolute inset-x-0 top-2/3 border-t border-dotted border-slate-200" />

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="relative h-full w-full"
              >
                <defs>
                  <linearGradient id="financeChartFade" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path
                  d={areaPath}
                  fill="url(#financeChartFade)"
                  className="text-slate-900"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-800"
                />
              </svg>

              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
            </div>

            <div className="mt-5 grid grid-cols-4 gap-4 text-center text-sm">
              {chartData.slice(-4).map((point, index) => (
                <div key={`${point.label}-${index}`}>
                  <p className="text-xs font-medium text-sky-700">
                    {point.label}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {currency.format(point[chartView])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {financeLoading
              ? "Loading finance trend data..."
              : "No finance trend data available yet."}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Finance Workflow
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Active Tasks
              </h2>
            </div>

            <BadgeDollarSign className="h-5 w-5 text-slate-500" />
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
            {visibleWorkflowItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {financeLoading
                  ? "Loading finance workflow..."
                  : "No finance workflow items are available from live records yet."}
              </div>
            ) : null}

            {visibleWorkflowItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Owner: {item.owner}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.type}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.priority}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.status !== "done" ? (
                  <button
                    onClick={() => handleCompleteWorkflow(item.id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mark Complete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Call Time
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Finance Outreach
              </h2>
            </div>

            <Users className="h-5 w-5 text-slate-500" />
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
            {visibleCallRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {financeLoading
                  ? "Loading finance call targets..."
                  : "No finance call rows are available from live records yet."}
              </div>
            ) : null}

            {visibleCallRows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{row.caller}</p>
                  <p className="text-sm text-slate-500">
                    {row.calls} calls
                  </p>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Connects</p>
                    <p className="font-semibold">{row.connects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pledged</p>
                    <p className="font-semibold">
                      {currency.format(row.pledged)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Raised</p>
                    <p className="font-semibold">
                      {currency.format(row.raised)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Contacts
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Donor + Prospect Records
            </h2>
          </div>

          <HandCoins className="h-5 w-5 text-slate-500" />
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {contactRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {financeLoading
                ? "Loading finance contacts..."
                : "No donor or prospect finance records are available yet."}
            </div>
          ) : null}

          {contactRows.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedFinanceContactId(contact.id)}
              className={`cursor-pointer rounded-2xl border p-3 ${
                selectedFinanceContactId === contact.id
                  ? "border-slate-900 bg-slate-100"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="font-semibold text-slate-900">{contact.name}</p>
              <p className="text-sm text-slate-500">
                {contact.city}, {contact.state}
              </p>

              {selectedFinanceContactId === contact.id &&
              selectedFinancePatternHint ? (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {selectedFinancePatternHint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {financeFocusMode && selectedContact ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Finance Focus Mode
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Execute the next finance action cleanly and move forward.
            </p>
          </div>

          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Selected Contact</p>
            <p className="mt-1 font-semibold text-slate-900">
              {selectedContact.name}
            </p>
          </div>

          <div className="space-y-4">
            <input
              value={loopAmount}
              onChange={(e) => setLoopAmount(e.target.value)}
              placeholder="Amount"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />

            <select
              value={loopMethod}
              onChange={(e) =>
                setLoopMethod(e.target.value as "online" | "check" | "cash")
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="online">Online</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
            </select>

            <input
              value={loopEmployer}
              onChange={(e) => setLoopEmployer(e.target.value)}
              placeholder="Employer"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />

            <input
              value={loopOccupation}
              onChange={(e) => setLoopOccupation(e.target.value)}
              placeholder="Occupation"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />

            <textarea
              value={loopMessage}
              onChange={(e) => setLoopMessage(e.target.value)}
              placeholder="Notes..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />

            <button
              onClick={handleFocusSave}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white hover:bg-slate-800"
            >
              Save & Continue
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}