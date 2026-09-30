"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  Clock3,
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

type ContentItem = {
  id: string;
  title: string;
  platform: PlatformKey;
  status: "drafting" | "review" | "scheduled" | "live";
  publish_at?: string | null;
  owner: string;
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

export default function BusinessMarketingPage() {
  const [trendView, setTrendView] = useState<TrendView>("impressions");
  const [digitalRows, setDigitalRows] = useState<DigitalPlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMarketingRows() {
      try {
        setLoading(true);
        setLoadError("");

        const rows = await getDigitalPlatformRows();

        if (!mounted) return;
        setDigitalRows(rows);
      } catch (error) {
        console.error("Failed to load Business Marketing metrics:", error);

        if (!mounted) return;
        setDigitalRows([]);
        setLoadError("Marketing analytics could not be loaded.");
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

  // Content workflow persistence does not exist for Business yet.
  // Keep this truthful rather than manufacturing sample content.
  const contentPipeline = useMemo<ContentItem[]>(() => [], []);

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
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <BarChart3 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Marketing analytics
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No Marketing metrics connected yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This organization does not currently have Marketing analytics
                available through Aether&apos;s shared analytics layer. When
                real platform data is connected or imported, this command
                center will populate from those records.
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
          <div className="mt-7">
            <div className="flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-1">
              {chartData.map((point, index) => {
                const value = point[trendView];
                const height = Math.max((value / chartMax) * 100, value > 0 ? 4 : 0);

                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="flex min-w-12 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-medium text-slate-500">
                      {formatTrendValue(trendView, value)}
                    </span>
                    <div
                      className="w-full max-w-12 rounded-t-md bg-slate-800 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${point.label}: ${formatTrendValue(
                        trendView,
                        value
                      )}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex gap-2 overflow-x-auto">
              {chartData.map((point, index) => (
                <div
                  key={`${point.label}-label-${index}`}
                  className="min-w-12 flex-1 text-center text-[10px] text-slate-500"
                >
                  {point.label}
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

          <div className="mt-5">
            {contentPipeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">
                  No content workflow connected yet
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Drafting, review, scheduling, ownership, and publishing state
                  will live here once Business content persistence exists.
                </p>
              </div>
            ) : null}
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
                  {contentPipeline.length}
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
        <h2 className="text-lg font-semibold text-slate-900">
          Marketing reflects real performance. It does not invent it.
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Platform metrics are loaded through Aether&apos;s existing
          organization-scoped analytics layer. Content workflow remains empty
          until real persistence exists. Marketing Focus will handle actionable
          pressure separately from this command-center view.
        </p>
      </section>
    </div>
  );
}
