import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const YOUTUBE_CHANNELS_URL =
  "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true";

export async function GET(request: Request) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  let oauthReturnTo = "/dashboard/tools";

  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthError = requestUrl.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=${encodeURIComponent(
          oauthError
        )}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=missing_code_or_state`
      );
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("youtube_oauth_state")?.value;
    const organizationId = cookieStore.get("youtube_oauth_org_id")?.value;
    oauthReturnTo =
      cookieStore.get("youtube_oauth_return_to")?.value === "/team-aether/dashboard"
        ? "/team-aether/dashboard"
        : "/dashboard/tools";

    if (!expectedState || expectedState !== state) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=invalid_state`
      );
    }

    if (!organizationId) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=missing_org`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=missing_google_env`
      );
    }

    const redirectUri = `${appUrl}/api/integrations/youtube/callback`;

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
        `${appUrl}${oauthReturnTo}?youtube=error&reason=${encodeURIComponent(
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

    const channelResponse = await fetch(YOUTUBE_CHANNELS_URL, {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    const channelPayload = await channelResponse.json();

    if (!channelResponse.ok) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=${encodeURIComponent(
          channelPayload?.error?.message || "youtube_channel_lookup_failed"
        )}`
      );
    }

    const channel = channelPayload?.items?.[0] || null;

    if (!channel?.id) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=no_youtube_channel`
      );
    }

    const supabase = supabaseAdmin;

    const { data: existingIntegration } = await supabase
      .from("organization_integrations")
      .select("refresh_token")
      .eq("organization_id", organizationId)
      .eq("provider", "youtube")
      .maybeSingle();

    const expiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("organization_integrations")
      .upsert(
        {
          organization_id: organizationId,
          provider: "youtube",
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
            youtube_channel_id: channel.id,
            youtube_channel_title: channel?.snippet?.title || null,
            youtube_channel_handle: channel?.snippet?.customUrl || null,
            youtube_channel_thumbnail:
              channel?.snippet?.thumbnails?.default?.url || null,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,provider",
        }
      );

    if (upsertError) {
      return NextResponse.redirect(
        `${appUrl}${oauthReturnTo}?youtube=error&reason=${encodeURIComponent(
          upsertError.message
        )}`
      );
    }

    const response = NextResponse.redirect(
      `${appUrl}${oauthReturnTo}?youtube=connected`
    );

    response.cookies.delete("youtube_oauth_state");
    response.cookies.delete("youtube_oauth_org_id");
    response.cookies.delete("youtube_oauth_return_to");

    return response;
  } catch (error: any) {
    return NextResponse.redirect(
      `${appUrl}${oauthReturnTo}?youtube=error&reason=${encodeURIComponent(
        error?.message || "youtube_callback_failed"
      )}`
    );
  }
}
