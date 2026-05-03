import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET → fetch all roles for an organization
 * POST → upsert roles for a member
 * DELETE → remove a role
 */

export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organization_id");

  if (!organizationId) {
    return NextResponse.json({ error: "Missing organization_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("organization_member_roles")
    .select(`
      id,
      department,
      role_level,
      is_primary,
      organization_member_id,
      organization_members (
        id,
        user_id
      )
    `)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ roles: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json();

  const {
    organization_member_id,
    organization_id,
    roles,
  } = body;

  if (!organization_member_id || !organization_id || !roles) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // delete existing roles first (clean reset)
  await supabase
    .from("organization_member_roles")
    .delete()
    .eq("organization_member_id", organization_member_id);

  const insertPayload = roles.map((r: any) => ({
    organization_member_id,
    organization_id,
    department: r.department,
    role_level: r.role_level,
    is_primary: r.is_primary || false,
  }));

  const { error } = await supabase
    .from("organization_member_roles")
    .insert(insertPayload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get("role_id");

  if (!roleId) {
    return NextResponse.json({ error: "Missing role_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("organization_member_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}