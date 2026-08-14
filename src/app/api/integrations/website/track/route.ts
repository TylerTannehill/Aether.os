import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize-analytics-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "website";
const SOURCE = "Campaign Website";
const DEPARTMENT = "digital";

type TrackBody = {
  tracker_id?: unknown;
  trackerId?: unknown;
  event?: unknown;
  event_name?: unknown;
  eventName?: unknown;
  path?: unknown;
  url?: unknown;
  referrer?: unknown;
  title?: unknown;
  label?: unknown;
  metric_date?: unknown;
  metricDate?: unknown;
  metadata?: unknown;
};

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function cleanString(value: unknown, maxLength = 2048) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  origin?: string | null
) {
  const response = NextResponse.json(body, { status });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  return response;
}

function normalizeOrigin(value: unknown) {
  const raw = cleanString(value, 500);
  if (!raw) return null;

  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return null;
  }
}

function getRequestOrigin(request: NextRequest) {
  return normalizeOrigin(request.headers.get("origin"));
}

function getEventMetrics(eventName: string) {
  switch (eventName) {
    case "page_view":
      return {
        impressions: 1,
        engagements: 0,
        clicks: 0,
      };

    case "click":
      return {
        impressions: 0,
        engagements: 1,
        clicks: 1,
      };

    case "engagement":
    case "interaction":
    case "signup":
    case "form_submit":
      return {
        impressions: 0,
        engagements: 1,
        clicks: 0,
      };

    default:
      return {
        impressions: 0,
        engagements: 1,
        clicks: 0,
      };
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = getRequestOrigin(request);

  return jsonResponse(
    {
      success: true,
    },
    200,
    origin
  );
}

export async function POST(request: NextRequest) {
  const origin = getRequestOrigin(request);

  try {
    const admin = getAdminClient();

    if (!admin) {
      console.error(
        "Website tracker is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
      );

      return jsonResponse(
        {
          success: false,
          error: "Website tracking is not configured.",
        },
        500,
        origin
      );
    }

    let body: TrackBody;

    try {
      body = (await request.json()) as TrackBody;
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid JSON body.",
        },
        400,
        origin
      );
    }

    const trackerId = cleanString(body.tracker_id ?? body.trackerId, 255);
    const eventName = (
      cleanString(body.event ?? body.event_name ?? body.eventName, 100) ||
      "page_view"
    ).toLowerCase();

    if (!trackerId) {
      return jsonResponse(
        {
          success: false,
          error: "Missing tracker_id.",
        },
        400,
        origin
      );
    }

    /*
     * The browser tracker uses the public tracker identifier stored in the
     * Website integration metadata. The private aether_web_* API credential
     * is never exposed to browser-side code.
     *
     * Website connections are stored in organization_integrations through
     * the shared integration connection store.
     */
    const { data: connection, error: connectionError } = await admin
      .from("organization_integrations")
      .select("*")
      .eq("provider", PROVIDER)
      .eq("status", "connected")
      .contains("metadata", { tracker_id: trackerId })
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Website tracker connection lookup failed",
        connectionError
      );

      return jsonResponse(
        {
          success: false,
          error: "Unable to resolve Website tracker.",
        },
        500,
        origin
      );
    }

    if (!connection) {
      return jsonResponse(
        {
          success: false,
          error: "Unknown or inactive Website tracker.",
        },
        401,
        origin
      );
    }

    const organizationId = cleanString(
      connection.organization_id ??
        connection.organizationId ??
        connection.org_id,
      255
    );

    if (!organizationId) {
      console.error(
        "Website tracker connection is missing organization_id",
        connection.id
      );

      return jsonResponse(
        {
          success: false,
          error: "Website tracker is not attached to an organization.",
        },
        500,
        origin
      );
    }

    const metadata =
      connection.metadata &&
      typeof connection.metadata === "object" &&
      !Array.isArray(connection.metadata)
        ? (connection.metadata as Record<string, unknown>)
        : {};

    const configuredOrigin = normalizeOrigin(
      metadata.website_origin ??
        metadata.websiteOrigin ??
        metadata.allowed_origin ??
        metadata.allowedOrigin
    );

    if (configuredOrigin && origin && configuredOrigin !== origin) {
      return jsonResponse(
        {
          success: false,
          error: "Website origin is not authorized for this tracker.",
        },
        403,
        origin
      );
    }

    const path = cleanString(body.path, 2048);
    const pageUrl = cleanString(body.url, 4096);
    const referrer = cleanString(body.referrer, 4096);
    const title = cleanString(body.title, 500);
    const label = cleanString(body.label, 500);
    const metricDate =
      cleanString(body.metric_date ?? body.metricDate, 100) ||
      new Date().toISOString();

    const eventMetadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    const metrics = getEventMetrics(eventName);

    const [normalizedEvent] = normalizeAnalyticsEvents(
      [
        {
          source: SOURCE,
          department: DEPARTMENT,
          platform: SOURCE,
          asset_name: path || title || eventName,
          metric_date: metricDate,
          impressions: metrics.impressions,
          engagements: metrics.engagements,
          clicks: metrics.clicks,
          spend: 0,
          sentiment_positive: 0,
          sentiment_negative: 0,
          sentiment_neutral: 0,
          notes: label || null,
          raw_payload: {
            provider: PROVIDER,
            tracker_id: trackerId,
            event: eventName,
            path,
            url: pageUrl,
            referrer,
            title,
            label,
            origin,
            metadata: eventMetadata,
          },
        },
      ],
      organizationId
    );

    const { error: insertError } = await admin
      .from("analytics_events")
      .insert(normalizedEvent);

    if (insertError) {
      console.error("Website tracker analytics insert failed", insertError);

      return jsonResponse(
        {
          success: false,
          error: "Unable to record Website analytics event.",
        },
        500,
        origin
      );
    }

    return jsonResponse(
      {
        success: true,
        accepted: 1,
      },
      200,
      origin
    );
  } catch (error) {
    console.error("Website tracker request failed", error);

    return jsonResponse(
      {
        success: false,
        error: "Website tracking request failed.",
      },
      500,
      origin
    );
  }
}
