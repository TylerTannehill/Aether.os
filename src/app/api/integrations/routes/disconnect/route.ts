import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import {
  disconnect,
  getConnection,
} from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "routes";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "No active campaign selected.",
        },
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
      console.error("Google Routes disconnect Aether user lookup failed", appUserError);

      return NextResponse.json(
        {
          success: false,
          error: appUserError.message,
        },
        { status: 500 },
      );
    }

    if (!appUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Aether user profile not found.",
        },
        { status: 403 },
      );
    }

    if (appUser.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          error: "This user is inactive.",
        },
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
      console.error(
        "Google Routes disconnect membership lookup failed",
        membershipError,
      );

      return NextResponse.json(
        {
          success: false,
          error: membershipError.message,
        },
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
        {
          success: false,
          error: "Your campaign access is not active.",
        },
        { status: 403 },
      );
    }

    const existingConnection = await getConnection(organizationId, PROVIDER);

    if (!existingConnection) {
      return NextResponse.json({
        success: true,
        connected: false,
        provider: PROVIDER,
        message: "Google Routes is already disconnected.",
      });
    }

    await disconnect(organizationId, PROVIDER);

    return NextResponse.json({
      success: true,
      connected: false,
      provider: PROVIDER,
      organizationId,
      message: "Google Routes disconnected.",
    });
  } catch (error: any) {
    console.error("Google Routes disconnect failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to disconnect Google Routes.",
      },
      { status: 500 },
    );
  }
}
