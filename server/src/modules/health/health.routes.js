import { Router } from "express";
import { prisma } from "../../config/prisma.js";

const router = Router();

router.get("/", async (_request, response) => {
  let database = "unavailable";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "available";
  } catch {
    database = "unavailable";
  }

  response.json({
    status: "ok",
    service: "goal-portal-api",
    database,
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
