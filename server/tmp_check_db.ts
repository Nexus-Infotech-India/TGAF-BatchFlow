
import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.rawMaterialProduct.findMany({
        where: {
            OR: [
                { name: { contains: 'Seed Wastage', mode: 'insensitive' } },
                { name: { contains: 'seed wastage', mode: 'insensitive' } },
            ]
        }
    });
    console.log('Matching Products:', JSON.stringify(products, null, 2));

    const records = await prisma.seedWastageRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log('Recent Wastage Records:', JSON.stringify(records, null, 2));

    await prisma.$disconnect();
}

check();
