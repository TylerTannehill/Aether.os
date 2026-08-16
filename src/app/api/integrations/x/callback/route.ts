import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { saveConnection } from "@/lib/integrations/connection-store";

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL = "https://api.x.com/2/users/me";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    requestUrl.origin;

  let oauthReturnTo = "/dashboard/integrations";

  try {
    const cookieStore = await cookies();
    oauthReturnTo =
      cookieStore.get("x_oauth_return_to")?.value === "/team-aether/dashboard"
        ? "/team-aether/dashboard"
        : "/dashboard/integrations";

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=not_authenticated`
      );
    }

    const oauthError = requestUrl.searchParams.get("error");
    const oauthErrorDescription =
      requestUrl.searchParams.get("error_description");

    if (oauthError) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=${encodeURIComponent(
          oauthErrorDescription || oauthError
        )}`
      );
    }

    const code = requestUrl.searchParams.get("code");
    const returnedState = requestUrl.searchParams.get("state");

    const expectedState =
      cookieStore.get("x_oauth_state")?.value ?? null;
    const codeVerifier =
      cookieStore.get("x_oauth_code_verifier")?.value ?? null;
    const organizationId =
      cookieStore.get("x_oauth_organization_id")?.value ??
      cookieStore.get("active_organization_id")?.value ??
      null;

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=missing_code`
      );
    }

    if (!returnedState || !expectedState || returnedState !== expectedState) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=invalid_state`
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=missing_code_verifier`
      );
    }

    if (!organizationId) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=missing_organization`
      );
    }

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=missing_x_env`
      );
    }

    const redirectUri = `${appUrl}/api/integrations/x/callback`;

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      cache: "no-store",
    });

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      console.error("X token exchange failed:", tokenPayload);

      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=${encodeURIComponent(
          tokenPayload?.error_description ||
            tokenPayload?.error ||
            "token_exchange_failed"
        )}`
      );
    }

    const meResponse = await fetch(
      `${X_ME_URL}?user.fields=id,name,username`,
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
        cache: "no-store",
      }
    );

    const mePayload = await meResponse.json();

    if (!meResponse.ok || !mePayload?.data?.id) {
      console.error("X user lookup failed:", mePayload);

      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?x=error&reason=${encodeURIComponent(
          mePayload?.detail ||
            mePayload?.title ||
            "x_user_lookup_failed"
        )}`
      );
    }

    const expiresAt = tokenPayload.expires_in
      ? new Date(
          Date.now() + Number(tokenPayload.expires_in) * 1000
        ).toISOString()
      : undefined;

    await saveConnection({
      organizationId,
      provider: "x",
      status: "connected",
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token || undefined,
      expiresAt,
      scopes: String(tokenPayload.scope || "")
        .split(" ")
        .filter(Boolean),
      providerAccountEmail: undefined,
      metadata: {
        provider_account_id: String(mePayload.data.id),
        x_user_id: String(mePayload.data.id),
        username: mePayload.data.username || null,
        name: mePayload.data.name || null,
      },
    });

    cookieStore.delete("x_oauth_state");
    cookieStore.delete("x_oauth_code_verifier");
    cookieStore.delete("x_oauth_organization_id");
    cookieStore.delete("x_oauth_return_to");

    return NextResponse.redirect(
      `${appUrl}${oauthReturnTo}?x=connected`
    );
  } catch (error: any) {
    console.error("X callback failed:", error);

    return NextResponse.redirect(
      `${appUrl}${oauthReturnTo}?x=error&reason=${encodeURIComponent(
        error?.message || "x_callback_failed"
      )}`
    );
  }
}
