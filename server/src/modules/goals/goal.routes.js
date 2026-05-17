import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createEmployeeGoal,
  deleteEmployeeGoal,
  listEmployeeGoals,
  submitEmployeeGoals,
  updateEmployeeGoal
} from "./goal.service.js";
import { formatZodError, goalPayloadSchema } from "./goal.validation.js";

const router = Router();

router.use(requireAuth, requireRole("EMPLOYEE"));

router.get("/", async (request, response, next) => {
  try {
    const goals = await listEmployeeGoals(request.user.id);
    return response.json({ goals });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const payload = goalPayloadSchema.parse(request.body);
    const goal = await createEmployeeGoal(request.user.id, payload);
    return response.status(201).json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

router.put("/:goalId", async (request, response, next) => {
  try {
    const payload = goalPayloadSchema.parse(request.body);
    const goal = await updateEmployeeGoal(request.user.id, request.params.goalId, payload);
    return response.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

router.delete("/:goalId", async (request, response, next) => {
  try {
    await deleteEmployeeGoal(request.user.id, request.params.goalId);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/submit", async (request, response, next) => {
  try {
    const goals = await submitEmployeeGoals(request.user.id);
    return response.json({ goals });
  } catch (error) {
    return next(error);
  }
});

export { router as goalRouter };
