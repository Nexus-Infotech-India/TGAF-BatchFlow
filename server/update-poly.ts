import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const poly = await prisma.rawMaterialProduct.findFirst({
    where: { name: { contains: 'Polythene' } }
  });

  if (poly) {
    console.log('Found Polythene ID:', poly.id);

    const res = await prisma.currentStock.updateMany({
      where: {
        rawMaterialId: poly.id,
        currentQuantity: 10
      },
      data: {
        quantityUnit: 'Ton'
      }
    });

    console.log('Updated', res.count, 'records for Polythene (10 quantity).');
  } else {
    console.log('Polythene not found.');
  }

  const chilli = await prisma.rawMaterialProduct.findFirst({
    where: { name: { contains: 'chilli' } }
  });

  if (chilli) {
    const res2 = await prisma.currentStock.updateMany({
      where: {
        rawMaterialId: chilli.id,
        currentQuantity: 10 // The other 10 might be chilli
      },
      data: {
        quantityUnit: 'KG'
      }
    });
    console.log('Updated', res2.count, 'records for Chilli (10 quantity).');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
