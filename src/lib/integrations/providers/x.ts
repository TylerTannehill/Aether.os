import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

const X_API_BASE = "https://api.x.com/2";

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_TOKEN_REFRESH_BUFFER_MS = 20 * 60 * 1000;

type XRefreshResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  scope?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function xTokenNeedsRefresh(connection: IntegrationConnection): boolean {
  if (!connection.access_token?.trim()) return true;
  if (!connection.expires_at) return true;

  const expiresAt = Date.parse(connection.expires_at);
  if (!Number.isFinite(expiresAt)) return true;

  return expiresAt <= Date.now() + X_TOKEN_REFRESH_BUFFER_MS;
}

async function ensureFreshXConnection(
  connection: IntegrationConnection
): Promise<IntegrationConnection> {
  if (!xTokenNeedsRefresh(connection)) {
    return connection;
  }

  const refreshToken = connection.refresh_token?.trim();
  const clientId = process.env.X_CLIENT_ID?.trim();
  const clientSecret = process.env.X_CLIENT_SECRET?.trim();

  if (!refreshToken) {
    throw new Error(
      "X access token expired and no refresh token is available. Reconnect X."
    );
  }

  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID and X_CLIENT_SECRET are required.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as XRefreshResponse;

  if (!response.ok || !payload.access_token) {
    const detail =
      payload.error_description ||
      payload.error ||
      `X token refresh failed (${response.status}).`;

    throw new Error(detail);
  }

  const nextRefreshToken = payload.refresh_token?.trim() || refreshToken;
  const expiresAt = payload.expires_in
    ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString()
    : connection.expires_at;

  return {
    ...connection,
    access_token: payload.access_token,
    refresh_token: nextRefreshToken,
    expires_at: expiresAt,
    scopes: payload.scope
      ? payload.scope
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : connection.scopes,
    metadata: {
      ...(connection.metadata ?? {}),
      token_type:
        payload.token_type ??
        connection.metadata?.token_type ??
        "bearer",
    },
  };
}


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
    const freshConnection = await ensureFreshXConnection(connection);
    const accessToken = requireAccessToken(freshConnection);
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
    const freshConnection = await ensureFreshXConnection(connection);
    const accessToken = requireAccessToken(freshConnection);
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
