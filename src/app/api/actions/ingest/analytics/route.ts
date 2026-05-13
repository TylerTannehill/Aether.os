import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

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

    const rows = events.map((event: any) => ({
      organization_id: member.organization_id,

      source: String(event.source || "csv"),
      department: String(event.department || "digital"),

      platform: event.platform || null,
      campaign_name: event.campaign_name || null,
      asset_name: event.asset_name || null,

      metric_date: toDate(event.metric_date),

      impressions: Math.round(toNumber(event.impressions)),
      engagements: Math.round(toNumber(event.engagements)),
      clicks: Math.round(toNumber(event.clicks)),
      spend: toNumber(event.spend),

      sentiment_positive: Math.round(toNumber(event.sentiment_positive)),
      sentiment_negative: Math.round(toNumber(event.sentiment_negative)),
      sentiment_neutral: Math.round(toNumber(event.sentiment_neutral)),

      notes: event.notes || null,
      raw_payload: event.raw_payload || {},
    }));

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
