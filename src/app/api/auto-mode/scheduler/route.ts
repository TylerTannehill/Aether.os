import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/dashboard";
import { fullName } from "@/lib/data/utils";
import {
  buildDashboardBrainOutput,
  buildAutoModeResult,
  runAutoModeTasks,
  type AutoModePolicy,
  DEFAULT_AUTO_MODE_POLICY,
} from "@/lib/brain";

function buildOwnerDirectory(data: {
  contacts?: any[];
  tasks?: any[];
}): Record<string, string> {
  const map: Record<string, string> = {};

  (data.contacts ?? []).forEach((contact: any) => {
    const ownerId =
      contact.owner_id ??
      contact.assigned_to ??
      contact.owner ??
      contact.owner_name;

    const ownerName =
      contact.owner_name ??
      contact.owner ??
      contact.assigned_to ??
      contact.owner_id;

    if (ownerId) {
      map[String(ownerId)] = String(ownerName || ownerId);
    }
  });

  (data.tasks ?? []).forEach((task: any) => {
    const ownerId = task.owner_id ?? task.assigned_to;
    const ownerName = task.owner_name ?? task.assigned_to ?? task.owner_id;

    if (ownerId) {
      map[String(ownerId)] = String(ownerName || ownerId);
    }
  });

  return map;
}

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in_progress", "in progress", "active"].includes(value)) {
    return "in_progress";
  }

  return value || "open";
}

function isFallbackTask(taskType?: string | null) {
  return (taskType || "").trim().toLowerCase() === "fallback";
}

type SchedulerRequestBody = {
  limit?: number;
  policy?: AutoModePolicy;
};
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-auto-mode-secret");
    const expectedSecret = process.env.AUTO_MODE_SECRET;

    if (expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized scheduler trigger",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as SchedulerRequestBody;

    const limit =
      typeof body?.limit === "number" && body.limit > 0
        ? Math.floor(body.limit)
        : 5;

    const policy = body?.policy ?? DEFAULT_AUTO_MODE_POLICY;

    const data = await getDashboardData();

    const ownerDirectory = buildOwnerDirectory({
      contacts: data.contacts ?? [],
      tasks: data.tasks ?? [],
    });

    const brainOutput = buildDashboardBrainOutput({
      tasks: (data.tasks ?? []).map((task: any) => ({
        id: String(task.id),
        title: task.title ?? "Untitled task",
        description: task.description ?? null,
        status: normalizeTaskStatus(task.status),
        priority: task.priority ?? null,
        due_at: task.due_at ?? task.due_date ?? null,
        created_at: task.created_at ?? null,
        updated_at: task.updated_at ?? null,
        completed_at:
          normalizeTaskStatus(task.status) === "completed"
            ? task.updated_at ?? task.completed_at ?? null
            : task.completed_at ?? null,
        assigned_to: task.assigned_to ?? null,
        owner_id: task.owner_id ?? null,
        owner_name: task.owner_name ?? null,
        owner_role: task.role ?? null,
        department: task.department ?? null,
        fallback_reason: task.fallback_reason ?? null,
        route_type: isFallbackTask(task.task_type)
          ? "fallback"
          : task.task_type ?? null,
        task_type: task.task_type ?? null,
        manual_override:
          task.fallback_reason === "manual_override" ||
          Boolean(task.manual_override),
        blocked: Boolean(task.blocked),
        contact_id: task.contact_id ?? null,
        estimated_value: Number(task.estimated_value ?? 0) || null,
      })),
      contacts: (data.contacts ?? []).map((contact: any) => ({
        id: String(contact.id),
        first_name: contact.first_name ?? null,
        last_name: contact.last_name ?? null,
        full_name:
          contact.full_name ??
          fullName(contact.first_name ?? "", contact.last_name ?? ""),
        owner_id: contact.owner_id ?? null,
        assigned_to: contact.assigned_to ?? contact.owner ?? null,
        owner_name: contact.owner_name ?? contact.owner ?? null,
        owner_role: null,
        last_contacted_at:
          contact.last_contacted_at ??
          contact.last_outreach_at ??
          contact.updated_at ??
          null,
        updated_at: contact.updated_at ?? null,
        created_at: contact.created_at ?? null,
        phone: contact.phone ?? null,
        email: contact.email ?? null,
        city: contact.city ?? null,
        state: contact.state ?? null,
        employer: contact.employer ?? null,
        occupation: contact.occupation ?? null,
        donor_status: contact.donor_status ?? null,
        pledge_amount: Number(contact.pledge_amount ?? 0) || null,
        donation_total: Number(contact.donation_total ?? 0) || null,
        lifetime_value:
          Number(contact.lifetime_value ?? contact.donation_total ?? 0) || null,
        support_score: Number(contact.support_score ?? 0) || null,
        engagement_score: Number(contact.engagement_score ?? 0) || null,
        needs_follow_up: Boolean(contact.needs_follow_up),
        is_stale: Boolean(contact.is_stale),
      })),
      ownerDirectory,
    });

    const autoMode = buildAutoModeResult(brainOutput.priorityTasks);
    const result = await runAutoModeTasks(autoMode.runNow, limit, policy);

    return NextResponse.json({
      ok: true,
      summary: {
        totalTasks: brainOutput.priorityTasks.length,
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
        error: err?.message || "Scheduler run failed",
      },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("x-auto-mode-secret");
  const expectedSecret = process.env.AUTO_MODE_SECRET;

  if (expectedSecret && authHeader !== expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized scheduler status check",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    route: "/api/auto-mode/scheduler",
    status: "ready",
    message:
      "Scheduler endpoint is live. POST to run Auto Mode on current dashboard data.",
  });
}