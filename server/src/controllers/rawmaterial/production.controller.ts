import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class ProductionController {
  /**
   * Post shift production.
   * Step 5: supervisor enters actual RM consumed, actual SFG produced, byproduct, scrap.
   */
  static async postProduction(req: Request, res: Response) {
    try {
      const {
        sfgProductId,
        bomId,
        locationId,
        shiftDate,
        notes,
        consumptions, // [{ rawMaterialId, expectedQuantity, actualQuantity, batchNumber?, cleaningLotId? }]
        outputs, // [{ outputType: 'SFG'|'BYPRODUCT'|'SCRAP', productName, skuCode?, quantity, unit, batchNumber? }]
      } = req.body;

      // Validate required fields
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

      // Validate that at least one SFG output exists
      const sfgOutputs = outputs.filter((o: any) => o.outputType === 'SFG');
      if (sfgOutputs.length === 0) {
        res.status(400).json({ error: 'At least one SFG output is required' });
        return;
      }

      // Validate location is of type GRINDING
      const location = await prisma.location.findUnique({ where: { id: locationId } });
      if (!location) {
        res.status(400).json({ error: 'Location not found' });
        return;
      }
      if (location.type !== 'GRINDING') {
        res.status(400).json({ error: 'Production can only be posted at a GRINDING location' });
        return;
      }

      // Validate BOM exists
      const bom = await prisma.billOfMaterial.findUnique({
        where: { id: bomId },
        include: { items: { include: { rawMaterial: true } } },
      });
      if (!bom) {
        res.status(400).json({ error: 'BOM not found' });
        return;
      }

      // Generate posting number: PP-YYYYMMDD-XXXX
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
                unit: o.unit || 'kg',
                batchNumber: o.batchNumber || null,
              })),
            },
          },
          include: {
            consumptions: true,
            outputs: true,
          },
        });

        // Transaction log
        await tx.transactionLog.create({
          data: {
            type: 'PRODUCTION_POSTED',
            entity: 'ProductionPosting',
            entityId: created.id,
            userId: req.user?.id || 'system',
            description: `Production posted: ${postingNumber}. SFG: ${sfgOutputs[0]?.productName || 'N/A'}, Location: ${location.name}`,
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
