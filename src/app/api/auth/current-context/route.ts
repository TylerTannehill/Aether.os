import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "general_user") return "general_user";

  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

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
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const userId = user.id;

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select(
        `
          id,
          user_id,
          organization_id,
          role,
          department,
          title,
          organizations (
            id,
            name,
            slug,
            context_mode
          )
        `
      )
      .eq("user_id", userId)
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
        {
          error:
            "No membership found for active organization. Active org cookie may be stale.",
        },
        { status: 403 }
      );
    }

    const resolvedOrganizationId = String(
      membership.organization_id
    );

    const { data: memberRoles, error: rolesError } =
      await supabase
        .from("organization_member_roles")
        .select("department, role_level, is_primary")
        .eq("organization_member_id", membership.id)
        .eq("organization_id", resolvedOrganizationId);

    if (rolesError) {
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    const primaryRole =
      memberRoles?.find((role) => role.is_primary) ??
      memberRoles?.[0] ??
      null;

    const resolvedRole =
      normalizeRole(membership.role) ??
      normalizeRole(primaryRole?.role_level) ??
      null;

    const resolvedDepartment =
      membership.department ??
      primaryRole?.department ??
      null;

    const organization = Array.isArray(
      membership.organizations
    )
      ? membership.organizations[0] ?? null
      : membership.organizations ?? null;

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      organization,
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        organization_id: membership.organization_id,
        role: resolvedRole,
        department: resolvedDepartment,
        title: membership.title,
      },
      roles: memberRoles || [],
      recovered_context: false,
    });

    response.cookies.set(
      "active_organization_id",
      resolvedOrganizationId,
      {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      }
    );

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to load current campaign context",
      },
      { status: 500 }
    );
  }
}