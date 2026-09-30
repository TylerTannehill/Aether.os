"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  MessageSquare,
  PenSquare,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  getDigitalPlatformRows,
  type DigitalPlatformRow,
} from "@/lib/data/digital";

type FocusPriority = "high" | "medium" | "low";
type FocusLane = "content" | "spend" | "response";

type PlatformSummary = {
  key: string;
  label: string;
  impressions: number;
  engagement: number;
  spend: number;
  ctr: number;
  positive: number;
  negative: number;
  ctrRows: number;
  sentimentRows: number;
};

type MarketingFocusItem = {
  id: string;
  lane: FocusLane;
  priority: FocusPriority;
  platform: string;
  title: string;
  summary: string;
  evidence: string[];
};

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizePlatform(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "facebook") return "meta";
  if (normalized === "ig") return "instagram";
  if (normalized === "twitter") return "x";
  if (normalized === "tik tok") return "tiktok";
  if (normalized === "you tube") return "youtube";
  if (
    normalized === "campaign website" ||
    normalized === "campaign domain" ||
    normalized === "business website"
  ) {
    return "website";
  }

  return normalized || "unknown";
}

function platformLabel(key: string, fallback?: string | null) {
  if (key === "meta") return "Meta";
  if (key === "instagram") return "Instagram";
  if (key === "x") return "X";
  if (key === "tiktok") return "TikTok";
  if (key === "youtube") return "YouTube";
  if (key === "website") return "Website";
  return fallback?.trim() || "Unknown";
}

