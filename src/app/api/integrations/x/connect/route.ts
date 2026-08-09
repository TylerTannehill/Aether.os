import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createHash, randomBytes } from "crypto";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

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
      return NextResponse.json(
        {
          success: false,
          provider: "x",
          stage: "connect",
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      return NextResponse.json(
        {
          success: false,
          provider: "x",
          stage: "connect",
          error: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const clientId = process.env.X_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          provider: "x",
          stage: "connect",
          error: "X_CLIENT_ID is not configured.",
        },
        { status: 500 }
      );
    }

    const requestUrl = new URL(request.url);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      requestUrl.origin;

    const redirectUri = `${appUrl}/api/integrations/x/callback`;

    const state = base64UrlEncode(randomBytes(32));
    const codeVerifier = base64UrlEncode(randomBytes(64));
    const codeChallenge = base64UrlEncode(
      createHash("sha256").update(codeVerifier).digest()
    );

    const secure = requestUrl.protocol === "https:";

    cookieStore.set("x_oauth_state", state, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    cookieStore.set("x_oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    cookieStore.set("x_oauth_organization_id", activeOrganizationId, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    const authorizationUrl = new URL(X_AUTHORIZE_URL);

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set(
      "scope",
      "tweet.read users.read offline.access"
    );
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.redirect(authorizationUrl);
  } catch (error: any) {
    console.error("X connect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "x",
        stage: "connect",
        error: error?.message || "Unable to start X connection.",
      },
      { status: 500 }
    );
  }
}
