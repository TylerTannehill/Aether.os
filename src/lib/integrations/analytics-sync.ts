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
  inserted?: number;
  updated?: number;
  unchanged?: number;
  skipped?: boolean;
  message?: string;
  error?: string;
};

type AnalyticsEventRow = ReturnType<typeof normalizeAnalyticsEvents>[number];

type AnalyticsWriteCounts = {
  imported: number;
  inserted: number;
  updated: number;
  unchanged: number;
};

function parseWriteCount(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Analytics RPC returned an invalid ${field} count: ${String(value)}`);
  }
  return parsed;
}

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
    };
  }

  startDate.setUTCDate(startDate.getUTCDate() - 30);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

async function upsertRows(rows: AnalyticsEventRow[]) {
  if (rows.length === 0) {
    return { imported: 0, inserted: 0, updated: 0, unchanged: 0 };
  }

  const rowsWithIdentity = rows.filter(
    (row) => typeof row.external_id === "string" && row.external_id.trim().length > 0
  );

  if (rowsWithIdentity.length !== rows.length) {
    throw new Error(
      `Analytics sync refused to write ${rows.length - rowsWithIdentity.length} row(s) without a stable external_id.`
    );
  }

  // PostgreSQL cannot update the same conflict target twice in one upsert.
  // Keep the last occurrence of each provider record before writing the batch.
  const uniqueRows = new Map<string, AnalyticsEventRow>();
  for (const row of rowsWithIdentity) {
    const key = JSON.stringify([
      row.organization_id,
      row.source,
      row.platform,
      row.external_id,
    ]);
    uniqueRows.set(key, row);
  }
  const deduplicatedRows = [...uniqueRows.values()];

  if (deduplicatedRows.length !== rowsWithIdentity.length) {
    console.warn(
      `Analytics sync removed ${rowsWithIdentity.length - deduplicatedRows.length} duplicate row(s) before upsert.`
    );
  }

  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "upsert_analytics_events_if_changed",
    { p_rows: deduplicatedRows }
  );

  if (error) {
    throw new Error(`Analytics conditional upsert failed: ${error.message}`);
  }

  // A RETURNS TABLE function is exposed as an array by PostgREST.
  // Fail closed if its response shape changes rather than silently reporting success.
  if (!Array.isArray(data) || data.length !== 1 || !data[0]) {
    throw new Error("Analytics conditional upsert returned an unexpected response.");
  }

  const counts = data[0] as Record<string, unknown>;
  const inserted = parseWriteCount(counts.inserted, "inserted");
  const updated = parseWriteCount(counts.updated, "updated");
  const unchanged = parseWriteCount(counts.unchanged, "unchanged");

  if (inserted + updated + unchanged !== deduplicatedRows.length) {
    throw new Error("Analytics conditional upsert counts do not match the input batch.");
  }

  return {
    // Preserve the existing 'imported' meaning: accepted, deduplicated records.
    imported: deduplicatedRows.length,
    inserted,
    updated,
    unchanged,
  } satisfies AnalyticsWriteCounts;
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

    const fetchStartedAt = Date.now();
    const payload = await providerClient.fetchAnalytics(connection, {
      startDate: window.startDate,
      endDate: window.endDate,
    });

    const fetchMs = Date.now() - fetchStartedAt;
    const normalizeStartedAt = Date.now();
    const rows = normalizeAnalyticsEvents(payload, organizationId);
    const normalizeMs = Date.now() - normalizeStartedAt;

    /*
     * Each provider row now carries a stable external_id. Existing rows are
     * updated in place and new rows are inserted, so the hourly sync no longer
     * deletes and rebuilds the active analytics window.
     */
    if (rows.length === 0) {
      console.info("Analytics provider timing", { provider, organizationId, fetched: payload.length, fetchMs, normalizeMs, writeMs: 0 });
      return {
        organizationId,
        provider,
        success: true,
        imported: 0,
        message: `${provider} sync completed. No analytics were returned.`,
      };
    }

    const writeStartedAt = Date.now();
    const writeCounts = await upsertRows(rows);
    const writeMs = Date.now() - writeStartedAt;
    console.info("Analytics provider timing", {
      provider,
      organizationId,
      fetched: payload.length,
      normalized: rows.length,
      ...writeCounts,
      fetchMs,
      normalizeMs,
      writeMs,
    });

    return {
      organizationId,
      provider,
      success: true,
      ...writeCounts,
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
