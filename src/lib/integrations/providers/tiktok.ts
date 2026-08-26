import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

type TikTokError = {
  code?: string | number;
  message?: string;
  log_id?: string;
};

type TikTokUser = {
  open_id?: string;
  display_name?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
};

type TikTokUserInfoResponse = {
  data?: {
    user?: TikTokUser;
  };
  error?: TikTokError;
};

type TikTokVideo = {
  id?: string;
  create_time?: number;
  title?: string;
  video_description?: string;
  share_url?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
};

type TikTokVideoListResponse = {
  data?: {
    videos?: TikTokVideo[];
    cursor?: number;
    has_more?: boolean;
  };
  error?: TikTokError;
};

function requireAccessToken(connection: IntegrationConnection): string {
  const token = connection.access_token?.trim();

  if (!token) {
    throw new Error("TikTok access token is missing.");
  }

  return token;
}

function assertTikTokSuccess(
  response: Response,
  payload: { error?: TikTokError },
  fallbackMessage: string
) {
  const errorCode = payload.error?.code;
  const apiReportedError =
    errorCode !== undefined &&
    errorCode !== null &&
    String(errorCode).toLowerCase() !== "ok" &&
    String(errorCode) !== "0";

  if (!response.ok || apiReportedError) {
    throw new Error(
      payload.error?.message ||
        `${fallbackMessage}${response.status ? ` (${response.status})` : ""}`
    );
  }
}

function dateBoundary(value?: string, endOfDay = false): number | null {
  if (!value) return null;

  const dateOnly = value.slice(0, 10);
  const parsed = new Date(
    `${dateOnly}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export class TikTokProvider implements AnalyticsProvider {
  readonly id = "tiktok";
  readonly name = "TikTok";
  readonly platform = "tiktok";

  async connect(): Promise<void> {
    // OAuth is handled by /api/integrations/tiktok/connect.
  }

  async disconnect(): Promise<void> {
    // Disconnect is handled by /api/integrations/tiktok/disconnect.
  }

  async getStatus(): Promise<IntegrationStatus> {
    // Organization-specific status is handled by the TikTok status route.
    return "disconnected";
  }

  private async fetchUser(
    connection: IntegrationConnection
  ): Promise<TikTokUser> {
    const accessToken = requireAccessToken(connection);

    const fields = [
      "open_id",
      "display_name",
      "follower_count",
      "following_count",
      "likes_count",
      "video_count",
    ].join(",");

    const response = await fetch(
      `${USER_INFO_URL}?fields=${encodeURIComponent(fields)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const payload = (await response.json()) as TikTokUserInfoResponse;
    assertTikTokSuccess(response, payload, "TikTok user info request failed.");

    if (!payload.data?.user) {
      throw new Error("TikTok did not return user information.");
    }

    return payload.data.user;
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    const user = await this.fetchUser(connection);

    return [
      {
        id:
          user.open_id ||
          String(connection.metadata?.open_id || "") ||
          connection.id,
        name: user.display_name || "Connected TikTok Account",
        platform: "tiktok",
      },
    ];
  }

  async fetchAnalytics(
    connection: IntegrationConnection,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<RawAnalyticsEvent[]> {
    const accessToken = requireAccessToken(connection);
    const user = await this.fetchUser(connection);

    const fields = [
      "id",
      "create_time",
      "title",
      "video_description",
      "share_url",
      "like_count",
      "comment_count",
      "share_count",
      "view_count",
    ].join(",");

    const startMs = dateBoundary(options?.startDate);
    const endMs = dateBoundary(options?.endDate, true);

    const videos: TikTokVideo[] = [];
    let cursor: number | undefined;
    let hasMore = true;
    let pages = 0;

    while (hasMore && pages < 10) {
      const response = await fetch(
        `${VIDEO_LIST_URL}?fields=${encodeURIComponent(fields)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_count: 20,
            ...(cursor ? { cursor } : {}),
          }),
          cache: "no-store",
        }
      );

      const payload = (await response.json()) as TikTokVideoListResponse;
      assertTikTokSuccess(response, payload, "TikTok video list request failed.");

      const pageVideos = payload.data?.videos ?? [];
      videos.push(...pageVideos);

      hasMore = Boolean(payload.data?.has_more);
      cursor = payload.data?.cursor;
      pages += 1;

      if (!cursor) {
        hasMore = false;
      }

      if (startMs && pageVideos.length > 0) {
        const oldestCreateTime = Math.min(
          ...pageVideos
            .map((video) => Number(video.create_time || 0) * 1000)
            .filter((value) => value > 0)
        );

        if (
          Number.isFinite(oldestCreateTime) &&
          oldestCreateTime < startMs
        ) {
          hasMore = false;
        }
      }
    }

    return videos
      .filter((video) => {
        const createdMs = Number(video.create_time || 0) * 1000;
        if (!createdMs) return true;
        if (startMs && createdMs < startMs) return false;
        if (endMs && createdMs > endMs) return false;
        return true;
      })
      .map((video) => {
        const likes = Number(video.like_count || 0);
        const comments = Number(video.comment_count || 0);
        const shares = Number(video.share_count || 0);
        const views = Number(video.view_count || 0);
        const createdAt = video.create_time
          ? new Date(video.create_time * 1000).toISOString()
          : new Date().toISOString();

        return {
          source: "tiktok",
          department: "digital",
          platform: "tiktok",
          campaign_name: user.display_name || null,
          asset_name:
            video.title ||
            video.video_description ||
            (video.id ? `TikTok ${video.id}` : "TikTok video"),
          metric_date: createdAt,
          impressions: views,
          engagements: likes + comments + shares,
          clicks: 0,
          spend: 0,
          notes: video.share_url || null,
          raw_payload: {
            video,
            account: {
              open_id: user.open_id ?? null,
              display_name: user.display_name ?? null,
              follower_count: user.follower_count ?? null,
              following_count: user.following_count ?? null,
              likes_count: user.likes_count ?? null,
              video_count: user.video_count ?? null,
            },
          },
        };
      });
  }
}
