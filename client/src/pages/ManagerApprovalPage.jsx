import { CheckCircle2, RefreshCw, Save, UsersRound, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { ManagerQuarterlyPanel } from "../components/ManagerQuarterlyPanel";
import { StatusBadge } from "../components/StatusBadge";
import { apiClient } from "../lib/api";

const managerEditableStatuses = ["SUBMITTED", "REWORK_REQUIRED"];

export function ManagerApprovalPage({ user }) {
  const [goals, setGoals] = useState([]);
  const [draftEdits, setDraftEdits] = useState({});
  const [rejectNotes, setRejectNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submittedCount = goals.filter((goal) => goal.status === "SUBMITTED").length;
  const approvedCount = goals.filter((goal) => goal.status === "APPROVED" || goal.status === "LOCKED").length;
  const reworkCount = goals.filter((goal) => goal.status === "REWORK_REQUIRED").length;
  const employeeCount = useMemo(() => new Set(goals.map((goal) => goal.employee.id)).size, [goals]);
  const employeeWeightTotals = useMemo(() => {
    return goals.reduce((totals, goal) => {
      const weightage = Number(draftEdits[goal.id]?.weightage ?? goal.weightage);
      return {
        ...totals,
        [goal.employee.id]: (totals[goal.employee.id] ?? 0) + weightage
      };
    }, {});
  }, [draftEdits, goals]);

  async function loadGoals() {
    const { data } = await apiClient.get("/manager/goals");
    setGoals(data.goals);
    setDraftEdits(
      data.goals.reduce((edits, goal) => ({
        ...edits,
        [goal.id]: {
          target: goal.target,
          weightage: goal.weightage
        }
      }), {})
    );
  }

  useEffect(() => {
    loadGoals()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  function updateDraft(goalId, field, value) {
    setDraftEdits((current) => ({
      ...current,
      [goalId]: {
        ...current[goalId],
        [field]: value
      }
    }));
  }

  function updateGoal(goal) {
    setGoals((current) => current.map((item) => (item.id === goal.id ? goal : item)));
    setDraftEdits((current) => ({
      ...current,
      [goal.id]: {
        target: goal.target,
        weightage: goal.weightage
      }
    }));
  }

  async function saveInlineEdit(goalId) {
    setError("");
    setMessage("");

    try {
      const goal = goals.find((item) => item.id === goalId);
      const proposedTotal = employeeWeightTotals[goal.employee.id] ?? 0;

      if (proposedTotal > 100) {
        setError(`Total weightage for ${goal.employee.name} cannot exceed 100%. Current edited total is ${proposedTotal}%.`);
        return;
      }

      const edit = draftEdits[goalId];
      const { data } = await apiClient.patch(`/manager/goals/${goalId}`, {
        target: edit.target,
        weightage: Number(edit.weightage)
      });
      updateGoal(data.goal);
      setMessage("Goal target and weightage updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function approveGoal(goalId) {
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post(`/manager/goals/${goalId}/approve`);
      updateGoal(data.goal);
      setMessage("Goal approved and locked for employee edits.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function rejectGoal(goalId) {
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post(`/manager/goals/${goalId}/reject`, {
        managerNote: rejectNotes[goalId] ?? "Please revise this goal."
      });
      updateGoal(data.goal);
      setMessage("Goal sent back for rework.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Manager Portal</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-corporate-navy">Team goal approvals</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review submitted employee goals, adjust target or weightage when needed, approve goals, or return them for rework.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-corporate-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={loadGoals}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Team members" value={String(employeeCount)} helper={`${user.department} team`} icon={UsersRound} />
        <MetricCard label="Submitted" value={String(submittedCount)} helper="Awaiting manager action" icon={Save} />
        <MetricCard label="Rework" value={String(reworkCount)} helper="Returned to employees" icon={XCircle} />
        <MetricCard label="Approved" value={String(approvedCount)} helper="Locked for employee edits" icon={CheckCircle2} />
      </section>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="border-b border-corporate-line p-5">
          <h3 className="text-base font-semibold text-corporate-navy">Team management table</h3>
          <p className="mt-1 text-sm text-slate-500">Inline edits are available only before approval locks the goal.</p>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Loading team goals...</p>
        ) : goals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-corporate-navy">No submitted team goals</p>
            <p className="mt-2 text-sm text-slate-500">Employee draft goals appear here after submission.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Goal</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Weight</th>
                  <th className="px-5 py-3 font-semibold">Deadline</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Rework note</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-corporate-line">
                {goals.map((goal) => {
                  const isEditable = managerEditableStatuses.includes(goal.status);
                  return (
                    <tr key={goal.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-corporate-navy">{goal.employee.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{goal.employee.title}</p>
                        <p className={`mt-2 text-xs font-semibold ${employeeWeightTotals[goal.employee.id] > 100 ? "text-red-700" : "text-slate-500"}`}>
                          Total: {employeeWeightTotals[goal.employee.id] ?? 0}%
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-corporate-navy">{goal.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{goal.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="w-40 rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                          disabled={!isEditable}
                          onChange={(event) => updateDraft(goal.id, "target", event.target.value)}
                          value={draftEdits[goal.id]?.target ?? goal.target}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className={`w-24 rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
                            employeeWeightTotals[goal.employee.id] > 100
                              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                              : "border-corporate-line focus:border-corporate-blue focus:ring-blue-100"
                          }`}
                          disabled={!isEditable}
                          max="100"
                          min="10"
                          onChange={(event) => updateDraft(goal.id, "weightage", event.target.value)}
                          type="number"
                          value={draftEdits[goal.id]?.weightage ?? goal.weightage}
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-600">{goal.deadline}</td>
                      <td className="px-5 py-4"><StatusBadge status={goal.status} /></td>
                      <td className="px-5 py-4">
                        <input
                          className="w-52 rounded-lg border border-corporate-line px-3 py-2 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                          disabled={!["SUBMITTED", "APPROVED"].includes(goal.status)}
                          onChange={(event) => setRejectNotes((current) => ({ ...current, [goal.id]: event.target.value }))}
                          placeholder={goal.managerNote ?? "Reason for rework"}
                          value={rejectNotes[goal.id] ?? ""}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            aria-label="Save inline edits"
                            className="rounded-lg border border-corporate-line p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-corporate-blue disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!isEditable || employeeWeightTotals[goal.employee.id] > 100}
                            onClick={() => saveInlineEdit(goal.id)}
                            type="button"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            aria-label="Approve goal"
                            className="rounded-lg border border-corporate-line p-2 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!isEditable}
                            onClick={() => approveGoal(goal.id)}
                            type="button"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            aria-label="Reject goal"
                            className="rounded-lg border border-corporate-line p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!["SUBMITTED", "APPROVED"].includes(goal.status)}
                            onClick={() => rejectGoal(goal.id)}
                            type="button"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ManagerQuarterlyPanel />
    </div>
  );
}
