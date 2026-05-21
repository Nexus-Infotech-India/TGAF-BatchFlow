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
   * Creates a new FG production entry. Supports either a single machine
   * (legacy `machineId` body) or multi-machine allocation via
   * `machineAllocations: [{ machineId, allocatedQty, ... }]`.
   * Each allocation becomes one FGProductionMachineEntry; output is recorded
   * per-machine downstream.
   */
  static async createProductionEntry(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const { fgBatchId } = body;

      if (!fgBatchId) {
        res.status(400).json({ error: 'fgBatchId is required' });
        return;
      }

      // Normalize payload into an array of allocations
      const rawAllocations: any[] = Array.isArray(body.machineAllocations) && body.machineAllocations.length > 0
        ? body.machineAllocations
        : (body.machineId
            ? [{
                machineId: body.machineId,
                allocatedQty: body.allocatedQty,
                productName: body.productName,
                instulationCapacity: body.instulationCapacity,
                instulationCapacityUnit: body.instulationCapacityUnit,
                laminateConsumptionQty: body.laminateConsumptionQty,
                laminateConsumptionUnit: body.laminateConsumptionUnit,
                sfgConsumptionQty: body.sfgConsumptionQty,
                sfgConsumptionUnit: body.sfgConsumptionUnit,
                manPower: body.manPower,
                notes: body.notes,
              }]
            : []);

      if (rawAllocations.length === 0) {
        res.status(400).json({ error: 'At least one machine allocation is required' });
        return;
      }

      // Reject duplicate machineIds within the same plan
      const machineIds = rawAllocations.map(a => a.machineId).filter(Boolean);
      if (machineIds.length !== new Set(machineIds).size) {
        res.status(400).json({ error: 'A machine cannot be allocated more than once in the same plan' });
        return;
      }
      if (machineIds.length !== rawAllocations.length) {
        res.status(400).json({ error: 'Every allocation must include a machineId' });
        return;
      }

      const fgBatch = await prisma.fGBatch.findUnique({ where: { id: fgBatchId } });
      if (!fgBatch) {
        res.status(404).json({ error: 'FG Batch not found' });
        return;
      }

      const existingEntry = await prisma.fGProductionEntry.findFirst({ where: { fgBatchId } });
      if (existingEntry) {
        res.status(400).json({ error: 'A production allocation already exists for this FG Batch' });
        return;
      }

      // Fetch all selected machines in one go
      const machines = await prisma.machine.findMany({ where: { id: { in: machineIds } } });
      if (machines.length !== machineIds.length) {
        res.status(404).json({ error: 'One or more selected machines were not found' });
        return;
      }
      const machineById: Record<string, typeof machines[number]> = {};
      machines.forEach(m => { machineById[m.id] = m; });

      // Reject machines that already have a PENDING allocation (busy)
      const busyDirect = await prisma.fGProductionEntry.findMany({
        where: { machineId: { in: machineIds }, status: 'PENDING' },
        select: { machineId: true, entryNumber: true },
      });
      const busyViaEntries = await prisma.fGProductionMachineEntry.findMany({
        where: {
          machineId: { in: machineIds },
          productionEntry: { status: 'PENDING' },
        },
        select: { machineId: true, productionEntry: { select: { entryNumber: true } } },
      });
      const busyMachineIds = new Set<string>([
        ...busyDirect.map(b => b.machineId).filter((x): x is string => !!x),
        ...busyViaEntries.map(b => b.machineId),
      ]);
      if (busyMachineIds.size > 0) {
        const busyNames = Array.from(busyMachineIds).map(id => machineById[id]?.name || id);
        res.status(400).json({
          error: `Cannot allocate — these machines have pending output: ${busyNames.join(', ')}`,
        });
        return;
      }

      // Validate per-row allocatedQty
      let totalAllocated = 0;
      for (const a of rawAllocations) {
        const q = Number(a.allocatedQty);
        if (!q || q <= 0) {
          res.status(400).json({ error: `Each machine must have a positive allocatedQty (machine: ${machineById[a.machineId]?.name || a.machineId})` });
          return;
        }
        totalAllocated += q;
      }

      // Allow small float tolerance against the FG batch target
      if (Math.abs(totalAllocated - fgBatch.productionQty) > 0.001) {
        res.status(400).json({
          error: `Sum of machine allocations (${totalAllocated}) must equal planned production (${fgBatch.productionQty} ${fgBatch.productionUnit})`,
        });
        return;
      }

      // Build per-machine entry payloads
      // Generate FGMB batch IDs for each machine entry
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const fgmbPrefix = `FGMB-${dateStr}-`;
      const lastMachineBatch = await prisma.fGProductionMachineEntry.findFirst({
        where: { machineBatchId: { startsWith: fgmbPrefix } },
        orderBy: { machineBatchId: 'desc' },
      });
      let fgmbSeq = 1;
      if (lastMachineBatch?.machineBatchId) {
        const lastSeq = parseInt(lastMachineBatch.machineBatchId.replace(fgmbPrefix, ''), 10);
        if (!isNaN(lastSeq)) fgmbSeq = lastSeq + 1;
      }

      const machineEntryDatas = rawAllocations.map((a, i) => {
        const m = machineById[a.machineId];
        const machineBatchId = `${fgmbPrefix}${String(fgmbSeq + i).padStart(4, '0')}`;

        // packagingConsumptions: optional array of detailed per-PKG consumption
        // (one record per packaging material per machine). Used to support
        // up to 3 different packaging materials on a single machine.
        const pkgList = Array.isArray(a.packagingConsumptions) ? a.packagingConsumptions : [];
        const pkgCreateData = pkgList
          .filter((p: any) => p && (p.rawMaterialId || p.productName) && Number(p.quantity) > 0)
          .map((p: any) => ({
            rawMaterialId: p.rawMaterialId || null,
            transferNumber: p.transferNumber || null,
            productName: p.productName || null,
            skuCode: p.skuCode || null,
            quantity: Number(p.quantity) || 0,
            unitOfMeasurement: p.unitOfMeasurement || p.unit || 'KG',
          }));

        // For backward compatibility, populate aggregated laminateConsumptionQty
        // as the sum of all PKG entries in KG (or fall back to legacy single field).
        let aggLaminateQty: number | null = null;
        let aggLaminateUnit: string | null = null;
        if (pkgCreateData.length > 0) {
          const toKg = (val: number, unit: string) => {
            const u = (unit || 'KG').toLowerCase();
            if (u === 'gram' || u === 'g' || u === 'grams') return val / 1000;
            if (u === 'ton' || u === 'tons' || u === 'mt') return val * 1000;
            return val;
          };
          aggLaminateQty = pkgCreateData.reduce((s: number, p: any) => s + toKg(p.quantity, p.unitOfMeasurement), 0);
          aggLaminateUnit = 'KG';
        } else if (a.laminateConsumptionQty != null) {
          aggLaminateQty = Number(a.laminateConsumptionQty);
          aggLaminateUnit = a.laminateConsumptionUnit || null;
        }

        return {
          machineBatchId,
          machineId: m.id,
          machineName: m.name,
          allocatedQty: Number(a.allocatedQty),
          allocatedUnit: fgBatch.productionUnit,
          actualFgQty: 0,
          actualFgUnit: fgBatch.productionUnit,
          actualByproduct: 0,
          actualByproductUnit: fgBatch.productionUnit,
          actualScrap: 0,
          actualScrapUnit: fgBatch.productionUnit,
          productName: a.productName || null,
          instulationCapacity: a.instulationCapacity != null ? Number(a.instulationCapacity) : null,
          instulationCapacityUnit: a.instulationCapacityUnit || null,
          laminateConsumptionQty: aggLaminateQty,
          laminateConsumptionUnit: aggLaminateUnit,
          sfgConsumptionQty: a.sfgConsumptionQty != null ? Number(a.sfgConsumptionQty) : null,
          sfgConsumptionUnit: a.sfgConsumptionUnit || null,
          manPower: a.manPower !== undefined ? Boolean(a.manPower) : true,
          notes: a.notes || null,
          ...(pkgCreateData.length > 0 ? { packagingConsumptions: { create: pkgCreateData } } : {}),
        };
      });

      // Generate entry number (reuse today & dateStr from above)
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
      const entryNumber = `${prefix}${String(seq).padStart(4, '0')}`;

      const tokenUserId = (req as any).user?.id;
      let resolvedUserId = tokenUserId;
      if (!resolvedUserId) {
        const fallbackUser = await prisma.user.findFirst();
        resolvedUserId = fallbackUser?.id || 'system';
      }

      // Single-machine: keep parent.machineId/machineName populated for legacy display.
      // Multi-machine: leave them null — downstream UI iterates machineEntries[].
      const isSingle = rawAllocations.length === 1;
      const parentMachineId = isSingle ? machineEntryDatas[0].machineId : null;
      const parentMachineName = isSingle ? machineEntryDatas[0].machineName : null;
      const parentNotes = isSingle ? machineEntryDatas[0].notes : null;

      const productionEntry = await prisma.$transaction(async (tx) => {
        const created = await tx.fGProductionEntry.create({
          data: {
            entryNumber,
            fgBatchId,
            bomId: fgBatch.bomId,
            fgProductName: fgBatch.fgProductName,
            targetQty: fgBatch.productionQty,
            targetUnit: fgBatch.productionUnit,
            machineId: parentMachineId,
            machineName: parentMachineName,
            totalActualFg: 0,
            totalActualByproduct: 0,
            totalActualScrap: 0,
            status: 'PENDING',
            notes: parentNotes,
            createdById: resolvedUserId,
            machineEntries: { create: machineEntryDatas },
          },
          include: { machineEntries: { include: { packagingConsumptions: true } }, machine: true },
        });

        await tx.fGBatch.update({
          where: { id: fgBatchId },
          data: { status: 'IN_PRODUCTION' },
        });

        const machineSummary = machineEntryDatas
          .map(me => `${me.machineName} (${me.allocatedQty} ${fgBatch.productionUnit})`)
          .join(', ');
        await tx.transactionLog.create({
          data: {
            type: 'FG_PRODUCTION_ENTRY',
            entity: 'FGProductionEntry',
            entityId: created.id,
            userId: resolvedUserId,
            description: `FG Production Allocation created: ${entryNumber}. Product: ${fgBatch.fgProductName}. Machines: ${machineSummary}.`,
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
          machineCount: machineEntryDatas.length,
          totalAllocatedQty: totalAllocated,
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
          machine: true,
          machineEntries: {
            include: { machine: true, downtimeRecords: true, qualityReport: { include: { parameters: true } } },
          },
          fgBatch: true,
          qualityReports: { include: { parameters: true } },
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
            include: { machine: true, qualityReport: { include: { parameters: true } } },
          },
          fgBatch: { include: { consumptions: true } },
          qualityReports: { include: { parameters: true } },
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

      // Quality parameters are now optional — submitted separately via FG Quality Check page

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
      let totalAchievedBoxes = 0;

      await prisma.$transaction(async (tx) => {
        for (const input of machineEntries) {
          const actualFgQty = Number(input.actualFgQty) || 0;
          const actualByproduct = Number(input.actualByproduct) || 0;
          const actualScrap = Number(input.actualScrap) || 0;
          
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
          totalAchievedBoxes += todayAchieve || 0;

          const powderWastageKg = input.powderWastageKg != null ? Number(input.powderWastageKg) : null;
          const powderWastagePercentage = input.powderWastagePercentage != null ? Number(input.powderWastagePercentage) : null;
          const manPowerCount = input.manPowerCount != null ? Number(input.manPowerCount) : null;
          const shift = input.shift || null;
          const machineUtilizedHrs = input.machineUtilizedHrs != null ? Number(input.machineUtilizedHrs) : null;
          const machineNotUtilizedHrs = input.machineNotUtilizedHrs != null ? Number(input.machineNotUtilizedHrs) : null;

          await tx.fGProductionMachineEntry.update({
            where: { id: input.id },
            data: {
              actualFgQty,
              actualFgUnit: actualUnit,
              actualByproduct,
              actualByproductUnit,
              actualScrap,
              actualScrapUnit,
              machineSpeed,
              todayAchieve,
              laminateConsumption,
              sfgConsumption,
              laminateWastageKg,
              laminateWastagePercentage,
              noManPower,
              powderWastageKg,
              powderWastagePercentage,
              manPowerCount,
              shift,
              machineUtilizedHrs,
              machineNotUtilizedHrs,
            },
          });

          // Create downtime records if machine has not-utilized hours
          if (Array.isArray(input.downtimeRecords) && input.downtimeRecords.length > 0) {
            await tx.fGDowntimeRecord.createMany({
              data: input.downtimeRecords.map((dt: any) => ({
                machineEntryId: input.id,
                startTime: dt.startTime || '',
                stopTime: dt.stopTime || '',
                breakdownReason: dt.breakdownReason || '',
                remark: dt.remark || null,
              })),
            });
          }
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
            totalAchievedBoxes,
            status: 'COMPLETED',
          },
        });

        await tx.fGBatch.update({
          where: { id: existingEntry.fgBatchId },
          data: { status: 'PRODUCTION_COMPLETED' },
        });

        // Create quality report only if qualityParameters were provided (legacy flow)
        if (Array.isArray(qualityParameters) && qualityParameters.length > 0) {
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
        }

        await tx.transactionLog.create({
          data: {
            type: 'FG_PRODUCTION_OUTPUT',
            entity: 'FGProductionEntry',
            entityId: id,
            userId: actingUserId,
            description: `FG Production Output submitted for ${existingEntry.entryNumber}. Actual FG: ${totalActualFg}`,
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
   * Records FG quality check details for a specific machine entry within the production entry.
   * Body: { machineEntryId, parameters: [{ parameter, standard, result }] }
   */
  static async submitQualityCheck(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // production entry id
      const { machineEntryId, parameters } = req.body;

      if (!Array.isArray(parameters) || parameters.length === 0) {
        res.status(400).json({ error: 'Quality parameters are required' });
        return;
      }

      const existingEntry = await prisma.fGProductionEntry.findUnique({
        where: { id },
        include: { qualityReports: true, machineEntries: true },
      });

      if (!existingEntry) {
        res.status(404).json({ error: 'Production entry not found' });
        return;
      }

      // If machineEntryId provided, check it belongs to this entry and has no report
      let targetMachineEntry: any = null;
      if (machineEntryId) {
        targetMachineEntry = existingEntry.machineEntries.find(me => me.id === machineEntryId);
        if (!targetMachineEntry) {
          res.status(400).json({ error: 'Machine entry not found for this production entry' });
          return;
        }
        const existingMachineReport = existingEntry.qualityReports.find(
          (r: any) => r.machineEntryId === machineEntryId
        );
        if (existingMachineReport) {
          res.status(400).json({ error: `Quality check already exists for machine ${targetMachineEntry.machineName}` });
          return;
        }
      } else {
        // Legacy: no machineEntryId, check if any report exists
        if (existingEntry.qualityReports.length > 0) {
          res.status(400).json({ error: 'Quality check already exists for this entry' });
          return;
        }
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
          machineEntryId: machineEntryId || null,
          fgBatchId: existingEntry.fgBatchId,
          productName: existingEntry.fgProductName,
          machineName: targetMachineEntry?.machineName || null,
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
