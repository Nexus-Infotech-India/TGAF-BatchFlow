import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export class CleaningGrnController {
    /**
     * Get all GRNs with their materials for cleaning
     * Returns GRN details along with received quantity & how much has been transferred to cleaning
     */
    static async getGRNsForCleaning(req: Request, res: Response): Promise<void> {
        try {
            const grns = await prisma.gRNbyPo.findMany({
                where: {
                    purchaseOrderItem: {
                        rawMaterial: {
                            subcategory: 'Spice',
                        },
                    },
                },
                include: {
                    purchaseOrder: { include: { vendor: true } },
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: { bags: true, warehouse: true },
                            },
                        },
                    },
                    qualityReport: { include: { parameters: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    cleaningJobs: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            cleaningLots: true,
                        },
                    },
                    cleaningLots: {
                        include: {
                            warehouse: true,
                            cleaningJob: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Calculate transfer details for each GRN
            const result = grns.map((grn) => {
                const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
                const totalTransferred = grn.cleaningJobs.reduce(
                    (sum, job) => sum + job.quantity,
                    0
                );
                const leftQuantity = Math.max(totalReceived - totalTransferred, 0);

                // Check if all cleaning jobs for this GRN are finished
                const allJobsFinished =
                    grn.cleaningJobs.length > 0 &&
                    grn.cleaningJobs.every((job) => job.status === 'Cleaned' || job.status === 'Finished');

                return {
                    ...grn,
                    totalReceived,
                    totalTransferred,
                    leftQuantity,
                    allJobsFinished,
                };
            });

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Error fetching GRNs for cleaning:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch GRNs for cleaning' });
        }
    }

    /**
     * Get materials for a specific GRN by GRN number (or id)
     */
    static async getGRNMaterialsByGrnNumber(req: Request, res: Response): Promise<void> {
        try {
            const { grnNumber } = req.params;

            const grn = await prisma.gRNbyPo.findFirst({
                where: {
                    OR: [{ grnNumber }, { id: grnNumber }],
                },
                include: {
                    purchaseOrder: { include: { vendor: true } },
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: {
                                include: { bags: true, warehouse: true },
                            },
                        },
                    },
                    qualityReport: { include: { parameters: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    cleaningJobs: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            rawMaterial: true,
                            cleaningLots: {
                                include: { warehouse: true },
                            },
                        },
                    },
                    cleaningLots: {
                        include: {
                            warehouse: true,
                            cleaningJob: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!grn) {
                res.status(404).json({ success: false, error: 'GRN not found' });
                return;
            }

            const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
            const totalTransferred = grn.cleaningJobs.reduce(
                (sum, job) => sum + job.quantity,
                0
            );
            const leftQuantity = Math.max(totalReceived - totalTransferred, 0);

            const allJobsFinished =
                grn.cleaningJobs.length > 0 &&
                grn.cleaningJobs.every((job) => job.status === 'Cleaned' || job.status === 'Finished');

            res.json({
                success: true,
                data: {
                    ...grn,
                    totalReceived,
                    totalTransferred,
                    leftQuantity,
                    allJobsFinished,
                },
            });
        } catch (error) {
            console.error('Error fetching GRN materials:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch GRN materials' });
        }
    }

    /**
     * Create a GRN-wise cleaning transfer with lot number generation
     * Takes: grnId, warehouseId (destination), quantity
     * Generates a lot number, creates cleaning job + cleaning lot
     */
    static async createGRNCleaningTransfer(req: Request, res: Response): Promise<void> {
        try {
            const { grnId, toWarehouseId, quantity } = req.body;

            if (!grnId || !toWarehouseId || !quantity || quantity <= 0) {
                res.status(400).json({ error: 'grnId, toWarehouseId, and a positive quantity are required' });
                return;
            }

            // Fetch GRN with item details
            const grn = await prisma.gRNbyPo.findUnique({
                where: { id: grnId },
                include: {
                    purchaseOrderItem: {
                        include: {
                            rawMaterial: true,
                            receivals: { include: { warehouse: true } },
                        },
                    },
                    cleaningJobs: true,
                },
            });

            if (!grn) {
                res.status(404).json({ error: 'GRN not found' });
                return;
            }

            const rawMaterialId = grn.purchaseOrderItem.rawMaterialId;
            const totalReceived = grn.purchaseOrderItem.totalReceived || 0;
            const totalTransferred = grn.cleaningJobs.reduce(
                (sum, job) => sum + job.quantity,
                0
            );
            const leftQuantity = totalReceived - totalTransferred;

            if (quantity > leftQuantity) {
                res.status(400).json({
                    error: `Transfer quantity (${quantity}) exceeds available quantity (${leftQuantity})`,
                });
                return;
            }

            // Determine fromWarehouseId (the warehouse where the material was received)
            const latestReceival = grn.purchaseOrderItem.receivals[0];
            if (!latestReceival) {
                res.status(400).json({ error: 'No receival entry found for this GRN' });
                return;
            }
            const fromWarehouseId = latestReceival.warehouseId;

            // Generate cleaning job ID
            const lastJob = await prisma.cleaningJob.findFirst({
                orderBy: { id: 'desc' },
                where: { id: { startsWith: 'CJ' } },
            });
            let nextJobNumber = 1;
            if (lastJob && /^CJ\d+$/.test(lastJob.id)) {
                nextJobNumber = parseInt(lastJob.id.replace('CJ', ''), 10) + 1;
            }
            const newJobId = `CJ${String(nextJobNumber).padStart(5, '0')}`;

            // Generate lot number: LOT-GRNXXXX-YYYYMMDD-XXXX
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const grnSuffix = grn.grnNumber.replace(/[^A-Z0-9]/gi, '').slice(-6);
            const lotPrefix = `LOT-${grnSuffix}-${dateStr}-`;

            const lastLot = await prisma.cleaningLot.findFirst({
                where: { lotNumber: { startsWith: lotPrefix } },
                orderBy: { lotNumber: 'desc' },
            });
            let lotSeq = 1;
            if (lastLot) {
                const lastSeq = parseInt(lastLot.lotNumber.replace(lotPrefix, ''), 10);
                if (!isNaN(lastSeq)) lotSeq = lastSeq + 1;
            }
            const lotNumber = `${lotPrefix}${String(lotSeq).padStart(4, '0')}`;

            // Transaction: create cleaning job, cleaning lot, update stock
            const result = await prisma.$transaction(async (tx) => {
                // Create cleaning job
                const cleaningJob = await tx.cleaningJob.create({
                    data: {
                        id: newJobId,
                        rawMaterialId,
                        fromWarehouseId,
                        toWarehouseId,
                        quantity,
                        status: 'Sent',
                        startedAt: new Date(),
                        grnId,
                    },
                });

                // Create cleaning lot
                const cleaningLot = await tx.cleaningLot.create({
                    data: {
                        lotNumber,
                        cleaningJobId: cleaningJob.id,
                        grnId,
                        rawMaterialId,
                        warehouseId: toWarehouseId,
                        quantity,
                        status: 'Active',
                    },
                });

                // Decrement current stock from source warehouse
                await tx.currentStock.update({
                    where: {
                        rawMaterialId_warehouseId: {
                            rawMaterialId,
                            warehouseId: fromWarehouseId,
                        },
                    },
                    data: {
                        currentQuantity: { decrement: quantity },
                    },
                });

                // Create transaction log
                if (req.user?.id) {
                    await tx.transactionLog.create({
                        data: {
                            type: 'CLEANING_TRANSFER',
                            entity: 'CleaningJob',
                            entityId: cleaningJob.id,
                            userId: req.user.id,
                            description: `GRN-wise cleaning transfer: ${quantity} from warehouse to cleaning. GRN: ${grn.grnNumber}, Lot: ${lotNumber}`,
                        },
                    });
                }

                return { cleaningJob, cleaningLot };
            }, { timeout: 30000 });

            // Fetch the full result with relations
            const fullResult = await prisma.cleaningLot.findUnique({
                where: { id: result.cleaningLot.id },
                include: {
                    cleaningJob: {
                        include: { fromWarehouse: true, toWarehouse: true, rawMaterial: true },
                    },
                    grn: true,
                    warehouse: true,
                },
            });

            res.status(201).json({
                success: true,
                data: fullResult,
                message: `Cleaning transfer created. Lot Number: ${lotNumber}`,
            });
        } catch (error) {
            console.error('Error creating GRN cleaning transfer:', error);
            res.status(500).json({ success: false, error: 'Failed to create cleaning transfer' });
        }
    }

    /**
     * Finish cleaning for a specific cleaning job (under a GRN)
     */
    static async finishCleaning(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { stoneWastageQty, stoneWastageUnit, seedWastageQty, seedWastageUnit } = req.body;

            const cleaningJob = await prisma.cleaningJob.findUnique({
                where: { id },
                include: { cleaningLots: true },
            });

            if (!cleaningJob) {
                res.status(404).json({ error: 'Cleaning job not found' });
                return;
            }

            const parsedStoneWastageQty = stoneWastageQty ? parseFloat(stoneWastageQty) : 0;
            const parsedStoneWastageUnit = stoneWastageUnit || 'kg';
            const parsedSeedWastageQty = seedWastageQty ? parseFloat(seedWastageQty) : 0;
            const parsedSeedWastageUnit = seedWastageUnit || 'kg';

            await prisma.$transaction(async (tx) => {
                // Update cleaning job status + persist stone & seed wastage fields
                await tx.cleaningJob.update({
                    where: { id },
                    data: {
                        status: 'Cleaned',
                        finishedAt: new Date(),
                        stoneWastageQty: parsedStoneWastageQty,
                        stoneWastageUnit: parsedStoneWastageUnit,
                        seedWastageQty: parsedSeedWastageQty,
                        seedWastageUnit: parsedSeedWastageUnit,
                    },
                });

                // Update lot status + persist wastage on each lot (lot-wise tracking)
                for (const lot of cleaningJob.cleaningLots) {
                    await tx.cleaningLot.update({
                        where: { id: lot.id },
                        data: {
                            status: 'Cleaned',
                            stoneWastageQty: parsedStoneWastageQty,
                            stoneWastageUnit: parsedStoneWastageUnit,
                            seedWastageQty: parsedSeedWastageQty,
                            seedWastageUnit: parsedSeedWastageUnit,
                        },
                    });
                }

                // Create transaction log
                if (req.user?.id) {
                    await tx.transactionLog.create({
                        data: {
                            type: 'CLEANING_FINISHED',
                            entity: 'CleaningJob',
                            entityId: cleaningJob.id,
                            userId: req.user.id,
                            description: `Cleaning finished for job ${cleaningJob.id}. Stone Wastage: ${parsedStoneWastageQty} ${parsedStoneWastageUnit}, Seed Wastage: ${parsedSeedWastageQty} ${parsedSeedWastageUnit}`,
                        },
                    });
                }
            }, { timeout: 30000 });

            // Fetch updated job
            const updatedJob = await prisma.cleaningJob.findUnique({
                where: { id },
                include: {
                    rawMaterial: true,
                    fromWarehouse: true,
                    toWarehouse: true,
                    cleaningLots: { include: { warehouse: true } },
                },
            });

            res.json({ success: true, data: updatedJob, message: 'Cleaning finished successfully' });
        } catch (error) {
            console.error('Error finishing cleaning:', error);
            res.status(500).json({ success: false, error: 'Failed to finish cleaning' });
        }
    }



    /**
     * Get all cleaning lots (optionally filter by grnId)
     */
    static async getCleaningLots(req: Request, res: Response): Promise<void> {
        try {
            const { grnId } = req.query;
            const where: any = {};
            if (grnId) where.grnId = grnId;

            const lots = await prisma.cleaningLot.findMany({
                where,
                include: {
                    cleaningJob: {
                        include: {
                            fromWarehouse: true,
                            toWarehouse: true,
                            rawMaterial: true,
                        },
                    },
                    grn: true,
                    warehouse: true,
                    rawMaterial: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: lots });
        } catch (error) {
            console.error('Error fetching cleaning lots:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch cleaning lots' });
        }
    }
}
