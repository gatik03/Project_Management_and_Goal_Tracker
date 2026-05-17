import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    name: "Aarav Mehta",
    email: "employee@atomberg.local",
    role: "EMPLOYEE",
    department: "Operations",
    title: "Senior Executive"
  },
  {
    name: "Nisha Rao",
    email: "manager@atomberg.local",
    role: "MANAGER",
    department: "Operations",
    title: "People Manager"
  },
  {
    name: "Vikram Shah",
    email: "admin@atomberg.local",
    role: "ADMIN",
    department: "People Team",
    title: "HR Administrator"
  }
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const manager = users.find((user) => user.role === "MANAGER");
  const managerRecord = await prisma.user.upsert({
    where: { email: manager.email },
    update: {
      ...manager,
      passwordHash,
      isActive: true
    },
    create: {
      ...manager,
      passwordHash
    }
  });

  for (const user of users) {
    if (user.role === "MANAGER") {
      continue;
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...user,
        managerId: user.role === "EMPLOYEE" ? managerRecord.id : null,
        passwordHash,
        isActive: true
      },
      create: {
        ...user,
        managerId: user.role === "EMPLOYEE" ? managerRecord.id : null,
        passwordHash
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
