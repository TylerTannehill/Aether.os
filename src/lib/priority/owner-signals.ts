import {
  PriorityLevel,
  PriorityOwnerQueueInput,
} from "@/lib/priority/priority-engine";

export type OwnerRiskLevel = "low" | "medium" | "high" | "critical";

export interface OwnerTaskInput {
  id: string;
  owner_id?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  fallback_reason?: string | null;
  route_type?: string | null;
  manual_override?: boolean | null;
  blocked?: boolean | null;
  estimated_value?: number | null;
}

export interface OwnerContactInput {
  id: string;
  owner_id?: string | null;
  assigned_to?: string | null;
  last_contacted_at?: string | null;
  needs_follow_up?: boolean | null;
  is_stale?: boolean | null;
  lifetime_value?: number | null;
  donation_total?: number | null;
  pledge_amount?: number | null;
  engagement_score?: number | null;
  support_score?: number | null;
}

export interface OwnerSignalReason {
  code:
    | "overdue_load"
    | "heavy_queue"
    | "fallback_pressure"
    | "manual_intervention"
    | "low_completion"
    | "blocked_work"
    | "stale_contacts"
    | "high_value_stale_contacts"
    | "low_activity"
    | "unworked_followups"
    | "strong_execution";
  label: string;
  detail: string;
  weight: number;
}

export interface OwnerSignalsResult {
  ownerId: string;
  ownerName?: string | null;
  riskLevel: OwnerRiskLevel;
  pressureScore: number;
  executionScore: number;
  activityScore: number;
  summary: string;
  reasons: OwnerSignalReason[];
  metrics: {
    openTasks: number;
    completedTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    blockedTasks: number;
    fallbackTasks: number;
    manualOverrideTasks: number;
    staleContacts: number;
    followUpContacts: number;
    highValueContacts: number;
    highValueStaleContacts: number;
    totalContacts: number;
    completionRate: number;
  };
  recommendations: string[];
  queueInput: PriorityOwnerQueueInput;
  updatedAt: string;
}

