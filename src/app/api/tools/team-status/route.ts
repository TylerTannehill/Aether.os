import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
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

    const { data: appUser, error: appUserError } = await serviceSupabase
      .from("users")
      .select("id, is_active")
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
        { error: "Aether user profile is not active" },
        { status: 403 }
      );
    }

    const { data: requestingMembership, error: requestingMembershipError } =
      await serviceSupabase
        .from("organization_members")
        .select("id")
        .eq("user_id", appUser.id)
        .eq("organization_id", activeOrganizationId)
        .maybeSingle();

    if (requestingMembershipError) {
      return NextResponse.json(
        { error: requestingMembershipError.message },
        { status: 500 }
      );
    }

    if (!requestingMembership) {
      return NextResponse.json(
        { error: "No membership found for active organization" },
        { status: 403 }
      );
    }

    const { data: memberships, error: membershipsError } = await serviceSupabase
      .from("organization_members")
      .select("id, user_id, role, department, title, profile_status")
      .eq("organization_id", activeOrganizationId);

    if (membershipsError) {
      return NextResponse.json(
        { error: membershipsError.message },
        { status: 500 }
      );
    }

    const userIds = Array.from(
      new Set((memberships || []).map((membership) => membership.user_id).filter(Boolean))
    );

    let namesById = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: appUsers, error: usersError } = await serviceSupabase
        .from("users")
        .select("id, name")
        .in("id", userIds);

      if (usersError) {
        return NextResponse.json(
          { error: usersError.message },
          { status: 500 }
        );
      }

      namesById = new Map(
        (appUsers || []).map((memberUser) => [
          String(memberUser.id),
          String(memberUser.name || "").trim() || "Team member",
        ])
      );
    }

    const members = (memberships || [])
      .map((membership) => ({
        id: String(membership.id),
        name: namesById.get(String(membership.user_id)) || "Team member",
        role: String(membership.role || membership.title || "Team member"),
        department: membership.department || null,
        title: membership.title || null,
        profile_status: String(membership.profile_status || "active").toLowerCase(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      organization_id: activeOrganizationId,
      members,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load team status" },
      { status: 500 }
    );
  }
}
