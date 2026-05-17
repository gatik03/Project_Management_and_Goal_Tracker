import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

const statusOptions = [
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "On Track", value: "ON_TRACK" },
  { label: "Completed", value: "COMPLETED" }
];

function editKey(goalId, quarter) {
  return `${goalId}:${quarter}`;
}

export function EmployeeQuarterlyPanel() {
  const [goals, setGoals] = useState([]);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function setInitialEdits(goalList) {
    const nextEdits = {};
    goalList.forEach((goal) => {
      goal.checkIns.forEach((checkIn) => {
        nextEdits[editKey(goal.id, checkIn.quarter)] = {
          plannedTarget: checkIn.plannedTarget,
          actualAchievement: checkIn.actualAchievement,
          status: checkIn.status,
          employeeNote: checkIn.employeeNote ?? ""
        };
      });
    });
    setEdits(nextEdits);
  }

  const loadCheckIns = useCallback(async function loadCheckIns() {
    const { data } = await apiClient.get("/employee/check-ins");
    setGoals(data.goals);
    setInitialEdits(data.goals);
  }, []);

  useEffect(() => {
    loadCheckIns()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [loadCheckIns]);

  function updateEdit(goalId, quarter, field, value) {
    const key = editKey(goalId, quarter);
    setEdits((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value
      }
    }));
  }

  async function saveCheckIn(goalId, quarter) {
    setError("");
    setMessage("");

    try {
      const key = editKey(goalId, quarter);
      const payload = edits[key];
      const { data } = await apiClient.put(`/employee/check-ins/${goalId}/${quarter}`, {
        ...payload,
        plannedTarget: Number(payload.plannedTarget),
        actualAchievement: Number(payload.actualAchievement)
      });

      setGoals((current) => current.map((goal) => {
        if (goal.id !== goalId) return goal;
        const checkIns = goal.checkIns.map((checkIn) => (checkIn.quarter === quarter ? data.checkIn : checkIn));
        const completedCount = checkIns.filter((checkIn) => checkIn.status === "COMPLETED").length;
        return {
          ...goal,
          checkIns,
          timeline: {
            completedQuarters: completedCount,
            totalQuarters: 4,
            completionPercent: Math.round((completedCount / 4) * 100),
            isComplete: completedCount === 4
          }
        };
      }));
      setMessage("Quarterly update saved.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
      <div className="border-b border-corporate-line p-5">
        <h3 className="text-base font-semibold text-corporate-navy">Quarterly check-ins</h3>
        <p className="mt-1 text-sm text-slate-500">Update planned target, actual achievement, and quarterly progress for submitted goals.</p>
      </div>

      {message ? <p className="mx-5 mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mx-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      {isLoading ? (
        <p className="p-5 text-sm text-slate-500">Loading quarterly check-ins...</p>
      ) : goals.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-corporate-navy">No submitted goals available</p>
          <p className="mt-2 text-sm text-slate-500">Submit a 100% goal plan before quarterly check-ins begin.</p>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-lg border border-corporate-line">
              <div className="border-b border-corporate-line p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-corporate-navy">{goal.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Timeline completion: {goal.timeline.completionPercent}%</p>
                  </div>
                  <div className="w-full md:w-56">
                    <ProgressBar value={goal.timeline.completionPercent} tone={goal.timeline.isComplete ? "green" : "blue"} />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-4 xl:grid-cols-4">
                {goal.checkIns.map((checkIn) => {
                  const key = editKey(goal.id, checkIn.quarter);
                  const edit = edits[key] ?? checkIn;
                  return (
                    <div key={checkIn.quarter} className="rounded-lg border border-corporate-line p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-corporate-navy">{checkIn.quarter}</p>
                        <StatusBadge status={edit.status} />
                      </div>
                      <div className="mt-4 space-y-3">
                        <input className="w-full rounded-lg border border-corporate-line px-3 py-2 text-sm" min="0" onChange={(event) => updateEdit(goal.id, checkIn.quarter, "plannedTarget", event.target.value)} placeholder="Planned target" type="number" value={edit.plannedTarget} />
                        <input className="w-full rounded-lg border border-corporate-line px-3 py-2 text-sm" min="0" onChange={(event) => updateEdit(goal.id, checkIn.quarter, "actualAchievement", event.target.value)} placeholder="Actual achievement" type="number" value={edit.actualAchievement} />
                        <select className="w-full rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => updateEdit(goal.id, checkIn.quarter, "status", event.target.value)} value={edit.status}>
                          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <textarea className="min-h-20 w-full rounded-lg border border-corporate-line px-3 py-2 text-sm" onChange={(event) => updateEdit(goal.id, checkIn.quarter, "employeeNote", event.target.value)} placeholder="Achievement note" value={edit.employeeNote ?? ""} />
                      </div>
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium text-slate-500">Progress: {checkIn.progress.achievementToTargetPercent}%</p>
                        <ProgressBar value={checkIn.progress.cappedProgressPercent} tone={checkIn.status === "COMPLETED" ? "green" : "blue"} />
                      </div>
                      {checkIn.managerComment ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-700">{checkIn.managerComment}</p> : null}
                      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-corporate-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" onClick={() => saveCheckIn(goal.id, checkIn.quarter)} type="button">
                        <Save size={15} />
                        Save
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
