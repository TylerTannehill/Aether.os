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

    return NextResponse.json({
      success: true,
      organizations,
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