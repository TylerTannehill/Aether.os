import type { ActionItem } from "@/lib/priority/action-engine";
import type { AetherDomain } from "@/lib/intelligence/signals";
import type { AetherSystemSnapshot } from "@/lib/intelligence/aggregator";

export type AetherTriggerActionType =
  | "create_task"
  | "promote_contact"
  | "shift_strategy"
  | "notify_domain"
  | "queue_follow_up";

export type AetherTriggerAction = {
  id: string;
  type: AetherTriggerActionType;
  sourceDomain: AetherDomain;
  targetDomain: AetherDomain;
  title: string;
  reason: string;
  priorityScore: number;
  payload: Record<string, string | number | boolean | null>;
};

function createTriggerAction(
  id: string,
  type: AetherTriggerActionType,
  sourceDomain: AetherDomain,
  targetDomain: AetherDomain,
  title: string,
  reason: string,
  priorityScore: number,
  payload: Record<string, string | number | boolean | null>
): AetherTriggerAction {
  return {
    id,
    type,
    sourceDomain,
    targetDomain,
    title,
    reason,
    priorityScore: Math.max(0, Math.min(10, Math.round(priorityScore))),
    payload,
  };
}

function mapTriggerToActionType(
  trigger: AetherTriggerAction
): ActionItem["type"] {
  if (trigger.type === "create_task" && trigger.targetDomain === "outreach") {
    return "follow_up_contact";
  }

  if (trigger.type === "promote_contact" && trigger.targetDomain === "finance") {
    return "work_opportunity";
  }

  if (trigger.type === "queue_follow_up") {
    return "follow_up_contact";
  }

  if (trigger.type === "shift_strategy") {
    return "review_routing";
  }

  if (trigger.type === "notify_domain") {
    return "review_alert";
  }

  return "monitor";
}

function mapTriggerToBucket(
  trigger: AetherTriggerAction
): ActionItem["bucket"] {
  if (trigger.type === "create_task" || trigger.type === "queue_follow_up") {
    return "follow_up";
  }

  if (trigger.type === "promote_contact") {
    return "pipeline";
  }

  if (trigger.type === "shift_strategy") {
    return "routing";
  }

  if (trigger.type === "notify_domain") {
    return "do_next";
  }

  return "do_next";
}

function mapTriggerToLevel(priorityScore: number): ActionItem["level"] {
  if (priorityScore >= 9) return "critical";
  if (priorityScore >= 7) return "high";
  if (priorityScore >= 4) return "medium";
  return "low";
}

function buildTriggerTargets(
  trigger: AetherTriggerAction
): ActionItem["targets"] {
  const targets: ActionItem["targets"] = [];

  if (typeof trigger.payload.contactId === "string") {
    targets.push({
      entityType: "contact",
      entityId: trigger.payload.contactId,
    });
  }

  if (typeof trigger.payload.opportunityId === "string") {
    targets.push({
      entityType: "opportunity",
      entityId: trigger.payload.opportunityId,
    });
  }

  if (typeof trigger.payload.ownerId === "string") {
    targets.push({
      entityType: "owner_queue",
      entityId: trigger.payload.ownerId,
    });
  }

  return targets;
}

function buildTriggerBadges(trigger: AetherTriggerAction): string[] {
  return [
    "Trigger",
    `Source ${trigger.sourceDomain}`,
    `Target ${trigger.targetDomain}`,
    trigger.type.replace(/_/g, " "),
  ];
}

export function toActionItemFromTrigger(
  trigger: AetherTriggerAction
): ActionItem {
  return {
    id: `trigger-action:${trigger.id}`,
    type: mapTriggerToActionType(trigger),
    bucket: mapTriggerToBucket(trigger),
    level: mapTriggerToLevel(trigger.priorityScore),
    score: trigger.priorityScore * 10,
    title: trigger.title,
    summary: trigger.reason,
    reason: trigger.reason,
    recommendedAction: trigger.title,
    targets: buildTriggerTargets(trigger),
    sourceIds: [trigger.id],
    badges: buildTriggerBadges(trigger),
    createdAt: new Date().toISOString(),
  };
}

export function buildActionItemsFromTriggers(
  triggers: AetherTriggerAction[]
): ActionItem[] {
  const deduped = new Map<string, ActionItem>();

  for (const trigger of triggers) {
    const item = toActionItemFromTrigger(trigger);
    const existing = deduped.get(item.id);

    if (!existing || item.score > existing.score) {
      deduped.set(item.id, item);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });
}

