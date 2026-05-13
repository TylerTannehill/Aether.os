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

type FinanceContactMetricRow = {
  id: string;
  donation_total?: number | null;
  fec_total_given?: number | null;
  pledge_amount?: number | null;
  jackpot_candidate?: boolean | null;
  fec_donor_tier?: string | null;
  created_at?: string | null;
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

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export async function getFinanceMetricRows(): Promise<FinanceMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for finance metrics", error);
    return [];
  }

  const { data, error } = await supabase
    .from("finance_metrics")
    .select("id, amount, kind, source, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load finance metrics", error);
    return [];
  }

  return (data as FinanceMetricRow[]) ?? [];
}

async function getFinanceContactMetricRows(): Promise<FinanceContactMetricRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for finance contact metrics", error);
    return [];
  }

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, donation_total, fec_total_given, pledge_amount, jackpot_candidate, fec_donor_tier, created_at"
    )
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to load finance contact metrics", error);
    return [];
  }

  return (data as FinanceContactMetricRow[]) ?? [];
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const [financeMetricRows, contactMetricRows] = await Promise.all([
    getFinanceMetricRows(),
    getFinanceContactMetricRows(),
  ]);

  const metricMoneyIn = financeMetricRows
    .filter((row) => {
      const kind = normalize(row.kind);
      return kind === "money_in" || kind === "donation" || kind === "income";
    })
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  const metricMoneyOut = financeMetricRows
    .filter((row) => {
      const kind = normalize(row.kind);
      return kind === "money_out" || kind === "expense" || kind === "spent";
    })
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  const metricPledges = financeMetricRows
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

  const contactMoneyIn = contactMetricRows.reduce((sum, contact) => {
    const donationTotal = toNumber(contact.donation_total);
    const fecTotal = toNumber(contact.fec_total_given);

    return sum + Math.max(donationTotal, fecTotal);
  }, 0);

  const contactPledges = contactMetricRows.reduce((sum, contact) => {
    const pledgeAmount = toNumber(contact.pledge_amount);
    const donationTotal = Math.max(
      toNumber(contact.donation_total),
      toNumber(contact.fec_total_given)
    );

    return sum + Math.max(0, pledgeAmount - donationTotal);
  }, 0);

  const moneyIn = metricMoneyIn + contactMoneyIn;
  const moneyOut = metricMoneyOut;
  const pledges = metricPledges + contactPledges;

  return {
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    pledges,
  };
}
