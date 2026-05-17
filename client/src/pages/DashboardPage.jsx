import { ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const rows = [
    { area: "Frontend shell", owner: "Product Engineering", status: "Active", progress: 100 },
    { area: "Manager approvals", owner: "People Team", status: "Pending", progress: 0 },
    { area: "Policy configuration", owner: "Admin", status: "Draft", progress: 0 }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Phase 1 Foundation</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-corporate-navy">Portal workspace is ready</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Authentication, role-aware layout, API connectivity, and database setup are in place. Goal workflow features begin in the next phase.
            </p>
          </div>
          <StatusBadge status="Active" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Assigned goals" value="0" helper="Goal creation begins in Phase 2" icon={Goal} />
        <MetricCard label="Pending reviews" value="0" helper="Manager workflow is not enabled yet" icon={UsersRound} />
        <MetricCard label="Open check-ins" value="0" helper="Quarterly check-ins arrive later" icon={ClipboardCheck} />
      </section>

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-corporate-line p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-corporate-navy">Implementation Readiness</h3>
            <p className="mt-1 text-sm text-slate-500">Current platform capabilities available in this phase.</p>
          </div>
          <input
            aria-label="Filter readiness table"
            className="rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
            placeholder="Filter"
            type="search"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Area</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-line">
              {rows.map((row) => (
                <tr key={row.area} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-corporate-navy">{row.area}</td>
                  <td className="px-5 py-4 text-slate-600">{row.owner}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-36 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-corporate-blue" style={{ width: `${row.progress}%` }} />
                      </div>
                      <span className="text-slate-500">{row.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
