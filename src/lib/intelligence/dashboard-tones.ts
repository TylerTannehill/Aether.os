export type DashboardSignalState = "positive" | "pressure" | "neutral";

export type DashboardDepartmentId = "digital" | "field" | "print" | "finance";

export function getDashboardStateTone(state: DashboardSignalState) {
  switch (state) {
    case "positive":
      return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70";
    case "pressure":
      return "border-rose-200 bg-rose-50 hover:bg-rose-100/70";
    case "neutral":
    default:
      return "border-slate-200 bg-white hover:bg-slate-50";
  }
}

export function getDashboardStateTextTone(state: DashboardSignalState) {
  switch (state) {
    case "positive":
      return "text-emerald-800";
    case "pressure":
      return "text-rose-800";
    case "neutral":
    default:
      return "text-slate-700";
  }
}

export function getDepartmentHealthState(input: {
  pressure: number;
  opportunity: number;
}): DashboardSignalState {
  if (input.pressure > input.opportunity * 1.1) return "pressure";
  if (input.opportunity >= input.pressure * 1.15) return "positive";
  return "neutral";
}