import {
  AutoExecutionOptions,
  AutoExecutionResult,
  buildAutoExecutionPlan,
} from "@/lib/priority/auto-execution";
import {
  ActionEngineAdapterResult,
  buildActionEngineAdapterResult,
} from "@/lib/priority/action-engine-adapter";
import { CommandCenterAdapterInput } from "@/lib/priority/command-center-adapter";

export interface AutoExecutionAdapterResult extends ActionEngineAdapterResult {
  autoExecution: AutoExecutionResult;
}

export function buildAutoExecutionAdapterResult(
  input: CommandCenterAdapterInput,
  options?: AutoExecutionOptions
): AutoExecutionAdapterResult {
  const actionEngineResult = buildActionEngineAdapterResult(input);

  const autoExecution = buildAutoExecutionPlan(
    actionEngineResult.actionEngine.actions,
    options
  );

  return {
    ...actionEngineResult,
    autoExecution,
  };
}

export function buildAutoExecutionFromData(
  input: CommandCenterAdapterInput,
  options?: AutoExecutionOptions
): AutoExecutionResult {
  return buildAutoExecutionAdapterResult(input, options).autoExecution;
}

export function buildAutoExecutionSummary(
  input: CommandCenterAdapterInput,
  options?: AutoExecutionOptions
) {
  const result = buildAutoExecutionAdapterResult(input, options);

  return {
    snapshot: result.snapshot,
    actionSummary: result.actionEngine.summary,
    autoExecutionSummary: result.autoExecution.summary,
    executionSettings: result.autoExecution.settings,
    autoExecutable: result.autoExecution.autoExecutable.slice(0, 6),
    manualReview: result.autoExecution.manualReview.slice(0, 6),
    blocked: result.autoExecution.blocked.slice(0, 6),
  };
}

export function buildAutoExecutionForOwner(
  ownerId: string,
  input: CommandCenterAdapterInput,
  options?: AutoExecutionOptions
): AutoExecutionAdapterResult {
  const filteredInput: CommandCenterAdapterInput = {
    tasks: (input.tasks ?? []).filter((task) => {
      const taskOwnerId = task.owner_id ?? task.assigned_to;
      return taskOwnerId === ownerId;
    }),
    contacts: (input.contacts ?? []).filter((contact) => {
      const contactOwnerId = contact.owner_id ?? contact.assigned_to;
      return contactOwnerId === ownerId;
    }),
    opportunities: (input.opportunities ?? []).filter(
      (opportunity) => opportunity.owner_id === ownerId
    ),
    ownerDirectory: input.ownerDirectory
      ? { [ownerId]: input.ownerDirectory[ownerId] ?? ownerId }
      : { [ownerId]: ownerId },
    now: input.now,
  };

  return buildAutoExecutionAdapterResult(filteredInput, options);
}

export function buildSafeAutoExecutionResult(
  input: CommandCenterAdapterInput
): AutoExecutionAdapterResult {
  return buildAutoExecutionAdapterResult(input, {
    mode: "hybrid",
    requireApproval: true,
    allowActionTypes: [
      "complete_task",
      "follow_up_contact",
      "unblock_work",
      "monitor",
    ],
    minimumConfidence: 75,
    maximumRiskLevel: "low",
  });
}

export function buildManualExecutionResult(
  input: CommandCenterAdapterInput,
  options?: Omit<AutoExecutionOptions, "mode">
): AutoExecutionAdapterResult {
  return buildAutoExecutionAdapterResult(input, {
    ...options,
    mode: "manual",
  });
}

export function buildFullAutoExecutionResult(
  input: CommandCenterAdapterInput,
  options?: Omit<AutoExecutionOptions, "mode" | "requireApproval">
): AutoExecutionAdapterResult {
  return buildAutoExecutionAdapterResult(input, {
    ...options,
    mode: "auto",
    requireApproval: false,
  });
}