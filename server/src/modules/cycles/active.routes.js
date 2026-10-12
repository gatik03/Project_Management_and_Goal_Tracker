import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/active", requireAuth, async (_request, response, next) => {
  try {
    const cycle = await prisma.quarterlyCycleConfig.findFirst({
      where: { isActive: true },
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    });
    return response.json({
      cycle: cycle
        ? {
            ...cycle,
            startDate: cycle.startDate.toISOString().slice(0, 10),
            endDate: cycle.endDate.toISOString().slice(0, 10),
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
});

export { router as activeCycleRouter };
