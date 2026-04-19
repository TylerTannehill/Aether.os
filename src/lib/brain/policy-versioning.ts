import type { AutoModePolicy } from "@/lib/brain";
import type { PolicyRecommendation } from "./policy-recommendations";

export type PolicyVersionRecord = {
  id: string;
  createdAt: string;
  source: "manual" | "recommendation" | "rollback";
  note: string;
  policy: AutoModePolicy;
  recommendationId?: string | null;
};

function clonePolicy(policy: AutoModePolicy): AutoModePolicy {
  return {
    allowedHoursStart: policy.allowedHoursStart,
    allowedHoursEnd: policy.allowedHoursEnd,
    allowWeekends: policy.allowWeekends,
    allowedDepartments: [...policy.allowedDepartments],
    blockedActionTypes: [...policy.blockedActionTypes],
    blockedTaskTypes: [...policy.blockedTaskTypes],
    manualOnlyDepartments: [...policy.manualOnlyDepartments],
  };
}

export function createPolicyVersionRecord(args: {
  policy: AutoModePolicy;
  source: PolicyVersionRecord["source"];
  note: string;
  recommendation?: PolicyRecommendation | null;
  now?: string;
}): PolicyVersionRecord {
  const timestamp = args.now ?? new Date().toISOString();
  const recommendationId = args.recommendation?.id ?? null;

  return {
    id: `policy:${timestamp}:${recommendationId ?? args.source}`,
    createdAt: timestamp,
    source: args.source,
    note: args.note,
    policy: clonePolicy(args.policy),
    recommendationId,
  };
}

export function appendPolicyVersion(
  history: PolicyVersionRecord[],
  record: PolicyVersionRecord,
  maxItems: number = 25
): PolicyVersionRecord[] {
  const next = [record, ...history];
  return next.slice(0, maxItems);
}

export function rollbackPolicyVersion(
  history: PolicyVersionRecord[],
  targetId: string
): AutoModePolicy | null {
  const match = history.find((record) => record.id === targetId);
  return match ? clonePolicy(match.policy) : null;
}