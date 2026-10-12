import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { createEmployeeGoal } from "../src/modules/goals/goal.service.js";
import {
  bearer, createGoal, createUser, goalPayload, migrateTestDatabase, truncateTestDatabase
} from "./helpers/database.js";

const app = createApp();
const origin = "http://app.test";
let admin;
let manager;
let otherManager;
let employee;
let otherEmployee;

function call(method, path, user) {
  let outgoing = request(app)[method](path).set("Origin", origin);
  if (user) outgoing = outgoing.set("Authorization", bearer(user));
  return outgoing;
}

beforeAll(() => migrateTestDatabase());
beforeEach(async () => {
  await truncateTestDatabase();
  admin = await createUser("ADMIN", "admin@test.local");
  manager = await createUser("MANAGER", "manager@test.local");
  otherManager = await createUser("MANAGER", "other-manager@test.local");
  employee = await createUser("EMPLOYEE", "employee@test.local", manager.id);
  otherEmployee = await createUser("EMPLOYEE", "other-employee@test.local", otherManager.id);
});
afterAll(async () => prisma.$disconnect());

describe("authentication and role boundaries", () => {
  it("logs in, restores the cookie session, and logs out", async () => {
    const agent = request.agent(app);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
    const login = await agent.post("/api/auth/login").set("Origin", origin).send({
      email: employee.email, password: "Password123!"
    });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("EMPLOYEE");
    expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
    expect((await agent.get("/api/auth/me")).body.user.id).toBe(employee.id);
    expect((await agent.post("/api/auth/logout").set("Origin", origin).set("X-Requested-With", "XMLHttpRequest")).status).toBe(200);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("uses the same public login failure for unknown, inactive, and wrong-password users and audits it", async () => {
    await prisma.user.update({ where: { id: otherEmployee.id }, data: { isActive: false } });
    for (const [email, password] of [
      ["missing@test.local", "Password123!"],
      [otherEmployee.email, "Password123!"],
      [employee.email, "wrong-password"]
    ]) {
      const result = await call("post", "/api/auth/login").send({ email, password });
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ message: "Invalid email or password" });
    }
    expect(await prisma.auditLog.count({ where: { action: "LOGIN_FAILED" } })).toBe(3);
  });

  const readRoutes = [
    ["/api/auth/me", ["EMPLOYEE", "MANAGER", "ADMIN"]],
    ["/api/auth/permissions", ["EMPLOYEE", "MANAGER", "ADMIN"]],
    ["/api/cycles/active", ["EMPLOYEE", "MANAGER", "ADMIN"]],
    ["/api/auth/admin-check", ["ADMIN"]],
    ["/api/employee/goals", ["EMPLOYEE"]],
    ["/api/employee/check-ins", ["EMPLOYEE"]],
    ["/api/manager/goals", ["MANAGER"]],
    ["/api/manager/check-ins", ["MANAGER"]],
    ["/api/admin/dashboard", ["ADMIN"]],
    ["/api/admin/users", ["ADMIN"]],
    ["/api/admin/hierarchy", ["ADMIN"]],
    ["/api/admin/goals/unlockable", ["ADMIN"]],
    ["/api/admin/audit-logs", ["ADMIN"]],
    ["/api/admin/cycle-configs", ["ADMIN"]],
    ["/api/reports/dashboard", ["MANAGER", "ADMIN"]],
    ["/api/reports/export.csv", ["MANAGER", "ADMIN"]],
    ["/api/reports/export.xls", ["MANAGER", "ADMIN"]]
  ];

  it.each(readRoutes)("enforces the complete GET RBAC matrix for %s", async (path, allowed) => {
    expect((await call("get", path)).status).toBe(401);
    for (const user of [employee, manager, admin]) {
      const response = await call("get", path, user);
      expect(response.status).toBe(allowed.includes(user.role) ? 200 : 403);
    }
  });

  it("shows the configured active quarter to every signed-in role", async () => {
    await prisma.quarterlyCycleConfig.create({ data: {
      year: 2026, quarter: "Q4", startDate: new Date("2026-10-01"),
      endDate: new Date("2026-12-31"), isActive: true
    } });
    for (const user of [employee, manager, admin]) {
      const response = await call("get", "/api/cycles/active", user);
      expect(response.status).toBe(200);
      expect(response.body.cycle).toMatchObject({ year: 2026, quarter: "Q4", endDate: "2026-12-31" });
    }
  });

  it("rejects other roles before parsing every protected write", async () => {
    const routes = [
      ["post", "/api/employee/goals", "EMPLOYEE"],
      ["put", "/api/employee/goals/00000000-0000-4000-a000-000000000001", "EMPLOYEE"],
      ["delete", "/api/employee/goals/00000000-0000-4000-a000-000000000001", "EMPLOYEE"],
      ["post", "/api/employee/goals/submit", "EMPLOYEE"],
      ["put", "/api/employee/check-ins/00000000-0000-4000-a000-000000000001/Q1", "EMPLOYEE"],
      ["patch", "/api/manager/goals/00000000-0000-4000-a000-000000000001", "MANAGER"],
      ["post", "/api/manager/goals/00000000-0000-4000-a000-000000000001/approve", "MANAGER"],
      ["post", "/api/manager/goals/00000000-0000-4000-a000-000000000001/reject", "MANAGER"],
      ["post", "/api/manager/check-ins/00000000-0000-4000-a000-000000000001/comment", "MANAGER"],
      ["patch", `/api/admin/users/${employee.id}`, "ADMIN"],
      ["post", "/api/admin/goals/00000000-0000-4000-a000-000000000001/unlock", "ADMIN"],
      ["post", "/api/admin/cycle-configs", "ADMIN"]
    ];
    for (const [method, path, allowed] of routes) {
      expect((await call(method, path)).status).toBe(401);
      for (const user of [employee, manager, admin].filter((candidate) => candidate.role !== allowed)) {
        expect((await call(method, path, user)).status).toBe(403);
      }
    }
  });
});

