import { supabase } from "@/lib/supabase";

export type IntegrationConnection = {
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
  created_at: string;
  updated_at: string;
};

export type SaveConnectionInput = {
  organizationId: string;
  provider: string;
  providerAccountEmail?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
  scopes?: string[] | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
};

export async function getConnection(
  organizationId: string,
  provider: string
): Promise<IntegrationConnection | null> {
  console.log("[GET CONNECTION] Request", {
    organizationId,
    provider,
  });

  const { data, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();

  console.log("[GET CONNECTION] Result", {
    organizationId,
    provider,
    data,
    error,
  });

  if (error) throw error;

  return (data as IntegrationConnection | null) ?? null;
}

export async function saveConnection(
  input: SaveConnectionInput
): Promise<IntegrationConnection> {
  const payload = {
    organization_id: input.organizationId,
    provider: input.provider,
    provider_account_email: input.providerAccountEmail ?? null,
    access_token: input.accessToken ?? null,
    refresh_token: input.refreshToken ?? null,
    expires_at: input.expiresAt ?? null,
    scopes: input.scopes ?? null,
    status: input.status ?? "connected",
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("organization_integrations")
    .upsert(payload, {
      onConflict: "organization_id,provider",
    })
    .select()
    .single();

  if (error) throw error;

  return data as IntegrationConnection;
}

export async function updateTokens(
  organizationId: string,
  provider: string,
  values: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("organization_integrations")
    .update({
      access_token: values.accessToken,
      refresh_token: values.refreshToken,
      expires_at: values.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("provider", provider);

  if (error) throw error;
}

export async function disconnect(
  organizationId: string,
  provider: string
): Promise<void> {
  const { error } = await supabase
    .from("organization_integrations")
    .update({
      status: "disconnected",
      access_token: null,
      refresh_token: null,
      expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("provider", provider);

  if (error) throw error;
}

export async function isConnected(
  organizationId: string,
  provider: string
): Promise<boolean> {
  const connection = await getConnection(organizationId, provider);

  return Boolean(
    connection &&
      connection.status === "connected" &&
      connection.access_token
  );
}
