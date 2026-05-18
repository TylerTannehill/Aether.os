import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: Request) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthError = requestUrl.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=${encodeURIComponent(
          oauthError
        )}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=missing_code_or_state`
      );
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("google_oauth_state")?.value;
    const organizationId = cookieStore.get("google_oauth_org_id")?.value;

    if (!expectedState || expectedState !== state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=invalid_state`
      );
    }

    if (!organizationId) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=missing_org`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=missing_google_env`
      );
    }

    const redirectUri = `${appUrl}/api/integrations/google/callback`;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=${encodeURIComponent(
          tokenPayload?.error_description ||
            tokenPayload?.error ||
            "token_exchange_failed"
        )}`
      );
    }

    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    const supabase = await createClient();

    const { data: existingIntegration } = await supabase
      .from("organization_integrations")
      .select("refresh_token")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .maybeSingle();

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
          .toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("organization_integrations")
      .upsert(
        {
          organization_id: organizationId,
          provider: "google",
          provider_account_email: userInfo?.email || null,
          access_token: tokenPayload.access_token,
          refresh_token:
            tokenPayload.refresh_token ||
            existingIntegration?.refresh_token ||
            null,
          expires_at: expiresAt,
          scopes: String(tokenPayload.scope || "")
            .split(" ")
            .filter(Boolean),
          status: "connected",
          metadata: {
            google_user_id: userInfo?.id || null,
            name: userInfo?.name || null,
            picture: userInfo?.picture || null,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,provider",
        }
      );

    if (upsertError) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?google=error&reason=${encodeURIComponent(
          upsertError.message
        )}`
      );
    }

    const response = NextResponse.redirect(
      `${appUrl}/dashboard/tools?google=connected`
    );

    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_oauth_org_id");

    return response;
  } catch (error: any) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/tools?google=error&reason=${encodeURIComponent(
        error?.message || "google_callback_failed"
      )}`
    );
  }
}