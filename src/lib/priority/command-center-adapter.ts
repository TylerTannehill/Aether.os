import {
  PriorityContactInput,
  PriorityOpportunityInput,
  PriorityScoreResult,
  PriorityTaskInput,
  scoreContact,
  scoreOpportunity,
  scoreOwnerQueue,
  scoreTask,
} from "@/lib/priority/priority-engine";
import {
  OwnerContactInput,
  OwnerSignalsResult,
  OwnerTaskInput,
  buildOwnerSignals,
} from "@/lib/priority/owner-signals";
import {
  CommandCenterSnapshot,
  buildCommandCenterSnapshot,
} from "@/lib/priority/command-center";

export interface CommandCenterAdapterInput {
  tasks?: PriorityTaskInput[] | null;
  contacts?: PriorityContactInput[] | null;
  opportunities?: PriorityOpportunityInput[] | null;
  ownerDirectory?: Record<string, string> | null;
  now?: Date;
}

export interface CommandCenterAdapterResult {
  snapshot: CommandCenterSnapshot;
  priorityResults: PriorityScoreResult[];
  ownerSignals: OwnerSignalsResult[];
}

function normalizeTasks(tasks?: PriorityTaskInput[] | null): PriorityTaskInput[] {
  return Array.isArray(tasks) ? tasks.filter(Boolean) : [];
}

function normalizeContacts(
  contacts?: PriorityContactInput[] | null,
): PriorityContactInput[] {
  return Array.isArray(contacts) ? contacts.filter(Boolean) : [];
}

function normalizeOpportunities(
  opportunities?: PriorityOpportunityInput[] | null,
): PriorityOpportunityInput[] {
  return Array.isArray(opportunities) ? opportunities.filter(Boolean) : [];
}

function mapTaskToOwnerTask(task: PriorityTaskInput): OwnerTaskInput {
  return {
    id: task.id,
    owner_id: task.owner_id ?? null,
    assigned_to: task.assigned_to ?? null,
    status: task.status ?? null,
    due_at: task.due_at ?? null,
    completed_at: task.completed_at ?? null,
    fallback_reason: task.fallback_reason ?? null,
    route_type: task.route_type ?? null,
    manual_override: task.manual_override ?? null,
    blocked: task.blocked ?? null,
    estimated_value: task.estimated_value ?? null,
  };
}

function mapContactToOwnerContact(contact: PriorityContactInput): OwnerContactInput {
  return {
    id: contact.id,
    owner_id: contact.owner_id ?? null,
    assigned_to: contact.assigned_to ?? null,
    last_contacted_at: contact.last_contacted_at ?? null,
    needs_follow_up: contact.needs_follow_up ?? null,
    is_stale: contact.is_stale ?? null,
    lifetime_value: contact.lifetime_value ?? null,
    donation_total: contact.donation_total ?? null,
    pledge_amount: contact.pledge_amount ?? null,
    engagement_score: contact.engagement_score ?? null,
    support_score: contact.support_score ?? null,
  };
}
function collectOwnerIds(
  tasks: PriorityTaskInput[],
  contacts: PriorityContactInput[],
  ownerDirectory?: Record<string, string> | null,
): string[] {
  const ids = new Set<string>();

  for (const task of tasks) {
    const ownerId = task.owner_id ?? task.assigned_to;
    if (ownerId) ids.add(ownerId);
  }

  for (const contact of contacts) {
    const ownerId = contact.owner_id ?? contact.assigned_to;
    if (ownerId) ids.add(ownerId);
  }

  if (ownerDirectory) {
    for (const ownerId of Object.keys(ownerDirectory)) {
      if (ownerId) ids.add(ownerId);
    }
  }

  return [...ids].sort((a, b) => a.localeCompare(b));
}

function buildPriorityResults(
  tasks: PriorityTaskInput[],
  contacts: PriorityContactInput[],
  opportunities: PriorityOpportunityInput[],
  now: Date,
): PriorityScoreResult[] {
  const taskResults = tasks.map((task) => scoreTask(task, { now }));
  const contactResults = contacts.map((contact) => scoreContact(contact, { now }));
  const opportunityResults = opportunities.map((opportunity) =>
    scoreOpportunity(opportunity, { now }),
  );

  return [...taskResults, ...contactResults, ...opportunityResults];
}

