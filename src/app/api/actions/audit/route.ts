import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActionAuditTableCandidates } from "@/lib/priority/action-audit";

export const runtime = "nodejs";

type AuditQueryParams = {
  limit: number;
  actionType?: string | null;
  ok?: boolean | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    if (isNonEmptyString(value)) return value.trim();
  }
  return null;
}

function getServerSupabaseConfig() {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL
  );

  const secretKey = firstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_KEY
  );

  if (!url || !secretKey) {
    throw new Error(
      [
        "Missing Supabase server environment variables.",
        "Expected:",
        "- NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)",
        "- SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_KEY)",
      ].join(" ")
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error("Invalid Supabase URL in NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL");
  }

  return { url, secretKey };
}

function getSupabaseAdmin() {
  const { url, secretKey } = getServerSupabaseConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

function parseBoolean(value: string | null): boolean | null {
  if (!value) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
function parseQueryParams(request: NextRequest): AuditQueryParams {
  const { searchParams } = new URL(request.url);

  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(100, Math.floor(rawLimit)))
    : 20;

  const actionType = searchParams.get("actionType");
  const ok = parseBoolean(searchParams.get("ok"));

  return {
    limit,
    actionType: isNonEmptyString(actionType) ? actionType.trim() : null,
    ok,
  };
}

async function readAuditRecords(
  params: AuditQueryParams
): Promise<{
  table: string | null;
  records: Record<string, unknown>[];
}> {
  const supabase = getSupabaseAdmin();
  const tableCandidates = getActionAuditTableCandidates();
  let lastError: string | null = null;

  for (const table of tableCandidates) {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(params.limit);

    if (params.actionType) {
      query = query.eq("action_type", params.actionType);
    }

    if (typeof params.ok === "boolean") {
      query = query.eq("ok", params.ok);
    }

    const { data, error } = await query;

    if (!error) {
      return {
        table,
        records: Array.isArray(data) ? data : [],
      };
    }

    lastError = error.message;
  }

  throw new Error(lastError || "Unable to read action audit records");
}
function buildAuditSummary(records: Record<string, unknown>[]) {
  const total = records.length;

  const successful = records.filter((record) => record.ok === true).length;
  const failed = records.filter((record) => record.ok === false).length;
  const dryRuns = records.filter((record) => record.dry_run === true).length;

  const byActionType = records.reduce<Record<string, number>>((acc, record) => {
    const actionType =
      typeof record.action_type === "string" && record.action_type.trim().length
        ? record.action_type
        : "unknown";

    acc[actionType] = (acc[actionType] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    successful,
    failed,
    dryRuns,
    byActionType,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request);
    const result = await readAuditRecords(params);

    return NextResponse.json({
      ok: true,
      route: "/api/actions/audit",
      table: result.table,
      filters: {
        limit: params.limit,
        actionType: params.actionType,
        ok: params.ok,
      },
      summary: buildAuditSummary(result.records),
      records: result.records,
    });
  } catch (error: any) {
    return serverError(
      error?.message || "Failed to load execution audit records"
    );
  }
}
export async function OPTIONS() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/actions/audit",
      methods: ["GET"],
      usage: {
        GET: {
          description: "Read recent action execution audit records",
          query: {
            limit: "number (optional, default 20, max 100)",
            actionType: "string (optional)",
            ok: "true | false (optional)",
          },
        },
      },
    },
    { status: 200 }
  );
}
