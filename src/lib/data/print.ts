import { supabase } from "@/lib/supabase";

export type PrintMetricRow = {
  id: string;
  item_name?: string | null;
  item_type?: string | null;
  status?: string | null;
  on_hand?: number | null;
  reserved?: number | null;
  reorder_at?: number | null;
  vendor?: string | null;
  expected_delivery?: string | null;
  created_at?: string | null;
  linked_list_id?: string | null;
  linked_list_name?: string | null;
  source_type?: "print_metrics" | "print_list";
};

export type PrintSnapshot = {
  onHand: number;
  orders: number;
  approvalReady: number;
  pressureItem: string;
  issue: string;
};

type PrintListRow = {
  id: string;
  name: string;
  type?: string | null;
  default_owner_name?: string | null;
  created_at?: string | null;
};

async function getActiveOrganizationId() {
  const response = await fetch("/api/auth/current-context", {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || "Unable to resolve active campaign context."
    );
  }

  const organizationId =
    payload?.organization?.id ||
    payload?.membership?.organization_id ||
    null;

  if (!organizationId) {
    throw new Error("No active campaign selected.");
  }

  return String(organizationId);
}

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizeStatus(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function normalizeOperationalText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCleanupListName(value: string) {
  const normalized = normalizeOperationalText(value);

  return (
    normalized.includes("missing email") ||
    normalized.includes("missing phone") ||
    normalized.includes("missing address") ||
    normalized.includes("cleanup") ||
    normalized.includes("clean up") ||
    normalized.includes("data issue") ||
    normalized.includes("data quality") ||
    normalized.includes("enrichment") ||
    normalized.includes("contact repair") ||
    normalized.includes("bad email") ||
    normalized.includes("bad phone") ||
    normalized.includes("no email") ||
    normalized.includes("no phone")
  );
}

function isPrintMaterialListName(value: string) {
  const normalized = normalizeOperationalText(value);

  if (isCleanupListName(normalized)) return false;

  return (
    normalized.includes("print") ||
    normalized.includes("palm card") ||
    normalized.includes("palmcard") ||
    normalized.includes("parm card") ||
    normalized.includes("door hanger") ||
    normalized.includes("doorhanger") ||
    normalized.includes("yard sign") ||
    normalized.includes("yardsign") ||
    normalized.includes("mailer") ||
    normalized.includes("mail piece") ||
    normalized.includes("direct mail") ||
    normalized.includes("postcard") ||
    normalized.includes("literature") ||
    normalized.includes("lit drop") ||
    normalized.includes("litdrop") ||
    normalized.includes("lit piece") ||
    normalized.includes("walk packet") ||
    normalized.includes("absentee chase")
  );
}

function isLikelyPrintList(list: PrintListRow) {
  const explicitType = normalizeOperationalText(list.type);
  const normalized = normalizeOperationalText(`${list.name || ""} ${list.type || ""}`);

  if (isCleanupListName(normalized)) return false;
  if (explicitType === "print") return true;

  return isPrintMaterialListName(normalized);
}

function inferPrintItemType(listName: string) {
  const normalized = normalizeOperationalText(listName);

  if (
    normalized.includes("palm card") ||
    normalized.includes("palmcard") ||
    normalized.includes("parm card")
  ) {
    return "palm_card";
  }

  if (normalized.includes("door hanger") || normalized.includes("doorhanger")) {
    return "door_hanger";
  }

  if (normalized.includes("yard sign") || normalized.includes("yardsign")) {
    return "yard_sign";
  }

  if (
    normalized.includes("mailer") ||
    normalized.includes("direct mail") ||
    normalized.includes("mail piece") ||
    normalized.includes("postcard") ||
    normalized.includes("absentee chase")
  ) {
    return "mailer";
  }

  if (
    normalized.includes("literature") ||
    normalized.includes("lit drop") ||
    normalized.includes("litdrop") ||
    normalized.includes("lit piece") ||
    normalized.includes("walk packet")
  ) {
    return "lit_piece";
  }

  return "print_material";
}

function buildPrintListMetricRow(list: PrintListRow): PrintMetricRow {
  return {
    id: `print-list-${list.id}`,
    item_name: list.name,
    item_type: inferPrintItemType(list.name),
    status: "approval_needed",
    on_hand: 0,
    reserved: 0,
    reorder_at: 0,
    vendor: list.default_owner_name || "Print lane",
    expected_delivery: null,
    created_at: list.created_at || null,
    linked_list_id: list.id,
    linked_list_name: list.name,
    source_type: "print_list",
  };
}

function dedupePrintRows(rows: PrintMetricRow[]) {
  const seenIds = new Set<string>();
  const seenItemNamesWithMetrics = new Set<string>();
  const result: PrintMetricRow[] = [];

  rows.forEach((row) => {
    const id = String(row.id);

    if (seenIds.has(id)) return;

    const itemName = normalizeOperationalText(row.item_name);
    const hasRealMetrics =
      toNumber(row.on_hand) > 0 ||
      toNumber(row.reserved) > 0 ||
      toNumber(row.reorder_at) > 0 ||
      Boolean(row.expected_delivery) ||
      row.source_type === "print_metrics";

    if (hasRealMetrics && itemName) {
      seenItemNamesWithMetrics.add(itemName);
    }

    seenIds.add(id);
    result.push(row);
  });

  return result.filter((row) => {
    if (row.source_type !== "print_list") return true;

    const itemName = normalizeOperationalText(row.item_name);

    if (!itemName) return true;

    return !seenItemNamesWithMetrics.has(itemName);
  });
}

function isApprovalPressureRow(row: PrintMetricRow) {
  return ["candidate_review", "design", "approval_needed"].includes(
    normalizeStatus(row.status)
  );
}

function isActiveProductionOrDeliveryRow(row: PrintMetricRow) {
  return [
    "queued",
    "ordered",
    "in_production",
    "production",
    "printing",
    "shipped",
  ].includes(normalizeStatus(row.status));
}

function isReadyOrMovingRow(row: PrintMetricRow) {
  return ["approved", "ordered", "delivered", "shipped"].includes(
    normalizeStatus(row.status)
  );
}

function isInventoryPressureRow(row: PrintMetricRow) {
  const hasInventoryData =
    toNumber(row.on_hand) > 0 ||
    toNumber(row.reserved) > 0 ||
    toNumber(row.reorder_at) > 0;

  if (!hasInventoryData) {
    return false;
  }

  const available = toNumber(row.on_hand) - toNumber(row.reserved);
  return available <= toNumber(row.reorder_at);
}

function isOperationalPressureRow(row: PrintMetricRow) {
  return (
    isApprovalPressureRow(row) ||
    isInventoryPressureRow(row) ||
    row.source_type === "print_list"
  );
}

function determinePressureItem(rows: PrintMetricRow[]) {
  if (!rows.length) return "No print inventory data";

  const inventoryPressureRows = rows.filter(isInventoryPressureRow);

  if (inventoryPressureRows.length) {
    const ranked = [...inventoryPressureRows].sort((a, b) => {
      const aPressure =
        toNumber(a.reorder_at) - (toNumber(a.on_hand) - toNumber(a.reserved));
      const bPressure =
        toNumber(b.reorder_at) - (toNumber(b.on_hand) - toNumber(b.reserved));

      return bPressure - aPressure;
    });

    return ranked[0]?.item_name || ranked[0]?.item_type || "Unknown item";
  }

  const approvalPressure = rows.find(isApprovalPressureRow);

  if (approvalPressure) {
    return approvalPressure.item_name || approvalPressure.item_type || "Approval queue";
  }

  const routedList = rows.find((row) => row.source_type === "print_list");

  if (routedList) {
    return routedList.item_name || "Operational print universe";
  }

  const activeDelivery = rows.find(isActiveProductionOrDeliveryRow);

  if (activeDelivery) {
    return activeDelivery.item_name || activeDelivery.item_type || "Delivery queue";
  }

  return rows[0]?.item_name || rows[0]?.item_type || "No print inventory data";
}

function determinePrintIssue(rows: PrintMetricRow[]) {
  if (!rows.length) return "No print issues detected yet.";

  const printListCount = rows.filter((row) => row.source_type === "print_list").length;
  const approvalBlocked = rows.filter(isApprovalPressureRow);
  const inventoryPressure = rows.filter(isInventoryPressureRow);
  const activeDelivery = rows.filter(isActiveProductionOrDeliveryRow);

  if (approvalBlocked.length && inventoryPressure.length) {
    return "Approval bottlenecks and inventory pressure both need attention.";
  }

  if (approvalBlocked.length && activeDelivery.length) {
    return "Approval pressure and delivery timing both need attention.";
  }

  if (approvalBlocked.length && printListCount > 0) {
    return `${printListCount} print material universe${
      printListCount === 1 ? "" : "s"
    } staged, with approvals needed before production or delivery.`;
  }

  if (approvalBlocked.length) {
    return "Approval bottlenecks are slowing print execution.";
  }

  if (inventoryPressure.length) {
    return "Inventory pressure is building on key print materials.";
  }

  if (activeDelivery.length) {
    return "Active print production or delivery timing should be watched.";
  }

  if (printListCount > 0) {
    return `${printListCount} print material universe${
      printListCount === 1 ? "" : "s"
    } staged for print orchestration.`;
  }

  return "Print operations look stable right now.";
}

async function getPrintMetricTableRows(
  organizationId: string
): Promise<PrintMetricRow[]> {
  const { data, error } = await supabase
    .from("print_metrics")
    .select(
      "id, item_name, item_type, status, on_hand, reserved, reorder_at, vendor, expected_delivery, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load print metrics", error);
    return [];
  }

  return ((data as PrintMetricRow[]) ?? []).map((row) => ({
    ...row,
    source_type: "print_metrics",
  }));
}

