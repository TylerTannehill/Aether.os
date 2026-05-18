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

    const youtubePayload = [
      {
        source: "youtube_api",
        department: "digital",

        platform: "YouTube",
        campaign_name: "Longform Narrative",
        asset_name: "Veterans Policy Interview",

        metric_date: new Date().toISOString(),

        impressions: 621000,
        engagements: 44210,
        clicks: 8420,
        spend: 1400.75,

        sentiment_positive: 72,
        sentiment_negative: 11,
        sentiment_neutral: 17,

        notes: "Strong long-form retention performance.",
      },

      {
        source: "youtube_api",
        department: "digital",

        platform: "YouTube",
        campaign_name: "Issue Explainer",
        asset_name: "Property Tax Breakdown",

        metric_date: new Date().toISOString(),

        impressions: 182300,
        engagements: 22100,
        clicks: 3100,
        spend: 810.42,

        sentiment_positive: 66,
        sentiment_negative: 13,
        sentiment_neutral: 21,

        notes: "High watch completion percentage.",
      },
    ];

    const rows = normalizeAnalyticsEvents(
      youtubePayload,
      activeOrganizationId
    );

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("YouTube sync insert failed", error);

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
      source: "youtube",
      imported: data?.length ?? rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("YouTube sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "YouTube sync failed.",
      },
      { status: 500 }
    );
  }
}