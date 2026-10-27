
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function failure(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: noStore }
  );
}

export async function POST(request: Request) {
  try {
    // Verify the signed-in Aether user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return failure("Please sign in to delete your Social account.", 401);
    }

    // Require explicit confirmation.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return failure("Invalid deletion request.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("confirmation" in body) ||
      body.confirmation !== "DELETE SOCIAL"
    ) {
      return failure("Account deletion was not confirmed.", 400);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("Social deletion: Admin configuration missing.");
      return failure("Account deletion is temporarily unavailable.", 503);
    }

    // Server-only administrative client.
    const admin = createSupabaseAdminClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Locate ONLY the authenticated user's Social profile.
    const { data: profile, error: lookupError } = await admin
      .from("social_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Social deletion: Profile lookup failed.", lookupError);
      return failure("Unable to locate your Social account.", 500);
    }

    if (!profile) {
      return failure("Social account not found.", 404);
    }

    // Delete the Social profile.
    //
    // Existing database CASCADE relationships remove associated
    // Social records such as posts, connections, and profile details.
    //
    // DM participant/sender references use ON DELETE SET NULL,
    // allowing stored conversation history to remain.
    //
    // We deliberately DO NOT delete:
    // - auth.users
    // - public.users
    // - organization_members
    // - organizations
    // - Political or Business data
    const { data: deletedProfiles, error: deletionError } = await admin
      .from("social_profiles")
      .delete()
      .eq("id", profile.id)
      .eq("auth_user_id", user.id)
      .select("id");

    if (deletionError) {
      console.error("Social deletion: Database deletion failed.", deletionError);

      return failure(
        "Unable to delete your Social account. Please try again.",
        500
      );
    }

    if (deletedProfiles?.length !== 1) {
      return failure("Social account deletion could not be verified.", 500);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your Aether Social account has been deleted.",
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("Social deletion: Unexpected error.", error);

    return failure(
      "Something went wrong while deleting your Social account.",
      500
    );
  }
}
