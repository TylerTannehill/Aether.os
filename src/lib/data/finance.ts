import { supabase } from "@/lib/supabase";

export type FinanceSnapshot = {
  moneyIn: number;
  moneyOut: number;
  net: number;
  pledges: number;
};

export type FinanceTrendPoint = {
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
  pledges: number;
};

type FinanceContactRow = {
  id: string;
};

type ContributionRow = {
  id: string;
  contact_id?: string | null;
  amount?: number | string | null;
  date?: string | null;
  created_at?: string | null;
};

type PledgeRow = {
  id: string;
  contact_id?: string | null;
  amount_pledged?: number | string | null;
  amount_fulfilled?: number | string | null;
  status?: string | null;
  next_follow_up?: string | null;
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

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function isConvertedPledge(status?: string | null) {
  const value = normalize(status);
  return value === "converted" || value === "fulfilled";
}

function getDateKey(value?: string | null) {
  if (!value) return "Undated";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  return parsed.toISOString().slice(0, 10);
}

function formatTrendLabel(key: string) {
  if (key === "Undated") return key;

  return new Date(`${key}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getFinanceSourceRows(): Promise<{
  contributions: ContributionRow[];
  pledges: PledgeRow[];
}> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for finance data", error);
    return { contributions: [], pledges: [] };
  }

  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId);

  if (contactError) {
    console.error("Failed to load finance contacts", contactError);
    return { contributions: [], pledges: [] };
  }

  const contactIds = ((contactData as FinanceContactRow[] | null) ?? [])
    .map((contact) => contact.id)
    .filter(Boolean);

  if (contactIds.length === 0) {
    return { contributions: [], pledges: [] };
  }

  const [{ data: contributionData, error: contributionError }, { data: pledgeData, error: pledgeError }] =
    await Promise.all([
      supabase
        .from("contributions")
        .select("id, contact_id, amount, date, created_at")
        .in("contact_id", contactIds)
        .order("date", { ascending: true }),
      supabase
        .from("pledges")
        .select("id, contact_id, amount_pledged, amount_fulfilled, status, next_follow_up, created_at")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: true }),
    ]);

  if (contributionError) {
    console.error("Failed to load contribution records", contributionError);
  }

  if (pledgeError) {
    console.error("Failed to load pledge records", pledgeError);
  }

  return {
    contributions: (contributionData as ContributionRow[] | null) ?? [],
    pledges: (pledgeData as PledgeRow[] | null) ?? [],
  };
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  const { contributions, pledges } = await getFinanceSourceRows();

  const moneyIn = contributions.reduce(
    (sum, contribution) => sum + toNumber(contribution.amount),
    0
  );

  const moneyOut = 0;

  const openPledges = pledges
    .filter((pledge) => !isConvertedPledge(pledge.status))
    .reduce((sum, pledge) => {
      const amountPledged = toNumber(pledge.amount_pledged);
      const amountFulfilled = toNumber(pledge.amount_fulfilled);
      return sum + Math.max(amountPledged - amountFulfilled, 0);
    }, 0);

  return {
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    pledges: openPledges,
  };
}

export async function getFinanceTrendData(): Promise<FinanceTrendPoint[]> {
  const { contributions, pledges } = await getFinanceSourceRows();
  const grouped = new Map<string, FinanceTrendPoint>();

  const ensurePoint = (key: string) => {
    const existing = grouped.get(key);
    if (existing) return existing;

    const point: FinanceTrendPoint = {
      label: key,
      moneyIn: 0,
      moneyOut: 0,
      net: 0,
      pledges: 0,
    };

    grouped.set(key, point);
    return point;
  };

  for (const contribution of contributions) {
    const key = getDateKey(contribution.date || contribution.created_at);
    const point = ensurePoint(key);
    point.moneyIn += toNumber(contribution.amount);
    point.net = point.moneyIn - point.moneyOut;
  }

  for (const pledge of pledges) {
    if (isConvertedPledge(pledge.status)) continue;

    const amountPledged = toNumber(pledge.amount_pledged);
    const amountFulfilled = toNumber(pledge.amount_fulfilled);
    const remainingAmount = Math.max(amountPledged - amountFulfilled, 0);

    const key = getDateKey(pledge.created_at || pledge.next_follow_up);
    const point = ensurePoint(key);
    point.pledges += remainingAmount;
    point.net = point.moneyIn - point.moneyOut;
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-8)
    .map((point) => ({
      ...point,
      label: formatTrendLabel(point.label),
    }));
}