describe("goals and reviews", () => {
  it("allows only one concurrent creation of the eighth goal", async () => {
    for (let index = 0; index < 7; index += 1) {
      await createGoal(employee.id, "DRAFT", 10, `Improve motor process ${index}`);
    }
    const attempts = await Promise.all(["A", "B"].map((suffix) =>
      call("post", "/api/employee/goals", employee).send(goalPayload(10, `Improve motor process ${suffix}`))
    ));
    expect(attempts.map((result) => result.status).sort()).toEqual([201, 400]);
    expect(await prisma.goal.count({ where: { employeeId: employee.id } })).toBe(8);
  });

  it("enforces 10% minimum, eight-goal maximum, and exactly 100% on submission", async () => {
    expect((await call("post", "/api/employee/goals", employee).send(goalPayload(9))).status).toBe(400);
    for (let index = 0; index < 8; index += 1) {
      expect((await call("post", "/api/employee/goals", employee).send(
        goalPayload(10, `Improve BLDC motor efficiency ${index}`)
      )).status).toBe(201);
    }
    expect((await call("post", "/api/employee/goals", employee).send(
      goalPayload(10, "Improve one more process")
    )).status).toBe(400);
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(400);
    const goals = (await call("get", "/api/employee/goals", employee)).body.goals;
    expect((await call("put", `/api/employee/goals/${goals[0].id}`, employee).send(
      goalPayload(30, goals[0].title)
    )).status).toBe(200);
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: "GOAL_SUBMITTED" } })).toBeGreaterThan(0);
  });

  it("allows draft → submitted → rework → submitted → approved and rejects illegal transitions", async () => {
    const goal = await createGoal(employee.id, "DRAFT", 100);
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(200);
    expect((await call("put", `/api/employee/goals/${goal.id}`, employee).send(goalPayload(100))).status).toBe(400);
    expect((await call("post", `/api/manager/goals/${goal.id}/reject`, manager).send({
      managerNote: "Specify the baseline and source"
    })).status).toBe(200);
    expect((await call("post", `/api/manager/goals/${goal.id}/approve`, manager)).status).toBe(400);
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(200);
    expect((await call("post", `/api/manager/goals/${goal.id}/approve`, manager)).status).toBe(200);
    expect((await call("post", `/api/manager/goals/${goal.id}/approve`, manager)).status).toBe(400);
    expect((await call("post", `/api/manager/goals/${goal.id}/reject`, manager).send({
      managerNote: "This should not work after approval"
    })).status).toBe(400);
    expect(await prisma.auditLog.count({ where: { action: "GOAL_APPROVED" } })).toBe(1);
  });

  it("checks the whole plan when resubmitting a returned goal alongside an approved goal", async () => {
    await createGoal(employee.id, "APPROVED", 50, "Improve motor efficiency");
    const returned = await createGoal(employee.id, "REWORK_REQUIRED", 50, "Reduce supplier defects");
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(200);
    await prisma.goal.update({ where: { id: returned.id }, data: { status: "REWORK_REQUIRED", weightage: 100 } });
    expect((await call("post", "/api/employee/goals/submit", employee)).status).toBe(400);
  });

  it("keeps manager writes scoped to direct reports and rejects a non-100% weight edit", async () => {
    const first = await createGoal(employee.id, "SUBMITTED", 50);
    await createGoal(employee.id, "SUBMITTED", 50, "Reduce controller defects");
    const foreign = await createGoal(otherEmployee.id, "SUBMITTED", 100);
    expect((await call("patch", `/api/manager/goals/${foreign.id}`, manager).send({ target: "95" })).status).toBe(404);
    expect((await call("post", `/api/manager/goals/${foreign.id}/approve`, manager)).status).toBe(404);
    expect((await call("post", `/api/manager/goals/${foreign.id}/reject`, manager).send({ managerNote: "Check target" })).status).toBe(404);
    expect((await call("patch", `/api/manager/goals/${first.id}`, manager).send({ weightage: 60 })).status).toBe(400);
    expect((await call("patch", `/api/manager/goals/${first.id}`, manager).send({ target: "94" })).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: "GOAL_EDITED_BY_MANAGER" } })).toBe(1);
  });

  it("records check-in saves, manager comments, unlocks, and cycle/user changes", async () => {
    const goal = await createGoal(employee.id, "APPROVED", 100);
    const checkIn = await call("put", `/api/employee/check-ins/${goal.id}/Q1`, employee).send({
      plannedTarget: 92, actualAchievement: 108, status: "COMPLETED", employeeNote: "Validated at rated load"
    });
    expect(checkIn.status).toBe(200);
    expect(checkIn.body.checkIn.progress.achievementToTargetPercent).toBe(117);
    expect((await call("post", `/api/manager/check-ins/${checkIn.body.checkIn.id}/comment`, manager).send({
      managerComment: "Confirmed with the lab sheet"
    })).status).toBe(200);
    expect((await call("post", `/api/admin/goals/${goal.id}/unlock`, admin).send({
      reason: "The supplier specification changed"
    })).status).toBe(200);
    expect((await call("patch", `/api/admin/users/${employee.id}`, admin).send({ title: "Lead engineer" })).status).toBe(200);
    expect((await call("post", "/api/admin/cycle-configs", admin).send({
      year: 2027, quarter: "Q1", startDate: "2027-01-01", endDate: "2027-03-31", isActive: false
    })).status).toBe(200);
    for (const action of [
      "CHECKIN_SAVED", "CHECKIN_COMMENTED", "GOAL_UNLOCKED", "USER_UPDATED", "CYCLE_CONFIG_UPDATED"
    ]) {
      expect(await prisma.auditLog.count({ where: { action } })).toBe(1);
    }
  });

  it("enforces the weight constraint and append-only audit rows in PostgreSQL", async () => {
    await expect(createGoal(employee.id, "DRAFT", 9)).rejects.toThrow();
    const created = await call("post", "/api/employee/goals", employee).send(goalPayload(100));
    expect(created.status).toBe(201);
    const row = await prisma.auditLog.findFirst({ where: { action: "GOAL_CREATED" } });
    expect(row).toBeTruthy();
    await expect(prisma.auditLog.update({ where: { id: row.id }, data: { entityType: "Changed" } })).rejects.toThrow();
    await expect(prisma.auditLog.delete({ where: { id: row.id } })).rejects.toThrow();
  });

  it("rolls back a goal mutation when its audit insert fails", async () => {
    await expect(createEmployeeGoal(employee.id, {
      ...goalPayload(100), deadline: new Date(Date.now() + 30 * 86400000)
    }, async () => { throw new Error("audit unavailable"); })).rejects.toThrow("audit unavailable");
    expect(await prisma.goal.count({ where: { employeeId: employee.id } })).toBe(0);
  });

  it("supports opt-in cursor pagination without changing the array response shape", async () => {
    for (let index = 0; index < 3; index += 1) {
      await createGoal(employee.id, "DRAFT", 10, `Improve motor process ${index}`);
    }
    const first = await call("get", "/api/employee/goals?limit=2", employee);
    expect(first.body).toEqual({ goals: expect.any(Array) });
    expect(first.body.goals).toHaveLength(2);
    const second = await call("get", `/api/employee/goals?limit=2&cursor=${first.body.goals.at(-1).id}`, employee);
    expect(second.body.goals).toHaveLength(1);
    const people = await call("get", "/api/admin/users?limit=2", admin);
    expect(people.body).toEqual({ users: expect.any(Array) });
    expect(people.body.users).toHaveLength(2);
    await call("post", "/api/employee/goals", employee).send(goalPayload(10, "Reduce motor losses"));
    await call("post", "/api/employee/goals", employee).send(goalPayload(10, "Reduce inverter losses"));
    const firstAudit = await call("get", "/api/admin/audit-logs?limit=1", admin);
    const secondAudit = await call("get", `/api/admin/audit-logs?limit=1&cursor=${firstAudit.body.auditLogs[0].id}`, admin);
    expect(firstAudit.body.auditLogs).toHaveLength(1);
    expect(secondAudit.body.auditLogs).toHaveLength(1);
    expect(secondAudit.body.auditLogs[0].id).not.toBe(firstAudit.body.auditLogs[0].id);
  });
});

