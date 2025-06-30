import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class StockEntryController {
  // Create a new stock entry (stock-in, stock-out, etc.)
  static async createStockEntry(req: Request, res: Response) {
    try {
      const {
        rawMaterialId,
        warehouseId,
        batchNumber,
        expiryDate,
        quantity,
        entryType,
        referenceId,
        status,
        reasonCode,
      } = req.body;

      const stockEntry = await prisma.stockEntry.create({
        data: {
          rawMaterialId,
          warehouseId,
          batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          quantity,
          entryType,
          referenceId,
          status,
          reasonCode,
        },
      });

      res.status(201).json(stockEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create stock entry', details: error });
    }
  }

  // Get all stock entries (with optional filters)
  static async getStockEntries(req: Request, res: Response) {
    try {
      const { rawMaterialId, warehouseId, entryType, status } = req.query;
      const where: any = {};
      if (rawMaterialId) where.rawMaterialId = rawMaterialId;
      if (warehouseId) where.warehouseId = warehouseId;
      if (entryType) where.entryType = entryType;
      if (status) where.status = status;

      const stockEntries = await prisma.stockEntry.findMany({
        where,
        include: { rawMaterial: true, warehouse: true },
      });
      res.json(stockEntries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stock entries', details: error });
    }
  }

  // Get a single stock entry by ID
  static async getStockEntryById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const stockEntry = await prisma.stockEntry.findUnique({
      where: { id },
      include: { rawMaterial: true, warehouse: true },
    });
    if (!stockEntry) {
      res.status(404).json({ error: 'Stock entry not found' });
      return; // <-- Add this line
    }
    res.json(stockEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock entry', details: error });
  }
}

  // Update a stock entry (e.g., status, quantity)
  static async updateStockEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        batchNumber,
        expiryDate,
        quantity,
        entryType,
        status,
        reasonCode,
      } = req.body;

      const stockEntry = await prisma.stockEntry.update({
        where: { id },
        data: {
          batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          quantity,
          entryType,
          status,
          reasonCode,
        },
      });

      res.json(stockEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update stock entry', details: error });
    }
  }

  static async getCurrentStockDistribution(req: Request, res: Response) {
  try {
    const stocks = await prisma.currentStock.findMany({
      include: {
        rawMaterial: true,
        warehouse: true,
      },
    });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current stock distribution', details: error });
  }
}
}