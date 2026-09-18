import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

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
    const databaseClient = getAdminClient() ?? supabase;
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { error: "Aether user profile not found or inactive." },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id")
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
        { error: "No active organization membership found." },
        { status: 403 }
      );
    }

    const resolvedOrganizationId = String(membership.organization_id);

    const { data: settings, error: settingsError } = await databaseClient
      .from("public_campaign_portal_settings")
      .select(
        [
          "organization_id",
          "enabled",
          "show_doors",
          "show_digital_impressions",
          "show_total_raised",
          "show_print_materials",
          "show_finance_calls",
          "show_outreach_calls",
          "campaign_website_url",
          "donation_url",
          "state",
          "office",
          "district",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .eq("organization_id", resolvedOrganizationId)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: "Public campaign portal settings not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message || "Failed to load public campaign portal settings.",
      },
      { status: 500 }
    );
  }
}

function normalizeOptionalUrl(value: unknown) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeOptionalText(value: unknown) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const databaseClient = getAdminClient() ?? supabase;
    const cookieStore = await cookies();

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { error: "Aether user profile not found or inactive." },
        { status: 403 }
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id")
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
        { error: "No active organization membership found." },
        { status: 403 }
      );
    }

    const resolvedOrganizationId = String(membership.organization_id);

    const { data: adminRole, error: adminRoleError } = await databaseClient
      .from("organization_member_roles")
      .select("id")
      .eq("organization_member_id", membership.id)
      .eq("organization_id", resolvedOrganizationId)
      .eq("role_level", "admin")
      .limit(1)
      .maybeSingle();

    if (adminRoleError) {
      return NextResponse.json(
        { error: adminRoleError.message },
        { status: 500 }
      );
    }

    if (!adminRole) {
      return NextResponse.json(
        { error: "Admin access required to update public portal settings." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid public portal settings payload." },
        { status: 400 }
      );
    }

    const booleanFields = [
      "enabled",
      "show_doors",
      "show_digital_impressions",
      "show_total_raised",
      "show_print_materials",
      "show_finance_calls",
      "show_outreach_calls",
    ] as const;

    for (const field of booleanFields) {
      if (typeof body[field] !== "boolean") {
        return NextResponse.json(
          { error: `${field} must be a boolean.` },
          { status: 400 }
        );
      }
    }

    const updatePayload = {
      enabled: body.enabled,
      show_doors: body.show_doors,
      show_digital_impressions: body.show_digital_impressions,
      show_total_raised: body.show_total_raised,
      show_print_materials: body.show_print_materials,
      show_finance_calls: body.show_finance_calls,
      show_outreach_calls: body.show_outreach_calls,
      campaign_website_url: normalizeOptionalUrl(body.campaign_website_url),
      donation_url: normalizeOptionalUrl(body.donation_url),
      state: normalizeOptionalText(body.state),
      office: normalizeOptionalText(body.office),
      district: normalizeOptionalText(body.district),
      updated_at: new Date().toISOString(),
    };

    const { data: settings, error: settingsError } = await databaseClient
      .from("public_campaign_portal_settings")
      .update(updatePayload)
      .eq("organization_id", resolvedOrganizationId)
      .select(
        [
          "organization_id",
          "enabled",
          "show_doors",
          "show_digital_impressions",
          "show_total_raised",
          "show_print_materials",
          "show_finance_calls",
          "show_outreach_calls",
          "campaign_website_url",
          "donation_url",
          "state",
          "office",
          "district",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: "Public campaign portal settings not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message || "Failed to update public campaign portal settings.",
      },
      { status: 500 }
    );
  }
}

