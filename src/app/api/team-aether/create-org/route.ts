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

    const { data: organization, error: organizationError } =
      await serviceSupabase
        .from("organizations")
        .insert({
          name,
          slug,
          context_mode: contextMode,
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
          user_id: user.id,
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