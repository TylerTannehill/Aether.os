import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/dashboard";
import { fullName } from "@/lib/data/utils";
import {
  getSafeAutoExecutionPreview,
  runSafeAutoExecution,
} from "@/lib/priority/safe-auto-execution";
import { CommandCenterAdapterInput } from "@/lib/priority/command-center-adapter";

export const runtime = "nodejs";

type AutoExecutionRunRequest = {
  dryRun?: boolean;
  limit?: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status: 400 }
  );
}

function serverError(message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details: details ?? null,
    },
    { status: 500 }
  );
}
function buildCommandCenterInput(): Promise<CommandCenterAdapterInput> {
  return getDashboardData().then((data) => {
    const tasks = (data.tasks ?? []).map((task: any) => ({
      id: String(task.id),
      title: task.title ?? "Untitled task",
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
      department: task.department ?? null,
      fallback_reason: task.fallback_reason ?? null,
      route_type: isFallbackTask(task.task_type)
        ? "fallback"
        : task.task_type ?? null,
      manual_override:
        task.fallback_reason === "manual_override" ||
        Boolean(task.manual_override),
      blocked: Boolean(task.blocked),
      contact_id: task.contact_id ?? null,
      estimated_value: Number(task.estimated_value ?? 0) || null,
    }));

    const contacts = (data.contacts ?? []).map((contact: any) => ({
      id: String(contact.id),
      first_name: contact.first_name ?? null,
      last_name: contact.last_name ?? null,
      full_name:
        contact.full_name ??
        contact.full_name ?? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
      owner_id: contact.owner_id ?? null,
      assigned_to: contact.assigned_to ?? contact.owner ?? null,
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
    }));

    const ownerDirectory: Record<string, string> = {};

    contacts.forEach((contact: any) => {
      const ownerId =
        contact.owner_id ?? contact.assigned_to ?? null;
      const ownerName =
        contact.assigned_to ?? contact.owner_id ?? null;

      if (isNonEmptyString(ownerId)) {
        ownerDirectory[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    tasks.forEach((task: any) => {
      const ownerId = task.owner_id ?? task.assigned_to;
      const ownerName = task.assigned_to ?? task.owner_id;

      if (isNonEmptyString(ownerId)) {
        ownerDirectory[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    return {
      tasks,
      contacts,
      opportunities: [],
      ownerDirectory,
    };
  });
}
export async function GET() {
  try {
    const input = await buildCommandCenterInput();
    const preview = getSafeAutoExecutionPreview(input, 10);

    return NextResponse.json({
      ok: true,
      route: "/api/auto-execution/run",
      mode: "safe",
      preview,
      supportedTypes: [
        "complete_task",
        "follow_up_contact",
        "unblock_work",
        "monitor",
      ],
    });
  } catch (error: any) {
    return serverError(
      error?.message || "Failed to build safe auto execution preview"
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as AutoExecutionRunRequest;

    if (!isObject(body)) {
      return badRequest("Invalid request body");
    }

    const dryRun = Boolean(body.dryRun);
    const limit =
      typeof body.limit === "number" && Number.isFinite(body.limit)
        ? Math.max(1, Math.min(50, Math.floor(body.limit)))
        : 10;

    const input = await buildCommandCenterInput();
    const result = await runSafeAutoExecution(input, {
      dryRun,
      limit,
    });

    return NextResponse.json(
      {
        ok: true,
        mode: "safe",
        dryRun,
        limit,
        result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return serverError(
      error?.message || "Failed to run safe auto execution"
    );
  }
}
export async function OPTIONS() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/auto-execution/run",
      methods: ["GET", "POST"],
      usage: {
        GET: "Preview safe auto execution actions",
        POST: {
          description: "Run safe auto execution",
          body: {
            dryRun: "boolean (optional) → preview only, no mutations",
            limit: "number (optional, default 10, max 50)",
          },
        },
      },
    },
    { status: 200 }
  );
}
