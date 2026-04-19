"use client";

import Link from "next/link";

type TaskFixPanelProps = {
  title: string;
  fallbackReason?: string | null;
  ownerName?: string | null;

  onAssignOwner?: () => Promise<void> | void;
  onCreateRule?: () => void;
  onFixContact?: () => void;
  onReviewOverride?: () => void;

  createRuleHref?: string;
  fixContactHref?: string;
  reviewOverrideHref?: string;
};

function formatReason(reason?: string | null) {
  if (!reason) return "Unknown";

  return reason
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ActionButton({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100";

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

export function TaskFixPanel({
  title,
  fallbackReason,
  ownerName,

  onAssignOwner,
  onCreateRule,
  onFixContact,
  onReviewOverride,

  createRuleHref,
  fixContactHref,
  reviewOverrideHref,
}: TaskFixPanelProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-800">
            {formatReason(fallbackReason)}
          </span>
        </div>

        <div className="text-sm text-amber-900">
          Fix required for: <span className="font-semibold">{title}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {fallbackReason === "no_owner" && (
            <ActionButton
              label="⚡ Auto Assign Owner"
              onClick={onAssignOwner}
            />
          )}

          {fallbackReason === "no_rule_match" && (
            <ActionButton
              label="Create Rule"
              href={createRuleHref}
              onClick={onCreateRule}
            />
          )}

          {fallbackReason === "missing_contact_data" && (
            <ActionButton
              label="Fix Contact"
              href={fixContactHref}
              onClick={onFixContact}
            />
          )}

          {fallbackReason === "manual_override" && (
            <ActionButton
              label="Review Override"
              href={reviewOverrideHref}
              onClick={onReviewOverride}
            />
          )}
        </div>
      </div>
    </div>
  );
}