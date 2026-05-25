/**
 * One-off backfill for the unit fields added to GrindingDispatch / GrindingDispatchLot.
 *
 * For every existing dispatch:
 *   1. Set allocatedQuantityUnit  per lot   ← cleaningLot.cleanedQuantityUnit (fallback KG)
 *   2. Set seedWastageAllocatedUnit per lot ← cleaningLot.seedWastageUnit (only when sw > 0)
 *   3. Set totalQuantityUnit on the dispatch ← raw material's unitOfMeasurement (fallback KG)
 *   4. Recompute totalQuantity in that canonical unit from the lot allocations, replacing
 *      the broken pre-fix value (e.g. 501.01 for a 500 KG + 1 Ton dispatch).
 *
 * Run with:  npx ts-node src/utils/backfill/grindingDispatchUnits.ts
 */
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const UNIT_TO_GRAMS: Record<string, number> = {
  kg: 1000, KG: 1000, gram: 1, g: 1, G: 1,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
  quintal: 100_000, Quintal: 100_000, lb: 453.592, oz: 28.3495,
};
const factor = (u: string) => UNIT_TO_GRAMS[u] ?? UNIT_TO_GRAMS[u.toLowerCase()] ?? 1;

async function main() {
  const dispatches = await prisma.grindingDispatch.findMany({
    include: {
      inputRawMaterial: { select: { unitOfMeasurement: true } },
      lots: { include: { cleaningLot: true } },
    },
  });

  console.log(`Backfilling ${dispatches.length} grinding dispatches…`);
  let updated = 0;

  for (const d of dispatches) {
    const totalUnit = d.inputRawMaterial?.unitOfMeasurement || 'KG';
    let totalGrams = 0;

    await prisma.$transaction(async (tx) => {
      for (const lot of d.lots) {
        const allocUnit = lot.cleaningLot?.cleanedQuantityUnit || 'KG';
        const seedUnit =
          lot.seedWastageAllocated > 0
            ? lot.cleaningLot?.seedWastageUnit || allocUnit
            : null;

        await tx.grindingDispatchLot.update({
          where: { id: lot.id },
          data: {
            allocatedQuantityUnit: allocUnit,
            seedWastageAllocatedUnit: seedUnit,
          },
        });

        totalGrams += (lot.allocatedQuantity || 0) * factor(allocUnit);
        if (lot.seedWastageAllocated > 0) {
          totalGrams += lot.seedWastageAllocated * factor(seedUnit || allocUnit);
        }
      }

      const newTotal = Number((totalGrams / factor(totalUnit)).toFixed(3));
      await tx.grindingDispatch.update({
        where: { id: d.id },
        data: {
          totalQuantityUnit: totalUnit,
          totalQuantity: newTotal,
        },
      });
    });

    updated++;
  }

  console.log(`Done. Updated ${updated} dispatches.`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
