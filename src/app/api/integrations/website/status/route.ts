import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getConnection } from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PROVIDER = "website";

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

export async function GET() {
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
          connected: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "No active campaign selected.",
        },
        { status: 400 }
      );
    }

    const databaseClient = getAdminClient() ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      console.error("Website status Aether user lookup failed", appUserError);
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: appUserError.message,
        },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "Aether user profile is not active.",
        },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("organization_id, profile_status")
      .eq("organization_id", organizationId)
      .eq("user_id", appUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Website status membership lookup failed", membershipError);

      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: membershipError.message,
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "You do not have access to this organization.",
        },
        { status: 403 }
      );
    }

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "Your campaign access is not active.",
        },
        { status: 403 }
      );
    }

    const connection = await getConnection(organizationId, PROVIDER);

    const connected = Boolean(
      connection &&
        connection.status === "connected" &&
        connection.access_token
    );

    return NextResponse.json({
      success: true,
      connected,
      provider: PROVIDER,
      integration: connection
        ? {
            id: connection.id,
            status: connection.status,
            scopes: connection.scopes,
            endpoint: "/api/integrations/website/ingest",
            hasApiKey: Boolean(connection.access_token),
            metadata: connection.metadata,
            createdAt: connection.created_at,
            updatedAt: connection.updated_at,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Website status failed", error);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error?.message || "Failed to load Website API status.",
      },
      { status: 500 }
    );
  }
}