describe("exports and request security", () => {
  it("resolves the client IP across the Vercel and Render proxy hops", async () => {
    let observedIp;
    const probe = createApp({ onRequest: (incoming) => { observedIp = incoming.ip; } });
    const response = await request(probe).get("/api/health")
      .set("X-Forwarded-For", "198.51.100.42, 203.0.113.4");
    expect(response.status).toBe(200);
    expect(probe.get("trust proxy")).toBe(2);
    expect(observedIp).toBe("198.51.100.42");
  });

  it("keeps report totals and quarter filtering stable while aggregations move to SQL", async () => {
    const first = await createGoal(employee.id, "APPROVED", 50);
    await createGoal(employee.id, "SUBMITTED", 50, "Reduce motor noise");
    await prisma.quarterlyCheckIn.createMany({ data: [
      { goalId: first.id, quarter: "Q1", plannedTarget: 100, actualAchievement: 120, status: "COMPLETED" },
      { goalId: first.id, quarter: "Q2", plannedTarget: 100, actualAchievement: 50, status: "ON_TRACK" }
    ] });
    const dashboard = (await call("get", "/api/reports/dashboard", manager)).body.dashboard;
    expect(dashboard.summary).toEqual({ totalGoals: 2, totalCheckIns: 2, averageAchievement: 85, completedCheckIns: 1 });
    expect(dashboard.goalDistribution.find((row) => row.status === "APPROVED").count).toBe(1);
    expect(dashboard.trendByQuarter.find((row) => row.quarter === "Q1").averageProgress).toBe(120);
    const filtered = (await call("get", "/api/reports/dashboard?quarter=Q2", manager)).body.dashboard;
    expect(filtered.summary.totalCheckIns).toBe(1);
    expect(filtered.summary.averageAchievement).toBe(50);
    const byStatus = (await call("get", "/api/reports/dashboard?status=SUBMITTED", manager)).body.dashboard;
    expect(byStatus.summary.totalGoals).toBe(1);
    expect(byStatus.summary.totalCheckIns).toBe(0);
  });

  it("neutralises spreadsheet formulas in CSV and returns an actual xlsx workbook", async () => {
    const goal = await createGoal(employee.id, "APPROVED", 100, "=2+2 motor output");
    await prisma.quarterlyCheckIn.create({ data: {
      goalId: goal.id, quarter: "Q1", plannedTarget: 92,
      actualAchievement: 100, status: "COMPLETED"
    } });
    const csv = await call("get", "/api/reports/export.csv", manager);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain("'=2+2 motor output");
    const excel = await call("get", "/api/reports/export.xls", manager);
    expect(excel.status).toBe(200);
    expect(excel.headers["content-disposition"]).toContain(".xlsx");
    expect(excel.headers["content-type"]).toContain("spreadsheetml.sheet");
  });

  it("rejects a missing or unapproved Origin on writes", async () => {
    const payload = { email: employee.email, password: "Password123!" };
    expect((await request(app).post("/api/auth/login").send(payload)).status).toBe(403);
    expect((await request(app).post("/api/auth/login").set("Origin", "https://evil.example").send(payload)).status).toBe(403);
  });

  it("maps malformed report filters to 400 without a stack trace", async () => {
    const response = await call("get", "/api/reports/dashboard?quarter=Q8", manager);
    expect(response.status).toBe(400);
    expect(response.body.message).toBeTypeOf("string");
    expect(response.body).not.toHaveProperty("stack");
  });
});
