import {
  ActionEngineResult,
  ActionItem,
  buildActionEngine,
  createActionEngineResult,
} from "@/lib/priority/action-engine";
import {
  CommandCenterAdapterInput,
  CommandCenterAdapterResult,
  buildCommandCenterAdapterResult,
} from "@/lib/priority/command-center-adapter";

export interface ActionEngineAdapterResult extends CommandCenterAdapterResult {
  actionEngine: ActionEngineResult;
}

export function buildActionEngineAdapterResult(
  input: CommandCenterAdapterInput
): ActionEngineAdapterResult {
  const commandCenter = buildCommandCenterAdapterResult(input);

  const actionEngine = buildActionEngine({
    priorityResults: commandCenter.priorityResults,
    ownerSignals: commandCenter.ownerSignals,
    snapshot: commandCenter.snapshot,
    now: input.now,
  });

  return {
    ...commandCenter,
    actionEngine,
  };
}

export function buildUnifiedActionEngineAdapterResult(
  input: CommandCenterAdapterInput,
  additionalActions: ActionItem[] = []
): ActionEngineAdapterResult {
  const base = buildActionEngineAdapterResult(input);

  if (!additionalActions.length) {
    return base;
  }

  return {
    ...base,
    actionEngine: createActionEngineResult([
      ...base.actionEngine.actions,
      ...additionalActions,
    ]),
  };
}

export function buildActionEngineFromData(
  input: CommandCenterAdapterInput
): ActionEngineResult {
  return buildActionEngineAdapterResult(input).actionEngine;
}

export function buildActionsForOwner(
  ownerId: string,
  input: CommandCenterAdapterInput
): ActionEngineAdapterResult {
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

  return buildActionEngineAdapterResult(filteredInput);
}

export function buildActionEngineSummary(
  input: CommandCenterAdapterInput
) {
  const result = buildActionEngineAdapterResult(input);

  return {
    snapshot: result.snapshot,
    summary: result.actionEngine.summary,
    topActions: result.actionEngine.topActions,
    topAlerts: result.snapshot.alerts.slice(0, 6),
    topFocus: result.snapshot.topFocus.slice(0, 8),
    topOwnerRisks: result.ownerSignals.slice(0, 5),
  };
}

export function buildImmediateActionQueue(
  input: CommandCenterAdapterInput
) {
  const result = buildActionEngineAdapterResult(input);

  return result.actionEngine.actions.filter(
    (action) =>
      action.bucket === "fix_now" ||
      action.bucket === "owner" ||
      action.level === "critical"
  );
}

export function buildFocusModeActionQueue(
  input: CommandCenterAdapterInput,
  limit = 10
) {
  const result = buildActionEngineAdapterResult(input);

  return result.actionEngine.actions
    .filter(
      (action) =>
        action.bucket === "fix_now" ||
        action.bucket === "follow_up" ||
        action.bucket === "pipeline"
    )
    .slice(0, limit);
}