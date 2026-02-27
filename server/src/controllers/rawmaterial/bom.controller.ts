import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

export class BOMController {
    // Create a new Bill of Material with items
    static async createBOM(req: Request, res: Response) {
        try {
            const {
                bomCode,
                productName,
                productCode,
                unitOfMeasurement,
                outputQuantity,
                description,
                status,
                items, // Array of { rawMaterialId, quantity, unitOfMeasurement, notes }
            } = req.body;

            if (!bomCode || !productName || !unitOfMeasurement) {
                res.status(400).json({ error: 'bomCode, productName, and unitOfMeasurement are required' });
                return;
            }

            const bom = await prisma.billOfMaterial.create({
                data: {
                    bomCode,
                    productName,
                    productCode: productCode || null,
                    unitOfMeasurement,
                    outputQuantity: outputQuantity ? Number(outputQuantity) : 1,
                    description: description || null,
                    status: status || 'DRAFT',
                    items: {
                        create: (items || []).map((item: any) => ({
                            rawMaterialId: item.rawMaterialId,
                            quantity: Number(item.quantity),
                            unitOfMeasurement: item.unitOfMeasurement,
                            notes: item.notes || null,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            rawMaterial: true,
                        },
                    },
                },
            });

            await prisma.transactionLog.create({
                data: {
                    type: 'CREATE',
                    entity: 'BillOfMaterial',
                    entityId: bom.id,
                    userId: req.user?.id || 'system',
                    description: `Created BOM: ${bom.productName} (${bom.bomCode})`,
                },
            });

            res.status(201).json(bom);
        } catch (error: any) {
            console.error('Create BOM Error:', error);
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'A BOM with this code already exists' });
                return;
            }
            res.status(500).json({ error: 'Failed to create BOM', details: error.message });
        }
    }

    // Get all BOMs
    static async getBOMs(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const where: any = {};
            if (status) where.status = status;

            const boms = await prisma.billOfMaterial.findMany({
                where,
                include: {
                    items: {
                        include: {
                            rawMaterial: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json(boms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch BOMs', details: error });
        }
    }

    // Get a single BOM by ID
    static async getBOMById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const bom = await prisma.billOfMaterial.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            rawMaterial: true,
                        },
                    },
                },
            });
            if (!bom) {
                res.status(404).json({ error: 'BOM not found' });
                return;
            }
            res.json(bom);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch BOM', details: error });
        }
    }

    // Update a BOM and its items
    static async updateBOM(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                bomCode,
                productName,
                productCode,
                unitOfMeasurement,
                outputQuantity,
                description,
                status,
                items,
            } = req.body;

            // Delete existing items and recreate (simpler than complex upsert)
            await prisma.bOMItem.deleteMany({ where: { bomId: id } });

            const bom = await prisma.billOfMaterial.update({
                where: { id },
                data: {
                    bomCode,
                    productName,
                    productCode: productCode || null,
                    unitOfMeasurement,
                    outputQuantity: outputQuantity ? Number(outputQuantity) : 1,
                    description: description || null,
                    status: status || 'DRAFT',
                    items: {
                        create: (items || []).map((item: any) => ({
                            rawMaterialId: item.rawMaterialId,
                            quantity: Number(item.quantity),
                            unitOfMeasurement: item.unitOfMeasurement,
                            notes: item.notes || null,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            rawMaterial: true,
                        },
                    },
                },
            });

            await prisma.transactionLog.create({
                data: {
                    type: 'UPDATE',
                    entity: 'BillOfMaterial',
                    entityId: bom.id,
                    userId: req.user?.id || 'system',
                    description: `Updated BOM: ${bom.productName} (${bom.bomCode})`,
                },
            });

            res.json(bom);
        } catch (error: any) {
            console.error('Update BOM Error:', error);
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'A BOM with this code already exists' });
                return;
            }
            res.status(500).json({ error: 'Failed to update BOM', details: error.message });
        }
    }

    // Delete a BOM (cascade deletes items)
    static async deleteBOM(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deletedBOM = await prisma.billOfMaterial.delete({ where: { id } });

            await prisma.transactionLog.create({
                data: {
                    type: 'DELETE',
                    entity: 'BillOfMaterial',
                    entityId: deletedBOM.id,
                    userId: req.user?.id || 'system',
                    description: `Deleted BOM: ${deletedBOM.productName} (${deletedBOM.bomCode})`,
                },
            });

            res.json({ message: 'BOM deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete BOM', details: error });
        }
    }
}
