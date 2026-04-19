type AlertTileProps = {
  label: string;
  value: string | number;
  helperText?: string;
  tone?: "warning" | "danger" | "neutral";
};
function getAlertStyles(tone: AlertTileProps["tone"]) {
  switch (tone) {
    case "danger":
      return {
        value: "text-rose-600",
        badge: "border border-rose-200 bg-rose-100 text-rose-700",
      };
    case "warning":
      return {
        value: "text-amber-600",
        badge: "border border-amber-200 bg-amber-100 text-amber-700",
      };
    default:
      return {
        value: "text-slate-900",
        badge: "border border-slate-200 bg-slate-100 text-slate-700",
      };
  }
}
export function AlertTile({
  label,
  value,
  helperText,
  tone = "warning",
}: AlertTileProps) {
  const styles = getAlertStyles(tone);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {helperText ? (
            <p className="mt-1 text-sm text-slate-500">{helperText}</p>
          ) : null}
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
        >
          Alert
        </span>
      </div>

      <p className={`text-4xl font-semibold tracking-tight ${styles.value}`}>
        {value}
      </p>
    </div>
  );
}
