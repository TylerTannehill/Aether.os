export type PriorityEntityType =
  | "task"
  | "contact"
  | "opportunity"
  | "outreach_gap"
  | "owner_queue";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type PriorityReasonCode =
  | "overdue_task"
  | "due_soon_task"
  | "high_value_contact"
  | "stale_contact"
  | "missing_contact_data"
  | "no_recent_outreach"
  | "fallback_routing"
  | "unowned_item"
  | "manual_override"
  | "pledge_opportunity"
  | "large_donation_history"
  | "owner_overloaded"
  | "blocked_work"
  | "new_signal"
  | "recent_engagement"
  | "completion_risk"
  | "inactive_pipeline";

export interface PriorityReason {
  code: PriorityReasonCode;
  label: string;
  weight: number;
  detail: string;
}

export interface PriorityScoreResult {
  entityType: PriorityEntityType;
  entityId: string;
  score: number;
  level: PriorityLevel;
  reason: string;
  reasons: PriorityReason[];
  badges: string[];
  recommendedAction: string;
  updatedAt: string;
}

export interface PriorityTaskInput {
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
  department?: string | null;
  fallback_reason?: string | null;
  route_type?: string | null;
  manual_override?: boolean | null;
  blocked?: boolean | null;
  contact_id?: string | null;
  estimated_value?: number | null;
}

export interface PriorityContactInput {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  owner_id?: string | null;
  assigned_to?: string | null;
  last_contacted_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  employer?: string | null;
  occupation?: string | null;
  tags?: string[] | null;
  donor_status?: string | null;
  pledge_amount?: number | null;
  donation_total?: number | null;
  lifetime_value?: number | null;
  support_score?: number | null;
  engagement_score?: number | null;
  needs_follow_up?: boolean | null;
  is_stale?: boolean | null;
}

export interface PriorityOpportunityInput {
  id: string;
  contact_id?: string | null;
  owner_id?: string | null;
  status?: string | null;
  type?: string | null;
  estimated_value?: number | null;
  pledge_amount?: number | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  manual_override?: boolean | null;
}
export interface PriorityOwnerQueueInput {
  id: string;
  owner_id?: string | null;
  owner_name?: string | null;
  open_tasks?: number | null;
  overdue_tasks?: number | null;
  fallback_tasks?: number | null;
  manual_override_tasks?: number | null;
  stale_contacts?: number | null;
  high_value_contacts?: number | null;
  completion_rate?: number | null; // 0 to 1
  recent_activity_score?: number | null; // 0 to 100
}

