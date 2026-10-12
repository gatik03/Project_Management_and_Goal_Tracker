import { describe, expect, it } from "vitest";
import { calculateProgress, calculateTimelineCompletion } from "../src/modules/checkins/progress.engine.js";

describe("quarterly progress engine", () => {
  it("exposes uncapped achievement and capped display progress", () => {
    expect(calculateProgress({ plannedTarget: 80, actualAchievement: 100 })).toEqual({
      achievementToTargetPercent: 125,
      targetToAchievementRatio: 0.8,
      cappedProgressPercent: 100
    });
    expect(calculateProgress({ plannedTarget: 100, actualAchievement: 45 }).cappedProgressPercent).toBe(45);
    expect(calculateProgress({ plannedTarget: 0, actualAchievement: 0 }).cappedProgressPercent).toBe(0);
  });

  it("counts one status per quarter", () => {
    expect(calculateTimelineCompletion([
      { status: "COMPLETED" }, { status: "ON_TRACK" },
      { status: "COMPLETED" }, { status: "NOT_STARTED" }
    ])).toEqual({ completedQuarters: 2, totalQuarters: 4, completionPercent: 50, isComplete: false });
  });
});
