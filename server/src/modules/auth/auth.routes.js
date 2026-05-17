import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { getCurrentUser, login } from "./auth.service.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

router.post("/login", async (request, response, next) => {
  try {
    const credentials = loginSchema.parse(request.body);
    const result = await login(credentials);

    if (!result) {
      return response.status(401).json({ message: "Invalid email or password" });
    }

    return response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Invalid login payload" });
    }

    return next(error);
  }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = await getCurrentUser(request.user.id);
    return response.json({ user });
  } catch (error) {
    return next(error);
  }
});

export { router as authRouter };
