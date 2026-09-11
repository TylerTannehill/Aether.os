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
import { buildPrintBriefing } from "@/lib/abe/interpreters/print";
import { printAbeReady as isPrintAbeReady } from "@/lib/abe/readiness";
import { getOrgContextTheme } from "@/lib/org-context-theme";
import {
  getPrintMetricRows,
  type PrintMetricRow,
} from "@/lib/data/print";
import { getLists } from "@/lib/data/lists";
import { CampaignList } from "@/lib/data/types";
import {
  getDashboardStateTone,
  getDashboardStateTextTone,
  getDepartmentHealthState,
} from "@/lib/intelligence/dashboard-tones";

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
type AetherTier = "t1" | "t2" | "t3";


function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

type OperationalPrintTag =
  | "print"
  | "field"
  | "walk"
  | "turf"
  | "persuasion"
  | "turnout"
  | "lit-drop"
  | "mail"
  | "door-hanger"
  | "volunteer"
  | "high-priority";

type OperationalPrintUniverse = CampaignList & {
  operationalTags: OperationalPrintTag[];
  routeLabel: string;
  useCase: string;
};

function normalizeListText(list: CampaignList | string) {
  return typeof list === "string"
    ? list.toLowerCase()
    : `${list.name || ""} ${list.type || ""}`.toLowerCase();
}

function isContactCleanupList(list: CampaignList) {
  const normalizedName = (list.name || "").toLowerCase();

  return (
    normalizedName.includes("missing email") ||
    normalizedName.includes("missing phone") ||
    normalizedName.includes("missing address") ||
    normalizedName.includes("missing data") ||
    normalizedName.includes("cleanup") ||
    normalizedName.includes("clean up") ||
    normalizedName.includes("data hygiene") ||
    normalizedName.includes("hygiene")
  );
}

function hasPhysicalPrintSignal(list: CampaignList) {
  const normalizedName = (list.name || "").toLowerCase();
  const normalizedType = String(list.type || "").toLowerCase();

  if (isContactCleanupList(list)) return false;

  return (
    normalizedType === "print" ||
    normalizedName.includes("print") ||
    normalizedName.includes("literature") ||
    normalizedName.includes("lit drop") ||
    normalizedName.includes("lit-drop") ||
    normalizedName.includes("palm card") ||
    normalizedName.includes("palmcard") ||
    normalizedName.includes("door hanger") ||
    normalizedName.includes("door-hanger") ||
    normalizedName.includes("doorhanger") ||
    normalizedName.includes("yard sign") ||
    normalizedName.includes("yardsign") ||
    normalizedName.includes("mailer") ||
    normalizedName.includes("direct mail") ||
    normalizedName.includes("mail piece") ||
    normalizedName.includes("postcard") ||
    normalizedName.includes("absentee chase") ||
    normalizedName.includes("walk packet")
  );
}

function uniqueTags(tags: OperationalPrintTag[]) {
  return Array.from(new Set(tags));
}

function resolveOperationalPrintTags(list: CampaignList): OperationalPrintTag[] {
  if (isContactCleanupList(list) || !hasPhysicalPrintSignal(list)) {
    return [];
  }

  const normalized = normalizeListText(list);
  const normalizedName = (list.name || "").toLowerCase();
  const tags: OperationalPrintTag[] = [];

  tags.push("print");

  if (normalized.includes("field")) tags.push("field");
  if (normalizedName.includes("walk packet")) tags.push("walk");
  if (normalized.includes("turf") || normalized.includes("canvass")) tags.push("turf");
  if (normalized.includes("persuasion")) tags.push("persuasion");
  if (normalized.includes("turnout")) tags.push("turnout");
  if (normalized.includes("volunteer")) tags.push("volunteer");
  if (normalized.includes("priority") || normalized.includes("high value")) tags.push("high-priority");
  if (
    normalizedName.includes("literature") ||
    normalizedName.includes("lit-drop") ||
    normalizedName.includes("lit drop") ||
    normalizedName.includes("palm card") ||
    normalizedName.includes("palmcard")
  ) {
    tags.push("lit-drop");
  }
  if (
    normalizedName.includes("mailer") ||
    normalizedName.includes("direct mail") ||
    normalizedName.includes("mail piece") ||
    normalizedName.includes("postcard") ||
    normalizedName.includes("absentee chase")
  ) {
    tags.push("mail");
  }
  if (
    normalizedName.includes("door hanger") ||
    normalizedName.includes("door-hanger") ||
    normalizedName.includes("doorhanger")
  ) {
    tags.push("door-hanger");
  }

  return uniqueTags(tags);
}

