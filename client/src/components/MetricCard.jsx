export function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-corporate-navy">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2.5 text-corporate-blue">
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
