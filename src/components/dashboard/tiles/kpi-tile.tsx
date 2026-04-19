type KpiTileProps = {
  label: string;
  value: string | number;
  helperText?: string;
  tone?: "default" | "success" | "danger" | "warning";
};
function getValueClasses(tone: KpiTileProps["tone"]) {
  switch (tone) {
    case "success":
      return "text-emerald-600";
    case "danger":
      return "text-rose-600";
    case "warning":
      return "text-amber-600";
    default:
      return "text-slate-900";
  }
}
export function KpiTile({
  label,
  value,
  helperText,
  tone = "default",
}: KpiTileProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>

      <p
        className={`text-4xl font-semibold tracking-tight ${getValueClasses(tone)}`}
      >
        {value}
      </p>
            {helperText ? (
        <p className="text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}