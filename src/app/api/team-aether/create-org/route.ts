import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: Request) {
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

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();

    const name = String(body?.name || "").trim();

    const contextMode = String(
      body?.context_mode || "default"
    ).trim();

    const aetherTier = String(
      body?.aether_tier || "t3"
    )
      .trim()
      .toLowerCase();

    const productContext = String(
      body?.product_context || "political"
    )
      .trim()
      .toLowerCase();

    const allowedBusinessModules = [
      "crm",
      "marketing",
      "inventory",
      "dispatch",
      "finance",
    ];

    const requestedBusinessModules = Array.isArray(body?.business_modules)
      ? body.business_modules
          .map((module: unknown) => String(module || "").trim().toLowerCase())
          .filter((module: string) => allowedBusinessModules.includes(module))
      : [];

    const businessModules = [...new Set(requestedBusinessModules)];

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required." },
        { status: 400 }
      );
    }

    const allowedModes = [
      "default",
      "democrat",
      "republican",
    ];

    if (!allowedModes.includes(contextMode)) {
      return NextResponse.json(
        { error: "Invalid context mode." },
        { status: 400 }
      );
    }

    const allowedTiers = ["t1", "t2", "t3"];

    if (!allowedTiers.includes(aetherTier)) {
      return NextResponse.json(
        { error: "Invalid Aether tier." },
        { status: 400 }
      );
    }

    const allowedProductContexts = ["political", "business"];

    if (!allowedProductContexts.includes(productContext)) {
      return NextResponse.json(
        { error: "Invalid product context." },
        { status: 400 }
      );
    }

    if (productContext === "business" && businessModules.length === 0) {
      return NextResponse.json(
        { error: "Select at least one Business module." },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const { data: existingOrg } = await serviceSupabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        {
          error:
            "An organization with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const { data: publicUser, error: publicUserError } =
      await serviceSupabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (publicUserError || !publicUser) {
      return NextResponse.json(
        {
          error:
            publicUserError?.message ||
            "Unable to locate user profile.",
        },
        { status: 500 }
      );
    }

    const { data: organization, error: organizationError } =
      await serviceSupabase
        .from("organizations")
        .insert({
          name,
          slug,
          context_mode: productContext === "business" ? "default" : contextMode,
          aether_tier: productContext === "business" ? "t3" : aetherTier,
          product_context: productContext === "business" ? "business" : null,
        })
        .select()
        .single();

    if (organizationError || !organization) {
      return NextResponse.json(
        {
          error:
            organizationError?.message ||
            "Failed to create organization.",
        },
        { status: 500 }
      );
    }

    const { error: membershipError } =
      await serviceSupabase
        .from("organization_members")
        .insert({
          user_id: publicUser.id,
          organization_id: organization.id,
          role: "admin",
          department: "admin",
          title: "System Owner",
        });

    if (membershipError) {
      return NextResponse.json(
        {
          error:
            membershipError.message ||
            "Organization created but membership failed.",
        },
        { status: 500 }
      );
    }

    if (productContext === "business") {
      const { error: moduleError } = await serviceSupabase
        .from("business_organization_modules")
        .insert(
          businessModules.map((module) => ({
            organization_id: organization.id,
            module,
          }))
        );

      if (moduleError) {
        return NextResponse.json(
          {
            error:
              moduleError.message ||
              "Organization created but Business module provisioning failed.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to create organization.",
      },
      { status: 500 }
    );
  }
}