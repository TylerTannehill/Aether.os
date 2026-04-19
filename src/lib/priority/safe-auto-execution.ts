import { CommandCenterAdapterInput } from "@/lib/priority/command-center-adapter";
import {
  AutoExecutionAdapterResult,
  buildSafeAutoExecutionResult,
} from "@/lib/priority/auto-execution-adapter";
import { ActionItem } from "@/lib/priority/action-engine";
import {
  ExecuteActionResult,
  dryRunGovernedActionItem,
  executeGovernedActionItem,
} from "@/lib/priority/action-execution-client";

export const SAFE_AUTO_EXECUTION_TYPES: ActionItem["type"][] = [
  "complete_task",
  "follow_up_contact",
  "unblock_work",
  "monitor",
];

export interface SafeAutoExecutionRunItem {
  actionId: string;
  type: ActionItem["type"];
  title: string;
  executed: boolean;
  skipped: boolean;
  reason: string;
  result: ExecuteActionResult | null;
}

export interface SafeAutoExecutionRunSummary {
  scanned: number;
  eligible: number;
  executed: number;
  skipped: number;
  failed: number;
}

export interface SafeAutoExecutionRunResult {
  snapshotAt: string;
  autoExecution: AutoExecutionAdapterResult;
  executed: SafeAutoExecutionRunItem[];
  skipped: SafeAutoExecutionRunItem[];
  summary: SafeAutoExecutionRunSummary;
}

type RunSafeAutoExecutionOptions = {
  limit?: number;
  dryRun?: boolean;
};

function buildSummary(
  executed: SafeAutoExecutionRunItem[],
  skipped: SafeAutoExecutionRunItem[],
  scanned: number,
  eligible: number
): SafeAutoExecutionRunSummary {
  const executedCount = executed.filter((item) => item.executed).length;
  const failedCount = executed.filter(
    (item) => item.executed && !item.result?.ok
  ).length;

  return {
    scanned,
    eligible,
    executed: executedCount,
    skipped: skipped.length,
    failed: failedCount,
  };
}

function toSkippedItem(
  action: ActionItem,
  reason: string,
  result: ExecuteActionResult | null = null
): SafeAutoExecutionRunItem {
  return {
    actionId: action.id,
    type: action.type,
    title: action.title,
    executed: false,
    skipped: true,
    reason,
    result,
  };
}

function toExecutedItem(
  action: ActionItem,
  result: ExecuteActionResult
): SafeAutoExecutionRunItem {
  return {
    actionId: action.id,
    type: action.type,
    title: action.title,
    executed: true,
    skipped: false,
    reason: result.message,
    result,
  };
}

function getSafeEligibleActions(
  autoExecution: AutoExecutionAdapterResult,
  limit: number
): ActionItem[] {
  return autoExecution.autoExecution.autoExecutable
    .map((item) => item.action)
    .filter((action) => SAFE_AUTO_EXECUTION_TYPES.includes(action.type))
    .slice(0, limit);
}

async function runAction(
  action: ActionItem,
  dryRun: boolean
): Promise<SafeAutoExecutionRunItem> {
  const result = dryRun
    ? await dryRunGovernedActionItem(action, undefined)
    : await executeGovernedActionItem(action, undefined);

  if (dryRun) {
    return toSkippedItem(action, `Dry run only → ${result.message}`, result);
  }

  if (result.ok) {
    return toExecutedItem(action, result);
  }

  return toSkippedItem(action, result.message || "Execution failed", result);
}

export async function runSafeAutoExecution(
  input: CommandCenterAdapterInput,
  options?: RunSafeAutoExecutionOptions
): Promise<SafeAutoExecutionRunResult> {
  const limit = options?.limit ?? 10;
  const dryRun = Boolean(options?.dryRun);

  const autoExecution = buildSafeAutoExecutionResult(input);
  const eligibleActions = getSafeEligibleActions(autoExecution, limit);

  const executed: SafeAutoExecutionRunItem[] = [];
  const skipped: SafeAutoExecutionRunItem[] = [];

  for (const action of eligibleActions) {
    try {
      const result = await runAction(action, dryRun);

      if (result.executed) {
        executed.push(result);
      } else {
        skipped.push(result);
      }
    } catch (error: any) {
      skipped.push(
        toSkippedItem(
          action,
          error?.message || "Unexpected failure during safe auto execution"
        )
      );
    }
  }

  return {
    snapshotAt: new Date().toISOString(),
    autoExecution,
    executed,
    skipped,
    summary: buildSummary(
      executed,
      skipped,
      autoExecution.actionEngine.actions.length,
      eligibleActions.length
    ),
  };
}

export async function runSafeAutoExecutionDryRun(
  input: CommandCenterAdapterInput,
  limit = 10
): Promise<SafeAutoExecutionRunResult> {
  return runSafeAutoExecution(input, {
    limit,
    dryRun: true,
  });
}

export function getSafeAutoExecutionPreview(
  input: CommandCenterAdapterInput,
  limit = 10
) {
  const autoExecution = buildSafeAutoExecutionResult(input);

  const eligibleActions = getSafeEligibleActions(autoExecution, limit);

  return {
    snapshotAt: new Date().toISOString(),
    totalActions: autoExecution.actionEngine.actions.length,
    autoExecutable: autoExecution.autoExecution.autoExecutable.length,
    eligibleSafeActions: eligibleActions.length,
    actions: eligibleActions.map((action) => ({
      id: action.id,
      type: action.type,
      title: action.title,
      level: action.level,
      score: action.score,
      badges: action.badges,
    })),
  };
}