async function getTypedPrintListRows(
  organizationId: string
): Promise<PrintMetricRow[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, type, default_owner_name, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load typed print lists", {
      organizationId,
      error,
    });

    return [];
  }

  const rows = ((data as PrintListRow[]) ?? [])
    .filter(isLikelyPrintList)
    .map(buildPrintListMetricRow);

  console.info("Typed print lists loaded for print metrics", {
    organizationId,
    rawCount: data?.length ?? 0,
    printListCount: rows.length,
    sample: rows[0] ?? null,
  });

  return rows;
}

export async function getPrintMetricRows(): Promise<PrintMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for print metrics", error);
    return [];
  }

  const [metricRows, printListRows] = await Promise.all([
    getPrintMetricTableRows(organizationId),
    getTypedPrintListRows(organizationId),
  ]);

  return dedupePrintRows([...metricRows, ...printListRows]);
}

export async function getPrintSnapshot(): Promise<PrintSnapshot> {
  const rows = await getPrintMetricRows();

  const onHand = rows.filter(isOperationalPressureRow).length;

  const orders = rows.filter(
    (row) => isActiveProductionOrDeliveryRow(row) || isApprovalPressureRow(row)
  ).length;

  const approvalReady = rows.filter(isReadyOrMovingRow).length;

  return {
    onHand,
    orders,
    approvalReady,
    pressureItem: determinePressureItem(rows),
    issue: determinePrintIssue(rows),
  };
}
