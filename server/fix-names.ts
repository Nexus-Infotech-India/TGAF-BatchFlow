import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
async function main() {
    const consumptions = await prisma.productionConsumption.findMany();
    for (const c of consumptions) {
        if (!c.rawMaterialName) {
            const mat = await prisma.rawMaterialProduct.findUnique({ where: { id: c.rawMaterialId } });
            if (mat) {
                await prisma.productionConsumption.update({
                    where: { id: c.id },
                    data: { rawMaterialName: mat.name }
                });
                console.log('Updated ID:', c.id, 'with name:', mat.name);
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
