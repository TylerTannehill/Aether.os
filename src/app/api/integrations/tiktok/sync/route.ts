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

    const tiktokPayload = [
      {
        source: "tiktok_api",
        department: "digital",

        platform: "TikTok",
        campaign_name: "Momentum Growth",
        asset_name: "Town Hall Vertical Clip",

        metric_date: new Date().toISOString(),

        impressions: 812000,
        engagements: 98100,
        clicks: 11040,
        spend: 620.22,

        sentiment_positive: 74,
        sentiment_negative: 8,
        sentiment_neutral: 18,

        notes: "Momentum spike from organic resharing.",
      },

      {
        source: "tiktok_api",
        department: "digital",

        platform: "TikTok",
        campaign_name: "Youth Outreach",
        asset_name: "Campus Walkthrough",

        metric_date: new Date().toISOString(),

        impressions: 433200,
        engagements: 55220,
        clicks: 7122,
        spend: 320.14,

        sentiment_positive: 79,
        sentiment_negative: 6,
        sentiment_neutral: 15,

        notes: "High Gen Z engagement activity.",
      },
    ];

    const rows = normalizeAnalyticsEvents(
      tiktokPayload,
      activeOrganizationId
    );

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("TikTok sync insert failed", error);

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
      source: "tiktok",
      imported: data?.length ?? rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("TikTok sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "TikTok sync failed.",
      },
      { status: 500 }
    );
  }
}