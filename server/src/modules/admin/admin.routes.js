import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getAdminDashboard,
  listAuditLogs,
  listCycleConfigs,
  listOrgHierarchy,
  listUnlockableGoals,
  listUsers,
  unlockGoal,
  updateUser,
  upsertCycleConfig
} from "./admin.service.js";

const router = Router();

const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  department: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
  managerId: z.string().uuid().nullable().optional()
});

const unlockSchema = z.object({
  reason: z.string().trim().min(5, "Unlock reason must be at least 5 characters").max(500)
});

const cycleSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false)
});

function formatZodError(error) {
  return error.errors.map((item) => item.message).join(", ");
}

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", async (_request, response, next) => {
  try {
    return response.json({ dashboard: await getAdminDashboard() });
  } catch (error) {
    return next(error);
  }
});

router.get("/users", async (_request, response, next) => {
  try {
    return response.json({ users: await listUsers() });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:userId", async (request, response, next) => {
  try {
    const payload = userUpdateSchema.parse(request.body);
    const user = await updateUser(request.params.userId, payload, request.audit);
    return response.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

router.get("/hierarchy", async (_request, response, next) => {
  try {
    return response.json({ hierarchy: await listOrgHierarchy() });
  } catch (error) {
    return next(error);
  }
});

router.get("/goals/unlockable", async (_request, response, next) => {
  try {
    return response.json({ goals: await listUnlockableGoals() });
  } catch (error) {
    return next(error);
  }
});

router.post("/goals/:goalId/unlock", async (request, response, next) => {
  try {
    const payload = unlockSchema.parse(request.body);
    const goal = await unlockGoal(request.params.goalId, payload.reason, request.audit);
    return response.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

router.get("/audit-logs", async (_request, response, next) => {
  try {
    return response.json({ auditLogs: await listAuditLogs() });
  } catch (error) {
    return next(error);
  }
});

router.get("/cycle-configs", async (_request, response, next) => {
  try {
    return response.json({ cycles: await listCycleConfigs() });
  } catch (error) {
    return next(error);
  }
});

router.post("/cycle-configs", async (request, response, next) => {
  try {
    const payload = cycleSchema.parse(request.body);
    const cycle = await upsertCycleConfig(payload, request.audit);
    return response.json({ cycle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

export { router as adminRouter };
