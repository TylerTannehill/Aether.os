import { supabaseAdmin } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getGoogleAccessToken(organizationId: string) {
  const { data: integration, error } = await supabaseAdmin
    .from("organization_integrations")
    .select("access_token,refresh_token,status,expires_at")
    .eq("organization_id", organizationId)
    .eq("provider", "google")
    .single();

  if (error || !integration || integration.status !== "connected") {
    throw new Error("Google Workspace is not connected.");
  }

  if (!integration.refresh_token) {
    return integration.access_token;
  }

  const expiresAt = integration.expires_at
    ? new Date(integration.expires_at).getTime()
    : 0;

  if (integration.access_token && Date.now() < (expiresAt - 60000)) {
    return integration.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth configuration.");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
    }),
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(
      tokenPayload?.error_description ||
        tokenPayload?.error ||
        "Failed to refresh Google access token."
    );
  }

  const expiresAtIso = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
    : null;

  const { error: updateError } = await supabaseAdmin
    .from("organization_integrations")
    .update({
      access_token: tokenPayload.access_token,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("provider", "google");

  if (updateError) {
    throw updateError;
  }

  return tokenPayload.access_token;
}
