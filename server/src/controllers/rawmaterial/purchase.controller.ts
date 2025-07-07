import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class PurchaseOrderController {
  // Create a new purchase order with items
  static async createPurchaseOrder(req: Request, res: Response) {
    try {
      const { vendorId, orderDate, expectedDate, items } = req.body;
      // items: [{ rawMaterialId, quantityOrdered, rate }]
      const poNumber = `PO-${Date.now()}`;
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          vendorId,
          orderDate: new Date(orderDate),
          expectedDate: new Date(expectedDate),
          status: 'Created',
          items: {
            create: items.map((item: any) => ({
              rawMaterialId: item.rawMaterialId,
              quantityOrdered: item.quantityOrdered,
              rate: item.rate,
              status: 'Pending',
            })),
          },
        },
        include: { items: true },
      });
        await prisma.transactionLog.create({
        data: {
          type: 'CREATE',
          entity: 'PurchaseOrder',
          entityId: purchaseOrder.id,
          userId: req.user?.id || 'system',
          description: `Created purchase order: ${poNumber}\nDetails: ${JSON.stringify(purchaseOrder, null, 2)}`,
        },
      });
      res.status(201).json(purchaseOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create purchase order', details: error });
    }
  }

  // Get all purchase orders (with optional filter by vendor or status)
  static async getPurchaseOrders(req: Request, res: Response) {
    try {
      const { vendorId, status } = req.query;
      const where: any = {};
      if (vendorId) where.vendorId = vendorId;
      if (status) where.status = status;
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        include: { vendor: true, items: true },
      });
      res.json(purchaseOrders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchase orders', details: error });
    }
  }

  // Get a single purchase order by ID
  static async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { vendor: true, items: true },
      });
      if (!purchaseOrder) {
        res.status(404).json({ error: 'Purchase order not found' });
      }
      res.json(purchaseOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchase order', details: error });
    }
  }

  // Update purchase order status or details
  static async updatePurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, expectedDate } = req.body;
      const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status,
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        },
      });
       await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'PurchaseOrder',
          entityId: purchaseOrder.id,
          userId: req.user?.id || 'system',
          description: `Updated purchase order: ${purchaseOrder.poNumber}\nDetails: ${JSON.stringify(purchaseOrder, null, 2)}`,
        },
      });
      res.json(purchaseOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update purchase order', details: error });
    }
  }

  // Update purchase order item (e.g., mark as received)
  static async updatePurchaseOrderItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { quantityReceived, status, warehouseId } = req.body;

      // 1. Update the PO item
      const item = await prisma.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          quantityReceived,
          status,
        },
        include: { rawMaterial: true, purchaseOrder: true },
      });

      // 2. Only update stock if item is marked as 'Received'
      if (status === 'Received' && quantityReceived > 0 && warehouseId) {
        // Find if a CurrentStock record exists
        const currentStock = await prisma.currentStock.findUnique({
          where: {
            rawMaterialId_warehouseId: {
              rawMaterialId: item.rawMaterialId,
              warehouseId: warehouseId,
            },
          },
        });

        if (currentStock) {
          // Update existing stock
          await prisma.currentStock.update({
            where: {
              rawMaterialId_warehouseId: {
                rawMaterialId: item.rawMaterialId,
                warehouseId: warehouseId,
              },
            },
            data: {
              currentQuantity: { increment: quantityReceived },
            },
          });
        } else {
          // Create new stock record
          await prisma.currentStock.create({
            data: {
              rawMaterialId: item.rawMaterialId,
              warehouseId: warehouseId,
              currentQuantity: quantityReceived,
            },
          });
        }

        // Optionally, create a StockEntry record for traceability
        await prisma.stockEntry.create({
          data: {
            rawMaterialId: item.rawMaterialId,
            warehouseId: warehouseId,
            quantity: quantityReceived,
            entryType: 'IN',
            referenceId: itemId,
            status: 'Received',
          },
        });
      }

       await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'PurchaseOrderItem',
          entityId: item.id,
          userId: req.user?.id || 'system',
          description: `Updated purchase order item for PO: ${item.purchaseOrder.poNumber}\nItem Details: ${JSON.stringify(item, null, 2)}`,
        },
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update purchase order item', details: error });
    }
  }

  // Get all current stock items (renamed logic, same endpoint name)
  static async getAllPurchaseOrderItems(req: Request, res: Response) {
    try {
      // Fetch all current stock entries, join with material and warehouse
      const stocks = await prisma.currentStock.findMany({
        include: {
          rawMaterial: true,
          warehouse: true,
        },
        orderBy: { lastUpdated: 'desc' },
      });

      // Format response for frontend
      const result = stocks.map(stock => ({
        rawMaterialId: stock.rawMaterialId,
        materialName: stock.rawMaterial.name,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        currentQuantity: stock.currentQuantity,
        lastUpdated: stock.lastUpdated,
         unitOfMeasurement: stock.rawMaterial.unitOfMeasurement,
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current stock', details: error });
    }
  }
}