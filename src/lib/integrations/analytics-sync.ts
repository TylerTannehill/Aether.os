import "server-only";

import { createClient } from "@supabase/supabase-js";

import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize-analytics-events";
import { getProvider } from "@/lib/integrations/registry";
import type { IntegrationConnection } from "@/lib/integrations/connection-store";

const ANALYTICS_PROVIDERS = ["meta", "tiktok", "youtube", "x"] as const;

export type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[number];

export type AnalyticsSyncResult = {
  organizationId: string;
  provider: AnalyticsProvider;
  success: boolean;
  imported: number;
  skipped?: boolean;
  message?: string;
  error?: string;
};

type AnalyticsEventRow = ReturnType<typeof normalizeAnalyticsEvents>[number];

type OrganizationIntegrationRow = {
  organization_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[] | string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isAnalyticsProvider(value: string): value is AnalyticsProvider {
  return (ANALYTICS_PROVIDERS as readonly string[]).includes(value);
}

function normalizeScopes(value: string[] | string | null): string[] | undefined {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  return undefined;
}

function toConnection(row: OrganizationIntegrationRow): IntegrationConnection {
  return {
    organization_id: row.organization_id,
    provider: row.provider,
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expires_at: row.expires_at,
    scopes: normalizeScopes(row.scopes),
    status: row.status ?? "disconnected",
    metadata: row.metadata ?? {},
  } as IntegrationConnection;
}

function getSyncWindow(provider: AnalyticsProvider) {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (provider === "youtube") {
    startDate.setUTCDate(startDate.getUTCDate() - 28);

    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      cleanupStart: startDate.toISOString().slice(0, 10),
      cleanupEnd: endDate.toISOString().slice(0, 10),
    };
  }

  startDate.setUTCDate(startDate.getUTCDate() - 30);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    cleanupStart: startDate.toISOString().slice(0, 10),
    cleanupEnd: endDate.toISOString().slice(0, 10),
  };
}

function getCleanupIdentity(provider: AnalyticsProvider) {
  switch (provider) {
    case "meta":
      return {
        sources: ["meta", "meta_api", "facebook", "facebook_api"],
        platforms: ["meta", "facebook", "instagram"],
      };

    case "tiktok":
      return {
        sources: ["tiktok", "tiktok_api"],
        platforms: ["tiktok"],
      };

    case "youtube":
      return {
        sources: ["youtube", "youtube_api"],
        platforms: ["youtube"],
      };

    case "x":
      return {
        sources: ["x", "x_api", "twitter", "twitter_api"],
        platforms: ["x", "twitter"],
      };
  }
}

async function cleanupProviderWindow(
  organizationId: string,
  provider: AnalyticsProvider,
  startDate: string,
  endDate: string
) {
  const supabase = getAdminClient();
  const identity = getCleanupIdentity(provider);

  const { error } = await supabase
    .from("analytics_events")
    .delete()
    .eq("organization_id", organizationId)
    .in("source", identity.sources)
    .in("platform", identity.platforms)
    .gte("metric_date", startDate)
    .lte("metric_date", endDate);

  if (error) {
    throw new Error(
      `${provider} analytics cleanup failed: ${error.message}`
    );
  }
}

async function insertRows(rows: AnalyticsEventRow[]) {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("analytics_events")
    .insert(rows)
    .select("id");

  if (error) {
    throw new Error(`Analytics insert failed: ${error.message}`);
  }

  return data?.length ?? rows.length;
}

async function getConnectedIntegration(
  organizationId: string,
  provider: AnalyticsProvider
): Promise<OrganizationIntegrationRow | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("organization_integrations")
    .select(
      "organization_id, provider, access_token, refresh_token, expires_at, scopes, status, metadata"
    )
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not load ${provider} integration: ${error.message}`
    );
  }

  if (
    !data ||
    data.status !== "connected" ||
    !data.access_token
  ) {
    return null;
  }

  return data as OrganizationIntegrationRow;
}

export async function syncAnalyticsProviderForOrganization(
  organizationId: string,
  provider: AnalyticsProvider
): Promise<AnalyticsSyncResult> {
  try {
    const integration = await getConnectedIntegration(
      organizationId,
      provider
    );

    if (!integration) {
      return {
        organizationId,
        provider,
        success: true,
        imported: 0,
        skipped: true,
        message: `${provider} is not connected.`,
      };
    }

    const connection = toConnection(integration);
    const providerClient = getProvider(provider);
    const window = getSyncWindow(provider);

    const payload = await providerClient.fetchAnalytics(connection, {
      startDate: window.startDate,
      endDate: window.endDate,
    });

    const rows = normalizeAnalyticsEvents(payload, organizationId);

    /*
     * analytics_events represents the latest provider truth for the active
     * sync window. Fetch/normalize happens before cleanup so a provider/API
     * failure never destroys the last successful analytics snapshot.
     */
    await cleanupProviderWindow(
      organizationId,
      provider,
      window.cleanupStart,
      window.cleanupEnd
    );

    if (rows.length === 0) {
      return {
        organizationId,
        provider,
        success: true,
        imported: 0,
        message: `${provider} sync completed. No analytics were returned.`,
      };
    }

    const imported = await insertRows(rows);

    return {
      organizationId,
      provider,
      success: true,
      imported,
    };
  } catch (error: any) {
    console.error(
      `Analytics sync failed for ${organizationId}/${provider}`,
      error
    );

    return {
      organizationId,
      provider,
      success: false,
      imported: 0,
      error: error?.message || `${provider} analytics sync failed.`,
    };
  }
}

export async function syncAnalyticsForOrganization(
  organizationId: string
): Promise<AnalyticsSyncResult[]> {
  const results: AnalyticsSyncResult[] = [];

  /*
   * Run providers independently. One broken provider should not prevent
   * the organization's other connected analytics sources from refreshing.
   */
  for (const provider of ANALYTICS_PROVIDERS) {
    const result = await syncAnalyticsProviderForOrganization(
      organizationId,
      provider
    );

    results.push(result);
  }

  return results;
}

async function getOrganizationsWithAnalyticsConnections(): Promise<string[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("organization_integrations")
    .select("organization_id, provider, status, access_token")
    .in("provider", [...ANALYTICS_PROVIDERS])
    .eq("status", "connected")
    .not("access_token", "is", null);

  if (error) {
    throw new Error(
      `Could not load connected analytics organizations: ${error.message}`
    );
  }

  const organizationIds = new Set<string>();

  for (const row of data ?? []) {
    if (
      row.organization_id &&
      typeof row.provider === "string" &&
      isAnalyticsProvider(row.provider)
    ) {
      organizationIds.add(row.organization_id);
    }
  }

  return [...organizationIds];
}

export async function syncAnalyticsForAllOrganizations(): Promise<{
  organizations: number;
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: AnalyticsSyncResult[];
}> {
  const organizationIds = await getOrganizationsWithAnalyticsConnections();
  const results: AnalyticsSyncResult[] = [];

  /*
   * Organizations are intentionally processed one at a time so an hourly
   * scheduler does not create an uncontrolled burst against every provider.
   */
  for (const organizationId of organizationIds) {
    const organizationResults = await syncAnalyticsForOrganization(
      organizationId
    );

    results.push(...organizationResults);
  }

  const attempted = results.filter((result) => !result.skipped).length;
  const succeeded = results.filter(
    (result) => !result.skipped && result.success
  ).length;
  const failed = results.filter((result) => !result.success).length;
  const skipped = results.filter((result) => result.skipped).length;

  return {
    organizations: organizationIds.length,
    attempted,
    succeeded,
    failed,
    skipped,
    results,
  };
}
