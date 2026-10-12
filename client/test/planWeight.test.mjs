import assert from "node:assert/strict";
import test from "node:test";
import { moveBoundary } from "../src/ui/planWeight.js";

const goals = [30, 25, 20, 25].map((weightage, index) => ({ id: String(index), weightage }));

test("moving a boundary transfers exactly 5% and preserves the plan total", () => {
  const next = moveBoundary(goals, 0, 5);
  assert.deepEqual(next.map(({ weightage }) => weightage), [35, 20, 20, 25]);
  assert.equal(next.reduce((sum, goal) => sum + goal.weightage, 0), 100);
  assert.equal(goals[0].weightage, 30);
});

test("neither neighbouring goal can drop below 10%", () => {
  const tight = [{ id: "a", weightage: 90 }, { id: "b", weightage: 10 }];
  assert.equal(moveBoundary(tight, 0, 5), tight);
  assert.deepEqual(moveBoundary(tight, 0, -100).map(({ weightage }) => weightage), [10, 90]);
});

test("moves remain in 5% steps even when a stored weight is not a multiple of five", () => {
  const irregular = [{ id: "a", weightage: 23 }, { id: "b", weightage: 17 }];
  assert.deepEqual(moveBoundary(irregular, 0, 10).map(({ weightage }) => weightage), [28, 12]);
});
