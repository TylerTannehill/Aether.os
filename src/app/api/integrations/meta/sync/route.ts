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

    /**
     * TEMPORARY MOCK META PAYLOAD
     *
     * Replace later with real Meta API response.
     */

    const metaPayload = [
      {
        source: "meta_api",
        department: "digital",

        platform: "Meta",
        campaign_name: "Meta Awareness Campaign",
        asset_name: "Veterans Video Ad",

        metric_date: new Date().toISOString(),

        impressions: 248000,
        engagements: 14320,
        clicks: 3988,
        spend: 4210.42,

        sentiment_positive: 68,
        sentiment_negative: 17,
        sentiment_neutral: 15,

        notes: "Initial Meta integration sync.",
      },

      {
        source: "meta_api",
        department: "digital",

        platform: "Instagram",
        campaign_name: "Instagram Engagement Push",
        asset_name: "Town Hall Reel",

        metric_date: new Date().toISOString(),

        impressions: 112400,
        engagements: 22110,
        clicks: 2940,
        spend: 1280.55,

        sentiment_positive: 81,
        sentiment_negative: 9,
        sentiment_neutral: 10,

        notes: "Initial Instagram sync payload.",
      },
    ];

    const rows = normalizeAnalyticsEvents(
      metaPayload,
      activeOrganizationId
    );

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("Meta sync insert failed", error);

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
      source: "meta",
      imported: data?.length ?? rows.length,
      rows,
    });
  } catch (error: any) {
    console.error("Meta sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Meta sync failed.",
      },
      { status: 500 }
    );
  }
}