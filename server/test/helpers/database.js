import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/prisma.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(serverRoot, "..");

export function assertTestDatabase() {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const name = databaseUrl.pathname.slice(1);
  if (process.env.NODE_ENV !== "test" || !name.endsWith("_test")) {
    throw new Error("Tests require NODE_ENV=test and a dedicated database ending in _test");
  }
}

export function migrateTestDatabase() {
  assertTestDatabase();
  execFileSync(path.join(repoRoot, "node_modules/.bin/prisma"), [
    "migrate", "deploy", "--schema", path.join(serverRoot, "prisma/schema.prisma")
  ], { cwd: repoRoot, env: process.env, stdio: "pipe" });
}

export async function truncateTestDatabase() {
  assertTestDatabase();
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "QuarterlyCheckIn", "Goal", "AuditLog", "QuarterlyCycleConfig", "User" RESTART IDENTITY CASCADE'
  );
}

export async function createUser(role, email, managerId = null) {
  return prisma.user.create({
    data: {
      name: email.split("@")[0], email, role,
      department: "Operations", title: `${role} test user`, managerId,
      passwordHash: await bcrypt.hash("Password123!", 4)
    }
  });
}

export function bearer(user) {
  return `Bearer ${jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    algorithm: "HS256", subject: user.id, expiresIn: "1h"
  })}`;
}

export function goalPayload(weightage = 50, title = "Improve BLDC motor efficiency") {
  return {
    title,
    description: "Raise measured motor efficiency at rated load",
    thrustArea: "Energy efficiency",
    uomType: "PERCENTAGE",
    target: "92",
    weightage,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  };
}

export async function createGoal(employeeId, status = "DRAFT", weightage = 50, title = "Improve BLDC motor efficiency") {
  return prisma.goal.create({
    data: {
      ...goalPayload(weightage, title),
      deadline: new Date(Date.now() + 30 * 86400000),
      employeeId, status
    }
  });
}
