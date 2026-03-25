import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
async function main() {
  const stocks = await prisma.currentStock.findMany({ include: { rawMaterial: true } });
  for (let s of stocks) {
    if (s.rawMaterial.name.toLowerCase().includes('poly')) {
      console.log('Stock ID:', s.id, 'Qty:', s.currentQuantity, 'Unit:', s.quantityUnit);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
