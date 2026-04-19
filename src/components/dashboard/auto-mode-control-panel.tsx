"use client";

type AutoModeControlPanelProps = {
  enabled: boolean;
  intervalMs: number;
  onIntervalChange: (value: number) => void;
  onToggleEnabled: () => void;
  eligibleCount: number;
  blockedCount: number;
  reviewCount: number;
  policyBlockedCount: number;
  lastTickAt?: string | null;
  failureCount: number;
  maxFailures: number;
  statusMessage?: string;
};

function formatLastTick(value?: string | null): string {
  if (!value) return "No ticks yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatIntervalLabel(intervalMs: number): string {
  const seconds = Math.floor(intervalMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export default function AutoModeControlPanel({
  enabled,
  intervalMs,
  onIntervalChange,
  onToggleEnabled,
  eligibleCount,
  blockedCount,
  reviewCount,
  policyBlockedCount,
  lastTickAt,
  failureCount,
  maxFailures,
  statusMessage,
}: AutoModeControlPanelProps) {
  const intervalOptions = [15000, 30000, 60000, 180000, 300000];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Auto Mode Control
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Loop guardrails, timing, and live status for autonomous runs.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleEnabled}
          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
            enabled
              ? "border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
          }`}
        >
          {enabled ? "Stop Auto Loop" : "Start Auto Loop"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Eligible
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {eligibleCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Run-now items</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Review
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {reviewCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Needs review</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Brain Blocked
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {blockedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Cannot run</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Policy Blocked
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {policyBlockedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Stopped by rules</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Failures
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {failureCount}/{maxFailures}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Auto-stop threshold
          </div>
        </div>
      </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">
              Loop Interval
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Current: {formatIntervalLabel(intervalMs)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {intervalOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onIntervalChange(option)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  intervalMs === option
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {formatIntervalLabel(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Last Tick
          </div>
          <div className="mt-2 text-sm font-medium text-slate-800">
            {formatLastTick(lastTickAt)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Loop Status
          </div>
          <div className="mt-2 text-sm font-medium text-slate-800">
            {statusMessage || "Idle"}
          </div>
        </div>
      </div>
    </section>
  );
}