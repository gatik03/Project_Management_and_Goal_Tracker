import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export async function requireAuth(request, response, next) {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Authentication token is required" });
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        title: true,
        isActive: true
      }
    });

    if (!user?.isActive) {
      return response.status(401).json({ message: "User account is not active" });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired authentication token" });
  }
}
