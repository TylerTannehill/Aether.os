export type RawAnalyticsEvent = {
  source?: string | null;
  department?: string | null;

  platform?: string | null;
  campaign_name?: string | null;
  asset_name?: string | null;

  metric_date?: string | Date | null;

  impressions?: number | string | null;
  engagements?: number | string | null;
  engagement?: number | string | null;
  interactions?: number | string | null;
  clicks?: number | string | null;
  spend?: number | string | null;

  sentiment_positive?: number | string | null;
  positive_sentiment?: number | string | null;
  sentiment_negative?: number | string | null;
  negative_sentiment?: number | string | null;
  sentiment_neutral?: number | string | null;
  neutral_sentiment?: number | string | null;

  notes?: string | null;
  raw_payload?: Record<string, unknown> | null;

  [key: string]: unknown;
};

export type NormalizedAnalyticsEventRow = {
  organization_id: string;

  source: string;
  department: string;

  platform: string | null;
  campaign_name: string | null;
  asset_name: string | null;
  external_id: string | null;

  metric_date: string | null;

  impressions: number;
  engagements: number;
  clicks: number;
  spend: number;

  sentiment_positive: number;
  sentiment_negative: number;
  sentiment_neutral: number;

  notes: string | null;
  raw_payload: Record<string, unknown>;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function cleanString(value: unknown) {
  const cleaned = String(value ?? "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function buildExternalId(
  event: RawAnalyticsEvent,
  metricDate: string | null
): string | null {
  const source = cleanString(event.source)?.toLowerCase() || "";
  const platform = cleanString(event.platform)?.toLowerCase() || "";
  const rawPayload = asRecord(event.raw_payload);

  if (!rawPayload) {
    return null;
  }

  if (source === "x" || platform === "x") {
    const post = asRecord(rawPayload.post);
    const postId = cleanString(post?.id);

    return postId ? `post:${postId}` : null;
  }

  if (source === "tiktok" || platform === "tiktok") {
    const video = asRecord(rawPayload.video);
    const videoId = cleanString(video?.id);

    return videoId ? `video:${videoId}` : null;
  }

  if (source === "youtube_api" || platform === "youtube") {
    const channelId = cleanString(rawPayload.channel_id);
    const day = toDate(rawPayload.day) || metricDate;

    return channelId && day ? `channel:${channelId}:day:${day}` : null;
  }

  if (source === "meta") {
    const dataType = cleanString(rawPayload.data_type)?.toLowerCase() || "";

    if (dataType === "marketing_api") {
      const insight = asRecord(rawPayload.insight);
      const adId = cleanString(insight?.ad_id);
      const day = toDate(insight?.date_start) || metricDate;

      return adId && day ? `ad:${adId}:day:${day}` : null;
    }

    if (dataType === "facebook_post_insights") {
      const post = asRecord(rawPayload.post);
      const postId = cleanString(post?.id);

      return postId ? `post:${postId}` : null;
    }

    if (dataType === "instagram_account_insights") {
      const profile = asRecord(rawPayload.instagram_profile);
      const profileId = cleanString(profile?.id);

      return profileId && metricDate
        ? `account:${profileId}:day:${metricDate}`
        : null;
    }
  }

  return null;
}

export function normalizeAnalyticsEvents(
  events: RawAnalyticsEvent[],
  organizationId: string
): NormalizedAnalyticsEventRow[] {
  return events.map((event) => {
    const metricDate = toDate(event.metric_date);

    return {
      organization_id: organizationId,

      source: cleanString(event.source) || "csv",
      department: cleanString(event.department) || "digital",

      platform: cleanString(event.platform),
      campaign_name: cleanString(event.campaign_name),
      asset_name: cleanString(event.asset_name),
      external_id: buildExternalId(event, metricDate),

      metric_date: metricDate,

      impressions: Math.round(toNumber(event.impressions)),
      engagements: Math.round(
        toNumber(event.engagements ?? event.engagement ?? event.interactions)
      ),
      clicks: Math.round(toNumber(event.clicks)),
      spend: toNumber(event.spend),

      sentiment_positive: Math.round(
        toNumber(event.sentiment_positive ?? event.positive_sentiment)
      ),
      sentiment_negative: Math.round(
        toNumber(event.sentiment_negative ?? event.negative_sentiment)
      ),
      sentiment_neutral: Math.round(
        toNumber(event.sentiment_neutral ?? event.neutral_sentiment)
      ),

      notes: cleanString(event.notes),
      raw_payload: event.raw_payload || event,
    };
  });
}
