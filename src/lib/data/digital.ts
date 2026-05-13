import { supabase } from "@/lib/supabase";

export type DigitalPlatformRow = {
  id: string;
  platform: string;
  impressions: number | null;
  engagement: number | null;
  spend: number | null;
  positive_sentiment: number | null;
  negative_sentiment: number | null;
  ctr: number | null;
  created_at?: string | null;
};

export type DigitalSnapshot = {
  impressions: number;
  engagement: number;
  spend: number;
  bestPlatform: string;
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

function normalizePlatform(value: string | null | undefined) {
  return normalize(value);
}

function platformLabel(value: string | null | undefined) {
  const normalized = normalizePlatform(value);

  if (normalized === "meta" || normalized === "facebook") return "Meta";
  if (normalized === "instagram" || normalized === "ig") return "Instagram";
  if (normalized === "x" || normalized === "twitter") return "X";
  if (normalized === "tiktok" || normalized === "tik tok") return "TikTok";
  if (normalized === "youtube" || normalized === "you tube") return "YouTube";

  if (
    normalized === "campaign website" ||
    normalized === "website" ||
    normalized === "campaign domain"
  ) {
    return "Campaign Website";
  }

  return value?.trim() || "Unknown";
}

function getEngagementValue(row: Record<string, any>) {
  return toNumber(row.engagement ?? row.engagements ?? row.interactions);
}

function getPositiveSentimentValue(row: Record<string, any>) {
  return toNumber(row.positive_sentiment ?? row.sentiment_positive);
}

function getNegativeSentimentValue(row: Record<string, any>) {
  return toNumber(row.negative_sentiment ?? row.sentiment_negative);
}

function getCtrValue(row: Record<string, any>) {
  const explicitCtr = row.ctr ?? row.click_through_rate;

  if (explicitCtr !== null && explicitCtr !== undefined && explicitCtr !== "") {
    return toNumber(explicitCtr);
  }

  const impressions = toNumber(row.impressions);
  const clicks = toNumber(row.clicks);

  if (impressions <= 0 || clicks <= 0) {
    return 0;
  }

  return Number(((clicks / impressions) * 100).toFixed(2));
}

function normalizeAnalyticsEventRow(row: Record<string, any>): DigitalPlatformRow {
  return {
    id: String(row.id),
    platform: platformLabel(row.platform ?? row.source ?? "Unknown"),
    impressions: toNumber(row.impressions),
    engagement: getEngagementValue(row),
    spend: toNumber(row.spend),
    positive_sentiment: getPositiveSentimentValue(row),
    negative_sentiment: getNegativeSentimentValue(row),
    ctr: getCtrValue(row),
    created_at: row.metric_date ?? row.created_at ?? null,
  };
}

function determineBestPlatform(rows: DigitalPlatformRow[]) {
  if (!rows.length) return "No platform data";

  const grouped = new Map<
    string,
    {
      platform: string;
      impressions: number;
      engagement: number;
      ctr: number;
      rows: number;
    }
  >();

  rows.forEach((row) => {
    const key = normalizePlatform(row.platform);
    const existing =
      grouped.get(key) ??
      {
        platform: row.platform,
        impressions: 0,
        engagement: 0,
        ctr: 0,
        rows: 0,
      };

    existing.impressions += toNumber(row.impressions);
    existing.engagement += toNumber(row.engagement);
    existing.ctr += toNumber(row.ctr);
    existing.rows += 1;

    grouped.set(key, existing);
  });

  const ranked = Array.from(grouped.values()).sort((a, b) => {
    const aScore =
      a.engagement +
      a.impressions / 100 +
      (a.rows ? a.ctr / a.rows : 0) * 100;

    const bScore =
      b.engagement +
      b.impressions / 100 +
      (b.rows ? b.ctr / b.rows : 0) * 100;

    return bScore - aScore;
  });

  return platformLabel(ranked[0]?.platform);
}

function determineBiggestIssue(rows: DigitalPlatformRow[]) {
  if (!rows.length) return "No digital issues detected yet.";

  const grouped = new Map<
    string,
    {
      platform: string;
      positive: number;
      negative: number;
      spend: number;
      engagement: number;
      ctr: number;
      rows: number;
    }
  >();

  rows.forEach((row) => {
    const key = normalizePlatform(row.platform);
    const existing =
      grouped.get(key) ??
      {
        platform: row.platform,
        positive: 0,
        negative: 0,
        spend: 0,
        engagement: 0,
        ctr: 0,
        rows: 0,
      };

    existing.positive += toNumber(row.positive_sentiment);
    existing.negative += toNumber(row.negative_sentiment);
    existing.spend += toNumber(row.spend);
    existing.engagement += toNumber(row.engagement);
    existing.ctr += toNumber(row.ctr);
    existing.rows += 1;

    grouped.set(key, existing);
  });

  const platforms = Array.from(grouped.values());

  const weakestSentiment = [...platforms].sort((a, b) => {
    const aNet =
      a.positive / Math.max(a.rows, 1) -
      a.negative / Math.max(a.rows, 1);

    const bNet =
      b.positive / Math.max(b.rows, 1) -
      b.negative / Math.max(b.rows, 1);

    return aNet - bNet;
  })[0];

  const leastEfficientSpend = [...platforms]
    .filter((platform) => platform.spend > 0)
    .sort((a, b) => {
      const aEfficiency = a.engagement / Math.max(a.spend, 1);
      const bEfficiency = b.engagement / Math.max(b.spend, 1);

      return aEfficiency - bEfficiency;
    })[0];

  if (!weakestSentiment && !leastEfficientSpend) {
    return "Digital metrics are active and no obvious platform pressure is visible yet.";
  }

  const weakSentimentPlatform = platformLabel(weakestSentiment?.platform);
  const spendPressurePlatform = platformLabel(leastEfficientSpend?.platform);

  if (
    weakestSentiment &&
    leastEfficientSpend &&
    normalizePlatform(weakestSentiment.platform) ===
      normalizePlatform(leastEfficientSpend.platform)
  ) {
    return `${weakSentimentPlatform} is showing the most pressure on sentiment and efficiency.`;
  }

  if (weakestSentiment && leastEfficientSpend) {
    return `${spendPressurePlatform} needs efficiency review, while ${weakSentimentPlatform} needs sentiment attention.`;
  }

  if (weakestSentiment) {
    return `${weakSentimentPlatform} needs sentiment attention.`;
  }

  return `${spendPressurePlatform} needs efficiency review.`;
}

function isDigitalAnalyticsRow(row: Record<string, any>) {
  const department = normalize(row.department);
  const platform = normalize(row.platform ?? row.source);

  return (
    department === "" ||
    department === "digital" ||
    platform === "meta" ||
    platform === "facebook" ||
    platform === "instagram" ||
    platform === "x" ||
    platform === "twitter" ||
    platform === "tiktok" ||
    platform === "tik tok" ||
    platform === "youtube" ||
    platform === "campaign website" ||
    platform === "website" ||
    platform === "campaign domain"
  );
}

async function getAnalyticsEventRows(
  organizationId: string
): Promise<DigitalPlatformRow[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("metric_date", { ascending: false });

  if (error) {
    console.error("Failed to load analytics_events for digital metrics", {
      organizationId,
      error,
    });
    return [];
  }

  const rows = ((data as Record<string, any>[]) ?? [])
    .filter(isDigitalAnalyticsRow)
    .map(normalizeAnalyticsEventRow);

  console.info("Digital analytics_events loaded", {
    organizationId,
    rawCount: data?.length ?? 0,
    digitalCount: rows.length,
    sample: rows[0] ?? null,
  });

  return rows;
}

async function getLegacyDigitalMetricRows(
  organizationId: string
): Promise<DigitalPlatformRow[]> {
  const { data, error } = await supabase
    .from("digital_metrics")
    .select(
      "id, platform, impressions, engagement, spend, positive_sentiment, negative_sentiment, ctr, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load legacy digital_metrics", {
      organizationId,
      error,
    });
    return [];
  }

  console.info("Legacy digital_metrics loaded", {
    organizationId,
    count: data?.length ?? 0,
    sample: data?.[0] ?? null,
  });

  return (data as DigitalPlatformRow[]) ?? [];
}

export async function getDigitalPlatformRows(): Promise<DigitalPlatformRow[]> {
  let organizationId: string;

  try {
    organizationId = await getActiveOrganizationId();
  } catch (error) {
    console.error("Failed to resolve active campaign for digital metrics", error);
    return [];
  }

  const analyticsRows = await getAnalyticsEventRows(organizationId);

  if (analyticsRows.length > 0) {
    return analyticsRows;
  }

  return getLegacyDigitalMetricRows(organizationId);
}

export async function getDigitalSnapshot(): Promise<DigitalSnapshot> {
  const rows = await getDigitalPlatformRows();

  const impressions = rows.reduce(
    (sum, row) => sum + toNumber(row.impressions),
    0
  );

  const engagement = rows.reduce(
    (sum, row) => sum + toNumber(row.engagement),
    0
  );

  const spend = rows.reduce((sum, row) => sum + toNumber(row.spend), 0);

  return {
    impressions,
    engagement,
    spend,
    bestPlatform: determineBestPlatform(rows),
    issue: determineBiggestIssue(rows),
  };
}
