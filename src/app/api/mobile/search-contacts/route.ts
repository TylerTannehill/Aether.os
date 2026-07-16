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
      return NextResponse.json({ error: appUserError.message }, { status: 500 });
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
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Organization membership not found." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const query = String(body?.query ?? "").trim();

    if (query.length < 2) {
      return NextResponse.json({ contacts: [] });
    }

    const search = `%${query}%`;

    const { data: contacts, error: contactsError } = await databaseClient
      .from("contacts")
      .select(
        "id, first_name, last_name, phone, address, city, state"
      )
      .eq("organization_id", membership.organization_id)
      .or(
        `first_name.ilike.${search},last_name.ilike.${search},phone.ilike.${search},address.ilike.${search}`
      )
      .order("last_name", { ascending: true })
      .limit(20);

    if (contactsError) {
      return NextResponse.json(
        { error: contactsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts: contacts ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to search contacts." },
      { status: 500 }
    );
  }
}
