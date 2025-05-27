import { PrismaClient } from '../src/generated/prisma';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
 
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      id: "admin-role-id",
      name: "Admin",
      description: "Administrator with full access",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "admin-user-id",
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      roleId: adminRole.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Default admin user created with email: admin@example.com and password: admin123");

  // Create default departments
  const departments = [
    {
      name: "Quality Assurance",
      description: "Responsible for ensuring product quality and compliance with standards"
    },
    {
      name: "Manufacturing",
      description: "Responsible for production processes and operations"
    },
    {
      name: "Research & Development",
      description: "New product development and improvement of existing products"
    },
    {
      name: "Supply Chain",
      description: "Procurement, logistics, and inventory management"
    },
    {
      name: "Regulatory Affairs",
      description: "Ensuring compliance with regulations and standards"
    },
    {
      name: "Human Resources",
      description: "Personnel management and training"
    },
    {
      name: "Finance",
      description: "Financial control and reporting"
    },
    {
      name: "IT & Systems",
      description: "Information technology infrastructure and systems"
    },
    {
      name: "Facilities & Maintenance",
      description: "Building management and equipment maintenance"
    },
    {
      name: "Marketing & Sales",
      description: "Product promotion and customer engagement"
    }
  ];

  // Insert departments
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description },
      create: {
        name: dept.name,
        description: dept.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Successfully created ${departments.length} departments`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });