import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1,
  grams: 1,
  g: 1,
  kg: 1000,
  KG: 1000,
  Kg: 1000,
  ton: 1_000_000,
  Ton: 1_000_000,
  TON: 1_000_000,
  tonne: 1_000_000,
  quintal: 100_000,
  Quintal: 100_000,
  lb: 453.592,
  oz: 28.3495,
};

function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}

function fromGrams(grams: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return grams / factor;
}

export class ProductionController {
  /**
   * GET /production/consumption-data
   * Query: sfgProductId, productionQty, productionUnit, locationId
   */
  static async getConsumptionData(req: Request, res: Response): Promise<void> {
    try {
      const { sfgProductId, productionQty, productionUnit, locationId } = req.query;

      if (!sfgProductId || !productionQty) {
        res.status(400).json({ error: 'sfgProductId and productionQty are required' });
        return;
      }

      const prodQty = Number(productionQty);
      const prodUnit = (productionUnit as string) || 'KG';

      // 1. Fetch BOM for this SFG product
      let bom = await prisma.billOfMaterial.findFirst({
        where: { sfgProductId: sfgProductId as string, status: 'ACTIVE' },
        include: {
          items: { include: { rawMaterial: true } },
          sfgProduct: true,
        },
      });

      if (!bom) {
        const product = await prisma.rawMaterialProduct.findUnique({
          where: { id: sfgProductId as string },
          select: { name: true, skuCode: true },
        });
        if (product) {
          bom = await prisma.billOfMaterial.findFirst({
            where: {
              OR: [
                { productCode: product.skuCode },
                { productName: product.name },
              ],
              status: 'ACTIVE',
            },
            include: {
              items: { include: { rawMaterial: true } },
              sfgProduct: true,
            },
          });
        }
      }

      if (!bom) {
        res.status(404).json({ error: 'No active BOM found for this SFG product' });
        return;
      }

      // 2. Calculate scale factor
      const bomOutputInGrams = toGrams(bom.outputQuantity, bom.unitOfMeasurement);
      const prodQtyInGrams = toGrams(prodQty, prodUnit);
      const scaleFactor = prodQtyInGrams / bomOutputInGrams;

      // 3. Get accepted grinding dispatches at the location
      const acceptedDispatches = await prisma.grindingDispatch.findMany({
        where: {
          status: 'ACCEPTED',
          ...(locationId ? { toLocationId: locationId as string } : {}),
        },
        include: {
          inputRawMaterial: true,
          lots: {
            include: {
              cleaningLot: {
                include: { rawMaterial: true },
              },
            },
          },
        },
        orderBy: { acceptedAt: 'desc' },
      });

      // 4. For each BOM item, calculate expected quantity and find source
      const consumptionItems = [];

      for (const item of bom.items) {
        const bomItemInGrams = toGrams(item.quantity, item.unitOfMeasurement);
        const scaledGrams = bomItemInGrams * scaleFactor;

        const displayUnit = item.rawMaterial.unitOfMeasurement;
        const expectedQty = fromGrams(scaledGrams, displayUnit);
        const roundedExpected = Math.round(expectedQty * 1000) / 1000;

        const matchingDispatches = acceptedDispatches.filter(
          (d) => d.inputRawMaterialId === item.rawMaterialId
        );

        let sourceType: 'BATCH' | 'STOCK' = 'STOCK';
        let availableBatches: {
          dispatchId: string;
          batchNumber: string;
          totalQuantity: number;
          unit: string;
        }[] = [];
        let currentStockQty = 0;
        let currentStockUnit = displayUnit;

        if (matchingDispatches.length > 0) {
          sourceType = 'BATCH';
          availableBatches = matchingDispatches.map((d) => ({
            dispatchId: d.id,
            batchNumber: d.batchNumber,
            totalQuantity: d.totalQuantity,
            unit: d.inputRawMaterial.unitOfMeasurement,
          }));
        } else {
          sourceType = 'STOCK';
          const stocks = await prisma.currentStock.findMany({
            where: { rawMaterialId: item.rawMaterialId },
            include: { rawMaterial: true, warehouse: true },
          });
          currentStockQty = stocks.reduce((sum, s) => sum + s.currentQuantity, 0);
          currentStockUnit = item.rawMaterial.unitOfMeasurement;
        }

        consumptionItems.push({
          rawMaterialId: item.rawMaterialId,
          rawMaterialName: item.rawMaterial.name,
          skuCode: item.rawMaterial.skuCode,
          category: item.rawMaterial.category,
          bomQuantity: item.quantity,
          bomUnit: item.unitOfMeasurement,
          expectedQuantity: roundedExpected,
          displayUnit,
          sourceType,
          availableBatches,
          currentStockQty,
          currentStockUnit,
        });
      }

      res.json({
        bom: {
          id: bom.id,
          bomCode: bom.bomCode,
          productName: bom.productName,
          unitOfMeasurement: bom.unitOfMeasurement,
          outputQuantity: bom.outputQuantity,
          itemCount: bom.items.length,
        },
        scaleFactor,
        productionQty: prodQty,
        productionUnit: prodUnit,
        consumptionItems,
      });
    } catch (error) {
      console.error('Error fetching consumption data:', error);
      res.status(500).json({ error: 'Failed to fetch consumption data', details: error });
    }
  }

