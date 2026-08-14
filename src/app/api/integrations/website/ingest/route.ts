import { NextResponse } from "next/server";

import {
  normalizeAnalyticsEvents,
  type RawAnalyticsEvent,
} from "@/lib/analytics/normalize-analytics-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PROVIDER = "website";
const SOURCE = "website_api";
const PLATFORM = "Campaign Website";
const MAX_EVENTS_PER_REQUEST = 500;

function getApiKey(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const headerKey = request.headers.get("x-aether-api-key")?.trim();
  return headerKey || null;
}

function asFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMetricValue(event: RawAnalyticsEvent) {
  return [
    event.impressions,
    event.engagements,
    event.engagement,
    event.interactions,
    event.clicks,
    event.spend,
    event.sentiment_positive,
    event.positive_sentiment,
    event.sentiment_negative,
    event.negative_sentiment,
    event.sentiment_neutral,
    event.neutral_sentiment,
  ].some((value) => asFiniteNumber(value) !== null);
}

function extractEvents(body: unknown): RawAnalyticsEvent[] {
  if (Array.isArray(body)) {
    return body as RawAnalyticsEvent[];
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (Array.isArray(record.events)) {
      return record.events as RawAnalyticsEvent[];
    }

    return [record as RawAnalyticsEvent];
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey(request);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Website API key required. Send it as Authorization: Bearer <key> or x-aether-api-key.",
        },
        { status: 401 }
      );
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("organization_integrations")
      .select("organization_id, provider, status, metadata")
      .eq("provider", PROVIDER)
      .eq("status", "connected")
      .eq("access_token", apiKey)
      .maybeSingle();

    if (connectionError) {
      console.error("Website ingest connection lookup failed", connectionError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate website API key.",
        },
        { status: 500 }
      );
    }

    if (!connection?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or inactive website API key.",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must be valid JSON.",
        },
        { status: 400 }
      );
    }

    const incomingEvents = extractEvents(body);

    if (incomingEvents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Send one analytics event, an array of events, or an object containing an events array.",
        },
        { status: 400 }
      );
    }

    if (incomingEvents.length > MAX_EVENTS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `A maximum of ${MAX_EVENTS_PER_REQUEST} analytics events may be sent per request.`,
        },
        { status: 413 }
      );
    }

    const invalidEventIndex = incomingEvents.findIndex(
      (event) =>
        !event ||
        typeof event !== "object" ||
        Array.isArray(event) ||
        !hasMetricValue(event)
    );

    if (invalidEventIndex >= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Event at index ${invalidEventIndex} does not contain any valid analytics metrics.`,
        },
        { status: 400 }
      );
    }

    const receivedAt = new Date().toISOString();

    const websiteEvents: RawAnalyticsEvent[] = incomingEvents.map((event) => ({
      ...event,
      source: SOURCE,
      department: "digital",
      platform: PLATFORM,
      raw_payload: {
        ...(event.raw_payload || {}),
        provider: PROVIDER,
        received_at: receivedAt,
        event,
      },
    }));

    const rows = normalizeAnalyticsEvents(
      websiteEvents,
      String(connection.organization_id)
    );

    const { data, error: insertError } = await supabaseAdmin
      .from("analytics_events")
      .insert(rows)
      .select("id");

    if (insertError) {
      console.error("Website ingest insert failed", insertError);

      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: PROVIDER,
        imported: data?.length ?? rows.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Website ingest failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Website analytics ingestion failed.",
      },
      { status: 500 }
    );
  }
}
