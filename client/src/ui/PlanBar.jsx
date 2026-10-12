import { LockKeyhole } from "lucide-react";
import { useRef } from "react";
import { StatusGlyph } from "./index";
import { moveBoundary } from "./planWeight";

const step = 5;
export function PlanBar({
  goals = [],
  onChange,
  ghost,
  label = "Goal plan",
  canMove = () => true,
  animate = false,
}) {
  const track = useRef(null);
  const total = goals.reduce(
    (sum, goal) => sum + Number(goal.weightage || 0),
    0,
  );
  const canEdit = Boolean(onChange);
  function adjust(index, delta) {
    onChange?.(moveBoundary(goals, index, delta));
  }
  function pointerDown(event, index) {
    if (!canEdit || event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const width = track.current?.getBoundingClientRect().width || 1;
    const original = goals;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    function move(moveEvent) {
      const delta =
        Math.round((((moveEvent.clientX - startX) / width) * 100) / step) *
        step;
      onChange(moveBoundary(original, index, delta));
    }
    function stop() {
      handle.removeEventListener("pointermove", move);
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop, { once: true });
    handle.addEventListener("pointercancel", stop, { once: true });
  }
  return (
    <div role="group" aria-label={label}>
      {ghost?.length > 0 && (
        <div
          className="plan-track plan-ghost"
          role="img"
          aria-label="Last saved weights"
        >
          {ghost.map((goal) => (
            <div
              key={goal.id}
              className="plan-segment"
              data-status={goal.status}
              style={{ width: `${goal.weightage}%` }}
            />
          ))}
        </div>
      )}
      <div className={`plan-track ${animate ? "plan-enter" : ""}`} ref={track} style={{ position: "relative" }}>
        {goals.map((goal,index) => {
          return (
            <div
              key={goal.id}
              className="plan-segment"
              data-status={goal.status}
              style={{ width: `${goal.weightage}%`, animationDelay: `${index * 55}ms` }}
              title={`${goal.title}: ${goal.weightage}%`}
            >
              <span aria-hidden="true">
                {goal.status === "LOCKED" ? (
                  <LockKeyhole size={15} />
                ) : goal.weightage >= 15 ? (
                  `${goal.weightage}%`
                ) : (
                  ""
                )}
              </span>
            </div>
          );
        })}
        {total < 100 && (
          <div className="plan-open" style={{ width: `${100 - total}%` }}>
            {100 - total}% open
          </div>
        )}
        {canEdit &&
          goals.slice(0, -1).map((goal, index) => {
            const position = goals
              .slice(0, index + 1)
              .reduce((sum, item) => sum + Number(item.weightage || 0), 0);
            const next = goals[index + 1];
            return canMove(goal, next) ? (
              <button
                key={goal.id}
                type="button"
                className="plan-handle"
                style={{ left: `calc(${position}% - 12px)`, right: "auto" }}
                role="slider"
                aria-label={`Move weight between ${goal.title} and ${next.title}`}
                aria-valuemin={10}
                aria-valuemax={goal.weightage + next.weightage - 10}
                aria-valuenow={goal.weightage}
                aria-valuetext={`${goal.title}, ${goal.weightage} percent`}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    adjust(index, step);
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    adjust(index, -step);
                  }
                }}
                onPointerDown={(event) => pointerDown(event, index)}
              />
            ) : null;
          })}
      </div>
      <div className="plan-labels">
        {goals.map((goal) => (
          <span className="plan-key" key={goal.id}>
            <StatusGlyph status={goal.status} />
            <span>
              <strong>{goal.title}</strong>, {goal.weightage}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
