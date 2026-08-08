import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

export class YouTubeProvider implements AnalyticsProvider {
  readonly id = "youtube";
  readonly name = "YouTube";
  readonly platform = "youtube";

  async connect(): Promise<void> {
    throw new Error("YouTube OAuth has not been implemented yet.");
  }

  async disconnect(): Promise<void> {
    throw new Error("YouTube disconnect has not been implemented yet.");
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "disconnected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    console.log("YouTubeProvider.fetchAccounts()", {
      organization: connection.organization_id,
      provider: connection.provider,
    });

    return [
      {
        id: "youtube-demo-account",
        name: connection.provider_account_email || "Connected YouTube Channel",
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
    console.log("YouTubeProvider.fetchAnalytics()", {
      organization: connection.organization_id,
      provider: connection.provider,
      hasAccessToken: Boolean(connection.access_token),
      options,
    });

    return [];
  }
}