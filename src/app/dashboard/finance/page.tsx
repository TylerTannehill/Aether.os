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
  switch (timeframe) {
    case "today":
      return [
        {
          label: "8 AM",
          money_in: 1800,
          money_out: 200,
          net: 1600,
          pledges: 400,
        },
        {
          label: "10 AM",
          money_in: 2600,
          money_out: 350,
          net: 2250,
          pledges: 650,
        },
        {
          label: "12 PM",
          money_in: 3900,
          money_out: 600,
          net: 3300,
          pledges: 900,
        },
        {
          label: "2 PM",
          money_in: 4700,
          money_out: 850,
          net: 3850,
          pledges: 1200,
        },
        {
          label: "4 PM",
          money_in: 6200,
          money_out: 1200,
          net: 5000,
          pledges: 1650,
        },
      ];

    case "week":
      return [
        {
          label: "Mon",
          money_in: 5400,
          money_out: 1100,
          net: 4300,
          pledges: 900,
        },
        {
          label: "Tue",
          money_in: 8200,
          money_out: 1600,
          net: 6600,
          pledges: 1500,
        },
        {
          label: "Wed",
          money_in: 9800,
          money_out: 2100,
          net: 7700,
          pledges: 2400,
        },
        {
          label: "Thu",
          money_in: 12100,
          money_out: 2600,
          net: 9500,
          pledges: 3100,
        },
        {
          label: "Fri",
          money_in: 15800,
          money_out: 3300,
          net: 12500,
          pledges: 4200,
        },
      ];

    case "month":
      return [
        {
          label: "Week 1",
          money_in: 12000,
          money_out: 4000,
          net: 8000,
          pledges: 2500,
        },
        {
          label: "Week 2",
          money_in: 18000,
          money_out: 5200,
          net: 12800,
          pledges: 4100,
        },
        {
          label: "Week 3",
          money_in: 23000,
          money_out: 6800,
          net: 16200,
          pledges: 5300,
        },
        {
          label: "Week 4",
          money_in: 31250,
          money_out: 7100,
          net: 24150,
          pledges: 6500,
        },
      ];

    case "quarter":
      return [
        {
          label: "Jan",
          money_in: 74250,
          money_out: 22800,
          net: 51450,
          pledges: 14100,
        },
        {
          label: "Feb",
          money_in: 68800,
          money_out: 24100,
          net: 44700,
          pledges: 12900,
        },
        {
          label: "Mar",
          money_in: 84250,
          money_out: 23100,
          net: 61150,
          pledges: 18400,
        },
      ];

    case "cycle":
    default:
      return [
        {
          label: "Launch",
          money_in: 45000,
          money_out: 17000,
          net: 28000,
          pledges: 9000,
        },
        {
          label: "Build",
          money_in: 98000,
          money_out: 43000,
          net: 55000,
          pledges: 21500,
        },
        {
          label: "Scale",
          money_in: 162000,
          money_out: 67000,
          net: 95000,
          pledges: 30400,
        },
        {
          label: "Push",
          money_in: 248000,
          money_out: 104000,
          net: 144000,
          pledges: 46800,
        },
        {
          label: "Close",
          money_in: 326000,
          money_out: 139000,
          net: 187000,
          pledges: 58200,
        },
      ];
  }
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

  const [contactRows, setContactRows] = useState<FinanceContactRow[]>([
      {
              id: "c1",
      name: "Sarah Mitchell",
      city: "Chicago",
      state: "IL",
      candidateApproved: true,
      contributions: [
        {
          id: "ctrb-1",
          amount: 2500,
          method: "online",
          date: "2026-04-01",
          compliant: true,
          employer: "Mitchell Advisory",
          occupation: "Consultant",
          notes: "High-capacity contact",
        },
      ],
      pledges: [],
    },
    {
      id: "c2",
      name: "James Carter",
      city: "Naperville",
      state: "IL",
      candidateApproved: false,
      contributions: [
        {
          id: "ctrb-2",
          amount: 1000,
          method: "check",
          date: "2026-04-02",
          compliant: false,
          employer: null,
          occupation: null,
          notes: "Missing employer and occupation",
        },
      ],
      pledges: [],
    },
    {
      id: "c3",
      name: "Alicia Stone",
      city: "Evanston",
      state: "IL",
      candidateApproved: true,
      contributions: [
        {
          id: "ctrb-3",
          amount: 500,
          method: "cash",
          date: "2026-04-03",
          compliant: true,
          employer: "Stone Design",
          occupation: "Designer",
          notes: null,
        },
      ],
      pledges: [],
    },
    {
      id: "c4",
      name: "Michael Ross",
      city: "Aurora",
      state: "IL",
      candidateApproved: false,
      contributions: [],
      pledges: [
        {
          id: "plg-1",
          amount: 3200,
          status: "pledged",
          created_at: "2026-04-04",
          converted_at: null,
          notes: "Needs follow-up to collect pledge",
        },
      ],
    },
  ]);

  const [workflowItems, setWorkflowItems] = useState<FinanceWorkflowItem[]>([
    {
      id: "w1",
      title: "Collect Michael Ross pledge",
      owner: "Tyler",
      type: "pledge_follow_up",
      priority: "high",
      status: "open",
      contactId: "c4",
      pledgeId: "plg-1",
    },
    {
      id: "w2",
      title: "Fix James Carter compliance data",
      owner: "Finance Team",
      type: "missing_compliance",
      priority: "high",
      status: "open",
      contactId: "c2",
      contributionId: "ctrb-2",
    },
    {
      id: "w3",
      title: "Enter weekend fundraiser checks",
      owner: "Maya",
      type: "contribution_entry",
      priority: "medium",
      status: "in_progress",
    },
  ]);

  const [newContactName, setNewContactName] = useState("");
  const [newContributionAmount, setNewContributionAmount] = useState("");
  const [newEntryMethod, setNewEntryMethod] = useState<
    "online" | "check" | "cash" | "pledge"
  >("online");

  const [financeFocusMode, setFinanceFocusMode] = useState(false);
  const [selectedFinanceContactId, setSelectedFinanceContactId] = useState("c4");
  const [loopAmount, setLoopAmount] = useState("");
  const [loopMethod, setLoopMethod] = useState<"online" | "check" | "cash">(
    "check"
  );
  const [loopEmployer, setLoopEmployer] = useState("");
  const [loopOccupation, setLoopOccupation] = useState("");
  const [loopMessage, setLoopMessage] = useState("");

  const metrics = useMemo<FinanceMetricCard[]>(
    () => [
      {
        id: "money_in",
        label: "Money In",
        value: currency.format(84250),
        helper: "This month",
        trend: "up",
      },
      {
        id: "money_out",
        label: "Money Out",
        value: currency.format(23100),
        helper: "This month",
        trend: "down",
      },
      {
        id: "net",
        label: "Net",
        value: currency.format(61150),
        helper: "Current balance flow",
        trend: "up",
      },
      {
        id: "pledges",
        label: "Pledges",
        value: currency.format(18400),
        helper: "Awaiting collection",
        trend: "neutral",
      },
    ],
    []
  );

  const callRows = useMemo<FinanceCallRow[]>(
    () => [
      {
        id: "c1",
        caller: "Tyler",
        calls: 42,
        connects: 18,
        pledged: 6200,
        raised: 3900,
      },
      {
        id: "c2",
        caller: "Maya",
        calls: 31,
        connects: 14,
        pledged: 4100,
        raised: 2100,
      },
      {
        id: "c3",
        caller: "Jordan",
        calls: 27,
        connects: 11,
        pledged: 2900,
        raised: 1400,
      },
    ],
    []
  );

  const chartData = useMemo(() => {
    return getChartDataForTimeframe(chartTimeframe);
  }, [chartTimeframe]);

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

  const getY = (value: number) => {
    const normalized = (value - minChartValue) / range;
    const height = 160;
    return height - normalized * height;
  };

  const linePath = useMemo(() => {
    if (chartData.length === 0) return "";

    return chartData
      .map((point, index) => {
        const x = (index / (chartData.length - 1)) * 100;
        const y = (getY(point[chartView]) / 160) * 100;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartData, chartView]);

  const totalMoneyIn = useMemo(
    () => chartData.reduce((sum, p) => sum + p.money_in, 0),
    [chartData]
  );

  const totalMoneyOut = useMemo(
    () => chartData.reduce((sum, p) => sum + p.money_out, 0),
    [chartData]
  );

  const totalNet = useMemo(
    () => chartData.reduce((sum, p) => sum + p.net, 0),
    [chartData]
  );

  const totalPledges = useMemo(
    () => chartData.reduce((sum, p) => sum + p.pledges, 0),
    [chartData]
  );

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
    if (demoRole === "admin") {
      return "Finance is productive, but pledge collection and compliance cleanup need tighter control.";
    }

    if (demoRole === "director") {
      return "Your finance lane is productive, but pledge conversion and compliance cleanup need attention.";
    }

    return "Your finance lane needs clean follow-through on pledges and compliance.";
  }, [demoRole]);

  const aiSummaryBody = useMemo(() => {
    if (demoRole === "admin") {
      return "Open pledges and compliance gaps are creating drag in the finance lane.";
    }

    if (demoRole === "director") {
      return "Finance execution is moving, but collection and compliance need tighter control.";
    }

    return "Keep pledge collection and compliance actions tight.";
  }, [demoRole]);

  const aiSummaryNext = useMemo(() => {
    if (demoRole === "admin") {
      return "Focus next on collection, compliance, and finance entry to keep money and reporting clean.";
    }

    if (demoRole === "director") {
      return "Focus next on converting priority pledges, clearing compliance gaps, and keeping the lane operationally clean.";
    }

    return "Focus next on the few finance actions that keep money and reporting clean.";
  }, [demoRole]);

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

        <div className="relative h-40 w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-slate-900"
            />
          </svg>
        </div>
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

          <div className="space-y-4">
            {visibleWorkflowItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

          <div className="space-y-4">
            {visibleCallRows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

        <div className="space-y-4">
          {contactRows.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedFinanceContactId(contact.id)}
              className={`cursor-pointer rounded-2xl border p-4 ${
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