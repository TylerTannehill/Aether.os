import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const PROVIDER = "tiktok";
const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const DEFAULT_REDIRECT_URI =
  "https://aetheros.pro/api/integrations/tiktok/callback";

const SCOPES = [
  "user.info.basic",
  "user.info.stats",
  "video.list",
];

export async function GET() {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;

    if (!clientKey) {
      return NextResponse.json(
        {
          success: false,
          provider: PROVIDER,
          stage: "connect",
          configured: false,
          error: "Missing TIKTOK_CLIENT_KEY.",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          provider: PROVIDER,
          stage: "connect",
          configured: true,
          error: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const state = randomBytes(32).toString("hex");

    cookieStore.set("tiktok_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    cookieStore.set("tiktok_oauth_organization_id", organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    const authorizeUrl = new URL(AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_key", clientKey);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", SCOPES.join(","));
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    return NextResponse.redirect(authorizeUrl);
  } catch (error: any) {
    console.error("TikTok connect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: PROVIDER,
        stage: "connect",
        configured: true,
        error: error?.message || "Unable to start TikTok authorization.",
      },
      { status: 500 }
    );
  }
}
