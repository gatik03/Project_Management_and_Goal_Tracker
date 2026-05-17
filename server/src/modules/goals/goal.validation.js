import { z } from "zod";

const uomTypes = ["NUMBER", "PERCENTAGE", "CURRENCY", "BOOLEAN", "TEXT"];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const goalPayloadSchema = z.object({
  title: z.string().trim().min(3, "Goal title must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  thrustArea: z.string().trim().min(2, "Thrust area is required").max(80),
  uomType: z.enum(uomTypes),
  target: z.string().trim().min(1, "Target is required").max(120),
  weightage: z.coerce.number().int().min(10, "Minimum weightage is 10%").max(100),
  deadline: z.coerce.date().refine((date) => date >= startOfToday(), {
    message: "Deadline cannot be before today's date"
  })
});

export function formatZodError(error) {
  return error.errors.map((item) => item.message).join(", ");
}
