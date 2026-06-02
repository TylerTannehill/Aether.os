import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ProfileStatus =
  | "active"
  | "busy"
  | "inactive"
  | "break"
  | "lunch"
  | "potato";

function normalizeProfileStatus(value?: string | null): ProfileStatus | null {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "active" ||
    normalized === "busy" ||
    normalized === "inactive" ||
    normalized === "break" ||
    normalized === "lunch" ||
    normalized === "potato"
  ) {
    return normalized;
  }

  return null;
}

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const authSupabase = await createClient();
    const serviceSupabase = createServiceClient();
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const nextStatus = normalizeProfileStatus(body?.status);

    if (!nextStatus) {
      return NextResponse.json(
        { error: "Invalid profile status" },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .from("organization_members")
      .select(
        "id, user_id, organization_id, profile_status, potato_status_count, potato_easter_egg_unlocked"
      )
      .eq("user_id", user.id)
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
        { error: "No membership found for active organization" },
        { status: 404 }
      );
    }

    const currentPotatoCount =
      Number(membership.potato_status_count ?? 0) || 0;
    const nextPotatoCount =
      nextStatus === "potato" ? currentPotatoCount + 1 : currentPotatoCount;
    const nextPotatoEasterEggUnlocked =
      Boolean(membership.potato_easter_egg_unlocked) ||
      nextPotatoCount >= 23;

    const { data: updatedMembership, error: updateError } =
      await serviceSupabase
        .from("organization_members")
        .update({
          profile_status: nextStatus,
          potato_status_count: nextPotatoCount,
          potato_easter_egg_unlocked: nextPotatoEasterEggUnlocked,
        })
        .eq("id", membership.id)
        .select(
          "id, user_id, organization_id, profile_status, potato_status_count, potato_easter_egg_unlocked"
        )
        .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedMembership) {
      return NextResponse.json(
        { error: "Status update completed but no membership was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      membership: updatedMembership,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update profile status" },
      { status: 500 }
    );
  }
}
