import { prisma } from "../../config/prisma.js";
import { calculateProgress, calculateTimelineCompletion } from "./progress.engine.js";

const quarters = ["Q1", "Q2", "Q3", "Q4"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCheckIn(checkIn) {
  return {
    ...checkIn,
    progress: calculateProgress(checkIn),
    reviewedAt: checkIn.reviewedAt?.toISOString() ?? null
  };
}

function normalizeGoalWithCheckIns(goal) {
  const existing = new Map(goal.checkIns.map((checkIn) => [checkIn.quarter, normalizeCheckIn(checkIn)]));
  const checkIns = quarters.map((quarter) => existing.get(quarter) ?? {
    id: null,
    quarter,
    plannedTarget: 0,
    actualAchievement: 0,
    status: "NOT_STARTED",
    employeeNote: "",
    managerComment: "",
    reviewedAt: null,
    goalId: goal.id,
    progress: calculateProgress({ plannedTarget: 0, actualAchievement: 0 })
  });

  return {
    ...goal,
    deadline: goal.deadline.toISOString().slice(0, 10),
    checkIns,
    timeline: calculateTimelineCompletion(checkIns)
  };
}

export async function listEmployeeQuarterlyCheckIns(employeeId) {
  const goals = await prisma.goal.findMany({
    where: {
      employeeId,
      status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      checkIns: {
        orderBy: { quarter: "asc" }
      }
    }
  });

  return goals.map(normalizeGoalWithCheckIns);
}

export async function upsertEmployeeCheckIn(employeeId, goalId, quarter, payload) {
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      employeeId,
      status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] }
    }
  });

  if (!goal) {
    throw createHttpError("Goal not found for quarterly check-in", 404);
  }

  const checkIn = await prisma.quarterlyCheckIn.upsert({
    where: {
      goalId_quarter: {
        goalId,
        quarter
      }
    },
    update: {
      ...payload,
      managerComment: undefined,
      reviewedAt: undefined
    },
    create: {
      ...payload,
      goalId,
      quarter
    }
  });

  return normalizeCheckIn(checkIn);
}

export async function listManagerQuarterlyCheckIns(managerId) {
  const goals = await prisma.goal.findMany({
    where: {
      employee: { managerId },
      status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] }
    },
    orderBy: [{ employee: { name: "asc" } }, { updatedAt: "desc" }],
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true
        }
      },
      checkIns: {
        orderBy: { quarter: "asc" }
      }
    }
  });

  return goals.map(normalizeGoalWithCheckIns);
}

export async function addManagerCheckInComment(managerId, checkInId, managerComment) {
  const checkIn = await prisma.quarterlyCheckIn.findFirst({
    where: {
      id: checkInId,
      goal: {
        employee: { managerId }
      }
    }
  });

  if (!checkIn) {
    throw createHttpError("Quarterly update not found for this manager's team", 404);
  }

  const updated = await prisma.quarterlyCheckIn.update({
    where: { id: checkInId },
    data: {
      managerComment,
      reviewedAt: new Date()
    }
  });

  return normalizeCheckIn(updated);
}
