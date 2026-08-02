import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
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

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 60);

    const { data, error } = await serviceSupabase
      .from("organizations")
      .update({
        status: "suspended",
        is_locked: true,
        scheduled_deletion_at: deletionDate.toISOString(),
        suspended_at: new Date().toISOString(),
        suspended_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Unable to schedule organization deletion.",
      },
      { status: 500 }
    );
  }
}