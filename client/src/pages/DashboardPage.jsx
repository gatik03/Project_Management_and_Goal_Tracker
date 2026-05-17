import { ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";

const roleCopy = {
  EMPLOYEE: {
    eyebrow: "Employee Portal",
    title: "Your secure employee workspace is active",
    description: "Authentication and employee role access are configured. Goal creation remains intentionally out of scope for this phase."
  },
  MANAGER: {
    eyebrow: "Manager Portal",
    title: "Manager access is verified",
    description: "The session has manager-level permissions ready for future team review workflows. Goal review features start in a later phase."
  },
  ADMIN: {
    eyebrow: "Admin Portal",
    title: "Admin access is verified",
    description: "The session has admin-level permissions for future user and policy administration. Goal modules are not implemented yet."
  }
};

export function DashboardPage({ portalLabel, user }) {
  const copy = roleCopy[user.role] ?? roleCopy.EMPLOYEE;
  const rows = [
    { area: "JWT session", owner: user.name, status: "Active", progress: 100 },
    { area: "Role permissions", owner: portalLabel, status: "Active", progress: 100 },
    { area: "Goal modules", owner: "Future Phase", status: "Draft", progress: 0 }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">{copy.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-corporate-navy">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {copy.description}
            </p>
          </div>
          <StatusBadge status="Active" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Authenticated user" value="1" helper={`${user.department} · ${user.title}`} icon={Goal} />
        <MetricCard label="Role permissions" value={String(user.permissions?.length ?? 0)} helper={`${user.role} access profile loaded`} icon={UsersRound} />
        <MetricCard label="Goal modules" value="0" helper="Goal implementation starts in a future phase" icon={ClipboardCheck} />
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
