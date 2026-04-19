import { AutoModeTask } from "./auto-mode";
import {
  AutoModePolicy,
  DEFAULT_AUTO_MODE_POLICY,
  evaluateAutoModePolicy,
} from "./auto-mode-policy";
import { ActionItem } from "@/lib/priority/action-engine";
import {
  buildExecuteRequestFromAction,
  ExecuteActionResult,
  executeGovernedActionItem,
} from "@/lib/priority/action-execution-client";

export type AutoRunnerBlockedTask = AutoModeTask & {
  blocked_by_policy: true;
  blocked_reason: string;
};

export type AutoRunnerResult = {
  executed: ExecuteActionResult[];
  skipped: AutoModeTask[];
  failed: ExecuteActionResult[];
  blocked: AutoRunnerBlockedTask[];
};

function canConvertToAction(task: AutoModeTask): boolean {
  return Boolean((task as AutoModeTask & { action_type?: string }).action_type);
}

function convertTaskToAction(task: AutoModeTask): ActionItem | null {
  const actionType = (task as AutoModeTask & { action_type?: string }).action_type;

  if (!actionType) {
    return null;
  }

  return {
    id: task.id,
    type: actionType as ActionItem["type"],
    bucket: "do_next",
    level: task.brain_tier,
    score: Math.round((task.brain_score ?? 0) * 100),
    title: task.title,
    summary: task.brain_reasons?.[0] ?? task.title,
    reason: task.brain_reasons?.[0] ?? task.title,
    recommendedAction: task.brain_reasons?.[0] ?? task.title,
    targets: [],
    sourceIds: [task.id],
    badges: task.brain_reasons?.slice(0, 4) ?? [],
    createdAt: new Date().toISOString(),
  };
}

export async function runAutoModeTasks(
  tasks: AutoModeTask[],
  limit: number = 5,
  policy: AutoModePolicy = DEFAULT_AUTO_MODE_POLICY
): Promise<AutoRunnerResult> {
  const safeTasks = Array.isArray(tasks) ? tasks.slice(0, limit) : [];

  const executed: ExecuteActionResult[] = [];
  const failed: ExecuteActionResult[] = [];
  const skipped: AutoModeTask[] = [];
  const blocked: AutoRunnerBlockedTask[] = [];

  for (const task of safeTasks) {
    const policyDecision = evaluateAutoModePolicy(task, policy);

    if (!policyDecision.allowed) {
      blocked.push({
        ...task,
        blocked_by_policy: true,
        blocked_reason: policyDecision.reason,
      });
      continue;
    }

    const action = convertTaskToAction(task);

    if (!action) {
      skipped.push(task);
      continue;
    }

    try {
      const payload = buildExecuteRequestFromAction(action).payload;
      const result = await executeGovernedActionItem(action, payload);

      if (result.ok) {
        executed.push(result);
      } else {
        failed.push(result);
      }
    } catch (err: any) {
      failed.push({
        ok: false,
        type: action.type,
        actionId: action.id,
        dryRun: false,
        message: err?.message || "Auto execution failed",
        mutations: [],
        results: [],
        error: err?.message || "Auto execution failed",
      });
    }
  }

  return {
    executed,
    failed,
    skipped,
    blocked,
  };
}