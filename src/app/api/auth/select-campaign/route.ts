import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const campaignInput = String(body?.campaign || "").trim();

    if (!campaignInput) {
      return NextResponse.json(
        { error: "Campaign name or code is required" },
        { status: 400 }
      );
    }

    const normalizedCampaign = campaignInput.toLowerCase();

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id, name, slug")
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

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, department, title")
      .eq("user_id", user.id)
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

    const response = NextResponse.json({
      organization,
      membership,
    });

    response.cookies.set("active_organization_id", organization.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to select campaign" },
      { status: 500 }
    );
  }
}