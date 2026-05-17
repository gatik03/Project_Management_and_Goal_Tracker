import { Download, Filter } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiClient } from "../lib/api";
import { MetricCard } from "./MetricCard";

const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export function ReportingDashboard({ scopeLabel }) {
  const [dashboard, setDashboard] = useState(null);
  const [filters, setFilters] = useState({ department: "", status: "", quarter: "" });
  const [error, setError] = useState("");
  const query = useMemo(() => buildQuery(filters), [filters]);

  const loadDashboard = useCallback(async function loadDashboard() {
    const { data } = await apiClient.get(`/reports/dashboard${query ? `?${query}` : ""}`);
    setDashboard(data.dashboard);
  }, [query]);

  useEffect(() => {
    loadDashboard().catch((requestError) => setError(requestError.message));
  }, [loadDashboard]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function downloadReport(type) {
    const baseURL = apiClient.defaults.baseURL;
    window.open(`${baseURL}/reports/export.${type}${query ? `?${query}` : ""}`, "_blank", "noopener,noreferrer");
  }

  if (!dashboard) {
    return (
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <p className="text-sm text-slate-500">{error || "Loading reporting dashboard..."}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">{scopeLabel}</p>
            <h2 className="mt-1 text-xl font-semibold text-corporate-navy">Reporting & analytics</h2>
            <p className="mt-2 text-sm text-slate-600">Achievement reports, completion trends, goal distribution, and exportable progress data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-corporate-line px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => downloadReport("csv")} type="button">
              <Download size={16} />
              CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-corporate-line px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => downloadReport("xls")} type="button">
              <Download size={16} />
              Excel
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-corporate-line px-3 py-2">
            <Filter size={16} className="text-slate-400" />
            <select className="w-full bg-white text-sm outline-none" onChange={(event) => updateFilter("department", event.target.value)} value={filters.department}>
              <option value="">All departments</option>
              {dashboard.filters.departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <select className="rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none" onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}>
            <option value="">All goal statuses</option>
            {dashboard.filters.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none" onChange={(event) => updateFilter("quarter", event.target.value)} value={filters.quarter}>
            <option value="">All quarters</option>
            {dashboard.filters.quarters.map((quarter) => <option key={quarter} value={quarter}>{quarter}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total goals" value={String(dashboard.summary.totalGoals)} helper="Filtered goal population" icon={Filter} />
        <MetricCard label="Check-ins" value={String(dashboard.summary.totalCheckIns)} helper="Quarterly updates recorded" icon={Filter} />
        <MetricCard label="Avg achievement" value={`${dashboard.summary.averageAchievement}%`} helper="Average achievement vs target" icon={Filter} />
        <MetricCard label="Completed updates" value={String(dashboard.summary.completedCheckIns)} helper="Completed quarterly check-ins" icon={Filter} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Goal distribution">
          <PieChart>
            <Pie data={dashboard.goalDistribution} dataKey="count" nameKey="status" outerRadius={100} label>
              {dashboard.goalDistribution.map((entry, index) => <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
        <ChartCard title="Team completion">
          <BarChart data={dashboard.completionByEmployee}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="employee" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completionPercent" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Quarterly trend">
          <LineChart data={dashboard.trendByQuarter}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="averageProgress" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Check-in status mix">
          <BarChart data={dashboard.checkInStatusDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="border-b border-corporate-line p-5">
          <h3 className="text-base font-semibold text-corporate-navy">Achievement report</h3>
          <p className="mt-1 text-sm text-slate-500">Export-ready reporting rows.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Goal</th>
                <th className="px-5 py-3 font-semibold">Quarter</th>
                <th className="px-5 py-3 font-semibold">Planned</th>
                <th className="px-5 py-3 font-semibold">Actual</th>
                <th className="px-5 py-3 font-semibold">Achievement</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-line">
              {dashboard.achievementRows.map((row) => (
                <tr key={row.checkInId}>
                  <td className="px-5 py-4 text-slate-700">{row.employee}</td>
                  <td className="px-5 py-4 font-medium text-corporate-navy">{row.goalTitle}</td>
                  <td className="px-5 py-4 text-slate-600">{row.quarter}</td>
                  <td className="px-5 py-4 text-slate-600">{row.plannedTarget}</td>
                  <td className="px-5 py-4 text-slate-600">{row.actualAchievement}</td>
                  <td className="px-5 py-4 font-semibold text-corporate-navy">{row.achievementPercent}%</td>
                  <td className="px-5 py-4 text-slate-600">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
      <h3 className="text-base font-semibold text-corporate-navy">{title}</h3>
      <div className="mt-5 h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
