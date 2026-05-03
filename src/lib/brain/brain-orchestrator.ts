import {
  BrainContext,
  RawBrainItem,
  enrichBrainItems,
} from "./context-layer";
import {
  BrainDecisionResult,
  BrainDecisionWeights,
  decideBrainItems,
} from "./decision-engine";

export type AbeAlignmentContext = {
  primaryLane?: string | null;
  pressureLane?: string | null;
  opportunityLane?: string | null;
};

export type BrainOrchestratorTaskInput = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_at?: string | null;
  due_date?: string | null;
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
  task_type?: string | null;
  manual_override?: boolean | null;
  blocked?: boolean | null;
  contact_id?: string | null;
  estimated_value?: number | null;
  auto_executable?: boolean | null;
};

export type BrainOrchestratorContactInput = {
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

export type BrainOrchestratorOpportunityInput = {
  id: string;
  title: string;
  description?: string | null;
  department?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_role?: string | null;
  estimated_value?: number | null;
  due_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  source?: string | null;
};

export type BrainOrchestratorInput = {
  tasks?: BrainOrchestratorTaskInput[];
  contacts?: BrainOrchestratorContactInput[];
  opportunities?: BrainOrchestratorOpportunityInput[];
  ownerDirectory?: Record<string, string>;
  weights?: BrainDecisionWeights;
  abeContext?: AbeAlignmentContext | null;
};

export type BrainRankedTask = BrainOrchestratorTaskInput & {
  brain_context: BrainContext;
  brain_decision: BrainDecisionResult;
  brain_score: number;
  brain_tier: BrainDecisionResult["tier"];
  brain_reasons: string[];
  brain_should_surface: boolean;
  brain_auto_execute: boolean;
};

export type BrainRankedOpportunity = BrainOrchestratorOpportunityInput & {
  brain_context: BrainContext;
  brain_decision: BrainDecisionResult;
  brain_score: number;
  brain_tier: BrainDecisionResult["tier"];
  brain_reasons: string[];
  brain_should_surface: boolean;
  brain_auto_execute: boolean;
};

export type BrainTopLineSummary = {
  totalItems: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  surfaced: number;
  autoExecutable: number;
  blocked: number;
  fallback: number;
};

export type BrainOrchestratorResult = {
  rawItems: RawBrainItem[];
  contexts: BrainContext[];
  decisions: BrainDecisionResult[];
  rankedTasks: BrainRankedTask[];
  rankedOpportunities: BrainRankedOpportunity[];
  topActions: BrainDecisionResult[];
  criticalQueue: BrainDecisionResult[];
  reviewQueue: BrainDecisionResult[];
  autoExecutableNow: BrainDecisionResult[];
  summary: BrainTopLineSummary;
};

function safeText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function buildTaskDescription(task: BrainOrchestratorTaskInput): string | null {
  if (safeText(task.description)) return safeText(task.description);

  const parts = [
    task.fallback_reason ? `Fallback reason: ${task.fallback_reason}` : null,
    task.department ? `Department: ${task.department}` : null,
    task.route_type ? `Route: ${task.route_type}` : null,
    task.blocked ? "Blocked item" : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : null;
}

function buildOpportunityDescription(
  opportunity: BrainOrchestratorOpportunityInput
): string | null {
  if (safeText(opportunity.description)) {
    return safeText(opportunity.description);
  }

  const parts = [
    opportunity.department ? `Department: ${opportunity.department}` : null,
    typeof opportunity.estimated_value === "number"
      ? `Estimated value: ${opportunity.estimated_value}`
      : null,
    opportunity.source ? `Source: ${opportunity.source}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : null;
}

function normalizeTaskToRawItem(
  task: BrainOrchestratorTaskInput,
  ownerDirectory: Record<string, string>
): RawBrainItem {
  const ownerId = safeText(task.owner_id);
  const ownerName =
    safeText(task.owner_name) ||
    safeText(task.assigned_to) ||
    (ownerId ? ownerDirectory[ownerId] ?? null : null);

  const blockedDependency =
    task.blocked && !safeText(task.fallback_reason)
      ? "blocked_dependency"
      : null;

  return {
    id: String(task.id),
    title: task.title ?? "Untitled task",
    description: buildTaskDescription(task) ?? undefined,
    type: task.task_type ?? "task",
    status: task.status ?? "open",
    source: task.route_type ?? task.task_type ?? "task",
    department: task.department ?? null,
    ownerId,
    ownerName,
    ownerRole: task.owner_role ?? null,
    fallbackReason: task.fallback_reason ?? blockedDependency,
    metric:
      typeof task.estimated_value === "number" ? "estimated_value" : null,
    dueAt: task.due_at ?? task.due_date ?? null,
    createdAt: task.created_at ?? null,
    updatedAt: task.updated_at ?? null,
    autoExecutable:
      typeof task.auto_executable === "boolean"
        ? task.auto_executable
        : !Boolean(task.manual_override) && !Boolean(task.blocked),
    manualOnly: Boolean(task.manual_override),
    metadata: {
      contactId: task.contact_id ?? null,
      blocked: Boolean(task.blocked),
      estimatedValue:
        typeof task.estimated_value === "number" ? task.estimated_value : null,
      completedAt: task.completed_at ?? null,
      originalPriority: task.priority ?? null,
    },
  };
}

function normalizeOpportunityToRawItem(
  opportunity: BrainOrchestratorOpportunityInput,
  ownerDirectory: Record<string, string>
): RawBrainItem {
  const ownerId = safeText(opportunity.owner_id);
  const ownerName =
    safeText(opportunity.owner_name) ||
    (ownerId ? ownerDirectory[ownerId] ?? null : null);

  return {
    id: String(opportunity.id),
    title: opportunity.title ?? "Untitled opportunity",
    description: buildOpportunityDescription(opportunity) ?? undefined,
    type: "opportunity",
    status: opportunity.status ?? "open",
    source: opportunity.source ?? "suggestion",
    department: opportunity.department ?? null,
    ownerId,
    ownerName,
    ownerRole: opportunity.owner_role ?? null,
    metric:
      typeof opportunity.estimated_value === "number"
        ? "estimated_value"
        : null,
    dueAt: opportunity.due_at ?? null,
    createdAt: opportunity.created_at ?? null,
    updatedAt: opportunity.updated_at ?? null,
    autoExecutable: false,
    manualOnly: true,
    metadata: {
      estimatedValue:
        typeof opportunity.estimated_value === "number"
          ? opportunity.estimated_value
          : null,
    },
  };
}

function attachDecisionToTask(
  task: BrainOrchestratorTaskInput,
  decision: BrainDecisionResult
): BrainRankedTask {
  return {
    ...task,
    brain_context: decision.context,
    brain_decision: decision,
    brain_score: decision.score,
    brain_tier: decision.tier,
    brain_reasons: decision.reasons,
    brain_should_surface: decision.shouldSurface,
    brain_auto_execute: decision.shouldAutoExecute,
  };
}

function attachDecisionToOpportunity(
  opportunity: BrainOrchestratorOpportunityInput,
  decision: BrainDecisionResult
): BrainRankedOpportunity {
  return {
    ...opportunity,
    brain_context: decision.context,
    brain_decision: decision,
    brain_score: decision.score,
    brain_tier: decision.tier,
    brain_reasons: decision.reasons,
    brain_should_surface: decision.shouldSurface,
    brain_auto_execute: decision.shouldAutoExecute,
  };
}

function buildSummary(decisions: BrainDecisionResult[]): BrainTopLineSummary {
  return decisions.reduce<BrainTopLineSummary>(
    (summary, decision) => {
      summary.totalItems += 1;

      if (decision.tier === "critical") summary.critical += 1;
      if (decision.tier === "high") summary.high += 1;
      if (decision.tier === "medium") summary.medium += 1;
      if (decision.tier === "low") summary.low += 1;

      if (decision.shouldSurface) summary.surfaced += 1;
      if (decision.shouldAutoExecute) summary.autoExecutable += 1;
      if (decision.context.failureType === "blocked_dependency") {
        summary.blocked += 1;
      }
      if (decision.context.hasFallback) summary.fallback += 1;

      return summary;
    },
    {
      totalItems: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      surfaced: 0,
      autoExecutable: 0,
      blocked: 0,
      fallback: 0,
    }
  );
}

export function buildBrainOrchestratorResult(
  input: BrainOrchestratorInput
): BrainOrchestratorResult {
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const opportunities = Array.isArray(input.opportunities)
    ? input.opportunities
    : [];
  const ownerDirectory = input.ownerDirectory ?? {};

  const taskRawItems = tasks.map((task) =>
    normalizeTaskToRawItem(task, ownerDirectory)
  );

  const opportunityRawItems = opportunities.map((opportunity) =>
    normalizeOpportunityToRawItem(opportunity, ownerDirectory)
  );

  const rawItems = [...taskRawItems, ...opportunityRawItems];
  const contexts = (enrichBrainItems as any)(rawItems, input.abeContext ?? null) as BrainContext[];
  const decisions = decideBrainItems(contexts, input.weights);

  const decisionMap = new Map(
    decisions.map((decision) => [decision.itemId, decision])
  );

  const rankedTasks = tasks
    .map((task) => {
      const decision = decisionMap.get(String(task.id));
      if (!decision) return null;
      return attachDecisionToTask(task, decision);
    })
    .filter((item): item is BrainRankedTask => Boolean(item));

  const rankedOpportunities = opportunities
    .map((opportunity) => {
      const decision = decisionMap.get(String(opportunity.id));
      if (!decision) return null;
      return attachDecisionToOpportunity(opportunity, decision);
    })
    .filter((item): item is BrainRankedOpportunity => Boolean(item));

  const topActions = decisions
    .filter((decision) => decision.shouldSurface)
    .slice(0, 10);

  const criticalQueue = decisions.filter(
    (decision) =>
      decision.tier === "critical" || decision.context.failureType !== null
  );

  const reviewQueue = decisions.filter(
    (decision) => !decision.shouldAutoExecute || decision.context.isManualOnly
  );

  const autoExecutableNow = decisions.filter(
    (decision) => decision.shouldAutoExecute
  );

  return {
    rawItems,
    contexts,
    decisions,
    rankedTasks,
    rankedOpportunities,
    topActions,
    criticalQueue,
    reviewQueue,
    autoExecutableNow,
    summary: buildSummary(decisions),
  };
}
