import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function normalizeCampaign(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

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

    let authenticatedUser = null;

    if (bearerToken) {
      const authClient = adminClient ?? supabase;

      const {
        data: { user },
        error: tokenUserError,
      } = await authClient.auth.getUser(bearerToken);

      if (tokenUserError || !user) {
        return NextResponse.json(
          { error: "Invalid or expired authentication token" },
          { status: 401 }
        );
      }

      authenticatedUser = user;
    } else {
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

      authenticatedUser = user;
    }

    const body = await request.json();
    const normalizedCampaign = normalizeCampaign(body?.campaign);

    if (!normalizedCampaign) {
      return NextResponse.json(
        { error: "Campaign name or code is required" },
        { status: 400 }
      );
    }

    // Use the service-role client for campaign/user membership lookup so login
    // does not depend on RLS visibility before active_organization_id is set.
    const databaseClient = adminClient ?? supabase;

    const { data: organization, error: organizationError } = await databaseClient
      .from("organizations")
      .select("id, name, slug, context_mode, aether_tier")
      .eq("slug", normalizedCampaign)
      .maybeSingle();

    if (organizationError) {
      return NextResponse.json(
        { error: organizationError.message },
        { status: 500 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, name, role, department, is_active")
      .eq("auth_id", authenticatedUser.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser) {
      return NextResponse.json(
        { error: "Aether user profile not found" },
        { status: 403 }
      );
    }

    if (appUser.is_active === false) {
      return NextResponse.json(
        { error: "This user is inactive" },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id, role, department, title, profile_status")
      .eq("user_id", appUser.id)
      .eq("organization_id", organization.id)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this campaign" },
        { status: 403 }
      );
    }

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { error: "Your campaign access is not active" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      organization,
      membership,
      user: appUser,
    });

    // Desktop uses the active organization cookie.
    // Mobile receives the organization context in the JSON response.
    if (!bearerToken) {
      response.cookies.set("active_organization_id", organization.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to select campaign" },
      { status: 500 }
    );
  }
}