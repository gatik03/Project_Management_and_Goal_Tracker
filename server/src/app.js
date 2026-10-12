import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { allowedOrigins, env } from "./config/env.js";
import { attachAuditLogger } from "./middleware/audit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { attachRequestContext } from "./middleware/requestContext.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { employeeCheckInRouter } from "./modules/checkins/employee-checkin.routes.js";
import { managerCheckInRouter } from "./modules/checkins/manager-checkin.routes.js";
import { goalRouter } from "./modules/goals/goal.routes.js";
import { managerGoalRouter } from "./modules/goals/manager-goal.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { activeCycleRouter } from "./modules/cycles/active.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";

export function createApp({ onRequest } = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use(attachRequestContext);
  if (onRequest) app.use((request, _response, next) => { onRequest(request); next(); });
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

        const error = new Error("Origin is not allowed by CORS");
        error.statusCode = 403;
        return callback(error);
      }
    })
  );
  app.use(cookieParser());
  app.use((request, response, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
    const origin = request.get("Origin");
    if (!origin || !allowedOrigins.includes(origin)) {
      return response.status(403).json({ message: "Request origin is not allowed" });
    }
    // Cookie-authenticated writes also require a non-simple header, so a
    // cross-site HTML form cannot perform a state change through the proxy.
    if (request.cookies?.[env.JWT_COOKIE_NAME] && request.get("X-Requested-With") !== "XMLHttpRequest") {
      return response.status(403).json({ message: "Request header is required" });
    }
    return next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(hpp()); // Prevent HTTP Parameter Pollution
  app.use(attachAuditLogger);

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/cycles", activeCycleRouter);
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
