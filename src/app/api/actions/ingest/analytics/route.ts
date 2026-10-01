import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize-analytics-events";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : [];

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: "No analytics events provided." },
        { status: 400 }
      );
    }

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      return NextResponse.json(
        { success: false, error: "No active organization selected." },
        { status: 400 }
      );
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      return NextResponse.json(
        { success: false, error: appUserError.message },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Aether user profile is unavailable." },
        { status: 403 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", appUser.id)
      .eq("organization_id", activeOrganizationId)
      .maybeSingle();

    if (memberError) {
      return NextResponse.json(
        { success: false, error: memberError.message },
        { status: 500 }
      );
    }

    if (!member?.organization_id) {
      return NextResponse.json(
        { success: false, error: "No membership found for active organization." },
        { status: 403 }
      );
    }

    const rows = normalizeAnalyticsEvents(events, member.organization_id);

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Analytics import failed.",
      },
      { status: 500 }
    );
  }
}