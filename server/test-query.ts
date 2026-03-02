const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();

async function main() {
  try {
    const report = await p.rMQualityReport.findFirst({
      where: { reportNumber: { not: null } },
      select: { id: true, reportNumber: true, grn: true },
    });
    console.log('Report:', JSON.stringify(report));
    
    const count = await p.rMQualityReport.count();
    console.log('Total reports:', count);
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}
main();
