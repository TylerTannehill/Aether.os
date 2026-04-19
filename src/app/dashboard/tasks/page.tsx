"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/lib/data/types";
import { formatDateTime } from "@/lib/data/utils";
import { TaskFixPanel } from "@/components/tasks/task-fix-panel";
import { TaskRouteBadge } from "@/components/tasks/task-route-badge";
import { useDashboardOwner } from "../owner-context";

function normalizeOwner(value?: string | null) {
  return value?.trim() || "Unassigned";
}

function isOverdue(value?: string | null) {
  if (!value) return false;
  const due = new Date(value);
  const now = new Date();

  due.setHours(23, 59, 59, 999);
  return due.getTime() < now.getTime();
}

function isToday(value?: string | null) {
  if (!value) return false;

  const due = new Date(value);
  const now = new Date();

  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

function isFallbackTask(taskType?: string | null) {
  return (taskType || "").trim().toLowerCase() === "fallback";
}

function formatFallbackReason(reason?: string | null) {
  if (!reason) return "No reason logged";

  return reason
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type TaskRow = Task & {
  fallback_reason?: string | null;
};

type ContactOwnerLookup = {
  id: string;
  owner_name?: string | null;
};

type ListOwnerLookup = {
  id: string;
  default_owner_name?: string | null;
};

export default function DashboardTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [editingOwner, setEditingOwner] = useState<Record<string, string>>({});
  const [savingOwnerId, setSavingOwnerId] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [autoAssigningTaskId, setAutoAssigningTaskId] = useState<string | null>(null);

  const ownerInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { ownerFilter } = useDashboardOwner();

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, description, status, priority, task_type, fallback_reason, due_date, completed_at, contact_id, list_id, owner_name, notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks((data as TaskRow[]) ?? []);
    } catch (err: any) {
      setMessage(err?.message || "Error loading tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveOwner(taskId: string) {
    try {
      setSavingOwnerId(taskId);
      setMessage("");

      const nextOwner = editingOwner[taskId] ?? "";

      const { error } = await supabase
        .from("tasks")
        .update({
          owner_name: nextOwner.trim() || null,
        })
        .eq("id", taskId);

      if (error) throw error;

      setMessage("Task owner updated.");
      await loadTasks();
    } catch (err: any) {
      setMessage(err?.message || "Failed to update task owner.");
    } finally {
      setSavingOwnerId(null);
    }
  }

  async function saveStatus(taskId: string, nextStatus: Task["status"]) {
    try {
      setSavingStatusId(taskId);
      setMessage("");

      const payload: Partial<Task> = {
        status: nextStatus,
      };

      if (nextStatus === "done") {
        payload.completed_at = new Date().toISOString();
      } else {
        payload.completed_at = null;
      }

      const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);

      if (error) throw error;

      setMessage("Task status updated.");
      await loadTasks();
    } catch (err: any) {
      setMessage(err?.message || "Failed to update task status.");
    } finally {
      setSavingStatusId(null);
    }
  }

  async function autoAssignOwner(task: TaskRow) {
    try {
      setAutoAssigningTaskId(task.id);
      setMessage("");

      let nextOwner: string | null = null;

      if (task.list_id) {
        const { data: listData, error: listError } = await supabase
          .from("lists")
          .select("id, default_owner_name")
          .eq("id", task.list_id)
          .maybeSingle();

        if (listError) throw listError;

        nextOwner = (listData as ListOwnerLookup | null)?.default_owner_name?.trim() || null;
      }

      if (!nextOwner && task.contact_id) {
        const { data: contactData, error: contactError } = await supabase
          .from("contacts")
          .select("id, owner_name")
          .eq("id", task.contact_id)
          .maybeSingle();

        if (contactError) throw contactError;

        nextOwner = (contactData as ContactOwnerLookup | null)?.owner_name?.trim() || null;
      }

      if (!nextOwner && ownerFilter.trim()) {
        nextOwner = ownerFilter.trim();
      }

      if (!nextOwner) {
        setMessage(
          `No default owner was found for "${task.title}". Assign one manually or add a list/contact owner default first.`
        );
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          owner_name: nextOwner,
        })
        .eq("id", task.id);

      if (error) throw error;

      setEditingOwner((prev) => ({
        ...prev,
        [task.id]: nextOwner as string,
      }));

      setMessage(`Owner auto-assigned to "${nextOwner}" for "${task.title}".`);
      await loadTasks();
    } catch (err: any) {
      setMessage(err?.message || "Failed to auto-assign owner.");
    } finally {
      setAutoAssigningTaskId(null);
    }
  }

  function focusOwnerInput(task: TaskRow) {
    const input = ownerInputRefs.current[task.id];
    setMessage(`Assign an owner to "${task.title}" and click Save.`);
    input?.focus();
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function filterToTask(task: TaskRow, nextMessage: string) {
    setSearch(task.title);
    setMessage(nextMessage);
  }

  function handleFallbackFix(task: TaskRow) {
    const reason = task.fallback_reason || "";

    if (reason === "no_owner") {
      focusOwnerInput(task);
      return;
    }

    if (reason === "missing_contact_data") {
      filterToTask(
        task,
        `Review "${task.title}" for missing contact data. The task has been filtered into view so you can inspect and correct it.`
      );
      return;
    }

    if (reason === "no_rule_match") {
      filterToTask(
        task,
        `Routing rule gap detected for "${task.title}". Review this task and use its pattern to create or tighten your routing rules.`
      );
      return;
    }

    if (reason === "manual_override") {
      filterToTask(
        task,
        `This task was manually overridden. Review "${task.title}" to confirm the override is still appropriate.`
      );
      return;
    }

    filterToTask(task, `Investigate fallback routing on "${task.title}".`);
  }

  const ownerScopedTasks = useMemo(() => {
    if (!ownerFilter.trim()) return tasks;

    const normalizedFilter = ownerFilter.trim().toLowerCase();

    return tasks.filter(
      (task) => normalizeOwner(task.owner_name).toLowerCase() === normalizedFilter
    );
  }, [tasks, ownerFilter]);

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase().trim();
    const statusValue = statusFilter.toLowerCase().trim();
    const priorityValue = priorityFilter.toLowerCase().trim();

    return ownerScopedTasks.filter((task) => {
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      const owner = normalizeOwner(task.owner_name).toLowerCase();
      const taskType = (task.task_type || "").toLowerCase();
      const fallbackReason = (task.fallback_reason || "").toLowerCase();
      const status = (task.status || "").toLowerCase();
      const priority = (task.priority || "").toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        owner.includes(query) ||
        taskType.includes(query) ||
        fallbackReason.includes(query);

      const matchesStatus = !statusValue || status === statusValue;
      const matchesPriority = !priorityValue || priority === priorityValue;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [ownerScopedTasks, search, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    return {
      total: ownerScopedTasks.length,
      filtered: filteredTasks.length,
      open: ownerScopedTasks.filter((task) => task.status === "open").length,
      inProgress: ownerScopedTasks.filter((task) => task.status === "in_progress").length,
      done: ownerScopedTasks.filter((task) => task.status === "done").length,
      urgent: ownerScopedTasks.filter((task) => task.priority === "urgent").length,
      overdue: ownerScopedTasks.filter(
        (task) => task.status !== "done" && isOverdue(task.due_date)
      ).length,
      dueToday: ownerScopedTasks.filter(
        (task) => task.status !== "done" && isToday(task.due_date)
      ).length,
      fallback: ownerScopedTasks.filter((task) => isFallbackTask(task.task_type)).length,
    };
  }, [ownerScopedTasks, filteredTasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Task Operations
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
                Tasks
              </h1>
              <p className="max-w-3xl text-sm text-slate-600 lg:text-base">
                Manage execution, ownership, due dates, and fallback-routed work across
                the operator lane.
              </p>
            </div>
          </div>

          <button
            onClick={loadTasks}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active Owner Lane
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Viewing tasks for{" "}
              <span className="font-semibold">{ownerFilter || "All Owners"}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {ownerScopedTasks.length} task{ownerScopedTasks.length === 1 ? "" : "s"} in
            current lane
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Tasks</p>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            {counts.total}
          </p>
          <p className="mt-2 text-sm text-slate-500">Tasks in current lane</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Filtered</p>
            <Users className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            {counts.filtered}
          </p>
          <p className="mt-2 text-sm text-slate-500">Current visible tasks</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Open</p>
            <Clock className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            {counts.open}
          </p>
          <p className="mt-2 text-sm text-slate-500">Ready to start</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">In Progress</p>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-blue-600">
            {counts.inProgress}
          </p>
          <p className="mt-2 text-sm text-slate-500">Work currently moving</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Urgent</p>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-rose-600">
            {counts.urgent}
          </p>
          <p className="mt-2 text-sm text-slate-500">Highest priority items</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Fallback</p>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-amber-600">
            {counts.fallback}
          </p>
          <p className="mt-2 text-sm text-slate-500">Fallback-routed tasks</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Done</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-emerald-600">
            {counts.done}
          </p>
          <p className="mt-2 text-sm text-slate-500">Completed in lane</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, owner, type, reason..."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {counts.overdue} overdue · {counts.dueToday} due today
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        {message ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No tasks matched this owner lane and filter set.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Title
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Type
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Priority
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Due
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Owner
                  </th>
                  <th className="px-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Save Owner
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => {
                  const currentOwnerValue = editingOwner[task.id] ?? task.owner_name ?? "";
                  const overdue = task.status !== "done" && isOverdue(task.due_date);
                  const dueToday = task.status !== "done" && isToday(task.due_date);
                  const fallbackTask = isFallbackTask(task.task_type);

                  return (
                    <tr key={task.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 align-top">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <TaskRouteBadge
                              taskType={task.task_type}
                              fallbackReason={task.fallback_reason}
                              onFix={() => handleFallbackFix(task)}
                            />
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {task.description || "No description"}
                          </p>

                          {fallbackTask ? (
                            <>
                              <p className="mt-2 text-xs font-medium text-amber-700">
                                Reason: {formatFallbackReason(task.fallback_reason)}
                              </p>

                              <div className="mt-3">
                                <TaskFixPanel
                                  title={task.title}
                                  fallbackReason={task.fallback_reason}
                                  ownerName={task.owner_name}
                                  onAssignOwner={() => autoAssignOwner(task)}
                                  onCreateRule={() =>
                                    filterToTask(
                                      task,
                                      `Routing rule gap detected for "${task.title}". Review this task and use its pattern to create or tighten your routing rules.`
                                    )
                                  }
                                  onFixContact={() =>
                                    filterToTask(
                                      task,
                                      `Review "${task.title}" for missing contact data. The task has been filtered into view so you can inspect and correct it.`
                                    )
                                  }
                                  onReviewOverride={() =>
                                    filterToTask(
                                      task,
                                      `This task was manually overridden. Review "${task.title}" to confirm the override is still appropriate.`
                                    )
                                  }
                                  createRuleHref={`/dashboard/routing?fromTask=1&taskId=${task.id}`}
                                  fixContactHref={
                                    task.contact_id
                                      ? `/dashboard/contacts/${task.contact_id}`
                                      : undefined
                                  }
                                />
                              </div>
                            </>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{task.task_type || "—"}</span>
                            {fallbackTask ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Special Route
                              </span>
                            ) : null}
                          </div>
                          {fallbackTask ? (
                            <span className="text-xs text-slate-500">
                              {formatFallbackReason(task.fallback_reason)}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            task.priority === "urgent"
                              ? "border border-rose-200 bg-rose-100 text-rose-700"
                              : task.priority === "high"
                              ? "border border-amber-200 bg-amber-100 text-amber-700"
                              : "border border-slate-200 bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <select
                          value={task.status}
                          onChange={(e) => saveStatus(task.id, e.target.value as Task["status"])}
                          disabled={savingStatusId === task.id}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="open">open</option>
                          <option value="in_progress">in_progress</option>
                          <option value="done">done</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">
                            {formatDateTime(task.due_date)}
                          </p>
                          <p className="mt-1">
                            {overdue ? (
                              <span className="text-rose-600">Overdue</span>
                            ) : dueToday ? (
                              <span className="text-amber-600">Due today</span>
                            ) : (
                              <span className="text-slate-500">Scheduled</span>
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <input
                          ref={(element) => {
                            ownerInputRefs.current[task.id] = element;
                          }}
                          value={currentOwnerValue}
                          onChange={(e) =>
                            setEditingOwner((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          placeholder="Assign owner..."
                          className="w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => saveOwner(task.id)}
                            disabled={savingOwnerId === task.id}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingOwnerId === task.id ? "Saving..." : "Save"}
                          </button>

                          {fallbackTask && task.fallback_reason === "no_owner" ? (
                            <span className="text-xs text-slate-500">
                              {autoAssigningTaskId === task.id
                                ? "Auto-assigning..."
                                : "Auto assign uses list owner, then contact owner, then current lane."}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}