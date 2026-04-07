import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

/* ─── Unit conversion helpers ─── */
const UNIT_TO_GRAMS: Record<string, number> = {
  gram: 1, grams: 1, g: 1,
  kg: 1000, KG: 1000, Kg: 1000,
  ton: 1_000_000, Ton: 1_000_000, TON: 1_000_000, tonne: 1_000_000,
  quintal: 100_000, Quintal: 100_000,
};

function toGrams(qty: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? UNIT_TO_GRAMS[unit.toLowerCase()] ?? 1;
  return qty * factor;
}

/* Normalize capacity to Ton for consistent allocation */
function capacityInTon(machine: { capacityQty: number; capacityUnit: string }): number {
  if (machine.capacityUnit === 'TON_PER_SHIFT') return machine.capacityQty;
  if (machine.capacityUnit === 'KG_PER_SHIFT') return machine.capacityQty / 1000;
  return machine.capacityQty; // assume ton
}

export class FGProductionController {
  /**
   * GET /fg-batch/accepted-batches
   * Returns FG batches with status ACCEPTED (ready for production).
   */
  static async getAcceptedBatches(req: Request, res: Response): Promise<void> {
    try {
      const batches = await prisma.fGBatch.findMany({
        where: { status: 'ACCEPTED' },
        include: { consumptions: true },
        orderBy: { createdAt: 'desc' },
      });

      // Also check if a production entry already exists for each batch
      const batchIds = batches.map(b => b.id);
      const existingEntries = await prisma.fGProductionEntry.findMany({
        where: { fgBatchId: { in: batchIds } },
        select: { fgBatchId: true },
      });
      const usedBatchIds = new Set(existingEntries.map((e: any) => e.fgBatchId));

      const result = batches.map(b => ({
        ...b,
        hasProductionEntry: usedBatchIds.has(b.id),
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error fetching accepted FG batches:', error);
      res.status(500).json({ error: 'Failed to fetch accepted FG batches', details: error });
    }
  }

  /**
   * POST /fg-batch/production-entry
   * Creates a new FG production entry with automatic machine allocation
   * and supervisor's actual output per machine.
   */
  static async createProductionEntry(req: Request, res: Response): Promise<void> {
    try {
      const {
        fgBatchId,
        machineEntries, // Array of { machineId, allocatedQty, plannedPackets, notes }
        notes,
      } = req.body;

      if (!fgBatchId) {
        res.status(400).json({ error: 'fgBatchId is required' });
        return;
      }

      if (!Array.isArray(machineEntries) || machineEntries.length === 0) {
        res.status(400).json({ error: 'At least one machine assignment is required' });
        return;
      }

      // Fetch the FG batch
      const fgBatch = await prisma.fGBatch.findUnique({
        where: { id: fgBatchId },
      });

      if (!fgBatch) {
        res.status(404).json({ error: 'FG Batch not found' });
        return;
      }

      // Check if production entry already exists
      const existingEntry = await prisma.fGProductionEntry.findFirst({
        where: { fgBatchId },
      });
      if (existingEntry) {
        res.status(400).json({ error: 'A production allocation already exists for this FG Batch' });
        return;
      }

      // Fetch machines
      const machineIds = machineEntries.map((m: any) => m.machineId);
      const machines = await prisma.machine.findMany({
        where: { id: { in: machineIds } },
      });

      let totalPlannedPackets = 0;
      let totalPlannedCartons = 0;
      let totalAllocatedQty = 0;

      const packetSizeGrams = fgBatch.packetSize && fgBatch.packetUnit
        ? toGrams(fgBatch.packetSize, fgBatch.packetUnit)
        : 0;

      const enrichedEntries = machineEntries.map((entry: any) => {
        const machine = machines.find(m => m.id === entry.machineId)!;
        const allocatedQty = Number(entry.allocatedQty) || 0;
        const plannedPackets = Number(entry.plannedPackets) || 0;
        const plannedCartons = Number(entry.plannedCartons) || 0;

        totalAllocatedQty += allocatedQty;
        totalPlannedPackets += plannedPackets;
        totalPlannedCartons += plannedCartons;

        return {
          machineId: machine.id,
          machineName: machine.name,
          allocatedQty,
          allocatedUnit: fgBatch.productionUnit,
          plannedPackets,
          plannedCartons,
          actualFgQty: 0,
          actualFgUnit: fgBatch.productionUnit,
          actualByproduct: 0,
          actualByproductUnit: fgBatch.productionUnit,
          actualScrap: 0,
          actualScrapUnit: fgBatch.productionUnit,
          actualPackets: 0,
          actualCartons: 0,
          notes: entry.notes || null,
        };
      });

      // Validation: total allocated shouldn't wildly exceed batch target
      if (totalAllocatedQty > fgBatch.productionQty * 1.05) {
        res.status(400).json({
          error: `Total allocated quantity (${totalAllocatedQty}) exceeds batch target (${fgBatch.productionQty}) by more than 5%.`,
        });
        return;
      }

      // Generate entry number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `PP-${dateStr}-`;
      const lastEntry = await prisma.fGProductionEntry.findFirst({
        where: { entryNumber: { startsWith: prefix } },
        orderBy: { entryNumber: 'desc' },
      });
      let seq = 1;
      if (lastEntry?.entryNumber) {
        const lastSeq = parseInt(lastEntry.entryNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      // We already calculated totalPlannedPackets during mapping from user input
      const entryNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      // Resolve acting user before the transaction so FK constraints don't break
      const tokenUserId = (req as any).user?.id;
      let resolvedUserId = tokenUserId;
      if (!resolvedUserId) {
        const fallbackUser = await prisma.user.findFirst();
        resolvedUserId = fallbackUser?.id || 'system';
      }

      const productionEntry = await prisma.$transaction(async (tx) => {
        const created = await tx.fGProductionEntry.create({
          data: {
            entryNumber,
            fgBatchId,
            bomId: fgBatch.bomId,
            fgProductName: fgBatch.fgProductName,
            targetQty: fgBatch.productionQty,
            targetUnit: fgBatch.productionUnit,
            packetSize: fgBatch.packetSize,
            packetUnit: fgBatch.packetUnit,
            cartonCapacity: fgBatch.cartonCapacity,
            totalPlannedPackets,
            totalPlannedCartons,
            totalActualFg: 0,
            totalActualByproduct: 0,
            totalActualScrap: 0,
            totalActualPackets: 0,
            totalActualCartons: 0,
            status: 'PENDING',
            notes: notes || null,
            createdById: resolvedUserId,
            machineEntries: {
              create: enrichedEntries,
            },
          },
          include: { machineEntries: true },
        });

        // Update FG Batch status to reflect it is in production mapping
        await tx.fGBatch.update({
          where: { id: fgBatchId },
          data: { status: 'IN_PRODUCTION' },
        });

        // Log the transaction
        await tx.transactionLog.create({
          data: {
            type: 'FG_PRODUCTION_ENTRY',
            entity: 'FGProductionEntry',
            entityId: created.id,
            userId: resolvedUserId,
            description: `FG Production Allocation created: ${entryNumber}. Product: ${fgBatch.fgProductName}. Allocated to ${machineEntries.length} machines.`,
          },
        });

        return created;
      }, { timeout: 15000 });

      res.status(201).json({
        success: true,
        data: productionEntry,
        summary: {
          entryNumber,
          fgProductName: fgBatch.fgProductName,
          targetQty: fgBatch.productionQty,
          targetUnit: fgBatch.productionUnit,
          totalAllocatedQty,
          totalPlannedPackets,
        },
      });
    } catch (error) {
      console.error('Error creating FG production entry:', error);
      res.status(500).json({ error: 'Failed to create FG production entry', details: error });
    }
  }

  /**
   * GET /fg-batch/production-entries
   * Returns all FG production entries.
   */
  static async getProductionEntries(req: Request, res: Response): Promise<void> {
    try {
      const entries = await prisma.fGProductionEntry.findMany({
        include: {
          machineEntries: {
            include: { machine: true },
          },
          fgBatch: true,
          qualityReport: { include: { parameters: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: entries });
    } catch (error) {
      console.error('Error fetching production entries:', error);
      res.status(500).json({ error: 'Failed to fetch production entries', details: error });
    }
  }

  /**
   * GET /fg-batch/production-entries/:id
   * Returns a single FG production entry.
   */
  static async getProductionEntryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await prisma.fGProductionEntry.findUnique({
        where: { id },
        include: {
          machineEntries: {
            include: { machine: true },
          },
          fgBatch: { include: { consumptions: true } },
          qualityReport: { include: { parameters: true } },
        },
      });
      if (!entry) {
        res.status(404).json({ error: 'Production entry not found' });
        return;
      }
      res.json({ success: true, data: entry });
    } catch (error) {
      console.error('Error fetching production entry:', error);
      res.status(500).json({ error: 'Failed to fetch production entry', details: error });
    }
  }

  /**
   * PUT /fg-batch/production-entries/:id/complete
   * Records supervisor actual outputs and marks production entry as COMPLETED
   */
  static async submitProductionOutput(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { machineEntries, qualityParameters } = req.body; // Array of { id, actualFgQty... } and { parameter, standard, result }

      if (!Array.isArray(machineEntries) || machineEntries.length === 0) {
        res.status(400).json({ error: 'No machine outputs provided' });
        return;
      }

      const existingEntry = await prisma.fGProductionEntry.findUnique({
        where: { id },
        include: { 
          machineEntries: true,
          fgBatch: true
        },
      });

      if (!existingEntry) {
        res.status(404).json({ error: 'Production entry not found' });
        return;
      }

      if (existingEntry.status === 'COMPLETED') {
        res.status(400).json({ error: 'Production entry is already completed' });
        return;
      }

      if (!Array.isArray(qualityParameters) || qualityParameters.length === 0) {
        res.status(400).json({ error: 'Quality parameters are strictly required before completing production.' });
        return;
      }

      // Resolve acting user before the transaction so FK constraints don't break
      const tokenUserId = (req as any).user?.id;
      let actingUserId = tokenUserId;
      if (!actingUserId) {
        const fallbackUser = await prisma.user.findFirst();
        if (!fallbackUser) {
          res.status(500).json({ error: 'No user found in the system to associate with this action' });
          return;
        }
        actingUserId = fallbackUser.id;
      }

      let totalActualFg = 0;
      let totalActualByproduct = 0;
      let totalActualScrap = 0;
      let totalActualPackets = 0;
      let totalActualCartons = 0;

      await prisma.$transaction(async (tx) => {
        for (const input of machineEntries) {
          const actualFgQty = Number(input.actualFgQty) || 0;
          const actualByproduct = Number(input.actualByproduct) || 0;
          const actualScrap = Number(input.actualScrap) || 0;
          const actualPackets = Number(input.actualPackets) || 0;
          const actualCartons = Number(input.actualCartons) || 0;
          
          const machineSpeed = input.machineSpeed != null ? String(input.machineSpeed) : null;
          const todayAchieve = input.todayAchieve != null ? Number(input.todayAchieve) : null;
          const laminateConsumption = input.laminateConsumption != null ? Number(input.laminateConsumption) : null;
          const sfgConsumption = input.sfgConsumption != null ? Number(input.sfgConsumption) : null;
          const laminateWastageKg = input.laminateWastageKg != null ? Number(input.laminateWastageKg) : null;
          const laminateWastagePercentage = input.laminateWastagePercentage != null ? Number(input.laminateWastagePercentage) : null;
          const noManPower = Boolean(input.noManPower);
          
          const actualUnit = input.actualUnit || existingEntry.targetUnit || 'Ton';
          const actualByproductUnit = input.actualByproductUnit || existingEntry.targetUnit || 'Ton';
          const actualScrapUnit = input.actualScrapUnit || existingEntry.targetUnit || 'Ton';

          // Convert all inputs to targetUnit so we can safely add them up
          const factor = (unit: string) => {
            const u = unit.toLowerCase();
            if (u === 'ton') return 1000000;
            if (u === 'kg') return 1000;
            if (u === 'gram') return 1;
            return 1000;
          };
          
          const fOut = factor(existingEntry.targetUnit || 'Ton');

          // Normalized quantities into targetUnit
          totalActualFg += (actualFgQty * factor(actualUnit)) / fOut;
          totalActualByproduct += (actualByproduct * factor(actualByproductUnit)) / fOut;
          totalActualScrap += (actualScrap * factor(actualScrapUnit)) / fOut;
          totalActualPackets += actualPackets;
          totalActualCartons += actualCartons;

          await tx.fGProductionMachineEntry.update({
            where: { id: input.id },
            data: {
              actualFgQty,
              actualFgUnit: actualUnit,
              actualByproduct,
              actualByproductUnit,
              actualScrap,
              actualScrapUnit,
              actualPackets,
              actualCartons,
              machineSpeed,
              todayAchieve,
              laminateConsumption,
              sfgConsumption,
              laminateWastageKg,
              laminateWastagePercentage,
              noManPower,
            },
          });
        }

        // Validate total against batch target
        if (totalActualFg > existingEntry.targetQty * 1.05) {
          throw new Error(`Total actual FG (${totalActualFg}) exceeds allocated (${existingEntry.targetQty}) by more than 5%`);
        }

        await tx.fGProductionEntry.update({
          where: { id },
          data: {
            totalActualFg,
            totalActualByproduct,
            totalActualScrap,
            totalActualPackets,
            totalActualCartons,
            status: 'COMPLETED',
          },
        });

        await tx.fGBatch.update({
          where: { id: existingEntry.fgBatchId },
          data: { status: 'PRODUCTION_COMPLETED' },
        });

        // Add quality report since we strictly required it above
        // Generate report number
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `FGQ-${dateStr}-`;
        const lastReport = await tx.fGQualityReport.findFirst({
          where: { reportNumber: { startsWith: prefix } },
          orderBy: { reportNumber: 'desc' },
        });
        let seq = 1;
        if (lastReport?.reportNumber) {
          const lastSeq = parseInt(lastReport.reportNumber.replace(prefix, ''), 10);
          if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }
        const reportNumber = `${prefix}${String(seq).padStart(4, '0')}`;

        await tx.fGQualityReport.create({
          data: {
            reportNumber,
            productionEntryId: id,
            fgBatchId: existingEntry.fgBatchId,
            productName: existingEntry.fgProductName,
            createdById: actingUserId,
            parameters: {
              create: qualityParameters.map((p: any) => ({
                parameter: p.parameter,
                standard: p.standard,
                result: p.result || '-',
              })),
            },
          },
        });

        await tx.transactionLog.create({
          data: {
            type: 'FG_PRODUCTION_OUTPUT',
            entity: 'FGProductionEntry',
            entityId: id,
            userId: actingUserId,
            description: `FG Production Output submitted for ${existingEntry.entryNumber}. Actual FG: ${totalActualFg}, Packets: ${totalActualPackets}`,
          },
        });
      }, { timeout: 15000 });

      res.json({ success: true, message: 'Production output recorded fully' });
    } catch (error: any) {
      console.error('Error submitting production output:', error);
      res.status(500).json({ error: error.message || 'Failed to submit production output' });
    }
  }

  /**
   * POST /fg-batch/production-entries/:id/quality
   * Records FG quality check details for the given production entry.
   */
  static async submitQualityCheck(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // production entry id
      const { parameters } = req.body; // Array of { parameter, standard, result }

      if (!Array.isArray(parameters) || parameters.length === 0) {
        res.status(400).json({ error: 'Quality parameters are required' });
        return;
      }

      const existingEntry = await prisma.fGProductionEntry.findUnique({
        where: { id },
        include: { qualityReport: true },
      });

      if (!existingEntry) {
        res.status(404).json({ error: 'Production entry not found' });
        return;
      }

      if (existingEntry.qualityReport) {
        res.status(400).json({ error: 'Quality check already exists for this entry' });
        return;
      }

      // Resolve acting user so FK constraints don't break
      let createdById = (req as any).user?.id;
      if (!createdById) {
        const fallbackUser = await prisma.user.findFirst();
        if (!fallbackUser) {
          res.status(500).json({ error: 'No user found in the system to associate with this action' });
          return;
        }
        createdById = fallbackUser.id;
      }

      // Generate report number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `FGQ-${dateStr}-`;
      const lastReport = await prisma.fGQualityReport.findFirst({
        where: { reportNumber: { startsWith: prefix } },
        orderBy: { reportNumber: 'desc' },
      });
      let seq = 1;
      if (lastReport?.reportNumber) {
        const lastSeq = parseInt(lastReport.reportNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const reportNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const qualityReport = await prisma.fGQualityReport.create({
        data: {
          reportNumber,
          productionEntryId: id,
          fgBatchId: existingEntry.fgBatchId,
          productName: existingEntry.fgProductName,
          createdById,
          parameters: {
            create: parameters.map((p: any) => ({
              parameter: p.parameter,
              standard: p.standard,
              result: p.result,
            })),
          },
        },
        include: { parameters: true },
      });

      res.status(201).json({ success: true, data: qualityReport, message: 'Quality check submitted successfully' });
    } catch (error: any) {
      console.error('Error submitting quality check:', error);
      res.status(500).json({ error: error.message || 'Failed to submit quality check' });
    }
  }
}
