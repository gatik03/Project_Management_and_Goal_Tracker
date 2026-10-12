import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import {
  Button,
  EmptyState,
  Field,
  Skeleton,
  StatusGlyph,
  useToast,
} from "../../ui";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
function Comment({ checkIn, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(checkIn.managerComment ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.commentCheckIn(checkIn.id, value);
      await onSaved();
      toast("Comment saved");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <Field label="Manager comment">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Give a specific next step…"
        />
      </Field>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <Button
        variant="primary"
        disabled={
          busy || value.trim().length < 2 || value === checkIn.managerComment
        }
        type="submit"
        className="space-before-sm"
      >
        {busy ? "Saving…" : "Save comment"}
      </Button>
    </form>
  );
}
export default function TeamCheckInsPage() {
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams();
  const quarter = quarters.includes(params.get("quarter"))
    ? params.get("quarter")
    : quarters[(new Date().getMonth() / 3) | 0];
  const {
    data: goals = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["manager-checkins"],
    queryFn: api.managerCheckIns,
  });
  if (isPending) return <Skeleton lines={6} />;
  return (
    <div className="page-grid">
      <div className="workspace">
        <div className="page-header">
          <div>
            <h1>Team check-ins</h1>
            <p className="page-intro">
              Review quarterly progress for your direct reports and leave a
              useful comment beside each update.
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
              {item}
            </button>
          ))}
        </div>
        {error ? (
          <div className="panel panel-pad">
            <p className="error-text">{error.message}</p>
            <Button
              onClick={() =>
                cache.invalidateQueries({ queryKey: ["manager-checkins"] })
              }
            >
              Retry
            </Button>
          </div>
        ) : goals.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="No quarterly updates yet"
              description="Check-ins appear after your team submits goals."
            />
          </div>
        ) : (
          <div className="checkin-list">
            {goals.map((goal) => {
              const item = goal.checkIns.find(
                (entry) => entry.quarter === quarter,
              );
              return (
                <details
                  className="panel checkin-record"
                  key={`${goal.id}-${quarter}`}
                >
                  <summary>
                    <span>
                      <strong>{goal.employee.name}</strong>
                      <span className="record-meta">
                        {goal.title}, {goal.employee.department}
                      </span>
                    </span>
                    <StatusGlyph status={item.status} />
                  </summary>
                  <div className="checkin-editor">
                    <p>
                      <strong>Planned:</strong> {item.plannedTarget} &nbsp;{" "}
                      <strong>Actual:</strong> {item.actualAchievement}
                    </p>
                    <p className="muted">
                      {item.progress.achievementToTargetPercent}% achieved;{" "}
                      {item.progress.cappedProgressPercent}% shown in the capped
                      progress track.
                    </p>
                    {item.employeeNote && (
                      <p className="manager-comment">
                        <strong>Employee note</strong>
                        <br />
                        {item.employeeNote}
                      </p>
                    )}
                    {item.id ? (
                      <Comment
                        key={item.id}
                        checkIn={item}
                        onSaved={() =>
                          cache.invalidateQueries({
                            queryKey: ["manager-checkins"],
                          })
                        }
                      />
                    ) : (
                      <p className="muted">
                        This quarter has no saved update to comment on yet.
                      </p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
      <aside className="context-rail">
        <section className="panel panel-pad rule-panel">
          <h2>Review rhythm</h2>
          <p className="muted">
            Compare planned and actual results, then write one clear next step.
            Comments appear inline for the employee.
          </p>
        </section>
      </aside>
    </div>
  );
}
