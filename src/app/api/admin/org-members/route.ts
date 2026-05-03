import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: currentMember, error: currentMemberError } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, department, title")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentMemberError) {
      return NextResponse.json(
        { error: currentMemberError.message },
        { status: 500 }
      );
    }

    if (!currentMember?.organization_id) {
      return NextResponse.json(
        { error: "No organization membership found" },
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
          organization_id
        `
      )
      .eq("organization_id", currentMember.organization_id)
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
          .in("organization_member_id", memberIds)
      : { data: [], error: null };

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    return NextResponse.json({
      organizationId: currentMember.organization_id,
      currentMember,
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