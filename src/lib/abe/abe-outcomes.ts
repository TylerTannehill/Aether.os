// src/lib/abe/abe-outcomes.ts

import { AbeDepartment } from "./abe-memory";

type OutcomeInput = {
  department: AbeDepartment;
  previous?: {
    completionRate: number;
    totalTasks: number;
  } | null;
  current: {
    completionRate: number;
    totalTasks: number;
  };
};

export type OutcomeSignals = {
  trend: "improving" | "flat" | "declining";
  delta: number;
  meaningful: boolean;
};

function getTrend(delta: number): OutcomeSignals["trend"] {
  if (delta > 0.1) return "improving";
  if (delta < -0.1) return "declining";
  return "flat";
}

export function getOutcomeSignals(input: OutcomeInput): OutcomeSignals {
  if (!input.previous) {
    return {
      trend: "flat",
      delta: 0,
      meaningful: false,
    };
  }

  const delta =
    input.current.completionRate - input.previous.completionRate;

  const trend = getTrend(delta);

  const meaningful =
    Math.abs(delta) > 0.08 || input.current.totalTasks > 5;

  return {
    trend,
    delta,
    meaningful,
  };
}