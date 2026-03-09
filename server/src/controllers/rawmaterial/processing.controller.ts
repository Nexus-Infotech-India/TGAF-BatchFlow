import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { convertToBaseUOM } from '../../utils/handler/activityLogger';
const prisma = new PrismaClient();

export class ProcessingJobController {
  /**
   * Create a processing batch from selected cleaning lots.
   * Accepts: warehouseId, inputRawMaterialId, lots: [{lotId, allocatedQuantity}]
   * Auto-generates batchNumber and processing job ID.
   */
  static async createProcessingBatch(req: Request, res: Response) {
    try {
      const {
        warehouseId,
        inputRawMaterialId,
        lots, // Array of { lotId: string, allocatedQuantity: number }
      } = req.body;

      if (!warehouseId || !inputRawMaterialId || !Array.isArray(lots) || lots.length === 0) {
        res.status(400).json({ error: 'warehouseId, inputRawMaterialId, and lots are required' });
        return;
      }

      // Validate raw material
      const rawMaterial = await prisma.rawMaterialProduct.findUnique({
        where: { id: inputRawMaterialId },
        select: { unitOfMeasurement: true },
      });
      if (!rawMaterial) {
        res.status(400).json({ error: 'Invalid inputRawMaterialId' });
        return;
      }

      // Validate each lot and compute total quantity
      let totalQuantity = 0;
      const validatedLots: { lotId: string; allocatedQuantity: number }[] = [];

      for (const lotEntry of lots) {
        const lot = await prisma.cleaningLot.findUnique({
          where: { id: lotEntry.lotId },
        });
        if (!lot) {
          res.status(400).json({ error: `Lot ${lotEntry.lotId} not found` });
          return;
        }
        if (lot.rawMaterialId !== inputRawMaterialId) {
          res.status(400).json({ error: `Lot ${lot.lotNumber} does not belong to selected material` });
          return;
        }
        // Check available cleaned quantity (cleanedQuantity tracks remaining after wastage & prior allocations)
        const availableQty = lot.cleanedQuantity ?? 0;
        if (lotEntry.allocatedQuantity <= 0 || lotEntry.allocatedQuantity > availableQty) {
          res.status(400).json({
            error: `Invalid allocated quantity for lot ${lot.lotNumber}. Available: ${availableQty}`,
          });
          return;
        }
        validatedLots.push({ lotId: lot.id, allocatedQuantity: lotEntry.allocatedQuantity });
        totalQuantity += lotEntry.allocatedQuantity;
      }

      // Generate processing job ID (PJ00001)
      const lastJob = await prisma.processingJob.findFirst({
        orderBy: { id: 'desc' },
        where: { id: { startsWith: 'PJ' } },
      });
      let nextNumber = 1;
      if (lastJob && /^PJ\d+$/.test(lastJob.id)) {
        nextNumber = parseInt(lastJob.id.replace('PJ', ''), 10) + 1;
      }
      const newId = `PJ${String(nextNumber).padStart(5, '0')}`;

      // Generate batch number: BATCH-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const batchPrefix = `BATCH-${dateStr}-`;
      const lastBatch = await prisma.processingJob.findFirst({
        where: { batchNumber: { startsWith: batchPrefix } },
        orderBy: { batchNumber: 'desc' },
      });
      let batchSeq = 1;
      if (lastBatch?.batchNumber) {
        const lastSeq = parseInt(lastBatch.batchNumber.replace(batchPrefix, ''), 10);
        if (!isNaN(lastSeq)) batchSeq = lastSeq + 1;
      }
      const batchNumber = `${batchPrefix}${String(batchSeq).padStart(4, '0')}`;

      // Transaction: create processing job, batch lots, update lot statuses
      const result = await prisma.$transaction(async (tx) => {
        // Create processing job
        const processingJob = await tx.processingJob.create({
          data: {
            id: newId,
            batchNumber,
            inputRawMaterialId,
            warehouseId,
            quantityInput: totalQuantity,
            startedAt: new Date(),
            status: 'In-Progress',
          },
        });

        // Create batch lot entries and update lot statuses
        for (const lotEntry of validatedLots) {
          await tx.processingBatchLot.create({
            data: {
              processingJobId: processingJob.id,
              cleaningLotId: lotEntry.lotId,
              allocatedQuantity: lotEntry.allocatedQuantity,
            },
          });

          // Mark cleaning lot as InProcessing
          const updatedLot = await tx.cleaningLot.update({
            where: { id: lotEntry.lotId },
            data: {
              cleanedQuantity: { decrement: lotEntry.allocatedQuantity },
            },
          });
          // If fully allocated, mark as InProcessing
          if ((updatedLot.cleanedQuantity ?? 0) <= 0) {
            await tx.cleaningLot.update({
              where: { id: lotEntry.lotId },
              data: { status: 'InProcessing' },
            });
          }
        }

        return processingJob;
      }, { timeout: 15000 });

      // Return created job with full relations
      const fullJob = await prisma.processingJob.findUnique({
        where: { id: result.id },
        include: {
          inputRawMaterial: true,
          warehouse: true,
          processingBatchLots: {
            include: { cleaningLot: true },
          },
        },
      });

      res.status(201).json(fullJob);
    } catch (error) {
      console.error('Failed to create processing batch:', error);
      res.status(500).json({ error: 'Failed to create processing batch', details: error });
    }
  }

