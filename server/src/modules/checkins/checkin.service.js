import { prisma } from "../../config/prisma.js";
import { withSerializableTransaction } from "../../config/transaction.js";
import { calculateProgress, calculateTimelineCompletion } from "./progress.engine.js";
import { notify } from "../notifications/notification.service.js";

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

export async function upsertEmployeeCheckIn(employeeId, goalId, quarter, payload, audit, actorName) {
  return withSerializableTransaction(async (db) => {
    const goal = await db.goal.findFirst({
      where: {
        id: goalId,
        employeeId,
        status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] }
      },
      include: { employee: { select: { managerId: true, name: true } } }
    });

    if (!goal) {
      throw createHttpError("Goal not found for quarterly check-in", 404);
    }

    const oldCheckIn = await db.quarterlyCheckIn.findUnique({ where: { goalId_quarter: { goalId, quarter } } });
    const checkIn = await db.quarterlyCheckIn.upsert({
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

    await audit({ action: "CHECKIN_SAVED", entityType: "QuarterlyCheckIn", entityId: checkIn.id, oldValue: oldCheckIn, newValue: checkIn }, db);
    const changed = !oldCheckIn || ["plannedTarget", "actualAchievement", "status", "employeeNote"]
      .some((field) => oldCheckIn[field] !== checkIn[field]);
    if (changed) {
      await notify(db, {
        recipientId: goal.employee.managerId, type: "CHECKIN_SAVED",
        actorName, title: `${actorName} updated a ${quarter} check-in`,
        detail: `${goal.title}: ${checkIn.status.toLowerCase().replaceAll("_", " ")}.`,
        href: "/team/check-ins"
      });
    }

    return normalizeCheckIn(checkIn);
  });
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

export async function addManagerCheckInComment(managerId, checkInId, managerComment, audit, actorName) {
  return withSerializableTransaction(async (db) => {
    const checkIn = await db.quarterlyCheckIn.findFirst({
      where: {
        id: checkInId,
        goal: {
          employee: { managerId }
        }
      },
      include: { goal: { select: { employeeId: true, title: true } } }
    });

    if (!checkIn) {
      throw createHttpError("Quarterly update not found for this manager's team", 404);
    }

    const updated = await db.quarterlyCheckIn.update({
      where: { id: checkInId },
      data: {
        managerComment,
        reviewedAt: new Date()
      }
    });

    await audit({ action: "CHECKIN_COMMENTED", entityType: "QuarterlyCheckIn", entityId: checkInId, oldValue: checkIn, newValue: updated }, db);
    if (managerComment !== checkIn.managerComment) {
      await notify(db, {
        recipientId: checkIn.goal.employeeId, type: "CHECKIN_COMMENTED", actorName,
        title: `${actorName} commented on a check-in`,
        detail: `${checkIn.goal.title}: ${managerComment}`,
        href: "/check-ins"
      });
    }

    return normalizeCheckIn(updated);
  });
}
