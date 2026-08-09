import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

const X_API_BASE = "https://api.x.com/2";

type XUser = {
  id: string;
  name?: string;
  username?: string;
};

type XPostMetrics = {
  impression_count?: number;
  like_count?: number;
  reply_count?: number;
  retweet_count?: number;
  quote_count?: number;
  bookmark_count?: number;
};

type XPost = {
  id: string;
  text?: string;
  created_at?: string;
  public_metrics?: XPostMetrics;
};

function requireAccessToken(connection: IntegrationConnection) {
  if (!connection.access_token) {
    throw new Error("X connection is missing an access token.");
  }

  return connection.access_token;
}

async function xFetch<T>(
  path: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${X_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.title ||
      payload?.error_description ||
      payload?.error ||
      `X API request failed with status ${response.status}.`;

    throw new Error(String(message));
  }

  return payload as T;
}

async function getAuthenticatedUser(
  accessToken: string
): Promise<XUser> {
  const payload = await xFetch<{ data?: XUser }>(
    "/users/me?user.fields=id,name,username",
    accessToken
  );

  if (!payload?.data?.id) {
    throw new Error("X did not return the authenticated account.");
  }

  return payload.data;
}

function parseDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoSeconds(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export class XProvider implements AnalyticsProvider {
  readonly id = "x";
  readonly name = "X";
  readonly platform = "x";

  async connect(): Promise<void> {
    throw new Error(
      "X OAuth is handled by /api/integrations/x/connect."
    );
  }

  async disconnect(): Promise<void> {
    throw new Error(
      "X disconnect is handled by /api/integrations/x/disconnect."
    );
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "disconnected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    const accessToken = requireAccessToken(connection);
    const user = await getAuthenticatedUser(accessToken);

    return [
      {
        id: user.id,
        name: user.username ? `@${user.username}` : user.name || "X Account",
        platform: "x",
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
    const user = await getAuthenticatedUser(accessToken);

    const now = new Date();
    const requestedStart = parseDate(options?.startDate);
    const requestedEnd = parseDate(options?.endDate);

    const defaultStart = new Date(now);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);

    let startDate = requestedStart || defaultStart;
    let endDate = requestedEnd || now;

    if (startDate.getTime() >= endDate.getTime()) {
      startDate = defaultStart;
      endDate = now;
    }

    if (endDate.getTime() > now.getTime()) {
      endDate = now;
    }

    const params = new URLSearchParams({
      max_results: "100",
      "tweet.fields": "id,text,created_at,public_metrics",
      start_time: isoSeconds(startDate),
      end_time: isoSeconds(endDate),
    });

    const posts: XPost[] = [];
    let paginationToken: string | undefined;

    do {
      if (paginationToken) {
        params.set("pagination_token", paginationToken);
      } else {
        params.delete("pagination_token");
      }

      const payload = await xFetch<{
        data?: XPost[];
        meta?: {
          next_token?: string;
        };
      }>(
        `/users/${encodeURIComponent(user.id)}/tweets?${params.toString()}`,
        accessToken
      );

      if (Array.isArray(payload?.data)) {
        posts.push(...payload.data);
      }

      paginationToken = payload?.meta?.next_token;
    } while (paginationToken);

    return posts.map((post) => {
      const metrics = post.public_metrics || {};

      const engagements =
        Number(metrics.like_count || 0) +
        Number(metrics.reply_count || 0) +
        Number(metrics.retweet_count || 0) +
        Number(metrics.quote_count || 0) +
        Number(metrics.bookmark_count || 0);

      return {
        source: "x",
        department: "digital",
        platform: "x",
        campaign_name:
          user.username ? `@${user.username}` : user.name || "X",
        asset_name: post.id,
        metric_date: post.created_at || null,
        impressions: Number(metrics.impression_count || 0),
        engagements,
        clicks: 0,
        spend: 0,
        sentiment_positive: 0,
        sentiment_negative: 0,
        sentiment_neutral: 0,
        notes: post.text || null,
        raw_payload: {
          provider: "x",
          account: {
            id: user.id,
            name: user.name || null,
            username: user.username || null,
          },
          post,
        },
      };
    });
  }
}
