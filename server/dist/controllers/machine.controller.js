"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMachine = exports.getMachinesWithOutput = exports.updateMachine = exports.getMachines = exports.createMachine = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const VALID_CAPACITY_UNITS = ['BOXES_PER_SHIFT'];
const createMachine = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating machine:', error);
        res.status(500).json({ success: false, error: 'Failed to create machine' });
    }
};
exports.createMachine = createMachine;
const getMachines = async (req, res) => {
    try {
        const machines = await prisma.machine.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ success: true, data: machines });
    }
    catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch machines' });
    }
};
exports.getMachines = getMachines;
const updateMachine = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating machine:', error);
        res.status(500).json({ success: false, error: 'Failed to update machine' });
    }
};
exports.updateMachine = updateMachine;
/**
 * GET /machine/with-output
 * Returns only machines that have at least one completed FGProductionMachineEntry.
 * Each machine includes a `hasPendingAllocation` flag indicating if it currently
 * has a PENDING production entry (output not yet recorded).
 */
const getMachinesWithOutput = async (req, res) => {
    try {
        // 1. Get machines that have at least one completed production output
        const machines = await prisma.machine.findMany({
            where: {
                OR: [
                    { productionMachineEntries: { some: { actualFgQty: { gt: 0 } } } },
                    { productionEntries: { some: { status: 'COMPLETED' } } },
                ],
            },
            orderBy: { name: 'asc' },
        });
        const machineIds = machines.map(m => m.id);
        // 2. Check for pending entries via direct relation (new single-machine flow)
        const pendingDirectEntries = await prisma.fGProductionEntry.findMany({
            where: {
                machineId: { in: machineIds },
                status: 'PENDING',
            },
            select: { machineId: true, entryNumber: true, fgProductName: true },
        });
        // Build a map: machineId → pending entry info
        const pendingMap = {};
        for (const pe of pendingDirectEntries) {
            if (pe.machineId && !pendingMap[pe.machineId]) {
                pendingMap[pe.machineId] = {
                    entryNumber: pe.entryNumber,
                    productName: pe.fgProductName,
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
    }
    catch (error) {
        console.error('Error fetching machines with output:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch machines with output' });
    }
};
exports.getMachinesWithOutput = getMachinesWithOutput;
const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.machine.delete({
            where: { id },
        });
        res.status(200).json({ success: true, message: 'Machine deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting machine:', error);
        res.status(500).json({ success: false, error: 'Failed to delete machine' });
    }
};
exports.deleteMachine = deleteMachine;
