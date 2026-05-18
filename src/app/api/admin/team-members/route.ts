import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "campaign_manager") return "campaign_manager";
  if (value === "general_user") return "user";
  if (value === "user") return "user";

  return "user";
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

    const { data: currentMember, error: currentMemberError } = await supabase
      .from("organization_members")
      .select("id, role, organization_id")
      .eq("organization_id", activeOrganizationId)
      .eq("user_id", user.id)
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

    const normalizedCurrentRole = normalizeRole(currentMember.role);

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

    // -----------------------------------
    // Check if auth user already exists
    // -----------------------------------

    const { data: existingUsers } =
      await supabaseAdmin.auth.admin.listUsers();

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let authUserId: string;

    // -----------------------------------
    // Existing auth user
    // -----------------------------------

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      // -----------------------------------
      // Create direct auth user
      // -----------------------------------

      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: String(password),
          email_confirm: true,
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      authUserId = createdUser.user.id;
    }

    // -----------------------------------
    // Prevent duplicate org memberships
    // -----------------------------------

    const { data: existingMembership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", activeOrganizationId)
      .eq("user_id", authUserId)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: "User already belongs to this organization" },
        { status: 400 }
      );
    }

    // -----------------------------------
    // Create organization membership
    // -----------------------------------

    const { data: newMember, error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: activeOrganizationId,
        user_id: authUserId,
        title: title || null,
        department: department || "campaign",
        role: role || "general_user",
      })
      .select()
      .single();

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      );
    }

    // -----------------------------------
    // Create primary operating role
    // -----------------------------------

    const { error: roleError } = await supabase
      .from("organization_member_roles")
      .insert({
        organization_member_id: newMember.id,
        organization_id: activeOrganizationId,
        department: department || "campaign",
        role_level: normalizeRole(role),
        is_primary: true,
      });

    if (roleError) {
      return NextResponse.json(
        { error: roleError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: newMember,
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

    const { data: currentMember } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", activeOrganizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!currentMember) {
      return NextResponse.json(
        { error: "No organization membership found" },
        { status: 403 }
      );
    }

    if (normalizeRole(currentMember.role) !== "admin") {
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
    await supabase
      .from("organization_member_roles")
      .delete()
      .eq("organization_member_id", memberId);

    // Remove organization membership
    const { error: deleteError } = await supabase
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