import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Digital roll-ups: server database configuration missing");
      return NextResponse.json({ error: "Digital reporting unavailable." }, { status: 503 });
    }

    // Server-only credentials; never expose the service key to the browser.
    const db = createSupabaseAdminClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: appUser, error: profileError } = await db
      .from("users")
      .select("id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!appUser || appUser.is_active === false) {
      return NextResponse.json({ error: "Aether account unavailable." }, { status: 403 });
    }

    const cookieStore = await cookies();
    let organizationId = cookieStore.get("active_organization_id")?.value;
    if (!organizationId) {
      const { data: firstMembership, error: firstError } = await db
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", appUser.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstError) throw firstError;
      organizationId = firstMembership?.organization_id;
    }
    if (!organizationId) {
      return NextResponse.json({ error: "No active campaign selected." }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await db
      .from("organization_members")
      .select("id")
      .eq("user_id", appUser.id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) {
      return NextResponse.json({ error: "No access to this campaign." }, { status: 403 });
    }

    const { data: rows, error: rollupError } = await db
      .from("analytics_daily_rollups")
      .select("metric_date, political_platform, impressions, engagements, spend, positive_sentiment, negative_sentiment, ctr_sum, row_count")
      .eq("organization_id", organizationId)
      .eq("political_eligible", true);
    if (rollupError) throw rollupError;

    return NextResponse.json({ rows: rows ?? [] }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Digital roll-ups API failed", error);
    return NextResponse.json({ error: "Unable to load digital analytics." }, { status: 500 });
  }
}
