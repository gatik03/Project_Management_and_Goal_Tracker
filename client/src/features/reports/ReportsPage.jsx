import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, apiClient } from "../../lib/api";
import {
  Button,
  DataTable,
  EmptyState,
  Field,
  Select,
  Skeleton,
  useToast,
} from "../../ui";

const statusNames = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REWORK_REQUIRED: "Rework needed",
  LOCKED: "Locked",
};
const palette = [
  "var(--control)",
  "var(--muted)",
  "var(--signal)",
  "var(--danger)",
  "var(--ink)",
];
function AchievementMeter({ percent }) {
  const value = Math.max(0, Number(percent) || 0);
  return <div className="achievement-wrap"><div className="achievement-meter" role="img" aria-label={`Planned 100 percent, actual ${value} percent`}><span className="achievement-fill" style={{ width: `${Math.min(value,150)}%` }} /><span className="achievement-tick" /></div><strong>{value}%</strong></div>;
}
function ChartFrame({
  title,
  description,
  children,
  rows,
  headers,
  renderRow,
}) {
  const [table, setTable] = useState(false);
  return (
    <section className="panel panel-pad chart-frame">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p className="small muted">{description}</p>
        </div>
        <Button
          onClick={() => setTable((value) => !value)}
          aria-pressed={table}
        >
          {table ? "Show chart" : "Show data table"}
        </Button>
      </div>
      {table ? (
        <DataTable headers={headers} rows={rows} renderRow={renderRow} />
      ) : (
        <div
          className="chart-area"
          role="img"
          aria-label={`${title}. ${description}`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
function ReportTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="report-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <p key={item.dataKey}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}
function useReportFilters() {
  const [params, setParams] = useSearchParams();
  const filters = {
    department: params.get("department") ?? "",
    status: params.get("status") ?? "",
    quarter: params.get("quarter") ?? "",
  };
  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  }
  return [filters, update];
}
export default function ReportsPage() {
  const toast = useToast();
  const [filters, update] = useReportFilters();
  const [exporting, setExporting] = useState("");
  const query = useQuery({
    queryKey: ["reports", filters],
    queryFn: () => api.report(filters),
  });
  async function download(kind) {
    setExporting(kind);
    try {
      const response = await apiClient.get(`/reports/export.${kind}`, {
        params: filters,
        responseType: "blob",
      });
      const fallback = `goal-tracker-report.${kind === "xls" ? "xlsx" : "csv"}`;
      const header = response.headers["content-disposition"] ?? "";
      const filename = header.match(/filename="?([^";]+)"?/)?.[1] ?? fallback;
      const href = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      toast(`Downloaded ${filename}`);
    } catch (error) {
      toast(error.message);
    } finally {
      setExporting("");
    }
  }
  if (query.isPending) return <Skeleton lines={7} />;
  if (query.error)
    return (
      <div className="panel panel-pad">
        <h1>Reports are unavailable</h1>
        <p className="error-text">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Retry</Button>
      </div>
    );
  const data = query.data;
  const distribution = [
    Object.fromEntries(
      data.goalDistribution.map((row) => [row.status, row.count]),
    ),
  ];
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-intro">
            Compare goal states and quarterly outcomes. Filters stay in the link
            when you share this view.
          </p>
        </div>
        <div className="button-row">
          <Button onClick={() => download("csv")} disabled={Boolean(exporting)}>
            <Download size={16} aria-hidden="true" />
            {exporting === "csv" ? "Preparing CSV…" : "Export CSV"}
          </Button>
          <Button onClick={() => download("xls")} disabled={Boolean(exporting)}>
            <Download size={16} aria-hidden="true" />
            {exporting === "xls" ? "Preparing Excel…" : "Export Excel"}
          </Button>
        </div>
      </div>
      <div className="panel panel-pad report-toolbar">
        <div className="filter-row">
          <Field label="Department">
            <Select
              value={filters.department}
              onChange={(event) => update("department", event.target.value)}
            >
              <option value="">All departments</option>
              {data.filters.departments.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Goal status">
            <Select
              value={filters.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="">All statuses</option>
              {data.filters.statuses.map((item) => (
                <option value={item} key={item}>
                  {statusNames[item] ?? item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quarter">
            <Select
              value={filters.quarter}
              onChange={(event) => update("quarter", event.target.value)}
            >
              <option value="">All quarters</option>
              {data.filters.quarters.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="button-row" role="group" aria-label="Active filters">
          {Object.entries(filters)
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <Button
                key={key}
                onClick={() => update(key, "")}
                aria-label={`Remove ${key} filter ${value}`}
              >
                {key}: {statusNames[value] ?? value} ×
              </Button>
            ))}
        </div>
      </div>
      <p className="report-summary">
        <strong>{data.summary.totalGoals}</strong> goals,{" "}
        <strong>{data.summary.totalCheckIns}</strong> check-ins,{" "}
        <strong>{data.summary.averageAchievement}%</strong> average achievement.{" "}
        {data.summary.completedCheckIns} updates are complete.
      </p>
      <div className="report-grid">
        <ChartFrame
          title="Goal state"
          description="One plan-wide distribution, with each status directly identified."
          rows={data.goalDistribution}
          headers={["Status", "Goals"]}
          renderRow={(row) => (
            <tr key={row.status}>
              <td>{statusNames[row.status]}</td>
              <td>{row.count}</td>
            </tr>
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distribution}
              layout="vertical"
              margin={{ top: 20, right: 12, bottom: 10, left: 12 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey={() => "Goals"}
                width={42}
                tick={{ fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ReportTooltip />} />
              {data.goalDistribution.map((row, index) => (
                <Bar
                  key={row.status}
                  dataKey={row.status}
                  name={statusNames[row.status]}
                  stackId="goals"
                  fill={palette[index]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-labels">
            {data.goalDistribution.map((row, index) => (
              <span key={row.status}>
                <i style={{ background: palette[index] }} />
                {statusNames[row.status]} {row.count}
              </span>
            ))}
          </div>
        </ChartFrame>
        <ChartFrame
          title="Quarterly achievement"
          description="Average achievement by quarter; 100% marks the planned result."
          rows={data.trendByQuarter}
          headers={["Quarter", "Average achievement", "Completed updates"]}
          renderRow={(row) => (
            <tr key={row.quarter}>
              <td>{row.quarter}</td>
              <td>{row.averageProgress}%</td>
              <td>{row.completed}</td>
            </tr>
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.trendByQuarter}
              margin={{ top: 20, right: 22, bottom: 10, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="quarter" tick={{ fill: "var(--muted)" }} />
              <YAxis tick={{ fill: "var(--muted)" }} width={36} />
              <Tooltip content={<ReportTooltip />} />
              <Line
                type="monotone"
                dataKey="averageProgress"
                name="Average achievement"
                stroke="var(--signal)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--signal)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame
          title="Team completion"
          description="Share of check-ins marked complete for each person."
          rows={data.completionByEmployee}
          headers={["Employee", "Completed", "Total", "Completion"]}
          renderRow={(row) => (
            <tr key={row.employeeId}>
              <td>{row.employee}</td>
              <td>{row.completedCheckIns}</td>
              <td>{row.totalCheckIns}</td>
              <td>{row.completionPercent}%</td>
            </tr>
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.completionByEmployee.slice(0, 8)}
              layout="vertical"
              margin={{ top: 10, right: 25, bottom: 5, left: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "var(--muted)" }}
              />
              <YAxis
                type="category"
                dataKey="employee"
                width={95}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip content={<ReportTooltip />} />
              <Bar
                dataKey="completionPercent"
                name="Complete"
                fill="var(--signal)"
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
      <section className="panel panel-pad space-before-lg">
        <h2>Achievement detail</h2>
        <p className="muted">
          Planned and actual values remain available as a table.
        </p>
        {data.achievementRows.length ? (
          <>
            <div className="desktop-table">
              <DataTable
                headers={[
                  "Employee",
                  "Goal",
                  "Quarter",
                  "Planned",
                  "Actual",
                  "Achievement",
                ]}
                rows={data.achievementRows}
                renderRow={(row) => (
                  <tr key={row.checkInId}>
                    <td>{row.employee}</td>
                    <td>{row.goalTitle}</td>
                    <td>{row.quarter}</td>
                    <td>{row.plannedTarget}</td>
                    <td>{row.actualAchievement}</td>
                    <td><AchievementMeter percent={row.achievementPercent}/></td>
                  </tr>
                )}
              />
            </div>
            <div className="mobile-records">
              {data.achievementRows.map((row) => (
                <article className="record" key={row.checkInId}>
                  <div>
                    <h3 className="record-title">{row.goalTitle}</h3>
                    <p className="muted">
                      {row.employee}, {row.quarter}
                    </p>
                    <p>
                      Plan {row.plannedTarget}, Actual {row.actualAchievement},{" "}
                      {row.achievementPercent}% achieved
                    </p>
                    <AchievementMeter percent={row.achievementPercent}/>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No results for these filters"
            description="Remove a filter or choose another quarter to see results."
          />
        )}
      </section>
    </>
  );
}