function buildOwnerSignalResults(
  ownerIds: string[],
  tasks: PriorityTaskInput[],
  contacts: PriorityContactInput[],
  ownerDirectory: Record<string, string> | null | undefined,
  now: Date,
): OwnerSignalsResult[] {
  const ownerTasks = tasks.map(mapTaskToOwnerTask);
  const ownerContacts = contacts.map(mapContactToOwnerContact);

  return ownerIds.map((ownerId) =>
    buildOwnerSignals(ownerId, ownerTasks, ownerContacts, {
      now,
      ownerName: ownerDirectory?.[ownerId] ?? null,
    }),
  );
}

function buildOwnerQueuePriorityResults(
  ownerSignals: OwnerSignalsResult[],
): PriorityScoreResult[] {
  return ownerSignals.map((signal) => scoreOwnerQueue(signal.queueInput));
}
function mergePriorityResults(
  baseResults: PriorityScoreResult[],
  ownerQueueResults: PriorityScoreResult[],
): PriorityScoreResult[] {
  return [...baseResults, ...ownerQueueResults];
}

export function buildCommandCenterAdapterResult(
  input: CommandCenterAdapterInput,
): CommandCenterAdapterResult {
  const now = input.now ?? new Date();

  const tasks = normalizeTasks(input.tasks);
  const contacts = normalizeContacts(input.contacts);
  const opportunities = normalizeOpportunities(input.opportunities);

  const ownerIds = collectOwnerIds(tasks, contacts, input.ownerDirectory ?? null);

  const basePriorityResults = buildPriorityResults(
    tasks,
    contacts,
    opportunities,
    now,
  );

  const ownerSignals = buildOwnerSignalResults(
    ownerIds,
    tasks,
    contacts,
    input.ownerDirectory ?? null,
    now,
  );

  const ownerQueuePriorityResults = buildOwnerQueuePriorityResults(ownerSignals);

  const priorityResults = mergePriorityResults(
    basePriorityResults,
    ownerQueuePriorityResults,
  );

  const snapshot = buildCommandCenterSnapshot({
    priorityResults,
    ownerSignals,
    now,
  });

  return {
    snapshot,
    priorityResults,
    ownerSignals,
  };
}
export function buildCommandCenterSnapshotFromData(
  input: CommandCenterAdapterInput,
): CommandCenterSnapshot {
  return buildCommandCenterAdapterResult(input).snapshot;
}

export function buildPriorityResultsFromData(
  input: Omit<CommandCenterAdapterInput, "ownerDirectory">,
): PriorityScoreResult[] {
  const now = input.now ?? new Date();

  return buildPriorityResults(
    normalizeTasks(input.tasks),
    normalizeContacts(input.contacts),
    normalizeOpportunities(input.opportunities),
    now,
  );
}

export function buildOwnerSignalsFromData(
  input: Pick<CommandCenterAdapterInput, "tasks" | "contacts" | "ownerDirectory" | "now">,
): OwnerSignalsResult[] {
  const now = input.now ?? new Date();
  const tasks = normalizeTasks(input.tasks);
  const contacts = normalizeContacts(input.contacts);
  const ownerIds = collectOwnerIds(tasks, contacts, input.ownerDirectory ?? null);

  return buildOwnerSignalResults(
    ownerIds,
    tasks,
    contacts,
    input.ownerDirectory ?? null,
    now,
  );
}
export function buildCommandCenterForOwner(
  ownerId: string,
  input: CommandCenterAdapterInput,
): CommandCenterAdapterResult {
  const tasks = normalizeTasks(input.tasks).filter((task) => {
    const taskOwnerId = task.owner_id ?? task.assigned_to;
    return taskOwnerId === ownerId;
  });

  const contacts = normalizeContacts(input.contacts).filter((contact) => {
    const contactOwnerId = contact.owner_id ?? contact.assigned_to;
    return contactOwnerId === ownerId;
  });

  const opportunities = normalizeOpportunities(input.opportunities).filter(
    (opportunity) => opportunity.owner_id === ownerId,
  );

  const ownerName =
    input.ownerDirectory?.[ownerId] ??
    null;

  return buildCommandCenterAdapterResult({
    tasks,
    contacts,
    opportunities,
    ownerDirectory: ownerName ? { [ownerId]: ownerName } : { [ownerId]: ownerId },
    now: input.now,
  });
}