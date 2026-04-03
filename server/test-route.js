const { PrismaClient } = require('./src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.fGProductionEntry.findMany({ select: { id: true, status: true, fgProductName: true } });
  console.log("ENTRIES:", entries);
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("USERS:", users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
