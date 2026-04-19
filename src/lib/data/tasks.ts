import { supabase } from "@/lib/supabase";
import {
  CreateTaskInput,
  OwnerQueue,
  Task,
  TaskCounts,
  TaskStatus,
  UpdateTaskOwnerInput,
} from "./types";
import { isOverdue, isToday } from "./utils";

type TaskWithFallbackReason = Task & {
  fallback_reason?: string | null;
};

type RoutingRuleRow = {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  task_type?: string | null;
  list_id?: string | null;
  contact_id?: string | null;
  fallback_reason?: string | null;
  route_to_owner_name?: string | null;
  priority_override?: Task["priority"] | null;
  matched_count?: number | null;
  last_matched_at?: string | null;
};

function normalizeFallbackReason(input: CreateTaskInput): string | null {
  if ((input.task_type as string) !== "fallback") return null;

  const owner = input.owner_name?.trim() || "";
  const description = input.description?.toLowerCase() || "";
  const title = input.title.toLowerCase();

  if (!owner) return "no_owner";
  if (description.includes("manual override") || title.includes("manual override")) {
    return "manual_override";
  }
  if (
    description.includes("missing contact data") ||
    description.includes("missing data") ||
    title.includes("missing contact data")
  ) {
    return "missing_contact_data";
  }

  return "no_rule_match";
}

export async function getTasks(): Promise<TaskWithFallbackReason[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as TaskWithFallbackReason[]) ?? [];
}

export async function createTask(input: CreateTaskInput) {
  const fallbackReason = normalizeFallbackReason(input);

  let resolvedOwner: string | null = input.owner_name?.trim() || null;
  let resolvedPriority = input.priority;
  let matchedRuleId: string | null = null;

  try {
    const { data: rules, error: rulesError } = await supabase
      .from("routing_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false }) // 🔥 KEY CHANGE
      .order("matched_count", { ascending: false });

    if (rulesError) throw rulesError;

    const inputWithRelations = input as CreateTaskInput & {
      list_id?: string | null;
      contact_id?: string | null;
    };

    const match = ((rules as RoutingRuleRow[] | null) ?? []).find((rule) => {
      const matchesTaskType = !rule.task_type || rule.task_type === input.task_type;
      const matchesList = !rule.list_id || rule.list_id === inputWithRelations.list_id;
      const matchesContact =
        !rule.contact_id || rule.contact_id === inputWithRelations.contact_id;
      const matchesFallback =
        !rule.fallback_reason || rule.fallback_reason === fallbackReason;

      return (
        matchesTaskType &&
        matchesList &&
        matchesContact &&
        matchesFallback
      );
    });

    if (match) {
      matchedRuleId = match.id;

      if (match.route_to_owner_name?.trim()) {
        resolvedOwner = match.route_to_owner_name.trim();
      }

      if (match.priority_override) {
        resolvedPriority = match.priority_override;
      }
    }
  } catch (err) {
    console.error("Routing rule check failed:", err);
  }

  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    owner_name: resolvedOwner,
    priority: resolvedPriority,
    task_type: input.task_type,
    due_date: input.due_date || null,
    fallback_reason: fallbackReason,
  };

  const { error } = await supabase.from("tasks").insert([payload]);

  if (error) throw error;

  if (matchedRuleId) {
    try {
      const { data: rule } = await supabase
        .from("routing_rules")
        .select("matched_count")
        .eq("id", matchedRuleId)
        .maybeSingle();

      const count =
        typeof (rule as any)?.matched_count === "number"
          ? (rule as any).matched_count
          : 0;

      await supabase
        .from("routing_rules")
        .update({
          matched_count: count + 1,
          last_matched_at: new Date().toISOString(),
        })
        .eq("id", matchedRuleId);
    } catch (err) {
      console.error("Rule tracking failed:", err);
    }
  }
}

export async function updateTaskStatus(taskId: string, nextStatus: TaskStatus) {
  const payload: Partial<Task> = {
    status: nextStatus,
    completed_at: nextStatus === "done" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);

  if (error) throw error;
}

export async function updateTaskOwner(input: UpdateTaskOwnerInput) {
  const payload = {
    owner_name: input.owner_name?.trim() || null,
  };

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", input.taskId);

  if (error) throw error;
}

export function filterTasks(
  tasks: TaskWithFallbackReason[],
  search: string,
  statusFilter: string
) {
  const query = search.toLowerCase().trim();

  return tasks.filter((task) => {
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.description || "").toLowerCase().includes(query) ||
      (task.owner_name || "").toLowerCase().includes(query) ||
      task.task_type.toLowerCase().includes(query) ||
      (task.fallback_reason || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function getTaskCounts(tasks: Task[]): TaskCounts {
  return {
    open: tasks.filter((task) => task.status === "open").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length,
    urgent: tasks.filter((task) => task.priority === "urgent").length,
  };
}

export function getOwnerQueues(tasks: Task[]): OwnerQueue[] {
  const activeTasks = tasks.filter(
    (task) => task.status !== "done" && task.status !== "cancelled"
  );

  const queueMap = new Map<string, Task[]>();

  for (const task of activeTasks) {
    const owner = task.owner_name?.trim() || "Unassigned";

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
      tasks: ownerTasks.sort((a, b) => {
        const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aWeight = priorityWeight[a.priority];
        const bWeight = priorityWeight[b.priority];

        if (aWeight !== bWeight) return aWeight - bWeight;

        const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;

        return aDue - bDue;
      }),
    }))
    .sort((a, b) => {
      if (a.owner === "Unassigned" && b.owner !== "Unassigned") return -1;
      if (a.owner !== "Unassigned" && b.owner === "Unassigned") return 1;
      if (a.overdue !== b.overdue) return b.overdue - a.overdue;
      if (a.urgent !== b.urgent) return b.urgent - a.urgent;
      return b.total - a.total;
    });
}

export function getMyQueue(tasks: Task[], ownerFilter: string) {
  const normalized = ownerFilter.trim().toLowerCase();

  if (!normalized) return [];

  return tasks.filter(
    (task) => (task.owner_name || "Unassigned").trim().toLowerCase() === normalized
  );
}