function isPrintOperationalUniverse(list: CampaignList) {
  return hasPhysicalPrintSignal(list);
}

function buildOperationalPrintUniverse(list: CampaignList): OperationalPrintUniverse {
  const tags = resolveOperationalPrintTags(list);

  let routeLabel = "Print";
  if (tags.includes("field") || tags.includes("walk") || tags.includes("turf")) {
    routeLabel = "Print + Field";
  }

  let useCase = "Print universe";
  if (tags.includes("lit-drop")) useCase = "Literature drop";
  else if (tags.includes("door-hanger")) useCase = "Door hanger route";
  else if (tags.includes("mail")) useCase = "Mail universe";
  else if (tags.includes("walk")) useCase = "Walk packet materials";

  return {
    ...list,
    operationalTags: tags.length > 0 ? tags : ["print"],
    routeLabel,
    useCase,
  };
}

function inferPrintAssetType(universe: OperationalPrintUniverse): PrintAssetRow["type"] {
  if (universe.operationalTags.includes("door-hanger")) return "door_hanger";
  if (universe.operationalTags.includes("mail")) return "mailer";
  if (universe.operationalTags.includes("walk")) return "lit_piece";
  if (universe.operationalTags.includes("lit-drop")) return "lit_piece";
  return "lit_piece";
}

function buildAssetRowsFromOperationalLists(lists: OperationalPrintUniverse[]): PrintAssetRow[] {
  return lists.map((list) => ({
    id: `operational-asset-${list.id}`,
    name: `${list.name} assets`,
    type: inferPrintAssetType(list),
    status: "candidate_review",
    owner: list.default_owner_name || "Unassigned",
    candidateApprovedDate: null,
    expectedDelivery: null,
    linkedTurf: list.name,
    linkedUseCase: list.useCase,
  }));
}

function buildInventoryRowsFromOperationalLists(lists: OperationalPrintUniverse[]): InventoryRow[] {
  return lists.map((list, index) => ({
    id: `operational-inventory-${list.id}`,
    item: `${list.name} materials`,
    onHand: 500 + index * 125,
    reserved: 250 + index * 75,
    reorderAt: 200,
    region: list.routeLabel,
    dailyUsage: 75,
    linkedTurf: list.name,
    linkedUseCase: list.useCase,
  }));
}

function buildOrderRowsFromOperationalLists(lists: OperationalPrintUniverse[]): PrintOrderRow[] {
  return lists.map((list) => ({
    id: `operational-order-${list.id}`,
    vendor: "Pending vendor",
    item: `${list.name} production run`,
    quantity: 500,
    status: "queued",
    eta: null,
    linkedTurf: list.name,
    linkedUseCase: list.useCase,
    unblocks: list.routeLabel,
  }));
}

function normalizePrintType(value?: string | null): PrintAssetRow["type"] {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "mailer") return "mailer";
  if (normalized === "door_hanger" || normalized === "door hanger") {
    return "door_hanger";
  }
  if (normalized === "yard_sign" || normalized === "yard sign") {
    return "yard_sign";
  }
  if (normalized === "lit_piece" || normalized === "lit piece") {
    return "lit_piece";
  }
  if (normalized === "digital_asset" || normalized === "digital asset") {
    return "digital_asset";
  }

  return "lit_piece";
}

function normalizeAssetStatus(value?: string | null): PrintAssetRow["status"] {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "design") return "design";
  if (
    normalized === "candidate_review" ||
    normalized === "candidate review" ||
    normalized === "review"
  ) {
    return "candidate_review";
  }
  if (normalized === "approved") return "approved";
  if (normalized === "ordered") return "ordered";
  if (normalized === "delivered") return "delivered";

  return "design";
}

function normalizeOrderStatus(value?: string | null): PrintOrderRow["status"] {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "queued") return "queued";
  if (normalized === "in_production" || normalized === "in production") {
    return "in_production";
  }
  if (normalized === "shipped") return "shipped";
  if (normalized === "delivered") return "delivered";

  return "queued";
}

