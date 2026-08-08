import {
  AnalyticsAccount,
  AnalyticsProvider,
  IntegrationConnection,
  IntegrationStatus,
  RawAnalyticsEvent,
} from "../types";

export class XProvider implements AnalyticsProvider {
  readonly id = "x";
  readonly name = "X";
  readonly platform = "x";

  async connect(): Promise<void> {
    throw new Error("X OAuth has not been implemented yet.");
  }

  async disconnect(): Promise<void> {
    throw new Error("X disconnect has not been implemented yet.");
  }

  async getStatus(): Promise<IntegrationStatus> {
    return "disconnected";
  }

  async fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]> {
    console.log("XProvider.fetchAccounts()", {
      organization: connection.organization_id,
      provider: connection.provider,
    });

    return [
      {
        id: "x-demo-account",
        name: connection.provider_account_email || "Connected X Account",
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
    console.log("XProvider.fetchAnalytics()", {
      organization: connection.organization_id,
      provider: connection.provider,
      hasAccessToken: Boolean(connection.access_token),
      options,
    });

    return [];
  }
}