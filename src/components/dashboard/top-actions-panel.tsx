"use client";

type TopActionItem = {
  id: string;
  title: string;
  status?: string | null;
  brain_score?: number | null;
  brain_tier?: "critical" | "high" | "medium" | "low" | null;
  brain_reasons?: string[];
  brain_auto_execute?: boolean;
};

type TopActionsPanelProps = {
  actions: TopActionItem[];
  previewingActionId?: string | null;
  executingActionId?: string | null;
  onPreview?: (action: TopActionItem) => void;
  onExecute?: (action: TopActionItem) => void;
};

function formatTierLabel(
  tier?: "critical" | "high" | "medium" | "low" | null
): string {
  if (!tier) return "Unranked";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function getTierClasses(
  tier?: "critical" | "high" | "medium" | "low" | null
): string {
  switch (tier) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatScore(score?: number | null): string {
  if (typeof score !== "number" || Number.isNaN(score)) return "—";
  return score.toFixed(3);
}

export default function TopActionsPanel({
  actions,
  previewingActionId = null,
  executingActionId = null,
  onPreview,
  onExecute,
}: TopActionsPanelProps) {
  const topActions = (actions ?? []).slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">Top Actions</div>
          <p className="mt-1 text-sm text-slate-600">
            The brain’s highest-priority moves right now.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {topActions.length} showing
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {topActions.length ? (
          topActions.map((action, index) => (
            <div
              key={action.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700">
                      {index + 1}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTierClasses(
                        action.brain_tier
                      )}`}
                    >
                      {formatTierLabel(action.brain_tier)}
                    </span>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      Score: {formatScore(action.brain_score)}
                    </span>

                    {action.brain_auto_execute ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Auto-ready
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {action.title}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Status: {action.status || "open"}
                    </div>
                  </div>
                </div>
                                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview?.(action)}
                    disabled={!onPreview || previewingActionId === action.id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {previewingActionId === action.id ? "Previewing..." : "Preview"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onExecute?.(action)}
                    disabled={!onExecute || executingActionId === action.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {executingActionId === action.id ? "Executing..." : "Execute"}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(action.brain_reasons ?? []).length ? (
                  (action.brain_reasons ?? []).slice(0, 3).map((reason, reasonIndex) => (
                    <div
                      key={`${action.id}-reason-${reasonIndex}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      {reason}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    No brain reasons available yet.
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No top actions available right now.
          </div>
        )}
      </div>
    </section>
  );
}