interface ScoreContext {
  now: Date;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffInHours(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

function diffInDays(from: Date, to: Date): number {
  return diffInHours(from, to) / 24;
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function buildFullName(contact: PriorityContactInput): string {
  if (contact.full_name && contact.full_name.trim()) return contact.full_name.trim();
  const first = contact.first_name?.trim() ?? "";
  const last = contact.last_name?.trim() ?? "";
  return `${first} ${last}`.trim() || "Unnamed Contact";
}

function levelFromScore(score: number): PriorityLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function summarizeReasons(reasons: PriorityReason[]): string {
  if (!reasons.length) return "No major priority signals detected";

  const topReasons = [...reasons]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((reason) => reason.label);

  return topReasons.join(" • ");
}

function chooseRecommendedAction(
  entityType: PriorityEntityType,
  level: PriorityLevel,
  reasons: PriorityReason[],
): string {
  const codes = reasons.map((reason) => reason.code);

  if (codes.includes("overdue_task")) return "Complete or reassign immediately";
  if (codes.includes("fallback_routing")) return "Review routing logic and assign a clear owner";
  if (codes.includes("unowned_item")) return "Assign an owner";
  if (codes.includes("missing_contact_data")) return "Fill missing contact and compliance fields";
  if (codes.includes("no_recent_outreach")) return "Initiate follow-up outreach";
  if (codes.includes("pledge_opportunity")) return "Move to direct fundraising follow-up";
  if (codes.includes("owner_overloaded")) return "Rebalance queue and redistribute work";
  if (codes.includes("blocked_work")) return "Unblock dependency before more work is added";

  if (entityType === "contact" && level === "high") return "Add to focus mode follow-up queue";
  if (entityType === "task" && level === "high") return "Promote to today’s execution queue";
  if (entityType === "owner_queue" && level !== "low") return "Audit owner workload and task mix";

  return "Monitor and review in command center";
}

function makeResult(
  entityType: PriorityEntityType,
  entityId: string,
  rawScore: number,
  reasons: PriorityReason[],
): PriorityScoreResult {
  const score = clamp(Math.round(rawScore));
  const level = levelFromScore(score);

  const badges = reasons
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((reason) => reason.label);

  return {
    entityType,
    entityId,
    score,
    level,
    reason: summarizeReasons(reasons),
    reasons: [...reasons].sort((a, b) => b.weight - a.weight),
    badges,
    recommendedAction: chooseRecommendedAction(entityType, level, reasons),
    updatedAt: new Date().toISOString(),
  };
}
export function scoreTask(
  task: PriorityTaskInput,
  options?: { now?: Date },
): PriorityScoreResult {
  const context: ScoreContext = {
    now: options?.now ?? new Date(),
  };

  let score = 0;
  const reasons: PriorityReason[] = [];

  const dueAt = safeDate(task.due_at);
  const createdAt = safeDate(task.created_at);
  const isCompleted =
    task.status?.toLowerCase() === "completed" || Boolean(task.completed_at);

  if (!isCompleted && dueAt) {
    const hoursUntilDue = diffInHours(context.now, dueAt);

    if (hoursUntilDue < 0) {
      const overdueDays = Math.abs(hoursUntilDue) / 24;
      const weight = clamp(35 + overdueDays * 4, 35, 55);
      score += weight;
      reasons.push({
        code: "overdue_task",
        label: "Overdue Task",
        weight,
        detail: `Task is overdue by ${Math.ceil(overdueDays)} day(s)`,
      });
    } else if (hoursUntilDue <= 24) {
      const weight = 22;
      score += weight;
      reasons.push({
        code: "due_soon_task",
        label: "Due Soon",
        weight,
        detail: "Task is due within 24 hours",
      });
    } else if (hoursUntilDue <= 72) {
      const weight = 12;
      score += weight;
      reasons.push({
        code: "due_soon_task",
        label: "Upcoming Deadline",
        weight,
        detail: "Task is due within 3 days",
      });
    }
  }

  if (!task.assigned_to && !task.owner_id) {
    const weight = 18;
    score += weight;
    reasons.push({
      code: "unowned_item",
      label: "No Owner",
      weight,
      detail: "Task has no clear owner assigned",
    });
  }

  if (task.fallback_reason || task.route_type === "fallback") {
    const weight = 20;
    score += weight;
    reasons.push({
      code: "fallback_routing",
      label: "Fallback Routed",
      weight,
      detail: task.fallback_reason
        ? `Fallback reason: ${task.fallback_reason}`
        : "Task entered the fallback route",
    });
  }

  if (task.manual_override) {
    const weight = 10;
    score += weight;
    reasons.push({
      code: "manual_override",
      label: "Manual Override",
      weight,
      detail: "Task required manual intervention",
    });
  }

  if (task.blocked) {
    const weight = 16;
    score += weight;
    reasons.push({
      code: "blocked_work",
      label: "Blocked",
      weight,
      detail: "Task is blocked and needs intervention",
    });
  }

  const taskPriority = task.priority?.toLowerCase();
  if (taskPriority === "high" || taskPriority === "urgent" || taskPriority === "critical") {
    const weight = taskPriority === "critical" ? 20 : 14;
    score += weight;
    reasons.push({
      code: "new_signal",
      label: "Declared High Priority",
      weight,
      detail: `Task priority is marked as ${task.priority}`,
    });
  }

  if ((task.estimated_value ?? 0) >= 1000) {
    const weight = 12;
    score += weight;
    reasons.push({
      code: "pledge_opportunity",
      label: "Revenue-Linked Work",
      weight,
      detail: "Task is tied to meaningful estimated value",
    });
  }

  if (!isCompleted && createdAt) {
    const ageDays = diffInDays(createdAt, context.now);
    if (ageDays >= 7) {
      const weight = clamp(6 + ageDays, 6, 15);
      score += weight;
      reasons.push({
        code: "completion_risk",
        label: "Aging Task",
        weight,
        detail: `Open for ${Math.floor(ageDays)} day(s)`,
      });
    }
  }

  if (isCompleted) {
    score = Math.max(0, score - 30);
  }

  return makeResult("task", task.id, score, reasons);
}

export function scoreContact(
  contact: PriorityContactInput,
  options?: { now?: Date },
): PriorityScoreResult {
  const context: ScoreContext = {
    now: options?.now ?? new Date(),
  };

  let score = 0;
  const reasons: PriorityReason[] = [];
    const donationValue =
    contact.lifetime_value ??
    contact.donation_total ??
    contact.pledge_amount ??
    0;

  if (donationValue >= 5000) {
    const weight = 28;
    score += weight;
    reasons.push({
      code: "large_donation_history",
      label: "High-Value Donor",
      weight,
      detail: `${buildFullName(contact)} has strong financial value history`,
    });
  } else if (donationValue >= 1000) {
    const weight = 18;
    score += weight;
    reasons.push({
      code: "high_value_contact",
      label: "Meaningful Revenue Potential",
      weight,
      detail: "Contact has notable donation or pledge value",
    });
  }

  const lastContactedAt = safeDate(contact.last_contacted_at);
  if (contact.needs_follow_up) {
    const weight = 18;
    score += weight;
    reasons.push({
      code: "no_recent_outreach",
      label: "Needs Follow-Up",
      weight,
      detail: "Contact is flagged for follow-up",
    });
  }

  if (lastContactedAt) {
    const daysSinceContact = diffInDays(lastContactedAt, context.now);
    if (daysSinceContact >= 14) {
      const weight = clamp(10 + Math.floor(daysSinceContact / 3), 10, 24);
      score += weight;
      reasons.push({
        code: "stale_contact",
        label: "Stale Contact",
        weight,
        detail: `No recent contact for ${Math.floor(daysSinceContact)} day(s)`,
      });
    }
  } else {
    const weight = 16;
    score += weight;
    reasons.push({
      code: "no_recent_outreach",
      label: "Never Contacted",
      weight,
      detail: "No outreach activity recorded",
    });
  }

  const missingCoreFields = [
    contact.phone,
    contact.email,
    contact.city,
    contact.state,
  ].filter((value) => !hasValue(value)).length;

  const missingFinanceFields = [
    contact.employer,
    contact.occupation,
  ].filter((value) => !hasValue(value)).length;

  if (missingCoreFields >= 2 || missingFinanceFields === 2) {
    const weight = 14;
    score += weight;
    reasons.push({
      code: "missing_contact_data",
      label: "Missing Critical Data",
      weight,
      detail: "Contact is missing key outreach or compliance information",
    });
  }

  if (!contact.owner_id && !contact.assigned_to) {
    const weight = 12;
    score += weight;
    reasons.push({
      code: "unowned_item",
      label: "Unassigned Contact",
      weight,
      detail: "Contact has no owner",
    });
  }

  if ((contact.engagement_score ?? 0) >= 75 || (contact.support_score ?? 0) >= 75) {
    const weight = 10;
    score += weight;
    reasons.push({
      code: "recent_engagement",
      label: "Strong Engagement Signal",
      weight,
      detail: "Contact is showing strong support or engagement",
    });
  }

  if (contact.is_stale) {
    const weight = 10;
    score += weight;
    reasons.push({
      code: "inactive_pipeline",
      label: "Pipeline Risk",
      weight,
      detail: "Contact is explicitly marked stale",
    });
  }

  return makeResult("contact", contact.id, score, reasons);
}

export function scoreOpportunity(
  opportunity: PriorityOpportunityInput,
  options?: { now?: Date },
): PriorityScoreResult {
  const context: ScoreContext = {
    now: options?.now ?? new Date(),
  };

  let score = 0;
  const reasons: PriorityReason[] = [];

  const value =
    opportunity.estimated_value ?? opportunity.pledge_amount ?? 0;

  if (value >= 5000) {
    const weight = 30;
    score += weight;
    reasons.push({
      code: "pledge_opportunity",
      label: "Major Opportunity",
      weight,
      detail: "High-value opportunity needs attention",
    });
  } else if (value >= 1000) {
    const weight = 20;
    score += weight;
    reasons.push({
      code: "pledge_opportunity",
      label: "Fundraising Opportunity",
      weight,
      detail: "Opportunity has strong revenue potential",
    });
  }

  const lastActivityAt = safeDate(opportunity.last_activity_at);
  if (lastActivityAt) {
    const staleDays = diffInDays(lastActivityAt, context.now);
    if (staleDays >= 7) {
      const weight = clamp(10 + staleDays, 10, 26);
      score += weight;
      reasons.push({
        code: "inactive_pipeline",
        label: "Inactive Opportunity",
        weight,
        detail: `No activity for ${Math.floor(staleDays)} day(s)`,
      });
    }
  } else {
    const weight = 12;
    score += weight;
    reasons.push({
      code: "inactive_pipeline",
      label: "No Activity Logged",
      weight,
      detail: "Opportunity has no activity history",
    });
  }

  if (!opportunity.owner_id) {
    const weight = 14;
    score += weight;
    reasons.push({
      code: "unowned_item",
      label: "No Owner",
      weight,
      detail: "Opportunity is not owned",
    });
  }

  if (opportunity.manual_override) {
    const weight = 8;
    score += weight;
    reasons.push({
      code: "manual_override",
      label: "Manual Override",
      weight,
      detail: "Opportunity required manual intervention",
    });
  }

  return makeResult("opportunity", opportunity.id, score, reasons);
}

export function scoreOwnerQueue(
  queue: PriorityOwnerQueueInput,
): PriorityScoreResult {
  let score = 0;
  const reasons: PriorityReason[] = [];

  const overdueTasks = queue.overdue_tasks ?? 0;
  const fallbackTasks = queue.fallback_tasks ?? 0;
  const openTasks = queue.open_tasks ?? 0;
  const staleContacts = queue.stale_contacts ?? 0;
  const highValueContacts = queue.high_value_contacts ?? 0;
  const manualOverrideTasks = queue.manual_override_tasks ?? 0;
  const completionRate = queue.completion_rate ?? 0;
  const recentActivityScore = queue.recent_activity_score ?? 0;

  if (overdueTasks >= 3) {
    const weight = clamp(18 + overdueTasks * 3, 18, 34);
    score += weight;
    reasons.push({
      code: "owner_overloaded",
      label: "Overdue Load",
      weight,
      detail: `Owner has ${overdueTasks} overdue task(s)`,
    });
  }

  if (fallbackTasks >= 2) {
    const weight = clamp(10 + fallbackTasks * 3, 10, 24);
    score += weight;
    reasons.push({
      code: "fallback_routing",
      label: "Fallback Volume",
      weight,
      detail: `${fallbackTasks} task(s) routed through fallback`,
    });
  }

  if (openTasks >= 10) {
    const weight = clamp(8 + openTasks, 8, 20);
    score += weight;
    reasons.push({
      code: "owner_overloaded",
      label: "Heavy Queue",
      weight,
      detail: `${openTasks} open task(s) assigned`,
    });
  }

  if (manualOverrideTasks >= 2) {
    const weight = 10;
    score += weight;
    reasons.push({
      code: "manual_override",
      label: "Manual Intervention Pattern",
      weight,
      detail: "Queue requires repeated manual intervention",
    });
  }

  if (staleContacts >= 5 && highValueContacts >= 1) {
    const weight = 18;
    score += weight;
    reasons.push({
      code: "stale_contact",
      label: "Stale High-Value Contacts",
      weight,
      detail: "Important contacts are not being worked",
    });
  }

  if (completionRate > 0 && completionRate < 0.55) {
    const weight = 16;
    score += weight;
    reasons.push({
      code: "completion_risk",
      label: "Low Completion Rate",
      weight,
      detail: `Completion rate is ${Math.round(completionRate * 100)}%`,
    });
  }

  if (recentActivityScore <= 25) {
    const weight = 10;
    score += weight;
    reasons.push({
      code: "inactive_pipeline",
      label: "Low Activity",
      weight,
      detail: "Owner activity is below target",
    });
  }

  return makeResult("owner_queue", queue.id, score, reasons);
}

export function sortPriorityResults<T extends PriorityScoreResult>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entityId.localeCompare(b.entityId);
  });
}

export function getTopPriorityItems<T extends PriorityScoreResult>(
  items: T[],
  limit = 10,
): T[] {
  return sortPriorityResults(items).slice(0, limit);
}