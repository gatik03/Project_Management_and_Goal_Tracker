import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  title: true
};

export const rolePermissions = {
  EMPLOYEE: ["VIEW_OWN_PROFILE", "ACCESS_EMPLOYEE_PORTAL"],
  MANAGER: ["VIEW_OWN_PROFILE", "ACCESS_EMPLOYEE_PORTAL", "ACCESS_MANAGER_PORTAL"],
  ADMIN: ["VIEW_OWN_PROFILE", "ACCESS_EMPLOYEE_PORTAL", "ACCESS_MANAGER_PORTAL", "ACCESS_ADMIN_PORTAL"]
};

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user?.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      title: user.title,
      permissions: rolePermissions[user.role]
    }
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    permissions: rolePermissions[user.role]
  };
}
