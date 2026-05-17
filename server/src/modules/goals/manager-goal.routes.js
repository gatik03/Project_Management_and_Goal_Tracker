import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  approveManagerGoal,
  listManagerTeamGoals,
  rejectManagerGoal,
  updateManagerGoalFields
} from "./goal.service.js";
import { formatZodError } from "./goal.validation.js";

const router = Router();

const managerGoalUpdateSchema = z.object({
  target: z.string().trim().min(1, "Target is required").max(120).optional(),
  weightage: z.coerce.number().int().min(10, "Minimum weightage is 10%").max(100).optional()
}).refine((payload) => payload.target !== undefined || payload.weightage !== undefined, {
  message: "At least one editable field is required"
});

const rejectionSchema = z.object({
  managerNote: z.string().trim().min(5, "Rejection reason must be at least 5 characters").max(500)
});

router.use(requireAuth, requireRole("MANAGER"));

router.get("/goals", async (request, response, next) => {
  try {
    const goals = await listManagerTeamGoals(request.user.id);
    return response.json({ goals });
  } catch (error) {
    return next(error);
  }
});

router.patch("/goals/:goalId", async (request, response, next) => {
  try {
    const payload = managerGoalUpdateSchema.parse(request.body);
    const goal = await updateManagerGoalFields(request.user.id, request.params.goalId, payload);
    return response.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

router.post("/goals/:goalId/approve", async (request, response, next) => {
  try {
    const goal = await approveManagerGoal(request.user.id, request.params.goalId);
    return response.json({ goal });
  } catch (error) {
    return next(error);
  }
});

router.post("/goals/:goalId/reject", async (request, response, next) => {
  try {
    const payload = rejectionSchema.parse(request.body);
    const goal = await rejectManagerGoal(request.user.id, request.params.goalId, payload.managerNote);
    return response.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

export { router as managerGoalRouter };
