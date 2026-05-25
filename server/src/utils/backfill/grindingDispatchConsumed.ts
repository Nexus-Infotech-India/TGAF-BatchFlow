/**
 * Rebuild GrindingDispatch.consumedQuantity from the per-posting consumption records.
 *
 * Pre-fix, the write paths in production.controller.ts and fgBatch.controller.ts stored
 * consumedQuantity in lots[0].cleanedQuantityUnit (e.g. Ton) while the read path used
 * totalQuantityUnit (KG). When those differed, posting 100 KG only deducted 0.1 KG.
 *
 * Source of truth for "what was actually consumed":
 *   - ProductionConsumption.actualQuantity + unit (per posting line)
 *   - FGBatchConsumption.actualQuantity + unit (per fg-batch line)
 *
 * Strategy: for each GrindingDispatch, sum every consumption row that targets it
 * (matched by batchNumber or dispatchId), convert each row's quantity from its own
 * recorded unit to the dispatch's totalQuantityUnit, and write the sum.
 *
 * Run with:  npx ts-node src/utils/backfill/grindingDispatchConsumed.ts
 */
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const UNIT_TO_GRAMS: Record<string, number> = {
  kg: 1000, KG: 1000, Kg: 1000, gram: 1, grams: 1, g: 1, G: 1,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
  quintal: 100_000, Quintal: 100_000, lb: 453.592, oz: 28.3495,
  pcs: 1, PCS: 1, Pcs: 1, Piece: 1, piece: 1,
};
const factor = (u: string) => UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1;

async function main() {
  const dispatches = await prisma.grindingDispatch.findMany({
    select: { id: true, batchNumber: true, totalQuantityUnit: true, consumedQuantity: true },
  });

  console.log(`Rebuilding consumedQuantity for ${dispatches.length} dispatches…`);
  let updated = 0;

  for (const d of dispatches) {
    const targetUnit = (d as any).totalQuantityUnit || 'KG';
    const targetFactor = factor(targetUnit);

    // Pull every consumption row that references this dispatch
    const [prodCons, fgCons] = await Promise.all([
      prisma.productionConsumption.findMany({
        where: {
          OR: [{ dispatchId: d.id }, { batchNumber: d.batchNumber }],
        },
        select: { actualQuantity: true, unit: true },
      }),
      prisma.fGBatchConsumption.findMany({
        where: {
          OR: [{ dispatchId: d.id }, { batchNumber: d.batchNumber }],
        },
        select: { actualQuantity: true, unit: true },
      }),
    ]);

    let grams = 0;
    for (const c of prodCons) {
      const unit = c.unit || targetUnit;
      grams += (c.actualQuantity || 0) * factor(unit);
    }
    for (const c of fgCons) {
      const unit = c.unit || targetUnit;
      grams += (c.actualQuantity || 0) * factor(unit);
    }

    const newConsumed = Number((grams / targetFactor).toFixed(3));
    const oldConsumed = d.consumedQuantity || 0;

    if (Math.abs(newConsumed - oldConsumed) > 1e-6) {
      await prisma.grindingDispatch.update({
        where: { id: d.id },
        data: { consumedQuantity: newConsumed },
      });
      console.log(`  ${d.batchNumber}: ${oldConsumed} → ${newConsumed} ${targetUnit}`);
      updated++;
    }
  }

  console.log(`Done. Adjusted ${updated} dispatches.`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
