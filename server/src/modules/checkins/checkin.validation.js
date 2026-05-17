import { z } from "zod";

export const checkInPayloadSchema = z.object({
  plannedTarget: z.coerce.number().min(0, "Planned target cannot be negative"),
  actualAchievement: z.coerce.number().min(0, "Actual achievement cannot be negative"),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
  employeeNote: z.string().trim().max(500).optional().nullable()
});

export const managerCommentSchema = z.object({
  managerComment: z.string().trim().min(3, "Manager comment must be at least 3 characters").max(500)
});

export function formatZodError(error) {
  return error.errors.map((item) => item.message).join(", ");
}
