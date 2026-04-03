import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
  quintal: 100_000, Quintal: 100_000,
  lb: 453.592, oz: 28.3495,
  pcs: 1, PCS: 1, Pcs: 1,   // pass-through for piece-based items
};

function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}

function fromGrams(grams: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return grams / factor;
}

export class FGBatchController {
  /**
   * GET /fg-batch/bom-items?bomId=xxx
   * Returns the BOM with its items (SFG + other items) for a specific FG BOM.
   * For SFG items: retrieves ACCEPTED outbound MaterialTransfer batches (TRF-OUT-*)
   *   that have SFG lines matching the raw material, sent to SFG_WAREHOUSE locations.
   * For other items: retrieves current stock.
   */
  static async getFGBOMItems(req: Request, res: Response): Promise<void> {
    try {
      const { bomId, productionQty, productionUnit } = req.query;

      if (!bomId) {
        res.status(400).json({ error: 'bomId is required' });
        return;
      }

      const bom = await prisma.billOfMaterial.findUnique({
        where: { id: bomId as string },
        include: {
          items: { include: { rawMaterial: true } },
          sfgProduct: true,
        },
      });

      if (!bom) {
        res.status(404).json({ error: 'BOM not found' });
        return;
      }

      const prodQty = productionQty ? Number(productionQty) : bom.outputQuantity;
      const prodUnit = (productionUnit as string) || bom.unitOfMeasurement;

      // Calculate scale factor
      const bomOutputInGrams = toGrams(bom.outputQuantity, bom.unitOfMeasurement);
      const prodQtyInGrams = toGrams(prodQty, prodUnit);
      const scaleFactor = prodQtyInGrams / bomOutputInGrams;

      // Fetch ALL accepted outbound MaterialTransfers (TRF-OUT-*) heading to SFG_WAREHOUSE
      const acceptedTransfers = await prisma.materialTransfer.findMany({
        where: {
          direction: 'OUTBOUND_FROM_GRINDING',
          status: 'ACCEPTED',
        },
        include: {
          lines: true,
          toLocation: true,
          fromLocation: true,
        },
        orderBy: { acceptedAt: 'desc' },
      });

      // Also fetch already-consumed quantities from past FG batch consumptions
      // that referenced these transfer batches
      const pastConsumptions = await prisma.fGBatchConsumption.findMany({
        where: {
          sourceType: 'SFG_BATCH',
          batchNumber: { not: null },
        },
        select: {
          batchNumber: true,
          actualQuantity: true,
          unit: true,
          rawMaterialId: true,
        },
      });

      // Build a map: transferNumber -> { rawMaterialId -> totalConsumed }
      const consumedMap: Record<string, Record<string, number>> = {};
      for (const c of pastConsumptions) {
        if (!c.batchNumber) continue;
        if (!consumedMap[c.batchNumber]) consumedMap[c.batchNumber] = {};
        if (!consumedMap[c.batchNumber][c.rawMaterialId]) consumedMap[c.batchNumber][c.rawMaterialId] = 0;
        consumedMap[c.batchNumber][c.rawMaterialId] += c.actualQuantity;
      }

      const items = [];

      for (const bomItem of bom.items) {
        const rm = bomItem.rawMaterial;
        const bomItemInGrams = toGrams(bomItem.quantity, bomItem.unitOfMeasurement);
        const scaledGrams = bomItemInGrams * scaleFactor;

        // Check if this raw material is SFG category
        const isSFG = rm.category === 'SEMI_FINISHED_GOOD';

        let availableSfgBatches: any[] = [];
        let currentStockQty = 0;
        let currentStockUnit = rm.unitOfMeasurement;

        if (isSFG) {
          // Find matching SFG lines in accepted outbound transfers for this raw material
          for (const transfer of acceptedTransfers) {
            const sfgLines = transfer.lines.filter(
              (line) => line.lineType === 'SFG' && (line.rawMaterialId === rm.id || line.productName === rm.name)
            );

            for (const line of sfgLines) {
              const transferNum = transfer.transferNumber;
              const consumed = consumedMap[transferNum]?.[rm.id] || 0;
              const remaining = line.quantity - consumed;

              if (remaining > 0) {
                availableSfgBatches.push({
                  transferId: transfer.id,
                  transferNumber: transferNum,
                  batchNumber: transferNum, // use transfer number as batch identifier
                  dispatchId: transfer.id,
                  lineId: line.id,
                  totalQuantity: line.quantity,
                  consumedQuantity: consumed,
                  remainingQuantity: Math.round(remaining * 1000) / 1000,
                  unit: line.unitOfMeasurement,
                  fromLocation: transfer.fromLocation?.name || '',
                  toLocation: transfer.toLocation?.name || '',
                  acceptedAt: transfer.acceptedAt,
                });
              }
            }
          }

          currentStockUnit = availableSfgBatches.length > 0
            ? availableSfgBatches[0].unit
            : rm.unitOfMeasurement;
        } else {
          // No SFG — fetch from current stock
          const stocks = await prisma.currentStock.findMany({
            where: { rawMaterialId: rm.id },
            include: { rawMaterial: true, warehouse: true },
          });
          currentStockQty = stocks.reduce((sum, s) => sum + s.currentQuantity, 0);
          const stockWithUnit = stocks.find(s => s.quantityUnit && s.currentQuantity > 0) || stocks.find(s => s.quantityUnit) || stocks[0];
          currentStockUnit = stockWithUnit?.quantityUnit || rm.unitOfMeasurement;
        }

        const displayUnit = currentStockUnit;
        const expectedQty = fromGrams(scaledGrams, displayUnit);
        const roundedExpected = Number(expectedQty.toFixed(5));

        items.push({
          bomItemId: bomItem.id,
          rawMaterialId: rm.id,
          rawMaterialName: rm.name,
          skuCode: rm.skuCode,
          category: rm.category,
          isSFG,
          bomQuantity: bomItem.quantity,
          bomUnit: bomItem.unitOfMeasurement,
          expectedQuantity: roundedExpected,
          displayUnit,
          availableSfgBatches,
          currentStockQty: Math.round(currentStockQty * 1000) / 1000,
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
        items,
      });
    } catch (error) {
      console.error('Error fetching FG BOM items:', error);
      res.status(500).json({ error: 'Failed to fetch FG BOM items', details: error });
    }
  }

  /**
   * GET /fg-batch/boms
   * Returns all active BOMs that can be used for FG batch creation.
   * Filters for BOMs that have FG (finished good) output.
   */
  static async getFGBOMs(req: Request, res: Response): Promise<void> {
    try {
      // Fetch SFG products to filter out their BOMs by name (in case sfgProductId is not set)
      const sfgProducts = await prisma.rawMaterialProduct.findMany({
        where: { category: 'SEMI_FINISHED_GOOD' },
        select: { name: true },
      });
      const sfgNames = new Set(sfgProducts.map(p => p.name.toLowerCase().trim()));

      // Also fetch FG products so we can match by name
      const fgProducts = await prisma.rawMaterialProduct.findMany({
        where: { category: 'FINISHED_GOOD' },
        select: { id: true, name: true },
      });

      const boms = await prisma.billOfMaterial.findMany({
        where: { 
          status: 'ACTIVE',
          sfgProductId: null
        },
        include: {
          items: { include: { rawMaterial: true } },
          sfgProduct: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter out any BOMs that produce something matching an SFG name
      const fgBoms = boms.filter(bom => !sfgNames.has(bom.productName.toLowerCase().trim()));

      // Attach matched FG product ID to each BOM
      const enrichedBoms = fgBoms.map(bom => {
        const matchedFG = fgProducts.find(fg => fg.name.toLowerCase().trim() === bom.productName.toLowerCase().trim());
        return {
          ...bom,
          fgProductId: matchedFG?.id || null,
        };
      });

      res.json({ data: enrichedBoms });
    } catch (error) {
      console.error('Error fetching FG BOMs:', error);
      res.status(500).json({ error: 'Failed to fetch FG BOMs', details: error });
    }
  }

  /**
   * POST /fg-batch/create
   * Creates a new FG batch record:
   * - Validates BOM & availability
   * - Records consumed quantities against transfer batches
   * - Deducts other items from current stock
   * - Records the FG batch
   */
  static async createFGBatch(req: Request, res: Response): Promise<void> {
    try {
      const {
        bomId,
        productionQty,
        productionUnit,
        packetSize,
        packetUnit,
        cartonCapacity,
        notes,
        consumptions, // Array of { rawMaterialId, actualQuantity, unit, sourceType, batchNumber, dispatchId }
      } = req.body;

      if (!bomId || !productionQty || !Array.isArray(consumptions) || consumptions.length === 0) {
        res.status(400).json({ error: 'bomId, productionQty, and consumptions are required' });
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

      // Validate availability for all consumptions
      for (const c of consumptions) {
        const actualQty = Number(c.actualQuantity);
        if (actualQty <= 0) continue;

        if (c.sourceType === 'SFG_BATCH' && c.batchNumber) {
          // Validate against MaterialTransfer lines
          const transfer = await prisma.materialTransfer.findFirst({
            where: { transferNumber: c.batchNumber, status: 'ACCEPTED' },
            include: { lines: true },
          });
          if (!transfer) {
            res.status(400).json({ error: `Transfer batch ${c.batchNumber} not found or not accepted` });
            return;
          }

          const sfgLine = transfer.lines.find(
            (l) => l.lineType === 'SFG' && (l.rawMaterialId === c.rawMaterialId || l.productName === c.rawMaterialName)
          );
          if (!sfgLine) {
            res.status(400).json({ error: `No SFG line found for material in transfer ${c.batchNumber}` });
            return;
          }

          // Calculate already consumed
          const pastConsumed = await prisma.fGBatchConsumption.aggregate({
            where: {
              sourceType: 'SFG_BATCH',
              batchNumber: c.batchNumber,
              rawMaterialId: c.rawMaterialId,
            },
            _sum: { actualQuantity: true },
          });
          const alreadyConsumed = pastConsumed._sum.actualQuantity || 0;
          const remaining = sfgLine.quantity - alreadyConsumed;

          if (actualQty > remaining) {
            res.status(400).json({
              error: `Insufficient SFG in transfer ${c.batchNumber}. Required: ${actualQty} ${c.unit}, Available: ${Math.round(remaining * 1000) / 1000} ${sfgLine.unitOfMeasurement}`,
            });
            return;
          }
        } else if (c.sourceType === 'STOCK') {
          const stocks = await prisma.currentStock.findMany({
            where: { rawMaterialId: c.rawMaterialId },
            include: { rawMaterial: true },
          });
          const totalStockQty = stocks.reduce((sum, s) => sum + s.currentQuantity, 0);
          const stockWithUnit = stocks.find(s => s.quantityUnit && s.currentQuantity > 0) || stocks.find(s => s.quantityUnit) || stocks[0];
          const stockUnit = stockWithUnit?.quantityUnit || stockWithUnit?.rawMaterial?.unitOfMeasurement || c.unit || 'KG';
          const actualInGrams = toGrams(actualQty, c.unit || stockUnit);
          const actualInStockUnit = fromGrams(actualInGrams, stockUnit);
          if (totalStockQty <= 0 || actualInStockUnit > totalStockQty) {
            const bomItem = bom.items.find(i => i.rawMaterialId === c.rawMaterialId);
            const materialName = bomItem?.rawMaterial?.name || c.rawMaterialId;
            res.status(400).json({
              error: `Insufficient stock for ${materialName}. Required: ${actualQty} ${c.unit || 'KG'}, Available: ${Math.round(totalStockQty * 1000) / 1000} ${stockUnit}`,
            });
            return;
          }
        }
      }

      // Calculate packets and cartons
      let totalPackets = 0;
      let totalCartons = 0;
      if (packetSize && packetSize > 0) {
        const prodInGrams = toGrams(Number(productionQty), productionUnit || bom.unitOfMeasurement);
        const packetInGrams = toGrams(Number(packetSize), packetUnit || 'gram');
        totalPackets = Math.floor(prodInGrams / packetInGrams);
      }
      
      if (cartonCapacity && cartonCapacity > 0 && totalPackets > 0) {
        totalCartons = Math.ceil(totalPackets / Number(cartonCapacity));
      }

      // Generate batch number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `FGB-${dateStr}-`;
      const lastBatch = await prisma.fGBatch.findFirst({
        where: { batchNumber: { startsWith: prefix } },
        orderBy: { batchNumber: 'desc' },
      });
      let seq = 1;
      if (lastBatch?.batchNumber) {
        const lastSeq = parseInt(lastBatch.batchNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const batchNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const fgBatch = await prisma.$transaction(async (tx) => {
        const created = await tx.fGBatch.create({
          data: {
            batchNumber,
            bomId,
            fgProductName: bom.productName,
            productionQty: Number(productionQty),
            productionUnit: productionUnit || bom.unitOfMeasurement,
            packetSize: packetSize ? Number(packetSize) : null,
            packetUnit: packetUnit || null,
            totalPackets,
            cartonCapacity: cartonCapacity ? Number(cartonCapacity) : null,
            totalCartons,
            status: 'CREATED',
            notes: notes || null,
            createdById: (req as any).user?.id || 'system',
            consumptions: {
              create: consumptions.map((c: any) => ({
                rawMaterialId: c.rawMaterialId,
                rawMaterialName: c.rawMaterialName || null,
                expectedQuantity: Number(c.expectedQuantity) || 0,
                actualQuantity: Number(c.actualQuantity),
                unit: c.unit || null,
                sourceType: c.sourceType || null,
                batchNumber: c.batchNumber || null,
                dispatchId: c.dispatchId || null,
              })),
            },
          },
          include: { consumptions: true },
        });

        // Deduct consumed quantities
        for (const c of consumptions) {
          const actualQty = Number(c.actualQuantity);
          if (actualQty <= 0) continue;

          if (c.sourceType === 'SFG_BATCH' && c.batchNumber) {
            // SFG from MaterialTransfer — consumption is tracked via FGBatchConsumption records
            // No need to update MaterialTransfer itself since we track via past consumption aggregation
            // But if GrindingDispatch also exists with the same ID, update it for backward compat
            if (c.dispatchId) {
              try {
                const dispatch = await tx.grindingDispatch.findUnique({
                  where: { id: c.dispatchId },
                });
                if (dispatch) {
                  const newConsumed = (dispatch.consumedQuantity || 0) + actualQty;
                  await tx.grindingDispatch.update({
                    where: { id: c.dispatchId },
                    data: { consumedQuantity: Math.round(newConsumed * 1000) / 1000 },
                  });
                }
              } catch {
                // GrindingDispatch may not exist — that's fine; consumption is tracked via FGBatchConsumption
              }
            }
          } else if (c.sourceType === 'STOCK') {
            const stocks = await tx.currentStock.findMany({
              where: { rawMaterialId: c.rawMaterialId },
              include: { rawMaterial: true },
            });
            let remainingToDeduct = actualQty;
            for (const stock of stocks) {
              if (remainingToDeduct <= 0) break;
              const stockUnit = stock.quantityUnit || stock.rawMaterial.unitOfMeasurement;
              const remainingInGrams = toGrams(remainingToDeduct, c.unit || stockUnit);
              const remainingInStockUnit = fromGrams(remainingInGrams, stockUnit);
              const deductFromThisStock = Math.min(stock.currentQuantity, remainingInStockUnit);
              if (deductFromThisStock > 0) {
                await tx.currentStock.update({
                  where: { id: stock.id },
                  data: {
                    currentQuantity: Math.round((stock.currentQuantity - deductFromThisStock) * 1000) / 1000,
                  },
                });
                const deductedInGrams = toGrams(deductFromThisStock, stockUnit);
                const deductedInConsumptionUnit = fromGrams(deductedInGrams, c.unit || stockUnit);
                remainingToDeduct -= deductedInConsumptionUnit;
              }
            }
          }
        }

        await tx.transactionLog.create({
          data: {
            type: 'FG_BATCH_CREATED',
            entity: 'FGBatch',
            entityId: created.id,
            userId: (req as any).user?.id || 'system',
            description: `FG Batch created: ${batchNumber}. Product: ${bom.productName}, Qty: ${productionQty} ${productionUnit || bom.unitOfMeasurement}, Packets: ${totalPackets}, Cartons: ${totalCartons}`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({
        success: true,
        data: fgBatch,
        summary: {
          batchNumber,
          fgProductName: bom.productName,
          productionQty: Number(productionQty),
          productionUnit: productionUnit || bom.unitOfMeasurement,
          totalPackets,
          totalCartons,
          packetSize: packetSize ? Number(packetSize) : null,
          packetUnit: packetUnit || null,
          cartonCapacity: cartonCapacity ? Number(cartonCapacity) : null,
        },
      });
    } catch (error) {
      console.error('Error creating FG Batch:', error);
      res.status(500).json({ error: 'Failed to create FG Batch', details: error });
    }
  }

  /**
   * GET /fg-batch/list
   * Returns all FG Batches.
   */
  static async getFGBatches(req: Request, res: Response): Promise<void> {
    try {
      const batches = await prisma.fGBatch.findMany({
        include: { consumptions: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: batches });
    } catch (error) {
      console.error('Error fetching FG Batches:', error);
      res.status(500).json({ error: 'Failed to fetch FG Batches', details: error });
    }
  }

  /**
   * GET /fg-batch/:id
   * Returns a single FG Batch by ID.
   */
  static async getFGBatchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await prisma.fGBatch.findUnique({
        where: { id },
        include: { consumptions: true },
      });
      if (!batch) {
        res.status(404).json({ error: 'FG Batch not found' });
        return;
      }
      res.json({ success: true, data: batch });
    } catch (error) {
      console.error('Error fetching FG Batch:', error);
      res.status(500).json({ error: 'Failed to fetch FG Batch', details: error });
    }
  }

  /**
   * PUT /fg-batch/:id/accept
   * Accepts an FG Batch.
   */
  static async acceptFGBatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await prisma.fGBatch.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });
      res.json({ success: true, data: batch });
    } catch (error) {
      console.error('Error accepting FG Batch:', error);
      res.status(500).json({ error: 'Failed to accept FG Batch', details: error });
    }
  }

  /**
   * PUT /fg-batch/:id/reject
   * Rejects an FG Batch.
   */
  static async rejectFGBatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const batch = await prisma.fGBatch.findUnique({ where: { id } });
      if (!batch) {
        res.status(404).json({ error: 'FG Batch not found' });
        return;
      }

      const updated = await prisma.fGBatch.update({
        where: { id },
        data: { 
          status: 'REJECTED',
          notes: reason ? (batch.notes ? `${batch.notes} | Rejected: ${reason}` : `Rejected: ${reason}`) : batch.notes,
        },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error rejecting FG Batch:', error);
      res.status(500).json({ error: 'Failed to reject FG Batch', details: error });
    }
  }
}
