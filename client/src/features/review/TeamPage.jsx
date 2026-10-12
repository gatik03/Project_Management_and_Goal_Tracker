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
  const total =
    selected?.goals.reduce((sum, goal) => sum + goal.weightage, 0) ?? 0;
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
                        {person.employee.department}, {weight}% weighted
                      </small>
                    </span>
                    <span className="team-pending">{count} pending</span>
                  </Link>
                );
              })}
            </div>
          </aside>
          <div className="workspace">
            <section className="panel panel-pad">
              <div className="page-header">
                <div>
                  <h2>{selected.employee.name}</h2>
                  <p className="muted">
                    {selected.employee.title}, {selected.employee.department}
                  </p>
                </div>
                <span className="display-num">{total}%</span>
              </div>
              <PlanBar goals={selected.goals} ghost={selected.goals} />
              <p className="help-text space-before-sm">
                Weights are part of the employee’s 100% plan. To change the
                balance, send a goal back with a note so they can rebalance and
                resubmit it.
              </p>
            </section>
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
