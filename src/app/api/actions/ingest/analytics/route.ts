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

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member?.organization_id) {
      return NextResponse.json(
        { success: false, error: "No active organization found." },
        { status: 400 }
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