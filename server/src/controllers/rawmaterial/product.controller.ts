import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class RawMaterialProductController {
  // Create a new raw material product
  static async createRawMaterialProduct(req: Request, res: Response) {
    try {
      const {
        skuCode,
        name,
        category,
        subcategory,
        variety,
        unitOfMeasurement,
        minReorderLevel,
        vendorId,
      } = req.body;

      const product = await prisma.rawMaterialProduct.create({
        data: {
          skuCode,
          name,
          category,
          subcategory: subcategory || null,
          variety: variety || null,
          unitOfMeasurement,
          minReorderLevel,
          vendorId: vendorId || null,
        },
      });

      await prisma.transactionLog.create({
        data: {
          type: 'CREATE',
          entity: 'RawMaterialProduct',
          entityId: product.id,
          userId: req.user?.id || 'system',
          description: `Created raw material product: ${product.name} (${product.skuCode})`,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create raw material product', details: error });
    }
  }

  // Get all raw material products (with optional filter by category or vendor)
  static async getRawMaterialProducts(req: Request, res: Response) {
    try {
      const { category, vendorId } = req.query;
      const where: any = {};
      if (category) where.category = category;
      if (vendorId) where.vendorId = vendorId;

      const products = await prisma.rawMaterialProduct.findMany({ where });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch raw material products', details: error });
    }
  }

  // Get a single raw material product by ID
  static async getRawMaterialProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await prisma.rawMaterialProduct.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ error: 'Raw material product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch raw material product', details: error });
    }
  }

  // Update raw material product details
  static async updateRawMaterialProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        skuCode,
        name,
        category,
        subcategory,
        variety,
        unitOfMeasurement,
        minReorderLevel,
        vendorId,
      } = req.body;

      const product = await prisma.rawMaterialProduct.update({
        where: { id },
        data: {
          skuCode,
          name,
          category,
          subcategory: subcategory || null,
          variety: variety || null,
          unitOfMeasurement,
          minReorderLevel,
          vendorId: vendorId || null,
        },
      });

      await prisma.transactionLog.create({
        data: {
          type: 'UPDATE',
          entity: 'RawMaterialProduct',
          entityId: product.id,
          userId: req.user?.id || 'system',
          description: `Updated raw material product: ${product.name} (${product.skuCode})`,
        },
      });

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update raw material product', details: error });
    }
  }

  // Delete a raw material product
  static async deleteRawMaterialProduct(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Pre-check FK references and report a clear blocking message instead of a raw P2003.
      const [bomItemCount, bomAsOutputCount, poItemCount, stockEntryCount, currentStockCount] = await Promise.all([
        prisma.bOMItem.count({ where: { rawMaterialId: id } }),
        prisma.billOfMaterial.count({ where: { sfgProductId: id } }),
        prisma.purchaseOrderItem.count({ where: { rawMaterialId: id } }),
        prisma.stockEntry.count({ where: { rawMaterialId: id } }),
        prisma.currentStock.count({ where: { rawMaterialId: id } }),
      ]);

      const blockers: string[] = [];
      if (bomItemCount > 0) blockers.push(`${bomItemCount} BOM item${bomItemCount > 1 ? 's' : ''}`);
      if (bomAsOutputCount > 0) blockers.push(`${bomAsOutputCount} BOM${bomAsOutputCount > 1 ? 's' : ''} as output product`);
      if (poItemCount > 0) blockers.push(`${poItemCount} purchase order line${poItemCount > 1 ? 's' : ''}`);
      if (stockEntryCount > 0) blockers.push(`${stockEntryCount} stock entr${stockEntryCount > 1 ? 'ies' : 'y'}`);
      if (currentStockCount > 0) blockers.push(`${currentStockCount} current-stock row${currentStockCount > 1 ? 's' : ''}`);

      if (blockers.length > 0) {
        res.status(409).json({
          error: `Cannot delete: this material is referenced by ${blockers.join(', ')}. Remove or detach those records first.`,
        });
        return;
      }

      const deletedProduct = await prisma.rawMaterialProduct.delete({ where: { id } });

      await prisma.transactionLog.create({
        data: {
          type: 'DELETE',
          entity: 'RawMaterialProduct',
          entityId: deletedProduct.id,
          userId: req.user?.id || 'system',
          description: `Deleted raw material product: ${deletedProduct.name} (${deletedProduct.skuCode})`,
        },
      });

      res.json({ message: 'Raw material product deleted successfully' });
    } catch (error: any) {
      // Fallback for any FK constraint we didn't pre-check
      if (error?.code === 'P2003') {
        res.status(409).json({
          error: 'Cannot delete: this material is still referenced by other records.',
        });
        return;
      }
      console.error('Delete raw material error:', error);
      res.status(500).json({ error: 'Failed to delete raw material product', details: error?.message || 'Unknown error' });
    }
  }
}