  /**
   * POST /production/post
   * Posts production with SFG output only. Status = POSTED.
   */
  static async postProduction(req: Request, res: Response) {
    try {
      const {
        sfgProductId,
        bomId,
        locationId,
        shiftDate,
        productionQty,
        productionUnit,
        notes,
        consumptions,
        outputs,
      } = req.body;

      if (!sfgProductId || !bomId || !locationId || !shiftDate) {
        res.status(400).json({ error: 'sfgProductId, bomId, locationId, and shiftDate are required' });
        return;
      }

      if (!Array.isArray(consumptions) || consumptions.length === 0) {
        res.status(400).json({ error: 'At least one consumed raw material is required' });
        return;
      }

      if (!Array.isArray(outputs) || outputs.length === 0) {
        res.status(400).json({ error: 'At least one output (SFG) is required' });
        return;
      }

      const sfgOutputs = outputs.filter((o: any) => o.outputType === 'SFG');
      if (sfgOutputs.length === 0) {
        res.status(400).json({ error: 'At least one SFG output is required' });
        return;
      }

      const location = await prisma.location.findUnique({ where: { id: locationId } });
      if (!location) {
        res.status(400).json({ error: 'Location not found' });
        return;
      }
      if (location.type !== 'GRINDING') {
        res.status(400).json({ error: 'Production can only be posted at a GRINDING location' });
        return;
      }

      const bom = await prisma.billOfMaterial.findUnique({
        where: { id: bomId },
        include: { items: { include: { rawMaterial: true } } },
      });
      if (!bom) {
        res.status(400).json({ error: 'BOM not found' });
        return;
      }

      // Generate posting number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `PP-${dateStr}-`;
      const lastPosting = await prisma.productionPosting.findFirst({
        where: { postingNumber: { startsWith: prefix } },
        orderBy: { postingNumber: 'desc' },
      });
      let seq = 1;
      if (lastPosting?.postingNumber) {
        const lastSeq = parseInt(lastPosting.postingNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const postingNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const posting = await prisma.$transaction(async (tx) => {
        const created = await tx.productionPosting.create({
          data: {
            postingNumber,
            sfgProductId,
            bomId,
            locationId,
            shiftDate: new Date(shiftDate),
            productionQty: productionQty ? Number(productionQty) : null,
            productionUnit: productionUnit || null,
            status: 'POSTED',
            notes: notes || null,
            postedById: req.user?.id || 'system',
            consumptions: {
              create: consumptions.map((c: any) => ({
                rawMaterialId: c.rawMaterialId,
                expectedQuantity: Number(c.expectedQuantity) || 0,
                actualQuantity: Number(c.actualQuantity),
                batchNumber: c.batchNumber || null,
                cleaningLotId: c.cleaningLotId || null,
              })),
            },
            outputs: {
              create: outputs.map((o: any) => ({
                outputType: o.outputType,
                productName: o.productName,
                skuCode: o.skuCode || null,
                quantity: Number(o.quantity),
                unit: o.unit || 'KG',
                batchNumber: o.batchNumber || null,
              })),
            },
          },
          include: {
            consumptions: true,
            outputs: true,
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'PRODUCTION_POSTED',
            entity: 'ProductionPosting',
            entityId: created.id,
            userId: req.user?.id || 'system',
            description: `Production posted: ${postingNumber}. SFG: ${sfgOutputs[0]?.productName || 'N/A'}, Qty: ${productionQty || ''} ${productionUnit || ''}, Location: ${location.name}`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({ success: true, data: posting });
    } catch (error) {
      console.error('Error posting production:', error);
      res.status(500).json({ error: 'Failed to post production', details: error });
    }
  }

  /**
   * PUT /production/postings/:id/complete
   * Complete a production by adding byproduct and scrap quantities.
   * Net SFG = original SFG qty - byproduct qty - scrap qty (all converted to same unit)
   */
  static async completeProduction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        byproductQty,
        byproductUnit,
        byproductName,
        scrapQty,
        scrapUnit,
        scrapName,
      } = req.body;

      const posting = await prisma.productionPosting.findUnique({
        where: { id },
        include: { outputs: true, consumptions: true },
      });

      if (!posting) {
        res.status(404).json({ error: 'Production posting not found' });
        return;
      }

      if (posting.status === 'COMPLETED') {
        res.status(400).json({ error: 'Production is already completed' });
        return;
      }

      // Get SFG output to calculate net
      const sfgOutput = posting.outputs.find((o) => o.outputType === 'SFG');
      if (!sfgOutput) {
        res.status(400).json({ error: 'No SFG output found in this posting' });
        return;
      }

      const sfgUnit = sfgOutput.unit;
      const sfgInGrams = toGrams(sfgOutput.quantity, sfgUnit);

      const byproductInGrams = byproductQty ? toGrams(Number(byproductQty), byproductUnit || sfgUnit) : 0;
      const scrapInGrams = scrapQty ? toGrams(Number(scrapQty), scrapUnit || sfgUnit) : 0;
      const netSfgInGrams = sfgInGrams - byproductInGrams - scrapInGrams;
      const netSfgQty = fromGrams(Math.max(0, netSfgInGrams), sfgUnit);

      const updated = await prisma.$transaction(async (tx) => {
        // Add byproduct output if qty > 0
        if (byproductQty && Number(byproductQty) > 0) {
          await tx.productionOutput.create({
            data: {
              postingId: id,
              outputType: 'BYPRODUCT',
              productName: byproductName || 'Byproduct',
              quantity: Number(byproductQty),
              unit: byproductUnit || sfgUnit,
            },
          });
        }

        // Add scrap output if qty > 0
        if (scrapQty && Number(scrapQty) > 0) {
          await tx.productionOutput.create({
            data: {
              postingId: id,
              outputType: 'SCRAP',
              productName: scrapName || 'Scrap',
              quantity: Number(scrapQty),
              unit: scrapUnit || sfgUnit,
            },
          });
        }

        // Update SFG output quantity to net
        await tx.productionOutput.update({
          where: { id: sfgOutput.id },
          data: { quantity: Math.round(netSfgQty * 1000) / 1000 },
        });

        // Update posting status
        const result = await tx.productionPosting.update({
          where: { id },
          data: { status: 'COMPLETED' },
          include: {
            consumptions: true,
            outputs: true,
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'PRODUCTION_COMPLETED',
            entity: 'ProductionPosting',
            entityId: id,
            userId: req.user?.id || 'system',
            description: `Production completed: ${posting.postingNumber}. Net SFG: ${Math.round(netSfgQty * 1000) / 1000} ${sfgUnit}, Byproduct: ${byproductQty || 0} ${byproductUnit || ''}, Scrap: ${scrapQty || 0} ${scrapUnit || ''}`,
          },
        });

        return result;
      }, { timeout: 15000 });

      res.json({
        success: true,
        data: updated,
        summary: {
          totalProduction: sfgOutput.quantity,
          totalUnit: sfgUnit,
          byproduct: byproductQty ? Number(byproductQty) : 0,
          byproductUnit: byproductUnit || sfgUnit,
          scrap: scrapQty ? Number(scrapQty) : 0,
          scrapUnit: scrapUnit || sfgUnit,
          netSfg: Math.round(netSfgQty * 1000) / 1000,
          netUnit: sfgUnit,
        },
      });
    } catch (error) {
      console.error('Error completing production:', error);
      res.status(500).json({ error: 'Failed to complete production', details: error });
    }
  }

  /**
   * Get all production postings.
   */
  static async getPostings(req: Request, res: Response) {
    try {
      const { locationId, sfgProductId } = req.query;
      const where: any = {};
      if (locationId) where.locationId = locationId;
      if (sfgProductId) where.sfgProductId = sfgProductId;

      const postings = await prisma.productionPosting.findMany({
        where,
        include: {
          consumptions: true,
          outputs: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: postings });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch production postings', details: error });
    }
  }

  /**
   * Get a single production posting by ID.
   */
  static async getPostingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const posting = await prisma.productionPosting.findUnique({
        where: { id },
        include: {
          consumptions: true,
          outputs: true,
        },
      });
      if (!posting) {
        res.status(404).json({ error: 'Production posting not found' });
        return;
      }
      res.json({ success: true, data: posting });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch production posting', details: error });
    }
  }
}
