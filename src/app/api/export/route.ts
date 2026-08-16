import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECT_ORG_TABLES = [
  "contacts",
  "contact_notes",
  "contact_relationships",
  "lists",
  "contributions",
  "expenses",
  "pledges",
  "fundraisers",
  "interactions",
  "emails",
  "sms_activity",
  "tasks",
  "field_campaigns",
  "field_events",
  "field_activities",
  "field_metrics",
  "outreach_campaigns",
  "outreach_events",
  "outreach_activities",
  "outreach_metrics",
  "digital_campaigns",
  "digital_events",
  "digital_activities",
  "digital_metrics",
  "print_campaigns",
  "print_events",
  "print_activities",
  "print_metrics",
  "mailers",
  "print_orders",
  "polling_locations",
] as const;

const ORG_ID_TABLES = ["org_messages"] as const;

const EXCLUDED_TABLES = [
  "integrations",
  "organization_integrations",
  "drive_integrations",
  "integration_logs",
  "action_audit",
  "admin_logs",
  "users",
  "team_aether_finance",
  "sales_campaigns",
] as const;

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

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";

  const normalized =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return `"${normalized.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const header = columns.map(csvEscape).join(",");
  const body = rows
    .map((row) => columns.map((column) => csvEscape(row[column])).join(","))
    .join("\r\n");

  return `${header}\r\n${body}\r\n`;
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "campaign";
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const databaseClient = getAdminClient();

    if (!databaseClient) {
      return NextResponse.json(
        { error: "Server export client is not configured" },
        { status: 500 }
      );
    }

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json({ error: appUserError.message }, { status: 500 });
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id, role, profile_status")
      .eq("user_id", appUser.id)
      .eq("organization_id", activeOrganizationId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    if (
      !membership ||
      (membership.profile_status &&
        String(membership.profile_status).toLowerCase() !== "active")
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: memberRoles } = await databaseClient
      .from("organization_member_roles")
      .select("role_level")
      .eq("organization_member_id", membership.id)
      .eq("organization_id", activeOrganizationId);

    const roleValues = [
      membership.role,
      ...(memberRoles || []).map((role) => role.role_level),
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    const canExport =
      roleValues.includes("admin") ||
      roleValues.includes("director") ||
      roleValues.includes("campaign_manager");

    if (!canExport) {
      return NextResponse.json(
        { error: "Only campaign leadership can export campaign data" },
        { status: 403 }
      );
    }

    const { data: organization, error: organizationError } = await databaseClient
      .from("organizations")
      .select("id, name, slug")
      .eq("id", activeOrganizationId)
      .maybeSingle();

    if (organizationError) {
      return NextResponse.json(
        { error: organizationError.message },
        { status: 500 }
      );
    }

    const exported: Record<string, Record<string, unknown>[]> = {};
    const skipped: { table: string; reason: string }[] = [];

    for (const table of DIRECT_ORG_TABLES) {
      const { data, error } = await databaseClient
        .from(table)
        .select("*")
        .eq("organization_id", activeOrganizationId);

      if (error) {
        skipped.push({ table, reason: error.message });
        continue;
      }

      exported[table] = (data || []) as Record<string, unknown>[];
    }

    for (const table of ORG_ID_TABLES) {
      const { data, error } = await databaseClient
        .from(table)
        .select("*")
        .eq("org_id", activeOrganizationId);

      if (error) {
        skipped.push({ table, reason: error.message });
        continue;
      }

      exported[table] = (data || []) as Record<string, unknown>[];
    }

    const listIds = (exported.lists || [])
      .map((row) => row.id)
      .filter(Boolean);

    if (listIds.length) {
      for (const table of ["list_contacts", "contact_lists"] as const) {
        const { data, error } = await databaseClient
          .from(table)
          .select("*")
          .in("list_id", listIds);

        if (error) {
          skipped.push({ table, reason: error.message });
        } else {
          exported[table] = (data || []) as Record<string, unknown>[];
        }
      }
    } else {
      exported.list_contacts = [];
      exported.contact_lists = [];
    }

    const manifest = {
      export_version: 1,
      generated_at: new Date().toISOString(),
      organization: organization || {
        id: activeOrganizationId,
        name: null,
        slug: null,
      },
      exported_tables: Object.entries(exported).map(([table, rows]) => ({
        table,
        row_count: rows.length,
      })),
      excluded_infrastructure_tables: [...EXCLUDED_TABLES],
      skipped_tables: skipped,
      note:
        "This export contains campaign-owned operational data. Authentication credentials, OAuth tokens, integration secrets, internal audit infrastructure, and Team Aether internal data are intentionally excluded.",
    };

    /*
      This route returns one JSON file containing every export dataset.
      JSON is deliberate for v1: no extra ZIP dependency is required, nested
      values are preserved, and the file can be converted to CSV later.
    */
    const payload = JSON.stringify(
      {
        manifest,
        data: exported,
      },
      null,
      2
    );

    const organizationLabel = sanitizeFilename(
      organization?.slug || organization?.name || activeOrganizationId
    );
    const date = new Date().toISOString().slice(0, 10);
    const filename = `aether-${organizationLabel}-full-export-${date}.json`;

    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export campaign data" },
      { status: 500 }
    );
  }
}
