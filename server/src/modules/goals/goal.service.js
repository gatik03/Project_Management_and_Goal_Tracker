import { prisma } from "../../config/prisma.js";
import { withSerializableTransaction } from "../../config/transaction.js";

const goalSelect = {
  id: true, title: true, description: true, thrustArea: true, uomType: true,
  target: true, weightage: true, deadline: true, status: true,
  managerNote: true, reviewedAt: true, lockedAt: true,
  createdAt: true, updatedAt: true,
  employee: {
    select: { id: true, name: true, email: true, department: true, title: true }
  }
};

const employeeEditableStatuses = ["DRAFT", "REWORK_REQUIRED"];

function normalizeGoal(goal) {
  return { ...goal, deadline: goal.deadline.toISOString().slice(0, 10) };
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function listEmployeeGoals(employeeId, pagination = {}) {
  const goals = await prisma.goal.findMany({
    where: { employeeId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    ...(pagination.limit ? { take: pagination.limit } : {}),
    ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
    select: goalSelect
  });
  return goals.map(normalizeGoal);
}

export async function createEmployeeGoal(employeeId, payload, audit) {
  return withSerializableTransaction(async (db) => {
    const [count, lockedCount] = await Promise.all([
      db.goal.count({ where: { employeeId } }),
      db.goal.count({ where: { employeeId, status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } } })
    ]);
    if (lockedCount > 0) throw createHttpError("Goals cannot be added while the plan is submitted, approved, or locked");
    if (count >= 8) throw createHttpError("Employees can create a maximum of 8 goals");

    const goal = await db.goal.create({ data: { ...payload, employeeId }, select: goalSelect });
    await audit({ action: "GOAL_CREATED", entityType: "Goal", entityId: goal.id, newValue: goal }, db);
    return normalizeGoal(goal);
  });
}

export async function updateEmployeeGoal(employeeId, goalId, payload, audit) {
  return withSerializableTransaction(async (db) => {
    const oldGoal = await db.goal.findFirst({ where: { id: goalId, employeeId }, select: goalSelect });
    if (!oldGoal) throw createHttpError("Goal not found", 404);
    if (!employeeEditableStatuses.includes(oldGoal.status)) {
      throw createHttpError("Only draft or rework-required goals can be edited by employees");
    }
    const goal = await db.goal.update({ where: { id: goalId }, data: payload, select: goalSelect });
    await audit({ action: "GOAL_UPDATED", entityType: "Goal", entityId: goalId, oldValue: oldGoal, newValue: goal }, db);
    return normalizeGoal(goal);
  });
}

export async function deleteEmployeeGoal(employeeId, goalId, audit) {
  return withSerializableTransaction(async (db) => {
    const oldGoal = await db.goal.findFirst({ where: { id: goalId, employeeId }, select: goalSelect });
    if (!oldGoal) throw createHttpError("Goal not found", 404);
    if (!employeeEditableStatuses.includes(oldGoal.status)) {
      throw createHttpError("Only draft or rework-required goals can be deleted by employees");
    }
    await db.goal.delete({ where: { id: goalId } });
    await audit({ action: "GOAL_DELETED", entityType: "Goal", entityId: goalId, oldValue: oldGoal }, db);
  });
}

export async function submitEmployeeGoals(employeeId, audit) {
  return withSerializableTransaction(async (db) => {
    const planGoals = await db.goal.findMany({
      where: { employeeId },
      select: { id: true, weightage: true, status: true }
    });
    const draftGoals = planGoals.filter((goal) => employeeEditableStatuses.includes(goal.status));
    if (draftGoals.length === 0) throw createHttpError("Create at least one editable goal before submission");
    if (planGoals.reduce((sum, goal) => sum + goal.weightage, 0) !== 100) {
      throw createHttpError("Total goal weightage must equal 100% before submission");
    }

    await db.goal.updateMany({
      where: { employeeId, status: { in: employeeEditableStatuses } },
      data: { status: "SUBMITTED", managerNote: null, reviewedAt: null, reviewedById: null }
    });
    await audit({
      action: "GOAL_SUBMITTED", entityType: "User", entityId: employeeId,
      oldValue: draftGoals, newValue: draftGoals.map((goal) => ({ id: goal.id, status: "SUBMITTED", weightage: goal.weightage }))
    }, db);
    const goals = await db.goal.findMany({
      where: { employeeId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }, { id: "asc" }], select: goalSelect
    });
    return goals.map(normalizeGoal);
  });
}

