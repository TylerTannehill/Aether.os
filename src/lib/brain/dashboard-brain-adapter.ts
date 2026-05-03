import {
  BrainContext,
  BrainFailureType,
  BrainIssueType,
  BrainPriorityHint,
} from "./context-layer";
import * as BrainOrchestrator from "./brain-orchestrator";

type BrainOrchestratorContactInput = any;
type BrainOrchestratorInput = any;
type BrainOrchestratorResult = any;
type BrainOrchestratorTaskInput = any;
type AbeAlignmentContext = {
  primaryLane?: string | null;
  pressureLane?: string | null;
  opportunityLane?: string | null;
};

export type BrainDecisionTier = "critical" | "high" | "medium" | "low";

export type BrainDecisionWeights = {
  impact: number;
  urgency: number;
  confidence: number;
  ease: number;
};

export type BrainDecisionBreakdown = {
  impact: number;
  urgency: number;
  confidence: number;
  ease: number;
};

export type BrainDecisionResult = {
  itemId: string;
  score: number;
  tier: BrainDecisionTier;
  breakdown: BrainDecisionBreakdown;
  reasons: string[];
  shouldSurface: boolean;
  shouldAutoExecute: boolean;
  context: BrainContext;
};

const DEFAULT_WEIGHTS: BrainDecisionWeights = {
  impact: 0.4,
  urgency: 0.3,
  confidence: 0.2,
  ease: 0.1,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function hasTag(context: BrainContext, tag: string) {
  return context.tags.includes(tag);
}

function mapPriorityHintToImpact(priorityHint: BrainPriorityHint): number {
  switch (priorityHint) {
    case "critical":
      return 1;
    case "high":
      return 0.82;
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.45;
  }
}

function mapFailureTypeToImpact(failureType: BrainFailureType): number {
  switch (failureType) {
    case "no_owner":
      return 0.92;
    case "missing_contact_data":
      return 0.86;
    case "blocked_dependency":
      return 0.95;
    case "no_rule_match":
      return 0.72;
    case "stale_data":
      return 0.7;
    case "manual_override":
      return 0.45;
    case "unknown":
      return 0.68;
    case null:
    default:
      return 0.5;
  }
}

function mapIssueTypeToImpact(issueType: BrainIssueType): number {
  switch (issueType) {
    case "failure":
      return 0.95;
    case "warning":
      return 0.75;
    case "opportunity":
      return 0.72;
    case "execution":
      return 0.7;
    case "follow_up":
      return 0.62;
    case "review":
      return 0.35;
    default:
      return 0.5;
  }
}

function scoreImpact(context: BrainContext, reasons: string[]): number {
  let score = 0.4;

  const priorityImpact = mapPriorityHintToImpact(context.priorityHint);
  score = Math.max(score, priorityImpact);

  if (context.failureType) {
    const failureImpact = mapFailureTypeToImpact(context.failureType);
    score = Math.max(score, failureImpact);
    reasons.push(`Failure context increases impact (${context.failureType}).`);
  }

  const issueImpact = mapIssueTypeToImpact(context.issueType);
  score = Math.max(score, issueImpact);

  if (context.department === "finance" || context.department === "executive") {
    score += 0.08;
    reasons.push(`Department weighting increased impact (${context.department}).`);
  }

  if (context.relatedMetric) {
    score += 0.04;
    reasons.push(`Connected metric increased impact (${context.relatedMetric}).`);
  }

  if (hasTag(context, "abe:primary")) {
    score += 0.1;
    reasons.push("ABE primary lane alignment increased impact.");
  }

  return clamp(score);
}

function scoreUrgency(context: BrainContext, reasons: string[]): number {
  let score = 0.35;

  if (context.priorityHint === "critical") {
    score = Math.max(score, 0.95);
    reasons.push("Critical priority hint increased urgency.");
  } else if (context.priorityHint === "high") {
    score = Math.max(score, 0.78);
    reasons.push("High priority hint increased urgency.");
  }

  if (context.hasFallback) {
    score += 0.1;
    reasons.push("Fallback status increased urgency.");
  }

  if (context.isStale) {
    score += 0.2;
    reasons.push("Stale data increased urgency.");
  }

  if (context.dueAt) {
    const dueTime = new Date(context.dueAt).getTime();

    if (!Number.isNaN(dueTime)) {
      const now = Date.now();
      const delta = dueTime - now;
      const oneDay = 1000 * 60 * 60 * 24;
      const threeDays = oneDay * 3;

      if (delta <= 0) {
        score = Math.max(score, 1);
        reasons.push("Overdue item increased urgency to maximum.");
      } else if (delta <= oneDay) {
        score = Math.max(score, 0.9);
        reasons.push("Due within 24 hours increased urgency.");
      } else if (delta <= threeDays) {
        score = Math.max(score, 0.75);
        reasons.push("Due within 3 days increased urgency.");
      }
    }
  }

  if (hasTag(context, "abe:pressure")) {
    score += 0.1;
    reasons.push("ABE pressure lane alignment increased urgency.");
  }

  return clamp(score);
}
function scoreConfidence(context: BrainContext, reasons: string[]): number {
  let score = 0.55;

  if (context.hasOwner) {
    score += 0.12;
    reasons.push("Assigned owner increased confidence.");
  } else {
    score -= 0.15;
    reasons.push("Missing owner reduced confidence.");
  }

  if (context.failureType === "no_rule_match") {
    score -= 0.12;
    reasons.push("No rule match reduced confidence.");
  }

  if (context.failureType === "manual_override") {
    score -= 0.08;
    reasons.push("Manual override reduced confidence.");
  }

  if (context.issueType === "review") {
    score -= 0.08;
    reasons.push("Review-oriented item reduced confidence.");
  }

  if (context.source === "system" || context.source === "routing") {
    score += 0.08;
    reasons.push(`Structured source increased confidence (${context.source}).`);
  }

  if (context.relatedMetric) {
    score += 0.05;
    reasons.push("Metric linkage increased confidence.");
  }

  if (hasTag(context, "abe:opportunity")) {
    score += 0.05;
    reasons.push("ABE opportunity lane alignment increased confidence.");
  }

  return clamp(score);
}

function scoreEase(context: BrainContext, reasons: string[]): number {
  let score = 0.5;

  if (context.isManualOnly) {
    score -= 0.2;
    reasons.push("Manual-only item reduced ease.");
  }

  if (context.isAutoExecutable) {
    score += 0.28;
    reasons.push("Auto-executable item increased ease.");
  }

  if (!context.hasOwner) {
    score -= 0.12;
    reasons.push("Missing owner reduced ease.");
  }

  if (context.failureType === "blocked_dependency") {
    score -= 0.3;
    reasons.push("Blocked dependency reduced ease.");
  }

  if (context.issueType === "follow_up" || context.issueType === "execution") {
    score += 0.08;
    reasons.push(`Action-oriented issue increased ease (${context.issueType}).`);
  }

  return clamp(score);
}

function resolveTier(score: number): BrainDecisionTier {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function decideBrainItem(
  context: BrainContext,
  weights: BrainDecisionWeights = DEFAULT_WEIGHTS
): BrainDecisionResult {
  const reasons: string[] = [];

  const breakdown: BrainDecisionBreakdown = {
    impact: scoreImpact(context, reasons),
    urgency: scoreUrgency(context, reasons),
    confidence: scoreConfidence(context, reasons),
    ease: scoreEase(context, reasons),
  };

  const score = roundScore(
    breakdown.impact * weights.impact +
      breakdown.urgency * weights.urgency +
      breakdown.confidence * weights.confidence +
      breakdown.ease * weights.ease
  );

  const tier = resolveTier(score);

  const shouldSurface =
    tier === "critical" ||
    tier === "high" ||
    context.failureType !== null ||
    context.priorityHint === "critical";

  const shouldAutoExecute =
    context.isAutoExecutable &&
    !context.isManualOnly &&
    context.failureType !== "blocked_dependency" &&
    score >= 0.78;

  return {
    itemId: context.itemId,
    score,
    tier,
    breakdown,
    reasons,
    shouldSurface,
    shouldAutoExecute,
    context,
  };
}

export function decideBrainItems(
  contexts: BrainContext[],
  weights: BrainDecisionWeights = DEFAULT_WEIGHTS
): BrainDecisionResult[] {
  return contexts
    .map((context) => decideBrainItem(context, weights))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aDue = a.context.dueAt
        ? new Date(a.context.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      const bDue = b.context.dueAt
        ? new Date(b.context.dueAt).getTime()
        : Number.POSITIVE_INFINITY;

      if (aDue !== bDue) return aDue - bDue;

      return a.context.label.localeCompare(b.context.label);
    });
}


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
  auto_executable?: boolean | null;
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
  abeContext?: AbeAlignmentContext | null;
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

function normalizeDashboardBrainTask(
  task: DashboardBrainTask
): BrainOrchestratorTaskInput {
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
      typeof task.auto_executable === "boolean"
        ? task.auto_executable
        : !Boolean(task.manual_override) && !Boolean(task.blocked),
  };
}

