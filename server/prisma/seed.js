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

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...user,
        passwordHash,
        isActive: true
      },
      create: {
        ...user,
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
