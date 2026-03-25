import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
async function main() {
    const bom = await prisma.billOfMaterial.findFirst({
        where: { bomCode: 'BOM-001' },
        include: { items: { include: { rawMaterial: true } } },
    });
    if (!bom) return;
    for (const item of bom.items) {
        if (item.rawMaterial.name.toLowerCase().includes('chilli')) {
            await prisma.bOMItem.update({ where: { id: item.id }, data: { quantity: 1070 } });
            console.log('Chilli updated to 1070');
        } else if (item.rawMaterial.name.toLowerCase().includes('salt')) {
            await prisma.bOMItem.update({ where: { id: item.id }, data: { quantity: 30 } });
            console.log('Salt updated to 30');
        } else if (item.rawMaterial.name.toLowerCase().includes('poly')) {
            await prisma.bOMItem.update({ where: { id: item.id }, data: { quantity: 12 } });
            console.log('Polythene updated to 12');
        }
    }
}
main().catch(console.error).finally(()=>prisma.$disconnect());
