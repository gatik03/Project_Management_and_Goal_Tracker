import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Skeleton,
  StatusGlyph,
  useToast,
} from "../../ui";
import { Dialog } from "../../ui/Overlay";
import { PlanBar } from "../../ui/PlanBar";

const editableStates = new Set(["SUBMITTED", "REWORK_REQUIRED"]);

function WeightEditor({ person }) {
  const cache = useQueryClient();
  const toast = useToast();
  const goals = person.goals;
  const [values, setValues] = useState(() => Object.fromEntries(
    goals.map((goal) => [goal.id, String(goal.weightage)])
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editable = goals.filter((goal) => editableStates.has(goal.status));
  const visibleTotal = goals.reduce((sum, goal) => sum + goal.weightage, 0);
  const ready = visibleTotal === 100 && editable.length >= 2;
  const total = goals.reduce((sum, goal) => sum + Number(values[goal.id]), 0);
  const changes = goals.filter((goal) => Number(values[goal.id]) !== goal.weightage);
  const valid = goals.every((goal) => {
    const next = Number(values[goal.id]);
    return values[goal.id] !== "" && Number.isInteger(next) && next >= 10 && next <= 100 &&
      (next - goal.weightage) % 5 === 0;
  });
  const canSave = ready && changes.length >= 2 && valid && total === 100 && !busy;
  const displayGoals = goals.map((goal) => ({
    ...goal,
    weightage: valid ? Number(values[goal.id]) : goal.weightage
  }));

  function fromBar(nextGoals) {
    setValues(Object.fromEntries(nextGoals.map((goal) => [goal.id, String(goal.weightage)])));
    setError("");
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError("");
    try {
      await api.rebalanceManagerPlan(person.employee.id, changes.map((goal) => ({
        goalId: goal.id,
        weightage: Number(values[goal.id]),
        expectedUpdatedAt: goal.updatedAt
      })));
      await cache.invalidateQueries({ queryKey: ["manager-goals"] });
      toast("Goal weights saved. The employee was notified.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel panel-pad" aria-label={`Weights for ${person.employee.name}`}>
      <div className="page-header compact-header">
        <div>
          <h2>{person.employee.name}&apos;s plan</h2>
          <p className="muted small">
            {person.employee.title}, {person.employee.department}. {ready
              ? "Move a boundary or edit two weights, then save the 100% plan."
              : "Only submitted or returned goals appear here. Rebalancing opens when the visible plan totals 100%."}
          </p>
        </div>
        <span className="display-num">{total}%</span>
      </div>
      <PlanBar
        goals={displayGoals}
        ghost={changes.length ? goals : undefined}
        label={`Rebalance ${person.employee.name}'s plan`}
        onChange={ready ? fromBar : undefined}
        canMove={(left, right) => editableStates.has(left.status) && editableStates.has(right.status)}
      />
      <div className="weight-fields">
        {goals.map((goal) => (
          <Field key={goal.id} label={`${goal.title} weight`}>
            <span className="weight-input-wrap">
              <Input
                type="number" inputMode="numeric"
                min={goal.weightage - Math.floor((goal.weightage - 10) / 5) * 5}
                max={goal.weightage + Math.floor((100 - goal.weightage) / 5) * 5}
                step="5"
                name={`weight-${goal.id}`} autoComplete="off"
                value={values[goal.id]}
                disabled={!ready || !editableStates.has(goal.status) || busy}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [goal.id]: event.target.value }));
                  setError("");
                }}
              />
              <span aria-hidden="true">%</span>
            </span>
          </Field>
        ))}
      </div>
      <p className="help-text">
        {!ready
          ? "Ask the employee to submit a complete plan before changing weights. At least two editable goals are needed; approved goals stay locked."
          : total !== 100
            ? `Adjust ${Math.abs(100 - total)}% ${total < 100 ? "more" : "less"} before saving.`
            : changes.length === 1
              ? "Change a second goal to keep the total at 100%."
              : "Changes move in 5% steps. Approved and locked goals cannot change."}
      </p>
      {!valid && <p className="field-error" role="alert">Use whole numbers from 10% to 100%, changing each weight in 5% steps.</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="button-row space-before-sm">
        <Button variant="primary" disabled={!canSave} onClick={save}>Save weights</Button>
        {changes.length > 0 && (
          <Button disabled={busy} onClick={() => {
            setValues(Object.fromEntries(goals.map((goal) => [goal.id, String(goal.weightage)])));
            setError("");
          }}>Reset</Button>
        )}
        {error && <Button disabled={busy} onClick={() => cache.invalidateQueries({ queryKey: ["manager-goals"] })}>Refresh plan</Button>}
      </div>
    </section>
  );
}