interface BuildOwnerSignalsOptions {
  now?: Date;
  ownerName?: string | null;
}
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffInHours(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

function diffInDays(from: Date, to: Date): number {
  return diffInHours(from, to) / 24;
}

function isTaskComplete(task: OwnerTaskInput): boolean {
  return task.status?.toLowerCase() === "completed" || Boolean(task.completed_at);
}

function getTaskOwnerId(task: OwnerTaskInput): string | null {
  return task.owner_id ?? task.assigned_to ?? null;
}

function getContactOwnerId(contact: OwnerContactInput): string | null {
  return contact.owner_id ?? contact.assigned_to ?? null;
}

function getContactValue(contact: OwnerContactInput): number {
  return (
    contact.lifetime_value ??
    contact.donation_total ??
    contact.pledge_amount ??
    0
  );
}

function levelFromPressure(score: number): OwnerRiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function summarizeReasons(reasons: OwnerSignalReason[]): string {
  if (!reasons.length) return "Owner queue looks stable";

  return [...reasons]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((reason) => reason.label)
    .join(" • ");
}

function dedupeRecommendations(recommendations: string[]): string[] {
  return [...new Set(recommendations)];
}

function buildRecommendations(
  reasons: OwnerSignalReason[],
  riskLevel: OwnerRiskLevel,
): string[] {
  const codes = new Set(reasons.map((reason) => reason.code));
  const recommendations: string[] = [];

  if (codes.has("overdue_load")) {
    recommendations.push("Clear overdue tasks first");
  }

  if (codes.has("heavy_queue")) {
    recommendations.push("Rebalance queue across available owners");
  }

  if (codes.has("fallback_pressure")) {
    recommendations.push("Audit routing rules and owner assignment logic");
  }

  if (codes.has("manual_intervention")) {
    recommendations.push("Reduce manual overrides by tightening workflow rules");
  }

  if (codes.has("blocked_work")) {
    recommendations.push("Identify blockers and unblock dependent tasks");
  }

  if (codes.has("stale_contacts") || codes.has("high_value_stale_contacts")) {
    recommendations.push("Push stale contacts into focus mode follow-up");
  }

  if (codes.has("unworked_followups")) {
    recommendations.push("Work flagged follow-up contacts today");
  }

  if (codes.has("low_completion")) {
    recommendations.push("Trim queue size and prioritize executable work");
  }

  if (codes.has("low_activity")) {
    recommendations.push("Increase owner activity and outreach cadence");
  }

  if (codes.has("strong_execution") && riskLevel === "low") {
    recommendations.push("Use this owner as a redistribution target");
  }

  if (!recommendations.length) {
    recommendations.push("Monitor in command center");
  }

  return dedupeRecommendations(recommendations);
}
export function buildOwnerSignals(
  ownerId: string,
  tasks: OwnerTaskInput[],
  contacts: OwnerContactInput[],
  options?: BuildOwnerSignalsOptions,
): OwnerSignalsResult {
  const now = options?.now ?? new Date();
  const ownerTasks = tasks.filter((task) => getTaskOwnerId(task) === ownerId);
  const ownerContacts = contacts.filter(
    (contact) => getContactOwnerId(contact) === ownerId,
  );

  const openTasks = ownerTasks.filter((task) => !isTaskComplete(task));
  const completedTasks = ownerTasks.filter((task) => isTaskComplete(task));

  const overdueTasks = openTasks.filter((task) => {
    const dueAt = safeDate(task.due_at);
    if (!dueAt) return false;
    return diffInHours(now, dueAt) < 0;
  });

  const dueSoonTasks = openTasks.filter((task) => {
    const dueAt = safeDate(task.due_at);
    if (!dueAt) return false;
    const hoursUntilDue = diffInHours(now, dueAt);
    return hoursUntilDue >= 0 && hoursUntilDue <= 48;
  });

  const blockedTasks = openTasks.filter((task) => Boolean(task.blocked));

  const fallbackTasks = openTasks.filter(
    (task) => Boolean(task.fallback_reason) || task.route_type === "fallback",
  );

  const manualOverrideTasks = openTasks.filter((task) =>
    Boolean(task.manual_override),
  );

  const staleContacts = ownerContacts.filter((contact) => {
    if (contact.is_stale) return true;
    const lastContactedAt = safeDate(contact.last_contacted_at);
    if (!lastContactedAt) return true;
    return diffInDays(lastContactedAt, now) >= 14;
  });

  const followUpContacts = ownerContacts.filter((contact) =>
    Boolean(contact.needs_follow_up),
  );

  const highValueContacts = ownerContacts.filter(
    (contact) => getContactValue(contact) >= 1000,
  );

  const highValueStaleContacts = staleContacts.filter(
    (contact) => getContactValue(contact) >= 1000,
  );

  const completionRate =
    ownerTasks.length > 0 ? completedTasks.length / ownerTasks.length : 1;

  const activitySignals: number[] = [];

  if (ownerContacts.length > 0) {
    const recentlyWorkedContacts = ownerContacts.filter((contact) => {
      const lastContactedAt = safeDate(contact.last_contacted_at);
      if (!lastContactedAt) return false;
      return diffInDays(lastContactedAt, now) <= 7;
    }).length;

    activitySignals.push((recentlyWorkedContacts / ownerContacts.length) * 100);
  }

  if (ownerTasks.length > 0) {
    activitySignals.push((completedTasks.length / ownerTasks.length) * 100);
  }

  const activityScore =
    activitySignals.length > 0
      ? Math.round(
          activitySignals.reduce((sum, value) => sum + value, 0) /
            activitySignals.length,
        )
      : 0;

  const reasons: OwnerSignalReason[] = [];
  let pressureScore = 0;

  if (overdueTasks.length >= 3) {
    const weight = clamp(20 + overdueTasks.length * 4, 20, 34);
    pressureScore += weight;
    reasons.push({
      code: "overdue_load",
      label: "Overdue Load",
      detail: `${overdueTasks.length} overdue task(s) need action`,
      weight,
    });
  }

  if (openTasks.length >= 10) {
    const weight = clamp(10 + openTasks.length, 10, 22);
    pressureScore += weight;
    reasons.push({
      code: "heavy_queue",
      label: "Heavy Queue",
      detail: `${openTasks.length} open task(s) assigned`,
      weight,
    });
  }

  if (fallbackTasks.length >= 2) {
    const weight = clamp(10 + fallbackTasks.length * 3, 10, 24);
    pressureScore += weight;
    reasons.push({
      code: "fallback_pressure",
      label: "Fallback Pressure",
      detail: `${fallbackTasks.length} task(s) hit fallback routing`,
      weight,
    });
  }

  if (manualOverrideTasks.length >= 2) {
    const weight = 10;
    pressureScore += weight;
    reasons.push({
      code: "manual_intervention",
      label: "Manual Intervention Pattern",
      detail: `${manualOverrideTasks.length} task(s) needed manual override`,
      weight,
    });
  }
    if (blockedTasks.length >= 2) {
    const weight = clamp(8 + blockedTasks.length * 3, 8, 18);
    pressureScore += weight;
    reasons.push({
      code: "blocked_work",
      label: "Blocked Work",
      detail: `${blockedTasks.length} blocked task(s) are slowing execution`,
      weight,
    });
  }

  if (completionRate < 0.55 && ownerTasks.length >= 4) {
    const weight = 16;
    pressureScore += weight;
    reasons.push({
      code: "low_completion",
      label: "Low Completion Rate",
      detail: `Completion rate is ${Math.round(completionRate * 100)}%`,
      weight,
    });
  }

  if (staleContacts.length >= 5) {
    const weight = clamp(10 + staleContacts.length * 2, 10, 24);
    pressureScore += weight;
    reasons.push({
      code: "stale_contacts",
      label: "Stale Contact Load",
      detail: `${staleContacts.length} contact(s) need renewed outreach`,
      weight,
    });
  }

  if (highValueStaleContacts.length >= 1) {
    const weight = clamp(14 + highValueStaleContacts.length * 4, 14, 26);
    pressureScore += weight;
    reasons.push({
      code: "high_value_stale_contacts",
      label: "High-Value Contacts Stalled",
      detail: `${highValueStaleContacts.length} high-value contact(s) are stale`,
      weight,
    });
  }

  if (followUpContacts.length >= 4) {
    const weight = clamp(8 + followUpContacts.length * 2, 8, 18);
    pressureScore += weight;
    reasons.push({
      code: "unworked_followups",
      label: "Follow-Up Backlog",
      detail: `${followUpContacts.length} contact(s) are flagged for follow-up`,
      weight,
    });
  }

  if (activityScore <= 25) {
    const weight = 10;
    pressureScore += weight;
    reasons.push({
      code: "low_activity",
      label: "Low Activity",
      detail: "Recent execution and outreach activity are below target",
      weight,
    });
  }

  if (
    pressureScore <= 20 &&
    completionRate >= 0.75 &&
    overdueTasks.length === 0 &&
    fallbackTasks.length === 0
  ) {
    reasons.push({
      code: "strong_execution",
      label: "Strong Execution",
      detail: "Owner is handling workload cleanly",
      weight: 8,
    });
  }

  pressureScore = clamp(Math.round(pressureScore));
  const riskLevel = levelFromPressure(pressureScore);

  const executionScore = clamp(
    Math.round(
      completionRate * 45 +
        (overdueTasks.length === 0 ? 20 : Math.max(0, 20 - overdueTasks.length * 5)) +
        (fallbackTasks.length === 0 ? 15 : Math.max(0, 15 - fallbackTasks.length * 4)) +
        (blockedTasks.length === 0 ? 10 : Math.max(0, 10 - blockedTasks.length * 3)) +
        (manualOverrideTasks.length === 0
          ? 10
          : Math.max(0, 10 - manualOverrideTasks.length * 3)),
    ),
  );

  const queueInput: PriorityOwnerQueueInput = {
    id: ownerId,
    owner_id: ownerId,
    owner_name: options?.ownerName ?? null,
    open_tasks: openTasks.length,
    overdue_tasks: overdueTasks.length,
    fallback_tasks: fallbackTasks.length,
    manual_override_tasks: manualOverrideTasks.length,
    stale_contacts: staleContacts.length,
    high_value_contacts: highValueContacts.length,
    completion_rate: completionRate,
    recent_activity_score: activityScore,
  };

  return {
    ownerId,
    ownerName: options?.ownerName ?? null,
    riskLevel,
    pressureScore,
    executionScore,
    activityScore,
    summary: summarizeReasons(reasons),
    reasons: [...reasons].sort((a, b) => b.weight - a.weight),
    metrics: {
      openTasks: openTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      blockedTasks: blockedTasks.length,
      fallbackTasks: fallbackTasks.length,
      manualOverrideTasks: manualOverrideTasks.length,
      staleContacts: staleContacts.length,
      followUpContacts: followUpContacts.length,
      highValueContacts: highValueContacts.length,
      highValueStaleContacts: highValueStaleContacts.length,
      totalContacts: ownerContacts.length,
      completionRate,
    },
    recommendations: buildRecommendations(reasons, riskLevel),
    queueInput,
    updatedAt: new Date().toISOString(),
  };
}

export function sortOwnerSignals(
  items: OwnerSignalsResult[],
): OwnerSignalsResult[] {
  return [...items].sort((a, b) => {
    if (b.pressureScore !== a.pressureScore) {
      return b.pressureScore - a.pressureScore;
    }

    if (a.executionScore !== b.executionScore) {
      return a.executionScore - b.executionScore;
    }

    return a.ownerId.localeCompare(b.ownerId);
  });
}

export function getRedistributionTargets(
  items: OwnerSignalsResult[],
): OwnerSignalsResult[] {
  return [...items]
    .filter(
      (item) =>
        item.riskLevel === "low" &&
        item.executionScore >= 70 &&
        item.metrics.overdueTasks === 0,
    )
    .sort((a, b) => {
      if (b.executionScore !== a.executionScore) {
        return b.executionScore - a.executionScore;
      }

      return a.metrics.openTasks - b.metrics.openTasks;
    });
}

export function mapOwnerSignalsToPriorityLevel(
  riskLevel: OwnerRiskLevel,
): PriorityLevel {
  if (riskLevel === "critical") return "critical";
  if (riskLevel === "high") return "high";
  if (riskLevel === "medium") return "medium";
  return "low";
}