import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    await supabase.auth.signOut();

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("active_organization_id", "", {
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message || "Failed to logout.",
      },
      { status: 500 }
    );
  }
}