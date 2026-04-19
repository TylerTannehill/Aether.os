import type { AutoModePolicy, AutoModePolicyReasonCode } from "./auto-mode-policy";
import {
  DEFAULT_AUTO_MODE_POLICY,
  evaluateAutoModePolicy,
} from "./auto-mode-policy";
import type { AutoModeTask } from "./auto-mode";

export type PolicyCheckResult = {
  allowed: boolean;
  reason?: Exclude<AutoModePolicyReasonCode, "allowed">;
};

function normalizeValue(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isWithinAllowedHours(
  policy: AutoModePolicy = DEFAULT_AUTO_MODE_POLICY,
  now: Date = new Date()
): boolean {
  const task = {
    id: "policy-hours-check",
    title: "Policy hours check",
    department: null,
    task_type: null,
    route_type: null,
    action_type: null,
    auto_mode_reason: "",
    brain_score: 0,
    brain_tier: "low",
    brain_reasons: [],
    brain_should_surface: false,
    brain_auto_execute: false,
  } as unknown as AutoModeTask;

  const result = evaluateAutoModePolicy(task, policy, now);
  return result.reasonCode !== "outside_allowed_hours";
}

export function isWeekend(now: Date = new Date()): boolean {
  const day = now.getDay();
  return day === 0 || day === 6;
}

export function checkPolicy({
  policy = DEFAULT_AUTO_MODE_POLICY,
  department,
  actionType,
  taskType,
  now,
}: {
  policy: AutoModePolicy;
  department?: string | null;
  actionType?: string | null;
  taskType?: string | null;
  now?: Date;
}): PolicyCheckResult {
  const task = {
    id: "policy-check",
    title: "Policy check",
    department: normalizeValue(department) || null,
    task_type: normalizeValue(taskType) || null,
    route_type: normalizeValue(taskType) || null,
    action_type: normalizeValue(actionType) || null,
    auto_mode_reason: "",
    brain_score: 0,
    brain_tier: "low",
    brain_reasons: [],
    brain_should_surface: false,
    brain_auto_execute: false,
  } as unknown as AutoModeTask;

  const result = evaluateAutoModePolicy(task, policy, now ?? new Date());

  if (result.allowed || result.reasonCode === "allowed") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: result.reasonCode,
  };
}