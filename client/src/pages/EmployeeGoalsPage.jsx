import { CalendarDays, Edit3, Plus, Save, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { EmployeeQuarterlyPanel } from "../components/EmployeeQuarterlyPanel";
import { StatusBadge } from "../components/StatusBadge";
import { apiClient } from "../lib/api";

const emptyForm = {
  title: "",
  description: "",
  thrustArea: "",
  uomType: "NUMBER",
  target: "",
  weightage: 10,
  deadline: ""
};

const uomOptions = [
  { label: "Number", value: "NUMBER" },
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Currency", value: "CURRENCY" },
  { label: "Boolean", value: "BOOLEAN" },
  { label: "Text", value: "TEXT" }
];

const employeeEditableStatuses = ["DRAFT", "REWORK_REQUIRED"];

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal ?? emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const todayDateValue = getTodayDateValue();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (Number(form.weightage) < 10) {
      setError("Minimum weightage is 10%.");
      return;
    }

    if (form.deadline < todayDateValue) {
      setError("Deadline cannot be before today's date.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        weightage: Number(form.weightage)
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/35 px-4 py-6">
      <form className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-soft" onSubmit={handleSubmit}>
        <div className="border-b border-corporate-line px-6 py-5">
          <p className="text-sm font-semibold text-corporate-blue">{goal ? "Edit draft goal" : "Create draft goal"}</p>
          <h2 className="mt-1 text-xl font-semibold text-corporate-navy">Goal details</h2>
        </div>

        <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Goal title</span>
            <input
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField("title", event.target.value)}
              required
              value={form.title}
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField("description", event.target.value)}
              required
              value={form.description}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-700">Thrust area</span>
            <input
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField("thrustArea", event.target.value)}
              required
              value={form.thrustArea}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-700">UoM type</span>
            <select
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField("uomType", event.target.value)}
              value={form.uomType}
            >
              {uomOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium text-slate-700">Target</span>
            <input
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField("target", event.target.value)}
              required
              value={form.target}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-700">Weightage</span>
            <input
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              min="10"
              max="100"
              onChange={(event) => updateField("weightage", event.target.value)}
              required
              type="number"
              value={form.weightage}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-700">Deadline</span>
            <input
              className="mt-2 w-full rounded-lg border border-corporate-line px-3 py-2.5 text-sm outline-none transition focus:border-corporate-blue focus:ring-2 focus:ring-blue-100"
              min={todayDateValue}
              onChange={(event) => updateField("deadline", event.target.value)}
              required
              type="date"
              value={form.deadline}
            />
          </label>
        </div>

        {error ? <p className="mx-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex justify-end gap-3 border-t border-corporate-line px-6 py-4">
          <button className="rounded-lg border border-corporate-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-corporate-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300" disabled={isSaving} type="submit">
            <Save size={16} />
            {isSaving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EmployeeGoalsPage({ user }) {
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalWeightage = useMemo(() => goals.reduce((sum, goal) => sum + goal.weightage, 0), [goals]);
  const editableGoals = goals.filter((goal) => employeeEditableStatuses.includes(goal.status));
  const canCreate = goals.length < 8 && goals.every((goal) => employeeEditableStatuses.includes(goal.status));
  const canSubmit = editableGoals.length > 0 && totalWeightage === 100;

  async function loadGoals() {
    const { data } = await apiClient.get("/employee/goals");
    setGoals(data.goals);
  }

  useEffect(() => {
    loadGoals()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  function openCreateModal() {
    setActiveGoal(null);
    setIsModalOpen(true);
  }

  function openEditModal(goal) {
    setActiveGoal(goal);
    setIsModalOpen(true);
  }

  async function saveGoal(payload) {
    if (activeGoal) {
      const { data } = await apiClient.put(`/employee/goals/${activeGoal.id}`, payload);
      setGoals((current) => current.map((goal) => (goal.id === data.goal.id ? data.goal : goal)));
    } else {
      const { data } = await apiClient.post("/employee/goals", payload);
      setGoals((current) => [...current, data.goal]);
    }

    setMessage("Draft goal saved.");
    setIsModalOpen(false);
  }

  async function deleteGoal(goalId) {
    setError("");
    setMessage("");
    await apiClient.delete(`/employee/goals/${goalId}`);
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    setMessage("Draft goal deleted.");
  }

  async function submitGoals() {
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post("/employee/goals/submit");
      setGoals(data.goals);
      setMessage("Goal plan submitted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Employee Portal</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-corporate-navy">Create your goal plan</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Save goals as drafts while planning. You can edit or delete draft goals until the plan is submitted.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-corporate-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={!canCreate}
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={16} />
              New goal
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-corporate-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={!canSubmit}
              onClick={submitGoals}
              type="button"
            >
              Submit plan
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Goals created" value={`${goals.length}/8`} helper="Maximum 8 goals per employee" icon={Target} />
        <MetricCard label="Total weightage" value={`${totalWeightage}%`} helper="Must equal 100% before submission" icon={ClipboardIcon} />
        <MetricCard label="Editable goals" value={String(editableGoals.length)} helper={`${user.department} · ${user.title}`} icon={CalendarDays} />
      </section>

      <section className="rounded-lg border border-corporate-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-corporate-navy">Weightage progress</h3>
            <p className="mt-1 text-sm text-slate-500">Each goal must be at least 10%. Submit is enabled at exactly 100%.</p>
          </div>
          <StatusBadge status={totalWeightage === 100 ? "Active" : "Draft"} />
        </div>
        <div className="mt-5 h-3 rounded-full bg-slate-200">
          <div className={`h-3 rounded-full ${totalWeightage > 100 ? "bg-red-500" : "bg-corporate-blue"}`} style={{ width: `${Math.min(totalWeightage, 100)}%` }} />
        </div>
        {totalWeightage > 100 ? <p className="mt-3 text-sm text-red-700">Total weightage cannot exceed 100%.</p> : null}
        {totalWeightage < 100 ? <p className="mt-3 text-sm text-amber-700">Add {100 - totalWeightage}% more weightage before submission.</p> : null}
      </section>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
        <div className="border-b border-corporate-line p-5">
          <h3 className="text-base font-semibold text-corporate-navy">Goal drafts</h3>
          <p className="mt-1 text-sm text-slate-500">Review, edit, or delete draft goals from this workspace.</p>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Loading goals...</p>
        ) : goals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-corporate-navy">No goals created yet</p>
            <p className="mt-2 text-sm text-slate-500">Create your first draft goal to begin the plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Goal</th>
                  <th className="px-5 py-3 font-semibold">Thrust area</th>
                  <th className="px-5 py-3 font-semibold">UoM</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Weight</th>
                  <th className="px-5 py-3 font-semibold">Deadline</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-corporate-line">
                {goals.map((goal) => (
                  <tr key={goal.id} className="transition hover:bg-slate-50">
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-corporate-navy">{goal.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{goal.description}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{goal.thrustArea}</td>
                    <td className="px-5 py-4 text-slate-600">{goal.uomType}</td>
                    <td className="px-5 py-4 text-slate-600">{goal.target}</td>
                    <td className="px-5 py-4 font-semibold text-corporate-navy">{goal.weightage}%</td>
                    <td className="px-5 py-4 text-slate-600">{goal.deadline}</td>
                    <td className="px-5 py-4"><StatusBadge status={goal.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          aria-label="Edit goal"
                          className="rounded-lg border border-corporate-line p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-corporate-blue disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={!employeeEditableStatuses.includes(goal.status)}
                          onClick={() => openEditModal(goal)}
                          type="button"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          aria-label="Delete goal"
                          className="rounded-lg border border-corporate-line p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
                          disabled={!employeeEditableStatuses.includes(goal.status)}
                          onClick={() => deleteGoal(goal.id)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EmployeeQuarterlyPanel />

      {isModalOpen ? <GoalModal goal={activeGoal} onClose={() => setIsModalOpen(false)} onSave={saveGoal} /> : null}
    </div>
  );
}

function ClipboardIcon(props) {
  return <Save {...props} />;
}
