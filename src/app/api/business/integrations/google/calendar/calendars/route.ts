import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing organizationId." },
        { status: 400 }
      );
    }

    const { data: integration } = await supabaseAdmin
      .from("organization_integrations")
      .select("status,provider_account_email")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .single();

    if (!integration || integration.status !== "connected") {
      return NextResponse.json(
        { success: false, error: "Google Workspace is not connected." },
        { status: 404 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    const google = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: google?.error?.message ?? `Failed to load Google calendars (${response.status})`,
        },
        { status: response.status }
      );
    }

    const calendars = (google.items ?? []).map((calendar: any) => ({
      id: calendar.id,
      name: calendar.summary ?? "",
      description: calendar.description ?? "",
      primary: calendar.primary ?? false,
      accessRole: calendar.accessRole ?? "",
      backgroundColor: calendar.backgroundColor ?? null,
      foregroundColor: calendar.foregroundColor ?? null,
      timeZone: calendar.timeZone ?? null,
      selected: calendar.selected ?? false,
    }));

    return NextResponse.json({
      success: true,
      account: integration.provider_account_email,
      calendars,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to load Google calendars." },
      { status: 500 }
    );
  }
}
