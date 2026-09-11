import { NextRequest, NextResponse } from "next/server";

import { syncAnalyticsForAllOrganizations } from "@/lib/integrations/analytics-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Analytics cron blocked: CRON_SECRET is not configured.");
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const startedAt = new Date();

  try {
    const summary = await syncAnalyticsForAllOrganizations();
    const finishedAt = new Date();

    console.log("Hourly analytics sync completed", {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      organizations: summary.organizations,
      attempted: summary.attempted,
      succeeded: summary.succeeded,
      failed: summary.failed,
      skipped: summary.skipped,
    });

    return NextResponse.json({
      success: summary.failed === 0,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      ...summary,
    });
  } catch (error: any) {
    const finishedAt = new Date();

    console.error("Hourly analytics sync failed", error);

    return NextResponse.json(
      {
        success: false,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        error: error?.message || "Hourly analytics sync failed.",
      },
      { status: 500 }
    );
  }
}