function ReviewGoal({ goal, onUpdated }) {
  const toast = useToast();
  const [target, setTarget] = useState(goal.target),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [rework, setRework] = useState(false),
    [note, setNote] = useState("");
  const [approve, setApprove] = useState(false);
  const canReview = goal.status === "SUBMITTED";
  async function action(kind) {
    setBusy(true);
    setError("");
    try {
      let saved;
      if (kind === "target")
        saved = await api.managerUpdate(goal.id, { target });
      if (kind === "approve") saved = await api.approveGoal(goal.id);
      if (kind === "rework") saved = await api.rejectGoal(goal.id, note);
      await onUpdated(saved);
      toast(
        kind === "target"
          ? "Target saved"
          : kind === "approve"
            ? "Goal approved"
            : "Goal sent back for rework",
      );
      setApprove(false);
      setRework(false);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="review-goal">
      <div className="page-header compact-header">
        <div>
          <h3 className="record-title">{goal.title}</h3>
          <p className="muted small">
            {goal.thrustArea}, {goal.weightage}% of plan
          </p>
        </div>
        <StatusGlyph status={goal.status} />
      </div>
      <p className="muted">{goal.description}</p>
      {goal.managerNote && (
        <p className="manager-comment">
          <strong>Previous note</strong>
          <br />
          {goal.managerNote}
        </p>
      )}
      {["SUBMITTED", "REWORK_REQUIRED"].includes(goal.status) && (
        <div className="review-edit">
          <Field label={`Target for ${goal.title}`}>
            <Input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              autoComplete="off"
            />
          </Field>
          <Button
            disabled={busy || target === goal.target || !target.trim()}
            onClick={() => action("target")}
          >
            Save target
          </Button>
        </div>
      )}
      <div className="button-row space-before-sm">
        {canReview && (
          <>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => setApprove(true)}
            >
              Approve goal
            </Button>
            <Button disabled={busy} onClick={() => setRework(true)}>
              Send back
            </Button>
          </>
        )}
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <Dialog
        open={approve}
        onOpenChange={setApprove}
        title="Approve this goal?"
        description="Approval makes this goal read-only for the employee."
        actions={
          <>
            <Button onClick={() => setApprove(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => action("approve")}
            >
              Approve goal
            </Button>
          </>
        }
      />
      <Dialog
        open={rework}
        onOpenChange={setRework}
        title="Send this goal back?"
        description="Tell the employee what to change before they submit it again."
        actions={
          <>
            <Button onClick={() => setRework(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy || note.trim().length < 5}
              onClick={() => action("rework")}
            >
              Send back
            </Button>
          </>
        }
      >
        <Field label="Reason for rework" hint="At least 5 characters">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </Dialog>
    </article>
  );
}
export default function TeamPage() {
  const cache = useQueryClient(),
    navigate = useNavigate(),
    { employeeId } = useParams();
  const {
    data: goals = [],
    isPending,
    error,
  } = useQuery({ queryKey: ["manager-goals"], queryFn: api.managerGoals });
  const people = useMemo(() => {
    const map = new Map();
    for (const goal of goals) {
      const employee = goal.employee;
      const record = map.get(employee.id) ?? { employee, goals: [] };
      record.goals.push(goal);
      map.set(employee.id, record);
    }
    return [...map.values()].sort((a, b) => {
      const pending = (person) =>
        person.goals.filter((goal) => goal.status === "SUBMITTED").length;
      return (
        pending(b) - pending(a) ||
        a.employee.name.localeCompare(b.employee.name)
      );
    });
  }, [goals]);
  const selected =
    people.find((person) => person.employee.id === employeeId) ?? people[0];
  useEffect(() => {
    if (!employeeId && selected)
      navigate(`/team/${selected.employee.id}`, { replace: true });
  }, [employeeId, selected, navigate]);
  useEffect(() => {
    function key(event) {
      if (
        !["j", "k"].includes(event.key) ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) ||
        document.querySelector("[role=dialog]")
      )
        return;
      const index = people.findIndex(
        (person) => person.employee.id === selected?.employee.id,
      );
      const next = people[index + (event.key === "j" ? 1 : -1)];
      if (next) navigate(`/team/${next.employee.id}`);
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [people, selected, navigate]);
  if (isPending) return <Skeleton lines={6} />;
  if (error)
    return (
      <div className="panel panel-pad">
        <h1>Could not load your team</h1>
        <p className="error-text">{error.message}</p>
        <Button
          onClick={() =>
            cache.invalidateQueries({ queryKey: ["manager-goals"] })
          }
        >
          Retry
        </Button>
      </div>
    );
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Team review</h1>
          <p className="page-intro">
            Choose a direct report, compare their goals, then approve or send
            back each submitted goal.
          </p>
        </div>
      </div>
      {!people.length ? (
        <div className="panel">
          <EmptyState
            title="No plans to review yet"
            description="A direct report’s goals appear here after they submit a plan."
          />
        </div>
      ) : (
        <div className="team-layout">
          <aside className="panel team-list" aria-label="Direct reports">
            <div className="panel-pad">
              <h2>Direct reports</h2>
              <p className="small muted">
                {people.length} people, j and k move between them
              </p>
            </div>
            <div className="team-links">
              {people.map((person) => {
                const count = person.goals.filter(
                    (goal) => goal.status === "SUBMITTED",
                  ).length,
                  weight = person.goals.reduce(
                    (sum, goal) => sum + goal.weightage,
                    0,
                  );
                return (
                  <Link
                    key={person.employee.id}
                    to={`/team/${person.employee.id}`}
                    className="team-link"
                    aria-current={
                      selected?.employee.id === person.employee.id
                        ? "page"
                        : undefined
                    }
                  >
                    <span>
                      <strong>{person.employee.name}</strong>
                      <small>
                        {person.employee.department}, {weight}% shown
                      </small>
                    </span>
                    <span className="team-pending">{count} pending</span>
                  </Link>
                );
              })}
            </div>
          </aside>
          <div className="workspace">
            <WeightEditor
              key={`${selected.employee.id}:${selected.goals.map((goal) => goal.updatedAt).join(":")}`}
              person={selected}
            />
            <section className="space-before-section">
              <h2 className="section-title">Goals to review</h2>
              <div className="panel review-goals">
                {selected.goals.map((goal) => (
                  <ReviewGoal
                    key={goal.id}
                    goal={goal}
                    onUpdated={() =>
                      cache.invalidateQueries({ queryKey: ["manager-goals"] })
                    }
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
