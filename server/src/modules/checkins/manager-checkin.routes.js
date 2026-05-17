import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { addManagerCheckInComment, listManagerQuarterlyCheckIns } from "./checkin.service.js";
import { formatZodError, managerCommentSchema } from "./checkin.validation.js";

const router = Router();

router.use(requireAuth, requireRole("MANAGER"));

router.get("/", async (request, response, next) => {
  try {
    const goals = await listManagerQuarterlyCheckIns(request.user.id);
    return response.json({ goals });
  } catch (error) {
    return next(error);
  }
});

router.post("/:checkInId/comment", async (request, response, next) => {
  try {
    const payload = managerCommentSchema.parse(request.body);
    const checkIn = await addManagerCheckInComment(request.user.id, request.params.checkInId, payload.managerComment);
    return response.json({ checkIn });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: formatZodError(error) });
    }

    return next(error);
  }
});

export { router as managerCheckInRouter };
