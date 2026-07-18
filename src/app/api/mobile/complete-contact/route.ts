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
        { error: "Organization is required." },
        { status: 400 }
      );
    }

    const {
      listContactId,
      notes,
      disposition,
      status,
    } = await request.json();

    if (!listContactId) {
      return NextResponse.json(
        { error: "List Contact ID is required." },
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
        { error: "Invalid authentication token." },
        { status: 401 }
      );
    }

    const databaseClient = adminClient ?? supabase;

    const { data: appUser, error: userError } = await databaseClient
      .from("users")
      .select("id,is_active")
      .eq("auth_id", authenticatedUser.id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 403 }
      );
    }

    // Verify the list contact belongs to a list in this organization

    const { data: assignment, error: assignmentError } = await databaseClient
      .from("list_contacts")
      .select(`
        id,
        list_id,
        lists!inner(
          organization_id
        )
      `)
      .eq("id", listContactId)
      .eq("lists.organization_id", organizationId)
      .maybeSingle();

    if (assignmentError) {
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "List contact not found." },
        { status: 404 }
      );
    }

    const updatePayload = {
      notes: notes ?? null,
      disposition: disposition ?? null,
      status: status ?? "completed",
      completed_by: appUser.id,
      completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await databaseClient
      .from("list_contacts")
      .update(updatePayload)
      .eq("id", listContactId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message ?? "Unable to complete contact.",
      },
      {
        status: 500,
      }
    );
  }
}