import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getCurrentUser, login, rolePermissions } from "./auth.service.js";

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 8 * 60 * 60 * 1000
};

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

    response.cookie(env.JWT_COOKIE_NAME, result.token, cookieOptions);

    return response.json({ user: result.user });
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

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    return response.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (_request, response) => {
  response.clearCookie(env.JWT_COOKIE_NAME, cookieOptions);
  return response.json({ message: "Logged out successfully" });
});

router.get("/permissions", requireAuth, (request, response) => {
  return response.json({
    role: request.user.role,
    permissions: rolePermissions[request.user.role] ?? []
  });
});

router.get("/admin-check", requireAuth, requireRole("ADMIN"), (_request, response) => {
  return response.json({ message: "Admin role verified" });
});

export { router as authRouter };
