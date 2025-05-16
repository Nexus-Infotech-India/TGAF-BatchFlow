import { PrismaClient } from '../src/generated/prisma';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create default admin role
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      id: "admin-role-id", // Optional: Provide a fixed ID or let Prisma generate it
      name: "Admin",
      description: "Administrator with full access",
      createdAt: new Date(), // Optional: Let Prisma use the default value
      updatedAt: new Date(), // Optional: Let Prisma use the default value
    },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10); // Default password: admin123
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "admin-user-id", // Optional: Provide a fixed ID or let Prisma generate it
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      roleId: adminRole.id, // Associate the user with the Admin role
      createdAt: new Date(), // Optional: Let Prisma use the default value
      updatedAt: new Date(), // Optional: Let Prisma use the default value
    },
  });

  console.log("Default admin user created with email: admin@example.com and password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });