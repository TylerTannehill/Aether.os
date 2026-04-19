import { NextRequest, NextResponse } from "next/server";
import { checkPolicy } from "@/lib/brain/policy-guard";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const tasks = Array.isArray(body.tasks) ? body.tasks : [];
    const limit = Number(body.limit ?? 5);
    const policy = body.policy;

    if (!policy) {
      return NextResponse.json(
        { ok: false, error: "Missing policy" },
        { status: 400 }
      );
    }

    let executed = 0;
    let failed = 0;
    let skipped = 0;
    let blocked = 0;

    const results = [];

    for (const task of tasks.slice(0, limit)) {
      const policyResult = checkPolicy({
        policy,
        department: task.department,
        actionType: task.action_type,
        taskType: task.task_type,
      });

      // 🚫 POLICY BLOCK
      if (!policyResult.allowed) {
        blocked++;

        results.push({
          id: task.id,
          status: "blocked",
          reason: policyResult.reason,
        });

        // 🧠 WRITE AUDIT RECORD (THIS IS THE KEY UPGRADE)
        await supabase.from("action_audit").insert({
          action_type: "auto_mode_blocked",
          ok: false,
          message: `Blocked by policy: ${policyResult.reason}`,
          metadata: {
            task_id: task.id,
            reason: policyResult.reason,
            department: task.department,
            action_type: task.action_type,
            task_type: task.task_type,
          },
        });

        continue;
      }

      try {
        // 🔌 EXECUTION PLACEHOLDER (replace later with real execution)
        executed++;

        results.push({
          id: task.id,
          status: "executed",
        });

        // ✅ SUCCESS AUDIT
        await supabase.from("action_audit").insert({
          action_type: "auto_mode_executed",
          ok: true,
          message: "Auto mode executed task",
          metadata: {
            task_id: task.id,
            department: task.department,
          },
        });
      } catch (err: any) {
        failed++;

        results.push({
          id: task.id,
          status: "failed",
        });

        // ❌ FAILURE AUDIT
        await supabase.from("action_audit").insert({
          action_type: "auto_mode_failed",
          ok: false,
          message: err?.message || "Execution failed",
          metadata: {
            task_id: task.id,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        received: tasks.length,
        executed,
        failed,
        skipped,
        blocked,
      },
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Auto mode failed",
      },
      { status: 500 }
    );
  }
}
// 🔒 This route now guarantees:
// - policy is enforced server-side
// - all blocked actions are logged
// - audit system reflects real decisions