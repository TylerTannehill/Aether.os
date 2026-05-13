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
};

export type PrintSnapshot = {
  onHand: number;
  orders: number;
  approvalReady: number;
  pressureItem: string;
  issue: string;
};


async function getActiveOrganizationId() {
  const response = await fetch("/api/auth/current-context", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to resolve active campaign context.");
  }

  const payload = await response.json();

  const organizationId =
    payload?.organization?.id ||
    payload?.membership?.organization_id ||
    null;

  if (!organizationId) {
    throw new Error("No active campaign selected.");
  }

  return organizationId;
}

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function determinePressureItem(rows: PrintMetricRow[]) {
  if (!rows.length) return "No print inventory data";

  const ranked = [...rows].sort((a, b) => {
    const aPressure = toNumber(a.reorder_at) - (toNumber(a.on_hand) - toNumber(a.reserved));
    const bPressure = toNumber(b.reorder_at) - (toNumber(b.on_hand) - toNumber(b.reserved));
    return bPressure - aPressure;
  });

  return ranked[0]?.item_name || ranked[0]?.item_type || "Unknown item";
}

function determinePrintIssue(rows: PrintMetricRow[]) {
  if (!rows.length) return "No print issues detected yet.";

  const approvalBlocked = rows.filter((row) =>
    ["candidate_review", "design", "approval_needed"].includes(
      (row.status || "").trim().toLowerCase()
    )
  );

  const inventoryPressure = rows.filter((row) => {
    const available = toNumber(row.on_hand) - toNumber(row.reserved);
    return available <= toNumber(row.reorder_at);
  });

  if (approvalBlocked.length && inventoryPressure.length) {
    return "Approval bottlenecks and inventory pressure both need attention.";
  }

  if (approvalBlocked.length) {
    return "Approval bottlenecks are slowing print execution.";
  }

  if (inventoryPressure.length) {
    return "Inventory pressure is building on key print materials.";
  }

  return "Print operations look stable right now.";
}

export async function getPrintMetricRows(): Promise<PrintMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for print metrics", error);
    return [];
  }

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

  return (data as PrintMetricRow[]) ?? [];
}

export async function getPrintSnapshot(): Promise<PrintSnapshot> {
  const rows = await getPrintMetricRows();

  const onHand = rows.reduce((sum, row) => sum + toNumber(row.on_hand), 0);

  const orders = rows.filter((row) =>
    ["queued", "ordered", "in_production", "shipped"].includes(
      (row.status || "").trim().toLowerCase()
    )
  ).length;

  const approvalReady = rows.filter((row) =>
    ["approved", "ordered", "delivered"].includes(
      (row.status || "").trim().toLowerCase()
    )
  ).length;

  return {
    onHand,
    orders,
    approvalReady,
    pressureItem: determinePressureItem(rows),
    issue: determinePrintIssue(rows),
  };
}