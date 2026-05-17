import { prisma } from "../../config/prisma.js";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const goalStatuses = ["DRAFT", "SUBMITTED", "REWORK_REQUIRED", "APPROVED", "LOCKED"];
const checkInStatuses = ["NOT_STARTED", "ON_TRACK", "COMPLETED"];

function buildGoalScope(user, filters) {
  const where = {};

  if (user.role === "MANAGER") {
    where.employee = { managerId: user.id };
  }

  if (filters.department) {
    where.employee = {
      ...(where.employee ?? {}),
      department: filters.department
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

function buildCheckInScope(user, filters) {
  const where = {
    goal: buildGoalScope(user, filters)
  };

  if (filters.quarter) {
    where.quarter = filters.quarter;
  }

  return where;
}

function emptyStatusMap(statuses) {
  return statuses.reduce((result, status) => ({ ...result, [status]: 0 }), {});
}

export async function getReportingDashboard(user, filters = {}) {
  const goalWhere = buildGoalScope(user, filters);
  const checkInWhere = buildCheckInScope(user, filters);

  const [goals, checkIns, departments] = await Promise.all([
    prisma.goal.findMany({
      where: goalWhere,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
            title: true
          }
        },
        checkIns: true
      }
    }),
    prisma.quarterlyCheckIn.findMany({
      where: checkInWhere,
      include: {
        goal: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                department: true,
                title: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findMany({
      where: user.role === "MANAGER" ? { managerId: user.id } : {},
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" }
    })
  ]);

  const goalDistributionMap = goals.reduce((result, goal) => ({
    ...result,
    [goal.status]: (result[goal.status] ?? 0) + 1
  }), emptyStatusMap(goalStatuses));

  const achievementRows = checkIns.map((checkIn) => {
    const achievementPercent = checkIn.plannedTarget <= 0
      ? checkIn.actualAchievement > 0 ? 100 : 0
      : Math.round((checkIn.actualAchievement / checkIn.plannedTarget) * 100);

    return {
      checkInId: checkIn.id,
      employee: checkIn.goal.employee.name,
      department: checkIn.goal.employee.department,
      goalTitle: checkIn.goal.title,
      quarter: checkIn.quarter,
      plannedTarget: checkIn.plannedTarget,
      actualAchievement: checkIn.actualAchievement,
      achievementPercent,
      status: checkIn.status
    };
  });

  const averageAchievement = achievementRows.length === 0
    ? 0
    : Math.round(achievementRows.reduce((sum, row) => sum + row.achievementPercent, 0) / achievementRows.length);

  const completionByEmployee = Array.from(
    goals.reduce((map, goal) => {
      const current = map.get(goal.employee.id) ?? {
        employeeId: goal.employee.id,
        employee: goal.employee.name,
        department: goal.employee.department,
        totalCheckIns: 0,
        completedCheckIns: 0
      };

      current.totalCheckIns += goal.checkIns.length;
      current.completedCheckIns += goal.checkIns.filter((checkIn) => checkIn.status === "COMPLETED").length;
      map.set(goal.employee.id, current);
      return map;
    }, new Map()).values()
  ).map((row) => ({
    ...row,
    completionPercent: row.totalCheckIns === 0 ? 0 : Math.round((row.completedCheckIns / row.totalCheckIns) * 100)
  }));

  const trendByQuarter = quarters.map((quarter) => {
    const quarterRows = achievementRows.filter((row) => row.quarter === quarter);
    const completed = quarterRows.filter((row) => row.status === "COMPLETED").length;
    const averageProgress = quarterRows.length === 0
      ? 0
      : Math.round(quarterRows.reduce((sum, row) => sum + row.achievementPercent, 0) / quarterRows.length);

    return {
      quarter,
      averageProgress,
      completed,
      total: quarterRows.length
    };
  });

  return {
    filters: {
      departments: departments.map((item) => item.department).filter(Boolean),
      statuses: goalStatuses,
      quarters
    },
    summary: {
      totalGoals: goals.length,
      totalCheckIns: checkIns.length,
      averageAchievement,
      completedCheckIns: checkIns.filter((checkIn) => checkIn.status === "COMPLETED").length
    },
    goalDistribution: Object.entries(goalDistributionMap).map(([status, count]) => ({ status, count })),
    checkInStatusDistribution: Object.entries(checkIns.reduce((result, checkIn) => ({
      ...result,
      [checkIn.status]: (result[checkIn.status] ?? 0) + 1
    }), emptyStatusMap(checkInStatuses))).map(([status, count]) => ({ status, count })),
    achievementRows,
    completionByEmployee,
    trendByQuarter
  };
}

export async function getReportExportRows(user, filters = {}) {
  const dashboard = await getReportingDashboard(user, filters);

  return dashboard.achievementRows;
}
