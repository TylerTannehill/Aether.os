import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Verify authenticated user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Service client
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch organizations
    const { data: organizations, error } =
      await serviceSupabase
        .from("organizations")
        .select(`
          id,
          name,
          slug,
          context_mode,
          aether_tier,
          abe_stage,
          product_context,
          status,
          scheduled_deletion_at,
          created_at
        `)
        .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const businessOrganizationIds = (organizations || [])
      .filter((organization) => organization.product_context === "business")
      .map((organization) => organization.id);

    let modulesByOrganization = new Map<string, string[]>();

    if (businessOrganizationIds.length > 0) {
      const { data: moduleRows, error: moduleError } = await serviceSupabase
        .from("business_organization_modules")
        .select("organization_id, module")
        .in("organization_id", businessOrganizationIds)
        .order("module", { ascending: true });

      if (moduleError) {
        return NextResponse.json(
          { error: moduleError.message },
          { status: 500 }
        );
      }

      modulesByOrganization = new Map<string, string[]>();

      for (const row of moduleRows || []) {
        const current = modulesByOrganization.get(row.organization_id) || [];
        current.push(row.module);
        modulesByOrganization.set(row.organization_id, current);
      }
    }

    const enrichedOrganizations = (organizations || []).map((organization) => ({
      ...organization,
      business_modules:
        organization.product_context === "business"
          ? modulesByOrganization.get(organization.id) || []
          : [],
    }));

    return NextResponse.json({
      success: true,
      organizations: enrichedOrganizations,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to load organizations.",
      },
      { status: 500 }
    );
  }
}