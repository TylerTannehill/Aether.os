import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const META_AUTH_URL = "https://www.facebook.com/v23.0/dialog/oauth";

const META_SCOPES = [
  "ads_read",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value;

    const requestUrl = new URL(request.url);
    const requestedReturnTo = requestUrl.searchParams.get("returnTo");
    const oauthReturnTo =
      requestedReturnTo === "team-aether"
        ? "/team-aether/dashboard"
        : "/dashboard/tools";

    if (!activeOrganizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "No active campaign selected.",
        },
        { status: 400 }
      );
    }

    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing META_APP_ID or META_REDIRECT_URI.",
        },
        { status: 500 }
      );
    }

    const state = crypto.randomUUID();

    const authUrl = new URL(META_AUTH_URL);

    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", META_SCOPES.join(","));
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set("meta_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set("meta_oauth_org_id", activeOrganizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set("meta_oauth_return_to", oauthReturnTo, {
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
        error: error?.message || "Failed to start Meta connection.",
      },
      { status: 500 }
    );
  }
}
