import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const META_GRAPH_VERSION = "v23.0";
const META_TOKEN_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`;
const META_ME_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/me`;

export async function GET(request: Request) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthError = requestUrl.searchParams.get("error");
    const oauthErrorDescription =
      requestUrl.searchParams.get("error_description") ||
      requestUrl.searchParams.get("error_reason");

    if (oauthError) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=${encodeURIComponent(
          oauthErrorDescription || oauthError
        )}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=missing_code_or_state`
      );
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("meta_oauth_state")?.value;
    const organizationId = cookieStore.get("meta_oauth_org_id")?.value;
    const storedReturnTo = cookieStore.get("meta_oauth_return_to")?.value;
    const returnTo =
      storedReturnTo === "/team-aether/dashboard"
        ? "/team-aether/dashboard"
        : "/dashboard/tools";

    if (!expectedState || expectedState !== state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=invalid_state`
      );
    }

    if (!organizationId) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=missing_org`
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=missing_meta_env`
      );
    }

    const tokenUrl = new URL(META_TOKEN_URL);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      const reason =
        tokenPayload?.error?.message ||
        tokenPayload?.error_description ||
        tokenPayload?.error ||
        "token_exchange_failed";

      console.error("[META CALLBACK] Token exchange failed", tokenPayload);

      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=${encodeURIComponent(
          String(reason)
        )}`
      );
    }

    const accessToken = String(tokenPayload.access_token);

    const meUrl = new URL(META_ME_URL);
    meUrl.searchParams.set("fields", "id,name");
    meUrl.searchParams.set("access_token", accessToken);

    const meResponse = await fetch(meUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const mePayload = await meResponse.json();

    if (!meResponse.ok) {
      const reason =
        mePayload?.error?.message || "meta_account_lookup_failed";

      console.error("[META CALLBACK] Account lookup failed", mePayload);

      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=${encodeURIComponent(
          String(reason)
        )}`
      );
    }

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
          .toISOString()
      : null;

    const grantedScopes = [
      "ads_read",
      "business_management",
      "pages_show_list",
      "pages_read_engagement",
    ];

    const { error: upsertError } = await supabaseAdmin
      .from("organization_integrations")
      .upsert(
        {
          organization_id: organizationId,
          provider: "meta",
          provider_account_email: null,
          access_token: accessToken,
          refresh_token: null,
          expires_at: expiresAt,
          scopes: grantedScopes,
          status: "connected",
          metadata: {
            meta_user_id: mePayload?.id || null,
            name: mePayload?.name || null,
            graph_version: META_GRAPH_VERSION,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,provider",
        }
      );

    if (upsertError) {
      console.error("[META CALLBACK] Connection save failed", upsertError);

      return NextResponse.redirect(
        `${appUrl}/dashboard/tools?meta=error&reason=${encodeURIComponent(
          upsertError.message
        )}`
      );
    }

    console.log("[META CALLBACK] Connected", {
      organizationId,
      metaUserId: mePayload?.id || null,
      metaUserName: mePayload?.name || null,
      accessTokenLength: accessToken.length,
    });

    const response = NextResponse.redirect(
      `${appUrl}${returnTo}?meta=connected`
    );

    response.cookies.delete("meta_oauth_state");
    response.cookies.delete("meta_oauth_org_id");
    response.cookies.delete("meta_oauth_return_to");

    return response;
  } catch (error: any) {
    console.error("[META CALLBACK] Failed", error);

    return NextResponse.redirect(
      `${appUrl}/dashboard/tools?meta=error&reason=${encodeURIComponent(
        error?.message || "meta_callback_failed"
      )}`
    );
  }
}
