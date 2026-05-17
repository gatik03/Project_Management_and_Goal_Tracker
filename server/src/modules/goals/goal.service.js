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
  createdAt: true,
  updatedAt: true
};

function normalizeGoal(goal) {
  return {
    ...goal,
    deadline: goal.deadline.toISOString().slice(0, 10)
  };
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

  if (existingCount >= 8) {
    const error = new Error("Employees can create a maximum of 8 goals");
    error.statusCode = 400;
    throw error;
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
    const error = new Error("Goal not found");
    error.statusCode = 404;
    throw error;
  }

  if (existingGoal.status !== "DRAFT") {
    const error = new Error("Submitted goals cannot be edited");
    error.statusCode = 400;
    throw error;
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
    const error = new Error("Goal not found");
    error.statusCode = 404;
    throw error;
  }

  if (existingGoal.status !== "DRAFT") {
    const error = new Error("Submitted goals cannot be deleted");
    error.statusCode = 400;
    throw error;
  }

  await prisma.goal.delete({ where: { id: goalId } });
}

export async function submitEmployeeGoals(employeeId) {
  const draftGoals = await prisma.goal.findMany({
    where: { employeeId, status: "DRAFT" },
    select: { id: true, weightage: true }
  });

  if (draftGoals.length === 0) {
    const error = new Error("Create at least one draft goal before submission");
    error.statusCode = 400;
    throw error;
  }

  const totalWeightage = draftGoals.reduce((sum, goal) => sum + goal.weightage, 0);

  if (totalWeightage !== 100) {
    const error = new Error("Total draft goal weightage must equal 100% before submission");
    error.statusCode = 400;
    throw error;
  }

  await prisma.goal.updateMany({
    where: { employeeId, status: "DRAFT" },
    data: { status: "SUBMITTED" }
  });

  return listEmployeeGoals(employeeId);
}
