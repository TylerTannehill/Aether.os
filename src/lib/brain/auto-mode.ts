import { DashboardBrainPriorityTask } from "./dashboard-brain-adapter";
import { ActionItem } from "@/lib/priority/action-engine";
import {
  AutoExecutionDisposition,
  evaluateAutoExecutionAction,
} from "@/lib/priority/auto-execution";

export type AutoModeTask = DashboardBrainPriorityTask & {
  auto_mode_reason: string;
};

export type AutoModeResult = {
  runNow: AutoModeTask[];
  needsReview: AutoModeTask[];
  blocked: AutoModeTask[];
  summary: {
    total: number;
    runNow: number;
    needsReview: number;
    blocked: number;
  };
};

function getTaskStatus(task: DashboardBrainPriorityTask): string {
  return String(task.status ?? "open").trim().toLowerCase();
}

function isCompleted(task: DashboardBrainPriorityTask): boolean {
  return getTaskStatus(task) === "completed";
}

function isBlocked(task: DashboardBrainPriorityTask): boolean {
  return Boolean(task.blocked) || task.fallback_reason === "blocked_dependency";
}

function isManualOnly(task: DashboardBrainPriorityTask): boolean {
  return Boolean(task.manual_override);
}

function convertTaskToAction(task: DashboardBrainPriorityTask): ActionItem | null {
  const actionType = (task as DashboardBrainPriorityTask & { action_type?: string })
    .action_type;

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

function buildLegacyReason(
  task: DashboardBrainPriorityTask,
  disposition?: AutoExecutionDisposition,
  dispositionReason?: string
): string {
  if (isCompleted(task)) {
    return "Already completed.";
  }

  if (isBlocked(task)) {
    return "Blocked by dependency or workflow constraint.";
  }

  if (isManualOnly(task)) {
    return "Marked manual-only and requires a human decision.";
  }

  if (!task.brain_auto_execute) {
    return "Brain did not mark this item safe for auto execution.";
  }

  if (task.brain_tier !== "critical" && task.brain_tier !== "high") {
    return "Priority is below auto-run threshold.";
  }

  if (dispositionReason) {
    return dispositionReason;
  }

  if (disposition === "auto_execute") {
    return "Safe to auto-run now.";
  }

  return "Needs manual review.";
}

export function buildAutoModeResult(
  tasks: DashboardBrainPriorityTask[]
): AutoModeResult {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const runNow: AutoModeTask[] = [];
  const needsReview: AutoModeTask[] = [];
  const blocked: AutoModeTask[] = [];

  for (const task of safeTasks) {
    const action = convertTaskToAction(task);
    const unifiedDecision = action ? evaluateAutoExecutionAction(action) : null;

    const disposition = unifiedDecision?.disposition;
    const dispositionReason = unifiedDecision?.reason;

    const enrichedTask: AutoModeTask = {
      ...task,
      auto_mode_reason: buildLegacyReason(task, disposition, dispositionReason),
    };

    if (isBlocked(task) || disposition === "blocked") {
      blocked.push(enrichedTask);
      continue;
    }

    if (disposition === "auto_execute") {
      runNow.push(enrichedTask);
      continue;
    }

    needsReview.push(enrichedTask);
  }

  const sortByPriority = (a: AutoModeTask, b: AutoModeTask) => {
    if ((b.brain_score ?? 0) !== (a.brain_score ?? 0)) {
      return (b.brain_score ?? 0) - (a.brain_score ?? 0);
    }

    const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    return a.title.localeCompare(b.title);
  };

  runNow.sort(sortByPriority);
  needsReview.sort(sortByPriority);
  blocked.sort(sortByPriority);

  return {
    runNow,
    needsReview,
    blocked,
    summary: {
      total: safeTasks.length,
      runNow: runNow.length,
      needsReview: needsReview.length,
      blocked: blocked.length,
    },
  };
}