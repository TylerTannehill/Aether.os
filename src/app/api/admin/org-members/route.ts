import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "general_user") return "general_user";
  if (value === "campaign_manager") return "admin";
  if (value === "user") return "general_user";

  return null;
}

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

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active campaign selected" },
        { status: 400 }
      );
    }

    const databaseClient = getAdminClient() ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, name, role, department, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser) {
      return NextResponse.json(
        { error: "Aether user profile not found" },
        { status: 403 }
      );
    }

    if (appUser.is_active === false) {
      return NextResponse.json(
        { error: "This user is inactive" },
        { status: 403 }
      );
    }

    const { data: currentMember, error: currentMemberError } =
      await databaseClient
        .from("organization_members")
        .select(
          "id, organization_id, user_id, role, department, title, profile_status"
        )
        .eq("user_id", appUser.id)
        .eq("organization_id", activeOrganizationId)
        .maybeSingle();

    if (currentMemberError) {
      return NextResponse.json(
        { error: currentMemberError.message },
        { status: 500 }
      );
    }

    if (!currentMember?.organization_id) {
      return NextResponse.json(
        { error: "No membership found for active campaign" },
        { status: 404 }
      );
    }

    const { data: members, error: membersError } = await databaseClient
      .from("organization_members")
      .select(
        `
          id,
          user_id,
          role,
          department,
          title,
          profile_status,
          organization_id,
          created_at
        `
      )
      .eq("organization_id", activeOrganizationId)
      .order("created_at", { ascending: true });

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    const memberIds = (members || []).map((member) => member.id);

    const { data: roles, error: rolesError } =
      memberIds.length > 0
        ? await databaseClient
            .from("organization_member_roles")
            .select(
              `
                id,
                organization_member_id,
                organization_id,
                department,
                role_level,
                is_primary,
                created_at,
                updated_at
              `
            )
            .eq("organization_id", activeOrganizationId)
            .in("organization_member_id", memberIds)
        : { data: [], error: null };

    if (rolesError) {
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    const currentMemberRoles = (roles || []).filter(
      (role) => role.organization_member_id === currentMember.id
    );

    const primaryRole =
      currentMemberRoles.find((role) => role.is_primary) ??
      currentMemberRoles[0] ??
      null;

    const resolvedCurrentMember = {
      ...currentMember,
      role:
        normalizeRole(currentMember.role) ??
        normalizeRole(primaryRole?.role_level) ??
        normalizeRole(appUser.role) ??
        currentMember.role,
      department:
        currentMember.department ??
        primaryRole?.department ??
        appUser.department ??
        null,
    };

    return NextResponse.json({
      organizationId: activeOrganizationId,
      currentMember: resolvedCurrentMember,
      members: members || [],
      roles: roles || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Failed to load organization members",
      },
      { status: 500 }
    );
  }
}