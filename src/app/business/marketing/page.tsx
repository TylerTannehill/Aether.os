"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  Clock3,
  Download,
  Megaphone,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import {
  getDigitalPlatformRows,
  type DigitalPlatformRow,
} from "@/lib/data/digital";
import { createClient } from "@/lib/supabase/client";

type PlatformKey =
  | "meta"
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "website"
  | "unknown";

type TrendView = "impressions" | "engagement" | "spend" | "sentiment";

type PlatformMetric = {
  key: PlatformKey;
  label: string;
  impressions: number;
  engagement: number;
  spend: number;
  positive: number;
  negative: number;
  ctr: number;
};

type ChartPoint = {
  label: string;
  impressions: number;
  engagement: number;
  spend: number;
  sentiment: number;
};

type MarketingContentItem = {
  id: string;
  title: string;
  platform: string;
  stage: string;
  overall_due_date: string | null;
  overall_completed_at: string | null;
  draft_due_date: string | null;
  draft_completed_at: string | null;
  review_due_date: string | null;
  review_completed_at: string | null;
  publish_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type MarketingResponseReview = {
  id: string;
  platform: string;
  engagement_baseline: number | string;
  reviewed_at: string;
};


const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalizePlatform(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function platformKeyFromValue(value?: string | null): PlatformKey {
  const normalized = normalizePlatform(value);

  if (normalized === "meta" || normalized === "facebook") return "meta";
  if (normalized === "instagram" || normalized === "ig") return "instagram";
  if (normalized === "x" || normalized === "twitter") return "x";
  if (normalized === "tiktok" || normalized === "tik tok") return "tiktok";
  if (normalized === "youtube" || normalized === "you tube") return "youtube";

  if (
    normalized === "website" ||
    normalized === "campaign website" ||
    normalized === "campaign domain" ||
    normalized === "business website"
  ) {
    return "website";
  }

  return "unknown";
}

function platformLabelFromKey(key: PlatformKey, fallback?: string | null) {
  if (key === "meta") return "Meta";
  if (key === "instagram") return "Instagram";
  if (key === "x") return "X";
  if (key === "tiktok") return "TikTok";
  if (key === "youtube") return "YouTube";
  if (key === "website") return "Website";

  return fallback?.trim() || "Unknown";
}

function buildPlatformMetrics(rows: DigitalPlatformRow[]): PlatformMetric[] {
  const grouped = new Map<
    string,
    {
      key: PlatformKey;
      label: string;
      impressions: number;
      engagement: number;
      spend: number;
      positiveTotal: number;
      negativeTotal: number;
      ctrTotal: number;
      sentimentRows: number;
      ctrRows: number;
    }
  >();

  for (const row of rows) {
    const key = platformKeyFromValue(row.platform);
    const mapKey =
      key === "unknown" ? `unknown:${normalizePlatform(row.platform)}` : key;

    const existing =
      grouped.get(mapKey) ?? {
        key,
        label: platformLabelFromKey(key, row.platform),
        impressions: 0,
        engagement: 0,
        spend: 0,
        positiveTotal: 0,
        negativeTotal: 0,
        ctrTotal: 0,
        sentimentRows: 0,
        ctrRows: 0,
      };

    existing.impressions += toNumber(row.impressions);
    existing.engagement += toNumber(row.engagement);
    existing.spend += toNumber(row.spend);

    if (
      row.positive_sentiment !== null ||
      row.negative_sentiment !== null
    ) {
      existing.positiveTotal += toNumber(row.positive_sentiment);
      existing.negativeTotal += toNumber(row.negative_sentiment);
      existing.sentimentRows += 1;
    }

    if (row.ctr !== null) {
      existing.ctrTotal += toNumber(row.ctr);
      existing.ctrRows += 1;
    }

    grouped.set(mapKey, existing);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      key: item.key,
      label: item.label,
      impressions: item.impressions,
      engagement: item.engagement,
      spend: item.spend,
      positive:
        item.sentimentRows > 0
          ? Math.round(item.positiveTotal / item.sentimentRows)
          : 0,
      negative:
        item.sentimentRows > 0
          ? Math.round(item.negativeTotal / item.sentimentRows)
          : 0,
      ctr:
        item.ctrRows > 0
          ? Number((item.ctrTotal / item.ctrRows).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

function buildChartData(rows: DigitalPlatformRow[]): ChartPoint[] {
  const grouped = new Map<
    string,
    {
      label: string;
      impressions: number;
      engagement: number;
      spend: number;
      positive: number;
      negative: number;
      sentimentRows: number;
    }
  >();

  for (const row of rows) {
    const rawDate = row.created_at;
    if (!rawDate) continue;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) continue;

    const key = date.toISOString().slice(0, 10);
    const existing =
      grouped.get(key) ?? {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        impressions: 0,
        engagement: 0,
        spend: 0,
        positive: 0,
        negative: 0,
        sentimentRows: 0,
      };

    existing.impressions += toNumber(row.impressions);
    existing.engagement += toNumber(row.engagement);
    existing.spend += toNumber(row.spend);

    if (
      row.positive_sentiment !== null ||
      row.negative_sentiment !== null
    ) {
      existing.positive += toNumber(row.positive_sentiment);
      existing.negative += toNumber(row.negative_sentiment);
      existing.sentimentRows += 1;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => ({
      label: item.label,
      impressions: item.impressions,
      engagement: item.engagement,
      spend: item.spend,
      sentiment:
        item.sentimentRows > 0
          ? Math.max(
              0,
              Math.round(
                item.positive / item.sentimentRows -
                  item.negative / item.sentimentRows
              )
            )
          : 0,
    }))
    .slice(-12);
}

function platformTone(key: PlatformKey) {
  if (key === "meta") return "bg-blue-50 text-blue-700";
  if (key === "instagram") return "bg-pink-50 text-pink-700";
  if (key === "x") return "bg-slate-100 text-slate-700";
  if (key === "tiktok") return "bg-cyan-50 text-cyan-700";
  if (key === "youtube") return "bg-red-50 text-red-700";
  if (key === "website") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function formatTrendValue(view: TrendView, value: number) {
  if (view === "spend") return currency.format(value);
  if (view === "sentiment") return `${value}%`;
  return value.toLocaleString();
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BusinessMarketingPage() {
  const [trendView, setTrendView] = useState<TrendView>("impressions");
  const [digitalRows, setDigitalRows] = useState<DigitalPlatformRow[]>([]);
  const [contentItems, setContentItems] = useState<MarketingContentItem[]>([]);
  const [responseReviews, setResponseReviews] = useState<MarketingResponseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMarketingRows() {
      try {
        setLoading(true);
        setLoadError("");

        const [rows, contextResponse] = await Promise.all([
          getDigitalPlatformRows(),
          fetch("/api/auth/current-context", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!contextResponse.ok) {
          throw new Error("Could not load the current organization.");
        }

        const context = await contextResponse.json();
        const organizationId =
          context?.organization?.id ?? context?.membership?.organization_id ?? "";

        if (!organizationId) {
          throw new Error("No active organization is available.");
        }

        const supabase = createClient();
        const [contentResult, responseReviewResult] = await Promise.all([
          supabase
            .from("business_marketing_content")
            .select(
              "id, title, platform, stage, overall_due_date, overall_completed_at, draft_due_date, draft_completed_at, review_due_date, review_completed_at, publish_at, published_at, archived_at, created_at, updated_at"
            )
            .eq("organization_id", organizationId),
          supabase
            .from("business_marketing_response_reviews")
            .select("id, platform, engagement_baseline, reviewed_at")
            .eq("organization_id", organizationId)
            .order("reviewed_at", { ascending: false }),
        ]);

        if (contentResult.error) throw contentResult.error;
        if (responseReviewResult.error) throw responseReviewResult.error;

        if (!mounted) return;
        setDigitalRows(rows);
        setContentItems((contentResult.data ?? []) as MarketingContentItem[]);
        setResponseReviews(
          (responseReviewResult.data ?? []) as MarketingResponseReview[]
        );
      } catch (error) {
        console.error("Failed to load Business Marketing metrics:", error);

        if (!mounted) return;
        setDigitalRows([]);
        setContentItems([]);
        setResponseReviews([]);
        setLoadError("Marketing data could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMarketingRows();

    return () => {
      mounted = false;
    };
  }, []);

  const platformMetrics = useMemo(
    () => buildPlatformMetrics(digitalRows),
    [digitalRows]
  );

  const activeContentCount = useMemo(
    () =>
      contentItems.filter(
        (item) => item.stage !== "published" && item.archived_at === null
      ).length,
    [contentItems]
  );

  const publishedContentCount = useMemo(
    () =>
      contentItems.filter(
        (item) => item.stage === "published" && item.archived_at === null
      ).length,
    [contentItems]
  );

  const openEngagementCount = useMemo(() => {
    const latestReviewByPlatform = new Map<string, MarketingResponseReview>();

    for (const review of responseReviews) {
      if (!latestReviewByPlatform.has(review.platform)) {
        latestReviewByPlatform.set(review.platform, review);
      }
    }

    return platformMetrics.reduce((total, platform) => {
      const storageKey = platform.key === "meta" ? "facebook" : platform.key;
      const latestReview = latestReviewByPlatform.get(storageKey);
      const baseline = toNumber(latestReview?.engagement_baseline);
      return total + Math.max(0, platform.engagement - baseline);
    }, 0);
  }, [platformMetrics, responseReviews]);

  const topLine = useMemo(
    () =>
      platformMetrics.reduce(
        (acc, platform) => {
          acc.impressions += platform.impressions;
          acc.engagement += platform.engagement;
          acc.spend += platform.spend;
          return acc;
        },
        { impressions: 0, engagement: 0, spend: 0 }
      ),
    [platformMetrics]
  );

  const sentimentSnapshot = useMemo(() => {
    const withSentiment = platformMetrics.filter(
      (platform) => platform.positive > 0 || platform.negative > 0
    );

    if (!withSentiment.length) {
      return { positive: 0, negative: 0 };
    }

    return {
      positive: Math.round(
        withSentiment.reduce((sum, platform) => sum + platform.positive, 0) /
          withSentiment.length
      ),
      negative: Math.round(
        withSentiment.reduce((sum, platform) => sum + platform.negative, 0) /
          withSentiment.length
      ),
    };
  }, [platformMetrics]);

  const averageCtr = useMemo(() => {
    const withCtr = platformMetrics.filter((platform) => platform.ctr > 0);
    if (!withCtr.length) return 0;

    return Number(
      (
        withCtr.reduce((sum, platform) => sum + platform.ctr, 0) /
        withCtr.length
      ).toFixed(2)
    );
  }, [platformMetrics]);

  const chartData = useMemo(() => buildChartData(digitalRows), [digitalRows]);

  const chartMax = Math.max(
    ...chartData.map((point) => point[trendView]),
    1
  );

  const hasAnalytics = platformMetrics.length > 0;

  function exportAnalyticsCsv() {
    downloadCsv(
      `aether-marketing-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Platform", "Impressions", "Engagement", "Spend", "CTR", "Positive Sentiment", "Negative Sentiment"],
      digitalRows.map((row) => [
        row.created_at,
        row.platform,
        row.impressions,
        row.engagement,
        row.spend,
        row.ctr,
        row.positive_sentiment,
        row.negative_sentiment,
      ])
    );
  }

  async function exportContentHistoryCsv() {
    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Could not load the current organization.");
      }

      const context = await contextResponse.json();
      const organizationId =
        context?.organization?.id ?? context?.membership?.organization_id ?? "";

      if (!organizationId) {
        throw new Error("No active organization is available.");
      }

      const supabase = createClient();
      const [publishedResult, archivedResult] = await Promise.all([
        supabase
          .from("business_marketing_content")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("stage", "published")
          .is("archived_at", null)
          .order("published_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("business_marketing_content")
          .select("*")
          .eq("organization_id", organizationId)
          .not("archived_at", "is", null)
          .order("archived_at", { ascending: false, nullsFirst: false }),
      ]);

      if (publishedResult.error) throw publishedResult.error;
      if (archivedResult.error) throw archivedResult.error;

      const historyItems = [
        ...((publishedResult.data ?? []) as MarketingContentItem[]),
        ...((archivedResult.data ?? []) as MarketingContentItem[]),
      ].sort((a, b) => {
        const aDate = a.published_at ?? a.archived_at ?? a.updated_at;
        const bDate = b.published_at ?? b.archived_at ?? b.updated_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      downloadCsv(
        `aether-marketing-content-history-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Title",
          "Platform",
          "Stage",
          "Overall Due",
          "Overall Completed",
          "Draft Due",
          "Draft Completed",
          "Review Due",
          "Review Completed",
          "Scheduled Publish",
          "Published",
          "Archived",
          "Created",
          "Updated",
        ],
        historyItems.map((item) => [
          item.title,
          item.platform,
          item.stage,
          item.overall_due_date,
          item.overall_completed_at,
          item.draft_due_date,
          item.draft_completed_at,
          item.review_due_date,
          item.review_completed_at,
          item.publish_at,
          item.published_at,
          item.archived_at,
          item.created_at,
          item.updated_at,
        ])
      );
    } catch (error) {
      console.error("Failed to export Marketing content history:", error);
    }
  }

  const stats = [
    {
      label: "Impressions",
      value: topLine.impressions.toLocaleString(),
      helper: "Cross-platform visibility",
      icon: BarChart3,
    },
    {
      label: "Engagement",
      value: topLine.engagement.toLocaleString(),
      helper: "Audience interactions",
      icon: Sparkles,
    },
    {
      label: "Spend",
      value: currency.format(topLine.spend),
      helper: "Paid media spend",
      icon: CircleDollarSign,
    },
    {
      label: "Sentiment",
      value: `${sentimentSnapshot.positive}% / ${sentimentSnapshot.negative}%`,
      helper: "Positive vs negative response",
      icon: TrendingUp,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <p className="text-sm font-medium text-slate-600">
            Connecting Marketing analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Megaphone className="h-3.5 w-3.5" />
              Marketing Command Center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                See how your marketing is performing.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Monitor cross-platform visibility, engagement, paid media,
                audience response, and content operations from one Marketing
                surface.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 lg:text-[9px]">
                {platformMetrics.length} connected data source
                {platformMetrics.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 lg:text-[9px]">
                {digitalRows.length.toLocaleString()} analytics record
                {digitalRows.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/business/marketing/import"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Upload className="h-4 w-4" />
              Import Analytics
            </Link>

            <Link
              href="/business/marketing/focus"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <Zap className="h-4 w-4" />
              Open Marketing Focus
            </Link>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      {!hasAnalytics ? (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Marketing Activity
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Workflow activity at a glance
            </h2>
          </div>

          <Link
            href="/business/marketing/focus"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open Marketing Focus
            <Zap className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Active Content
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {activeContentCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Open Engagements
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {openEngagementCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Completed Posts
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {publishedContentCount.toLocaleString()}
            </p>
          </div>
        </div>
      </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Performance Trend
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
              Cross-platform movement
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "impressions",
                "engagement",
                "spend",
                "sentiment",
              ] as TrendView[]
            ).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setTrendView(view)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                  trendView === view
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <BarChart3 className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No trend history available
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Dated Marketing analytics will appear here as real records become
              available.
            </p>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 pb-5 pt-6">
            <div className="relative h-64 overflow-hidden">
              <div className="absolute inset-x-0 top-[20%] border-t border-dashed border-slate-200" />
              <div className="absolute inset-x-0 top-[40%] border-t border-dashed border-slate-200" />
              <div className="absolute inset-x-0 top-[60%] border-t border-dashed border-slate-200" />
              <div className="absolute inset-x-0 top-[80%] border-t border-dashed border-slate-200" />

              <svg
                viewBox="0 0 1000 260"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label={`${trendView} trend over time`}
              >
                <defs>
                  <linearGradient id="businessMarketingTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const points = chartData.map((point, index) => {
                    const x =
                      chartData.length === 1
                        ? 500
                        : 40 + (index / (chartData.length - 1)) * 920;
                    const normalized = point[trendView] / chartMax;
                    const y = 220 - normalized * 170;

                    return {
                      x,
                      y,
                      label: point.label,
                      value: point[trendView],
                    };
                  });

                  if (points.length === 1) {
                    const only = points[0];

                    return (
                      <>
                        <path
                          d={`M 40 220 L ${only.x} ${only.y} L 960 ${only.y} L 960 220 Z`}
                          fill="url(#businessMarketingTrendFill)"
                          className="text-slate-800"
                        />
                        <path
                          d={`M 40 220 L ${only.x} ${only.y} L 960 ${only.y}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="text-slate-800"
                        />
                        <circle
                          cx={only.x}
                          cy={only.y}
                          r="6"
                          fill="currentColor"
                          className="text-slate-950"
                        >
                          <title>{`${only.label}: ${formatTrendValue(
                            trendView,
                            only.value
                          )}`}</title>
                        </circle>
                      </>
                    );
                  }

                  const linePath = points.reduce((path, point, index) => {
                    if (index === 0) return `M ${point.x} ${point.y}`;

                    const previous = points[index - 1];
                    const controlX = (previous.x + point.x) / 2;

                    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
                  }, "");

                  const areaPath = `${linePath} L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`;

                  return (
                    <>
                      <path
                        d={areaPath}
                        fill="url(#businessMarketingTrendFill)"
                        className="text-slate-800"
                      />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-800"
                      />
                      {points.map((point, index) => (
                        <circle
                          key={`${point.label}-${index}-point`}
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="currentColor"
                          className="text-slate-950"
                        >
                          <title>{`${point.label}: ${formatTrendValue(
                            trendView,
                            point.value
                          )}`}</title>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div
              className="mt-3 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  chartData.length,
                  1
                )}, minmax(0, 1fr))`,
              }}
            >
              {chartData.map((point, index) => (
                <div key={`${point.label}-${index}-label`} className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {point.label}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-900">
                    {formatTrendValue(trendView, point[trendView])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Platform Performance
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
              Marketing channels
            </h2>
          </div>

          {hasAnalytics ? (
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <MousePointerClick className="h-4 w-4" />
              Average CTR {averageCtr}%
            </div>
          ) : null}
        </div>

        {platformMetrics.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center lg:rounded-2xl">
            <Megaphone className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No platform metrics available
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Connected Marketing platforms will appear here when real
              organization data is available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformMetrics.map((platform, index) => (
              <div
                key={`${platform.key}-${platform.label}-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 lg:text-base">
                    {platform.label}
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold lg:px-2.5 lg:py-0.5 lg:text-[9px] ${platformTone(
                      platform.key
                    )}`}
                  >
                    {platform.key === "unknown"
                      ? "platform"
                      : platform.key}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-700 lg:mt-3 lg:space-y-2 lg:text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>Impressions</span>
                    <span className="font-semibold">
                      {platform.impressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement</span>
                    <span className="font-semibold">
                      {platform.engagement.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Spend</span>
                    <span className="font-semibold">
                      {currency.format(platform.spend)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CTR</span>
                    <span className="font-semibold">{platform.ctr}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sentiment</span>
                    <span className="font-semibold">
                      {platform.positive}% / {platform.negative}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Content Pipeline
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
                Content operations
              </h2>
            </div>
            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-2">
            {[
              {
                lane: "Lane 1",
                title: "Content",
                value: `${activeContentCount.toLocaleString()} open ${
                  activeContentCount === 1 ? "task" : "tasks"
                }`,
              },
              {
                lane: "Lane 2",
                title: "Spend",
                value: "Check spend",
              },
              {
                lane: "Lane 3",
                title: "Audience Response",
                value: `${openEngagementCount.toLocaleString()} open ${
                  openEngagementCount === 1 ? "engagement" : "engagements"
                }`,
              },
              {
                lane: "Lane 4",
                title: "History",
                value: `${publishedContentCount.toLocaleString()} completed ${
                  publishedContentCount === 1 ? "post" : "posts"
                }`,
              },
            ].map((item) => (
              <Link
                key={item.lane}
                href="/business/marketing/focus"
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.lane}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-950">
                  {item.value}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Marketing State
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
                What Aether currently knows
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Analytics records</span>
                <span className="font-semibold text-slate-950">
                  {digitalRows.length.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Platform groups</span>
                <span className="font-semibold text-slate-950">
                  {platformMetrics.length}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Content items</span>
                <span className="font-semibold text-slate-950">
                  {contentItems.length}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            This surface reports the organization&apos;s available Marketing
            state. Action prioritization belongs in Marketing Focus; broader
            interpretation belongs in A.B.E.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Data Export
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Take your Marketing data with you.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Export the Marketing analytics Aether currently knows or download
              the completed content history created through Marketing Focus.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAnalyticsCsv}
              disabled={digitalRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export Analytics CSV
            </button>

            <button
              type="button"
              onClick={exportContentHistoryCsv}
              disabled={!contentItems.some((item) => item.stage === "published" || item.archived_at !== null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export Content History CSV
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
