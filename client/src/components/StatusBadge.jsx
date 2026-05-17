const styles = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function StatusBadge({ status }) {
  const key = status.toLowerCase();

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[key] ?? styles.draft}`}>
      {status}
    </span>
  );
}
