import {
  BrainOrchestratorContactInput,
  BrainOrchestratorInput,
  BrainOrchestratorResult,
  BrainOrchestratorTaskInput,
  buildBrainOrchestratorResult,
} from "./brain-orchestrator";

export type DashboardBrainTask = {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
  due_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_role?: string | null;
  department?: string | null;
  fallback_reason?: string | null;
  route_type?: string | null;
  manual_override?: boolean | null;
  blocked?: boolean | null;
  contact_id?: string | null;
  estimated_value?: number | null;
  description?: string | null;
  task_type?: string | null;
};

export type DashboardBrainContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  owner_id?: string | null;
  assigned_to?: string | null;
  owner_name?: string | null;
  owner_role?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_contacted_at?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  employer?: string | null;
  occupation?: string | null;
  donor_status?: string | null;
  pledge_amount?: number | null;
  donation_total?: number | null;
  lifetime_value?: number | null;
  support_score?: number | null;
  engagement_score?: number | null;
  needs_follow_up?: boolean | null;
  is_stale?: boolean | null;
};

export type DashboardBrainInput = {
  tasks: DashboardBrainTask[];
  contacts: DashboardBrainContact[];
  ownerDirectory?: Record<string, string>;
};

export type DashboardBrainPriorityTask = DashboardBrainTask & {
  brain_score: number;
  brain_tier: "critical" | "high" | "medium" | "low";
  brain_reasons: string[];
  brain_should_surface: boolean;
  brain_auto_execute: boolean;
};

export type DashboardBrainOutput = {
  priorityTasks: DashboardBrainPriorityTask[];
  priorityContacts: BrainOrchestratorContactInput[];
  orchestrator: BrainOrchestratorResult;
};

function normalizeTask(task: DashboardBrainTask): BrainOrchestratorTaskInput {
  return {
    id: String(task.id),
    title: task.title ?? "Untitled task",
    description: task.description ?? null,
    status: task.status ?? "open",
    priority: task.priority ?? null,
    due_at: task.due_at ?? null,
    created_at: task.created_at ?? null,
    updated_at: task.updated_at ?? null,
    completed_at: task.completed_at ?? null,
    assigned_to: task.assigned_to ?? null,
    owner_id: task.owner_id ?? null,
    owner_name: task.owner_name ?? null,
    owner_role: task.owner_role ?? null,
    department: task.department ?? null,
    fallback_reason: task.fallback_reason ?? null,
    route_type: task.route_type ?? null,
    task_type: task.task_type ?? task.route_type ?? "task",
    manual_override: Boolean(task.manual_override),
    blocked: Boolean(task.blocked),
    contact_id: task.contact_id ?? null,
    estimated_value:
      typeof task.estimated_value === "number" ? task.estimated_value : null,
    auto_executable:
      !Boolean(task.manual_override) && !Boolean(task.blocked),
  };
}

function normalizeContact(
  contact: DashboardBrainContact
): BrainOrchestratorContactInput {
  return {
    id: String(contact.id),
    first_name: contact.first_name ?? null,
    last_name: contact.last_name ?? null,
    full_name: contact.full_name ?? null,
    owner_id: contact.owner_id ?? null,
    assigned_to: contact.assigned_to ?? null,
    owner_name: contact.owner_name ?? null,
    owner_role: contact.owner_role ?? null,
    updated_at: contact.updated_at ?? null,
    created_at: contact.created_at ?? null,
    last_contacted_at: contact.last_contacted_at ?? null,
    phone: contact.phone ?? null,
    email: contact.email ?? null,
    city: contact.city ?? null,
    state: contact.state ?? null,
    employer: contact.employer ?? null,
    occupation: contact.occupation ?? null,
    donor_status: contact.donor_status ?? null,
    pledge_amount:
      typeof contact.pledge_amount === "number" ? contact.pledge_amount : null,
    donation_total:
      typeof contact.donation_total === "number"
        ? contact.donation_total
        : null,
    lifetime_value:
      typeof contact.lifetime_value === "number"
        ? contact.lifetime_value
        : null,
    support_score:
      typeof contact.support_score === "number" ? contact.support_score : null,
    engagement_score:
      typeof contact.engagement_score === "number"
        ? contact.engagement_score
        : null,
    needs_follow_up: Boolean(contact.needs_follow_up),
    is_stale: Boolean(contact.is_stale),
  };
}
export function buildDashboardBrainOutput(
  input: DashboardBrainInput
): DashboardBrainOutput {
  const normalizedTasks = (input.tasks ?? []).map(normalizeTask);
  const normalizedContacts = (input.contacts ?? []).map(normalizeContact);

  const orchestratorInput: BrainOrchestratorInput = {
    tasks: normalizedTasks,
    contacts: normalizedContacts,
    opportunities: [],
    ownerDirectory: input.ownerDirectory ?? {},
  };

  const orchestrator = buildBrainOrchestratorResult(orchestratorInput);

  const decisionMap = new Map(
    orchestrator.decisions.map((decision) => [decision.itemId, decision])
  );

  const priorityTasks: DashboardBrainPriorityTask[] = normalizedTasks
    .map((task) => {
      const decision = decisionMap.get(String(task.id));
      if (!decision) return null;

      return {
        ...task,
        brain_score: decision.score,
        brain_tier: decision.tier,
        brain_reasons: decision.reasons,
        brain_should_surface: decision.shouldSurface,
        brain_auto_execute: decision.shouldAutoExecute,
      };
    })
    .filter((task): task is DashboardBrainPriorityTask => Boolean(task))
    .sort((a, b) => {
      if (b.brain_score !== a.brain_score) {
        return b.brain_score - a.brain_score;
      }

      const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;

      if (aDue !== bDue) {
        return aDue - bDue;
      }

      return a.title.localeCompare(b.title);
    });

  return {
    priorityTasks,
    priorityContacts: normalizedContacts,
    orchestrator,
  };
}