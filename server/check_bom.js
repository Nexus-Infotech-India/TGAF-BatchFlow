const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();

async function main() {
  const bom = await p.billOfMaterial.findFirst({
    where: { bomCode: 'BOM-001' },
    include: { items: { include: { rawMaterial: true } } }
  });

  if (!bom) {
    console.log('No BOM found');
    return;
  }

  console.log('BOM:', bom.bomCode, '| Output:', bom.outputQuantity, bom.unitOfMeasurement);
  for (const item of bom.items) {
    console.log('  Item:', item.rawMaterial.name,
      '| BOM Qty:', item.quantity, item.unitOfMeasurement,
      '| RM UoM:', item.rawMaterial.unitOfMeasurement);
  }

  // Simulate calculation for 100 KG
  const UNIT_TO_GRAMS = { gram: 1, kg: 1000, KG: 1000, Kg: 1000, ton: 1000000, Ton: 1000000, quintal: 100000, Quintal: 100000 };
  const toG = (q, u) => q * (UNIT_TO_GRAMS[u] || UNIT_TO_GRAMS[u.toLowerCase()] || 1);
  const fromG = (g, u) => g / (UNIT_TO_GRAMS[u] || UNIT_TO_GRAMS[u.toLowerCase()] || 1);

  const bomOutputG = toG(bom.outputQuantity, bom.unitOfMeasurement);
  const prodG = toG(100, 'KG');
  const scaleFactor = prodG / bomOutputG;

  console.log('\n--- Simulation for 100 KG ---');
  console.log('BOM output in grams:', bomOutputG);
  console.log('Production (100 KG) in grams:', prodG);
  console.log('Scale factor:', scaleFactor);

  for (const item of bom.items) {
    const itemG = toG(item.quantity, item.unitOfMeasurement);
    const scaledG = itemG * scaleFactor;
    const displayUnit = item.rawMaterial.unitOfMeasurement;
    const expected = fromG(scaledG, displayUnit);
    console.log(`  ${item.rawMaterial.name}: BOM=${item.quantity} ${item.unitOfMeasurement} -> itemG=${itemG} -> scaledG=${scaledG} -> display=${expected} ${displayUnit}`);
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });
