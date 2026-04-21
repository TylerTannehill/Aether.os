// src/lib/abe/abe-follow-through.ts

import { AbeDepartment } from "./abe-memory";

type FollowThroughInput = {
  department: AbeDepartment;
  tasks: any[];
};

export type FollowThroughSignals = {
  completionRate: number;
  ignoredTasks: number;
  attemptedTasks: number; // NEW
  completedTasks: number;
  totalTasks: number;
  needsAttention: boolean;
  dominantBehavior: "ignored" | "attempted" | "completed"; // NEW
};

function normalizeStatus(status?: string | null) {
  const value = (status || "").toLowerCase();

  if (value.includes("complete") || value.includes("done")) return "completed";
  if (value.includes("progress")) return "in_progress";
  return "open";
}

export function getFollowThroughSignals(
  input: FollowThroughInput
): FollowThroughSignals {
  const relevantTasks = input.tasks.filter((task) => {
    const dept = String(task.department || "").toLowerCase();
    return dept === input.department;
  });

  const total = relevantTasks.length;

  const completed = relevantTasks.filter(
    (task) => normalizeStatus(task.status) === "completed"
  ).length;

  // NEW: attempted (in progress)
  const attempted = relevantTasks.filter(
    (task) => normalizeStatus(task.status) === "in_progress"
  ).length;

  const ignored = relevantTasks.filter((task) => {
    const status = normalizeStatus(task.status);
    const updated = new Date(task.updated_at || task.created_at || Date.now());
    const ageHours = (Date.now() - updated.getTime()) / (1000 * 60 * 60);

    // IMPORTANT CHANGE:
    // only OPEN tasks that are stale count as ignored
    return status === "open" && ageHours > 24;
  }).length;

  const completionRate = total > 0 ? completed / total : 1;

  // NEW: dominant behavior detection
  let dominantBehavior: FollowThroughSignals["dominantBehavior"] = "completed";

  if (ignored >= attempted && ignored >= completed) {
    dominantBehavior = "ignored";
  } else if (attempted >= completed) {
    dominantBehavior = "attempted";
  }

  return {
    completionRate,
    ignoredTasks: ignored,
    attemptedTasks: attempted,
    completedTasks: completed,
    totalTasks: total,
    needsAttention: completionRate < 0.5 || ignored > 3,
    dominantBehavior,
  };
}