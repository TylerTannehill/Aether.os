import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

const META_GRAPH_VERSION = "v23.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

type MetaAdAccount = {
  id: string;
  account_id?: string;
  name?: string;
};

type MetaPage = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id?: string;
  };
};

type InstagramProfile = {
  id: string;
  username?: string;
  name?: string;
};

type InstagramInsightValue = {
  value?: number | string | Record<string, unknown>;
  end_time?: string;
};

type InstagramInsightMetric = {
  id?: string;
  name?: string;
  period?: string;
  values?: InstagramInsightValue[];
  total_value?: {
    value?: number | string | Record<string, unknown>;
  };
};

type MetaInsightRow = {
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start?: string;
  date_stop?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  inline_post_engagement?: string;
  actions?: Array<{
    action_type?: string;
    value?: string;
  }>;
};

type MetaPagingResponse<T> = {
  data?: T[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function requireAccessToken(connection: IntegrationConnection): string {
  const token = connection.access_token?.trim();

  if (!token) {
    throw new Error("Meta connection is missing an access token.");
  }

  return token;
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function actionValue(
  actions: MetaInsightRow["actions"],
  actionTypes: string[]
): number {
  if (!Array.isArray(actions)) {
    return 0;
  }

  return actions.reduce((total, action) => {
    if (!action?.action_type || !actionTypes.includes(action.action_type)) {
      return total;
    }

    return total + numberValue(action.value);
  }, 0);
}

async function fetchAllPages<T>(
  initialUrl: URL,
  accessToken: string
): Promise<T[]> {
  const rows: T[] = [];
  let nextUrl: string | null = initialUrl.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as MetaPagingResponse<T>;

    if (!response.ok || payload.error) {
      throw new Error(
        payload.error?.message ||
          `Meta Graph API request failed with status ${response.status}.`
      );
    }

    if (Array.isArray(payload.data)) {
      rows.push(...payload.data);
    }

    nextUrl = payload.paging?.next || null;
  }

  return rows;
}

async function fetchAdAccounts(
  accessToken: string
): Promise<MetaAdAccount[]> {
  const url = new URL(`${META_GRAPH_BASE}/me/adaccounts`);
  url.searchParams.set("fields", "id,account_id,name");
  url.searchParams.set("limit", "100");

  return fetchAllPages<MetaAdAccount>(url, accessToken);
}

async function fetchAdAccountInsights(
  accountId: string,
  accessToken: string,
  startDate?: string,
  endDate?: string
): Promise<MetaInsightRow[]> {
  const normalizedAccountId = accountId.startsWith("act_")
    ? accountId
    : `act_${accountId}`;

  const url = new URL(
    `${META_GRAPH_BASE}/${normalizedAccountId}/insights`
  );

  url.searchParams.set(
    "fields",
    [
      "account_id",
      "account_name",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
      "date_start",
      "date_stop",
      "impressions",
      "clicks",
      "spend",
      "reach",
      "inline_post_engagement",
      "actions",
    ].join(",")
  );

  url.searchParams.set("level", "ad");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("limit", "500");

  if (startDate && endDate) {
    url.searchParams.set(
      "time_range",
      JSON.stringify({
        since: startDate.slice(0, 10),
        until: endDate.slice(0, 10),
      })
    );
  } else {
    url.searchParams.set("date_preset", "last_30d");
  }

  return fetchAllPages<MetaInsightRow>(url, accessToken);
}

async function fetchManagedPages(
  accessToken: string
): Promise<MetaPage[]> {
  const url = new URL(`${META_GRAPH_BASE}/me/accounts`);
  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account"
  );
  url.searchParams.set("limit", "100");

  return fetchAllPages<MetaPage>(url, accessToken);
}

async function fetchInstagramProfile(
  instagramUserId: string,
  pageAccessToken: string
): Promise<InstagramProfile> {
  const url = new URL(`${META_GRAPH_BASE}/${instagramUserId}`);
  url.searchParams.set("fields", "id,username,name");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${pageAccessToken}`,
    },
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ||
        `Instagram profile request failed with status ${response.status}.`
    );
  }

  return payload as InstagramProfile;
}

async function fetchInstagramAccountInsights(
  instagramUserId: string,
  pageAccessToken: string,
  startDate?: string,
  endDate?: string
): Promise<InstagramInsightMetric[]> {
  const url = new URL(
    `${META_GRAPH_BASE}/${instagramUserId}/insights`
  );

  url.searchParams.set(
    "metric",
    [
      "reach",
      "profile_views",
      "accounts_engaged",
      "total_interactions",
      "likes",
      "comments",
      "shares",
      "saves",
      "replies",
      "website_clicks",
    ].join(",")
  );
  url.searchParams.set("period", "day");

  if (startDate) {
    url.searchParams.set(
      "since",
      String(Math.floor(new Date(startDate).getTime() / 1000))
    );
  }

  if (endDate) {
    url.searchParams.set(
      "until",
      String(Math.floor(new Date(endDate).getTime() / 1000))
    );
  }

  return fetchAllPages<InstagramInsightMetric>(url, pageAccessToken);
}

function instagramMetricValue(
  metrics: InstagramInsightMetric[],
  metricName: string
): number {
  const metric = metrics.find((item) => item.name === metricName);

  if (!metric) {
    return 0;
  }

  if (metric.total_value?.value !== undefined) {
    return numberValue(metric.total_value.value);
  }

  if (!Array.isArray(metric.values)) {
    return 0;
  }

  return metric.values.reduce(
    (total, item) => total + numberValue(item.value),
    0
  );
}

function instagramMetricDate(
  metrics: InstagramInsightMetric[],
  fallbackDate: string
): string {
  for (const metric of metrics) {
    const endTime = metric.values?.find((item) => item.end_time)?.end_time;

    if (endTime) {
      return endTime.slice(0, 10);
    }
  }

  return fallbackDate;
}

export class MetaProvider implements AnalyticsProvider {
  readonly id = "meta";
  readonly name = "Meta";
  readonly platform = "meta";

  async connect(): Promise<void> {
    throw new Error(
      "Meta OAuth is handled by /api/integrations/meta/connect."
    );
  }

  async disconnect(): Promise<void> {
    throw new Error(
      "Meta disconnect is handled by /api/integrations/meta/disconnect."
    );
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "connected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    const accessToken = requireAccessToken(connection);
    const accounts = await fetchAdAccounts(accessToken);

    return accounts.map((account) => ({
      id: account.id,
      name: account.name || `Meta Ad Account ${account.account_id || account.id}`,
      platform: "meta",
    }));
  }

  async fetchAnalytics(
    connection: IntegrationConnection,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<RawAnalyticsEvent[]> {
    const accessToken = requireAccessToken(connection);
    const events: RawAnalyticsEvent[] = [];

    const accounts = await fetchAdAccounts(accessToken);

    for (const account of accounts) {
      const insights = await fetchAdAccountInsights(
        account.id,
        accessToken,
        options?.startDate,
        options?.endDate
      );

      for (const row of insights) {
        const engagements =
          numberValue(row.inline_post_engagement) ||
          actionValue(row.actions, [
            "post_engagement",
            "page_engagement",
            "onsite_conversion.post_save",
          ]);

        events.push({
          source: "meta",
          department: "digital",
          platform: "facebook",
          campaign_name:
            row.campaign_name ||
            row.account_name ||
            account.name ||
            "Meta Campaign",
          asset_name:
            row.ad_name ||
            row.adset_name ||
            row.campaign_name ||
            account.name ||
            "Meta Ad",
          metric_date:
            row.date_start || new Date().toISOString().split("T")[0],
          impressions: numberValue(row.impressions),
          engagements,
          clicks: numberValue(row.clicks),
          spend: numberValue(row.spend),
          sentiment_positive: 0,
          sentiment_negative: 0,
          sentiment_neutral: 0,
          notes: null,
          raw_payload: {
            provider: "meta",
            data_type: "marketing_api",
            account,
            insight: row,
          } as any,
        });
      }
    }

    const pages = await fetchManagedPages(accessToken);

    for (const page of pages) {
      const instagramUserId = page.instagram_business_account?.id;
      const pageAccessToken = page.access_token;

      if (!instagramUserId || !pageAccessToken) {
        continue;
      }

      try {
        const [profile, insights] = await Promise.all([
          fetchInstagramProfile(instagramUserId, pageAccessToken),
          fetchInstagramAccountInsights(
            instagramUserId,
            pageAccessToken,
            options?.startDate,
            options?.endDate
          ),
        ]);

        if (insights.length === 0) {
          continue;
        }

        const engagements =
          instagramMetricValue(insights, "total_interactions") ||
          instagramMetricValue(insights, "accounts_engaged") ||
          [
            "likes",
            "comments",
            "shares",
            "saves",
            "replies",
          ].reduce(
            (total, metric) =>
              total + instagramMetricValue(insights, metric),
            0
          );

        const clicks = instagramMetricValue(
          insights,
          "website_clicks"
        );

        const metricDate = instagramMetricDate(
          insights,
          options?.endDate?.slice(0, 10) ||
            new Date().toISOString().split("T")[0]
        );

        events.push({
          source: "meta",
          department: "digital",
          platform: "instagram",
          campaign_name:
            profile.username ||
            profile.name ||
            page.name ||
            "Instagram",
          asset_name: "Instagram Account",
          metric_date: metricDate,
          impressions: instagramMetricValue(insights, "reach"),
          engagements,
          clicks,
          spend: 0,
          sentiment_positive: 0,
          sentiment_negative: 0,
          sentiment_neutral: 0,
          notes: null,
          raw_payload: {
            provider: "meta",
            data_type: "instagram_account_insights",
            page: {
              id: page.id,
              name: page.name || null,
            },
            instagram_profile: profile,
            insights,
          } as any,
        });
      } catch (error) {
        console.error(
          "[META PROVIDER] Instagram insights failed",
          {
            pageId: page.id,
            instagramUserId,
            error,
          }
        );
      }
    }

    return events;
  }
}
