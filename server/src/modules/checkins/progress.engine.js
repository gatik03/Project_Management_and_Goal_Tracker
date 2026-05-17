export function calculateProgress({ plannedTarget, actualAchievement }) {
  const planned = Number(plannedTarget);
  const actual = Number(actualAchievement);

  const achievementToTargetPercent = planned <= 0
    ? actual > 0 ? 100 : 0
    : Math.round((actual / planned) * 100);

  const targetToAchievementRatio = actual <= 0
    ? planned > 0 ? 0 : 1
    : Number((planned / actual).toFixed(2));

  return {
    achievementToTargetPercent,
    targetToAchievementRatio,
    cappedProgressPercent: Math.min(achievementToTargetPercent, 100)
  };
}

export function calculateTimelineCompletion(checkIns) {
  const completedCount = checkIns.filter((checkIn) => checkIn.status === "COMPLETED").length;

  return {
    completedQuarters: completedCount,
    totalQuarters: 4,
    completionPercent: Math.round((completedCount / 4) * 100),
    isComplete: completedCount === 4
  };
}
