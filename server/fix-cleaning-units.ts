/**
 * Migration script: Fix cleanedQuantityUnit on CleaningJob & CleaningLot records.
 *
 * Problem: finishCleaning was using rawMaterial.unitOfMeasurement (e.g. "Ton")
 * as the native unit instead of purchaseOrderItem.quantityUnit (e.g. "KG").
 * This caused:
 *   cleanedQty = jobQty(KG) - wastage(Ton)  →  mixed-unit subtraction
 *   cleanedQuantityUnit = "Ton"              →  wrong label
 *
 * Fix: For every cleaned job whose GRN's PO item has a different quantityUnit,
 * recalculate cleanedQuantity in the correct unit and update the records.
 *
 * Usage:  npx tsx fix-cleaning-units.ts
 */

import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

function convertWeight(val: number, fromU: string, toU: string): number {
  const f = fromU.toLowerCase();
  const t = toU.toLowerCase();
  if (f === t) return val;
  let valInKg = val;
  if (f === 'gram' || f === 'grams') valInKg = val / 1000;
  else if (f === 'ton' || f === 'tons') valInKg = val * 1000;

  if (t === 'gram' || t === 'grams') return valInKg * 1000;
  else if (t === 'ton' || t === 'tons') return valInKg / 1000;

  return valInKg; // default = KG
}

async function main() {
  // Find all cleaned jobs with their GRN -> PO item
  const jobs = await prisma.cleaningJob.findMany({
    where: { status: 'Cleaned' },
    include: {
      cleaningLots: true,
      grn: {
        include: {
          purchaseOrderItem: { select: { quantityUnit: true } },
        },
      },
    },
  });

  console.log(`Found ${jobs.length} cleaned jobs to check.\n`);

  let fixedJobs = 0;
  let fixedLots = 0;

  for (const job of jobs) {
    const correctUnit = job.grn?.purchaseOrderItem?.quantityUnit || 'KG';
    const currentUnit = job.cleanedQuantityUnit || 'kg';

    // Skip if already correct
    if (correctUnit.toLowerCase() === currentUnit.toLowerCase()) {
      continue;
    }

    console.log(`Job ${job.id}: unit mismatch — stored "${currentUnit}", should be "${correctUnit}"`);

    // Recalculate cleanedQuantity for the job
    const jobQty = job.quantity || 0; // stored in the transfer unit (= PO's quantityUnit)
    const stoneWastageInCorrectUnit = convertWeight(
      job.stoneWastageQty || 0,
      job.stoneWastageUnit || 'kg',
      correctUnit
    );
    const seedWastageInCorrectUnit = convertWeight(
      job.seedWastageQty || 0,
      job.seedWastageUnit || 'kg',
      correctUnit
    );
    const jobCleanedQty = Math.max(0, jobQty - stoneWastageInCorrectUnit - seedWastageInCorrectUnit);

    // Recalculate wastage percentage using correct unit
    const totalWastage = stoneWastageInCorrectUnit + seedWastageInCorrectUnit;
    const wastagePercentage = parseFloat(((totalWastage / (jobQty || 1)) * 100).toFixed(2));
    const wastageType = wastagePercentage > 3 ? 'Abnormal Loss' : 'Normal Loss';

    console.log(`  Job qty: ${jobQty} ${correctUnit}`);
    console.log(`  Stone wastage: ${job.stoneWastageQty} ${job.stoneWastageUnit} → ${stoneWastageInCorrectUnit} ${correctUnit}`);
    console.log(`  Seed wastage: ${job.seedWastageQty} ${job.seedWastageUnit} → ${seedWastageInCorrectUnit} ${correctUnit}`);
    console.log(`  Old cleanedQty: ${job.cleanedQuantity} ${currentUnit}`);
    console.log(`  New cleanedQty: ${jobCleanedQty} ${correctUnit}`);

    await prisma.cleaningJob.update({
      where: { id: job.id },
      data: {
        cleanedQuantity: jobCleanedQty,
        cleanedQuantityUnit: correctUnit,
        wastagePercentage,
        wastageType,
      },
    });
    fixedJobs++;

    // Fix each lot
    for (const lot of job.cleaningLots) {
      const lotQty = lot.quantity || 0;
      const lotCleanedQty = Math.max(0, lotQty - stoneWastageInCorrectUnit - seedWastageInCorrectUnit);

      const lotTotalWastage = stoneWastageInCorrectUnit + seedWastageInCorrectUnit;
      const lotWastagePercentage = parseFloat(((lotTotalWastage / (lotQty || 1)) * 100).toFixed(2));
      const lotWastageType = lotWastagePercentage > 3 ? 'Abnormal Loss' : 'Normal Loss';

      console.log(`  Lot ${lot.lotNumber}: ${lot.cleanedQuantity} ${currentUnit} → ${lotCleanedQty} ${correctUnit}`);

      await prisma.cleaningLot.update({
        where: { id: lot.id },
        data: {
          cleanedQuantity: lotCleanedQty,
          cleanedQuantityUnit: correctUnit,
          wastagePercentage: lotWastagePercentage,
          wastageType: lotWastageType,
        },
      });
      fixedLots++;
    }

    console.log('');
  }

  console.log(`\nDone. Fixed ${fixedJobs} jobs and ${fixedLots} lots.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
