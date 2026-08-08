import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

const YOUTUBE_CHANNELS_URL =
  "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_ANALYTICS_URL =
  "https://youtubeanalytics.googleapis.com/v2/reports";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type YouTubeChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type YouTubeAnalyticsResponse = {
  columnHeaders?: Array<{
    name?: string;
    columnType?: string;
    dataType?: string;
  }>;
  rows?: Array<Array<string | number | null>>;
  error?: {
    message?: string;
  };
};

function toDateOnly(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 28);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

async function refreshAccessToken(
  connection: IntegrationConnection
): Promise<string> {
  if (!connection.refresh_token) {
    throw new Error(
      "The YouTube access token expired and no refresh token is available. Reconnect YouTube."
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required to refresh YouTube access."
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        "Unable to refresh the YouTube access token."
    );
  }

  return String(payload.access_token);
}

async function youtubeFetch(
  url: string,
  connection: IntegrationConnection
): Promise<Response> {
  if (!connection.access_token) {
    throw new Error("YouTube is connected without an access token.");
  }

  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
    },
    cache: "no-store",
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken(connection);

  response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${refreshedAccessToken}`,
    },
    cache: "no-store",
  });

  return response;
}

async function getChannel(
  connection: IntegrationConnection
): Promise<{ id: string; title: string }> {
  const params = new URLSearchParams({
    part: "snippet",
    mine: "true",
  });

  const response = await youtubeFetch(
    `${YOUTUBE_CHANNELS_URL}?${params.toString()}`,
    connection
  );

  const payload = (await response.json()) as YouTubeChannelResponse;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Unable to load the connected YouTube channel."
    );
  }

  const channel = payload.items?.[0];

  if (!channel?.id) {
    throw new Error(
      "No YouTube channel was found for the connected Google account."
    );
  }

  return {
    id: channel.id,
    title:
      channel.snippet?.title ||
      connection.provider_account_email ||
      "Connected YouTube Channel",
  };
}

export class YouTubeProvider implements AnalyticsProvider {
  readonly id = "youtube";
  readonly name = "YouTube";
  readonly platform = "youtube";

  async connect(): Promise<void> {
    throw new Error(
      "YouTube OAuth is handled by /api/integrations/youtube/connect."
    );
  }

  async disconnect(): Promise<void> {
    throw new Error(
      "YouTube disconnect is handled by /api/integrations/youtube/disconnect."
    );
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "connected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    const channel = await getChannel(connection);

    return [
      {
        id: channel.id,
        name: channel.title,
        platform: "youtube",
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
    const channel = await getChannel(connection);

    const startDate = toDateOnly(options?.startDate) || defaultStartDate();
    const endDate = toDateOnly(options?.endDate) || defaultEndDate();

    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate,
      endDate,
      dimensions: "day",
      metrics: "views,likes,comments,shares",
      sort: "day",
    });

    const response = await youtubeFetch(
      `${YOUTUBE_ANALYTICS_URL}?${params.toString()}`,
      connection
    );

    const payload = (await response.json()) as YouTubeAnalyticsResponse;

    if (!response.ok) {
      throw new Error(
        payload?.error?.message || "Unable to load YouTube analytics."
      );
    }

    const headers = (payload.columnHeaders || []).map(
      (header) => header.name || ""
    );

    const rows = payload.rows || [];

    return rows.map((row) => {
      const values: Record<string, string | number | null> = {};

      headers.forEach((header, index) => {
        values[header] = row[index] ?? null;
      });

      const views = Number(values.views || 0);
      const likes = Number(values.likes || 0);
      const comments = Number(values.comments || 0);
      const shares = Number(values.shares || 0);

      return {
        source: "youtube_api",
        department: "digital",
        platform: "youtube",
        campaign_name: channel.title,
        asset_name: null,
        metric_date: String(values.day || startDate),

        // Aether's current analytics schema has no dedicated `views` column.
        // Preserve the real YouTube view count in the existing impressions slot;
        // raw_payload keeps the native metric name/value for future schema work.
        impressions: views,
        engagements: likes + comments + shares,
        clicks: 0,
        spend: 0,

        sentiment_positive: 0,
        sentiment_negative: 0,
        sentiment_neutral: 0,

        notes:
          "YouTube API: views stored in Aether's impressions field; engagement = likes + comments + shares.",

        raw_payload: {
          provider: "youtube",
          channel_id: channel.id,
          channel_title: channel.title,
          day: values.day || null,
          views,
          likes,
          comments,
          shares,
          analytics_window: {
            startDate,
            endDate,
          },
        },
      };
    });
  }
}
