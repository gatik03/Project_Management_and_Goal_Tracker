import { prisma } from "../../config/prisma.js";

const goalSelect = {
  id: true,
  title: true,
  description: true,
  thrustArea: true,
  uomType: true,
  target: true,
  weightage: true,
  deadline: true,
  status: true,
  managerNote: true,
  reviewedAt: true,
  lockedAt: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      title: true
    }
  }
};

function normalizeGoal(goal) {
  return {
    ...goal,
    deadline: goal.deadline.toISOString().slice(0, 10)
  };
}

const employeeEditableStatuses = ["DRAFT", "REWORK_REQUIRED"];
const managerEditableStatuses = ["SUBMITTED", "REWORK_REQUIRED"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function listEmployeeGoals(employeeId) {
  const goals = await prisma.goal.findMany({
    where: { employeeId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: goalSelect
  });

  return goals.map(normalizeGoal);
}

export async function createEmployeeGoal(employeeId, payload) {
  const existingCount = await prisma.goal.count({ where: { employeeId } });
  const lockedCount = await prisma.goal.count({
    where: {
      employeeId,
      status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] }
    }
  });

  if (lockedCount > 0) {
    throw createHttpError("Goals cannot be added while the plan is submitted, approved, or locked");
  }

  if (existingCount >= 8) {
    throw createHttpError("Employees can create a maximum of 8 goals");
  }

  const goal = await prisma.goal.create({
    data: {
      ...payload,
      employeeId
    },
    select: goalSelect
  });

  return normalizeGoal(goal);
}

export async function updateEmployeeGoal(employeeId, goalId, payload) {
  const existingGoal = await prisma.goal.findFirst({
    where: { id: goalId, employeeId }
  });

  if (!existingGoal) {
    throw createHttpError("Goal not found", 404);
  }

  if (!employeeEditableStatuses.includes(existingGoal.status)) {
    throw createHttpError("Only draft or rework-required goals can be edited by employees");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: payload,
    select: goalSelect
  });

  return normalizeGoal(goal);
}

export async function deleteEmployeeGoal(employeeId, goalId) {
  const existingGoal = await prisma.goal.findFirst({
    where: { id: goalId, employeeId }
  });

  if (!existingGoal) {
    throw createHttpError("Goal not found", 404);
  }

  if (!employeeEditableStatuses.includes(existingGoal.status)) {
    throw createHttpError("Only draft or rework-required goals can be deleted by employees");
  }

  await prisma.goal.delete({ where: { id: goalId } });
}

export async function submitEmployeeGoals(employeeId) {
  const draftGoals = await prisma.goal.findMany({
    where: { employeeId, status: { in: employeeEditableStatuses } },
    select: { id: true, weightage: true }
  });

  if (draftGoals.length === 0) {
    throw createHttpError("Create at least one editable goal before submission");
  }

  const totalWeightage = draftGoals.reduce((sum, goal) => sum + goal.weightage, 0);

  if (totalWeightage !== 100) {
    throw createHttpError("Total editable goal weightage must equal 100% before submission");
  }

  await prisma.goal.updateMany({
    where: { employeeId, status: { in: employeeEditableStatuses } },
    data: {
      status: "SUBMITTED",
      managerNote: null,
      reviewedAt: null,
      reviewedById: null
    }
  });

  return listEmployeeGoals(employeeId);
}

export async function listManagerTeamGoals(managerId) {
  const goals = await prisma.goal.findMany({
    where: {
      employee: {
        managerId
      },
      status: { not: "DRAFT" }
    },
    orderBy: [{ employee: { name: "asc" } }, { updatedAt: "desc" }],
    select: goalSelect
  });

  return goals.map(normalizeGoal);
}

async function findManagerOwnedGoal(managerId, goalId) {
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      employee: {
        managerId
      }
    },
    select: {
      ...goalSelect,
      employeeId: true
    }
  });

  if (!goal) {
    throw createHttpError("Goal not found for this manager's team", 404);
  }

  return goal;
}

export async function updateManagerGoalFields(managerId, goalId, payload) {
  const existingGoal = await findManagerOwnedGoal(managerId, goalId);

  if (!managerEditableStatuses.includes(existingGoal.status)) {
    throw createHttpError("Only submitted or rework-required goals can be adjusted by managers");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: payload,
    select: goalSelect
  });

  return normalizeGoal(goal);
}

export async function approveManagerGoal(managerId, goalId) {
  const existingGoal = await findManagerOwnedGoal(managerId, goalId);

  if (!managerEditableStatuses.includes(existingGoal.status)) {
    throw createHttpError("Only submitted or rework-required goals can be approved");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: "APPROVED",
      reviewedById: managerId,
      reviewedAt: new Date(),
      lockedAt: new Date(),
      managerNote: null
    },
    select: goalSelect
  });

  return normalizeGoal(goal);
}

export async function rejectManagerGoal(managerId, goalId, managerNote) {
  const existingGoal = await findManagerOwnedGoal(managerId, goalId);

  if (!["SUBMITTED", "APPROVED"].includes(existingGoal.status)) {
    throw createHttpError("Only submitted or approved goals can be sent for rework");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      status: "REWORK_REQUIRED",
      reviewedById: managerId,
      reviewedAt: new Date(),
      lockedAt: null,
      managerNote
    },
    select: goalSelect
  });

  return normalizeGoal(goal);
}
