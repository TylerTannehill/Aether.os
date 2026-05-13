import { supabase } from "@/lib/supabase";

export type FieldMetricRow = {
  id: string;
  turf_name?: string | null;
  region?: string | null;
  doors?: number | null;
  conversations?: number | null;
  ids?: number | null;
  completion?: number | null;
  canvasser_name?: string | null;
  created_at?: string | null;
};

export type FieldSnapshot = {
  doors: number;
  conversations: number;
  ids: number;
  strongestCanvasser: string;
  issue: string;
};

async function getActiveOrganizationId() {
  const response = await fetch("/api/auth/current-context", {
    method: "GET",
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

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function normalizeFieldRow(row: Record<string, any>): FieldMetricRow {
  return {
    id: String(row.id),
    turf_name:
      row.turf_name ||
      row.turf ||
      row.route_name ||
      row.segment ||
      "Active Turf",
    region:
      row.region ||
      row.area ||
      row.zone ||
      row.district ||
      "Unassigned Region",
    doors: toNumber(row.doors ?? row.households ?? row.knocks),
    conversations: toNumber(
      row.conversations ?? row.contacts ?? row.contact_rate
    ),
    ids: toNumber(row.ids ?? row.support_ids ?? row.identifications),
    completion: toNumber(
      row.completion ?? row.completion_rate ?? row.progress
    ),
    canvasser_name:
      row.canvasser_name ||
      row.owner ||
      row.staff_name ||
      "Unassigned",
    created_at: row.metric_date ?? row.created_at ?? null,
  };
}

function isFieldAnalyticsRow(row: Record<string, any>) {
  const department = normalize(row.department);
  const category = normalize(row.category);
  const source = normalize(row.source);
  const platform = normalize(row.platform);

  return (
    department === "field" ||
    category === "field" ||
    source === "field" ||
    platform === "field"
  );
}

function determineStrongestCanvasser(rows: FieldMetricRow[]) {
  if (!rows.length) return "No canvasser data";

  const scoreByCanvasser = new Map<string, number>();

  rows.forEach((row) => {
    const name = (row.canvasser_name || "").trim() || "Unknown";

    const score =
      toNumber(row.doors) +
      toNumber(row.conversations) * 3 +
      toNumber(row.ids) * 5;

    scoreByCanvasser.set(name, (scoreByCanvasser.get(name) || 0) + score);
  });

  const ranked = Array.from(scoreByCanvasser.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  return ranked[0]?.[0] || "No canvasser data";
}

function determineFieldIssue(rows: FieldMetricRow[]) {
  if (!rows.length) return "No field issues detected yet.";

  const weakestCompletion = [...rows].sort(
    (a, b) => toNumber(a.completion) - toNumber(b.completion)
  )[0];

  const weakestConversationYield = [...rows].sort((a, b) => {
    const aYield =
      toNumber(a.doors) > 0
        ? toNumber(a.conversations) / toNumber(a.doors)
        : 0;

    const bYield =
      toNumber(b.doors) > 0
        ? toNumber(b.conversations) / toNumber(b.doors)
        : 0;

    return aYield - bYield;
  })[0];

  const weakestCompletionName =
    weakestCompletion?.turf_name ||
    weakestCompletion?.region ||
    "one turf";

  const weakestYieldName =
    weakestConversationYield?.turf_name ||
    weakestConversationYield?.region ||
    "one turf";

  if (weakestCompletionName === weakestYieldName) {
    return `${weakestCompletionName} is lagging on completion and contact efficiency.`;
  }

  return `${weakestCompletionName} is lagging on completion, while ${weakestYieldName} needs better conversation yield.`;
}

async function getAnalyticsEventRows(
  organizationId: string
): Promise<FieldMetricRow[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("metric_date", { ascending: false });

  if (error) {
    console.error("Failed to load analytics_events for field metrics", {
      organizationId,
      error,
    });

    return [];
  }

  const rows = ((data as Record<string, any>[]) ?? [])
    .filter(isFieldAnalyticsRow)
    .map(normalizeFieldRow);

  console.info("Field analytics_events loaded", {
    organizationId,
    rawCount: data?.length ?? 0,
    fieldCount: rows.length,
    sample: rows[0] ?? null,
  });

  return rows;
}

async function getLegacyFieldRows(
  organizationId: string
): Promise<FieldMetricRow[]> {
  const { data, error } = await supabase
    .from("field_metrics")
    .select(
      "id, turf_name, region, doors, conversations, ids, completion, canvasser_name, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load legacy field metrics", {
      organizationId,
      error,
    });

    return [];
  }

  console.info("Legacy field_metrics loaded", {
    organizationId,
    count: data?.length ?? 0,
    sample: data?.[0] ?? null,
  });

  return (data as FieldMetricRow[]) ?? [];
}

export async function getFieldMetricRows(): Promise<FieldMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for field metrics", error);
    return [];
  }

  const analyticsRows = await getAnalyticsEventRows(organizationId);

  if (analyticsRows.length > 0) {
    return analyticsRows;
  }

  return getLegacyFieldRows(organizationId);
}

export async function getFieldSnapshot(): Promise<FieldSnapshot> {
  const rows = await getFieldMetricRows();

  const doors = rows.reduce((sum, row) => sum + toNumber(row.doors), 0);

  const conversations = rows.reduce(
    (sum, row) => sum + toNumber(row.conversations),
    0
  );

  const ids = rows.reduce((sum, row) => sum + toNumber(row.ids), 0);

  return {
    doors,
    conversations,
    ids,
    strongestCanvasser: determineStrongestCanvasser(rows),
    issue: determineFieldIssue(rows),
  };
}
