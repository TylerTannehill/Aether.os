import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

export class MetaProvider implements AnalyticsProvider {
  readonly id = "meta";
  readonly name = "Meta";
  readonly platform = "meta";

  async connect(): Promise<void> {
    throw new Error("Meta OAuth has not been implemented yet.");
  }

  async disconnect(): Promise<void> {
    throw new Error("Meta disconnect has not been implemented yet.");
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "disconnected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    console.log("MetaProvider.fetchAccounts()", {
      organization: connection.organization_id,
      provider: connection.provider,
    });

    return [
      {
        id: "meta-demo-account",
        name:
          connection.provider_account_email || "Connected Meta Account",
        platform: "meta",
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
    console.log("MetaProvider.fetchAnalytics()", {
      organization: connection.organization_id,
      provider: connection.provider,
      hasAccessToken: Boolean(connection.access_token),
      options,
    });

    // TODO: Replace this mock payload with the Meta Graph API.
    return [
      {
        source: "meta",
        department: "digital",
        platform: "facebook",
        campaign_name: "Campaign Launch",
        asset_name: "Welcome Video",
        metric_date: new Date().toISOString().split("T")[0],
        impressions: 12500,
        engagements: 842,
        clicks: 271,
        spend: 187.42,
        sentiment_positive: 712,
        sentiment_negative: 44,
        sentiment_neutral: 86,
        notes: "Mock analytics payload.",
        raw_payload: {
          provider: "meta",
          mocked: true
        } as any,
      },
    ];
  }
}
