import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

type AetherTier = "t1" | "t2" | "t3";
type AbeStage = "early" | "mid" | "late";

type OrganizationContext = {
  id: string;
  name?: string | null;
  slug?: string | null;
  context_mode?: string | null;
  aether_tier?: AetherTier | null;
  abe_stage?: AbeStage | null;
};

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "admin";
  if (value === "director") return "director";
  if (value === "general_user") return "general_user";

  return null;
}

function normalizeAetherTier(value?: string | null): AetherTier {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "t1") return "t1";
  if (normalized === "t2") return "t2";
  if (normalized === "t3") return "t3";

  return "t3";
}

function resolveOrganization(
  organizations: OrganizationContext | OrganizationContext[] | null | undefined
): OrganizationContext | null {
  const organization = Array.isArray(organizations)
    ? organizations[0] ?? null
    : organizations ?? null;

  if (!organization) return null;

  return {
    id: organization.id,
    name: organization.name ?? null,
    slug: organization.slug ?? null,
    context_mode: organization.context_mode ?? "default",
    aether_tier: normalizeAetherTier(organization.aether_tier),
    abe_stage: organization.abe_stage ?? "early",
  };
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

    // Use the service-role client for context lookup so the dashboard can
    // resolve the active organization before client-side RLS context exists.
    const databaseClient = getAdminClient() ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, name, role, department, is_active")
      .eq("auth_id", user.id)
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
      .select(
        `
          id,
          user_id,
          organization_id,
          role,
          department,
          title,
          profile_status,
          organizations (
            id,
            name,
            slug,
            context_mode,
            aether_tier,
            abe_stage
          )
        `
      )
      .eq("user_id", appUser.id)
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

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { error: "Your campaign access is not active" },
        { status: 403 }
      );
    }

    const resolvedOrganizationId = String(membership.organization_id);

    const { data: memberRoles, error: rolesError } = await databaseClient
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
      memberRoles?.find((role) => role.is_primary) ?? memberRoles?.[0] ?? null;

    const resolvedRole =
      normalizeRole(membership.role) ??
      normalizeRole(primaryRole?.role_level) ??
      normalizeRole(appUser.role) ??
      null;

    const resolvedDepartment =
      membership.department ?? primaryRole?.department ?? appUser.department ?? null;

    const organization = resolveOrganization(
      membership.organizations as
        | OrganizationContext
        | OrganizationContext[]
        | null
        | undefined
    );

    const isDemoOrg = organization?.slug === "aether-demo-campaign";

    const response = NextResponse.json({
      user: {
        id: user.id,
        app_user_id: appUser.id,
        email: user.email,
        name: appUser.name ?? null,
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
      isDemoOrg,
      capabilities: {
        showDemoControls: isDemoOrg,
      },
      recovered_context: false,
    });

    response.cookies.set("active_organization_id", resolvedOrganizationId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Failed to load current campaign context",
      },
      { status: 500 }
    );
  }
}
