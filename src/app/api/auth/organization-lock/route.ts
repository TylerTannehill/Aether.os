import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          locked: false,
        },
        { status: 200 }
      );
    }

    const cookieStore = await cookies();
    const organizationId = cookieStore.get(
      "active_organization_id"
    )?.value;

    if (!organizationId) {
      return NextResponse.json(
        {
          authenticated: true,
          locked: false,
        },
        { status: 200 }
      );
    }

    const { data: organization, error } = await supabase
      .from("organizations")
      .select("id, is_locked")
      .eq("id", organizationId)
      .maybeSingle();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          authenticated: true,
          locked: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      locked: organization?.is_locked ?? false,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        authenticated: false,
        locked: false,
      },
      { status: 200 }
    );
  }
}