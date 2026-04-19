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

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizePlatform(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function platformLabel(value: string | null | undefined) {
  const normalized = normalizePlatform(value);

  if (normalized === "meta") return "Meta";
  if (normalized === "instagram") return "Instagram";
  if (normalized === "x") return "X";
  if (normalized === "tiktok") return "TikTok";

  return value || "Unknown";
}

function determineBestPlatform(rows: DigitalPlatformRow[]) {
  if (!rows.length) return "No platform data";

  const ranked = [...rows].sort((a, b) => {
    const aScore =
      toNumber(a.engagement) +
      toNumber(a.impressions) / 100 +
      toNumber(a.ctr) * 100;
    const bScore =
      toNumber(b.engagement) +
      toNumber(b.impressions) / 100 +
      toNumber(b.ctr) * 100;

    return bScore - aScore;
  });

  return platformLabel(ranked[0]?.platform);
}

function determineBiggestIssue(rows: DigitalPlatformRow[]) {
  if (!rows.length) return "No digital issues detected yet.";

  const weakestSentiment = [...rows].sort((a, b) => {
    const aNet = toNumber(a.positive_sentiment) - toNumber(a.negative_sentiment);
    const bNet = toNumber(b.positive_sentiment) - toNumber(b.negative_sentiment);
    return aNet - bNet;
  })[0];

  const highestSpendLowestCtr = [...rows].sort((a, b) => {
    const aScore = toNumber(b.spend) - toNumber(a.ctr);
    const bScore = toNumber(a.spend) - toNumber(b.ctr);
    return bScore - aScore;
  })[0];

  const weakSentimentPlatform = platformLabel(weakestSentiment?.platform);
  const spendPressurePlatform = platformLabel(highestSpendLowestCtr?.platform);

  if (
    normalizePlatform(weakestSentiment?.platform) ===
    normalizePlatform(highestSpendLowestCtr?.platform)
  ) {
    return `${weakSentimentPlatform} is showing the most pressure on sentiment and efficiency.`;
  }

  return `${spendPressurePlatform} needs efficiency review, while ${weakSentimentPlatform} needs sentiment attention.`;
}

export async function getDigitalPlatformRows(): Promise<DigitalPlatformRow[]> {
  const { data, error } = await supabase
    .from("digital_metrics")
    .select(
      "id, platform, impressions, engagement, spend, positive_sentiment, negative_sentiment, ctr, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load digital metrics", error);
    return [];
  }

  return (data as DigitalPlatformRow[]) ?? [];
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