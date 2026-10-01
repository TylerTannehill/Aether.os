"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  MessageSquare,
  PenSquare,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  getDigitalPlatformRows,
  type DigitalPlatformRow,
} from "@/lib/data/digital";
import { createClient } from "@/lib/supabase/client";

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

type ContentStage =
  | "drafting"
  | "review"
  | "revision"
  | "testing"
  | "preparing"
  | "published";

type MarketingContentItem = {
  id: string;
  organization_id: string;
  title: string;
  platform: string;
  owner_user_id: string | null;
  stage: ContentStage;
  overall_due_date: string | null;
  overall_completed_at: string | null;
  draft_due_date: string | null;
  draft_completed_at: string | null;
  review_due_date: string | null;
  review_completed_at: string | null;
  publish_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type NewContentForm = {
  title: string;
  platform: string;
  overallDueDate: string;
  draftDueDate: string;
  reviewDueDate: string;
  publishAt: string;
};

const EMPTY_CONTENT_FORM: NewContentForm = {
  title: "",
  platform: "facebook",
  overallDueDate: "",
  draftDueDate: "",
  reviewDueDate: "",
  publishAt: "",
};

type MarketingSpendEntry = {
  id: string;
  organization_id: string;
  platform: string;
  amount: number | string;
  spend_date: string;
  note: string | null;
  created_at: string;
};

type MarketingResponseReview = {
  id: string;
  organization_id: string;
  platform: string;
  engagement_baseline: number | string;
  reviewed_at: string;
  created_at: string;
};

type SpendForm = {
  amount: string;
  spendDate: string;
  note: string;
};

const SPEND_PLATFORMS = [
  { key: "meta", storageKey: "facebook", label: "Facebook" },
  { key: "instagram", storageKey: "instagram", label: "Instagram" },
  { key: "x", storageKey: "x", label: "X" },
  { key: "tiktok", storageKey: "tiktok", label: "TikTok" },
  { key: "youtube", storageKey: "youtube", label: "YouTube" },
  { key: "website", storageKey: "website", label: "Website" },
] as const;

function defaultSpendDate() {
  const date = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function emptySpendForm(): SpendForm {
  return {
    amount: "",
    spendDate: defaultSpendDate(),
    note: "",
  };
}

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

function contentPlatformLabel(value: string) {
  if (value === "facebook") return "Facebook";
  if (value === "instagram") return "Instagram";
  if (value === "x") return "X";
  if (value === "tiktok") return "TikTok";
  if (value === "youtube") return "YouTube";
  if (value === "website") return "Website";
  return "Other";
}

function contentStageLabel(stage: ContentStage) {
  if (stage === "drafting") return "Drafting";
  if (stage === "review") return "Seeking Review";
  if (stage === "revision") return "Revision";
  if (stage === "testing") return "Testing";
  if (stage === "preparing") return "Preparing for Release";
  return "Published";
}

function formatContentDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toIsoOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromContentItem(item: MarketingContentItem): NewContentForm {
  return {
    title: item.title,
    platform: item.platform,
    overallDueDate: toDateTimeLocal(item.overall_due_date),
    draftDueDate: toDateTimeLocal(item.draft_due_date),
    reviewDueDate: toDateTimeLocal(item.review_due_date),
    publishAt: toDateTimeLocal(item.publish_at),
  };
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
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

      <p className="mt-2 text-sm font-semibold text-slate-950">
        {item.title}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.summary}</p>

      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
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

      <div className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-4 text-slate-500">
        Review in {item.platform}. Execution controls activate only when the
        underlying workflow is connected.
      </div>
    </div>
  );
}

