export function ProgressBar({ value, tone = "blue" }) {
  const color = tone === "red" ? "bg-red-500" : tone === "green" ? "bg-emerald-500" : "bg-corporate-blue";

  return (
    <div className="h-2.5 rounded-full bg-slate-200">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
