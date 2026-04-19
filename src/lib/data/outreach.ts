import { supabase } from "@/lib/supabase";
import {
  AutoTaskOutcome,
  CampaignList,
  Contact,
  ContactIntelligence,
  ListContactRow,
  OutreachLog,
  TaskType,
} from "./types";
import { addDaysIso, fullName } from "./utils";

const FALLBACK_OWNER = "Operations";

export const callResults = [
  "Answered",
  "Voicemail",
  "No Answer",
  "Wrong Number",
  "Callback Requested",
] as const;

export const textResults = [
  "Sent",
  "Delivered",
  "Responded",
  "Opt Out",
  "Failed",
] as const;

type IntelligenceInput =
  | Map<string, ContactIntelligence>
  | Record<string, ContactIntelligence>
  | OutreachLog[];

export async function getOutreachLists(): Promise<CampaignList[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at, default_owner_name")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as CampaignList[]) ?? [];
}

export async function getListContacts(listId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("list_contacts")
    .select(
      "contact_id, contacts(id, first_name, last_name, email, phone, city, state, party, owner_name)"
    )
    .eq("list_id", listId);

  if (error) throw error;

  return (((data ?? []) as unknown as ListContactRow[]).flatMap((row) => {
    const linked = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
    return linked ? [linked] : [];
  })) as Contact[];
}

