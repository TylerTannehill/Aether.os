import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function getActiveOrganizationId() {
  const cookieStore = await cookies();
  const activeOrganizationId =
    cookieStore.get("active_organization_id")?.value;

  if (!activeOrganizationId) {
    throw new Error("No active campaign selected.");
  }

  return activeOrganizationId;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const organizationId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from("organization_integrations")
      .select(
        "id, provider, provider_account_email, status, scopes, expires_at, metadata, updated_at"
      )
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      connected: data?.status === "connected",
      integration: data || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error?.message || "Failed to load Google status.",
      },
      { status: 500 }
    );
  }
}