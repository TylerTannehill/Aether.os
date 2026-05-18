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
  linked_list_id?: string | null;
  linked_list_name?: string | null;
  source_type?: "analytics" | "field_metrics" | "field_list";
};

export type FieldSnapshot = {
  doors: number;
  conversations: number;
  ids: number;
  strongestCanvasser: string;
  issue: string;
};

type FieldListRow = {
  id: string;
  name: string;
  type?: string | null;
  default_owner_name?: string | null;
  created_at?: string | null;
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
    linked_list_id: row.linked_list_id ?? row.list_id ?? null,
    linked_list_name: row.linked_list_name ?? row.list_name ?? null,
    source_type: row.source_type || "analytics",
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

function isLikelyFieldList(list: FieldListRow) {
  const type = normalize(list.type);
  const name = normalize(list.name);

  if (type === "field") return true;

  return (
    name.includes("field") ||
    name.includes("turf") ||
    name.includes("canvass") ||
    name.includes("door") ||
    name.includes("walk")
  );
}

function buildFieldListMetricRow(list: FieldListRow): FieldMetricRow {
  return {
    id: `field-list-${list.id}`,
    turf_name: list.name,
    region: "Field List",
    doors: 0,
    conversations: 0,
    ids: 0,
    completion: 0,
    canvasser_name: list.default_owner_name || "Unassigned",
    created_at: list.created_at || null,
    linked_list_id: list.id,
    linked_list_name: list.name,
    source_type: "field_list",
  };
}

function dedupeFieldRows(rows: FieldMetricRow[]) {
  const seenIds = new Set<string>();
  const seenTurfNamesWithMetrics = new Set<string>();
  const result: FieldMetricRow[] = [];

  rows.forEach((row) => {
    const id = String(row.id);

    if (seenIds.has(id)) return;

    const turfName = normalize(row.turf_name);
    const hasRealMetrics =
      toNumber(row.doors) > 0 ||
      toNumber(row.conversations) > 0 ||
      toNumber(row.ids) > 0 ||
      toNumber(row.completion) > 0;

    if (hasRealMetrics && turfName) {
      seenTurfNamesWithMetrics.add(turfName);
    }

    seenIds.add(id);
    result.push(row);
  });

  return result.filter((row) => {
    if (row.source_type !== "field_list") return true;

    const turfName = normalize(row.turf_name);

    if (!turfName) return true;

    return !seenTurfNamesWithMetrics.has(turfName);
  });
}

function determineStrongestCanvasser(rows: FieldMetricRow[]) {
  const rowsWithOutput = rows.filter(
    (row) =>
      toNumber(row.doors) > 0 ||
      toNumber(row.conversations) > 0 ||
      toNumber(row.ids) > 0
  );

  if (!rowsWithOutput.length) return "No canvasser data";

  const scoreByCanvasser = new Map<string, number>();

  rowsWithOutput.forEach((row) => {
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

  const rowsWithMetrics = rows.filter(
    (row) =>
      toNumber(row.doors) > 0 ||
      toNumber(row.conversations) > 0 ||
      toNumber(row.ids) > 0 ||
      toNumber(row.completion) > 0
  );

  if (!rowsWithMetrics.length) {
    const fieldListCount = rows.filter(
      (row) => row.source_type === "field_list"
    ).length;

    if (fieldListCount > 0) {
      return `${fieldListCount} field list${
        fieldListCount === 1 ? "" : "s"
      } created, but no turf output has been logged yet.`;
    }

    return "No field issues detected yet.";
  }

  const weakestCompletion = [...rowsWithMetrics].sort(
    (a, b) => toNumber(a.completion) - toNumber(b.completion)
  )[0];

  const weakestConversationYield = [...rowsWithMetrics].sort((a, b) => {
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
    .map((row) =>
      normalizeFieldRow({
        ...row,
        source_type: "analytics",
      })
    );

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

  return ((data as FieldMetricRow[]) ?? []).map((row) => ({
    ...row,
    source_type: "field_metrics",
  }));
}

async function getTypedFieldListRows(
  organizationId: string
): Promise<FieldMetricRow[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, type, default_owner_name, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load typed field lists", {
      organizationId,
      error,
    });

    return [];
  }

  const rows = ((data as FieldListRow[]) ?? [])
    .filter(isLikelyFieldList)
    .map(buildFieldListMetricRow);

  console.info("Typed field lists loaded for field metrics", {
    organizationId,
    rawCount: data?.length ?? 0,
    fieldListCount: rows.length,
    sample: rows[0] ?? null,
  });

  return rows;
}

export async function getFieldMetricRows(): Promise<FieldMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for field metrics", error);
    return [];
  }

  const [analyticsRows, legacyRows, fieldListRows] = await Promise.all([
    getAnalyticsEventRows(organizationId),
    getLegacyFieldRows(organizationId),
    getTypedFieldListRows(organizationId),
  ]);

  return dedupeFieldRows([
    ...analyticsRows,
    ...legacyRows,
    ...fieldListRows,
  ]);
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
