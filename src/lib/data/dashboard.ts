import { supabase } from "@/lib/supabase";
import {
  Contact,
  DashboardData,
  DashboardMetrics,
  FocusItem,
  OutreachLog,
  OwnerDashboardSignal,
  OwnerQueue,
  OwnerSegment,
  TodaySnapshot,
} from "./types";
import { deriveStatusLabel, isOverdue, isToday } from "./utils";

export async function getDashboardData(): Promise<DashboardData> {
  const [contactsRes, listsRes, logsRes, tasksRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, city, state, party, owner_name"),

    supabase
      .from("lists")
      .select("id, name, created_at, default_owner_name"),

    supabase
      .from("outreach_logs")
      .select(
        "id, contact_id, list_id, channel, result, notes, created_at, contacts(id, first_name, last_name, email, phone, city, state, party, owner_name), lists(id, name, created_at, default_owner_name)"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("tasks")
      .select("id, title, description, status, priority, task_type, due_date, completed_at, contact_id, list_id, owner_name, notes, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  if (contactsRes.error) throw contactsRes.error;
  if (listsRes.error) throw listsRes.error;
  if (logsRes.error) throw logsRes.error;
  if (tasksRes.error) throw tasksRes.error;

  return {
    contacts: contactsRes.data ?? [],
    lists: listsRes.data ?? [],
    logs: ((logsRes.data ?? []) as unknown as OutreachLog[]),
    tasks: tasksRes.data ?? [],
  };
}

export function normalizeOwnerName(value?: string | null) {
  return value?.trim() || "Unassigned";
}

export function matchesOwnerFilter(value?: string | null, ownerFilter?: string) {
  if (!ownerFilter) return true;
  return normalizeOwnerName(value).toLowerCase() === ownerFilter.trim().toLowerCase();
}

export function filterDashboardDataByOwner(
  data: DashboardData,
  ownerFilter: string
): DashboardData {
  if (!ownerFilter.trim()) {
    return data;
  }

  const normalizedOwner = ownerFilter.trim().toLowerCase();

  const contacts = data.contacts.filter(
    (contact) => normalizeOwnerName(contact.owner_name).toLowerCase() === normalizedOwner
  );

  const contactIds = new Set(contacts.map((contact) => contact.id));

  const lists = data.lists.filter(
    (list) => normalizeOwnerName(list.default_owner_name).toLowerCase() === normalizedOwner
  );

  const listIds = new Set(lists.map((list) => list.id));

  const logs = data.logs.filter((log) => {
    const contactOwner = normalizeOwnerName(log.contacts?.owner_name).toLowerCase();
    const listOwner = normalizeOwnerName(log.lists?.default_owner_name).toLowerCase();

    return (
      contactIds.has(log.contact_id) ||
      (!!log.list_id && listIds.has(log.list_id)) ||
      contactOwner === normalizedOwner ||
      listOwner === normalizedOwner
    );
  });

  const tasks = data.tasks.filter(
    (task) => normalizeOwnerName(task.owner_name).toLowerCase() === normalizedOwner
  );

  return {
    contacts,
    lists,
    logs,
    tasks,
  };
}

function buildOwnerSegments(
  contacts: DashboardData["contacts"],
  logs: DashboardData["logs"]
): OwnerSegment[] {
  const latestByContact = new Map<string, OutreachLog>();

  for (const log of logs) {
    if (!latestByContact.has(log.contact_id)) {
      latestByContact.set(log.contact_id, log);
    }
  }

  const ownerMap = new Map<
    string,
    {
      owner: string;
      contactCount: number;
      withPhone: number;
      engaged: number;
      attempted: number;
      unreached: number;
    }
  >();

  for (const contact of contacts as Contact[]) {
    const owner = normalizeOwnerName(contact.owner_name);

    if (!ownerMap.has(owner)) {
      ownerMap.set(owner, {
        owner,
        contactCount: 0,
        withPhone: 0,
        engaged: 0,
        attempted: 0,
        unreached: 0,
      });
    }

    const row = ownerMap.get(owner)!;
    row.contactCount += 1;

    if (contact.phone) {
      row.withPhone += 1;
    }

    const latestLog = latestByContact.get(contact.id);

    if (!latestLog) {
      row.unreached += 1;
      continue;
    }

    const status = deriveStatusLabel(latestLog.result);
    if (status === "Engaged") row.engaged += 1;
    else if (status === "Attempted") row.attempted += 1;
    else row.unreached += 1;
  }

  return Array.from(ownerMap.values()).sort((a, b) => {
    if (a.owner === "Unassigned" && b.owner !== "Unassigned") return -1;
    if (a.owner !== "Unassigned" && b.owner === "Unassigned") return 1;
    if (a.contactCount !== b.contactCount) return b.contactCount - a.contactCount;
    return b.engaged - a.engaged;
  });
}

export function getAvailableDashboardOwners(data: DashboardData) {
  const ownerSet = new Set<string>();

  for (const contact of data.contacts) {
    ownerSet.add(normalizeOwnerName(contact.owner_name));
  }

  for (const list of data.lists) {
    if (list.default_owner_name?.trim()) {
      ownerSet.add(normalizeOwnerName(list.default_owner_name));
    }
  }

  for (const task of data.tasks) {
    ownerSet.add(normalizeOwnerName(task.owner_name));
  }

  return Array.from(ownerSet).sort((a, b) => {
    if (a === "Unassigned") return -1;
    if (b === "Unassigned") return 1;
    return a.localeCompare(b);
  });
}

export function computeDashboardMetrics(
  contacts: DashboardData["contacts"],
  lists: DashboardData["lists"],
  logs: DashboardData["logs"]
): DashboardMetrics {
  const callLogs = logs.filter((log) => log.channel === "call");
  const textLogs = logs.filter((log) => log.channel === "text");

  const latestByContact = new Map<string, OutreachLog>();

  for (const log of logs) {
    if (!latestByContact.has(log.contact_id)) {
      latestByContact.set(log.contact_id, log);
    }
  }

  let engagedCount = 0;
  let attemptedCount = 0;
  let doNotContactCount = 0;

  latestByContact.forEach((log) => {
    const status = deriveStatusLabel(log.result);

    if (status === "Engaged") engagedCount += 1;
    if (status === "Attempted") attemptedCount += 1;
    if (status === "Do Not Contact") doNotContactCount += 1;
  });

  const contactedCount = latestByContact.size;
  const unreachedCount = Math.max(contacts.length - contactedCount, 0);
  const assignedContactCount = contacts.filter((contact) => !!contact.owner_name?.trim()).length;
  const unassignedContactCount = Math.max(contacts.length - assignedContactCount, 0);

  const listMetaMap = new Map(
    lists.map((list) => [list.id, { name: list.name, default_owner_name: list.default_owner_name }])
  );

  const listMap = new Map<
    string,
    {
      id: string;
      name: string;
      activity: number;
      engaged: number;
      attempted: number;
      default_owner_name?: string | null;
    }
  >();

  for (const log of logs) {
    const listId = log.list_id || "unassigned";
    const listMeta = log.list_id ? listMetaMap.get(log.list_id) : null;
    const listName = log.lists?.name || listMeta?.name || "Unassigned";
    const defaultOwnerName =
      log.lists?.default_owner_name || listMeta?.default_owner_name || null;

    if (!listMap.has(listId)) {
      listMap.set(listId, {
        id: listId,
        name: listName,
        activity: 0,
        engaged: 0,
        attempted: 0,
        default_owner_name: defaultOwnerName,
      });
    }

    const row = listMap.get(listId)!;
    row.activity += 1;

    if (!row.default_owner_name && defaultOwnerName) {
      row.default_owner_name = defaultOwnerName;
    }

    const status = deriveStatusLabel(log.result);
    if (status === "Engaged") row.engaged += 1;
    if (status === "Attempted") row.attempted += 1;
  }

  const topLists = Array.from(listMap.values())
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 5);

  const ownerSegments = buildOwnerSegments(contacts, logs).slice(0, 6);

  return {
    totalContacts: contacts.length,
    totalLists: lists.length,
    totalLogs: logs.length,
    callLogs: callLogs.length,
    textLogs: textLogs.length,
    engagedCount,
    attemptedCount,
    doNotContactCount,
    unreachedCount,
    assignedContactCount,
    unassignedContactCount,
    topLists,
    recentActivity: logs.slice(0, 8),
    ownerSegments,
  };
}

export function getTodaySnapshot(
  tasks: DashboardData["tasks"],
  logs: DashboardData["logs"]
): TodaySnapshot {
  const urgentTasks = tasks.filter(
    (task) => task.priority === "urgent" && task.status !== "done"
  );

  const dueTodayTasks = tasks.filter(
    (task) => isToday(task.due_date) && task.status !== "done"
  );

  const overdueTasks = tasks.filter(
    (task) => isOverdue(task.due_date) && task.status !== "done"
  );

  const callbackQueue = logs.filter((log) =>
    log.result.toLowerCase().includes("callback")
  );

  const followUpQueue = logs.filter((log) => {
    const value = log.result.toLowerCase();
    return value.includes("answered") || value.includes("responded");
  });

  const focusItems: FocusItem[] = [
    ...overdueTasks.slice(0, 3).map((task) => ({
      id: `task-overdue-${task.id}`,
      title: task.title,
      subtitle: `Overdue task${task.due_date ? ` · due ${new Date(task.due_date).toLocaleString()}` : ""}`,
      href: "/dashboard/tasks",
      priority: task.priority,
      type: "task" as const,
    })),
    ...callbackQueue.slice(0, 3).map((log) => ({
      id: `callback-${log.id}`,
      title: log.contacts
        ? `${log.contacts.first_name ?? ""} ${log.contacts.last_name ?? ""}`.trim() || "Callback request"
        : "Callback request",
      subtitle: `Callback requested · ${log.result}${log.contacts?.owner_name ? ` · contact ${log.contacts.owner_name}` : log.lists?.default_owner_name ? ` · list ${log.lists.default_owner_name}` : ""}`,
      href: "/dashboard/outreach",
      priority: "urgent" as const,
      type: "callback" as const,
    })),
    ...dueTodayTasks.slice(0, 3).map((task) => ({
      id: `task-today-${task.id}`,
      title: task.title,
      subtitle: `Due today${task.due_date ? ` · ${new Date(task.due_date).toLocaleString()}` : ""}`,
      href: "/dashboard/tasks",
      priority: task.priority,
      type: "task" as const,
    })),
    ...followUpQueue.slice(0, 3).map((log) => ({
      id: `followup-${log.id}`,
      title: log.contacts
        ? `${log.contacts.first_name ?? ""} ${log.contacts.last_name ?? ""}`.trim() || "Follow up"
        : "Follow up",
      subtitle: `Follow-up opportunity · ${log.result}${log.contacts?.owner_name ? ` · contact ${log.contacts.owner_name}` : log.lists?.default_owner_name ? ` · list ${log.lists.default_owner_name}` : ""}`,
      href: "/dashboard/outreach",
      priority: "high" as const,
      type: "follow_up" as const,
    })),
    ...urgentTasks.slice(0, 3).map((task) => ({
      id: `task-urgent-${task.id}`,
      title: task.title,
      subtitle: `Urgent task${task.owner_name ? ` · owner ${task.owner_name}` : ""}`,
      href: "/dashboard/tasks",
      priority: task.priority,
      type: "task" as const,
    })),
  ].slice(0, 6);

  return {
    urgentTasks,
    dueTodayTasks,
    overdueTasks,
    callbackQueue,
    followUpQueue,
    focusItems,
  };
}

function buildOwnerQueues(tasks: DashboardData["tasks"]): OwnerQueue[] {
  const activeTasks = tasks.filter(
    (task) => task.status !== "done" && task.status !== "cancelled"
  );

  const queueMap = new Map<string, typeof activeTasks>();

  for (const task of activeTasks) {
    const owner = normalizeOwnerName(task.owner_name);

    if (!queueMap.has(owner)) {
      queueMap.set(owner, []);
    }

    queueMap.get(owner)!.push(task);
  }

  return Array.from(queueMap.entries())
    .map(([owner, ownerTasks]) => ({
      owner,
      total: ownerTasks.length,
      open: ownerTasks.filter((task) => task.status === "open").length,
      in_progress: ownerTasks.filter((task) => task.status === "in_progress").length,
      urgent: ownerTasks.filter((task) => task.priority === "urgent").length,
      due_today: ownerTasks.filter((task) => isToday(task.due_date)).length,
      overdue: ownerTasks.filter((task) => isOverdue(task.due_date)).length,
      tasks: ownerTasks,
    }))
    .sort((a, b) => {
      if (a.owner === "Unassigned" && b.owner !== "Unassigned") return -1;
      if (a.owner !== "Unassigned" && b.owner === "Unassigned") return 1;
      if (a.overdue !== b.overdue) return b.overdue - a.overdue;
      if (a.urgent !== b.urgent) return b.urgent - a.urgent;
      return b.total - a.total;
    });
}

export function getOwnerDashboardSignals(
  tasks: DashboardData["tasks"]
): OwnerDashboardSignal {
  const ownerQueues = buildOwnerQueues(tasks);

  const unassignedQueue =
    ownerQueues.find((queue) => queue.owner === "Unassigned") || null;

  const busiestOwner =
    ownerQueues
      .filter((queue) => queue.owner !== "Unassigned")
      .sort((a, b) => {
        if (a.total !== b.total) return b.total - a.total;
        if (a.overdue !== b.overdue) return b.overdue - a.overdue;
        return b.urgent - a.urgent;
      })[0] || null;

  const overdueOwnerQueues = ownerQueues
    .filter((queue) => queue.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 4);

  const dueTodayOwnerQueues = ownerQueues
    .filter((queue) => queue.due_today > 0)
    .sort((a, b) => b.due_today - a.due_today)
    .slice(0, 4);

  return {
    busiestOwner,
    unassignedQueue,
    overdueOwnerQueues,
    dueTodayOwnerQueues,
  };
}