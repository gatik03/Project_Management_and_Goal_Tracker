import { LockOpen, Save, Search, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { apiClient } from "../lib/api";

const quarters = ["Q1", "Q2", "Q3", "Q4"];

export function AdminPortalPage() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [hierarchy, setHierarchy] = useState({ managers: [], unassignedEmployees: [] });
  const [unlockableGoals, setUnlockableGoals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [userFilter, setUserFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cycleForm, setCycleForm] = useState({
    year: new Date().getFullYear(),
    quarter: "Q1",
    startDate: "",
    endDate: "",
    isActive: true
  });

  const managers = useMemo(() => users.filter((user) => user.role === "MANAGER" && user.isActive), [users]);
  const filteredUsers = users.filter((user) => {
    const text = `${user.name} ${user.email} ${user.role} ${user.department}`.toLowerCase();
    return text.includes(userFilter.toLowerCase());
  });
  const filteredGoals = unlockableGoals.filter((goal) => {
    const text = `${goal.title} ${goal.employee.name} ${goal.status}`.toLowerCase();
    return text.includes(goalFilter.toLowerCase());
  });

  const loadAdminData = useCallback(async function loadAdminData() {
    const [dashboardResponse, usersResponse, hierarchyResponse, goalsResponse, auditResponse, cyclesResponse] = await Promise.all([
      apiClient.get("/admin/dashboard"),
      apiClient.get("/admin/users"),
      apiClient.get("/admin/hierarchy"),
      apiClient.get("/admin/goals/unlockable"),
      apiClient.get("/admin/audit-logs"),
      apiClient.get("/admin/cycle-configs")
    ]);

    setDashboard(dashboardResponse.data.dashboard);
    setUsers(usersResponse.data.users);
    setHierarchy(hierarchyResponse.data.hierarchy);
    setUnlockableGoals(goalsResponse.data.goals);
    setAuditLogs(auditResponse.data.auditLogs);
    setCycles(cyclesResponse.data.cycles);
  }, []);

  useEffect(() => {
    loadAdminData().catch((requestError) => setError(requestError.message));
  }, [loadAdminData]);

  async function updateUser(userId, payload) {
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.patch(`/admin/users/${userId}`, payload);
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)));
      await loadAdminData();
      setMessage("User updated and audit log captured.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function unlockGoal(goalId) {
    setError("");
    setMessage("");

    const reason = window.prompt("Reason for unlocking this goal");

    if (!reason) {
      return;
    }

    try {
      await apiClient.post(`/admin/goals/${goalId}/unlock`, { reason });
      await loadAdminData();
      setMessage("Goal unlocked and audit log captured.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveCycle(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiClient.post("/admin/cycle-configs", cycleForm);
      await loadAdminData();
      setMessage("Quarterly cycle configuration saved.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Admin Portal</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-corporate-navy">Performance operations control center</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage users, hierarchy, cycle setup, locked goals, audit logs, and completion tracking from one enterprise workspace.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-corporate-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={loadAdminData} type="button">
            <Settings size={16} />
            Refresh
          </button>
        </div>
      </section>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active users" value={String(dashboard?.users.active ?? 0)} helper={`${dashboard?.users.total ?? 0} total users`} icon={UsersRound} />
        <MetricCard label="Goals tracked" value={String(dashboard?.goals.total ?? 0)} helper={`${dashboard?.goals.approvedOrLocked ?? 0} approved or locked`} icon={ShieldCheck} />
        <MetricCard label="Check-in completion" value={`${dashboard?.checkIns.completionPercent ?? 0}%`} helper={`${dashboard?.checkIns.total ?? 0} quarterly updates`} icon={Save} />
        <MetricCard label="Cycle configs" value={String(dashboard?.cycles.total ?? 0)} helper="Quarterly windows configured" icon={Settings} />
      </section>

      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-corporate-navy">Completion tracking</h3>
            <p className="mt-1 text-sm text-slate-500">Organization-wide quarterly check-in completion.</p>
          </div>
          <span className="text-sm font-semibold text-corporate-navy">{dashboard?.checkIns.completionPercent ?? 0}%</span>
        </div>
        <div className="mt-4">
          <ProgressBar value={dashboard?.checkIns.completionPercent ?? 0} tone={(dashboard?.checkIns.completionPercent ?? 0) === 100 ? "green" : "blue"} />
        </div>
      </section>

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-corporate-line p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-corporate-navy">User management</h3>
            <p className="mt-1 text-sm text-slate-500">Update roles, reporting managers, and account status.</p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-corporate-line px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input className="w-56 text-sm outline-none" onChange={(event) => setUserFilter(event.target.value)} placeholder="Filter users" value={userFilter} />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Manager</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-line">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-corporate-navy">{user.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select className="rounded-lg border border-corporate-line px-3 py-2" onChange={(event) => updateUser(user.id, { role: event.target.value })} value={user.role}>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select className="w-52 rounded-lg border border-corporate-line px-3 py-2" disabled={user.role !== "EMPLOYEE"} onChange={(event) => updateUser(user.id, { managerId: event.target.value || null })} value={user.managerId ?? ""}>
                      <option value="">Unassigned</option>
                      {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{user.department}</td>
                  <td className="px-5 py-4">
                    <button className={`rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${user.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`} onClick={() => updateUser(user.id, { isActive: !user.isActive })} type="button">
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-corporate-line bg-white shadow-soft">
          <div className="border-b border-corporate-line p-5">
            <h3 className="text-base font-semibold text-corporate-navy">Goal unlocks</h3>
            <p className="mt-1 text-sm text-slate-500">Unlock submitted or approved goals for employee rework.</p>
            <input className="mt-4 w-full rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none" onChange={(event) => setGoalFilter(event.target.value)} placeholder="Filter goals" value={goalFilter} />
          </div>
          <div className="max-h-[460px] overflow-y-auto divide-y divide-corporate-line">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-corporate-navy">{goal.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{goal.employee.name} · {goal.weightage}%</p>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-corporate-line px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => unlockGoal(goal.id)} type="button">
                  <LockOpen size={16} />
                  Unlock
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-corporate-line bg-white shadow-soft">
          <div className="border-b border-corporate-line p-5">
            <h3 className="text-base font-semibold text-corporate-navy">Quarterly cycle configuration</h3>
            <p className="mt-1 text-sm text-slate-500">Define active review windows for each quarter.</p>
          </div>
          <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={saveCycle}>
            <input className="rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => setCycleForm((current) => ({ ...current, year: event.target.value }))} type="number" value={cycleForm.year} />
            <select className="rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => setCycleForm((current) => ({ ...current, quarter: event.target.value }))} value={cycleForm.quarter}>
              {quarters.map((quarter) => <option key={quarter} value={quarter}>{quarter}</option>)}
            </select>
            <input className="rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => setCycleForm((current) => ({ ...current, startDate: event.target.value }))} required type="date" value={cycleForm.startDate} />
            <input className="rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => setCycleForm((current) => ({ ...current, endDate: event.target.value }))} required type="date" value={cycleForm.endDate} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input checked={cycleForm.isActive} onChange={(event) => setCycleForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" />
              Active cycle
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-corporate-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
              <Save size={16} />
              Save cycle
            </button>
          </form>
          <div className="divide-y divide-corporate-line border-t border-corporate-line">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-semibold text-corporate-navy">{cycle.year} {cycle.quarter}</span>
                <span className="text-slate-500">{cycle.startDate} to {cycle.endDate}</span>
                <StatusBadge status={cycle.isActive ? "Active" : "Draft"} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="border-b border-corporate-line p-5">
          <h3 className="text-base font-semibold text-corporate-navy">Org hierarchy</h3>
          <p className="mt-1 text-sm text-slate-500">Current manager-to-employee reporting structure.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {hierarchy.managers.map((manager) => (
            <div key={manager.id} className="rounded-lg border border-corporate-line p-4">
              <p className="font-semibold text-corporate-navy">{manager.name}</p>
              <p className="mt-1 text-xs text-slate-500">{manager.department} · {manager.reports.length} reports</p>
              <div className="mt-4 space-y-2">
                {manager.reports.map((report) => (
                  <div key={report.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{report.name} · {report.title}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="border-b border-corporate-line p-5">
          <h3 className="text-base font-semibold text-corporate-navy">Audit logs</h3>
          <p className="mt-1 text-sm text-slate-500">Latest 100 admin mutations with old and new values captured.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Entity</th>
                <th className="px-5 py-3 font-semibold">Old value</th>
                <th className="px-5 py-3 font-semibold">New value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-line">
              {auditLogs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="px-5 py-4 text-slate-600">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600">{log.actorEmail}</td>
                  <td className="px-5 py-4"><StatusBadge status={log.action} /></td>
                  <td className="px-5 py-4 text-slate-600">{log.entityType}</td>
                  <td className="max-w-xs px-5 py-4 text-xs text-slate-500"><pre className="max-h-28 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.oldValue, null, 2)}</pre></td>
                  <td className="max-w-xs px-5 py-4 text-xs text-slate-500"><pre className="max-h-28 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
