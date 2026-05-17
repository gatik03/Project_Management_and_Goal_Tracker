import { prisma } from "../../config/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  title: true,
  isActive: true,
  managerId: true,
  manager: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  _count: {
    select: {
      reports: true,
      goals: true
    }
  }
};

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeGoal(goal) {
  return {
    ...goal,
    deadline: goal.deadline.toISOString().slice(0, 10),
    lockedAt: goal.lockedAt?.toISOString() ?? null,
    reviewedAt: goal.reviewedAt?.toISOString() ?? null
  };
}

export async function getAdminDashboard() {
  const [userCount, activeUsers, goalCounts, checkInCounts, cycleCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.goal.groupBy({
      by: ["status"],
      _count: { status: true }
    }),
    prisma.quarterlyCheckIn.groupBy({
      by: ["status"],
      _count: { status: true }
    }),
    prisma.quarterlyCycleConfig.count()
  ]);

  const goalsByStatus = goalCounts.reduce((result, item) => ({
    ...result,
    [item.status]: item._count.status
  }), {});
  const checkInsByStatus = checkInCounts.reduce((result, item) => ({
    ...result,
    [item.status]: item._count.status
  }), {});
  const totalGoals = Object.values(goalsByStatus).reduce((sum, count) => sum + count, 0);
  const completedCheckIns = checkInsByStatus.COMPLETED ?? 0;
  const totalCheckIns = Object.values(checkInsByStatus).reduce((sum, count) => sum + count, 0);

  return {
    users: {
      total: userCount,
      active: activeUsers
    },
    goals: {
      total: totalGoals,
      byStatus: goalsByStatus,
      approvedOrLocked: (goalsByStatus.APPROVED ?? 0) + (goalsByStatus.LOCKED ?? 0)
    },
    checkIns: {
      total: totalCheckIns,
      byStatus: checkInsByStatus,
      completionPercent: totalCheckIns === 0 ? 0 : Math.round((completedCheckIns / totalCheckIns) * 100)
    },
    cycles: {
      total: cycleCount
    }
  };
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: userSelect
  });
}

export async function updateUser(userId, payload, audit) {
  const oldUser = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect
  });

  if (!oldUser) {
    throw createHttpError("User not found", 404);
  }

  if (payload.managerId) {
    const manager = await prisma.user.findFirst({
      where: { id: payload.managerId, role: "MANAGER", isActive: true }
    });

    if (!manager) {
      throw createHttpError("Selected manager is not an active manager");
    }
  }

  if (payload.managerId === userId) {
    throw createHttpError("A user cannot be their own manager");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: userSelect
  });

  await audit({
    action: "USER_UPDATED",
    entityType: "User",
    entityId: userId,
    oldValue: oldUser,
    newValue: updatedUser
  });

  return updatedUser;
}

export async function listOrgHierarchy() {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      title: true,
      reports: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true,
          isActive: true
        }
      }
    }
  });

  const unassignedEmployees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      managerId: null
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      title: true,
      isActive: true
    }
  });

  return { managers, unassignedEmployees };
}

export async function listUnlockableGoals() {
  const goals = await prisma.goal.findMany({
    where: { status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true
        }
      }
    }
  });

  return goals.map(normalizeGoal);
}

export async function unlockGoal(goalId, reason, audit) {
  const oldGoal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!oldGoal) {
    throw createHttpError("Goal not found", 404);
  }

  if (!["SUBMITTED", "APPROVED", "LOCKED"].includes(oldGoal.status)) {
    throw createHttpError("Only submitted, approved, or locked goals can be unlocked");
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: "REWORK_REQUIRED",
      lockedAt: null,
      managerNote: reason,
      reviewedAt: new Date(),
      reviewedById: null
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true
        }
      }
    }
  });

  await audit({
    action: "GOAL_UNLOCKED",
    entityType: "Goal",
    entityId: goalId,
    oldValue: normalizeGoal(oldGoal),
    newValue: normalizeGoal(updatedGoal)
  });

  return normalizeGoal(updatedGoal);
}

export async function listAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function listCycleConfigs() {
  const cycles = await prisma.quarterlyCycleConfig.findMany({
    orderBy: [{ year: "desc" }, { quarter: "asc" }]
  });

  return cycles.map((cycle) => ({
    ...cycle,
    startDate: cycle.startDate.toISOString().slice(0, 10),
    endDate: cycle.endDate.toISOString().slice(0, 10)
  }));
}

export async function upsertCycleConfig(payload, audit) {
  const oldCycle = await prisma.quarterlyCycleConfig.findUnique({
    where: {
      year_quarter: {
        year: payload.year,
        quarter: payload.quarter
      }
    }
  });

  if (payload.endDate <= payload.startDate) {
    throw createHttpError("Cycle end date must be after start date");
  }

  const cycle = await prisma.quarterlyCycleConfig.upsert({
    where: {
      year_quarter: {
        year: payload.year,
        quarter: payload.quarter
      }
    },
    update: payload,
    create: payload
  });

  await audit({
    action: "CYCLE_CONFIG_UPDATED",
    entityType: "QuarterlyCycleConfig",
    entityId: cycle.id,
    oldValue: oldCycle,
    newValue: cycle
  });

  return {
    ...cycle,
    startDate: cycle.startDate.toISOString().slice(0, 10),
    endDate: cycle.endDate.toISOString().slice(0, 10)
  };
}
