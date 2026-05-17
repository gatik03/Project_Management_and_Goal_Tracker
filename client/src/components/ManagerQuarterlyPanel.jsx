import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

export function ManagerQuarterlyPanel() {
  const [goals, setGoals] = useState([]);
  const [comments, setComments] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCheckIns() {
    const { data } = await apiClient.get("/manager/check-ins");
    setGoals(data.goals);
  }

  useEffect(() => {
    loadCheckIns()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function saveComment(checkInId) {
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post(`/manager/check-ins/${checkInId}/comment`, {
        managerComment: comments[checkInId]
      });
      setGoals((current) => current.map((goal) => ({
        ...goal,
        checkIns: goal.checkIns.map((checkIn) => (checkIn.id === checkInId ? data.checkIn : checkIn))
      })));
      setMessage("Manager comment saved.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="rounded-lg border border-corporate-line bg-white shadow-soft">
      <div className="border-b border-corporate-line p-5">
        <h3 className="text-base font-semibold text-corporate-navy">Quarterly review timeline</h3>
        <p className="mt-1 text-sm text-slate-500">Review employee quarterly achievements and add manager comments.</p>
      </div>

      {message ? <p className="mx-5 mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mx-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

      {isLoading ? (
        <p className="p-5 text-sm text-slate-500">Loading quarterly updates...</p>
      ) : goals.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-corporate-navy">No quarterly updates yet</p>
          <p className="mt-2 text-sm text-slate-500">Submitted team goals appear here when employees start check-ins.</p>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-lg border border-corporate-line p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-corporate-navy">{goal.employee.name} · {goal.title}</p>
                  <p className="mt-1 text-xs text-slate-500">Timeline completion: {goal.timeline.completionPercent}%</p>
                </div>
                <div className="w-full md:w-56">
                  <ProgressBar value={goal.timeline.completionPercent} tone={goal.timeline.isComplete ? "green" : "blue"} />
                </div>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-4">
                {goal.checkIns.map((checkIn) => (
                  <div key={checkIn.quarter} className="rounded-lg border border-corporate-line p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-corporate-navy">{checkIn.quarter}</p>
                      <StatusBadge status={checkIn.status} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>Planned: <span className="font-semibold text-corporate-navy">{checkIn.plannedTarget}</span></p>
                      <p>Actual: <span className="font-semibold text-corporate-navy">{checkIn.actualAchievement}</span></p>
                      <p>Achievement / Target: <span className="font-semibold text-corporate-navy">{checkIn.progress.achievementToTargetPercent}%</span></p>
                      <p>Target / Achievement: <span className="font-semibold text-corporate-navy">{checkIn.progress.targetToAchievementRatio}</span></p>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={checkIn.progress.cappedProgressPercent} tone={checkIn.status === "COMPLETED" ? "green" : "blue"} />
                    </div>
                    {checkIn.employeeNote ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{checkIn.employeeNote}</p> : null}
                    <textarea className="mt-3 min-h-20 w-full rounded-lg border border-corporate-line px-3 py-2 text-sm" disabled={!checkIn.id} onChange={(event) => setComments((current) => ({ ...current, [checkIn.id]: event.target.value }))} placeholder={checkIn.managerComment ?? "Manager comment"} value={comments[checkIn.id] ?? ""} />
                    <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-corporate-line px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" disabled={!checkIn.id} onClick={() => saveComment(checkIn.id)} type="button">
                      <MessageSquare size={15} />
                      Comment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
