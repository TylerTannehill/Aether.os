import { AutoModeTask } from "./auto-mode";

export type AutoModePolicy = {
  allowedHoursStart: number;
  allowedHoursEnd: number;
  allowWeekends: boolean;
  allowedDepartments: string[];
  blockedActionTypes: string[];
  blockedTaskTypes: string[];
  manualOnlyDepartments: string[];
};

export type AutoModePolicyReasonCode =
  | "allowed"
  | "outside_allowed_hours"
  | "weekend_blocked"
  | "department_not_allowed"
  | "manual_only_department"
  | "action_type_blocked"
  | "task_type_blocked";

export type AutoModePolicyDecision = {
  allowed: boolean;
  reason: string;
  reasonCode: AutoModePolicyReasonCode;
};

export const DEFAULT_AUTO_MODE_POLICY: AutoModePolicy = {
  allowedHoursStart: 8,
  allowedHoursEnd: 20,
  allowWeekends: false,
  allowedDepartments: ["outreach", "field", "digital", "finance", "print"],
  blockedActionTypes: [
    "reduce_owner_pressure",
    "rebalance_queue",
    "fix_contact_data",
  ],
  blockedTaskTypes: ["fallback"],
  manualOnlyDepartments: ["finance"],
};

function normalizeValue(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeStringList(values?: string[] | null): string[] {
  return Array.isArray(values)
    ? values.map((value) => normalizeValue(value)).filter(Boolean)
    : [];
}

function getDepartment(task: AutoModeTask): string {
  return normalizeValue(task.department);
}

function getActionType(task: AutoModeTask): string {
  return normalizeValue((task as AutoModeTask & { action_type?: string }).action_type);
}

function getTaskType(task: AutoModeTask): string {
  return normalizeValue(task.task_type ?? task.route_type);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isInsideAllowedHours(
  date: Date,
  startHour: number,
  endHour: number
): boolean {
  const hour = date.getHours();

  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
}

function buildDecision(
  allowed: boolean,
  reasonCode: AutoModePolicyReasonCode,
  context?: string
): AutoModePolicyDecision {
  switch (reasonCode) {
    case "outside_allowed_hours":
      return {
        allowed,
        reasonCode,
        reason: "Outside allowed Auto Mode hours.",
      };
    case "weekend_blocked":
      return {
        allowed,
        reasonCode,
        reason: "Auto Mode is disabled on weekends.",
      };
    case "department_not_allowed":
      return {
        allowed,
        reasonCode,
        reason: context
          ? `Department "${context}" is not allowed for Auto Mode.`
          : "Department is not allowed for Auto Mode.",
      };
    case "manual_only_department":
      return {
        allowed,
        reasonCode,
        reason: context
          ? `Department "${context}" is manual-only.`
          : "Department is manual-only.",
      };
    case "action_type_blocked":
      return {
        allowed,
        reasonCode,
        reason: context
          ? `Action type "${context}" is blocked by policy.`
          : "Action type is blocked by policy.",
      };
    case "task_type_blocked":
      return {
        allowed,
        reasonCode,
        reason: context
          ? `Task type "${context}" is blocked by policy.`
          : "Task type is blocked by policy.",
      };
    case "allowed":
    default:
      return {
        allowed,
        reasonCode: "allowed",
        reason: "Allowed by Auto Mode policy.",
      };
  }
}

export function evaluateAutoModePolicy(
  task: AutoModeTask,
  policy: AutoModePolicy = DEFAULT_AUTO_MODE_POLICY,
  now: Date = new Date()
): AutoModePolicyDecision {
  const department = getDepartment(task);
  const actionType = getActionType(task);
  const taskType = getTaskType(task);

  const allowedDepartments = normalizeStringList(policy.allowedDepartments);
  const manualOnlyDepartments = normalizeStringList(policy.manualOnlyDepartments);
  const blockedActionTypes = normalizeStringList(policy.blockedActionTypes);
  const blockedTaskTypes = normalizeStringList(policy.blockedTaskTypes);

  if (!policy.allowWeekends && isWeekend(now)) {
    return buildDecision(false, "weekend_blocked");
  }

  if (
    !isInsideAllowedHours(
      now,
      policy.allowedHoursStart,
      policy.allowedHoursEnd
    )
  ) {
    return buildDecision(false, "outside_allowed_hours");
  }

  if (
    allowedDepartments.length > 0 &&
    department &&
    !allowedDepartments.includes(department)
  ) {
    return buildDecision(false, "department_not_allowed", department);
  }

  if (department && manualOnlyDepartments.includes(department)) {
    return buildDecision(false, "manual_only_department", department);
  }

  if (actionType && blockedActionTypes.includes(actionType)) {
    return buildDecision(false, "action_type_blocked", actionType);
  }

  if (taskType && blockedTaskTypes.includes(taskType)) {
    return buildDecision(false, "task_type_blocked", taskType);
  }

  return buildDecision(true, "allowed");
}