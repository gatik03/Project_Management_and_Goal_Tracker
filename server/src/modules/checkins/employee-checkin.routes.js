import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { listEmployeeQuarterlyCheckIns, upsertEmployeeCheckIn } from "./checkin.service.js";
import { checkInPayloadSchema, formatZodError } from "./checkin.validation.js";

const router = Router();

router.use(requireAuth, requireRole("EMPLOYEE"));

router.get("/", async (request, response, next) => {
  try {
    const goals = await listEmployeeQuarterlyCheckIns(request.user.id);
    return response.json({ goals });
  } catch (error) {
    return next(error);
  }
});

router.put("/:goalId/:quarter", async (request, response, next) => {
  try {
    const quarter = z.enum(["Q1", "Q2", "Q3", "Q4"]).parse(request.params.quarter);
    const payload = checkInPayloadSchema.parse(request.body);
    const checkIn = await upsertEmployeeCheckIn(request.user.id, request.params.goalId, quarter, payload);
    return response.json({ checkIn });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

export { router as employeeCheckInRouter };
