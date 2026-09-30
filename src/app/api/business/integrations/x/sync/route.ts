import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize-analytics-events";
import { getProvider } from "@/lib/integrations/registry";
import { getConnection } from "@/lib/integrations/connection-store";

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

    const provider = getProvider("x");

    const connection = await getConnection(
      activeOrganizationId,
      "x"
    );

    if (
      !connection ||
      connection.status !== "connected" ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "X is not connected for this organization.",
        },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 30);

    const xPayload = await provider.fetchAnalytics(
      connection,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    );

    const rows = normalizeAnalyticsEvents(
      xPayload,
      activeOrganizationId
    );

    const startDateString = startDate.toISOString().slice(0, 10);
    const endDateString = endDate.toISOString().slice(0, 10);

    const { error: deleteError } = await supabase
      .from("analytics_events")
      .delete()
      .eq("organization_id", activeOrganizationId)
      .eq("source", "x")
      .eq("platform", "x")
      .gte("metric_date", startDateString)
      .lte("metric_date", endDateString);

    if (deleteError) {
      console.error("[BUSINESS X SYNC] X sync cleanup failed", deleteError);

      return NextResponse.json(
        {
          success: false,
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        source: "x",
        imported: 0,
        rows: [],
        message: "X returned no analytics rows in the current sync window.",
      });
    }

    const { data, error } = await supabase
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (error) {
      console.error("[BUSINESS X SYNC] X sync insert failed", error);

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
    console.error("[BUSINESS X SYNC] X sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "X sync failed.",
      },
      { status: 500 }
    );
  }
}
