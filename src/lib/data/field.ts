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

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
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
      toNumber(a.doors) > 0 ? toNumber(a.conversations) / toNumber(a.doors) : 0;
    const bYield =
      toNumber(b.doors) > 0 ? toNumber(b.conversations) / toNumber(b.doors) : 0;
    return aYield - bYield;
  })[0];

  const weakestCompletionName =
    weakestCompletion?.turf_name || weakestCompletion?.region || "one turf";
  const weakestYieldName =
    weakestConversationYield?.turf_name ||
    weakestConversationYield?.region ||
    "one turf";

  if (weakestCompletionName === weakestYieldName) {
    return `${weakestCompletionName} is lagging on completion and contact efficiency.`;
  }

  return `${weakestCompletionName} is lagging on completion, while ${weakestYieldName} needs better conversation yield.`;
}

export async function getFieldMetricRows(): Promise<FieldMetricRow[]> {
  const { data, error } = await supabase
    .from("field_metrics")
    .select(
      "id, turf_name, region, doors, conversations, ids, completion, canvasser_name, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load field metrics", error);
    return [];
  }

  return (data as FieldMetricRow[]) ?? [];
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
