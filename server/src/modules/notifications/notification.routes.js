import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listNotifications, markAllNotificationsRead, markNotificationRead
} from "./notification.service.js";

const router = Router();
const idSchema = z.string().uuid();
const pageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: idSchema.optional()
}).strict();

router.use(requireAuth, requireRole("EMPLOYEE", "MANAGER"));

router.get("/", async (request, response, next) => {
  try {
    return response.json(await listNotifications(request.user.id, pageSchema.parse(request.query)));
  } catch (error) { return next(error); }
});

router.post("/read-all", async (request, response, next) => {
  try {
    z.object({}).strict().parse(request.body ?? {});
    const updatedCount = await markAllNotificationsRead(request.user.id, request.audit);
    return response.json({ updatedCount });
  } catch (error) { return next(error); }
});

router.patch("/:id/read", async (request, response, next) => {
  try {
    z.object({}).strict().parse(request.body ?? {});
    const notification = await markNotificationRead(
      request.user.id, idSchema.parse(request.params.id), request.audit
    );
    return response.json({ notification });
  } catch (error) { return next(error); }
});

export { router as notificationRouter };
