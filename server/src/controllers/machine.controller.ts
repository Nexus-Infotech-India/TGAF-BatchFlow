import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const VALID_CAPACITY_UNITS = ['BOXES_PER_SHIFT'];

export const createMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { machineId, name, location, capacityQty, capacityUnit, machineSpeed } = req.body;

    if (!VALID_CAPACITY_UNITS.includes(capacityUnit)) {
      res.status(400).json({ success: false, error: 'Invalid capacity unit. Use BOXES_PER_SHIFT' });
      return;
    }
    
    const existing = await prisma.machine.findUnique({ where: { machineId } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Machine ID already exists' });
      return;
    }

    const machine = await prisma.machine.create({
      data: {
        machineId,
        name,
        location,
        capacityQty: Number(capacityQty),
        capacityUnit,
        machineSpeed,
      },
    });

    res.status(201).json({ success: true, data: machine });
  } catch (error: any) {
    console.error('Error creating machine:', error);
    res.status(500).json({ success: false, error: 'Failed to create machine' });
  }
};

export const getMachines = async (req: Request, res: Response): Promise<void> => {
  try {
    const machines = await prisma.machine.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: machines });
  } catch (error: any) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch machines' });
  }
};

export const updateMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location, capacityQty, capacityUnit, machineId, machineSpeed } = req.body;

    if (capacityUnit && !VALID_CAPACITY_UNITS.includes(capacityUnit)) {
      res.status(400).json({ success: false, error: 'Invalid capacity unit. Use BOXES_PER_SHIFT' });
      return;
    }

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        machineId,
        name,
        location,
        capacityQty: capacityQty ? Number(capacityQty) : undefined,
        capacityUnit,
        machineSpeed,
      },
    });

    res.status(200).json({ success: true, data: machine });
  } catch (error: any) {
    console.error('Error updating machine:', error);
    res.status(500).json({ success: false, error: 'Failed to update machine' });
  }
};

/**
 * GET /machine/with-output
 * Returns only machines that have at least one completed FGProductionMachineEntry.
 * Each machine includes a `hasPendingAllocation` flag indicating if it currently
 * has a PENDING production entry (output not yet recorded).
 */
export const getMachinesWithOutput = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Return all machines from the master, annotated with pending-allocation
    //    status. Callers (e.g. New Production Entry) decide which to show as free.
    const machines = await prisma.machine.findMany({
      orderBy: { name: 'asc' },
    });

    const machineIds = machines.map(m => m.id);

    // 2a. Pending via direct relation (single-machine flow — parent.machineId set)
    const pendingDirectEntries = await prisma.fGProductionEntry.findMany({
      where: {
        machineId: { in: machineIds },
        status: 'PENDING',
      },
      select: { machineId: true, entryNumber: true, fgProductName: true },
    });

    // 2b. Pending via machineEntries relation (multi-machine flow — parent.machineId null)
    const pendingMachineEntries = await prisma.fGProductionMachineEntry.findMany({
      where: {
        machineId: { in: machineIds },
        productionEntry: { status: 'PENDING' },
      },
      select: {
        machineId: true,
        productionEntry: { select: { entryNumber: true, fgProductName: true } },
      },
    });

    // Build a map: machineId → pending entry info (first hit wins)
    const pendingMap: Record<string, { entryNumber: string; productName: string }> = {};
    for (const pe of pendingDirectEntries) {
      if (pe.machineId && !pendingMap[pe.machineId]) {
        pendingMap[pe.machineId] = {
          entryNumber: pe.entryNumber,
          productName: pe.fgProductName,
        };
      }
    }
    for (const me of pendingMachineEntries) {
      if (!pendingMap[me.machineId]) {
        pendingMap[me.machineId] = {
          entryNumber: me.productionEntry.entryNumber,
          productName: me.productionEntry.fgProductName,
        };
      }
    }

    const result = machines.map(m => ({
      ...m,
      hasPendingAllocation: !!pendingMap[m.id],
      pendingEntryNumber: pendingMap[m.id]?.entryNumber || null,
      pendingProductName: pendingMap[m.id]?.productName || null,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error fetching machines with output:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch machines with output' });
  }
};

export const deleteMachine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.machine.delete({
      where: { id },
    });
    res.status(200).json({ success: true, message: 'Machine deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ success: false, error: 'Failed to delete machine' });
  }
};
