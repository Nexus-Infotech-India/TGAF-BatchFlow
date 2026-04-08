const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.machine.updateMany({
    data: { capacityUnit: 'BOXES_PER_SHIFT' }
  });
  console.log('Updated', result.count, 'machines to BOXES_PER_SHIFT');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
