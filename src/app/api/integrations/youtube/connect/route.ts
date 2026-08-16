import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const YOUTUBE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { success: false, error: "No active campaign selected." },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const requestUrl = new URL(request.url);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

    const requestedReturnTo = requestUrl.searchParams.get("returnTo");
    const oauthReturnTo =
      requestedReturnTo === "team-aether"
        ? "/team-aether/dashboard"
        : "/dashboard/tools";

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Missing GOOGLE_CLIENT_ID." },
        { status: 500 }
      );
    }

    const state = crypto.randomUUID();
    const redirectUri = `${appUrl}/api/integrations/youtube/callback`;
    const authUrl = new URL(GOOGLE_AUTH_URL);

    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set("youtube_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set("youtube_oauth_org_id", activeOrganizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set("youtube_oauth_return_to", oauthReturnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to start YouTube connection.",
      },
      { status: 500 }
    );
  }
}
