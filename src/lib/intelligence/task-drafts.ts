import type { AetherTriggerAction } from "@/lib/intelligence/action-triggers";

export type AetherDraftTask = {
  id: string;
  title: string;
  department: string;
  priority: "high" | "medium" | "low";
  description: string;

  // 🔥 NEW (but backward-safe)
  contactId?: string | null;

  // metadata preserved + extended
  metadata: Record<string, string | number | boolean | null>;
};

function priorityFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export function buildDraftTaskFromTrigger(
  trigger: AetherTriggerAction
): AetherDraftTask {
  return {
    id: `draft-${trigger.id}`,
    title: trigger.title,
    department: trigger.targetDomain,
    priority: priorityFromScore(trigger.priorityScore),
    description: trigger.reason,

    // 🔥 NEW: attach contact if present (finance → outreach magic)
    contactId:
      typeof trigger.payload?.contactId === "string"
        ? trigger.payload.contactId
        : null,

    metadata: trigger.payload,
  };
}

export function buildDraftTasksFromTriggers(
  triggers: AetherTriggerAction[]
): AetherDraftTask[] {
  return triggers.map(buildDraftTaskFromTrigger);
}