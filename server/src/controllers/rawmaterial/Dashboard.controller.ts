import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class DashboardController {
  // 📦 Total Raw Material Stock (kg/litre) - Return all stock details
  static async getTotalRawMaterialStock(req: Request, res: Response) {
    try {
      const stocks = await prisma.currentStock.findMany({
        include: {
          rawMaterial: true,
          warehouse: true,
        },
      });
      const total = stocks.reduce((sum, s) => sum + (s.currentQuantity || 0), 0);
      res.json({ 
        totalRawMaterialStock: total,
        details: stocks
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch total raw material stock', details: error });
    }
  }

  // 🚚 POs Pending Delivery - Return all pending PO details
  static async getPendingPOCount(req: Request, res: Response) {
  try {
    // Find all purchase order items whose status is not 'Received'
    const pendingItems = await prisma.purchaseOrderItem.findMany({
      where: {
        status: { not: 'Received' },
      },
      include: {
        purchaseOrder: {
          include: { vendor: true }
        },
        rawMaterial: true,
      }
    });
    res.json({
      pendingPOs: pendingItems.length,
      details: pendingItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending PO items', details: error });
  }
}

  // 🔍 Stock Under Cleaning - Return all cleaning jobs in progress
  static async getStockUnderCleaning(req: Request, res: Response) {
    try {
      const cleaningJobs = await prisma.cleaningJob.findMany({
        where: {
          status: { in: ['Sent', 'In-Progress'] },
        },
        include: {
          rawMaterial: true,
          fromWarehouse: true,
          toWarehouse: true,
        }
      });
      const total = cleaningJobs.reduce((sum, job) => sum + (job.quantity || 0), 0);
      res.json({ 
        stockUnderCleaning: total,
        details: cleaningJobs
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stock under cleaning', details: error });
    }
  }

  // 🛠️ In Processing - Return all processing jobs in progress
  static async getStockInProcessing(req: Request, res: Response) {
    try {
      const processingJobs = await prisma.processingJob.findMany({
        where: {
          status: { in: ['In-Progress'] },
        },
        include: {
          inputRawMaterial: true,
          byProducts: true,
          finishedGoods: true,
        }
      });
      const total = processingJobs.reduce((sum, job) => sum + (job.quantityInput || 0), 0);
      res.json({ 
        stockInProcessing: total,
        details: processingJobs
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stock in processing', details: error });
    }
  }

  // ⚠️ Low Stock Alerts - Return all low stock SKUs with details
  static async getLowStockAlerts(req: Request, res: Response) {
    try {
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
          details: stocks.filter(s => s.rawMaterialId === p.id)
        }));
      res.json({ 
        lowStockAlerts: lowStock
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch low stock alerts', details: error });
    }
  }

  // ♻️ Unusable/Waste Stock - Return details for both cleaning and processing waste
  static async getWasteStock(req: Request, res: Response) {
    try {
      // After cleaning: unfinishedStock
      const unfinished = await prisma.unfinishedStock.findMany({
        include: {
          warehouse: true,
        }
      });
      // After processing: byProduct
      const byProduct = await prisma.byProduct.findMany({
        include: {
          warehouse: true,
          processingJob: true,
        }
      });
      res.json({
        wasteStock: {
          afterCleaning: {
            total: unfinished.reduce((sum, u) => sum + (u.quantity || 0), 0),
            details: unfinished
          },
          afterProcessing: {
            total: byProduct.reduce((sum, b) => sum + (b.quantity || 0), 0),
            details: byProduct
          },
          total: unfinished.reduce((sum, u) => sum + (u.quantity || 0), 0) +
                 byProduct.reduce((sum, b) => sum + (b.quantity || 0), 0)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch waste stock', details: error });
    }
  }
}