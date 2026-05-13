import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "general_user") return "general_user";
  if (value === "campaign_manager") return "admin";
  if (value === "user") return "general_user";

  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const activeOrganizationId = cookieStore.get("active_organization_id")?.value;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active campaign selected" },
        { status: 400 }
      );
    }

    const { data: currentMember, error: currentMemberError } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, department, title")
      .eq("user_id", user.id)
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

    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(
        `
          id,
          user_id,
          role,
          department,
          title,
          organization_id,
          created_at
        `
      )
      .eq("organization_id", activeOrganizationId)
      .order("created_at", { ascending: true });

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const memberIds = (members || []).map((member) => member.id);

    const { data: roles, error: rolesError } = memberIds.length
      ? await supabase
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
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
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
        currentMember.role,
      department: currentMember.department ?? primaryRole?.department ?? null,
    };

    return NextResponse.json({
      organizationId: activeOrganizationId,
      currentMember: resolvedCurrentMember,
      members: members || [],
      roles: roles || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load organization members" },
      { status: 500 }
    );
  }
}