import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { saveConnection } from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "routes";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyGoogleRoutes(apiKey: string) {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          address: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
        },
        destination: {
          address: "1 Google Way, Mountain View, CA 94043",
        },
        travelMode: "DRIVE",
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const googleMessage =
      payload?.error?.message ||
      payload?.message ||
      `Google Routes API returned HTTP ${response.status}.`;

    throw new Error(googleMessage);
  }

  return payload;
}

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_ROUTES_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_ROUTES_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const cookieStore = await cookies();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 },
      );
    }

    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "No active campaign selected." },
        { status: 400 },
      );
    }

    const databaseClient = getAdminClient() ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      console.error("Google Routes connect Aether user lookup failed", appUserError);
      return NextResponse.json(
        { success: false, error: appUserError.message },
        { status: 500 },
      );
    }

    if (!appUser) {
      return NextResponse.json(
        { success: false, error: "Aether user profile not found." },
        { status: 403 },
      );
    }

    if (appUser.is_active === false) {
      return NextResponse.json(
        { success: false, error: "This user is inactive." },
        { status: 403 },
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id, profile_status")
      .eq("organization_id", organizationId)
      .eq("user_id", appUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Google Routes connect membership lookup failed", membershipError);
      return NextResponse.json(
        { success: false, error: membershipError.message },
        { status: 500 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No membership found for active organization. Active org cookie may be stale.",
        },
        { status: 403 },
      );
    }

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { success: false, error: "Your campaign access is not active." },
        { status: 403 },
      );
    }

    await verifyGoogleRoutes(apiKey);

    const connectedAt = new Date().toISOString();

    const connection = await saveConnection({
      organizationId,
      provider: PROVIDER,
      accessToken: "aether_managed_google_routes",
      refreshToken: null,
      expiresAt: null,
      scopes: ["routes:compute"],
      status: "connected",
      metadata: {
        integration_type: "aether_managed_google_routes",
        managed_by: "aether",
        connected_at: connectedAt,
      },
    });

    return NextResponse.json({
      success: true,
      connected: true,
      provider: PROVIDER,
      managedBy: "aether",
      integration: {
        id: connection.id,
        organizationId: connection.organization_id,
        status: connection.status,
        scopes: connection.scopes,
        connectedAt,
      },
    });
  } catch (error: any) {
    console.error("Google Routes connect failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to connect Google Routes.",
      },
      { status: 500 },
    );
  }
}
