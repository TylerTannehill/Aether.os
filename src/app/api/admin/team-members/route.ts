import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeMembershipRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "campaign_manager") return "campaign_manager";
  if (value === "general_user") return "general_user";
  if (value === "user") return "general_user";

  return "general_user";
}

function normalizeRoleLevel(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "campaign_manager") return "campaign_manager";

  return "user";
}

function getDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "Team Member";

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function resolveCurrentAppUser(authUserId: string) {
  const { data: appUser, error: appUserError } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, name, role, department, is_active")
    .eq("auth_id", authUserId)
    .maybeSingle();

  if (appUserError) {
    throw new Error(appUserError.message);
  }

  if (!appUser) {
    throw new Error("Aether user profile not found");
  }

  if (appUser.is_active === false) {
    throw new Error("This user is inactive");
  }

  return appUser;
}

async function resolveOrCreateAppUser(params: {
  authUserId: string;
  email: string;
  role: string;
  department: string;
  title?: string | null;
}) {
  const { authUserId, email, role, department, title } = params;

  const { data: existingAppUser, error: existingAppUserError } =
    await supabaseAdmin
      .from("users")
      .select("id, auth_id, name, role, department, is_active")
      .eq("auth_id", authUserId)
      .maybeSingle();

  if (existingAppUserError) {
    throw new Error(existingAppUserError.message);
  }

  if (existingAppUser) {
    if (existingAppUser.is_active === false) {
      const { data: reactivatedUser, error: reactivateError } =
        await supabaseAdmin
          .from("users")
          .update({ is_active: true })
          .eq("id", existingAppUser.id)
          .select("id, auth_id, name, role, department, is_active")
          .single();

      if (reactivateError) {
        throw new Error(reactivateError.message);
      }

      return reactivatedUser;
    }

    return existingAppUser;
  }

  const displayName = String(title || "").trim() || getDisplayNameFromEmail(email);

  const { data: newAppUser, error: newAppUserError } = await supabaseAdmin
    .from("users")
    .insert({
      auth_id: authUserId,
      name: displayName,
      role: normalizeMembershipRole(role),
      department: department || "campaign",
      is_active: true,
    })
    .select("id, auth_id, name, role, department, is_active")
    .single();

  if (newAppUserError) {
    throw new Error(newAppUserError.message);
  }

  return newAppUser;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const currentAppUser = await resolveCurrentAppUser(user.id);

    const { data: currentMember, error: currentMemberError } =
      await supabaseAdmin
        .from("organization_members")
        .select("id, role, organization_id")
        .eq("organization_id", activeOrganizationId)
        .eq("user_id", currentAppUser.id)
        .maybeSingle();

    if (currentMemberError) {
      return NextResponse.json(
        { error: currentMemberError.message },
        { status: 500 }
      );
    }

    if (!currentMember) {
      return NextResponse.json(
        { error: "No organization membership found" },
        { status: 403 }
      );
    }

    const normalizedCurrentRole =
      normalizeMembershipRole(currentMember.role);

    if (normalizedCurrentRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage team members" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      email,
      password,
      title,
      department,
      role,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedDepartment = String(department || "campaign")
      .trim()
      .toLowerCase();

    const normalizedMembershipRole =
      normalizeMembershipRole(role);

    const normalizedRoleLevel =
      normalizeRoleLevel(role);

    // -----------------------------------
    // Find or create auth user
    // -----------------------------------

    const { data: existingUsers, error: listUsersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      return NextResponse.json(
        { error: listUsersError.message },
        { status: 500 }
      );
    }

    const existingUser = existingUsers.users.find(
      (authUser) => authUser.email?.toLowerCase() === normalizedEmail
    );

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: String(password),
          email_confirm: true,
        });

      if (createError || !createdUser.user) {
        return NextResponse.json(
          {
            error:
              createError?.message ||
              "Failed to create authentication user",
          },
          { status: 500 }
        );
      }

      authUserId = createdUser.user.id;
    }

    // -----------------------------------
    // Find or create public.users record
    // -----------------------------------

    const appUser = await resolveOrCreateAppUser({
      authUserId,
      email: normalizedEmail,
      role: normalizedMembershipRole,
      department: normalizedDepartment,
      title,
    });

    // -----------------------------------
    // Prevent duplicate org memberships
    // -----------------------------------

    const { data: existingMembership, error: existingMembershipError } =
      await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", activeOrganizationId)
        .eq("user_id", appUser.id)
        .maybeSingle();

    if (existingMembershipError) {
      return NextResponse.json(
        { error: existingMembershipError.message },
        { status: 500 }
      );
    }

    if (existingMembership) {
      return NextResponse.json(
        { error: "User already belongs to this organization" },
        { status: 400 }
      );
    }

    // -----------------------------------
    // Create organization membership
    // -----------------------------------

    const { data: newMember, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: activeOrganizationId,
        user_id: appUser.id,
        title: title || null,
        department: normalizedDepartment,
        role: normalizedMembershipRole,
        profile_status: "active",
      })
      .select()
      .single();

    if (memberError || !newMember) {
      return NextResponse.json(
        {
          error:
            memberError?.message ||
            "Failed to create organization membership",
        },
        { status: 500 }
      );
    }

    // -----------------------------------
    // Create primary operating role
    // -----------------------------------

    const { error: roleError } = await supabaseAdmin
      .from("organization_member_roles")
      .insert({
        organization_member_id: newMember.id,
        organization_id: activeOrganizationId,
        department: normalizedDepartment,
        role_level: normalizedRoleLevel,
        is_primary: true,
      });

    if (roleError) {
      await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("id", newMember.id);

      return NextResponse.json(
        { error: roleError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      user: appUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const currentAppUser = await resolveCurrentAppUser(user.id);

    const { data: currentMember, error: currentMemberError } =
      await supabaseAdmin
        .from("organization_members")
        .select("id, role")
        .eq("organization_id", activeOrganizationId)
        .eq("user_id", currentAppUser.id)
        .maybeSingle();

    if (currentMemberError) {
      return NextResponse.json(
        { error: currentMemberError.message },
        { status: 500 }
      );
    }

    if (!currentMember) {
      return NextResponse.json(
        { error: "No organization membership found" },
        { status: 403 }
      );
    }

    if (normalizeMembershipRole(currentMember.role) !== "admin") {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Missing member_id" },
        { status: 400 }
      );
    }

    // Prevent self deletion
    if (memberId === currentMember.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    // Remove roles first
    const { error: roleDeleteError } = await supabaseAdmin
      .from("organization_member_roles")
      .delete()
      .eq("organization_member_id", memberId);

    if (roleDeleteError) {
      return NextResponse.json(
        { error: roleDeleteError.message },
        { status: 500 }
      );
    }

    // Remove organization membership only from active organization
    const { error: deleteError } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("id", memberId)
      .eq("organization_id", activeOrganizationId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
