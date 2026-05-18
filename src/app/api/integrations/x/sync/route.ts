import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize-analytics-events";

export async function POST() {
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
        {
          success: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const xPayload = [
      {
        source: "x_api",
        department: "digital",

        platform: "X",
        campaign_name: "Narrative Pressure Monitoring",
        asset_name: "Debate Clip",

        metric_date: new Date().toISOString(),

        impressions: 418000,
        engagements: 29880,
        clicks: 7420,
        spend: 0,

        sentiment_positive: 41,
        sentiment_negative: 44,
        sentiment_neutral: 15,

        notes: "High narrative conflict around debate clip.",
      },

      {
        source: "x_api",
        department: "digital",

        platform: "X",
        campaign_name: "Rapid Response Push",
        asset_name: "Crime Policy Thread",

        metric_date: new Date().toISOString(),

        impressions: 202400,
        engagements: 18220,
        clicks: 3310,
        spend: 0,

        sentiment_positive: 56,
        sentiment_negative: 21,
        sentiment_neutral: 23,

        notes: "Strong supporter amplification behavior.",
      },
    ];

    const rows = normalizeAnalyticsEvents(
      xPayload,
      activeOrganizationId
    );

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("X sync insert failed", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "x",
      imported: data?.length ?? rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("X sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "X sync failed.",
      },
      { status: 500 }
    );
  }
}