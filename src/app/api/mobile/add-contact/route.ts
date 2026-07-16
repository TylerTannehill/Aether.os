import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = getAdminClient();

    const authorizationHeader = request.headers.get("authorization");
    const bearerToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice(7).trim()
      : null;

    if (!bearerToken) {
      return NextResponse.json(
        { error: "Bearer token is required." },
        { status: 401 }
      );
    }

    const organizationId = request.headers.get("x-organization-id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Active organization is required." },
        { status: 400 }
      );
    }

    const authClient = adminClient ?? supabase;

    const {
      data: { user: authenticatedUser },
      error: authError,
    } = await authClient.auth.getUser(bearerToken);

    if (authError || !authenticatedUser) {
      return NextResponse.json(
        { error: "Invalid or expired authentication token." },
        { status: 401 }
      );
    }

    const databaseClient = adminClient ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", authenticatedUser.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { error: "User is inactive or not found." },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", appUser.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "User is not a member of this organization." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const first_name = String(body.first_name ?? "").trim();
    const last_name = String(body.last_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!first_name || !last_name || !phone) {
      return NextResponse.json(
        {
          error: "First name, last name and phone number are required.",
        },
        { status: 400 }
      );
    }

    const contact = {
      organization_id: organizationId,
      first_name,
      last_name,
      phone,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      notes: body.notes || null,
    };

    const { data, error } = await databaseClient
      .from("contacts")
      .insert(contact)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Failed to create contact.",
      },
      { status: 500 }
    );
  }
}