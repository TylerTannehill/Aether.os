import { NextRequest, NextResponse } from "next/server";
import {
  buildAutoModeResult,
  runAutoModeTasks,
  type AutoModePolicy,
  DEFAULT_AUTO_MODE_POLICY,
  type DashboardBrainPriorityTask,
} from "@/lib/brain";

type AutoModeTickRequest = {
  tasks?: DashboardBrainPriorityTask[];
  limit?: number;
  policy?: AutoModePolicy;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AutoModeTickRequest;

    const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
    const limit =
      typeof body?.limit === "number" && body.limit > 0
        ? Math.floor(body.limit)
        : 5;

    const policy = body?.policy ?? DEFAULT_AUTO_MODE_POLICY;

    const autoMode = buildAutoModeResult(tasks);
    const result = await runAutoModeTasks(autoMode.runNow, limit, policy);

    return NextResponse.json({
      ok: true,
      summary: {
        received: tasks.length,
        eligible: autoMode.runNow.length,
        blocked: autoMode.blocked.length,
        review: autoMode.needsReview.length,
        executed: result.executed.length,
        failed: result.failed.length,
        skipped: result.skipped.length,
        policyBlocked: result.blocked.length,
      },
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Auto mode tick failed",
      },
      { status: 500 }
    );
  }
}
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/auto-mode/tick",
    status: "ready",
    message: "Auto Mode tick endpoint is live.",
  });
}