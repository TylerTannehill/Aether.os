import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { IntegrationConnection } from "@/lib/integrations/connection-store";

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const REFRESH_BUFFER_MS = 20 * 60 * 1000;

type TikTokRefreshResponse = {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  log_id?: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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

function tokenNeedsRefresh(connection: IntegrationConnection): boolean {
  if (!connection.access_token?.trim()) {
    return true;
  }

  if (!connection.expires_at) {
    return true;
  }

  const expiresAtMs = Date.parse(connection.expires_at);

  if (!Number.isFinite(expiresAtMs)) {
    return true;
  }

  return expiresAtMs <= Date.now() + REFRESH_BUFFER_MS;
}

export async function ensureFreshTikTokConnection(
  connection: IntegrationConnection
): Promise<IntegrationConnection> {
  if (!tokenNeedsRefresh(connection)) {
    return connection;
  }

  const organizationId = connection.organization_id?.trim();
  const refreshToken = connection.refresh_token?.trim();
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();

  if (!organizationId) {
    throw new Error("TikTok organization context is missing.");
  }

  if (!refreshToken) {
    throw new Error(
      "TikTok access token expired and no refresh token is available. Reconnect TikTok."
    );
  }

  if (!clientKey || !clientSecret) {
    throw new Error(
      "TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are required."
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as TikTokRefreshResponse;

  if (!response.ok || !payload.access_token) {
    const detail =
      payload.error_description ||
      payload.error ||
      `TikTok token refresh failed (${response.status}).`;

    throw new Error(
      `${detail}${
        payload.log_id ? ` TikTok log ID: ${payload.log_id}.` : ""
      }`
    );
  }

  const nextRefreshToken = payload.refresh_token?.trim() || refreshToken;
  const expiresAt =
    typeof payload.expires_in === "number"
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null;

  if (!expiresAt) {
    throw new Error("TikTok refresh response did not include expires_in.");
  }

  const supabase = getAdminClient();

  const { error } = await supabase
    .from("organization_integrations")
    .update({
      access_token: payload.access_token,
      refresh_token: nextRefreshToken,
      expires_at: expiresAt,
      scopes: payload.scope
        ? payload.scope
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean)
        : connection.scopes ?? null,
      metadata: {
        ...(connection.metadata ?? {}),
        open_id:
          payload.open_id ??
          (connection.metadata?.open_id as string | undefined) ??
          null,
        token_type:
          payload.token_type ??
          (connection.metadata?.token_type as string | undefined) ??
          "Bearer",
        refresh_expires_in:
          payload.refresh_expires_in ??
          connection.metadata?.refresh_expires_in ??
          null,
      },
      status: "connected",
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("provider", "tiktok");

  if (error) {
    throw new Error(`Could not persist refreshed TikTok token: ${error.message}`);
  }

  return {
    ...connection,
    access_token: payload.access_token,
    refresh_token: nextRefreshToken,
    expires_at: expiresAt,
    scopes: payload.scope
      ? payload.scope
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : connection.scopes,
    status: "connected",
    metadata: {
      ...(connection.metadata ?? {}),
      open_id:
        payload.open_id ??
        (connection.metadata?.open_id as string | undefined) ??
        null,
      token_type:
        payload.token_type ??
        (connection.metadata?.token_type as string | undefined) ??
        "Bearer",
      refresh_expires_in:
        payload.refresh_expires_in ??
        connection.metadata?.refresh_expires_in ??
        null,
    },
  };
}
