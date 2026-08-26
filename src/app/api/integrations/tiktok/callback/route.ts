import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { saveConnection } from "@/lib/integrations/connection-store";

const PROVIDER = "tiktok";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const DEFAULT_REDIRECT_URI =
  "https://aetheros.pro/api/integrations/tiktok/callback";
const DEFAULT_APP_URL = "https://aetheros.pro";

type TikTokTokenResponse = {
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

function integrationsUrl(
  appUrl: string,
  status: "connected" | "error",
  reason?: string
) {
  const url = new URL("/dashboard/integrations", appUrl);
  url.searchParams.set("tiktok", status);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;

    if (!clientKey || !clientSecret) {
      throw new Error(
        "TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are required."
      );
    }

    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");
    const oauthErrorDescription =
      request.nextUrl.searchParams.get("error_description");

    const cookieStore = await cookies();
    const expectedState =
      cookieStore.get("tiktok_oauth_state")?.value ?? null;
    const organizationId =
      cookieStore.get("tiktok_oauth_organization_id")?.value ?? null;

    if (oauthError) {
      throw new Error(oauthErrorDescription || oauthError);
    }

    if (!code) {
      throw new Error("TikTok did not return an authorization code.");
    }

    if (!expectedState || !returnedState || returnedState !== expectedState) {
      throw new Error("TikTok OAuth state validation failed.");
    }

    if (!organizationId) {
      throw new Error("TikTok OAuth organization context is missing.");
    }

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    const tokenPayload =
      (await tokenResponse.json()) as TikTokTokenResponse;

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new Error(
        tokenPayload.error_description ||
          tokenPayload.error ||
          "TikTok token exchange failed."
      );
    }

    const expiresAt =
      typeof tokenPayload.expires_in === "number"
        ? new Date(
            Date.now() + tokenPayload.expires_in * 1000
          ).toISOString()
        : null;

    const scopes = String(tokenPayload.scope || "")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);

    await saveConnection({
      organizationId,
      provider: PROVIDER,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? null,
      expiresAt,
      scopes,
      status: "connected",
      metadata: {
        open_id: tokenPayload.open_id ?? null,
        token_type: tokenPayload.token_type ?? "Bearer",
        refresh_expires_in:
          tokenPayload.refresh_expires_in ?? null,
        sandbox: false,
      },
    });

    const response = NextResponse.redirect(
      integrationsUrl(appUrl, "connected")
    );

    response.cookies.delete("tiktok_oauth_state");
    response.cookies.delete("tiktok_oauth_organization_id");

    return response;
  } catch (error: any) {
    console.error("TikTok callback failed:", error);

    const response = NextResponse.redirect(
      integrationsUrl(
        appUrl,
        "error",
        error?.message || "tiktok_callback_failed"
      )
    );

    response.cookies.delete("tiktok_oauth_state");
    response.cookies.delete("tiktok_oauth_organization_id");

    return response;
  }
}
