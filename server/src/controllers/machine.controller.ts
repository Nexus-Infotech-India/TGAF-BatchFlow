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
