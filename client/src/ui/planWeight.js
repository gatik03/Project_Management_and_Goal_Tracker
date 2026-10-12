const STEP = 5;

export function moveBoundary(goals, index, delta) {
  if (index < 0 || index >= goals.length - 1) return goals;
  const left = goals[index];
  const right = goals[index + 1];
  const change = delta >= 0
    ? Math.min(Math.floor((right.weightage - 10) / STEP) * STEP, delta)
    : Math.max(-Math.floor((left.weightage - 10) / STEP) * STEP, delta);
  if (!change) return goals;
  return goals.map((goal, position) =>
    position === index
      ? { ...goal, weightage: left.weightage + change }
      : position === index + 1
        ? { ...goal, weightage: right.weightage - change }
        : goal
  );
}