function buildPlatformSummaries(rows: DigitalPlatformRow[]): PlatformSummary[] {
  const grouped = new Map<string, PlatformSummary>();

  for (const row of rows) {
    const key = normalizePlatform(row.platform);
    const existing =
      grouped.get(key) ?? {
        key,
        label: platformLabel(key, row.platform),
        impressions: 0,
        engagement: 0,
        spend: 0,
        ctr: 0,
        positive: 0,
        negative: 0,
        ctrRows: 0,
        sentimentRows: 0,
      };

    existing.impressions += toNumber(row.impressions);
    existing.engagement += toNumber(row.engagement);
    existing.spend += toNumber(row.spend);

    if (row.ctr !== null) {
      existing.ctr += toNumber(row.ctr);
      existing.ctrRows += 1;
    }

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

  return Array.from(grouped.values()).map((platform) => ({
    ...platform,
    ctr:
      platform.ctrRows > 0
        ? Number((platform.ctr / platform.ctrRows).toFixed(2))
        : 0,
    positive:
      platform.sentimentRows > 0
        ? Math.round(platform.positive / platform.sentimentRows)
        : 0,
    negative:
      platform.sentimentRows > 0
        ? Math.round(platform.negative / platform.sentimentRows)
        : 0,
  }));
}

function deriveFocusItems(platforms: PlatformSummary[]): MarketingFocusItem[] {
  if (!platforms.length) return [];

  const items: MarketingFocusItem[] = [];

  const paidPlatforms = platforms.filter(
    (platform) => platform.spend > 0 && platform.impressions > 0
  );

  if (paidPlatforms.length > 0) {
    const spendCandidates = paidPlatforms
      .map((platform) => ({
        platform,
        engagementPerDollar:
          platform.spend > 0 ? platform.engagement / platform.spend : 0,
      }))
      .sort((a, b) => a.engagementPerDollar - b.engagementPerDollar);

    const weakest = spendCandidates[0];
    const strongest = spendCandidates[spendCandidates.length - 1];

    if (
      weakest &&
      strongest &&
      paidPlatforms.length > 1 &&
      strongest.engagementPerDollar > 0 &&
      weakest.engagementPerDollar <
        strongest.engagementPerDollar * 0.5
    ) {
      items.push({
        id: `spend-${weakest.platform.key}`,
        lane: "spend",
        priority: "high",
        platform: weakest.platform.label,
        title: `Review ${weakest.platform.label} spend efficiency`,
        summary:
          "This paid channel is producing materially less engagement per dollar than the strongest paid channel in the current organization data.",
        evidence: [
          `$${weakest.platform.spend.toFixed(0)} recorded spend`,
          `${weakest.platform.engagement.toLocaleString()} recorded engagements`,
          `${weakest.platform.ctr}% average CTR`,
        ],
      });
    } else if (weakest && weakest.platform.ctrRows > 0 && weakest.platform.ctr < 1) {
      items.push({
        id: `spend-${weakest.platform.key}`,
        lane: "spend",
        priority: "medium",
        platform: weakest.platform.label,
        title: `Review ${weakest.platform.label} paid performance`,
        summary:
          "This channel has recorded paid activity and an average CTR below 1% in the available analytics.",
        evidence: [
          `$${weakest.platform.spend.toFixed(0)} recorded spend`,
          `${weakest.platform.ctr}% average CTR`,
        ],
      });
    }
  }

  const contentCandidates = platforms
    .filter(
      (platform) =>
        platform.impressions >= 1000 &&
        platform.ctrRows > 0 &&
        platform.ctr < 1
    )
    .sort((a, b) => a.ctr - b.ctr);

  if (contentCandidates.length > 0) {
    const platform = contentCandidates[0];

    items.push({
      id: `content-${platform.key}`,
      lane: "content",
      priority: platform.ctr < 0.5 ? "high" : "medium",
      platform: platform.label,
      title: `Review ${platform.label} creative performance`,
      summary:
        "This channel has meaningful recorded visibility but a low average click-through rate. The data supports a creative or message review; it does not prescribe what content to create.",
      evidence: [
        `${platform.impressions.toLocaleString()} recorded impressions`,
        `${platform.ctr}% average CTR`,
        `${platform.engagement.toLocaleString()} recorded engagements`,
      ],
    });
  }

  const responseCandidates = platforms
    .filter(
      (platform) =>
        platform.sentimentRows > 0 &&
        platform.negative >= 30 &&
        platform.negative > platform.positive
    )
    .sort((a, b) => b.negative - a.negative);

  if (responseCandidates.length > 0) {
    const platform = responseCandidates[0];

    items.push({
      id: `response-${platform.key}`,
      lane: "response",
      priority: platform.negative >= 50 ? "high" : "medium",
      platform: platform.label,
      title: `Review ${platform.label} audience response`,
      summary:
        "Negative sentiment is higher than positive sentiment in the available aggregate analytics. Review the underlying channel before deciding whether a response is warranted.",
      evidence: [
        `${platform.positive}% average positive sentiment`,
        `${platform.negative}% average negative sentiment`,
      ],
    });
  }

  return items.slice(0, 3);
}

function priorityTone(priority: FocusPriority) {
  if (priority === "high") {
    return "border border-rose-200 bg-rose-100 text-rose-700";
  }
  if (priority === "medium") {
    return "border border-amber-200 bg-amber-100 text-amber-800";
  }
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function laneTone(lane: FocusLane) {
  if (lane === "content") {
    return "border border-sky-200 bg-sky-100 text-sky-700";
  }
  if (lane === "spend") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  return "border border-purple-200 bg-purple-100 text-purple-700";
}

function FocusCard({ item }: { item: MarketingFocusItem }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${priorityTone(
            item.priority
          )}`}
        >
          {item.priority}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${laneTone(
            item.lane
          )}`}
        >
          {item.lane}
        </span>
      </div>

      <p className="mt-3 text-base font-semibold text-slate-950">
        {item.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Evidence
        </p>
        <div className="mt-2 space-y-1">
          {item.evidence.map((line) => (
            <p key={line} className="text-xs text-slate-600">
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        Review in {item.platform}. Execution controls activate only when the
        underlying workflow is connected.
      </div>
    </div>
  );
}

export default function BusinessMarketingFocusPage() {
  const [rows, setRows] = useState<DigitalPlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFocusData() {
      try {
        setLoading(true);
        setLoadError("");

        const nextRows = await getDigitalPlatformRows();

        if (!mounted) return;
        setRows(nextRows);
      } catch (error) {
        console.error("Failed to load Marketing Focus analytics:", error);

        if (!mounted) return;
        setRows([]);
        setLoadError("Marketing Focus could not load analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadFocusData();

    return () => {
      mounted = false;
    };
  }, []);

  const platforms = useMemo(() => buildPlatformSummaries(rows), [rows]);
  const focusItems = useMemo(() => deriveFocusItems(platforms), [platforms]);

  const grouped = useMemo(
    () => ({
      content: focusItems.filter((item) => item.lane === "content"),
      spend: focusItems.filter((item) => item.lane === "spend"),
      response: focusItems.filter((item) => item.lane === "response"),
    }),
    [focusItems]
  );

  const highPriority = focusItems.filter(
    (item) => item.priority === "high"
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <p className="text-sm font-medium text-slate-600">
            Reading Marketing performance...
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Zap className="h-3.5 w-3.5" />
              Marketing Focus Mode
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Turn Marketing pressure into the next review.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Focus reads real organization analytics, identifies defensible
                performance pressure, and separates what needs attention from
                what Aether can actually execute.
              </p>
            </div>
          </div>

          <Link
            href="/business/marketing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/15 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            Back to Marketing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Focus Actions",
            value: focusItems.length,
            helper: "Derived from current analytics",
            icon: Zap,
          },
          {
            label: "High Priority",
            value: highPriority,
            helper: "Strongest current pressure",
            icon: TrendingUp,
          },
          {
            label: "Platforms Read",
            value: platforms.length,
            helper: "Real platform groups",
            icon: BarChart3,
          },
          {
            label: "Analytics Records",
            value: rows.length,
            helper: "Records evaluated",
            icon: Sparkles,
          },
        ].map((stat) => {
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
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      {focusItems.length === 0 ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white">
              <Zap className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Focus state
              </p>
              <h2 className="mt-1 text-lg font-semibold text-emerald-950">
                No Marketing actions are supported by the current data
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-800">
                {rows.length === 0
                  ? "This organization has no Marketing analytics available yet. Focus will remain empty until real performance data exists."
                  : "Marketing analytics are available, but none currently meet the conservative Focus conditions for content, spend, or audience-response review."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4">
        <div className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                Content Lane
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Review creative pressure
              </h2>
            </div>
            <PenSquare className="h-5 w-5 text-sky-600" />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Surfaces meaningful visibility paired with weak click-through
            performance. It does not invent a content brief.
          </p>

          <div className="mt-4 space-y-3">
            {grouped.content.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No content-performance review is supported by current data.
              </div>
            ) : (
              grouped.content.map((item) => (
                <FocusCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Spend Lane
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Review paid performance
              </h2>
            </div>
            <CircleDollarSign className="h-5 w-5 text-emerald-700" />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Compares recorded paid-channel efficiency and flags review
            conditions without prescribing a budget shift.
          </p>

          <div className="mt-4 space-y-3">
            {grouped.spend.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No spend review is supported by current data.
              </div>
            ) : (
              grouped.spend.map((item) => (
                <FocusCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
                Audience Response
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Review response pressure
              </h2>
            </div>
            <MessageSquare className="h-5 w-5 text-purple-700" />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Uses aggregate sentiment only. Aether does not claim a specific
            thread, comment, or reply exists unless that workflow is connected.
          </p>

          <div className="mt-4 space-y-3">
            {grouped.response.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No audience-response review is supported by current data.
              </div>
            ) : (
              grouped.response.map((item) => (
                <FocusCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <Sparkles className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Execution boundary
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Detection is live. Execution stays honest.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Marketing Focus can identify review conditions from real
              organization analytics today. It will not manufacture content,
              move budget, or queue social replies in local state. Those
              controls activate only when their real persistence or provider
              execution paths exist.
            </p>
          </div>
        </div>
      </section>

      <section className="hidden" aria-hidden="true">
        <p>
          Marketing operating doctrine: real performance creates pressure;
          pressure creates Focus; Focus never invents execution.
        </p>
      </section>
    </div>
  );
}