  /**
   * Get cleaning lots available for batch creation.
   * Query params: warehouseId (optional), rawMaterialId (optional)
   * Returns lots with status 'Active' that haven't been allocated to a processing batch yet.
   */
  static async getAvailableLots(req: Request, res: Response) {
    try {
      const { warehouseId, rawMaterialId } = req.query;

      const where: any = {
        status: { in: ['Active', 'Cleaned'] },
        cleanedQuantity: { gt: 0 },
      };

      if (warehouseId) where.warehouseId = warehouseId;
      if (rawMaterialId) where.rawMaterialId = rawMaterialId;

      const lots = await prisma.cleaningLot.findMany({
        where,
        include: {
          rawMaterial: true,
          warehouse: true,
          grn: true,
          cleaningJob: {
            include: {
              fromWarehouse: true,
              toWarehouse: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(lots);
    } catch (error) {
      console.error('Failed to fetch available lots:', error);
      res.status(500).json({ error: 'Failed to fetch available lots', details: error });
    }
  }

  // Legacy: Create a processing job (kept for backward compatibility)
  static async createProcessingJob(req: Request, res: Response) {
    try {
      const {
        inputRawMaterialId,
        quantityInput,
        unit,
        startedAt,
        finishedAt,
        status,
        warehouseId,
      } = req.body;

      const rawMaterial = await prisma.rawMaterialProduct.findUnique({
        where: { id: inputRawMaterialId },
        select: { unitOfMeasurement: true },
      });
      if (!rawMaterial) {
        res.status(400).json({ error: 'Invalid inputRawMaterialId' });
        return;
      }

      const baseQuantityInput = convertToBaseUOM(
        quantityInput,
        unit || rawMaterial.unitOfMeasurement,
        rawMaterial.unitOfMeasurement
      );

      const lastJob = await prisma.processingJob.findFirst({
        orderBy: { id: 'desc' },
        where: { id: { startsWith: 'PJ' } },
      });

      let nextNumber = 1;
      if (lastJob && /^PJ\d+$/.test(lastJob.id)) {
        nextNumber = parseInt(lastJob.id.replace('PJ', ''), 10) + 1;
      }
      const newId = `PJ${String(nextNumber).padStart(5, '0')}`;

      const processingJob = await prisma.processingJob.create({
        data: {
          id: newId,
          inputRawMaterialId,
          quantityInput: baseQuantityInput,
          startedAt: new Date(startedAt),
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
          status,
          warehouseId: warehouseId || undefined,
        },
      });

      res.status(201).json(processingJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create processing job', details: error });
    }
  }

  static async getProcessingJobs(req: Request, res: Response) {
    try {
      const { inputRawMaterialId } = req.query;
      const where: any = {};
      if (inputRawMaterialId) where.inputRawMaterialId = inputRawMaterialId;

      const processingJobs = await prisma.processingJob.findMany({
        where,
        include: {
          inputRawMaterial: true,
          warehouse: true,
          byProducts: { include: { warehouse: true } },
          finishedGoods: { include: { warehouse: true } },
          processingBatchLots: {
            include: {
              cleaningLot: {
                include: {
                  cleaningJob: { select: { id: true, quantity: true } },
                },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      });
      res.json(processingJobs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch processing jobs', details: error });
    }
  }

  static async getProcessingJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const processingJob = await prisma.processingJob.findUnique({
        where: { id },
        include: {
          inputRawMaterial: true,
          warehouse: true,
          processingBatchLots: {
            include: {
              cleaningLot: {
                include: {
                  cleaningJob: { select: { id: true, quantity: true } },
                },
              },
            },
          },
        },
      });
      if (!processingJob) {
        res.status(404).json({ error: 'Processing job not found' });
        return;
      }
      res.json(processingJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch processing job', details: error });
    }
  }

  static async updateProcessingJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        quantityInput,
        startedAt,
        finishedAt,
        status,
        byProducts,
        receivedQuantity, // new: the actual quantity received after processing
      } = req.body;

      const processingJob = await prisma.processingJob.update({
        where: { id },
        data: {
          quantityInput,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
          status,
        },
      });

      let totalByProductQty = 0;
      let finishedGoodWarehouseId = null;
      if (Array.isArray(byProducts)) {
        await prisma.byProduct.deleteMany({ where: { processingJobId: id } });
        for (const bp of byProducts) {
          totalByProductQty += bp.quantity || 0;
          finishedGoodWarehouseId = bp.warehouseId;
          await prisma.byProduct.create({
            data: {
              processingJobId: id,
              skuCode: bp.skuCode,
              quantity: bp.quantity,
              warehouseId: bp.warehouseId,
              tag: bp.tag,
              reason: bp.reason,
            },
          });
          if (bp.isReusable) {
            await prisma.reusableStock.create({
              data: {
                processingJobId: id,
                skuCode: bp.skuCode,
                quantity: bp.quantity,
                warehouseId: bp.warehouseId,
                createdAt: new Date(),
              },
            });
          }
        }
      }

      if (status === "Finished" || status === "Completed") {
        const job = await prisma.processingJob.findUnique({
          where: { id },
          include: { inputRawMaterial: true },
        });

        if (job) {
          // Use receivedQuantity if provided, otherwise fall back to (input - byproduct)
          const finalQuantity = receivedQuantity !== undefined && receivedQuantity !== null
            ? receivedQuantity
            : (job.quantityInput || 0) - totalByProductQty;

          const warehouseId = finishedGoodWarehouseId || job.warehouseId || (byProducts?.[0]?.warehouseId);

          await prisma.finishedGood.create({
            data: {
              skuCode: job.inputRawMaterial.skuCode,
              name: job.inputRawMaterial.name,
              category: job.inputRawMaterial.category,
              unitOfMeasurement: job.inputRawMaterial.unitOfMeasurement,
              quantity: finalQuantity,
              warehouseId: warehouseId,
              processingJobId: job.id,
            },
          });
        }
      }

      const updatedJob = await prisma.processingJob.findUnique({
        where: { id },
        include: {
          byProducts: true,
          warehouse: true,
          processingBatchLots: {
            include: { cleaningLot: true },
          },
        },
      });

      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update processing job', details: error });
    }
  }
}