import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getConnection } from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PROVIDER = "website";

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

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
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
