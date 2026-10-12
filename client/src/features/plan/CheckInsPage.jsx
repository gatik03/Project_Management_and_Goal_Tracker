import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { api } from "../../lib/api";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  StatusGlyph,
  Textarea,
  useToast,
} from "../../ui";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
function ProgressMeter({ progress, planned, actual }) {
  const raw = Number(progress?.achievementToTargetPercent ?? 0),
    capped = Number(progress?.cappedProgressPercent ?? 0);
  return (
    <div>
      <div className="measure-track">
        <div
          className="measure-fill"
          style={{ width: `${Math.min(raw, 100)}%` }}
        />
        <span className="measure-tick" title="Planned target" />
      </div>
      <p className="small muted space-before-xs">
        Plan {planned}, Actual {actual}, {raw}% achieved ({capped}% of the
        progress track)
      </p>
      {raw > 100 && (
        <p className="small positive-text">
          Above plan by {raw - 100}%
        </p>
      )}
    </div>
  );
}
function CheckInEditor({ goal, quarter, checkIn, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
      plannedTarget: checkIn.plannedTarget,
      actualAchievement: checkIn.actualAchievement,
      status: checkIn.status,
      employeeNote: checkIn.employeeNote ?? "",
    }),
    [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setDirty(true);
  }
  async function save(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.saveCheckIn(goal.id, quarter, {
        ...form,
        plannedTarget: Number(form.plannedTarget),
        actualAchievement: Number(form.actualAchievement),
      });
      setDirty(false);
      await onSaved();
      toast(`${quarter} check-in saved`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="checkin-editor">
      <div className="page-header compact-header">
        <div>
          <h3>{goal.title}</h3>
          <StatusGlyph status={checkIn.status} />
        </div>
        <span className="small muted">{goal.thrustArea}</span>
      </div>
      <ProgressMeter
        progress={checkIn.progress}
        planned={checkIn.plannedTarget}
        actual={checkIn.actualAchievement}
      />
      <div className="form-grid space-before-lg">
        <Field label="Planned target">
          <Input
            type="number"
            min="0"
            step="any"
            value={form.plannedTarget}
            onChange={(event) => update("plannedTarget", event.target.value)}
          />
        </Field>
        <Field label="Actual achievement">
          <Input
            type="number"
            min="0"
            step="any"
            value={form.actualAchievement}
            onChange={(event) =>
              update("actualAchievement", event.target.value)
            }
          />
        </Field>
        <Field label="Progress state">
          <Select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="NOT_STARTED">Not started</option>
            <option value="ON_TRACK">On track</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </Field>
        <Field className="full" label="Your note">
          <Textarea
            value={form.employeeNote}
            onChange={(event) => update("employeeNote", event.target.value)}
          />
        </Field>
      </div>
      {checkIn.managerComment && (
        <p className="manager-comment">
          <strong>Manager comment</strong>
          <br />
          {checkIn.managerComment}
        </p>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="button-row space-before-md">
        <Button variant="primary" type="submit" disabled={!dirty || saving}>
          {saving ? "Saving…" : `Save ${quarter} check-in`}
        </Button>
        {dirty && (
          <span className="small muted" aria-live="polite">
            Unsaved changes
          </span>
        )}
      </div>
    </form>
  );
}
export default function CheckInsPage() {
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { data: cycle } = useQuery({ queryKey: ["active-cycle"], queryFn: api.activeCycle, retry: false });
  const currentQuarter = cycle?.quarter ?? quarters[(new Date().getMonth() / 3) | 0];
  const quarter = quarters.includes(params.get("quarter"))
    ? params.get("quarter")
    : currentQuarter;
  const {
    data: goals = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["employee-checkins"],
    queryFn: api.employeeCheckIns,
  });
  if (isPending) return <Skeleton lines={6} />;
  return (
    <div className="page-grid">
      <div className="workspace">
        <div className="page-header">
          <div>
            <h1>Quarterly check-ins</h1>
            <p className="page-intro">
              Record what you planned and achieved for each goal. Your manager’s
              comments stay with the quarter.
            </p>
          </div>
        </div>
        <div className="quarter-strip" role="group" aria-label="Choose quarter">
          {quarters.map((item) => (
            <button
              type="button"
              key={item}
              className="quarter-item"
              aria-pressed={quarter === item}
              onClick={() => setParams({ quarter: item })}
            >
              {item}{item === currentQuarter && <span className="quarter-current">Current</span>}
            </button>
          ))}
        </div>
        {error ? (
          <div className="panel panel-pad">
            <p className="error-text">{error.message}</p>
            <Button
              onClick={() =>
                cache.invalidateQueries({ queryKey: ["employee-checkins"] })
              }
            >
              Retry
            </Button>
          </div>
        ) : goals.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="Check-ins start after submission"
              description="Submit a plan that totals 100% to begin tracking quarterly progress."
              action={
                <Link className="btn btn-primary" to="/plan">
                  Open your plan
                </Link>
              }
            />
          </div>
        ) : (
          <div className="checkin-list">
            {goals.map((goal) => {
              const checkIn = goal.checkIns.find(
                (item) => item.quarter === quarter,
              );
              return (
                <details
                  key={`${goal.id}-${quarter}`}
                  className="panel checkin-record"
                >
                  <summary>
                    <span>
                      <strong>{goal.title}</strong>
                      <span className="record-meta">
                        Target {goal.target}, {goal.weightage}% of plan
                      </span>
                    </span>
                    <StatusGlyph status={checkIn?.status} />
                  </summary>
                  {checkIn && (
                    <CheckInEditor
                      key={`${goal.id}-${quarter}`}
                      goal={goal}
                      quarter={quarter}
                      checkIn={checkIn}
                      onSaved={() =>
                        cache.invalidateQueries({
                          queryKey: ["employee-checkins"],
                        })
                      }
                    />
                  )}
                </details>
              );
            })}
          </div>
        )}
      </div>
      <aside className="context-rail">
        <section className="panel panel-pad rule-panel">
          <h2>Year at a glance</h2>
          <p className="muted">Q1 → Q2 → Q3 → Q4</p>
          <p>
            The active cycle is {currentQuarter}. Select any
            quarter to review or update its result.
          </p>
        </section>
        <section className="panel panel-pad">
          <h2>How progress reads</h2>
          <p className="muted">
            The marker represents the planned target. The fill shows actual
            achievement. Results above 100% remain visible in the percentage
            below the track.
          </p>
        </section>
      </aside>
    </div>
  );
}