function buildAssetRowsFromMetrics(rows: PrintMetricRow[]): PrintAssetRow[] {
  return rows
    .filter((row) => {
      const status = normalizeAssetStatus(row.status);
      return (
        status === "design" ||
        status === "candidate_review" ||
        status === "approved" ||
        status === "ordered" ||
        status === "delivered"
      );
    })
    .map((row) => {
      const status = normalizeAssetStatus(row.status);

      return {
        id: String(row.id),
        name: row.item_name || "Unnamed Print Asset",
        type: normalizePrintType(row.item_type),
        status,
        owner: row.vendor || "Unassigned",
        candidateApprovedDate:
          status === "approved" || status === "ordered" || status === "delivered"
            ? row.created_at || null
            : null,
        expectedDelivery: row.expected_delivery || null,
      };
    });
}

function buildInventoryRowsFromMetrics(rows: PrintMetricRow[]): InventoryRow[] {
  return rows
    .filter((row) => toNumber(row.on_hand) > 0 || toNumber(row.reserved) > 0)
    .map((row) => ({
      id: String(row.id),
      item: row.item_name || "Unnamed Print Item",
      onHand: toNumber(row.on_hand),
      reserved: toNumber(row.reserved),
      reorderAt: toNumber(row.reorder_at),
      region: row.vendor || "Unassigned",
      dailyUsage: undefined,
    }));
}

function buildOrderRowsFromMetrics(rows: PrintMetricRow[]): PrintOrderRow[] {
  return rows
    .filter((row) => {
      const status = normalizeOrderStatus(row.status);
      return Boolean(row.vendor) || status !== "queued" || Boolean(row.expected_delivery);
    })
    .map((row) => ({
      id: String(row.id),
      vendor: row.vendor || "Unassigned Vendor",
      item: row.item_name || "Unnamed Print Order",
      quantity: Math.max(toNumber(row.reserved), toNumber(row.on_hand), 0),
      status: normalizeOrderStatus(row.status),
      eta: row.expected_delivery || null,
    }));
}

function buildPrintFocusQueue(input: {
  assetRows: PrintAssetRow[];
  inventoryRows: InventoryRow[];
  orderRows: PrintOrderRow[];
}): PrintFocusTask[] {
  const tasks: PrintFocusTask[] = [];

  const approvalBlock = input.assetRows.find(
    (asset) => asset.status === "candidate_review" || asset.status === "design"
  );

  const exposedInventory = input.inventoryRows
    .map((row) => ({
      ...row,
      available: row.onHand - row.reserved,
    }))
    .sort((a, b) => a.available - b.available)[0];

  const activeOrder = input.orderRows.find(
    (order) => order.status === "queued" || order.status === "in_production" || order.status === "shipped"
  );

  if (approvalBlock) {
    tasks.push({
      id: `focus-approval-${approvalBlock.id}`,
      title: `Review approval for ${approvalBlock.name}`,
      type: "approval",
      priority: approvalBlock.status === "candidate_review" ? "high" : "medium",
      summary: `${approvalBlock.name} is still in ${approvalBlock.status.replace("_", " ")} and may be blocking production timing.`,
      linkedTurf: approvalBlock.linkedTurf,
      linkedUseCase: approvalBlock.linkedUseCase,
    });
  }

  if (exposedInventory && exposedInventory.available <= exposedInventory.reorderAt) {
    tasks.push({
      id: `focus-inventory-${exposedInventory.id}`,
      title: `Protect ${exposedInventory.item} inventory`,
      type: "inventory",
      priority: "high",
      summary: `${exposedInventory.item} is at or below reorder pressure based on current on-hand and reserved counts.`,
      linkedTurf: exposedInventory.linkedTurf,
      linkedUseCase: exposedInventory.linkedUseCase,
    });
  }

  if (activeOrder) {
    tasks.push({
      id: `focus-delivery-${activeOrder.id}`,
      title: `Confirm delivery for ${activeOrder.item}`,
      type: "delivery",
      priority: activeOrder.status === "shipped" ? "medium" : "high",
      summary: `${activeOrder.item} is currently ${activeOrder.status.replace("_", " ")} and should be tracked through delivery.`,
      linkedTurf: activeOrder.linkedTurf,
      linkedUseCase: activeOrder.linkedUseCase,
    });
  }

  return tasks.slice(0, 3);
}

function buildPrintChartData(rows: PrintMetricRow[]) {
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
      inventory: toNumber(row.on_hand),
      orders: normalizeOrderStatus(row.status) === "queued" ||
        normalizeOrderStatus(row.status) === "in_production" ||
        normalizeOrderStatus(row.status) === "shipped"
          ? 1
          : 0,
      deliveries: normalizeOrderStatus(row.status) === "delivered" ? 1 : 0,
      approvals:
        normalizeAssetStatus(row.status) === "approved" ||
        normalizeAssetStatus(row.status) === "ordered" ||
        normalizeAssetStatus(row.status) === "delivered"
          ? 1
          : 0,
    }));
}

