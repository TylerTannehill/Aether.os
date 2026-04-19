import { supabase } from "@/lib/supabase";

export type FinanceMetricRow = {
  id: string;
  amount?: number | null;
  kind?: string | null;
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type FinanceSnapshot = {
  moneyIn: number;
  moneyOut: number;
  net: number;
  pledges: number;
};

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export async function getFinanceMetricRows(): Promise<FinanceMetricRow[]> {
  const { data, error } = await supabase
    .from("finance_metrics")
    .select("id, amount, kind, source, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load finance metrics", error);
    return [];
  }

  return (data as FinanceMetricRow[]) ?? [];
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const rows = await getFinanceMetricRows();

  const moneyIn = rows
    .filter((row) => {
      const kind = normalize(row.kind);
      return kind === "money_in" || kind === "donation" || kind === "income";
    })
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  const moneyOut = rows
    .filter((row) => {
      const kind = normalize(row.kind);
      return kind === "money_out" || kind === "expense" || kind === "spent";
    })
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  const pledges = rows
    .filter((row) => {
      const kind = normalize(row.kind);
      const status = normalize(row.status);
      return (
        kind === "pledge" ||
        status === "pledged" ||
        status === "pending_pledge"
      );
    })
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  return {
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    pledges,
  };
}
