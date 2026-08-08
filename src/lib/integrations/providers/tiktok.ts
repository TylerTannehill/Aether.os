import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

export class TikTokProvider implements AnalyticsProvider {
  readonly id = "tiktok";
  readonly name = "TikTok";
  readonly platform = "tiktok";

  async connect(): Promise<void> {
    throw new Error("TikTok OAuth has not been implemented yet.");
  }

  async disconnect(): Promise<void> {
    throw new Error("TikTok disconnect has not been implemented yet.");
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "disconnected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    console.log("TikTokProvider.fetchAccounts()", {
      organization: connection.organization_id,
      provider: connection.provider,
    });
    return [
      {
        id: "tiktok-demo-account",
        name: connection.provider_account_email || "Connected TikTok Account",
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
    console.log("TikTokProvider.fetchAnalytics()", {
      organization: connection.organization_id,
      provider: connection.provider,
      hasAccessToken: Boolean(connection.access_token),
      options,
    });

    return [];
  }
}