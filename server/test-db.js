const { PrismaClient } = require('./src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function main() {
  const reports = await prisma.fGQualityReport.findMany({ include: { parameters: true } });
  console.log("REPORTS FOUND:", reports.length);
  console.log(JSON.stringify(reports, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
