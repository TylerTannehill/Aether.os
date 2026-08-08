import type { RawAnalyticsEvent } from "@/lib/analytics/normalize-analytics-events";

export type { RawAnalyticsEvent };

export type IntegrationStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

export interface AnalyticsAccount {
  id: string;
  name: string;
  platform: string;
}

export interface IntegrationConnection {
  id: string;
  organization_id: string;
  provider: string;
  provider_account_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AnalyticsProvider {
  readonly id: string;
  readonly name: string;
  readonly platform: string;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  getStatus(): Promise<IntegrationStatus>;

  fetchAccounts(
    connection: IntegrationConnection
  ): Promise<AnalyticsAccount[]>;

  fetchAnalytics(
    connection: IntegrationConnection,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<RawAnalyticsEvent[]>;
}