function normalizeDashboardBrainContact(
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
  const normalizedTasks = (input.tasks ?? []).map(normalizeDashboardBrainTask);
  const normalizedContacts = (input.contacts ?? []).map(
    normalizeDashboardBrainContact
  );

  const orchestratorInput: BrainOrchestratorInput = {
    tasks: normalizedTasks,
    contacts: normalizedContacts,
    opportunities: [],
    ownerDirectory: input.ownerDirectory ?? {},
    abeContext: input.abeContext ?? null,
  };

  const buildBrainOrchestratorResult = (BrainOrchestrator as any)
    .buildBrainOrchestratorResult;

  if (typeof buildBrainOrchestratorResult !== "function") {
    throw new Error(
      "buildBrainOrchestratorResult is not available from brain-orchestrator."
    );
  }

  const orchestrator = buildBrainOrchestratorResult(orchestratorInput);

  const decisionMap = new Map<string, BrainDecisionResult>(
    orchestrator.decisions.map((decision: BrainDecisionResult) => [
      decision.itemId,
      decision,
    ])
  );

  const priorityTasks: DashboardBrainPriorityTask[] = normalizedTasks
    .map((task) => {
      const decision = decisionMap.get(String(task.id));

      if (!decision) {
        return null;
      }

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

      const aDue = a.due_at
        ? new Date(a.due_at).getTime()
        : Number.POSITIVE_INFINITY;

      const bDue = b.due_at
        ? new Date(b.due_at).getTime()
        : Number.POSITIVE_INFINITY;

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