export function buildAetherTriggerActions(
  snapshot: AetherSystemSnapshot,
  context?: {
    highValueContacts?: {
      id: string;
      full_name?: string;
      donation_total?: number;
      pledge_amount?: number;
      last_contacted_at?: string | null;
    }[];
  }
): AetherTriggerAction[] {
  const actions: AetherTriggerAction[] = [];

  if (context?.highValueContacts?.length) {
    const candidates = context.highValueContacts
      .filter((c) => {
        const value =
          Number(c.donation_total ?? 0) +
          Number(c.pledge_amount ?? 0);

        const stale =
          !c.last_contacted_at ||
          new Date(c.last_contacted_at) <
            new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

        return value >= 250 && stale;
      })
      .slice(0, 5);

    for (const contact of candidates) {
      actions.push(
        createTriggerAction(
          `finance-outreach-${contact.id}`,
          "create_task",
          "finance",
          "outreach",
          `Follow up with ${contact.full_name || "donor"}`,
          "High-value donor has not been contacted recently.",
          9,
          {
            contactId: contact.id,
            contactName: contact.full_name || null,
            donationValue:
              Number(contact.donation_total ?? 0) +
              Number(contact.pledge_amount ?? 0),
            taskType: "donor_follow_up",
            source: "finance_intelligence",
          }
        )
      );
    }
  }

  for (const link of snapshot.crossDomainLinks) {
    if (link.from === "finance" && link.to === "outreach") {
      actions.push(
        createTriggerAction(
          "trigger-finance-outreach-followup",
          "create_task",
          "finance",
          "outreach",
          "Create donor outreach follow-up task",
          link.reason,
          link.score,
          {
            taskType: "donor_follow_up",
            suggestedOwner: "finance_or_outreach",
            source: "cross_domain_finance",
          }
        )
      );
    }

    if (link.from === "digital" && link.to === "field") {
      actions.push(
        createTriggerAction(
          "trigger-digital-field-message-sync",
          "notify_domain",
          "digital",
          "field",
          "Push winning message into field guidance",
          link.reason,
          link.score,
          {
            notificationType: "message_sync",
            source: "cross_domain_digital",
            suggestedAction: "update_field_talking_points",
          }
        )
      );
    }

    if (link.from === "print" && link.to === "field") {
      actions.push(
        createTriggerAction(
          "trigger-print-field-deployment",
          "queue_follow_up",
          "print",
          "field",
          "Queue material deployment follow-up",
          link.reason,
          link.score,
          {
            followUpType: "material_deployment",
            source: "cross_domain_print",
            suggestedAction: "activate_field_material_rollout",
          }
        )
      );
    }

    if (link.from === "outreach" && link.to === "finance") {
      actions.push(
        createTriggerAction(
          "trigger-outreach-finance-promotion",
          "promote_contact",
          "outreach",
          "finance",
          "Promote engaged contact into finance lane",
          link.reason,
          link.score,
          {
            promoteTo: "finance",
            source: "cross_domain_outreach",
            suggestedAction: "donor_conversion_follow_up",
          }
        )
      );
    }

    if (link.from === "digital" && link.to === "outreach") {
      actions.push(
        createTriggerAction(
          "trigger-digital-outreach-briefing",
          "notify_domain",
          "digital",
          "outreach",
          "Brief outreach on digital sentiment risk",
          link.reason,
          link.score,
          {
            notificationType: "sentiment_brief",
            source: "cross_domain_digital",
            suggestedAction: "tighten_outreach_language",
          }
        )
      );
    }
  }

  return actions.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getTopTriggerActions(
  snapshot: AetherSystemSnapshot,
  limit = 5,
  context?: Parameters<typeof buildAetherTriggerActions>[1]
): AetherTriggerAction[] {
  return buildAetherTriggerActions(snapshot, context).slice(0, limit);
}

export function getTopTriggerActionItems(
  snapshot: AetherSystemSnapshot,
  limit = 5,
  context?: Parameters<typeof buildAetherTriggerActions>[1]
): ActionItem[] {
  return buildActionItemsFromTriggers(
    getTopTriggerActions(snapshot, limit, context)
  );
}

export function summarizeTriggerActions(actions: AetherTriggerAction[]) {
  if (actions.length === 0) {
    return {
      headline: "No automatic cross-domain triggers surfaced.",
      body: "The intelligence layer did not find any strong cross-domain action opportunities right now.",
    };
  }

  const top = actions[0];

  return {
    headline: `${top.sourceDomain.toUpperCase()} should trigger ${top.targetDomain.toUpperCase()} action.`,
    body: `${top.title} is the strongest trigger right now because ${top.reason}`,
  };
}