const styles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  locked: "bg-slate-100 text-slate-700 ring-slate-300",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  "rework required": "bg-red-50 text-red-700 ring-red-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function StatusBadge({ status }) {
  const label = status.replaceAll("_", " ");
  const key = label.toLowerCase();

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[key] ?? styles.draft}`}>
      {label}
    </span>
  );
}
