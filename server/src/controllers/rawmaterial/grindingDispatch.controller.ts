import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const UNIT_TO_GRAMS: Record<string, number> = {
  kg: 1000,
  KG: 1000,
  gram: 1,
  g: 1,
  G: 1,
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

export class GrindingDispatchController {
  /**
   * Create a grinding dispatch (status = SENT).
   * Body: { fromLocationId, toLocationId, inputRawMaterialId, lots: [{ lotId, allocatedQuantity, seedWastageAllocated? }], notes? }
   */
  static async createDispatch(req: Request, res: Response) {
    try {
      const { fromLocationId, toLocationId, inputRawMaterialId, lots, notes } = req.body;

      if (!fromLocationId || !toLocationId || !inputRawMaterialId || !Array.isArray(lots) || lots.length === 0) {
        res.status(400).json({ error: 'fromLocationId, toLocationId, inputRawMaterialId, and lots are required' });
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
      const validatedLots: { lotId: string; allocatedQuantity: number; seedWastageAllocated: number; lotNumber: string }[] = [];

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

        const allocatedQuantity = lotEntry.allocatedQuantity ? parseFloat(lotEntry.allocatedQuantity) : 0;
        const seedWastageAllocated = lotEntry.seedWastageAllocated ? parseFloat(lotEntry.seedWastageAllocated) : 0;

        if (allocatedQuantity <= 0 && seedWastageAllocated <= 0) {
          res.status(400).json({
            error: `Lot ${lot.lotNumber}: either cleaned quantity or seed wastage must be > 0`,
          });
          return;
        }

        // Validate cleaned quantity
        if (allocatedQuantity > 0) {
          const availableQty = lot.cleanedQuantity ?? 0;
          if (allocatedQuantity > availableQty) {
            res.status(400).json({
              error: `Invalid allocated quantity for lot ${lot.lotNumber}. Available: ${availableQty}`,
            });
            return;
          }
        }

        // Validate seed wastage
        let seedUnit = 'KG';
        if (seedWastageAllocated > 0) {
          const seedWastageRecord = await prisma.seedWastageRecord.findFirst({
            where: { lotNumber: lot.lotNumber, source: 'cleaning' },
          });
          if (seedWastageRecord) {
            seedUnit = seedWastageRecord.unit || 'KG';
            const availableSeedWastage = seedWastageRecord.quantity - seedWastageRecord.allocatedQuantity;
            if (seedWastageAllocated > availableSeedWastage) {
              res.status(400).json({
                error: `Seed wastage (${seedWastageAllocated}) exceeds available (${availableSeedWastage}) for lot ${lot.lotNumber}`,
              });
              return;
            }
          } else {
            res.status(400).json({ error: `No seed wastage record for lot ${lot.lotNumber}` });
            return;
          }
        }

        validatedLots.push({ lotId: lot.id, allocatedQuantity, seedWastageAllocated, lotNumber: lot.lotNumber });
        
        const allocUnit = lot.cleanedQuantityUnit || 'KG';
        const allocGrams = toGrams(allocatedQuantity, allocUnit);
        const seedGrams = toGrams(seedWastageAllocated, seedUnit);
        const targetUnit = rawMaterial.unitOfMeasurement || 'KG';
        totalQuantity += fromGrams(allocGrams + seedGrams, targetUnit);
      }

      // Generate batch number: GD-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const batchPrefix = `GD-${dateStr}-`;
      const lastDispatch = await prisma.grindingDispatch.findFirst({
        where: { batchNumber: { startsWith: batchPrefix } },
        orderBy: { batchNumber: 'desc' },
      });
      let batchSeq = 1;
      if (lastDispatch?.batchNumber) {
        const lastSeq = parseInt(lastDispatch.batchNumber.replace(batchPrefix, ''), 10);
        if (!isNaN(lastSeq)) batchSeq = lastSeq + 1;
      }
      const batchNumber = `${batchPrefix}${String(batchSeq).padStart(4, '0')}`;

      // Transaction: create dispatch, lot entries, decrement cleaning lot quantities
      const result = await prisma.$transaction(async (tx) => {
        const dispatch = await tx.grindingDispatch.create({
          data: {
            batchNumber,
            inputRawMaterialId,
            fromLocationId,
            toLocationId,
            totalQuantity,
            status: 'SENT',
            sentAt: new Date(),
            notes: notes || null,
          },
        });

        for (const lotEntry of validatedLots) {
          await tx.grindingDispatchLot.create({
            data: {
              dispatchId: dispatch.id,
              cleaningLotId: lotEntry.lotId,
              allocatedQuantity: lotEntry.allocatedQuantity,
              seedWastageAllocated: lotEntry.seedWastageAllocated,
            },
          });

          // Decrement cleanedQuantity
          if (lotEntry.allocatedQuantity > 0) {
            const updatedLot = await tx.cleaningLot.update({
              where: { id: lotEntry.lotId },
              data: { cleanedQuantity: { decrement: lotEntry.allocatedQuantity } },
            });
            if ((updatedLot.cleanedQuantity ?? 0) <= 0) {
              await tx.cleaningLot.update({
                where: { id: lotEntry.lotId },
                data: { status: 'Dispatched' },
              });
            }
          }

          // Update SeedWastageRecord
          if (lotEntry.seedWastageAllocated > 0) {
            const seedRecord = await tx.seedWastageRecord.findFirst({
              where: { lotNumber: lotEntry.lotNumber, source: 'cleaning' },
            });
            if (seedRecord) {
              const newAllocated = seedRecord.allocatedQuantity + lotEntry.seedWastageAllocated;
              await tx.seedWastageRecord.update({
                where: { id: seedRecord.id },
                data: {
                  allocatedQuantity: newAllocated,
                  restWastage: Math.max(0, seedRecord.quantity - newAllocated),
                },
              });
            }
          }
        }

        return dispatch;
      }, { timeout: 15000 });

      // Return full dispatch
      const fullDispatch = await prisma.grindingDispatch.findUnique({
        where: { id: result.id },
        include: {
          inputRawMaterial: true,
          fromLocation: true,
          toLocation: true,
          lots: {
            include: {
              cleaningLot: {
                include: {
                  rawMaterial: true,
                  warehouse: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(fullDispatch);
    } catch (error) {
      console.error('Failed to create grinding dispatch:', error);
      res.status(500).json({ error: 'Failed to create grinding dispatch', details: error });
    }
  }

  /**
   * Get all grinding dispatches
   */
  static async getDispatches(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status) where.status = status;

      const dispatches = await prisma.grindingDispatch.findMany({
        where,
        include: {
          inputRawMaterial: true,
          fromLocation: true,
          toLocation: true,
          lots: {
            include: {
              cleaningLot: {
                include: {
                  rawMaterial: true,
                  warehouse: true,
                  cleaningJob: { select: { id: true, quantity: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(dispatches);
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
      res.status(500).json({ error: 'Failed to fetch dispatches', details: error });
    }
  }

  /**
   * Get a single dispatch by ID
   */
  static async getDispatchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dispatch = await prisma.grindingDispatch.findUnique({
        where: { id },
        include: {
          inputRawMaterial: true,
          fromLocation: true,
          toLocation: true,
          lots: {
            include: {
              cleaningLot: {
                include: {
                  rawMaterial: true,
                  warehouse: true,
                  cleaningJob: { select: { id: true, quantity: true } },
                },
              },
            },
          },
        },
      });

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      res.json(dispatch);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dispatch', details: error });
    }
  }

  /**
   * Accept a dispatch (supervisor approves the incoming batch)
   */
  static async acceptDispatch(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const dispatch = await prisma.grindingDispatch.findUnique({
        where: { id },
        include: { lots: true },
      });

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      if (dispatch.status !== 'SENT') {
        res.status(400).json({ error: `Cannot accept dispatch with status "${dispatch.status}"` });
        return;
      }

      const updated = await prisma.grindingDispatch.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          inputRawMaterial: true,
          fromLocation: true,
          toLocation: true,
          lots: {
            include: {
              cleaningLot: {
                include: { rawMaterial: true, warehouse: true },
              },
            },
          },
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('Failed to accept dispatch:', error);
      res.status(500).json({ error: 'Failed to accept dispatch', details: error });
    }
  }

  /**
   * Reject a dispatch (supervisor rejects — material quantities are restored)
   */
  static async rejectDispatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        res.status(400).json({ error: 'rejectionReason is required' });
        return;
      }

      const dispatch = await prisma.grindingDispatch.findUnique({
        where: { id },
        include: {
          lots: {
            include: {
              cleaningLot: true,
            },
          },
        },
      });

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      if (dispatch.status !== 'SENT') {
        res.status(400).json({ error: `Cannot reject dispatch with status "${dispatch.status}"` });
        return;
      }

      // Transaction: restore quantities and update status
      const updated = await prisma.$transaction(async (tx) => {
        for (const lot of dispatch.lots) {
          // Restore cleanedQuantity
          if (lot.allocatedQuantity > 0) {
            await tx.cleaningLot.update({
              where: { id: lot.cleaningLotId },
              data: {
                cleanedQuantity: { increment: lot.allocatedQuantity },
                status: 'Active',
              },
            });
          }

          // Restore seed wastage
          if (lot.seedWastageAllocated > 0) {
            const lotNumber = lot.cleaningLot.lotNumber;
            const seedRecord = await tx.seedWastageRecord.findFirst({
              where: { lotNumber, source: 'cleaning' },
            });
            if (seedRecord) {
              const newAllocated = Math.max(0, seedRecord.allocatedQuantity - lot.seedWastageAllocated);
              await tx.seedWastageRecord.update({
                where: { id: seedRecord.id },
                data: {
                  allocatedQuantity: newAllocated,
                  restWastage: seedRecord.quantity - newAllocated,
                },
              });
            }
          }
        }

        return tx.grindingDispatch.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionReason,
          },
          include: {
            inputRawMaterial: true,
            fromLocation: true,
            toLocation: true,
            lots: {
              include: {
                cleaningLot: {
                  include: { rawMaterial: true, warehouse: true },
                },
              },
            },
          },
        });
      }, { timeout: 15000 });

      res.json(updated);
    } catch (error) {
      console.error('Failed to reject dispatch:', error);
      res.status(500).json({ error: 'Failed to reject dispatch', details: error });
    }
  }
}
