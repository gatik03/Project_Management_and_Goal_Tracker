import { prisma } from "../../config/prisma.js";
import { withSerializableTransaction } from "../../config/transaction.js";
import { notify } from "../notifications/notification.service.js";

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
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
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

export async function submitEmployeeGoals(employeeId, audit, actorName) {
  return withSerializableTransaction(async (db) => {
    const employee = await db.user.findUnique({
      where: { id: employeeId }, select: { managerId: true, name: true }
    });
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
    await notify(db, {
      recipientId: employee.managerId, type: "PLAN_SUBMITTED",
      actorName: actorName ?? employee.name,
      title: `${employee.name} submitted a plan`,
      detail: `${draftGoals.length} goals are ready for review.`,
      href: `/team/${employeeId}`
    });
    const goals = await db.goal.findMany({
      where: { employeeId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: goalSelect
    });
    return goals.map(normalizeGoal);
  });
}

export async function listManagerTeamGoals(managerId, pagination = {}) {
  const goals = await prisma.goal.findMany({
    where: { employee: { managerId }, status: { not: "DRAFT" } },
    orderBy: [{ employee: { name: "asc" } }, { createdAt: "asc" }, { id: "asc" }],
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

export async function updateManagerGoalFields(managerId, goalId, payload, audit, actorName) {
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
    if (payload.target !== undefined && payload.target !== oldGoal.target) {
      await notify(db, {
        recipientId: oldGoal.employeeId, type: "GOAL_TARGET_CHANGED",
        actorName, title: `${actorName} changed a goal target`,
        detail: `${goal.title}: ${oldGoal.target} → ${goal.target}`,
        href: `/plan/${goalId}`
      });
    }
    if (payload.weightage !== undefined && payload.weightage !== oldGoal.weightage) {
      await notify(db, {
        recipientId: oldGoal.employeeId, type: "GOAL_WEIGHTS_CHANGED",
        actorName, title: `${actorName} changed a goal weight`,
        detail: `${goal.title}: ${oldGoal.weightage}% → ${goal.weightage}%`,
        href: `/plan/${goalId}`
      });
    }
    return normalizeGoal(goal);
  });
}

export async function rebalanceManagerPlan(managerId, employeeId, changes, audit, actorName) {
  return withSerializableTransaction(async (db) => {
    const employee = await db.user.findFirst({
      where: { id: employeeId, managerId }, select: { id: true, name: true }
    });
    if (!employee) throw createHttpError("Direct report not found", 404);
    const plan = await db.goal.findMany({
      where: { employeeId }, select: { ...goalSelect, employeeId: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    if (plan.some((goal) => goal.status === "DRAFT")) {
      throw createHttpError("The employee has draft goals. Ask them to submit the plan before changing weights.", 409);
    }
    const byId = new Map(plan.map((goal) => [goal.id, goal]));
    for (const change of changes) {
      const goal = byId.get(change.goalId);
      if (!goal) throw createHttpError("Goal not found for this direct report", 404);
      if (!["SUBMITTED", "REWORK_REQUIRED"].includes(goal.status)) {
        throw createHttpError("Approved or locked goal weights cannot be changed", 409);
      }
      if (goal.updatedAt.toISOString() !== change.expectedUpdatedAt) {
        throw createHttpError("This plan changed since you opened it. Refresh and try again.", 409);
      }
    }
    const proposed = new Map(changes.map((item) => [item.goalId, item.weightage]));
    const total = plan.reduce((sum, goal) => sum + (proposed.get(goal.id) ?? goal.weightage), 0);
    if (total !== 100) throw createHttpError(`Goal weights must total exactly 100%. Proposed total is ${total}%.`);
    const changed = changes.filter((item) => byId.get(item.goalId).weightage !== item.weightage);
    if (!changed.length) return plan.map(normalizeGoal);
    for (const change of changed) {
      const oldGoal = byId.get(change.goalId);
      const updated = await db.goal.update({
        where: { id: change.goalId }, data: { weightage: change.weightage },
        select: goalSelect
      });
      await audit({
        action: "GOAL_EDITED_BY_MANAGER", entityType: "Goal", entityId: change.goalId,
        oldValue: oldGoal, newValue: updated
      }, db);
    }
    await notify(db, {
      recipientId: employeeId, type: "GOAL_WEIGHTS_CHANGED", actorName,
      title: `${actorName} rebalanced your plan`,
      detail: changed.map(({ goalId, weightage }) =>
        `${byId.get(goalId).title}: ${byId.get(goalId).weightage}% → ${weightage}%`
      ).join("; "),
      href: "/plan"
    });
    const refreshed = await db.goal.findMany({
      where: { employeeId }, select: goalSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return refreshed.map(normalizeGoal);
  });
}

export async function approveManagerGoal(managerId, goalId, audit, actorName) {
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
    await notify(db, {
      recipientId: oldGoal.employeeId, type: "GOAL_APPROVED", actorName,
      title: `${actorName} approved a goal`, detail: goal.title,
      href: `/plan/${goalId}`
    });
    return normalizeGoal(goal);
  });
}

export async function rejectManagerGoal(managerId, goalId, managerNote, audit, actorName) {
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
    await notify(db, {
      recipientId: oldGoal.employeeId, type: "GOAL_REWORK_REQUESTED", actorName,
      title: `${actorName} sent a goal back`,
      detail: `${goal.title}: ${managerNote}`, href: `/plan/${goalId}`
    });
    return normalizeGoal(goal);
  });
}
