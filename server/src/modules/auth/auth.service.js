import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

// A valid bcrypt hash keeps the unknown/inactive-account path close to the
// normal password path without consulting another user's credential.
const dummyPasswordHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5ptj5JSNUmFc5vGTD6J0x9hW8E6YjOm";

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

  const isPasswordValid = await bcrypt.compare(password, user?.isActive ? user.passwordHash : dummyPasswordHash);

  if (!user?.isActive || !isPasswordValid) {
    return null;
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: "HS256",
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
