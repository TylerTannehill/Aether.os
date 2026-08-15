import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          provider: "meta",
          error: "No active campaign selected.",
        },
        { status: 400 }
      );
    }

    const { data: connection, error } = await supabaseAdmin
      .from("organization_integrations")
      .select(
        "id, organization_id, provider, status, scopes, expires_at, metadata, created_at, updated_at"
      )
      .eq("organization_id", organizationId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      console.error("[META STATUS] Lookup failed", error);

      return NextResponse.json(
        {
          success: false,
          connected: false,
          provider: "meta",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const connected = Boolean(
      connection && connection.status === "connected"
    );

    const metadata =
      connection?.metadata &&
      typeof connection.metadata === "object" &&
      !Array.isArray(connection.metadata)
        ? (connection.metadata as Record<string, unknown>)
        : {};

    return NextResponse.json(
      {
        success: true,
        connected,
        provider: "meta",
        organizationId,
        status: connection?.status ?? "disconnected",
        account: connected
          ? {
              id: metadata.meta_user_id ?? null,
              name: metadata.name ?? null,
            }
          : null,
        scopes: connection?.scopes ?? [],
        expiresAt: connection?.expires_at ?? null,
        updatedAt: connection?.updated_at ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[META STATUS] Failed", error);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        provider: "meta",
        error: error?.message || "Failed to read Meta connection status.",
      },
      { status: 500 }
    );
  }
}
