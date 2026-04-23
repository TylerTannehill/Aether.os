"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ClipboardCheck,
  Package,
  Printer,
  Sparkles,
  Truck,
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

type PrintTrendView = "inventory" | "orders" | "deliveries" | "approvals";

type PrintAssetRow = {
  id: string;
  name: string;
  type: "mailer" | "door_hanger" | "yard_sign" | "lit_piece" | "digital_asset";
  status: "design" | "candidate_review" | "approved" | "ordered" | "delivered";
  owner: string;
  candidateApprovedDate?: string | null;
  expectedDelivery?: string | null;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type InventoryRow = {
  id: string;
  item: string;
  onHand: number;
  reserved: number;
  reorderAt: number;
  region: string;
  dailyUsage?: number;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type PrintOrderRow = {
  id: string;
  vendor: string;
  item: string;
  quantity: number;
  status: "queued" | "in_production" | "shipped" | "delivered";
  eta?: string | null;
  linkedTurf?: string;
  linkedUseCase?: string;
  unblocks?: string;
};

type PrintFocusTask = {
  id: string;
  title: string;
  type: "approval" | "inventory" | "delivery";
  priority: "high" | "medium" | "low";
  summary: string;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type PrintReadyAsset = {
  id: string;
  assetName: string;
  status: "approved" | "ordered" | "delivered";
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintInventoryAction = {
  id: string;
  item: string;
  amount: number;
  region: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintDeliveryUnlock = {
  id: string;
  item: string;
  vendor: string;
  eta: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

function priorityTone(priority: PrintFocusTask["priority"]) {
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

function assetStatusTone(status: PrintAssetRow["status"]) {
  switch (status) {
    case "design":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "candidate_review":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "approved":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "ordered":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function orderStatusTone(status: PrintOrderRow["status"]) {
  switch (status) {
    case "queued":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "in_production":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "shipped":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function focusTypeTone(type: PrintFocusTask["type"]) {
  switch (type) {
    case "approval":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "inventory":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "delivery":
    default:
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
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

function getPrintAbeBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  assetRows: PrintAssetRow[];
  inventoryRows: InventoryRow[];
  orderRows: PrintOrderRow[];
  readyAssets: PrintReadyAsset[];
  inventoryActions: PrintInventoryAction[];
  deliveryUnlocks: PrintDeliveryUnlock[];
  mostExposedInventory:
    | (InventoryRow & { available: number; daysRemaining: number | null })
    | undefined;
  selectedTask: PrintFocusTask | null;
  orgContext?: ReturnType<typeof getOrgContextForDepartment>;
}): AbeBriefing {
  const candidateReviewCount = input.assetRows.filter(
    (asset) => asset.status === "candidate_review"
  ).length;

  const queuedOrders = input.orderRows.filter(
    (order) => order.status === "queued" || order.status === "in_production"
  ).length;

  const strongest: AbeDepartment =
    input.readyAssets.length > 0 || input.deliveryUnlocks.length > 0
      ? "print"
      : "field";

  const weakest: AbeDepartment =
    candidateReviewCount > 0 ||
    (input.mostExposedInventory?.daysRemaining !== null &&
      (input.mostExposedInventory?.daysRemaining ?? 999) <= 5)
      ? "print"
      : "field";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? "print"
      : input.demoDepartment === "print"
      ? "print"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.deliveryUnlocks.length > 0 || input.readyAssets.length > 0
      ? "field"
      : "print";

  let health = "Stable overall";
  if (candidateReviewCount > 0 || queuedOrders > 1) {
    health = "Pressure is rising";
  } else if (input.readyAssets.length > 0 || input.deliveryUnlocks.length > 0) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (candidateReviewCount > 0) {
    campaignStatus = "Approval pressure is active";
  } else if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    campaignStatus = "Inventory pressure is active";
  } else if (input.deliveryUnlocks.length > 0) {
    campaignStatus = "Stable with delivery opportunity";
  }

  let whyNow =
    "Print is moving materials, but timing discipline across approvals, inventory, and delivery is what determines whether the lane stays useful.";

  if (candidateReviewCount > 0) {
    whyNow =
      "Approval drag is the immediate constraint, which means print needs faster sign-off before production timing slips further.";
  } else if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    whyNow =
      "Inventory pressure is building around the most exposed stock position, so print needs protection before field demand creates avoidable shortages.";
  } else if (input.deliveryUnlocks.length > 0) {
    whyNow =
      "Delivered and in-flight materials are unlocking downstream execution, so print should keep handoff timing tight while the lane is moving.";
  }

  const whyNowModifiers:string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Print is acting as a broader campaign constraint lane right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Print is carrying more campaign readiness than usual.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this print signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  let supportText =
    input.role === "admin"
      ? "Use Print Focus to protect timing and reinforce readiness."
      : input.role === "director"
      ? "Use Print Focus to sequence approvals and delivery cleanly."
      : "Finish the next print action cleanly and keep materials moving.";

  if (input.orgContext?.orgSupportLine) {
    supportText = `${supportText} ${input.orgContext.orgSupportLine}`;
  }

  const actions: string[] = [];

  if (candidateReviewCount > 0) {
    actions.push("Push candidate approvals faster before production timing slips.");
  }

  if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    actions.push("Protect the most exposed inventory position before field drawdown hits.");
  }

  if (input.deliveryUnlocks.length > 0 || queuedOrders > 0) {
    actions.push("Confirm delivery timing so downstream execution is not waiting on print.");
  } else {
    actions.push("Keep the next print action tight and move to the next material signal.");
  }

  if (input.orgContext?.departmentIsPressureLeader) {
    actions.push("Treat print timing like a campaign-level constraint until this lane steadies.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    actions.push("Use print readiness to support the broader campaign while this lane is carrying momentum.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next print action tight and move to the next material signal.");
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
      input.deliveryUnlocks.length > 0
        ? "PRINT delivery timing is directly shaping downstream FIELD readiness."
        : undefined,
  };
}

export default function PrintDashboardPage() {
  const [trendView, setTrendView] = useState<PrintTrendView>("inventory");

  const [printLoopMode, setPrintLoopMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("focus-1");
  const [loopResult, setLoopResult] = useState("");
  const [loopNotes, setLoopNotes] = useState("");
  const [loopMessage, setLoopMessage] = useState("");
  const [completedLoopCount, setCompletedLoopCount] = useState(0);

  const [readyAssets, setReadyAssets] = useState<PrintReadyAsset[]>([]);
  const [inventoryActions, setInventoryActions] = useState<PrintInventoryAction[]>([]);
  const [deliveryUnlocks, setDeliveryUnlocks] = useState<PrintDeliveryUnlock[]>([]);

  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("print");
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  const assetRows = useMemo<PrintAssetRow[]>(
    () => [
      {
        id: "asset-1",
        name: "Education contrast mailer",
        type: "mailer",
        status: "candidate_review",
        owner: "Maya",
        candidateApprovedDate: null,
        expectedDelivery: "2026-04-11",
        linkedTurf: "Aurora persuasion turf",
        linkedUseCase: "Education contrast mail drop",
      },
      {
        id: "asset-2",
        name: "Neighborhood door hanger v2",
        type: "door_hanger",
        status: "approved",
        owner: "Jordan",
        candidateApprovedDate: "2026-04-06",
        expectedDelivery: "2026-04-10",
        linkedTurf: "Central walk packet",
        linkedUseCase: "Door program support",
      },
      {
        id: "asset-3",
        name: "Large yard sign artwork",
        type: "yard_sign",
        status: "ordered",
        owner: "Tyler",
        candidateApprovedDate: "2026-04-05",
        expectedDelivery: "2026-04-12",
        linkedTurf: "Aurora field deployment",
        linkedUseCase: "Yard sign saturation push",
      },
      {
        id: "asset-4",
        name: "Absentee chase lit piece",
        type: "lit_piece",
        status: "design",
        owner: "Avery",
        candidateApprovedDate: null,
        expectedDelivery: null,
        linkedTurf: "Absentee chase universe",
        linkedUseCase: "Vote-by-mail persuasion",
      },
    ],
    []
  );
    const inventoryRows = useMemo<InventoryRow[]>(
    () => [
      {
        id: "inv-1",
        item: "Yard Signs",
        onHand: 420,
        reserved: 180,
        reorderAt: 150,
        region: "Aurora",
        dailyUsage: 55,
        linkedTurf: "Aurora field deployment",
        linkedUseCase: "Yard sign saturation push",
      },
      {
        id: "inv-2",
        item: "Door Hangers",
        onHand: 6800,
        reserved: 2400,
        reorderAt: 2000,
        region: "Naperville",
        dailyUsage: 320,
        linkedTurf: "Ward 4 River Block",
        linkedUseCase: "Door program support",
      },
      {
        id: "inv-3",
        item: "Mailer Stock",
        onHand: 3100,
        reserved: 2200,
        reorderAt: 1200,
        region: "Chicago",
        dailyUsage: 180,
        linkedTurf: "Chicago persuasion reserve",
        linkedUseCase: "Mailer reserve protection",
      },
      {
        id: "inv-4",
        item: "Palm Cards",
        onHand: 5400,
        reserved: 900,
        reorderAt: 1500,
        region: "Evanston",
        dailyUsage: 140,
        linkedTurf: "Central walk packet",
        linkedUseCase: "Volunteer packet support",
      },
    ],
    []
  );

  const orderRows = useMemo<PrintOrderRow[]>(
    () => [
      {
        id: "order-1",
        vendor: "Midwest Print House",
        item: "Education contrast mailer",
        quantity: 15000,
        status: "in_production",
        eta: "2026-04-11",
        linkedTurf: "Aurora persuasion turf",
        linkedUseCase: "Education contrast mail drop",
        unblocks: "Aurora persuasion mail flight",
      },
      {
        id: "order-2",
        vendor: "Great Lakes Signs",
        item: "Large yard signs",
        quantity: 250,
        status: "shipped",
        eta: "2026-04-09",
        linkedTurf: "Aurora field deployment",
        linkedUseCase: "Yard sign saturation push",
        unblocks: "Aurora sign handoff",
      },
      {
        id: "order-3",
        vendor: "City Direct Mail",
        item: "Absentee chase lit piece",
        quantity: 8000,
        status: "queued",
        eta: "2026-04-13",
        linkedTurf: "Absentee chase universe",
        linkedUseCase: "Vote-by-mail persuasion",
        unblocks: "Absentee chase rollout",
      },
      {
        id: "order-4",
        vendor: "Neighborhood Print Co.",
        item: "Door hangers v2",
        quantity: 12000,
        status: "delivered",
        eta: "2026-04-06",
        linkedTurf: "Ward 4 River Block",
        linkedUseCase: "Door program support",
        unblocks: "Weekend canvass deployment",
      },
    ],
    []
  );

  const focusQueue = useMemo<PrintFocusTask[]>(
    () => [
      {
        id: "focus-1",
        title: "Get candidate approval on education mailer",
        type: "approval",
        priority: "high",
        summary:
          "This piece is blocking production timing and should be approved or revised immediately.",
        linkedTurf: "Aurora persuasion turf",
        linkedUseCase: "Education contrast mail drop",
      },
      {
        id: "focus-2",
        title: "Reorder yard signs before Aurora drawdown",
        type: "inventory",
        priority: "high",
        summary:
          "Current yard sign burn rate suggests inventory pressure is approaching the reorder threshold.",
        linkedTurf: "Aurora field deployment",
        linkedUseCase: "Yard sign saturation push",
      },
      {
        id: "focus-3",
        title: "Confirm shipped sign delivery timing",
        type: "delivery",
        priority: "medium",
        summary:
          "Track vendor delivery window and confirm handoff timing to field operations.",
        linkedTurf: "Aurora field deployment",
        linkedUseCase: "Sign handoff to field",
      },
    ],
    []
  );

  const selectedTask = useMemo(() => {
    return focusQueue.find((item) => item.id === selectedTaskId) || null;
  }, [focusQueue, selectedTaskId]);

  const topLine = useMemo(() => {
    return {
      onHand: inventoryRows.reduce((sum, row) => sum + row.onHand, 0),
      reserved: inventoryRows.reduce((sum, row) => sum + row.reserved, 0),
      orders: orderRows.length,
      approvalsReady: assetRows.filter(
        (asset) =>
          asset.status === "approved" ||
          asset.status === "ordered" ||
          asset.status === "delivered"
      ).length,
    };
  }, [inventoryRows, orderRows, assetRows]);

  const chartData = useMemo(
    () => [
      {
        label: "Week 1",
        inventory: 14200,
        orders: 4,
        deliveries: 1,
        approvals: 2,
      },
      {
        label: "Week 2",
        inventory: 12800,
        orders: 5,
        deliveries: 2,
        approvals: 3,
      },
      {
        label: "Week 3",
        inventory: 11600,
        orders: 6,
        deliveries: 2,
        approvals: 4,
      },
      {
        label: "Week 4",
        inventory: 10400,
        orders: 7,
        deliveries: 3,
        approvals: 5,
      },
    ],
    []
  );

  const chartMax = Math.max(...chartData.map((point) => point[trendView]), 1);

  const aiSummary = useMemo(() => {
    if (demoRole === "admin") {
      return {
        headline:
          "Print operations are moving, but approvals and inventory timing need tighter control.",
        body:
          "Approvals and inventory pressure are creating drag in the print lane.",
        recommendation:
          "Push candidate approvals faster, protect sign inventory before depletion, and track delivery timing more aggressively on active orders.",
      };
    }

    if (demoRole === "director") {
      return {
        headline:
          "Your print lane is moving, but approvals and inventory timing need tighter control.",
        body:
          "Print execution is moving, but approvals and inventory need tighter control.",
        recommendation:
          "Push approvals faster, protect critical inventory, and confirm delivery timing before it causes downstream drag.",
      };
    }

    return {
      headline: "Your print lane needs clean approvals and protected inventory.",
      body:
        "Keep the next print actions tight and protect timing.",
      recommendation:
        "Push approvals, protect inventory, and confirm delivery timing on critical items.",
    };
  }, [demoRole]);

  const materialReadiness = useMemo(() => {
    return {
      readyAssetCount: readyAssets.length,
      inventoryProtectionCount: inventoryActions.length,
      deliveryUnlockCount: deliveryUnlocks.length,
    };
  }, [readyAssets.length, inventoryActions.length, deliveryUnlocks.length]);

  const mostExposedInventory = useMemo(() => {
    return inventoryRows
      .map((item) => {
        const available = item.onHand - item.reserved;
        const daysRemaining =
          item.dailyUsage && item.dailyUsage > 0
            ? Math.max(Math.floor(available / item.dailyUsage), 0)
            : null;

        return {
          ...item,
          available,
          daysRemaining,
        };
      })
      .sort((a, b) => {
        const aDays = a.daysRemaining ?? Number.MAX_SAFE_INTEGER;
        const bDays = b.daysRemaining ?? Number.MAX_SAFE_INTEGER;
        return aDays - bDays;
      })[0];
  }, [inventoryRows]);

  const printCommandSignal = useMemo(() => {
    if (readyAssets.length > 0) {
      return {
        title: "Approved assets are ready to move",
        detail: `${readyAssets.length} print-ready asset${
          readyAssets.length === 1 ? "" : "s"
        } should now be moved into production and deployment planning.`,
      };
    }

    if (deliveryUnlocks.length > 0) {
      return {
        title: "Deliveries are unlocking execution",
        detail: `${deliveryUnlocks.length} delivery unlock${
          deliveryUnlocks.length === 1 ? "" : "s"
        } should be handed to field and outreach immediately.`,
      };
    }

    if (mostExposedInventory?.daysRemaining !== null) {
      return {
        title: "Inventory protection needs attention",
        detail: `${mostExposedInventory.item} in ${mostExposedInventory.region} is the most exposed stock position right now.`,
      };
    }

    return {
      title: "Print system stable",
      detail: "No major print bottleneck is surfaced right now.",
    };
  }, [readyAssets.length, deliveryUnlocks.length, mostExposedInventory]);

  const candidateReviewCount = useMemo(() => {
    return assetRows.filter((asset) => asset.status === "candidate_review").length;
  }, [assetRows]);

  const queuedOrders = useMemo(() => {
    return orderRows.filter(
      (order) => order.status === "queued" || order.status === "in_production"
    ).length;
  }, [orderRows]);

  const printOrgLayer = useMemo(() => {
    const printUnderPressure =
      candidateReviewCount > 0 ||
      queuedOrders > 1 ||
      (mostExposedInventory?.daysRemaining !== null &&
        (mostExposedInventory?.daysRemaining ?? 999) <= 5);

    const printHasMomentum = readyAssets.length > 0 || deliveryUnlocks.length > 0;

    return buildAbeOrgLayer({
      lanes: [
        {
          department: "print",
          strongest: printHasMomentum ? "print" : "field",
          weakest: printUnderPressure ? "print" : "field",
          primaryLane: "print",
          opportunityLane: printHasMomentum ? "field" : "print",
          health: printUnderPressure
            ? "Pressure is rising"
            : printHasMomentum
            ? "Momentum building"
            : "Stable overall",
          campaignStatus: printUnderPressure
            ? "Print timing is acting like a constraint"
            : printHasMomentum
            ? "Print readiness is supporting execution"
            : "Stable overall",
          crossDomainSignal:
            deliveryUnlocks.length > 0
              ? "PRINT delivery timing is directly shaping downstream FIELD readiness."
              : undefined,
        },
        {
          department: "field",
          strongest: deliveryUnlocks.length > 0 ? "field" : "print",
          weakest: printUnderPressure ? "field" : "outreach",
          primaryLane: deliveryUnlocks.length > 0 ? "field" : "print",
          opportunityLane: readyAssets.length > 0 ? "field" : "outreach",
          health: deliveryUnlocks.length > 0 ? "Momentum building" : "Stable overall",
          campaignStatus: printUnderPressure
            ? "Field readiness depends on print timing"
            : "Stable with support",
          crossDomainSignal:
            deliveryUnlocks.length > 0
              ? "FIELD readiness is being shaped by PRINT handoff timing."
              : undefined,
        },
        {
          department: "outreach",
          strongest: readyAssets.length > 0 ? "outreach" : "print",
          weakest: printUnderPressure ? "outreach" : "finance",
          primaryLane: "outreach",
          opportunityLane: readyAssets.length > 0 ? "outreach" : "finance",
          health: readyAssets.length > 0 ? "Stable with opportunity" : "Stable overall",
          campaignStatus: readyAssets.length > 0
            ? "Print readiness can support downstream persuasion"
            : "Stable overall",
        },
      ],
    });
  }, [
    readyAssets.length,
    deliveryUnlocks.length,
    mostExposedInventory,
    candidateReviewCount,
    queuedOrders,
  ]);

  const printOrgContext = useMemo(() => {
    return getOrgContextForDepartment(printOrgLayer, "print");
  }, [printOrgLayer]);

  const printAbeBriefing = useMemo(() => {
    return getPrintAbeBriefing({
      role: demoRole,
      demoDepartment,
      assetRows,
      inventoryRows,
      orderRows,
      readyAssets,
      inventoryActions,
      deliveryUnlocks,
      mostExposedInventory,
      selectedTask,
      orgContext: printOrgContext,
    });
  }, [
    demoRole,
    demoDepartment,
    assetRows,
    inventoryRows,
    orderRows,
    readyAssets,
    inventoryActions,
    deliveryUnlocks,
    mostExposedInventory,
    selectedTask,
    printOrgContext,
  ]);

  useEffect(() => {
    setAbeMemory((current) => updateAbeMemory(current, printAbeBriefing));
  }, [
    printAbeBriefing.health,
    printAbeBriefing.campaignStatus,
    printAbeBriefing.primaryLane,
    printAbeBriefing.strongest,
    printAbeBriefing.weakest,
    printAbeBriefing.opportunityLane,
    printAbeBriefing.crossDomainSignal,
  ]);

  const printPatternWatch = useMemo(() => {
    const patterns = buildAbePatternInsights({
      role: demoRole,
      demoDepartment: "print",
      briefing: printAbeBriefing,
      memory: abeMemory,
    });

    return filterPatternsForDepartment(patterns, "print");
  }, [demoRole, printAbeBriefing, abeMemory]);
    const printAbeInsight = useMemo(() => {
    if (printPatternWatch.length > 0) {
      return printPatternWatch[0].detail;
    }

    return printAbeBriefing.whyNow;
  }, [printPatternWatch, printAbeBriefing.whyNow]);

  const selectedPrintPatternHint = useMemo(() => {
    if (!selectedTask) return null;

    if (selectedTask.type === "approval") {
      return "Pattern: approval drag is repeating and blocking production timing.";
    }

    if (selectedTask.type === "inventory") {
      return "Pattern: inventory protection pressure is building around exposed stock.";
    }

    return "Pattern: delivery timing is shaping downstream readiness and needs tight coordination.";
  }, [selectedTask]);

  function getPrintRecommendation(task: PrintFocusTask | null) {
    if (!task) return "Select a print priority to begin execution.";

    if (task.type === "approval") {
      return "Secure approval immediately so production timing does not slip.";
    }

    if (task.type === "inventory") {
      return "Protect inventory now before field demand creates a shortage.";
    }

    return "Confirm delivery timing and handoff so operations are not waiting on materials.";
  }

  function moveToNextPrintTask() {
    const currentIndex = focusQueue.findIndex((item) => item.id === selectedTaskId);
    const nextTask = currentIndex >= 0 ? focusQueue[currentIndex + 1] : null;

    if (nextTask) {
      setTimeout(() => {
        setSelectedTaskId(nextTask.id);
      }, 150);
    }
  }

  function savePrintLoop() {
    if (!selectedTask) {
      setLoopMessage("Select a print priority first.");
      return;
    }

    if (!loopResult.trim()) {
      setLoopMessage("Choose an execution result before saving.");
      return;
    }

    if (selectedTask.type === "approval" && loopResult === "completed") {
      const nextReadyAsset: PrintReadyAsset = {
        id: `ready-asset-${Date.now()}`,
        assetName: selectedTask.title,
        status: "approved",
        linkedTurf: selectedTask.linkedTurf,
        linkedUseCase: selectedTask.linkedUseCase,
        updatedAt: new Date().toLocaleString(),
      };

      setReadyAssets((current) => [nextReadyAsset, ...current]);
    }

    if (selectedTask.type === "inventory" && loopResult === "completed") {
      const nextInventoryAction: PrintInventoryAction = {
        id: `inventory-action-${Date.now()}`,
        item: selectedTask.title,
        amount: 500,
        region: selectedTask.linkedTurf || "Active region",
        linkedTurf: selectedTask.linkedTurf,
        linkedUseCase: selectedTask.linkedUseCase,
        updatedAt: new Date().toLocaleString(),
      };

      setInventoryActions((current) => [nextInventoryAction, ...current]);
    }

    if (selectedTask.type === "delivery" && loopResult === "completed") {
      const nextDeliveryUnlock: PrintDeliveryUnlock = {
        id: `delivery-unlock-${Date.now()}`,
        item: selectedTask.title,
        vendor: "Tracked Vendor",
        eta: new Date().toLocaleDateString(),
        linkedTurf: selectedTask.linkedTurf,
        linkedUseCase: selectedTask.linkedUseCase,
        updatedAt: new Date().toLocaleString(),
      };

      setDeliveryUnlocks((current) => [nextDeliveryUnlock, ...current]);
    }

    const nextActionMessage =
      loopResult === "completed"
        ? "Priority completed. Move immediately to the next print action."
        : loopResult === "adjusted"
        ? "Adjustment logged. Monitor the print lane closely and continue execution."
        : "Needs follow-up. Keep this item active while continuing to protect timing.";

    setCompletedLoopCount((value) => value + 1);
    setLoopMessage(`Saved successfully. ${nextActionMessage}`);
    setLoopResult("");
    setLoopNotes("");

    moveToNextPrintTask();
  }

  const visibleStats = useMemo(() => {
    const allStats = [
      {
        id: "onHand",
        label: "Inventory On Hand",
        value: topLine.onHand.toLocaleString(),
      },
      {
        id: "reserved",
        label: "Reserved",
        value: topLine.reserved.toLocaleString(),
      },
      {
        id: "orders",
        label: "Active Orders",
        value: String(topLine.orders),
      },
      {
        id: "approvalsReady",
        label: "Assets Ready / Moving",
        value: String(topLine.approvalsReady),
      },
    ];

    if (demoRole === "admin") return allStats;
    if (demoRole === "director") return allStats.slice(0, 3);

    return allStats.filter(
      (item) => item.id === "orders" || item.id === "approvalsReady"
    );
  }, [topLine, demoRole]);

  const visibleAssetRows = useMemo(() => {
    if (demoRole === "admin") {
      return assetRows;
    }

    if (demoRole === "director") {
      return assetRows.slice(0, 3);
    }

    return assetRows.slice(0, 2);
  }, [assetRows, demoRole]);

  const visibleInventoryRows = useMemo(() => {
    if (demoRole === "admin") {
      return inventoryRows;
    }

    if (demoRole === "director") {
      return inventoryRows.slice(0, 3);
    }

    return inventoryRows.slice(0, 2);
  }, [inventoryRows, demoRole]);

  const visibleOrderRows = useMemo(() => {
    if (demoRole === "admin") {
      return orderRows;
    }

    if (demoRole === "director") {
      return orderRows.slice(0, 3);
    }

    return orderRows.slice(0, 2);
  }, [orderRows, demoRole]);

  const visibleFocusQueue = useMemo(() => {
    if (demoRole === "admin") {
      return focusQueue;
    }

    if (demoRole === "director") {
      return focusQueue.slice(0, 2);
    }

    return focusQueue.slice(0, 1);
  }, [focusQueue, demoRole]);

  const visibleMaterialReadiness = useMemo(() => {
    if (demoRole === "admin") {
      return {
        show:
          readyAssets.length > 0 ||
          inventoryActions.length > 0 ||
          deliveryUnlocks.length > 0,
        readyAssets,
        inventoryActions,
        deliveryUnlocks,
      };
    }

    if (demoRole === "director") {
      return {
        show:
          readyAssets.length > 0 ||
          inventoryActions.length > 0 ||
          deliveryUnlocks.length > 0,
        readyAssets: readyAssets.slice(0, 2),
        inventoryActions: inventoryActions.slice(0, 2),
        deliveryUnlocks: deliveryUnlocks.slice(0, 2),
      };
    }

    return {
      show: false,
      readyAssets: [] as PrintReadyAsset[],
      inventoryActions: [] as PrintInventoryAction[],
      deliveryUnlocks: [] as PrintDeliveryUnlock[],
    };
  }, [readyAssets, inventoryActions, deliveryUnlocks, demoRole]);

  const perspectiveHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Print Command Center";
    }

    if (demoRole === "director") {
      return "Print Director View";
    }

    return "Print Work Lane";
  }, [demoRole]);

  const perspectiveSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Track inventory, asset approvals, order status, delivery timing, and print execution from one focused operations surface.";
    }

    if (demoRole === "director") {
      return "Lead the print lane with tighter visibility into approvals, inventory protection, delivery timing, and deployment readiness.";
    }

    return "Stay focused on the immediate print work that keeps materials moving without carrying the full department surface.";
  }, [demoRole]);

  const focusButtonLabel = useMemo(() => {
    if (demoRole === "general_user") {
      return "Start Work";
    }

    if (demoRole === "director") {
      return "Run Print Lane";
    }

    return "Open Focus Mode";
  }, [demoRole]);

  const loopButtonLabel = useMemo(() => {
    if (printLoopMode) {
      return demoRole === "general_user" ? "Exit Work Mode" : "Print Loop On";
    }

    if (demoRole === "general_user") {
      return "Start Work Mode";
    }

    return "Enable Print Loop";
  }, [printLoopMode, demoRole]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Printer className="h-4 w-4" />
              Print + asset operations center
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
              href="/dashboard/print/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              {focusButtonLabel}
            </Link>

            <button
              type="button"
              onClick={() => setPrintLoopMode((prev) => !prev)}
              className={
                printLoopMode
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
          This print surface narrows around who is using Aether and how much of
          the material lane they should see.
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
                  {printAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Strongest:</span>{" "}
                  {departmentLabel(printAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Weakest:</span>{" "}
                  {departmentLabel(printAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Status:</span>{" "}
                  {printAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-amber-900">
                {printAbeBriefing.primaryLane === "print"
                  ? "Print is the lane that needs protected timing right now."
                  : `${departmentLabel(
                      printAbeBriefing.primaryLane
                    )} is shaping what print should do next.`}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-base">
                {aiSummary.body}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600">
                Why now: {printAbeInsight}
              </p>

              {printAbeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-amber-900/80">
                  {printAbeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600">
                {printAbeBriefing.supportText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3">
            {printAbeBriefing.actions.map((move, index) => (
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

        {printPatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Pattern Watch
            </p>

            <div className="mt-3 space-y-3">
              {printPatternWatch.map((insight, index) => (
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
            {printLoopMode ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div
            className={`mb-6 grid gap-4 ${
              demoRole === "general_user" ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Print Loop Progress
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
                  Highest Priority Print Task
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {visibleFocusQueue[0]?.title || "No priority available"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {visibleFocusQueue[0]?.summary ||
                    "System recommends immediate print action."}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500">
                  Print Loop Queue
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {demoRole === "general_user"
                    ? "Active Print Work"
                    : "Approval + Inventory Execution"}
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
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {item.summary}
                        </p>
                        {item.id === selectedTaskId &&
                        selectedPrintPatternHint ? (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            {selectedPrintPatternHint}
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
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${focusTypeTone(
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              {selectedTask ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Aether Recommendation
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {getPrintRecommendation(selectedTask)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Save the execution decision and move immediately to the next
                    print priority.
                  </p>
                  {selectedPrintPatternHint ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      {selectedPrintPatternHint}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {demoRole === "general_user"
                    ? "Print Work"
                    : "Print Execution"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {demoRole === "general_user"
                    ? "Record the result and keep the next print action moving."
                    : "Record the result, reinforce the next move, and keep timing tight."}
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
                  placeholder="Print notes..."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />

                <button
                  type="button"
                  onClick={savePrintLoop}
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
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {visibleMaterialReadiness.show ? (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">
                Material Readiness
              </p>
              <h2 className="text-xl font-semibold text-indigo-950">
                Print → Deployment Outputs
              </h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-800">
              {visibleMaterialReadiness.readyAssets.length} ready asset
              {visibleMaterialReadiness.readyAssets.length === 1 ? "" : "s"} •{" "}
              {visibleMaterialReadiness.inventoryActions.length} inventory action
              {visibleMaterialReadiness.inventoryActions.length === 1 ? "" : "s"} •{" "}
              {visibleMaterialReadiness.deliveryUnlocks.length} delivery unlock
              {visibleMaterialReadiness.deliveryUnlocks.length === 1 ? "" : "s"}
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              demoRole === "director" ? "lg:grid-cols-2" : "lg:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Ready Assets
              </p>
              <div className="mt-3 space-y-3">
                {visibleMaterialReadiness.readyAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {asset.assetName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {asset.linkedTurf} • {asset.linkedUseCase}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Inventory Actions
              </p>
              <div className="mt-3 space-y-3">
                {visibleMaterialReadiness.inventoryActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {action.item} · {action.amount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {action.region}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {demoRole === "admin" ? (
              <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Delivery Unlocks
                </p>
                <div className="mt-3 space-y-3">
                  {visibleMaterialReadiness.deliveryUnlocks.map((unlock) => (
                    <div
                      key={unlock.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-medium text-slate-900">
                        {unlock.item}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {unlock.vendor} • {unlock.eta}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Asset Pipeline
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Design → Approval → Production
              </h2>
            </div>

            <Boxes className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
            {visibleAssetRows.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {asset.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Owner: {asset.owner}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${assetStatusTone(
                      asset.status
                    )}`}
                  >
                    {asset.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Orders
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Production + Delivery
              </h2>
            </div>

            <Truck className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
            {visibleOrderRows.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {order.item}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.vendor}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${orderStatusTone(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
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
              Inventory
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Stock + Exposure
            </h2>
          </div>

          <ClipboardCheck className="h-5 w-5 text-slate-500" />
        </div>

        <div className="space-y-4">
          {visibleInventoryRows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">{row.item}</p>
              <p className="mt-1 text-sm text-slate-500">
                On hand: {row.onHand} • Reserved: {row.reserved}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}