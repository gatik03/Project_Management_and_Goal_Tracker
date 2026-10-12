import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const goalStatuses = ["DRAFT", "SUBMITTED", "REWORK_REQUIRED", "APPROVED", "LOCKED"];
const checkInStatuses = ["NOT_STARTED", "ON_TRACK", "COMPLETED"];
const dashboardRowLimit = 200;
const exportRowLimit = 2000;

function goalScope(user, filters) {
  const employee = {};
  if (user.role === "MANAGER") employee.managerId = user.id;
  if (filters.department) employee.department = filters.department;
  return {
    ...(Object.keys(employee).length ? { employee } : {}),
    ...(filters.status ? { status: filters.status } : {})
  };
}

function checkInScope(user, filters) {
  return {
    goal: goalScope(user, filters),
    ...(filters.quarter ? { quarter: filters.quarter } : {})
  };
}

function sqlGoalClauses(user, filters) {
  const clauses = [Prisma.sql`TRUE`];
  if (user.role === "MANAGER") clauses.push(Prisma.sql`u."managerId" = ${user.id}`);
  if (filters.department) clauses.push(Prisma.sql`u."department" = ${filters.department}`);
  if (filters.status) clauses.push(Prisma.sql`g."status" = ${filters.status}::"GoalStatus"`);
  return clauses;
}

function sqlWhere(clauses) {
  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`;
}

function achievementSql() {
  return Prisma.sql`CASE
    WHEN c."plannedTarget" <= 0 THEN CASE WHEN c."actualAchievement" > 0 THEN 100 ELSE 0 END
    ELSE ROUND((c."actualAchievement" / c."plannedTarget") * 100)
  END`;
}

function toAchievementRow(checkIn) {
  const planned = checkIn.plannedTarget;
  const actual = checkIn.actualAchievement;
  return {
    checkInId: checkIn.id,
    employee: checkIn.goal.employee.name,
    department: checkIn.goal.employee.department,
    goalTitle: checkIn.goal.title,
    quarter: checkIn.quarter,
    plannedTarget: planned,
    actualAchievement: actual,
    achievementPercent: planned <= 0 ? (actual > 0 ? 100 : 0) : Math.round((actual / planned) * 100),
    status: checkIn.status
  };
}

const rowInclude = {
  goal: {
    include: {
      employee: { select: { id: true, name: true, department: true, title: true } }
    }
  }
};

export async function getReportingDashboard(user, filters = {}) {
  const goalsWhere = goalScope(user, filters);
  const checkInsWhere = checkInScope(user, filters);
  const goalClauses = sqlGoalClauses(user, filters);
  const checkInClauses = filters.quarter
    ? [...goalClauses, Prisma.sql`c."quarter" = ${filters.quarter}::"Quarter"`]
    : goalClauses;

  const [goalCounts, checkInCounts, departments, rows, averageRows, trendRows, completionRows] = await Promise.all([
    prisma.goal.groupBy({ by: ["status"], where: goalsWhere, _count: { _all: true } }),
    prisma.quarterlyCheckIn.groupBy({ by: ["status"], where: checkInsWhere, _count: { _all: true } }),
    prisma.user.groupBy({
      by: ["department"],
      where: user.role === "MANAGER" ? { managerId: user.id } : {},
      orderBy: { department: "asc" }
    }),
    prisma.quarterlyCheckIn.findMany({
      where: checkInsWhere, include: rowInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: dashboardRowLimit
    }),
    prisma.$queryRaw(Prisma.sql`
      SELECT COALESCE(ROUND(AVG(${achievementSql()}))::int, 0) AS average
      FROM "QuarterlyCheckIn" c
      JOIN "Goal" g ON g.id = c."goalId"
      JOIN "User" u ON u.id = g."employeeId"
      ${sqlWhere(checkInClauses)}
    `),
    prisma.$queryRaw(Prisma.sql`
      SELECT c."quarter", COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE c."status" = 'COMPLETED')::int AS completed,
        ROUND(AVG(${achievementSql()}))::int AS average
      FROM "QuarterlyCheckIn" c
      JOIN "Goal" g ON g.id = c."goalId"
      JOIN "User" u ON u.id = g."employeeId"
      ${sqlWhere(checkInClauses)}
      GROUP BY c."quarter"
    `),
    prisma.$queryRaw(Prisma.sql`
      SELECT u.id AS "employeeId", u.name AS employee, u.department,
        COUNT(c.id)::int AS "totalCheckIns",
        COUNT(c.id) FILTER (WHERE c."status" = 'COMPLETED')::int AS "completedCheckIns"
      FROM "Goal" g
      JOIN "User" u ON u.id = g."employeeId"
      LEFT JOIN "QuarterlyCheckIn" c ON c."goalId" = g.id
      ${sqlWhere(goalClauses)}
      GROUP BY u.id, u.name, u.department
      ORDER BY u.name
    `)
  ]);

  const goalCountMap = new Map(goalCounts.map(({ status, _count }) => [status, _count._all]));
  const checkInCountMap = new Map(checkInCounts.map(({ status, _count }) => [status, _count._all]));
  const trendMap = new Map(trendRows.map((row) => [row.quarter, row]));
  const totalGoals = goalCounts.reduce((sum, row) => sum + row._count._all, 0);
  const totalCheckIns = checkInCounts.reduce((sum, row) => sum + row._count._all, 0);

  return {
    filters: {
      departments: departments.map((item) => item.department).filter(Boolean),
      statuses: goalStatuses, quarters
    },
    summary: {
      totalGoals, totalCheckIns,
      averageAchievement: averageRows[0]?.average ?? 0,
      completedCheckIns: checkInCountMap.get("COMPLETED") ?? 0
    },
    goalDistribution: goalStatuses.map((status) => ({ status, count: goalCountMap.get(status) ?? 0 })),
    checkInStatusDistribution: checkInStatuses.map((status) => ({ status, count: checkInCountMap.get(status) ?? 0 })),
    achievementRows: rows.map(toAchievementRow),
    completionByEmployee: completionRows.map((row) => ({
      ...row,
      completionPercent: row.totalCheckIns === 0 ? 0 : Math.round((row.completedCheckIns / row.totalCheckIns) * 100)
    })),
    trendByQuarter: quarters.map((quarter) => ({
      quarter,
      averageProgress: trendMap.get(quarter)?.average ?? 0,
      completed: trendMap.get(quarter)?.completed ?? 0,
      total: trendMap.get(quarter)?.total ?? 0
    }))
  };
}

export async function getReportExportRows(user, filters = {}) {
  const checkIns = await prisma.quarterlyCheckIn.findMany({
    where: checkInScope(user, filters), include: rowInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: exportRowLimit + 1
  });
  if (checkIns.length > exportRowLimit) {
    const error = new Error("Export exceeds 2,000 rows. Narrow the filters and try again.");
    error.statusCode = 413;
    throw error;
  }
  return checkIns.map(toAchievementRow);
}
