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

    const websitePayload = [
      {
        source: "website_analytics",
        department: "digital",

        platform: "Campaign Website",
        campaign_name: "Homepage Conversion Flow",
        asset_name: "Donate CTA Funnel",

        metric_date: new Date().toISOString(),

        impressions: 128000,
        engagements: 19420,
        clicks: 5820,
        spend: 0,

        sentiment_positive: 61,
        sentiment_negative: 9,
        sentiment_neutral: 30,

        notes: "Strong homepage donation funnel behavior.",
      },

      {
        source: "website_analytics",
        department: "digital",

        platform: "Campaign Website",
        campaign_name: "Volunteer Signup",
        asset_name: "Field Signup Landing Page",

        metric_date: new Date().toISOString(),

        impressions: 74200,
        engagements: 11800,
        clicks: 4120,
        spend: 0,

        sentiment_positive: 69,
        sentiment_negative: 6,
        sentiment_neutral: 25,

        notes: "Volunteer conversion behavior increasing.",
      },
    ];

    const rows = normalizeAnalyticsEvents(
      websitePayload,
      activeOrganizationId
    );

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("Website sync insert failed", error);

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
      source: "website",
      imported: data?.length ?? rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("Website sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Website sync failed.",
      },
      { status: 500 }
    );
  }
}