export async function listManagerTeamGoals(managerId, pagination = {}) {
  const goals = await prisma.goal.findMany({
    where: { employee: { managerId }, status: { not: "DRAFT" } },
    orderBy: [{ employee: { name: "asc" } }, { updatedAt: "desc" }, { id: "asc" }],
    ...(pagination.limit ? { take: pagination.limit } : {}),
    ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
    select: goalSelect
  });
  return goals.map(normalizeGoal);
}

async function findManagerOwnedGoal(db, managerId, goalId) {
  const goal = await db.goal.findFirst({
    where: { id: goalId, employee: { managerId } },
    select: { ...goalSelect, employeeId: true }
  });
  if (!goal) throw createHttpError("Goal not found for this manager's team", 404);
  return goal;
}

export async function updateManagerGoalFields(managerId, goalId, payload, audit) {
  return withSerializableTransaction(async (db) => {
    const oldGoal = await findManagerOwnedGoal(db, managerId, goalId);
    if (!["SUBMITTED", "REWORK_REQUIRED"].includes(oldGoal.status)) {
      throw createHttpError("Only submitted or returned goals can be adjusted by managers");
    }
    if (payload.weightage !== undefined) {
      const teamGoals = await db.goal.findMany({
        where: { employeeId: oldGoal.employeeId },
        select: { id: true, weightage: true }
      });
      const total = teamGoals.reduce((sum, goal) => sum + (goal.id === goalId ? payload.weightage : goal.weightage), 0);
      if (total !== 100) throw createHttpError(`Total team member goal weightage must equal 100%. Proposed total is ${total}%.`);
    }
    const goal = await db.goal.update({ where: { id: goalId }, data: payload, select: goalSelect });
    await audit({ action: "GOAL_EDITED_BY_MANAGER", entityType: "Goal", entityId: goalId, oldValue: oldGoal, newValue: goal }, db);
    return normalizeGoal(goal);
  });
}

export async function approveManagerGoal(managerId, goalId, audit) {
  return withSerializableTransaction(async (db) => {
    const oldGoal = await findManagerOwnedGoal(db, managerId, goalId);
    if (oldGoal.status !== "SUBMITTED") throw createHttpError("Only submitted goals can be approved");
    const goal = await db.goal.update({
      where: { id: goalId },
      data: {
        status: "APPROVED", reviewedById: managerId, reviewedAt: new Date(),
        lockedAt: new Date(), managerNote: null
      },
      select: goalSelect
    });
    await audit({ action: "GOAL_APPROVED", entityType: "Goal", entityId: goalId, oldValue: oldGoal, newValue: goal }, db);
    return normalizeGoal(goal);
  });
}

export async function rejectManagerGoal(managerId, goalId, managerNote, audit) {
  return withSerializableTransaction(async (db) => {
    const oldGoal = await findManagerOwnedGoal(db, managerId, goalId);
    if (oldGoal.status !== "SUBMITTED") throw createHttpError("Only submitted goals can be sent for rework");
    const goal = await db.goal.update({
      where: { id: goalId },
      data: {
        status: "REWORK_REQUIRED", reviewedById: managerId, reviewedAt: new Date(),
        lockedAt: null, managerNote
      },
      select: goalSelect
    });
    await audit({ action: "GOAL_REWORK_REQUESTED", entityType: "Goal", entityId: goalId, oldValue: oldGoal, newValue: goal }, db);
    return normalizeGoal(goal);
  });
}
