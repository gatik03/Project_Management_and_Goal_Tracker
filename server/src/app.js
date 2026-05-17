import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { allowedOrigins } from "./config/env.js";
import { attachAuditLogger } from "./middleware/audit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { employeeCheckInRouter } from "./modules/checkins/employee-checkin.routes.js";
import { managerCheckInRouter } from "./modules/checkins/manager-checkin.routes.js";
import { goalRouter } from "./modules/goals/goal.routes.js";
import { managerGoalRouter } from "./modules/goals/manager-goal.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      }
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(attachAuditLogger);
  app.use(morgan("dev"));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/employee/goals", goalRouter);
  app.use("/api/employee/check-ins", employeeCheckInRouter);
  app.use("/api/manager", managerGoalRouter);
  app.use("/api/manager/check-ins", managerCheckInRouter);
  app.use("/api/reports", reportRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
