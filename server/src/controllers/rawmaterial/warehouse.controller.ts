import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class WarehouseController {
  // Create a new warehouse
  static async createWarehouse(req: Request, res: Response) {
    try {
      const { name, location } = req.body;
      const warehouse = await prisma.warehouse.create({
        data: { name, location },
      });

      await prisma.transactionLog.create({
        data: {
          type: 'CREATE',
          entity: 'Warehouse',
          entityId: warehouse.id,
          userId: req.user?.id || 'system',
          description: `Created warehouse: ${warehouse.name}\nDetails: ${JSON.stringify(warehouse, null, 2)}`,
        },
      });
      res.status(201).json(warehouse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create warehouse', details: error });
    }
  }

  // Get all warehouses
  static async getWarehouses(req: Request, res: Response) {
    try {
      const warehouses = await prisma.warehouse.findMany();
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch warehouses', details: error });
    }
  }

  // Get a single warehouse by ID
  static async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const warehouse = await prisma.warehouse.findUnique({ where: { id } });
      if (!warehouse) {
        res.status(404).json({ error: 'Warehouse not found' });
      }
      res.json(warehouse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch warehouse', details: error });
    }
  }

  // Update warehouse details
  static async updateWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, location } = req.body;
      const warehouse = await prisma.warehouse.update({
        where: { id },
        data: { name, location },
      });
      await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'Warehouse',
          entityId: warehouse.id,
          userId: req.user?.id || 'system',
          description: `Updated warehouse: ${warehouse.name}\nDetails: ${JSON.stringify(warehouse, null, 2)}`,
        },
      });
      res.json(warehouse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update warehouse', details: error });
    }
  }

  // Delete a warehouse
  static async deleteWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const warehouse = await prisma.warehouse.delete({ where: { id } });

      // Transaction log
      await prisma.transactionLog.create({
        data: {
          type: 'DELETE',
          entity: 'Warehouse',
          entityId: warehouse.id,
          userId: req.user?.id || 'system',
          description: `Deleted warehouse: ${warehouse.name}\nDetails: ${JSON.stringify(warehouse, null, 2)}`,
        },
      });

      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete warehouse', details: error });
    }
  }
}