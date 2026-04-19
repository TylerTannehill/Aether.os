"use client";

type TaskRouteBadgeProps = {
  taskType?: string | null;
  fallbackReason?: string | null;
  onFix?: () => void;
};

function formatReason(reason?: string | null) {
  if (!reason) return "Unknown";

  return reason
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFixLabel(reason?: string | null) {
  switch (reason) {
    case "no_owner":
      return "Assign Owner";
    case "no_rule_match":
      return "Create Rule";
    case "missing_contact_data":
      return "Fix Contact";
    case "manual_override":
      return "Review";
    default:
      return "Investigate";
  }
}

export function TaskRouteBadge({
  taskType,
  fallbackReason,
  onFix,
}: TaskRouteBadgeProps) {
  if (taskType !== "fallback") return null;

  const label = getFixLabel(fallbackReason);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        Fallback Routed
      </span>

      {fallbackReason ? (
        <span className="text-[11px] font-medium text-amber-700">
          {formatReason(fallbackReason)}
        </span>
      ) : null}

      {onFix ? (
        <button
          onClick={onFix}
          className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition"
        >
          {label}
        </button>
      ) : null}
    </div>
  );
}