import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ingestContactsForOrganization } from "@/lib/ingestion/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WinRedIntegrationRow = {
  organization_id: string;
  metadata: Record<string, unknown> | null;
};

function getWebhookToken(request: Request) {
  const url = new URL(request.url);

  // Primary setup: append ?token=... to the Aether webhook URL in WinRed.
  const queryToken = url.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;

  // Also allow a token header for future/manual testing.
  const headerToken = request.headers.get("x-aether-webhook-token")?.trim();
  if (headerToken) return headerToken;

  return null;
}

async function findWinRedIntegration(
  webhookToken: string
): Promise<WinRedIntegrationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("organization_integrations")
    .select("organization_id, metadata")
    .eq("provider", "winred")
    .eq("status", "connected");

  if (error) {
    console.error("[WINRED WEBHOOK] Integration lookup failed", error);
    throw new Error("Unable to verify WinRed integration.");
  }

  const match = (data || []).find((row: WinRedIntegrationRow) => {
    const storedToken =
      typeof row.metadata?.webhook_token === "string"
        ? row.metadata.webhook_token
        : null;

    return storedToken === webhookToken;
  });

  return match || null;
}

export async function GET() {
  // Handy browser check: proves the route is deployed without accepting data.
  return NextResponse.json({
    success: true,
    provider: "winred",
    webhook: "ready",
  });
}

export async function POST(request: Request) {
  try {
    const webhookToken = getWebhookToken(request);

    if (!webhookToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook token.",
        },
        { status: 401 }
      );
    }

    const integration = await findWinRedIntegration(webhookToken);

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid WinRed webhook token.",
        },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const rawBody = await request.text();

      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    }

    if (
      payload === null ||
      payload === undefined ||
      (typeof payload === "string" && payload.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Empty WinRed webhook payload.",
        },
        { status: 400 }
      );
    }

    console.log("[WINRED WEBHOOK] Payload received", {
      organizationId: integration.organization_id,
      receivedAt: new Date().toISOString(),
      payload,
    });

    const payloadRecord =
      typeof payload === "object" && payload !== null && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null;

    if (!payloadRecord) {
      return NextResponse.json(
        {
          success: false,
          provider: "winred",
          error: "Unsupported WinRed webhook payload shape.",
        },
        { status: 400 }
      );
    }

    const nestedCandidate =
      (typeof payloadRecord.donor === "object" && payloadRecord.donor !== null
        ? payloadRecord.donor
        : null) ||
      (typeof payloadRecord.contributor === "object" &&
      payloadRecord.contributor !== null
        ? payloadRecord.contributor
        : null) ||
      (typeof payloadRecord.contact === "object" &&
      payloadRecord.contact !== null
        ? payloadRecord.contact
        : null) ||
      (typeof payloadRecord.data === "object" && payloadRecord.data !== null
        ? payloadRecord.data
        : null);

    const contactPayload: Record<string, unknown> = {
      ...payloadRecord,
      ...(nestedCandidate && !Array.isArray(nestedCandidate)
        ? (nestedCandidate as Record<string, unknown>)
        : {}),
    };

    const ingestion = await ingestContactsForOrganization(
      supabaseAdmin,
      integration.organization_id,
      [contactPayload]
    );

    console.log("[WINRED WEBHOOK] Contact ingestion completed", {
      organizationId: integration.organization_id,
      receivedAt: new Date().toISOString(),
      created: ingestion.created,
      updated: ingestion.updated,
      skipped: ingestion.skipped,
      errorCount: ingestion.errors.length,
    });

    if (ingestion.errors.length > 0) {
      console.error("[WINRED WEBHOOK] Contact ingestion errors", {
        organizationId: integration.organization_id,
        errors: ingestion.errors,
      });
    }

    return NextResponse.json({
      success: ingestion.errors.length === 0,
      provider: "winred",
      received: true,
      organizationId: integration.organization_id,
      ingestion,
      message:
        ingestion.errors.length === 0
          ? "WinRed webhook received and processed through Aether Contacts."
          : "WinRed webhook was received, but contact ingestion reported errors.",
    });
  } catch (error: any) {
    console.error("[WINRED WEBHOOK] Failed", error);

    return NextResponse.json(
      {
        success: false,
        provider: "winred",
        error: error?.message || "WinRed webhook failed.",
      },
      { status: 500 }
    );
  }
}