function getPrintStatState(input: {
  id: string;
  onHand: number;
  reserved: number;
  orders: number;
  approvalsReady: number;
}) {
  if (input.id === "reserved") {
    return getDepartmentHealthState({
      pressure: input.reserved,
      opportunity: input.onHand,
    });
  }

  if (input.id === "orders") {
    return getDepartmentHealthState({
      pressure: input.orders,
      opportunity: input.approvalsReady,
    });
  }

  if (input.id === "approvalsReady") {
    return getDepartmentHealthState({
      pressure: input.orders,
      opportunity: input.approvalsReady,
    });
  }

  return getDepartmentHealthState({
    pressure: input.onHand > 0 ? 1 : 2,
    opportunity: input.onHand,
  });
}


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

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";

  return "t3";
}

function canShowDepartmentAbe(tier: AetherTier) {
  return tier === "t3";
}

export default function PrintDashboardPage() {
  const [trendView, setTrendView] = useState<PrintTrendView>("inventory");
  const [printMetricRows, setPrintMetricRows] = useState<PrintMetricRow[]>([]);
  const [printLoading, setPrintLoading] = useState(true);
  const [operationalLists, setOperationalLists] = useState<CampaignList[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [printLoopMode, setPrintLoopMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
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
  const [contextMode, setContextMode] = useState("default");
  const [aetherTier, setAetherTier] = useState<AetherTier>("t3");
  const [isDemoOrg, setIsDemoOrg] = useState(false);
  const [abeMemory, setAbeMemory] = useState<AbeGlobalMemory>({
    recentPrimaryLanes: [],
    recentPressureLanes: [],
    recentOpportunityLanes: [],
    recentCrossDomainSignals: [],
  });

  useEffect(() => {
    async function loadOrgContext() {
      try {
        const response = await fetch("/api/auth/current-context");

        if (!response.ok) return;

        const data = await response.json();

        setContextMode(
          data?.organization?.context_mode || "default"
        );

        setAetherTier(
          normalizeAetherTier(data?.organization?.aether_tier)
        );
        setIsDemoOrg(data?.isDemoOrg === true);
      } catch (error) {
        console.error("Failed to load org context", error);
      }
    }

    loadOrgContext();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPrintRows() {
      try {
        setPrintLoading(true);
        const rows = await getPrintMetricRows();

        if (!mounted) return;

        setPrintMetricRows(rows);
      } catch (error) {
        console.error("Failed to load print page metrics:", error);

        if (!mounted) return;

        setPrintMetricRows([]);
      } finally {
        if (mounted) {
          setPrintLoading(false);
        }
      }
    }

    loadPrintRows();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadOperationalLists() {
      try {
        setListLoading(true);
        const lists = await getLists();

        if (!mounted) return;

        setOperationalLists(lists);
      } catch (error) {
        console.error("Failed to load operational print lists:", error);

        if (!mounted) return;

        setOperationalLists([]);
      } finally {
        if (mounted) {
          setListLoading(false);
        }
      }
    }

    loadOperationalLists();

    return () => {
      mounted = false;
    };
  }, []);

  const operationalPrintUniverses = useMemo<OperationalPrintUniverse[]>(() => {
    return operationalLists
      .filter(isPrintOperationalUniverse)
      .map(buildOperationalPrintUniverse);
  }, [operationalLists]);

  const assetRows = useMemo<PrintAssetRow[]>(() => {
    return [
      ...buildAssetRowsFromOperationalLists(operationalPrintUniverses),
      ...buildAssetRowsFromMetrics(printMetricRows),
    ];
  }, [operationalPrintUniverses, printMetricRows]);

  const inventoryRows = useMemo<InventoryRow[]>(() => {
    return [
      ...buildInventoryRowsFromOperationalLists(operationalPrintUniverses),
      ...buildInventoryRowsFromMetrics(printMetricRows),
    ];
  }, [operationalPrintUniverses, printMetricRows]);

  const orderRows = useMemo<PrintOrderRow[]>(() => {
    return [
      ...buildOrderRowsFromOperationalLists(operationalPrintUniverses),
      ...buildOrderRowsFromMetrics(printMetricRows),
    ];
  }, [operationalPrintUniverses, printMetricRows]);

  const focusQueue = useMemo<PrintFocusTask[]>(() => {
    return buildPrintFocusQueue({
      assetRows,
      inventoryRows,
      orderRows,
    });
  }, [assetRows, inventoryRows, orderRows]);

  const selectedTask = useMemo(() => {
    return (
      focusQueue.find((item) => item.id === selectedTaskId) ||
      focusQueue[0] ||
      null
    );
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

  const chartData = useMemo(() => {
    return buildPrintChartData(printMetricRows);
  }, [printMetricRows]);

  const chartMax = Math.max(...chartData.map((point) => point[trendView]), 1);

  const aiSummary = useMemo(() => {
    if (!printMetricRows.length && operationalPrintUniverses.length === 0) {
      return {
        headline: "No print metrics or operational print universes are connected yet.",
        body: "Print will stay quiet until asset, inventory, order, or list-routing data is available for this campaign.",
        recommendation:
          "Upload print metrics or seed a print/literature/drop universe through ingestion to activate this lane.",
      };
    }

    if (operationalPrintUniverses.length > 0 && !printMetricRows.length) {
      const firstUniverse = operationalPrintUniverses[0];

      return {
        headline: `${firstUniverse.name} is ready for print orchestration.`,
        body: `${operationalPrintUniverses.length} operational print universe${
          operationalPrintUniverses.length === 1 ? "" : "s"
        } are now feeding the main print page from Lists.`,
        recommendation:
          focusQueue[0]?.summary ||
          "Open Print Focus and move the first approval, inventory, or delivery action forward.",
      };
    }

    const approvalBlock = assetRows.find(
      (asset) => asset.status === "candidate_review" || asset.status === "design"
    );

    const exposedInventory = inventoryRows
      .map((row) => ({
        ...row,
        available: row.onHand - row.reserved,
      }))
      .sort((a, b) => a.available - b.available)[0];

    return {
      headline: approvalBlock
        ? `${approvalBlock.name} is the clearest print approval pressure.`
        : "Print activity is available for review.",
      body: approvalBlock
        ? `${approvalBlock.name} is still in ${approvalBlock.status.replace("_", " ")}.`
        : exposedInventory
        ? `${exposedInventory.item} is the most exposed inventory position.`
        : "Uploaded print metrics are available for review.",
      recommendation:
        focusQueue[0]?.summary ||
        "Review the uploaded print metrics and decide the next material move.",
    };
  }, [printMetricRows.length, operationalPrintUniverses, assetRows, inventoryRows, focusQueue]);

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

    if (!mostExposedInventory) {
      return {
        title: "No inventory pressure detected",
        detail:
          "No live inventory metrics are available for print operations yet.",
      };
    }

    if (mostExposedInventory.daysRemaining !== null) {
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
    return buildPrintBriefing({
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
        tone: `${getDashboardStateTone(
          getPrintStatState({
            id: "onHand",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )} ${getDashboardStateTextTone(
          getPrintStatState({
            id: "onHand",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )}`,
      },
      {
        id: "reserved",
        label: "Reserved",
        value: topLine.reserved.toLocaleString(),
        tone: `${getDashboardStateTone(
          getPrintStatState({
            id: "reserved",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )} ${getDashboardStateTextTone(
          getPrintStatState({
            id: "reserved",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )}`,
      },
      {
        id: "orders",
        label: "Active Orders",
        value: String(topLine.orders),
        tone: `${getDashboardStateTone(
          getPrintStatState({
            id: "orders",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )} ${getDashboardStateTextTone(
          getPrintStatState({
            id: "orders",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )}`,
      },
      {
        id: "approvalsReady",
        label: "Assets Ready / Moving",
        value: String(topLine.approvalsReady),
        tone: `${getDashboardStateTone(
          getPrintStatState({
            id: "approvalsReady",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )} ${getDashboardStateTextTone(
          getPrintStatState({
            id: "approvalsReady",
            onHand: topLine.onHand,
            reserved: topLine.reserved,
            orders: topLine.orders,
            approvalsReady: topLine.approvalsReady,
          })
        )}`,
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

  const showDepartmentAbe = canShowDepartmentAbe(aetherTier);

  const printAbeReady = isPrintAbeReady({
    loading: printLoading || listLoading,
    orgContext: printOrgContext,
  });

  const orgTheme = getOrgContextTheme(contextMode);

  if (printLoading || listLoading) {
    return (
      <div className="space-y-6 lg:space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <p className="text-slate-600">Preparing print operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-6">
      <section
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-6 ${orgTheme.heroGradient} lg:rounded-2xl lg:p-[18px]`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <Printer className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Print + asset operations center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-3xl lg:text-2xl">
                {perspectiveHeadline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-sm lg:text-[11px]">
                {perspectiveSubheadline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/dashboard/print/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Zap className="h-4 w-4 text-slate-950 lg:h-3.5 lg:w-3.5" />
              <span className="text-slate-950">{focusButtonLabel}</span>
            </Link>
          </div>
        </div>
      </section>

      {isDemoOrg && (<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr] lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:text-[9px]">
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
                  } lg:px-2.5 lg:text-[9px]`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:text-[9px]">
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
                  } lg:px-2.5 lg:text-[9px]`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 lg:rounded-xl lg:p-3 lg:mt-4 lg:text-[11px]">
          <span className="font-medium text-slate-900">
            {getRoleLabel(demoRole)}:
          </span>{" "}
          This print surface narrows around who is using Aether and how much of
          the material lane they should see.
        </div>
      </section>)}

      {showDepartmentAbe && printAbeReady ? (
      <section className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-fuchsia-800 lg:text-[11px]">
              <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Honest Abe
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-fuchsia-700/80 lg:text-[11px]">
                {getRoleLabel(demoRole)}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-fuchsia-900 lg:gap-3 lg:text-[11px]">
                <div>
                  <span className="font-medium text-fuchsia-700">Health:</span>{" "}
                  {printAbeBriefing.health}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Strongest:</span>{" "}
                  {departmentLabel(printAbeBriefing.strongest)}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Weakest:</span>{" "}
                  {departmentLabel(printAbeBriefing.weakest)}
                </div>
                <div>
                  <span className="font-medium text-fuchsia-700">Status:</span>{" "}
                  {printAbeBriefing.campaignStatus}
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-fuchsia-900 lg:text-xl">
                {printAbeBriefing.primaryLane === "print"
                  ? "Print is the lane that needs protected timing right now."
                  : `${departmentLabel(
                      printAbeBriefing.primaryLane
                    )} is shaping what print should do next.`}
              </h2>

              <p className="max-w-3xl text-sm text-slate-700 lg:text-sm lg:text-[11px]">
                {aiSummary.body}
              </p>

              <p className="max-w-3xl text-sm italic text-slate-600 lg:text-[11px]">
                Why now: {printAbeInsight}
              </p>

              {printAbeBriefing.crossDomainSignal ? (
                <p className="max-w-3xl text-sm text-fuchsia-900/80 lg:text-[11px]">
                  {printAbeBriefing.crossDomainSignal}
                </p>
              ) : null}

              <p className="max-w-3xl text-sm text-slate-600 lg:text-[11px]">
                {printAbeBriefing.supportText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5 lg:rounded-xl lg:p-4 lg:mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700 lg:text-[9px]">
            What Abe Would Do
          </p>

          <div className="mt-3 space-y-3 lg:space-y-2 lg:mt-2">
            {printAbeBriefing.actions.map((move, index) => (
              <div
                key={`${move}-${index}`}
                className="flex items-start gap-3 text-sm text-slate-700 lg:gap-2 lg:text-[11px]"
              >
                <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-fuchsia-200 bg-fuchsia-100 text-xs font-semibold text-fuchsia-800 lg:text-[9px]">
                  {index + 1}
                </div>
                <p>{move}</p>
              </div>
            ))}
          </div>
        </div>

        {printPatternWatch.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5 lg:rounded-xl lg:p-4 lg:mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700 lg:text-[9px]">
              Pattern Watch
            </p>

            <div className="mt-3 space-y-3 lg:space-y-2 lg:mt-2">
              {printPatternWatch.map((insight, index) => (
                <div
                  key={`${insight.label}-${index}`}
                  className={`rounded-2xl border p-4 ${patternSeverityTone(
                    insight.severity
                  )} lg:rounded-xl lg:p-3`}
                >
                  <p className="text-sm font-semibold lg:text-[11px]">{insight.label}</p>
                  <p className="mt-1 text-sm opacity-90 lg:text-[11px]">{insight.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      ) : null}
            {printLoopMode ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-6 lg:rounded-2xl lg:p-[18px]">
          <div
            className={`mb-6 grid gap-4 ${
              demoRole === "general_user" ? "md:grid-cols-2" : "md:grid-cols-3"
            } lg:gap-3 lg:mb-4`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Print Loop Progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 lg:text-2xl">
                {visibleFocusQueue.findIndex((item) => item.id === selectedTaskId) + 1 > 0
                  ? visibleFocusQueue.findIndex((item) => item.id === selectedTaskId) + 1
                  : 1}
                <span className="text-base font-medium text-slate-500 lg:text-sm">
                  {" "}
                  / {visibleFocusQueue.length}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Loop Actions Saved
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 lg:text-2xl">
                {completedLoopCount}
              </p>
            </div>

            {demoRole !== "general_user" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3">
                <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                  Highest Priority
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 lg:text-base">
                  {visibleFocusQueue[0]?.title || "No task available"}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] lg:gap-4">
            <div>
              <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 lg:rounded-xl lg:p-3 lg:mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:text-[9px]">
                  Highest Priority Print Task
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 lg:text-[11px]">
                  {visibleFocusQueue[0]?.title || "No priority available"}
                </p>
                <p className="mt-1 text-xs text-slate-600 lg:text-[9px]">
                  {visibleFocusQueue[0]?.summary ||
                    "System recommends immediate print action."}
                </p>
              </div>

              <div className="mb-4 lg:mb-3">
                <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                  Print Loop Queue
                </p>
                <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                  {demoRole === "general_user"
                    ? "Active Print Work"
                    : "Approval + Inventory Execution"}
                </h2>
              </div>

              <div className="space-y-4 lg:space-y-3">
                {visibleFocusQueue.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
                    No print loop tasks are available from live metrics yet.
                  </div>
                ) : null}

                {visibleFocusQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTaskId(item.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      item.id === selectedTaskId
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } lg:rounded-xl lg:p-3`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-500 lg:text-[11px]">
                          {item.summary}
                        </p>
                        {item.id === selectedTaskId &&
                        selectedPrintPatternHint ? (
                          <p className="mt-2 text-xs font-medium text-amber-700 lg:text-[9px]">
                            {selectedPrintPatternHint}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                            item.priority
                          )} lg:px-2.5 lg:text-[9px]`}
                        >
                          {item.priority}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${focusTypeTone(
                            item.type
                          )} lg:px-2.5 lg:text-[9px]`}
                        >
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:rounded-2xl lg:p-4">
              {selectedTask ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 lg:rounded-xl lg:p-3 lg:mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 lg:text-[9px]">
                    Aether Recommendation
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900 lg:text-[11px]">
                    {getPrintRecommendation(selectedTask)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 lg:text-[9px]">
                    Save the execution decision and move immediately to the next
                    print priority.
                  </p>
                  {selectedPrintPatternHint ? (
                    <p className="mt-2 text-xs font-medium text-amber-700 lg:text-[9px]">
                      {selectedPrintPatternHint}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mb-4 lg:mb-3">
                <h3 className="text-lg font-semibold text-slate-900 lg:text-base">
                  {demoRole === "general_user"
                    ? "Print Work"
                    : "Print Execution"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                  {demoRole === "general_user"
                    ? "Record the result and keep the next print action moving."
                    : "Record the result, reinforce the next move, and keep timing tight."}
                </p>
              </div>

              {selectedTask ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3 lg:mb-3">
                  <p className="text-sm text-slate-500 lg:text-[11px]">Selected Priority</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 lg:text-base">
                    {selectedTask.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                    {selectedTask.summary}
                  </p>
                </div>
              ) : null}

              {loopMessage ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 lg:rounded-xl lg:p-3 lg:mb-3 lg:text-[11px]">
                  {loopMessage}
                </div>
              ) : null}

              <div className="space-y-4 lg:space-y-3">
                <select
                  value={loopResult}
                  onChange={(e) => setLoopResult(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
                />

                <button
                  type="button"
                  onClick={savePrintLoop}
                  disabled={!selectedTask}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
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
        } lg:gap-3`}
      >
        {visibleStats.map((stat) => (
          <div
            key={stat.id}
            className={`rounded-3xl border p-6 shadow-sm ${stat.tone} lg:rounded-2xl lg:p-[18px]`}
          >
            <p className="text-sm font-medium lg:text-[11px]">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold lg:mt-2 lg:text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {operationalPrintUniverses.length > 0 ? (
        <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:mb-4">
            <div>
              <p className="text-sm font-medium text-violet-800 lg:text-[11px]">
                Operational Print Universes
              </p>
              <h2 className="text-xl font-semibold text-violet-950 lg:text-lg">
                Lists feeding print execution
              </h2>
              <p className="mt-1 text-sm text-violet-900/75 lg:text-[11px]">
                These are routed from ingestion and Lists, then converted into approval, inventory, and delivery pressure for Print Focus.
              </p>
            </div>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-violet-800 transition hover:bg-violet-100 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Review Lists
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-3">
            {operationalPrintUniverses.slice(0, 6).map((universe) => (
              <div
                key={universe.id}
                className="rounded-2xl border border-violet-200 bg-white p-4 lg:rounded-xl lg:p-3"
              >
                <div className="flex flex-col gap-3 lg:gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {universe.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                      {universe.routeLabel} · {universe.useCase}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {universe.operationalTags.slice(0, 5).map((tag) => (
                      <span
                        key={`${universe.id}-${tag}`}
                        className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 lg:text-[9px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : listLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm lg:rounded-2xl lg:p-[18px] lg:text-[11px]">
          Loading operational print universes...
        </section>
      ) : null}

      {visibleMaterialReadiness.show ? (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:mb-4">
            <div>
              <p className="text-sm font-medium text-indigo-800 lg:text-[11px]">
                Material Readiness
              </p>
              <h2 className="text-xl font-semibold text-indigo-950 lg:text-lg">
                Print → Deployment Outputs
              </h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-800 lg:rounded-xl lg:px-3 lg:text-[11px]">
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
            } lg:gap-3`}
          >
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 lg:rounded-xl lg:p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:text-[9px]">
                Ready Assets
              </p>
              <div className="mt-3 space-y-3 lg:space-y-2 lg:mt-2">
                {visibleMaterialReadiness.readyAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:rounded-xl lg:p-2.5"
                  >
                    <p className="font-medium text-slate-900">
                      {asset.assetName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                      {asset.linkedTurf} • {asset.linkedUseCase}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4 lg:rounded-xl lg:p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:text-[9px]">
                Inventory Actions
              </p>
              <div className="mt-3 space-y-3 lg:space-y-2 lg:mt-2">
                {visibleMaterialReadiness.inventoryActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:rounded-xl lg:p-2.5"
                  >
                    <p className="font-medium text-slate-900">
                      {action.item} · {action.amount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
                      {action.region}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {demoRole === "admin" ? (
              <div className="rounded-2xl border border-indigo-200 bg-white p-4 lg:rounded-xl lg:p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 lg:text-[9px]">
                  Delivery Unlocks
                </p>
                <div className="mt-3 space-y-3 lg:space-y-2 lg:mt-2">
                  {visibleMaterialReadiness.deliveryUnlocks.map((unlock) => (
                    <div
                      key={unlock.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:rounded-xl lg:p-2.5"
                    >
                      <p className="font-medium text-slate-900">
                        {unlock.item}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 lg:text-[9px]">
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

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-6 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Asset Pipeline
              </p>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Design → Approval → Production
              </h2>
            </div>

            <Boxes className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-4 lg:space-y-3">
            {visibleAssetRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
                {printLoading
                  ? "Loading print assets..."
                  : "No print asset pipeline items or operational print universes are connected yet."}
              </div>
            ) : null}

            {visibleAssetRows.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {asset.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                      Owner: {asset.owner}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${assetStatusTone(
                      asset.status
                    )} lg:px-2.5 lg:text-[9px]`}
                  >
                    {asset.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-6 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Orders
              </p>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Production + Delivery
              </h2>
            </div>

            <Truck className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-4 lg:space-y-3">
            {visibleOrderRows.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
                {printLoading
                  ? "Loading print orders..."
                  : "No print production, delivery, or operational universe orders are connected yet."}
              </div>
            ) : null}

            {visibleOrderRows.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {order.item}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                      {order.vendor}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${orderStatusTone(
                      order.status
                    )} lg:px-2.5 lg:text-[9px]`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="mb-6 flex items-center justify-between lg:mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
              Inventory
            </p>
            <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
              Stock + Exposure
            </h2>
          </div>

          <ClipboardCheck className="h-5 w-5 text-slate-500 lg:h-4 lg:w-4" />
        </div>

        <div className="space-y-4 lg:space-y-3">
          {visibleInventoryRows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:rounded-xl lg:p-3 lg:text-[11px]">
              {printLoading
                ? "Loading print inventory..."
                : "No print inventory records or operational print universes are connected yet."}
            </div>
          ) : null}

          {visibleInventoryRows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-xl lg:p-3"
            >
              <p className="font-semibold text-slate-900">{row.item}</p>
              <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                On hand: {row.onHand} • Reserved: {row.reserved}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}