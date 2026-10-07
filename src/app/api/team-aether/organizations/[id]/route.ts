import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUSINESS_MODULES = [
  "crm",
  "marketing",
  "inventory",
  "dispatch",
  "finance",
] as const;

type BusinessModule = (typeof BUSINESS_MODULES)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    const { data, error } = await serviceSupabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Unable to load organization.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const body = await request.json();

    const { data: existingOrganization, error: existingOrganizationError } =
      await serviceSupabase
        .from("organizations")
        .select("id, product_context")
        .eq("id", id)
        .single();

    if (existingOrganizationError || !existingOrganization) {
      return NextResponse.json(
        {
          error:
            existingOrganizationError?.message ||
            "Organization not found.",
        },
        { status: 404 }
      );
    }

    const isBusinessOrganization =
      existingOrganization.product_context === "business";

    const updateData = isBusinessOrganization
      ? {
          name: body.name,
          slug: body.slug,
          status: body.status,
        }
      : {
          name: body.name,
          slug: body.slug,
          context_mode: body.context_mode,
          aether_tier: body.aether_tier,
          abe_stage: body.abe_stage,
          status: body.status,
        };

    if (isBusinessOrganization && body.business_modules !== undefined) {
      if (!Array.isArray(body.business_modules)) {
        return NextResponse.json(
          { error: "business_modules must be an array." },
          { status: 400 }
        );
      }

      const requestedModules = Array.from(
        new Set(
          body.business_modules
            .map((module: unknown) =>
              typeof module === "string" ? module.trim().toLowerCase() : ""
            )
            .filter(Boolean)
        )
      );

      const invalidModules = requestedModules.filter(
        (module) =>
          !BUSINESS_MODULES.includes(module as BusinessModule)
      );

      if (invalidModules.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid Business module: ${invalidModules.join(", ")}`,
          },
          { status: 400 }
        );
      }

      if (requestedModules.length === 0) {
        return NextResponse.json(
          {
            error: "Business organizations must have at least one module.",
          },
          { status: 400 }
        );
      }

      const { error: deleteModulesError } = await serviceSupabase
        .from("business_organization_modules")
        .delete()
        .eq("organization_id", id);

      if (deleteModulesError) {
        return NextResponse.json(
          { error: deleteModulesError.message },
          { status: 500 }
        );
      }

      const { error: insertModulesError } = await serviceSupabase
        .from("business_organization_modules")
        .insert(
          requestedModules.map((module) => ({
            organization_id: id,
            module,
          }))
        );

      if (insertModulesError) {
        return NextResponse.json(
          {
            error:
              "Organization module rows were cleared, but the new Business modules could not be saved.",
            details: insertModulesError.message,
          },
          { status: 500 }
        );
      }
    }

    const { data, error } = await serviceSupabase
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    let businessModules: string[] = [];

    if (isBusinessOrganization) {
      const { data: moduleRows, error: moduleRowsError } =
        await serviceSupabase
          .from("business_organization_modules")
          .select("module")
          .eq("organization_id", id)
          .order("module", { ascending: true });

      if (moduleRowsError) {
        return NextResponse.json(
          { error: moduleRowsError.message },
          { status: 500 }
        );
      }

      businessModules = (moduleRows || []).map((row) => row.module);
    }

    return NextResponse.json({
      success: true,
      organization: {
        ...data,
        business_modules: businessModules,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Unable to update organization.",
      },
      { status: 500 }
    );
  }
}
