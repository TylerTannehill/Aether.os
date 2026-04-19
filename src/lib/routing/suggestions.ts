type Task = {
  task_type?: string | null;
  list_id?: string | null;
  fallback_reason?: string | null;
  owner_name?: string | null;
};

type SuggestedRule = {
  key: string;
  count: number;
  task_type?: string | null;
  list_id?: string | null;
  fallback_reason?: string | null;
  suggested_owner?: string | null;
};

export function generateRuleSuggestions(tasks: Task[]): SuggestedRule[] {
  const map = new Map<string, SuggestedRule>();

  for (const task of tasks) {
    if (!task.fallback_reason) continue;

    const key = [
      task.task_type || "any",
      task.list_id || "any",
      task.fallback_reason,
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        key,
        count: 0,
        task_type: task.task_type,
        list_id: task.list_id,
        fallback_reason: task.fallback_reason,
        suggested_owner: task.owner_name || null,
      });
    }

    map.get(key)!.count++;
  }

  return Array.from(map.values())
    .filter((s) => s.count >= 3) // 🔥 threshold
    .sort((a, b) => b.count - a.count);
}