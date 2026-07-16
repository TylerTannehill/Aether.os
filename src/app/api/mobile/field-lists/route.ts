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
        { error: "User is not assigned to this organization." },
        { status: 403 }
      );
    }

    const { data: lists, error: listError } = await databaseClient
      .from("lists")
      .select(`
        id,
        name,
        status,
        default_owner_name
      `)
      .eq("organization_id", organizationId)
      .eq("type", "field")
      .order("name");

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lists: lists ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message ?? "Unable to load field lists.",
      },
      {
        status: 500,
      }
    );
  }
}