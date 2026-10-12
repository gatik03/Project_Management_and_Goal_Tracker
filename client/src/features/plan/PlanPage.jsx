import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../../lib/api";
import {
  daysUntil,
  formatDate,
  formatTarget,
  localToday,
} from "../../lib/format";
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
import { Dialog, Sheet } from "../../ui/Overlay";
import { PlanBar } from "../../ui/PlanBar";

const editable = (goal) => ["DRAFT", "REWORK_REQUIRED"].includes(goal.status);
const fields = z.object({
  title: z.string().trim().min(3, "Give this goal a specific title."),
  description: z
    .string()
    .trim()
    .min(10, "Describe the outcome in at least 10 characters."),
  thrustArea: z.string().trim().min(2, "Enter a thrust area."),
  uomType: z.enum(["NUMBER", "PERCENTAGE", "CURRENCY", "BOOLEAN", "TEXT"]),
  target: z.string().trim().min(1, "Enter a target."),
  weightage: z.coerce
    .number()
    .int()
    .min(10, "Each goal needs at least 10% weight.")
    .max(100),
  deadline: z.string().min(1, "Choose a deadline."),
});
const empty = {
  title: "",
  description: "",
  thrustArea: "",
  uomType: "NUMBER",
  target: "",
  weightage: 10,
  deadline: "",
};
function payload(goal) {
  return {
    title: goal.title,
    description: goal.description,
    thrustArea: goal.thrustArea,
    uomType: goal.uomType,
    target: goal.target,
    weightage: Number(goal.weightage),
    deadline: goal.deadline,
  };
}
function GoalSheet({ goal, onClose, onSaved }) {
  const toast = useToast();
  const [error, setRequestError] = useState("");
  const [discard, setDiscard] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    setError,
    reset,
  } = useForm({ defaultValues: goal ? payload(goal) : empty });
  useEffect(() => {
    reset(goal ? payload(goal) : empty);
  }, [goal, reset]);
  useEffect(() => {
    if (!isDirty) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  function tryClose() {
    if (isDirty) setDiscard(true);
    else onClose();
  }
  async function save(values) {
    setRequestError("");
    const parsed = fields.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        setError(issue.path[0], { message: issue.message });
      return;
    }
    if (parsed.data.deadline < localToday()) {
      setError("deadline", { message: "Choose today or a future date." });
      return;
    }
    try {
      const saved = goal
        ? await api.updateGoal(goal.id, parsed.data)
        : await api.createGoal(parsed.data);
      toast(goal ? "Goal saved" : "Goal added to plan");
      onSaved(saved);
    } catch (requestError) {
      setRequestError(requestError.message);
    }
  }
  return (
    <>
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) tryClose();
        }}
        title={goal ? "Edit goal" : "Add a goal"}
      >
        <p className="page-intro">
          State the outcome, how it is measured, and its share of the plan.
        </p>
        <form onSubmit={handleSubmit(save)}>
          <div className="form-grid">
            <Field
              className="full"
              label="Goal title"
              error={errors.title?.message}
            >
              <Input autoComplete="off" {...register("title")} />
            </Field>
            <Field
              className="full"
              label="Description"
              error={errors.description?.message}
            >
              <Textarea autoComplete="off" {...register("description")} />
            </Field>
            <Field label="Thrust area" error={errors.thrustArea?.message}>
              <Input autoComplete="off" {...register("thrustArea")} />
            </Field>
            <Field label="Unit" error={errors.uomType?.message}>
              <Select {...register("uomType")}>
                <option value="NUMBER">Number</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="CURRENCY">Currency</option>
                <option value="BOOLEAN">Yes or no</option>
                <option value="TEXT">Text</option>
              </Select>
            </Field>
            <Field label="Target" error={errors.target?.message}>
              <Input autoComplete="off" {...register("target")} />
            </Field>
            <Field
              label="Weight"
              hint="10–100% per goal"
              error={errors.weightage?.message}
            >
              <Input
                type="number"
                min="10"
                max="100"
                {...register("weightage")}
              />
            </Field>
            <Field label="Deadline" error={errors.deadline?.message}>
              <Input type="date" min={localToday()} {...register("deadline")} />
            </Field>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <Button type="button" onClick={tryClose}>
              Cancel
            </Button>
            <Button variant="primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving…" : goal ? "Save goal" : "Add goal"}
            </Button>
          </div>
        </form>
      </Sheet>
      <Dialog
        open={discard}
        onOpenChange={setDiscard}
        title="Discard changes?"
        description="The edits in this goal will be lost."
        actions={
          <>
            <Button onClick={() => setDiscard(false)}>Keep editing</Button>
            <Button
              variant="danger"
              onClick={() => {
                setDiscard(false);
                onClose();
              }}
            >
              Discard changes
            </Button>
          </>
        }
      />
    </>
  );
}
function CycleRail({ goals, total }) {
  const ready = total === 100 && goals.length > 0;
  return (
    <aside className="context-rail" aria-label="Plan context">
      <section className="panel panel-pad rule-panel">
        <h2>Plan rules</h2>
        <p>
          <CheckCircle2 size={16} aria-hidden="true" /> {goals.length} of 8
          goals
        </p>
        <p>
          <CheckCircle2 size={16} aria-hidden="true" /> At least 10% per goal
        </p>
        <p>
          {ready ? (
            <CheckCircle2 size={16} aria-hidden="true" />
          ) : (
            <Circle size={16} aria-hidden="true" />
          )}{" "}
          Exactly 100% to submit
        </p>
      </section>
      <section className="panel panel-pad">
        <h2>What happens next</h2>
        <p className="muted">
          Your manager reviews submitted goals. Approved goals become read-only;
          returned goals can be revised and submitted again.
        </p>
        <Link to="/check-ins" className="btn">
          View quarterly check-ins
        </Link>
      </section>
    </aside>
  );
}
export default function PlanPage() {
  const cache = useQueryClient(),
    toast = useToast(),
    navigate = useNavigate(),
    { goalId } = useParams();
  const {
    data: goals = [],
    isPending,
    error,
  } = useQuery({ queryKey: ["employee-goals"], queryFn: api.employeeGoals });
  const [draft, setDraft] = useState(null),
    [creating, setCreating] = useState(false),
    [confirm, setConfirm] = useState(""),
    [requestError, setRequestError] = useState(""),
    [saving, setSaving] = useState(false),
    [savedAt, setSavedAt] = useState(null);
  const displayed = draft ?? goals,
    total = displayed.reduce((sum, goal) => sum + Number(goal.weightage), 0),
    editableGoals = goals.filter(editable),
    canCreate = goals.length < 8 && goals.every(editable),
    canSubmit = editableGoals.length > 0 && total === 100 && !draft;
  const selected = goals.find((goal) => goal.id === goalId);
  useEffect(() => {
    if (goalId && !isPending && !selected) navigate("/plan", { replace: true });
  }, [goalId, isPending, selected, navigate]);
  const dirty = useMemo(
    () =>
      draft &&
      draft.some(
        (goal) =>
          goal.weightage !==
          goals.find((item) => item.id === goal.id)?.weightage,
      ),
    [draft, goals],
  );
  async function refresh() {
    await cache.invalidateQueries({ queryKey: ["employee-goals"] });
  }
  async function saveWeights() {
    if (!dirty) return;
    setSaving(true);
    setRequestError("");
    let latest = goals;
    try {
      for (const goal of draft) {
        const previous = latest.find((item) => item.id === goal.id);
        if (previous?.weightage !== goal.weightage) {
          try {
            const saved = await api.updateGoal(goal.id, payload(goal));
            latest = latest.map((item) =>
              item.id === saved.id ? saved : item,
            );
            cache.setQueryData(["employee-goals"], latest);
          } catch (failure) {
            throw new Error(
              `Could not save “${goal.title}”: ${failure.message} Retry the remaining changes.`,
            );
          }
        }
      }
      setDraft(null);
      setSavedAt(new Date());
      toast("Weights saved");
    } catch (failure) {
      setRequestError(failure.message);
      await refresh();
    } finally {
      setSaving(false);
    }
  }
  async function submit() {
    setConfirm("");
    setRequestError("");
    try {
      const updated = await api.submitPlan();
      cache.setQueryData(["employee-goals"], updated);
      toast("Plan submitted");
    } catch (failure) {
      setRequestError(failure.message);
    }
  }
  async function remove() {
    const id = confirm;
    setConfirm("");
    try {
      await api.deleteGoal(id);
      await refresh();
      toast("Goal deleted");
    } catch (failure) {
      setRequestError(failure.message);
    }
  }
  if (isPending) return <Skeleton lines={6} />;
  if (error)
    return (
      <div className="panel panel-pad">
        <h1>Could not load your plan</h1>
        <p className="error-text">{error.message}</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  const short =
    total < 100
      ? `Add ${100 - total}% to submit.`
      : total > 100
        ? `Remove ${total - 100}% to submit.`
        : canSubmit
          ? "Ready to submit."
          : "Your plan is fully weighted.";
  return (
    <div className="page-grid">
      <div className="workspace">
        <div className="page-header">
          <div>
            <h1>Your plan</h1>
            <p className="page-intro">
              {goals.length} {goals.length === 1 ? "goal" : "goals"}, {total}%
              weighted. {short}
            </p>
          </div>
          <div className="button-row">
            <Button disabled={!canCreate} onClick={() => setCreating(true)}>
              <Plus size={17} aria-hidden="true" />
              New goal
            </Button>
            <Button
              variant="primary"
              disabled={!canSubmit}
              onClick={() => setConfirm("submit")}
            >
              Submit plan
            </Button>
          </div>
        </div>
        <section className="panel panel-pad">
          <div className="page-header">
            <div>
              <span className="display-num">{total}%</span>
              <p className="muted">of your plan allocated</p>
            </div>
            {savedAt && <span className="small muted">Saved just now</span>}
          </div>
          <PlanBar
            animate
            goals={displayed}
            onChange={editableGoals.length > 1 ? setDraft : undefined}
            canMove={(left, right) => editable(left) && editable(right)}
          />
          {dirty && (
            <div className="button-row space-before-md">
              <Button variant="primary" disabled={saving} onClick={saveWeights}>
                {saving ? "Saving…" : "Save weights"}
              </Button>
              <Button onClick={() => setDraft(null)}>Discard changes</Button>
            </div>
          )}
          <p className="help-text space-before-sm">
            Drag a boundary or use arrow keys to move 5% between neighbouring
            goals. Use the weight controls below to allocate any open
            percentage.
          </p>
        </section>
        {requestError && (
          <p className="error-text" role="alert">
            {requestError}
          </p>
        )}
        <section className="space-before-section">
          <h2 className="section-title">Goals in this plan</h2>
          {goals.length === 0 ? (
            <div className="panel">
              <EmptyState
                title="Start with an outcome"
                description="Add a specific goal to begin building your 100% plan."
                action={
                  <Button variant="primary" onClick={() => setCreating(true)}>
                    Add your first goal
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="record-list">
              {displayed.map((goal) => {
                const remaining = daysUntil(goal.deadline);
                return (
                  <article className="record" key={goal.id}>
                    <div>
                      <h3 className="record-title">{goal.title}</h3>
                      <div className="record-meta">
                        <StatusGlyph status={goal.status} />
                        <span>{goal.thrustArea}</span>
                        <span>Target {formatTarget(goal)}</span>
                        <span>{goal.weightage}% weight</span>
                        <span>
                          {formatDate(goal.deadline)}
                          {remaining >= 0
                            ? `, ${remaining} days left`
                            : ", overdue"}
                        </span>
                      </div>
                      {goal.managerNote && (
                        <p className="error-text space-before-sm">
                          Manager note: {goal.managerNote}
                        </p>
                      )}
                    </div>
                    <div className="record-actions">
                      {editable(goal) && (
                        <>
                          <Button
                            aria-label={`Remove 5% from ${goal.title}`}
                            disabled={goal.weightage <= 10}
                            onClick={() =>
                              setDraft((current) =>
                                (current ?? goals).map((item) =>
                                  item.id === goal.id
                                    ? { ...item, weightage: item.weightage - 5 }
                                    : item,
                                ),
                              )
                            }
                          >
                            <Minus size={16} aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Add 5% to ${goal.title}`}
                            disabled={total >= 100}
                            onClick={() =>
                              setDraft((current) =>
                                (current ?? goals).map((item) =>
                                  item.id === goal.id
                                    ? {
                                        ...item,
                                        weightage:
                                          item.weightage +
                                          Math.min(5, 100 - total),
                                      }
                                    : item,
                                ),
                              )
                            }
                          >
                            <Plus size={16} aria-hidden="true" />
                          </Button>
                          <Button onClick={() => navigate(`/plan/${goal.id}`)}>
                            Edit
                          </Button>
                          <Button
                            aria-label={`Delete ${goal.title}`}
                            onClick={() => setConfirm(goal.id)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <CycleRail goals={displayed} total={total} />
      {(creating || selected) && (
        <GoalSheet
          key={selected?.id ?? "new"}
          goal={selected}
          onClose={() => {
            setCreating(false);
            navigate("/plan");
          }}
          onSaved={async () => {
            setCreating(false);
            navigate("/plan");
            await refresh();
          }}
        />
      )}
      <Dialog
        open={confirm === "submit"}
        onOpenChange={() => setConfirm("")}
        title="Submit this plan?"
        description="Your submitted goals become read-only while your manager reviews them. A goal can be edited again if it is sent back for rework."
        actions={
          <>
            <Button onClick={() => setConfirm("")}>Keep editing</Button>
            <Button variant="primary" onClick={submit}>
              Submit plan
            </Button>
          </>
        }
      />
      <Dialog
        open={Boolean(confirm && confirm !== "submit")}
        onOpenChange={() => setConfirm("")}
        title="Delete this goal?"
        description="This removes the goal from your plan and cannot be undone."
        actions={
          <>
            <Button onClick={() => setConfirm("")}>Keep goal</Button>
            <Button variant="danger" onClick={remove}>
              Delete goal
            </Button>
          </>
        }
      />
    </div>
  );
}
