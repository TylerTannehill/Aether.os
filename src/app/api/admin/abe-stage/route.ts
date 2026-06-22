import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

const VALID_STAGES = ["early", "mid", "late"] as const;

type AbeStage = (typeof VALID_STAGES)[number];

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

function normalizeAbeStage(value?: string | null): AbeStage | null {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "early") return "early";
  if (normalized === "mid") return "mid";
  if (normalized === "late") return "late";

  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const databaseClient = getAdminClient() ?? supabase;
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    const body = await req.json().catch(() => null);
    const abeStage = normalizeAbeStage(body?.abe_stage);

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected." },
        { status: 400 }
      );
    }

    if (!abeStage || !VALID_STAGES.includes(abeStage)) {
      return NextResponse.json(
        { error: "Invalid Abe stage." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { error: "Aether user profile not found or inactive." },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id, role, profile_status")
      .eq("user_id", appUser.id)
      .eq("organization_id", activeOrganizationId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization membership found." },
        { status: 403 }
      );
    }

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { error: "Your campaign access is not active." },
        { status: 403 }
      );
    }

    const resolvedOrganizationId = String(membership.organization_id);

    const { data: updatedOrganization, error: updateError } =
      await databaseClient
        .from("organizations")
        .update({ abe_stage: abeStage })
        .eq("id", resolvedOrganizationId)
        .select("id, name, slug, abe_stage")
        .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedOrganization) {
      return NextResponse.json(
        { error: "Abe stage update did not affect an organization row." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      abe_stage: updatedOrganization.abe_stage,
      organization: updatedOrganization,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Failed to update Abe stage.",
      },
      { status: 500 }
    );
  }
}