export async function getOutreachLogs(listId: string): Promise<OutreachLog[]> {
  const { data, error } = await supabase
    .from("outreach_logs")
    .select(
      "id, contact_id, list_id, channel, result, notes, created_at, contacts(id, first_name, last_name, email, phone, city, state, party, owner_name)"
    )
    .eq("list_id", listId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return ((data ?? []) as unknown as OutreachLog[]);
}

export function deriveStatusAndNextAction(log: OutreachLog | null) {
  if (!log) {
    return {
      statusLabel: "Unreached",
      statusClasses: "border border-slate-200 bg-slate-100 text-slate-700",
      nextAction: "Call",
      nextActionClasses: "border border-blue-200 bg-blue-100 text-blue-700",
      priority: 1,
    };
  }

  const result = log.result.toLowerCase();

  if (
    result.includes("answered") ||
    result.includes("responded") ||
    result.includes("callback")
  ) {
    return {
      statusLabel: "Engaged",
      statusClasses: "border border-emerald-200 bg-emerald-100 text-emerald-700",
      nextAction: "Follow Up",
      nextActionClasses: "border border-purple-200 bg-purple-100 text-purple-700",
      priority: 2,
    };
  }

  if (result.includes("opt out")) {
    return {
      statusLabel: "Do Not Contact",
      statusClasses: "border border-rose-200 bg-rose-100 text-rose-700",
      nextAction: "Skip",
      nextActionClasses: "border border-slate-200 bg-slate-100 text-slate-500",
      priority: 99,
    };
  }

  return {
    statusLabel: "Attempted",
    statusClasses: "border border-amber-200 bg-amber-100 text-amber-700",
    nextAction: "Retry",
    nextActionClasses: "border border-orange-200 bg-orange-100 text-orange-700",
    priority: 3,
  };
}

export function buildContactIntelligence(
  contacts: Contact[],
  logs: OutreachLog[]
): Map<string, ContactIntelligence> {
  const map = new Map<string, ContactIntelligence>();

  for (const contact of contacts) {
    const lastLog = logs.find((log) => log.contact_id === contact.id) || null;
    const derived = deriveStatusAndNextAction(lastLog);

    map.set(contact.id, {
      lastLog,
      statusLabel: derived.statusLabel,
      statusClasses: derived.statusClasses,
      nextAction: derived.nextAction,
      nextActionClasses: derived.nextActionClasses,
      priority: derived.priority,
    });
  }

  return map;
}

function resolveIntelligenceByContact(
  contacts: Contact[],
  intelligenceInput: IntelligenceInput
): Map<string, ContactIntelligence> {
  if (intelligenceInput instanceof Map) {
    return intelligenceInput;
  }

  if (Array.isArray(intelligenceInput)) {
    return buildContactIntelligence(contacts, intelligenceInput);
  }

  const map = new Map<string, ContactIntelligence>();

  for (const [contactId, intelligence] of Object.entries(intelligenceInput)) {
    map.set(contactId, intelligence);
  }

  return map;
}

export function getSortedWorkflowContacts(
  contacts: Contact[],
  intelligenceInput: IntelligenceInput
) {
  const intelligenceByContact = resolveIntelligenceByContact(
    contacts,
    intelligenceInput
  );

  return [...contacts]
    .filter((contact) => intelligenceByContact.get(contact.id)?.nextAction !== "Skip")
    .sort((a, b) => {
      const aIntel = intelligenceByContact.get(a.id);
      const bIntel = intelligenceByContact.get(b.id);

      const aPriority = aIntel?.priority ?? 999;
      const bPriority = bIntel?.priority ?? 999;

      if (aPriority !== bPriority) return aPriority - bPriority;

      const aTime = aIntel?.lastLog?.created_at
        ? new Date(aIntel.lastLog.created_at).getTime()
        : 0;
      const bTime = bIntel?.lastLog?.created_at
        ? new Date(bIntel.lastLog.created_at).getTime()
        : 0;

      return aTime - bTime;
    });
}

export function filterOutreachContacts(
  contacts: Contact[],
  search: string,
  intelligenceInput: IntelligenceInput
) {
  const intelligenceByContact = resolveIntelligenceByContact(
    contacts,
    intelligenceInput
  );

  const query = search.toLowerCase().trim();

  if (!query) return contacts;

  return contacts.filter((contact) => {
    const intelligence = intelligenceByContact.get(contact.id);
    const name = fullName(contact).toLowerCase();
    const email = (contact.email || "").toLowerCase();
    const phone = (contact.phone || "").toLowerCase();
    const city = (contact.city || "").toLowerCase();
    const state = (contact.state || "").toLowerCase();
    const owner = (contact.owner_name || "").toLowerCase();
    const status = (intelligence?.statusLabel || "").toLowerCase();
    const nextAction = (intelligence?.nextAction || "").toLowerCase();

    return (
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      city.includes(query) ||
      state.includes(query) ||
      owner.includes(query) ||
      status.includes(query) ||
      nextAction.includes(query)
    );
  });
}

export async function createAutoTaskForOutcome(args: {
  contactId: string;
  listId: string | null;
  channel: "call" | "text";
  result: string;
  contactName: string;
  listName: string;
  ownerName?: string | null;
}): Promise<AutoTaskOutcome> {
  const normalized = args.result.toLowerCase();

  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .select("owner_name")
    .eq("id", args.contactId)
    .single();

  if (contactError && contactError.code !== "PGRST116") {
    return { created: false, skipped: false, error: contactError.message };
  }

  const contactOwner = contactData?.owner_name?.trim() || null;
  const listOwner = args.ownerName?.trim() || null;
  const resolvedOwner = contactOwner || listOwner || FALLBACK_OWNER;

  let taskType: TaskType | null = null;
  let title = "";
  let description = "";
  let priority: "low" | "medium" | "high" | "urgent" = "medium";
  let dueDate: string | null = null;

  if (normalized.includes("callback")) {
    taskType = "call";
    title = `Call back ${args.contactName}`;
    description = `Auto-created from outreach log: ${args.result} in ${args.listName}.`;
    priority = "urgent";
    dueDate = addDaysIso(1);
  } else if (normalized.includes("answered") || normalized.includes("responded")) {
    taskType = "follow_up";
    title = `Follow up with ${args.contactName}`;
    description = `Auto-created from outreach log: ${args.result} in ${args.listName}.`;
    priority = "high";
    dueDate = addDaysIso(2);
  }

  if (!taskType) {
    return { created: false, skipped: true };
  }

  const existingTasksQuery = supabase
    .from("tasks")
    .select("id")
    .eq("contact_id", args.contactId)
    .eq("task_type", taskType)
    .in("status", ["open", "in_progress"])
    .limit(1);

  const { data: existingTasks, error: existingError } =
    args.listId === null
      ? await existingTasksQuery.is("list_id", null)
      : await existingTasksQuery.eq("list_id", args.listId);

  if (existingError) {
    return { created: false, skipped: false, error: existingError.message };
  }

  if (existingTasks && existingTasks.length > 0) {
    return { created: false, skipped: true };
  }

  const routingSource = contactOwner
    ? "contact owner"
    : listOwner
      ? "list owner"
      : "fallback owner";

  const { error: insertError } = await supabase.from("tasks").insert([
    {
      title,
      description,
      status: "open",
      priority,
      task_type: taskType,
      due_date: dueDate,
      contact_id: args.contactId,
      list_id: args.listId,
      owner_name: resolvedOwner,
      notes: `Generated automatically from ${args.channel} outcome. Routed to ${routingSource}.`,
    },
  ]);

  if (insertError) {
    return { created: false, skipped: false, error: insertError.message };
  }

  return { created: true, skipped: false };
}

export async function saveOutreachLog(args: {
  contactId: string;
  listId: string | null;
  channel: "call" | "text";
  result: string;
  notes?: string | null;
}) {
  const { error } = await supabase.from("outreach_logs").insert([
    {
      contact_id: args.contactId,
      list_id: args.listId,
      channel: args.channel,
      result: args.result,
      notes: args.notes?.trim() || null,
    },
  ]);

  if (error) throw error;
}