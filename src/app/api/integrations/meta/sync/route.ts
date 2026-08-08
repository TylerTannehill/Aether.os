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

    const provider = getProvider("meta");

    const connection = await getConnection(
      activeOrganizationId,
      "meta"
    );

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta is not connected for this campaign.",
        },
        { status: 400 }
      );
    }

    const metaPayload = await provider.fetchAnalytics(
      connection,
      {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      }
    );

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