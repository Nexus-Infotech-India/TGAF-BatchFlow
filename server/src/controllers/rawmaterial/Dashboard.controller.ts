import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class DashboardController {
  // 📦 Total Raw Material Stock (kg/litre)
  static async getTotalRawMaterialStock(req: Request, res: Response) {
    try {
      const stocks = await prisma.currentStock.findMany();
      const total = stocks.reduce((sum, s) => sum + (s.currentQuantity || 0), 0);
      res.json({ totalRawMaterialStock: total });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch total raw material stock', details: error });
    }
  }

  // 🚚 POs Pending Delivery
  static async getPendingPOCount(req: Request, res: Response) {
    try {
      const count = await prisma.purchaseOrder.count({
        where: {
          status: { not: 'Received' },
        },
      });
      res.json({ pendingPOs: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending POs', details: error });
    }
  }

  // 🔍 Stock Under Cleaning
  static async getStockUnderCleaning(req: Request, res: Response) {
    try {
      // Sum quantity of all cleaning jobs with status not Cleaned/Finished
      const cleaningJobs = await prisma.cleaningJob.findMany({
        where: {
          status: { in: ['Sent', 'In-Progress'] },
        },
      });
      const total = cleaningJobs.reduce((sum, job) => sum + (job.quantity || 0), 0);
      res.json({ stockUnderCleaning: total });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stock under cleaning', details: error });
    }
  }

  // 🛠️ In Processing
  static async getStockInProcessing(req: Request, res: Response) {
    try {
      // Sum quantityInput of all processing jobs with status not Finished/Completed
      const processingJobs = await prisma.processingJob.findMany({
        where: {
          status: { in: ['In-Progress'] },
        },
      });
      const total = processingJobs.reduce((sum, job) => sum + (job.quantityInput || 0), 0);
      res.json({ stockInProcessing: total });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stock in processing', details: error });
    }
  }

  // ⚠️ Low Stock Alerts
  static async getLowStockAlerts(req: Request, res: Response) {
    try {
      // For each SKU, sum across warehouses, compare to minReorderLevel
      const products = await prisma.rawMaterialProduct.findMany();
      const stocks = await prisma.currentStock.findMany();
      const skuTotals: Record<string, number> = {};
      stocks.forEach(s => {
        skuTotals[s.rawMaterialId] = (skuTotals[s.rawMaterialId] || 0) + (s.currentQuantity || 0);
      });
      const lowStock = products
        .filter(p => skuTotals[p.id] !== undefined && skuTotals[p.id] < p.minReorderLevel)
        .map(p => ({
          skuCode: p.skuCode,
          name: p.name,
          available: skuTotals[p.id] || 0,
          minReorderLevel: p.minReorderLevel,
        }));
      res.json({ lowStockAlerts: lowStock });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch low stock alerts', details: error });
    }
  }

  // ♻️ Unusable/Waste Stock
  static async getWasteStock(req: Request, res: Response) {
    try {
      // Sum quantity from UnfinishedStock (rejected) and ByProduct (waste)
      const unfinished = await prisma.unfinishedStock.aggregate({
        _sum: { quantity: true },
      });
      const byProduct = await prisma.byProduct.aggregate({
        _sum: { quantity: true },
      });
      res.json({
        wasteStock: {
          unfinished: unfinished._sum.quantity || 0,
          byProduct: byProduct._sum.quantity || 0,
          total: (unfinished._sum.quantity || 0) + (byProduct._sum.quantity || 0),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch waste stock', details: error });
    }
  }
}