export default function BusinessMarketingFocusPage() {
  const [rows, setRows] = useState<DigitalPlatformRow[]>([]);
  const [contentItems, setContentItems] = useState<MarketingContentItem[]>([]);
  const [publishedContentItems, setPublishedContentItems] = useState<
    MarketingContentItem[]
  >([]);
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentForm, setContentForm] =
    useState<NewContentForm>(EMPTY_CONTENT_FORM);
  const [savingContent, setSavingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editContentForm, setEditContentForm] =
    useState<NewContentForm>(EMPTY_CONTENT_FORM);
  const [editContentError, setEditContentError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [completingMilestone, setCompletingMilestone] = useState<string | null>(
    null
  );
  const [publishingContentId, setPublishingContentId] = useState<string | null>(
    null
  );
  const [spendEntries, setSpendEntries] = useState<MarketingSpendEntry[]>([]);
  const [editingSpendPlatform, setEditingSpendPlatform] = useState<string | null>(
    null
  );
  const [spendForm, setSpendForm] = useState<SpendForm>(emptySpendForm);
  const [savingSpend, setSavingSpend] = useState(false);
  const [spendError, setSpendError] = useState("");
  const [responseReviews, setResponseReviews] = useState<MarketingResponseReview[]>(
    []
  );
  const [savingResponsePlatform, setSavingResponsePlatform] = useState<string | null>(
    null
  );
  const [responseError, setResponseError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFocusData() {
      try {
        setLoading(true);
        setLoadError("");

        const [nextRows, contextResponse] = await Promise.all([
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
        const nextOrganizationId =
          context?.organization?.id ?? context?.membership?.organization_id ?? "";
        if (!nextOrganizationId) {
          throw new Error("No active organization is available.");
        }

        const supabase = createClient();
        const [
          contentResult,
          publishedContentResult,
          spendResult,
          responseReviewResult,
        ] = await Promise.all([
          supabase
            .from("business_marketing_content")
            .select("*")
            .eq("organization_id", nextOrganizationId)
            .is("archived_at", null)
            .neq("stage", "published")
            .order("publish_at", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("business_marketing_content")
            .select("*")
            .eq("organization_id", nextOrganizationId)
            .eq("stage", "published")
            .is("archived_at", null)
            .order("published_at", { ascending: false, nullsFirst: false }),
          supabase
            .from("business_marketing_spend")
            .select("*")
            .eq("organization_id", nextOrganizationId)
            .order("spend_date", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("business_marketing_response_reviews")
            .select("*")
            .eq("organization_id", nextOrganizationId)
            .order("reviewed_at", { ascending: false }),
        ]);

        if (contentResult.error) throw contentResult.error;
        if (publishedContentResult.error) throw publishedContentResult.error;
        if (spendResult.error) throw spendResult.error;
        if (responseReviewResult.error) throw responseReviewResult.error;

        if (!mounted) return;
        setRows(nextRows);
        setOrganizationId(nextOrganizationId);
        setContentItems((contentResult.data ?? []) as MarketingContentItem[]);
        setPublishedContentItems(
          (publishedContentResult.data ?? []) as MarketingContentItem[]
        );
        setSpendEntries((spendResult.data ?? []) as MarketingSpendEntry[]);
        setResponseReviews(
          (responseReviewResult.data ?? []) as MarketingResponseReview[]
        );
      } catch (error) {
        console.error("Failed to load Marketing Focus:", error);

        if (!mounted) return;
        setRows([]);
        setContentItems([]);
        setPublishedContentItems([]);
        setSpendEntries([]);
        setResponseReviews([]);
        setLoadError("Marketing Focus could not load its current data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadFocusData();

    return () => {
      mounted = false;
    };
  }, []);

  async function createContentItem() {
    const title = contentForm.title.trim();

    if (!title) {
      setContentError("Give this content task a title.");
      return;
    }

    if (!organizationId) {
      setContentError("No active organization is available.");
      return;
    }

    try {
      setSavingContent(true);
      setContentError("");

      const supabase = createClient();
      const payload = {
        organization_id: organizationId,
        title,
        platform: contentForm.platform,
        stage: "drafting" as const,
        overall_due_date: toIsoOrNull(contentForm.overallDueDate),
        draft_due_date: toIsoOrNull(contentForm.draftDueDate),
        review_due_date: toIsoOrNull(contentForm.reviewDueDate),
        publish_at: toIsoOrNull(contentForm.publishAt),
      };

      const { data, error } = await supabase
        .from("business_marketing_content")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      setContentItems((current) => [
        data as MarketingContentItem,
        ...current,
      ]);
      setContentForm(EMPTY_CONTENT_FORM);
      setShowContentForm(false);
    } catch (error) {
      console.error("Failed to create Marketing content item:", error);
      setContentError("Aether could not create this content task.");
    } finally {
      setSavingContent(false);
    }
  }

  function beginEditingContent(item: MarketingContentItem) {
    setEditContentError("");
    setEditContentForm(formFromContentItem(item));
    setEditingContentId(item.id);
  }

  function cancelEditingContent() {
    setEditingContentId(null);
    setEditContentForm(EMPTY_CONTENT_FORM);
    setEditContentError("");
  }

  async function saveContentItem(itemId: string) {
    const title = editContentForm.title.trim();

    if (!title) {
      setEditContentError("Give this content task a title.");
      return;
    }

    try {
      setSavingEdit(true);
      setEditContentError("");

      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_marketing_content")
        .update({
          title,
          platform: editContentForm.platform,
          overall_due_date: toIsoOrNull(editContentForm.overallDueDate),
          draft_due_date: toIsoOrNull(editContentForm.draftDueDate),
          review_due_date: toIsoOrNull(editContentForm.reviewDueDate),
          publish_at: toIsoOrNull(editContentForm.publishAt),
        })
        .eq("id", itemId)
        .eq("organization_id", organizationId)
        .select("*")
        .single();

      if (error) throw error;

      setContentItems((current) =>
        current.map((item) =>
          item.id === itemId ? (data as MarketingContentItem) : item
        )
      );
      cancelEditingContent();
    } catch (error) {
      console.error("Failed to update Marketing content item:", error);
      setEditContentError("Aether could not save these content changes.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function markMilestoneComplete(
    itemId: string,
    field:
      | "overall_completed_at"
      | "draft_completed_at"
      | "review_completed_at"
  ) {
    try {
      setCompletingMilestone(`${itemId}:${field}`);
      setEditContentError("");

      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_marketing_content")
        .update({ [field]: new Date().toISOString() })
        .eq("id", itemId)
        .eq("organization_id", organizationId)
        .select("*")
        .single();

      if (error) throw error;

      setContentItems((current) =>
        current.map((item) =>
          item.id === itemId ? (data as MarketingContentItem) : item
        )
      );
    } catch (error) {
      console.error("Failed to complete Marketing milestone:", error);
      setEditContentError("Aether could not mark this milestone complete.");
    } finally {
      setCompletingMilestone(null);
    }
  }


  async function markContentPublished(itemId: string) {
    if (!organizationId) {
      setEditContentError("No active organization is available.");
      return;
    }

    try {
      setPublishingContentId(itemId);
      setEditContentError("");

      const publishedAt = new Date().toISOString();
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_marketing_content")
        .update({
          stage: "published",
          published_at: publishedAt,
        })
        .eq("id", itemId)
        .eq("organization_id", organizationId)
        .select("*")
        .single();

      if (error) throw error;

      const publishedItem = data as MarketingContentItem;

      setContentItems((current) =>
        current.filter((item) => item.id !== itemId)
      );
      setPublishedContentItems((current) => [
        publishedItem,
        ...current.filter((item) => item.id !== itemId),
      ]);

      if (editingContentId === itemId) {
        cancelEditingContent();
      }
    } catch (error) {
      console.error("Failed to publish Marketing content item:", error);
      setEditContentError("Aether could not mark this content published.");
    } finally {
      setPublishingContentId(null);
    }
  }


  function beginSpendEntry(platform: string) {
    setSpendError("");
    setSpendForm(emptySpendForm());
    setEditingSpendPlatform(platform);
  }

  function cancelSpendEntry() {
    setEditingSpendPlatform(null);
    setSpendForm(emptySpendForm());
    setSpendError("");
  }

  async function createSpendEntry(platform: string) {
    const amount = Number(spendForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setSpendError("Enter a spend amount greater than $0.");
      return;
    }

    if (!spendForm.spendDate) {
      setSpendError("Choose the date this spend occurred.");
      return;
    }

    if (!organizationId) {
      setSpendError("No active organization is available.");
      return;
    }

    try {
      setSavingSpend(true);
      setSpendError("");

      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_marketing_spend")
        .insert({
          organization_id: organizationId,
          platform,
          amount,
          spend_date: `${spendForm.spendDate}T12:00:00`,
          note: spendForm.note.trim() || null,
        })
        .select("*")
        .single();

      if (error) throw error;

      setSpendEntries((current) => [
        data as MarketingSpendEntry,
        ...current,
      ]);
      cancelSpendEntry();
    } catch (error) {
      console.error("Failed to create Marketing spend entry:", error);
      setSpendError("Aether could not record this spend entry.");
    } finally {
      setSavingSpend(false);
    }
  }

  async function markAudienceReviewed(
    platform: string,
    engagementBaseline: number
  ) {
    if (!organizationId) {
      setResponseError("No active organization is available.");
      return;
    }

    try {
      setSavingResponsePlatform(platform);
      setResponseError("");

      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_marketing_response_reviews")
        .insert({
          organization_id: organizationId,
          platform,
          engagement_baseline: engagementBaseline,
          reviewed_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) throw error;

      setResponseReviews((current) => [
        data as MarketingResponseReview,
        ...current,
      ]);
    } catch (error) {
      console.error("Failed to mark Marketing audience response reviewed:", error);
      setResponseError("Aether could not record this audience review.");
    } finally {
      setSavingResponsePlatform(null);
    }
  }

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

      {focusItems.length === 0 && contentItems.length === 0 ? (
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
                No Marketing actions are supported by the current data or workflow
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-800">
                {rows.length === 0
                  ? "This organization has no Marketing analytics available yet. Focus will remain empty until real performance data exists."
                  : "Marketing analytics are available, but there are no active content tasks and none currently meet the conservative Focus conditions for spend or audience-response review."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4 xl:items-stretch">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-sky-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-3 xl:h-[68vh] xl:min-h-[560px] xl:max-h-[760px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                Content Lane
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                Produce and approve content
              </h2>
            </div>
            <PenSquare className="h-5 w-5 text-sky-600" />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Tracks real Marketing content from initial draft through review,
            preparation, and publication.
          </p>

          <button
            type="button"
            onClick={() => {
              setContentError("");
              setShowContentForm((current) => !current);
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add New Task
          </button>

          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {showContentForm ? (
             <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Title</span>
                  <input
                    value={contentForm.title}
                    onChange={(event) =>
                      setContentForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Deal alert for Facebook"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Platform</span>
                  <select
                    value={contentForm.platform}
                    onChange={(event) =>
                      setContentForm((current) => ({
                        ...current,
                        platform: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="x">X</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                {[
                  ["overallDueDate", "Overall / Post Due"],
                  ["draftDueDate", "Draft Due"],
                  ["reviewDueDate", "Review Due"],
                  ["publishAt", "Publish Date"],
                ].map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                    <input
                      type="datetime-local"
                      value={contentForm[field as keyof NewContentForm]}
                      onChange={(event) =>
                        setContentForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                    />
                  </label>
                ))}

                {contentError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {contentError}
                  </p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={createContentItem}
                    disabled={savingContent}
                    className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingContent ? "Creating..." : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentForm(EMPTY_CONTENT_FORM);
                      setContentError("");
                      setShowContentForm(false);
                    }}
                    disabled={savingContent}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

            {contentItems.map((item) => {
              const isEditing = editingContentId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                        {contentStageLabel(item.stage)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {contentPlatformLabel(item.platform)}
                      </span>
                    </div>

                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => beginEditingContent(item)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {!isEditing ? (
                    <>
                      <h3 className="mt-2 text-sm font-semibold text-slate-950">
                        {item.title}
                      </h3>

                      <div className="mt-2 space-y-0.5 rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-4 text-slate-600">
                        <p>
                          Overall / Post due: {formatContentDate(item.overall_due_date)}
                        </p>
                        <p>
                          Overall completed:{" "}
                          {formatContentDate(item.overall_completed_at)}
                        </p>
                        <p>Draft due: {formatContentDate(item.draft_due_date)}</p>
                        <p>
                          Draft completed: {formatContentDate(item.draft_completed_at)}
                        </p>
                        <p>Review due: {formatContentDate(item.review_due_date)}</p>
                        <p>
                          Review completed:{" "}
                          {formatContentDate(item.review_completed_at)}
                        </p>
                        <p>Publish: {formatContentDate(item.publish_at)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => markContentPublished(item.id)}
                        disabled={publishingContentId === item.id}
                        className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {publishingContentId === item.id
                          ? "Publishing..."
                          : "Mark Published"}
                      </button>
                    </>
                  ) : (
                    <div className="mt-3 space-y-2.5 rounded-xl border border-sky-200 bg-white p-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Title
                        </span>
                        <input
                          value={editContentForm.title}
                          onChange={(event) =>
                            setEditContentForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Platform
                        </span>
                        <select
                          value={editContentForm.platform}
                          onChange={(event) =>
                            setEditContentForm((current) => ({
                              ...current,
                              platform: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                        >
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="x">X</option>
                          <option value="tiktok">TikTok</option>
                          <option value="youtube">YouTube</option>
                          <option value="website">Website</option>
                          <option value="other">Other</option>
                        </select>
                      </label>

                      <div>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-700">
                            Overall / Post Due
                          </span>
                          <input
                            type="datetime-local"
                            value={editContentForm.overallDueDate}
                            onChange={(event) =>
                              setEditContentForm((current) => ({
                                ...current,
                                overallDueDate: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                          />
                        </label>
                        <div className="mt-2">
                          {item.overall_completed_at ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              Completed {formatContentDate(item.overall_completed_at)}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                markMilestoneComplete(item.id, "overall_completed_at")
                              }
                              disabled={
                                completingMilestone ===
                                `${item.id}:overall_completed_at`
                              }
                              className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                            >
                              {completingMilestone ===
                              `${item.id}:overall_completed_at`
                                ? "Completing..."
                                : "Mark Complete"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-700">
                            Draft Due
                          </span>
                          <input
                            type="datetime-local"
                            value={editContentForm.draftDueDate}
                            onChange={(event) =>
                              setEditContentForm((current) => ({
                                ...current,
                                draftDueDate: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                          />
                        </label>
                        <div className="mt-2">
                          {item.draft_completed_at ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              Completed {formatContentDate(item.draft_completed_at)}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                markMilestoneComplete(item.id, "draft_completed_at")
                              }
                              disabled={
                                completingMilestone ===
                                `${item.id}:draft_completed_at`
                              }
                              className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                            >
                              {completingMilestone ===
                              `${item.id}:draft_completed_at`
                                ? "Completing..."
                                : "Mark Complete"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-700">
                            Review Due
                          </span>
                          <input
                            type="datetime-local"
                            value={editContentForm.reviewDueDate}
                            onChange={(event) =>
                              setEditContentForm((current) => ({
                                ...current,
                                reviewDueDate: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                          />
                        </label>
                        <div className="mt-2">
                          {item.review_completed_at ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              Completed {formatContentDate(item.review_completed_at)}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                markMilestoneComplete(item.id, "review_completed_at")
                              }
                              disabled={
                                completingMilestone ===
                                `${item.id}:review_completed_at`
                              }
                              className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                            >
                              {completingMilestone ===
                              `${item.id}:review_completed_at`
                                ? "Completing..."
                                : "Mark Complete"}
                            </button>
                          )}
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Publish Date
                        </span>
                        <input
                          type="datetime-local"
                          value={editContentForm.publishAt}
                          onChange={(event) =>
                            setEditContentForm((current) => ({
                              ...current,
                              publishAt: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-sky-400"
                        />
                      </label>

                      {editContentError ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {editContentError}
                        </p>
                      ) : null}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => saveContentItem(item.id)}
                          disabled={savingEdit}
                          className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingEdit ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingContent}
                          disabled={savingEdit}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {grouped.content.map((item) => (
              <FocusCard key={item.id} item={item} />
            ))}

            {contentItems.length === 0 && grouped.content.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                No active content tasks or analytics-supported creative reviews.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-3 xl:h-[68vh] xl:min-h-[560px] xl:max-h-[760px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Spend Lane
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                Track channel spend
              </h2>
            </div>
            <CircleDollarSign className="h-5 w-5 text-emerald-700" />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Combines real platform performance with spend your team records in Aether.
          </p>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {SPEND_PLATFORMS.map((platform) => {
              const analytics = platforms.find(
                (item) => item.key === platform.key
              );
              const platformSpendEntries = spendEntries.filter(
                (entry) => entry.platform === platform.storageKey
              );
              const recordedSpend = platformSpendEntries.reduce(
                (total, entry) => total + toNumber(entry.amount),
                0
              );
              const isEditing = editingSpendPlatform === platform.storageKey;

              return (
                <div
                  key={platform.storageKey}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {platform.label}
                    </p>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => beginSpendEntry(platform.storageKey)}
                        className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Impressions
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {(analytics?.impressions ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Engagement
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {(analytics?.engagement ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        CTR
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {analytics?.ctrRows ? `${analytics.ctr}%` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-3 rounded-lg border border-emerald-200 bg-white p-2.5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                        Recorded Spend
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {recordedSpend.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {platformSpendEntries.length}{" "}
                      {platformSpendEntries.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2 rounded-xl border border-emerald-200 bg-white p-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Spend Amount
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={spendForm.amount}
                          onChange={(event) =>
                            setSpendForm((current) => ({
                              ...current,
                              amount: event.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Spend Date
                        </span>
                        <input
                          type="date"
                          value={spendForm.spendDate}
                          onChange={(event) =>
                            setSpendForm((current) => ({
                              ...current,
                              spendDate: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                          Note
                        </span>
                        <input
                          value={spendForm.note}
                          onChange={(event) =>
                            setSpendForm((current) => ({
                              ...current,
                              note: event.target.value,
                            }))
                          }
                          placeholder="Optional context"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      {spendError ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {spendError}
                        </p>
                      ) : null}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => createSpendEntry(platform.storageKey)}
                          disabled={savingSpend}
                          className="flex-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingSpend ? "Recording..." : "Add Spend"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelSpendEntry}
                          disabled={savingSpend}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-purple-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-3 xl:h-[68vh] xl:min-h-[560px] xl:max-h-[760px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
                Audience Response
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                Review audience activity
              </h2>
            </div>
            <MessageSquare className="h-5 w-5 text-purple-700" />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            Tracks aggregate engagement and records when your team reviews each channel.
          </p>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {SPEND_PLATFORMS.map((platform) => {
              const analytics = platforms.find(
                (item) => item.key === platform.key
              );
              const totalEngagement = analytics?.engagement ?? 0;
              const latestReview = responseReviews.find(
                (review) => review.platform === platform.storageKey
              );
              const baseline = latestReview
                ? toNumber(latestReview.engagement_baseline)
                : 0;
              const newEngagement = Math.max(0, totalEngagement - baseline);
              const isSaving = savingResponsePlatform === platform.storageKey;

              return (
                <div
                  key={platform.storageKey}
                  className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {platform.label}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        newEngagement > 0
                          ? "border-purple-200 bg-purple-100 text-purple-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {newEngagement > 0 ? "New Activity" : "Caught Up"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        New Since Review
                      </p>
                      <p className="mt-1 text-lg font-semibold text-purple-700">
                        {newEngagement.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Total Engagement
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {totalEngagement.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Last Reviewed
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {latestReview
                        ? formatContentDate(latestReview.reviewed_at)
                        : "Never reviewed"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      markAudienceReviewed(
                        platform.storageKey,
                        totalEngagement
                      )
                    }
                    disabled={isSaving}
                    className="mt-2 w-full rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Recording Review..." : "Mark Reviewed"}
                  </button>

                  {responseError && savingResponsePlatform === null ? (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">
                      {responseError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              History Lane
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Published content
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Completed content leaves the active lane and settles here as a real
              record of what Marketing published.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Published
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {publishedContentItems.length.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {publishedContentItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Published
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {contentPlatformLabel(item.platform)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-950">
                    {item.title}
                  </h3>
                </div>

                <div className="shrink-0 text-left text-[11px] leading-5 text-slate-500 sm:text-right">
                  <p>
                    Published: {formatContentDate(item.published_at)}
                  </p>
                  <p>
                    Scheduled: {formatContentDate(item.publish_at)}
                  </p>
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Overall Completed
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    {formatContentDate(item.overall_completed_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Draft Completed
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    {formatContentDate(item.draft_completed_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Review Completed
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    {formatContentDate(item.review_completed_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {publishedContentItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Nothing has been published through Marketing Focus yet.
            </div>
          ) : null}
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
